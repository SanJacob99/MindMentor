import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PenLine } from 'lucide-react-native';

interface Keyword {
  word: string;
  count: number;
  avgMoodWhenMentioned: number;
}

interface Props {
  keywords: Keyword[];
  baselineMood?: number;
}

export default function KeywordCloud({ keywords, baselineMood = 5 }: Props) {
  if (keywords.length === 0) {
    return (
      <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 9999, marginBottom: 12 }}>
          <PenLine size={24} color="#3b82f6" />
        </View>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
          No Keywords Yet
        </Text>
        <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
          Write journal entries to discover your most used words.
        </Text>
      </View>
    );
  }

  const maxCount = Math.max(...keywords.map((k) => k.count));

  const getColor = (avgMood: number) => {
    if (avgMood > baselineMood + 1) return '#22c55e';
    if (avgMood < baselineMood - 1) return '#ef4444';
    return '#94a3b8';
  };

  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    return Math.round(12 + ratio * 10); // 12px to 22px
  };

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        Keywords
      </Text>
      <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        Sized by frequency, colored by mood impact
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
        accessibilityRole="list"
        accessibilityLabel={`Top ${keywords.length} keywords from your journal entries`}
      >
        {keywords.slice(0, 20).map((kw) => (
          <View
            key={kw.word}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: '#1e293b',
              borderRadius: 8,
            }}
            accessibilityRole="text"
            accessibilityLabel={`${kw.word}: mentioned ${kw.count} times, average mood ${kw.avgMoodWhenMentioned.toFixed(1)}`}
          >
            <Text style={{
              color: getColor(kw.avgMoodWhenMentioned),
              fontSize: getFontSize(kw.count),
              fontWeight: '500',
            }}>
              {kw.word}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
          <Text style={{ color: '#64748b', fontSize: 10 }}>Higher mood</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
          <Text style={{ color: '#64748b', fontSize: 10 }}>Lower mood</Text>
        </View>
      </View>
    </View>
  );
}
