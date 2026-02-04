import React from 'react';
import { View, Text, TouchableOpacity, DimensionValue } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Entry } from '../types/entry';

interface HistoryCardProps {
  entry: Entry;
  onPress: (entry: Entry) => void;
}

export default function HistoryCard({ entry, onPress }: HistoryCardProps) {
  const date = new Date(entry.createdAt);
  const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Helper to calculate width percentage (0-10 -> 0-100%)
  const getWidth = (val: number): DimensionValue => `${Math.min(Math.max(val * 10, 5), 100)}%` as DimensionValue;

  return (
    <TouchableOpacity
      onPress={() => onPress(entry)}
      className="bg-slate-800 rounded-2xl p-4 mb-4"
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Entry at ${timeString}. Mood: ${entry.mood}, Stress: ${entry.stress}, Energy: ${entry.energy}. ${entry.text || 'No description'}`}
      accessibilityHint="Double tap to view details"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-slate-400 font-bold text-sm">{timeString}</Text>
        <ChevronRight size={20} color="#64748b" />
      </View>

      <Text className="text-white text-base mb-4" numberOfLines={3}>
        {entry.text || 'No description'}
      </Text>

      <View className="flex-row gap-3">
        <View className="w-16">
          <View className="h-1 bg-slate-700 rounded-full mb-1 overflow-hidden">
            <View
              style={{ width: getWidth(entry.mood) }}
              className="h-full bg-blue-500 rounded-full"
            />
          </View>
          <Text className="text-slate-500 text-[10px]">Mood</Text>
        </View>

        <View className="w-16">
          <View className="h-1 bg-slate-700 rounded-full mb-1 overflow-hidden">
            <View
              style={{ width: getWidth(entry.stress) }}
              className="h-full bg-orange-500 rounded-full"
            />
          </View>
          <Text className="text-slate-500 text-[10px]">Stress</Text>
        </View>

        <View className="w-16">
          <View className="h-1 bg-slate-700 rounded-full mb-1 overflow-hidden">
            <View
              style={{ width: getWidth(entry.energy) }}
              className="h-full bg-teal-500 rounded-full"
            />
          </View>
          <Text className="text-slate-500 text-[10px]">Energy</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
