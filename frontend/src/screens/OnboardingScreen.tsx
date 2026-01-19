import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import MindMentorLogo from '../../assets/MindMentorLogo.svg';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const STEPS = [
  {
    title: "Understand your mind.",
    description: "MindMentor is a quiet space to record how you feel. There are no streaks to keep, no levels to gain, and no judgment. Just simple insights to help you find balance."
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
      };
      
      const updatedUser = await api.request('POST', '/users/preferences', preferences);
      
      queryClient.setQueryData(['user'], updatedUser);
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
             <MindMentorLogo width={200} height={200} />
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
              placeholderTextColor="#666"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          {STEPS.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                index === currentStep ? styles.activeDot : null,
              ]} 
            />
          ))}
        </View>

        {/* Only show Back button if not on the first step, or keep layout consistent */}
        {currentStep > 0 && (
           <TouchableOpacity onPress={handleBack} style={styles.buttonSecondary} disabled={saving}>
             <Text style={styles.buttonTextSecondary}>Back</Text>
           </TouchableOpacity>
        )} 

        <TouchableOpacity 
          onPress={handleNext} 
          style={[styles.buttonPrimary, currentStep === 0 && styles.buttonPrimaryFull]}
          disabled={saving}
        >
          <Text style={styles.buttonTextPrimary}>
            {currentStep === 0 ? "START" : (currentStep === STEPS.length - 1 ? (saving ? "Getting Started..." : "Get Started") : "Next")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logoContainer: { marginBottom: 40 },
  progressContainer: { flexDirection: 'row', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#3B82F6', width: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#FFFFFF' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#94A3B8' },
  formContainer: { width: '100%', marginTop: 30 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#CBD5E1' },
  input: { borderWidth: 1, borderColor: '#334155', padding: 15, borderRadius: 12, fontSize: 16, backgroundColor: '#1E293B', color: '#FFF' },
  footer: { width: '100%', alignItems: 'center', paddingBottom: 20 },
  buttonPrimary: { backgroundColor: '#3B82F6', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, minWidth: 140, alignItems: 'center' },
  buttonPrimaryFull: { width: '100%' }, 
  buttonSecondary: { position: 'absolute', top: 20, left: 0, padding: 15 }, // Adjusted top to not overlap with dots if they are top of footer
  buttonTextPrimary: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  buttonTextSecondary: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
});


