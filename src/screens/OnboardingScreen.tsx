import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const STEPS = [
  {
    title: "What is MindMentor?",
    description: "MindMentor is your daily companion for mental wellness. It helps you track your mood, journal your thoughts, and provides personalized recommendations to improve your day."
  },
  {
    title: "How it works",
    description: "Simply check in daily. Tell us how you feel, write a journal entry, and receive AI-powered insights and actionable advice tailored just for you."
  },
  {
    title: "What it does NOT do",
    description: "MindMentor is NOT a replacement for professional therapy. We do not diagnose medical conditions. If you are in crisis, please seek professional help immediately."
  },
  {
    title: "Your Preferences",
    description: "Let's personalize your experience. Set a time for your daily check-in reminder."
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  
  const queryClient = useQueryClient();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const preferences = {
        reminderTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        // Backend handles hasCompletedOnboarding: true automatically
      };
      
      const updatedUser = await api.request('POST', '/users/preferences', preferences);
      
      // Update React Query cache with the returned UserDTO
      queryClient.setQueryData(['user'], updatedUser);
      
      // Navigation should be handled by RootNavigator reacting to user state change,
      // but we can also manually reset if needed. RootNavigator check is safer.
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          {STEPS.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                index === currentStep ? styles.activeDot : null,
                index < currentStep ? styles.completedDot : null
              ]} 
            />
          ))}
        </View>

        <Text style={styles.title}>{STEPS[currentStep].title}</Text>
        <Text style={styles.description}>{STEPS[currentStep].description}</Text>

        {currentStep === 3 && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Daily Reminder Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {currentStep > 0 ? (
           <TouchableOpacity onPress={handleBack} style={styles.buttonSecondary} disabled={saving}>
             <Text style={styles.buttonTextSecondary}>Back</Text>
           </TouchableOpacity>
        ) : <View style={{width: 20}} />} 

        <TouchableOpacity 
          onPress={handleNext} 
          style={styles.buttonPrimary}
          disabled={saving}
        >
          <Text style={styles.buttonTextPrimary}>{currentStep === 3 ? (saving ? "Getting Started..." : "Get Started") : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  progressContainer: { flexDirection: 'row', marginBottom: 40 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#4A90E2', width: 20 },
  completedDot: { backgroundColor: '#4A90E2' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#666' },
  formContainer: { width: '100%', marginTop: 30 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, fontSize: 16, backgroundColor: '#FAFAFA' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  buttonPrimary: { backgroundColor: '#4A90E2', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, minWidth: 120, alignItems: 'center' },
  buttonSecondary: { paddingVertical: 15, paddingHorizontal: 20 },
  buttonTextPrimary: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonTextSecondary: { color: '#666', fontSize: 16, fontWeight: '600' },
});


