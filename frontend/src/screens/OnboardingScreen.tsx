import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import MindMentorLogo from '../../assets/MindMentorLogo.svg';
import { CheckCircle, Monitor, Lightbulb, BriefcaseMedical, ClipboardList, Bot } from 'lucide-react-native';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const STEPS = [
  {
    title: "Understand your mind.",
    description: "MindMentor is a quiet space to record how you feel. There are no streaks to keep, no levels to gain, and no judgment. Just simple insights to help you find balance.",
  },
  {
    title: "A simple daily rhythm",
    description: "Small habits build resilience. Here is how MindMentor helps you find clarity.",
    items: [
      {
        icon: CheckCircle,
        title: "Check In",
        description: "Log your mood in seconds. No journaling required, just a moment of pause."
      },
      {
        icon: Monitor,
        title: "See Patterns",
        description: "Over time, clarity emerges from the noise. Understand your triggers and peaks."
      },
      {
        icon: Lightbulb,
        title: "Find Balance",
        description: "We suggest small, actionable steps based on your emotional data."
      }
    ]
  },
  {
    title: "Clear Boundaries",
    description: "To ensure a safe space for genuine self-reflection, it helps to know what this tool isn't.",
    items: [
      {
        icon: BriefcaseMedical,
        title: "Not Therapy",
        description: "This tool does not replace professional mental health support or crisis intervention."
      },
      {
        icon: ClipboardList,
        title: "Not a Diagnosis",
        description: "We do not assess medical conditions, disorders, or provide clinical labels."
      },
      {
        icon: Bot,
        title: "Not a Chatbot",
        description: "No AI will try to \"fix\" your mood. This space is purely yours to explore."
      }
    ]
  },
  {
    title: "Personalize your space",
    description: "MindMentor adapts to your schedule. You can always change this later."
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [checkInEnabled, setCheckInEnabled] = useState(true);
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

  const currentStepData = STEPS[currentStep];

  const swipeGesture = Gesture.Simultaneous(
    Gesture.Fling().direction(Directions.LEFT).onEnd(() => runOnJS(handleNext)()),
    Gesture.Fling().direction(Directions.RIGHT).onEnd(() => runOnJS(handleBack)())
  );

  return (
    <GestureDetector gesture={swipeGesture}>
      <SafeAreaView className="flex-1 bg-slate-900 p-5">
        <View className="flex-1">
          {currentStep === 0 ? (
            <View className="flex-1 justify-center items-center px-6">
              <View className="mb-10">
                <MindMentorLogo width={200} height={200} />
              </View>
              <Text className="text-3xl font-bold mb-4 text-center text-white">
                {currentStepData.title}
              </Text>
              <Text className="text-base leading-6 text-center text-slate-400">
                {currentStepData.description}
              </Text>
            </View>
          ) : (
            //Header  
            <View className="flex-1 px-6 pt-2 ">
              <View className="mb-8">
                <View className="flex-row items-center justify-center mb-4 relative min-h-[44px]">
                  <View>
                    <Text className="text-2xl font-bold text-white text-center mx-12">
                      {currentStepData.title}
                    </Text>
                    <Text className="text-base leading-6 text-center text-slate-400">
                      {currentStepData.description}
                    </Text>
                  </View>
                </View>
              </View>
              {/*Body*/}
              <View className="flex-1 items-center justify-start w-full  ">
                {currentStep === 1 && currentStepData.items && (
                  <View className="w-full ">
                    {currentStepData.items.map((item, index) => (
                      <View key={index} className="flex-row mb-20 relative  ">
                        {index !== currentStepData.items.length - 1 && (
                          <View
                            className="absolute left-[20px]  w-[1px] bg-slate-700"
                            style={{ bottom: -80, top: 35 }}
                          />
                        )}

                        <View className="mr-4 items-center">
                          <View className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
                            <item.icon size={20} color="#3B82F6" />
                          </View>
                        </View>
                        <View className="flex-1 pt-1">
                          <Text className="text-white text-lg font-semibold mb-1">{item.title}</Text>
                          <Text className="text-slate-400 text-sm leading-5">{item.description}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {currentStep === 2 && currentStepData.items && (
                  <View className="w-full ">
                    {currentStepData.items.map((item, index) => (
                      <View key={index} className="flex-row items-center bg-slate-800  p-4  rounded-xl mb-10 border border-slate-700">
                        <View className="mr-4 items-center justify-center">
                          <View className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center">
                            <item.icon size={24} color="#3B82F6" />
                          </View>
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-lg font-bold mb-1">{item.title}</Text>
                          <Text className="text-slate-400 text-sm leading-5">{item.description}</Text>
                        </View>
                      </View>
                    ))}


                  </View>
                )}

                {currentStep === 3 && (
                  <View className="w-full">
                    <Text className="text-slate-400 font-semibold mb-4 text-sm">Gentle Reminder</Text>
                    <View className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden ">
                      <View className="p-5 flex-row justify-between items-center">
                        <View>
                          <Text className="text-white text-base font-bold ">Daily Check-in</Text>
                          <Text className="text-slate-400 text-xs">Build a consistent habit</Text>
                        </View>
                        <Switch
                          trackColor={{ false: "#334155", true: "#3B82F6" }}
                          thumbColor={checkInEnabled ? "#ffffff" : "#f4f3f4"}
                          ios_backgroundColor="#334155"
                          onValueChange={setCheckInEnabled}
                          value={checkInEnabled}
                        />
                      </View>
                      {checkInEnabled && (
                        <View className="p-5 flex-row justify-between items-center bg-slate-800/50 " style={{ borderTopWidth: 1, borderTopColor: "rgba(51, 65, 85, 0.5)" }}>
                          <Text className="text-slate-300 text-base">Time</Text>
                          <View className="bg-slate-700/50 px-3 py-1 rounded-md">
                            <Text className="text-white font-semibold text-lg hover:text-blue-400">08:00 <Text className="text-sm text-slate-400">AM</Text></Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
        {/* Footer */}
        <View className="w-full items-center px-5 pb-5 ">
          {currentStep === 2 && currentStepData.items && (
            <Text className="text-center text-white text-xs mb-8">
              By continuing, you agree to the Terms of Service.
            </Text>
          )}
          <View className="flex-row mb-5">
            {STEPS.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${index === currentStep ? 'bg-blue-500 w-6' : 'bg-slate-700 w-2'}`}
              />
            ))}
          </View>


          <TouchableOpacity
            onPress={handleNext}
            className="bg-blue-500 py-4 px-8 rounded-full items-center min-w-[140px] w-full"
            disabled={saving}
          >
            <Text className="text-white text-base font-bold tracking-widest uppercase">
              {currentStep === 0 ? "START" : (currentStep === STEPS.length - 1 ? (saving ? "Getting Started..." : "Get Started") : "NEXT")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureDetector>
  );
}
