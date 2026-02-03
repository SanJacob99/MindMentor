import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X, Lightbulb } from 'lucide-react-native';
import { Entry } from '../types/entry';

interface EntryDetailModalProps {
  visible: boolean;
  entry: Entry | null;
  onClose: () => void;
}

export default function EntryDetailModal({ visible, entry, onClose }: EntryDetailModalProps) {
  if (!entry) return null;

  const date = new Date(entry.createdAt);
  const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  // Custom logic for specific metrics if needed.
  // Usually High Stress is "Bad" (Red/Orange), High Mood is "Good" (Blue).
  const getMoodLabel = (val: number) => {
      if (val >= 7) return 'High';
      if (val >= 4) return 'Medium';
      return 'Low';
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-slate-900 rounded-t-3xl h-[85%] w-full overflow-hidden">
            {/* Header / Handle */}
            <View className="items-center pt-4 pb-2">
                <View className="w-12 h-1 bg-slate-700 rounded-full" />
            </View>

            {/* Content */}
            <View className="flex-1 px-6">
                {/* Top Bar with Close */}
                <View className="flex-row justify-end mb-4">
                    <TouchableOpacity
                        onPress={onClose}
                        className="p-2 bg-slate-800 rounded-full"
                        accessibilityRole="button"
                        accessibilityLabel="Close details"
                    >
                        <X size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Date Header */}
                    <View className="flex-row justify-between items-end mb-4">
                        <Text className="text-white text-3xl font-bold">{dateString}</Text>
                        <Text className="text-slate-400 text-lg mb-1">{timeString}</Text>
                    </View>

                    {/* Tags */}
                    <View className="flex-row flex-wrap gap-2 mb-8">
                        {entry.tags.map((tag, index) => (
                            <View key={index} className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                                <Text className="text-blue-400 text-xs font-medium">{tag.startsWith('#') ? tag : `#${tag}`}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Emotional State */}
                    <View className="bg-slate-950/50 rounded-2xl p-5 mb-8 border border-slate-800">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Emotional State</Text>

                        {/* Mood */}
                        <View className="mb-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-white text-sm">Mood</Text>
                                <Text className="text-blue-400 text-sm font-bold">{getMoodLabel(entry.mood)}</Text>
                            </View>
                            <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <View style={{ width: `${entry.mood * 10}%` }} className="h-full bg-blue-500 rounded-full" />
                            </View>
                        </View>

                        {/* Stress */}
                        <View className="mb-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-white text-sm">Stress</Text>
                                <Text className="text-orange-400 text-sm font-bold">{getMoodLabel(entry.stress)}</Text>
                            </View>
                            <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <View style={{ width: `${entry.stress * 10}%` }} className="h-full bg-orange-500 rounded-full" />
                            </View>
                        </View>

                        {/* Energy */}
                        <View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-white text-sm">Energy</Text>
                                <Text className="text-teal-400 text-sm font-bold">{getMoodLabel(entry.energy)}</Text>
                            </View>
                            <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <View style={{ width: `${entry.energy * 10}%` }} className="h-full bg-teal-500 rounded-full" />
                            </View>
                        </View>
                    </View>

                    {/* Journal Entry */}
                    <View className="mb-8">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Journal Entry</Text>
                        <Text className="text-slate-200 text-base leading-7">
                            {entry.text}
                        </Text>
                    </View>

                    {/* Suggestion Card */}
                    <View className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 relative overflow-hidden">
                        {/* Background Icon Effect */}
                        <View className="absolute -right-4 -bottom-4 opacity-10">
                            <Lightbulb size={120} color="#3b82f6" />
                        </View>

                        <View className="flex-row items-center mb-3 space-x-2">
                            <Lightbulb size={16} color="#3b82f6" fill="#3b82f6" />
                            <Text className="text-blue-400 text-xs font-bold">Suggestion from this day</Text>
                        </View>
                        <Text className="text-white text-sm italic leading-5">
                            "Take a 5-minute walk outside to reset your nervous system after the high-focus event."
                        </Text>
                    </View>

                </ScrollView>
            </View>
        </View>
      </View>
    </Modal>
  );
}
