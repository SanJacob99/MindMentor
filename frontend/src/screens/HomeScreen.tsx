import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, Modal, Dimensions, KeyboardAvoidingView, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Menu, User, Brain, Smile, Coffee, Zap, PenLine, TrendingUp, ChevronRight, SlidersHorizontal, Plus, ChevronDown, ChevronUp, Check, X } from 'lucide-react-native';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/RootNavigator';
import { useAddEntry, useEntries } from '../hooks/useEntries';
import { useRecommendations } from '../hooks/useRecommendations';
import { useContextOptions } from '../hooks/useContextOptions';

import CustomSlider from '../components/CustomSlider';
import Header from '../components/Header';

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const logout = useAuthStore(state => state.logout);

  // Form State
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);

  const { mutateAsync: addEntry, isPending: submitting } = useAddEntry();
  const { data: entries } = useEntries();
  const { data: recommendations = [], isLoading: loadingRecs } = useRecommendations();

  const hasSetDefaults = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const noteInputRef = useRef<View>(null);

  // Auto-save refs
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoSubmittingRef = useRef(false);
  const INACTIVITY_DELAY_MS = 3000;

  // Get latest entry for comparison
  const latestEntry = entries && entries.length > 0
    ? [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Check if there are meaningful changes to auto-save
  const hasChanges = useCallback(() => {
    if (!latestEntry) {
      // No previous entry - any interaction is valid for first check-in
      // (inactivity timer only fires after user interaction, so this is safe)
      return true;
    }
    return (
      mood !== latestEntry.mood ||
      stress !== latestEntry.stress ||
      energy !== latestEntry.energy ||
      tags.length > 0 ||
      text.trim().length > 0
    );
  }, [mood, stress, energy, text, tags, latestEntry]);

  // Silent auto-submit (no alert)
  const autoSubmit = useCallback(async () => {
    if (isAutoSubmittingRef.current || submitting) return;
    if (!hasChanges()) return;

    isAutoSubmittingRef.current = true;
    try {
      await addEntry({ mood, stress, energy, text, tags });
      setText('');
      setTags([]);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isAutoSubmittingRef.current = false;
    }
  }, [mood, stress, energy, text, tags, addEntry, hasChanges, submitting]);

  // Reset inactivity timer - called on every check-in interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      autoSubmit();
    }, INACTIVITY_DELAY_MS);
  }, [autoSubmit]);

  // AppState listener for app backgrounding
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clear timer and auto-save immediately
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        autoSubmit();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [autoSubmit]);

  // Set defaults from latest entry
  useEffect(() => {
    if (entries && entries.length > 0 && !hasSetDefaults.current) {
      const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = sorted[0];
      setMood(latest.mood);
      setStress(latest.stress);
      setEnergy(latest.energy);
      hasSetDefaults.current = true;
    }
  }, [entries]);

  // Context options from hook (sorted by frequency)
  const { options: contextOptions, addContextOption, isAddingOption, isLoading: isContextLoading } = useContextOptions();
  const [isExpanded, setIsExpanded] = useState(false);

  // Modal state for adding tags (Android/web fallback)
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Show first 5 options when collapsed, all when expanded
  const MAX_VISIBLE = 5;
  const hasMoreOptions = contextOptions.length > MAX_VISIBLE;
  const visibleOptions = isExpanded ? contextOptions : contextOptions.slice(0, MAX_VISIBLE);

  const handleSubmit = async () => {
    // Clear auto-save timer to prevent double-submit
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    try {
      await addEntry({ mood, stress, energy, text, tags });
      Alert.alert('Success', 'Check-in saved!');
      setText('');
      setTags([]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  // Wrapped setters that trigger inactivity timer
  const handleMoodChange = (value: number) => {
    setMood(value);
    resetInactivityTimer();
  };

  const handleStressChange = (value: number) => {
    setStress(value);
    resetInactivityTimer();
  };

  const handleEnergyChange = (value: number) => {
    setEnergy(value);
    resetInactivityTimer();
  };

  const handleTextChange = (value: string) => {
    setText(value);
    resetInactivityTimer();
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
    resetInactivityTimer();
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
    resetInactivityTimer();
  };

  const onTagAdded = (rawName: string) => {
    const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    setTags((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
    setIsExpanded(true);
  };

  const handleAddTag = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Add Context Tag',
        'Enter a name for your custom tag:',
        async (name) => {
          if (name) {
            try {
              const trimmed = name.trim();
              await addContextOption(trimmed);
              onTagAdded(trimmed);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add tag');
            }
          }
        },
        'plain-text'
      );
    } else {
      // Android/web: show modal
      setNewTagName('');
      setShowAddTagModal(true);
    }
  };

  const handleSaveNewTag = async () => {
    const trimmed = newTagName.trim();
    if (trimmed) {
      try {
        await addContextOption(trimmed);
        onTagAdded(trimmed);
        setShowAddTagModal(false);
        setNewTagName('');
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add tag');
      }
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Header title="Home" />

          <Text className="text-slate-400 text-center mb-6">Starting to learn your patterns</Text>

          {/* Recommendations / Placeholder */}
          <View className="mx-5 mb-8 border border-dashed border-slate-700 bg-slate-900/40 p-6 rounded-2xl items-center">
            <View className="bg-slate-800 p-3 rounded-full mb-4">
              <Brain size={24} color="#3b82f6" />
            </View>
            <Text className="text-white text-lg font-bold mb-2">Personalized Recommendations</Text>
            <Text className="text-slate-400 text-center leading-5">
              After a few check-ins, this space will show options based on what's helped you before.
            </Text>
          </View>

          {/* Check-in Section */}
          <View className="px-5">
            <Text className="text-white text-xl font-bold mb-4">Log how things feel right now</Text>

            <View className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <CustomSlider label="Mood" value={mood} setValue={handleMoodChange} icon={Smile} type="mood" />
              <CustomSlider label="Stress" value={stress} setValue={handleStressChange} icon={Coffee} type="stress" />
              <CustomSlider label="Energy" value={energy} setValue={handleEnergyChange} icon={Zap} type="energy" />

              <Text className="text-slate-200 mb-2 mt-2">Optional context</Text>
              <Text className="text-slate-500 text-xs mb-3">Only tap what feels relevant</Text>

              <View className="flex-row flex-wrap gap-2 mb-6">
                {/* Add Tag Button */}
                <TouchableOpacity
                  onPress={handleAddTag}
                  disabled={isAddingOption || isContextLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom context tag"
                  className="px-3 py-2 rounded-full border border-dashed border-slate-600 bg-slate-900 flex-row items-center"
                >
                  {isAddingOption || isContextLoading ? (
                    <ActivityIndicator size="small" color="#64748b" />
                  ) : (
                    <Plus size={16} color="#64748b" />
                  )}
                </TouchableOpacity>
                {visibleOptions.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleTag(opt)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={opt}
                    accessibilityState={{ checked: tags.includes(opt) }}
                    style={{
                      backgroundColor: tags.includes(opt) ? '#1d4ed833' : '#0f172a'
                    }}
                    className={`px-4 py-2 rounded-full border flex-row items-center gap-2 ${tags.includes(opt) ? 'border-blue-500' : 'border-slate-700'}`}
                  >
                    {tags.includes(opt) && <Check size={14} color="#60a5fa" />}
                    <Text className={`text-sm ${tags.includes(opt) ? 'text-blue-100' : 'text-slate-400'}`}>{opt}</Text>
                  </TouchableOpacity>
                ))}

                {/* Expand/Collapse Button */}
                {hasMoreOptions && (
                  <TouchableOpacity
                    onPress={handleExpandToggle}
                    accessibilityRole="button"
                    accessibilityLabel={isExpanded ? 'Show fewer options' : 'Show more options'}
                    className="px-3 py-2 rounded-full border border-slate-600 bg-slate-800 flex-row items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={14} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs">Less</Text>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs">+{contextOptions.length - MAX_VISIBLE}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View
                ref={noteInputRef}
                className={`bg-slate-950 rounded-xl flex-row items-center px-4 py-3 border ${isInputFocused ? 'border-blue-500' : 'border-slate-800'}`}
              >
                <TextInput
                  className="flex-1 text-white"
                  style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined}
                  placeholder="Add optional note..."
                  placeholderTextColor="#64748b"
                  value={text}
                  onChangeText={handleTextChange}
                  multiline
                  accessibilityLabel="Optional note"
                  onFocus={() => {
                    setIsInputFocused(true);
                    resetInactivityTimer();
                    // Wait for keyboard to animate, then scroll input into view
                    setTimeout(() => {
                      noteInputRef.current?.measureInWindow((x, y, width, height) => {
                        const screenHeight = Dimensions.get('window').height;
                        // If input is in bottom half, scroll it up
                        if (y > screenHeight * 0.4) {
                          scrollViewRef.current?.scrollTo({ y: y - 120, animated: true });
                        }
                      });
                    }, 300);
                  }}
                  onBlur={() => setIsInputFocused(false)}
                />
                {text.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleTextChange('')}
                    accessibilityRole="button"
                    accessibilityLabel="Clear note"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="ml-2"
                  >
                    <X color="#94a3b8" size={20} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Save Check-in"
                accessibilityState={{ disabled: submitting }}
                className="mt-4 bg-blue-600 py-3 rounded-xl items-center justify-center h-12"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Save Check-in</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Patterns Section */}
          <View className="px-5 mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">Patterns so far</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View all patterns"
                accessibilityHint="Navigates to insights screen"
                onPress={() => navigation.navigate('Insights')}
              >
                <Text className="text-blue-500 font-medium">View all</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <View className="flex-row gap-4 mb-6">
                <View className="bg-emerald-900/50 px-3 py-1 rounded items-center justify-center border border-emerald-800">
                  <View className="flex-row items-center gap-1">
                    <TrendingUp size={14} color="#10b981" />
                    <Text className="text-emerald-400 font-bold">+5%</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 leading-5">
                    Your mood has been steadily improving over the last 3 days. Morning check-ins correlate with higher daily averages.
                  </Text>
                </View>
              </View>

              {/* Chart Visualization */}
              <View
                className="h-40 w-full relative"
                accessibilityRole="image"
                accessibilityLabel="Mood history chart for the last 7 days."
              >
                {/* Grid lines */}
                <View className="absolute inset-0 justify-between py-2">
                  <View className="h-[1px] bg-slate-800 w-full" />
                  <View className="h-[1px] bg-slate-800 w-full" />
                  <View className="h-[1px] bg-slate-800 w-full" />
                  <View className="h-[1px] bg-slate-800 w-full" />
                </View>

                <Svg height="100%" width="100%" viewBox="0 0 300 100" style={{ marginTop: 10 }}>
                  <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#3b82f6" stopOpacity="0.5" />
                      <Stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  {/* Mock Data Line */}
                  <Path
                    d="M0 90 L50 85 L100 95 L150 70 L200 65 L250 50 L300 45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  {/* Dots */}
                  <Circle cx="0" cy="90" r="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <Circle cx="50" cy="85" r="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <Circle cx="100" cy="95" r="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <Circle cx="150" cy="70" r="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <Circle cx="200" cy="65" r="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <Circle cx="250" cy="50" r="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <Circle cx="300" cy="45" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                </Svg>
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-slate-600 text-[10px] font-bold">MON</Text>
                <Text className="text-slate-600 text-[10px] font-bold">TUE</Text>
                <Text className="text-slate-600 text-[10px] font-bold">WED</Text>
                <Text className="text-slate-600 text-[10px] font-bold">THU</Text>
                <Text className="text-slate-600 text-[10px] font-bold">FRI</Text>
                <Text className="text-slate-600 text-[10px] font-bold">SAT</Text>
                <Text className="text-slate-600 text-[10px] font-bold">TODAY</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Tag Modal (Android/Web) */}
      <Modal
        visible={showAddTagModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddTagModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View
            className="bg-slate-900 rounded-2xl p-5 w-full max-w-sm border border-slate-700"
            accessibilityViewIsModal={true}
            onAccessibilityEscape={() => setShowAddTagModal(false)}
          >
            <Text className="text-white text-lg font-bold mb-2">Add Context Tag</Text>
            <Text className="text-slate-400 mb-4">Enter a name for your custom tag:</Text>
            <TextInput
              className={`bg-slate-800 text-white px-4 py-3 rounded-xl border mb-4 ${isTagInputFocused ? 'border-blue-500' : 'border-slate-700'}`}
              style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined}
              placeholder="Tag name..."
              placeholderTextColor="#64748b"
              value={newTagName}
              onChangeText={setNewTagName}
              onFocus={() => setIsTagInputFocused(true)}
              onBlur={() => setIsTagInputFocused(false)}
              autoFocus
              maxLength={30}
              accessibilityLabel="Tag name"
              accessibilityHint="Enter the name for your new context tag"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddTagModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 items-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                accessibilityHint="Closes the tag creation modal"
              >
                <Text className="text-slate-400 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewTag}
                disabled={!newTagName.trim() || isAddingOption}
                className={`flex-1 py-3 rounded-xl items-center ${newTagName.trim() ? 'bg-blue-600' : 'bg-slate-700'}`}
                accessibilityRole="button"
                accessibilityLabel="Add Tag"
                accessibilityHint="Creates the new tag"
                accessibilityState={{ disabled: !newTagName.trim() || isAddingOption }}
              >
                {isAddingOption ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className={`font-medium ${newTagName.trim() ? 'text-white' : 'text-slate-500'}`}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
