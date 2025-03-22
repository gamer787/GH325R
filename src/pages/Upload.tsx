import React, { useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ChevronLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TypeSelector } from '../components/upload/TypeSelector';
import { FileUploader } from '../components/upload/FileUploader';
import { PostDetails } from '../components/upload/PostDetails';
import { SaveDraftModal } from '../components/upload/SaveDraftModal';
import { useUploadState } from '../hooks/useUploadState';

type ContentType = 'vibe' | 'banger' | null;
type Step = 'select' | 'upload' | 'details';

// Define your navigation parameter list
type RootStackParamList = {
  Profile: undefined;
  // Add other routes if needed
};

export default function Upload(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<Step>('select');
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const { state, setState, autoSave } = useUploadState();

  const goToNextStep = () => {
    if (step === 'select' && selectedType) {
      setStep('upload');
    } else if (step === 'upload' && state.files.length > 0) {
      setStep('details');
    }
  };

  const goToPreviousStep = () => {
    if (step === 'details') {
      setStep('upload');
    } else if (step === 'upload') {
      setStep('select');
    } else {
      navigation.goBack();
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (state.files.length === 0)
        throw new Error('Please select files to share');

      // Upload files to storage
      const uploadedUrls = await Promise.all(
        state.files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Math.random()}.${fileExt}`;
          const bucketId = selectedType === 'vibe' ? 'vibes' : 'bangers';

          const { error: uploadError, data } = await supabase.storage
            .from(bucketId)
            .upload(fileName, file);
          if (uploadError) throw uploadError;
          if (!data?.path)
            throw new Error('Upload failed – no path returned');

          const { data: { publicUrl } } = supabase.storage
            .from(bucketId)
            .getPublicUrl(data.path);
          return publicUrl;
        })
      );

      // Create post record
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: selectedType,
          content_url: uploadedUrls[0],
          additional_urls: uploadedUrls.slice(1),
          caption: state.caption.trim(),
          hashtags: state.hashtags,
          mentions: state.mentions,
          location: state.location,
          hide_counts: state.hideCounts,
          scheduled_time: state.scheduledTime?.toISOString(),
        });
      if (postError) throw postError;

      // Clean up draft if it exists
      if (state.autoSaveId) {
        await supabase
          .from('content_drafts')
          .delete()
          .eq('id', state.autoSaveId);
      }

      navigation.navigate('Profile');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to share content'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 'select') {
      return (
        <TypeSelector
          selectedType={selectedType}
          onTypeSelect={(type: ContentType) => {
            setSelectedType(type);
            setStep('upload');
          }}
        />
      );
    }
    if (step === 'upload' && selectedType) {
      return (
        <FileUploader
          selectedType={selectedType}
          files={state.files}
          previews={state.previews}
          onFilesSelected={(newFiles) => {
            setState((prev) => ({
              ...prev,
              files: [...prev.files, ...newFiles],
              previews: [
                ...prev.previews,
                ...newFiles.map((file) => URL.createObjectURL(file)),
              ],
            }));
          }}
          onFileRemove={(index) => {
            setState((prev) => ({
              ...prev,
              files: prev.files.filter((_, i) => i !== index),
              previews: prev.previews.filter((_, i) => i !== index),
            }));
          }}
          onFilesReorder={(from, to) => {
            setState((prev) => {
              const newFiles = [...prev.files];
              const [movedFile] = newFiles.splice(from, 1);
              newFiles.splice(to, 0, movedFile);

              const newPreviews = [...prev.previews];
              const [movedPreview] = newPreviews.splice(from, 1);
              newPreviews.splice(to, 0, movedPreview);

              return {
                ...prev,
                files: newFiles,
                previews: newPreviews,
              };
            });
          }}
        />
      );
    }
    if (step === 'details') {
      return (
        <PostDetails
          caption={state.caption}
          location={state.location}
          hideCounts={state.hideCounts}
          scheduledTime={state.scheduledTime}
          onCaptionChange={(caption) =>
            setState((prev) => ({ ...prev, caption }))
          }
          onLocationChange={(location) =>
            setState((prev) => ({ ...prev, location }))
          }
          onHideCountsChange={(hideCounts) =>
            setState((prev) => ({ ...prev, hideCounts }))
          }
          onScheduleChange={(scheduledTime) =>
            setState((prev) => ({ ...prev, scheduledTime }))
          }
          onHashtagsChange={(hashtags) =>
            setState((prev) => ({ ...prev, hashtags }))
          }
          onMentionsChange={(mentions) =>
            setState((prev) => ({ ...prev, mentions }))
          }
        />
      );
    }
    return null;
  };

  // Determine if the Next button should be disabled based on the current step.
  const isNextDisabled = () => {
    if (step === 'select') return !selectedType;
    if (step === 'upload') return state.files.length === 0;
    return false;
  };

  return (
    <div className="pb-20 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousStep}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-2">
          {step !== 'select' && (
            <button
              onClick={() => setShowSavePrompt(true)}
              className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {renderStepContent()}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-400/10 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      {step !== 'select' && (
        <div className="fixed bottom-24 inset-x-0 px-4">
          <div className="flex space-x-4 max-w-lg mx-auto">
            <button
              onClick={goToPreviousStep}
              className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            {step === 'details' ? (
              <button
                onClick={handlePublish}
                disabled={loading || !state.files.length}
                className="flex-1 bg-cyan-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 'Share'}
              </button>
            ) : (
              <button
                onClick={goToNextStep}
                disabled={isNextDisabled()}
                className="flex-1 bg-cyan-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Draft Modal */}
      {showSavePrompt && (
        <SaveDraftModal
          visible={showSavePrompt}
          onSave={async () => {
            await autoSave();
            setShowSavePrompt(false);
            navigation.goBack();
          }}
          onDiscard={() => {
            setShowSavePrompt(false);
            navigation.goBack();
          }}
        />
      )}
    </div>
  );
}
