import React from 'react';
import { View, Text } from 'react-native';
import { Flame, Heart, Zap, Shield } from 'lucide-react-native';

interface Streak {
  type: string;
  length: number;
  startDate: string;
  endDate: string;
  metric: string;
  direction: string;
  threshold: number;
}

interface Props {
  currentStreaks: Streak[];
  bestStreaks: Streak[];
  volatility: { mood: number; stress: number; energy: number };
}

const STREAK_CONFIG: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  good_mood: { icon: Heart, color: '#22c55e', label: 'Good Mood' },
  low_mood: { icon: Heart, color: '#ef4444', label: 'Low Mood' },
  high_stress: { icon: Flame, color: '#f97316', label: 'High Stress' },
  low_stress: { icon: Shield, color: '#3b82f6', label: 'Low Stress' },
  high_energy: { icon: Zap, color: '#2dd4bf', label: 'High Energy' },
};

export default function StreakBadge({ currentStreaks, bestStreaks, volatility }: Props) {
  if (currentStreaks.length === 0 && bestStreaks.length === 0) return null;

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        Streaks
      </Text>

      {/* Current streaks */}
      {currentStreaks.length > 0 && (
        <View style={{ marginBottom: currentStreaks.length > 0 && bestStreaks.length > 0 ? 12 : 0 }}>
          <Text style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Active</Text>
          {currentStreaks.map((streak, i) => {
            const config = STREAK_CONFIG[streak.type] || { icon: Flame, color: '#94a3b8', label: streak.type };
            const Icon = config.icon;
            return (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
                paddingHorizontal: 12, backgroundColor: '#1e293b', borderRadius: 10, marginBottom: 6,
              }}>
                <Icon size={18} color={config.color} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  {streak.length}-day {config.label} streak
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Best streaks */}
      {bestStreaks.filter((s) => s.type === 'good_mood' || s.type === 'low_stress' || s.type === 'high_energy').length > 0 && (
        <View>
          <Text style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Personal Best</Text>
          {bestStreaks
            .filter((s) => s.type === 'good_mood' || s.type === 'low_stress' || s.type === 'high_energy')
            .slice(0, 3)
            .map((streak, i) => {
              const config = STREAK_CONFIG[streak.type] || { icon: Flame, color: '#94a3b8', label: streak.type };
              const Icon = config.icon;
              return (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
                  paddingHorizontal: 12, marginBottom: 4,
                }}>
                  <Icon size={14} color={config.color} />
                  <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
                    {streak.length} days ({streak.startDate} to {streak.endDate})
                  </Text>
                </View>
              );
            })}
        </View>
      )}

      {/* Volatility */}
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
        <Text style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>Stability</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {([['Mood', volatility.mood], ['Stress', volatility.stress], ['Energy', volatility.energy]] as [string, number][]).map(([label, val]) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Text style={{ color: val > 2.5 ? '#f97316' : val < 1.0 ? '#22c55e' : '#94a3b8', fontWeight: '600', fontSize: 16 }}>
                {val.toFixed(1)}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
