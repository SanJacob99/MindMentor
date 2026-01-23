import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, Dimensions } from 'react-native';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import MindMentorLogo from '../../assets/MindMentorLogo.svg';
import { CheckCircle, Monitor, Lightbulb, BriefcaseMedical, ClipboardList, Bot } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Pagination from '../components/Pagination'; // Import Pagination component

const { width } = Dimensions.get('window');

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

  // Initialize date to 8:00 AM today
  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [checkInEnabled, setCheckInEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  const queryClient = useQueryClient();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentStep(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Format time as HH:mm
      const hours = reminderTime.getHours().toString().padStart(2, '0');
      const minutes = reminderTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const preferences = {
        reminderTime: timeString,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        checkInEnabled: checkInEnabled,
      };

      const updatedUser = await api.request('POST', '/users/preferences', preferences);
      queryClient.setQueryData(['user'], updatedUser);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setReminderTime(selectedDate);
    }
  };

  const renderItem = ({ item, index }: { item: typeof STEPS[0], index: number }) => {
    return (
      <View style={{ width }} className="flex-1">
        {index === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <View className="mb-10">
              <MindMentorLogo width={200} height={200} />
            </View>
            <Text className="text-3xl font-bold mb-4 text-center text-white">
              {item.title}
            </Text>
            <Text className="text-base leading-6 text-center text-slate-400">
              {item.description}
            </Text>
          </View>
        ) : (
          <View className="flex-1 px-6 pt-2">
            <View className="mb-8">
              <View className="flex-row items-center justify-center mb-4 relative min-h-[44px]">
                <View>
                  <Text className="text-2xl font-bold text-white text-center mx-12">
                    {item.title}
                  </Text>
                  <Text className="text-base leading-6 text-center text-slate-400">
                    {item.description}
                  </Text>
                </View>
              </View>
            </View>
            {/*Body*/}
            <View className="flex-1 items-center justify-start w-full">
              {index === 1 && item.items && (
                <View className="w-full">
                  {item.items.map((subItem, subIndex) => (
                    <View key={subIndex} className="flex-row mb-20 relative">
                      {subIndex !== item.items.length - 1 && (
                        <View
                          className="absolute left-[20px] w-[1px] bg-slate-700"
                          style={{ bottom: -80, top: 35 }}
                        />
                      )}

                      <View className="mr-4 items-center">
                        <View className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
                          <subItem.icon size={20} color="#3B82F6" />
                        </View>
                      </View>
                      <View className="flex-1 pt-1">
                        <Text className="text-white text-lg font-semibold mb-1">{subItem.title}</Text>
                        <Text className="text-slate-400 text-sm leading-5">{subItem.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {index === 2 && item.items && (
                <View className="w-full">
                  {item.items.map((subItem, subIndex) => (
                    <View key={subIndex} className="flex-row items-center bg-slate-800 p-4 rounded-xl mb-10 border border-slate-700">
                      <View className="mr-4 items-center justify-center">
                        <View className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center">
                          <subItem.icon size={24} color="#3B82F6" />
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-lg font-bold mb-1">{subItem.title}</Text>
                        <Text className="text-slate-400 text-sm leading-5">{subItem.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {index === 3 && (
                <View className="w-full">
                  <Text className="text-slate-400 font-semibold mb-4 text-sm">Gentle Reminder</Text>
                  <View className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <View className="p-5 flex-row justify-between items-center">
                      <View>
                        <Text className="text-white text-base font-bold">Daily Check-in</Text>
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
                      <View className="bg-slate-800/50" style={{ borderTopWidth: 1, borderTopColor: "rgba(51, 65, 85, 0.5)" }}>
                        <View className="w-full items-center justify-center py-4">
                          <DateTimePicker
                            value={reminderTime}
                            mode="time"
                            display="spinner"
                            onChange={handleTimeChange}
                            textColor="white"
                            themeVariant="dark"
                            style={{ height: 150, width: "100%" }}
                          />
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
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <Animated.FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        className="flex-1"
      />

      {/* Footer */}
      <View className="w-full items-center px-5 pb-5 absolute bottom-0">
        {currentStep === 2 && (
          <Text className="text-center text-white text-xs mb-8">
            By continuing, you agree to the Terms of Service.

          </Text>
        )}

        <Pagination data={STEPS} scrollX={scrollX} screenWidth={width} />

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
    </SafeAreaView >
  );
}
