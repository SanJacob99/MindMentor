import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Menu, User, Brain, Smile, Coffee, Zap, PenLine, TrendingUp, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { useAddEntry, useEntries } from '../hooks/useEntries';
import { useRecommendations } from '../hooks/useRecommendations';

import CustomSlider from '../components/CustomSlider';
import Header from '../components/Header';

export default function HomeScreen() {
  const navigation = useNavigation();
  const logout = useAuthStore(state => state.logout);

  // Form State
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const { mutateAsync: addEntry, isPending: submitting } = useAddEntry();
  const { data: entries } = useEntries();
  const { data: recommendations = [], isLoading: loadingRecs } = useRecommendations();

  const hasSetDefaults = useRef(false);

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

  const contextOptions = ['Sleep', 'Movement', 'Social', 'Workload', 'Outdoors'];

  const handleSubmit = async () => {
    try {
      await addEntry({ mood, stress, energy, text, tags });
      Alert.alert('Success', 'Check-in saved!');
      setText('');
      setTags([]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
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
            <CustomSlider label="Mood" value={mood} setValue={setMood} icon={Smile} type="mood" />
            <CustomSlider label="Stress" value={stress} setValue={setStress} icon={Coffee} type="stress" />
            <CustomSlider label="Energy" value={energy} setValue={setEnergy} icon={Zap} type="energy" />

            <Text className="text-slate-200 mb-2 mt-2">Optional context</Text>
            <Text className="text-slate-500 text-xs mb-3">Only tap what feels relevant</Text>

            <View className="flex-row flex-wrap gap-2 mb-6">
              {contextOptions.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => toggleTag(opt)}
                  className={`px-4 py-2 rounded-full border ${tags.includes(opt) ? 'bg-slate-700 border-slate-600' : 'bg-slate-900 border-slate-700'}`}
                >
                  <Text className={`text-sm ${tags.includes(opt) ? 'text-white' : 'text-slate-400'}`}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="bg-slate-950 rounded-xl flex-row items-center px-4 py-3 border border-slate-800">
              <TextInput
                className="flex-1 text-white text-base"
                placeholder="Add optional note..."
                placeholderTextColor="#64748b"
                value={text}
                onChangeText={setText}
                multiline
              />
              <SlidersHorizontal size={18} color="#64748b" />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="mt-4 bg-blue-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold">{submitting ? "Saving..." : "Save Check-in"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patterns Section */}
        <View className="px-5 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Patterns so far</Text>
            <TouchableOpacity>
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
            <View className="h-40 w-full relative">
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
    </SafeAreaView>
  );
}
