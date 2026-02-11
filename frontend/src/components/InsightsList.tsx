import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface Props {
  insights: string[];
  title?: string;
}

export default function InsightsList({ insights, title = 'INSIGHTS' }: Props) {
  if (!insights || insights.length === 0) return null;

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Sparkles size={18} color="#94a3b8" />
        <Text style={{ color: 'white', fontWeight: 'bold', letterSpacing: 0.5 }}>{title}</Text>
      </View>

      {insights.map((insight, i) => (
        <View key={i} style={{
          paddingVertical: 10,
          borderBottomWidth: i < insights.length - 1 ? 1 : 0,
          borderBottomColor: '#1e293b',
        }}>
          <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 20 }}>
            {insight}
          </Text>
        </View>
      ))}
    </View>
  );
}
