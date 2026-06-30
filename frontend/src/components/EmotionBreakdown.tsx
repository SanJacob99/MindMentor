import React from 'react';
import { View, Text } from 'react-native';
import { Smile } from 'lucide-react-native';

interface EmotionData {
  emotion: string;
  percentage: number;
  entryCount: number;
}

interface Props {
  breakdown: EmotionData[];
  primary: string;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#22c55e',
  sad: '#3b82f6',
  anxious: '#f97316',
  angry: '#ef4444',
  calm: '#2dd4bf',
  neutral: '#94a3b8',
};

const EMOTION_LABELS: Record<string, string> = {
  happy: 'Happy',
  sad: 'Sad',
  anxious: 'Anxious',
  angry: 'Angry',
  calm: 'Calm',
  neutral: 'Neutral',
};

export default function EmotionBreakdown({ breakdown, primary }: Props) {
  if (breakdown.length === 0) {
    return (
      <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 9999, marginBottom: 12 }}>
          <Smile size={24} color="#3b82f6" />
        </View>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
          No Emotions Yet
        </Text>
        <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
          Add notes to your check-ins to see your emotional breakdown.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        Emotions
      </Text>
      <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        Primary: {EMOTION_LABELS[primary] || primary}
      </Text>

      {/* Stacked bar */}
      <View style={{ flexDirection: 'row', height: 20, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}
        accessibilityRole="image"
        accessibilityLabel={`Emotion breakdown: ${breakdown.map((e) => `${EMOTION_LABELS[e.emotion] || e.emotion} ${e.percentage}%`).join(', ')}`}
      >
        {breakdown.map((item) => (
          <View
            key={item.emotion}
            style={{
              flex: item.percentage,
              backgroundColor: EMOTION_COLORS[item.emotion] || '#64748b',
              opacity: 0.85,
            }}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {breakdown.map((item) => (
          <View
            key={item.emotion}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            accessible={true}
            accessibilityLabel={`${EMOTION_LABELS[item.emotion] || item.emotion} ${item.percentage}%`}
          >
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: EMOTION_COLORS[item.emotion] || '#64748b',
            }} />
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>
              {EMOTION_LABELS[item.emotion] || item.emotion} {item.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
