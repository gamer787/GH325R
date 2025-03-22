import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressStepsProps {
  currentStep: 'type' | 'upload' | 'select' | 'edit' | 'details';
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <View style={styles.container}>
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <View
            style={[
              styles.stepCircle,
              step === currentStep
                ? styles.activeCircle
                : i < currentIndex
                ? styles.completedCircle
                : styles.inactiveCircle
            ]}
          />
          {i < steps.length - 1 && (
            <View
              style={[
                styles.progressLine,
                i < currentIndex
                  ? styles.completedLine
                  : styles.inactiveLine
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeCircle: {
    backgroundColor: '#06B6D4',
  },
  completedCircle: {
    backgroundColor: 'rgba(6, 182, 212, 0.5)',
  },
  inactiveCircle: {
    backgroundColor: '#374151',
  },
  progressLine: {
    flex: 1,
    height: 2,
  },
  completedLine: {
    backgroundColor: 'rgba(6, 182, 212, 0.5)',
  },
  inactiveLine: {
    backgroundColor: '#374151',
  },
});

export default ProgressSteps;
