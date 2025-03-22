import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface PaymentModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  duration: number;
  radius: number;
  estimatedReach: number;
  price: number;
}

export function PaymentModal({
  onConfirm,
  onCancel,
  loading,
  error,
  success,
  duration,
  radius,
  estimatedReach,
  price,
}: PaymentModalProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Loading Spinner */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#06B6D4" />
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <AlertCircle size={24} color="#FACC15" />
            <Text style={styles.headerText}>Payment Gateway</Text>
          </View>

          {/* Campaign Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryHeader}>Campaign Summary:</Text>
            <View style={styles.infoBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Duration:</Text>
                <Text style={styles.value}>{duration} hours</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Radius:</Text>
                <Text style={styles.value}>{radius} km</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Estimated Reach:</Text>
                <Text style={styles.value}>
                  {estimatedReach.toLocaleString()}+ users
                </Text>
              </View>
              <View style={[styles.row, styles.totalBox]}>
                <Text style={styles.label}>Total Price:</Text>
                <Text style={styles.price}>₹{price}</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={[styles.btn, styles.cancelBtn]}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[styles.btn, styles.payNowBtn]}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#000" size="small" />
                  <Text style={styles.btnText}>Processing...</Text>
                </>
              ) : (
                <Text style={styles.btnText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error / Success Messages */}
          {error && !success && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#FACC15',
  },
  summary: {
    marginBottom: 16,
  },
  summaryHeader: {
    color: '#D1D5DB',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#9CA3AF',
  },
  value: {
    color: '#FFFFFF',
  },
  totalBox: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
    marginTop: 8,
  },
  price: {
    color: '#06B6D4',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#374151',
  },
  payNowBtn: {
    backgroundColor: '#06B6D4',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#F87171',
  },
  successBox: {
    marginTop: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
  },
  successText: {
    color: '#34D399',
  },
});
