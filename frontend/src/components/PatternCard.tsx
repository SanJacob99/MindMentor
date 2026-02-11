import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BucketData {
  bucket: string;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
  entryCount: number;
}

interface WeekdayData {
  day: string;
  dayIndex: number;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
  entryCount: number;
}

interface Props {
  hourlyBuckets: BucketData[];
  bestBucket: string;
  worstBucket: string;
  weekdayDays: WeekdayData[];
  bestDay: string;
  worstDay: string;
}

type ViewType = 'timeOfDay' | 'weekday';
type MetricType = 'mood' | 'stress' | 'energy';

const METRIC_COLORS: Record<MetricType, string> = {
  mood: '#3b82f6',
  stress: '#f97316',
  energy: '#2dd4bf',
};

export default function PatternCard({ hourlyBuckets, bestBucket, worstBucket, weekdayDays, bestDay, worstDay }: Props) {
  const [view, setView] = useState<ViewType>('timeOfDay');
  const [metric, setMetric] = useState<MetricType>('mood');

  const chartWidth = Platform.OS === 'web' ? Math.min(SCREEN_WIDTH - 80, 560) : SCREEN_WIDTH - 80;
  const chartHeight = 120;
  const maxVal = 10;

  const data = view === 'timeOfDay' ? hourlyBuckets : weekdayDays;
  const labels = view === 'timeOfDay'
    ? hourlyBuckets.map((b) => b.bucket.charAt(0).toUpperCase() + b.bucket.slice(1, 4))
    : weekdayDays.map((d) => d.day);

  const values = data.map((d) => {
    if (metric === 'mood') return 'avgMood' in d ? d.avgMood : 0;
    if (metric === 'stress') return 'avgStress' in d ? d.avgStress : 0;
    return 'avgEnergy' in d ? d.avgEnergy : 0;
  });

  const barWidth = Math.min(32, (chartWidth - 20) / data.length - 8);
  const color = METRIC_COLORS[metric];

  const best = view === 'timeOfDay' ? bestBucket : bestDay;
  const worst = view === 'timeOfDay' ? worstBucket : worstDay;

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        {view === 'timeOfDay' ? 'Time of Day' : 'Day of Week'}
      </Text>

      {/* View toggle */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setView('timeOfDay')}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
            backgroundColor: view === 'timeOfDay' ? '#1e293b' : 'transparent',
            borderWidth: 1, borderColor: view === 'timeOfDay' ? '#475569' : '#1e293b',
          }}
        >
          <Text style={{ color: view === 'timeOfDay' ? 'white' : '#94a3b8', fontSize: 12 }}>Time of Day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('weekday')}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
            backgroundColor: view === 'weekday' ? '#1e293b' : 'transparent',
            borderWidth: 1, borderColor: view === 'weekday' ? '#475569' : '#1e293b',
          }}
        >
          <Text style={{ color: view === 'weekday' ? 'white' : '#94a3b8', fontSize: 12 }}>Weekday</Text>
        </TouchableOpacity>
      </View>

      {/* Metric toggle */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {(['mood', 'stress', 'energy'] as MetricType[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMetric(m)}
            style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 12, backgroundColor: metric === m ? '#1e293b' : 'transparent',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: METRIC_COLORS[m], marginRight: 6 }} />
            <Text style={{ color: metric === m ? 'white' : '#64748b', fontSize: 11 }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar chart */}
      <View
        accessibilityRole="image"
        accessibilityLabel={`${view === 'timeOfDay' ? 'Time of day' : 'Weekday'} ${metric} chart. Best: ${best}. Worst: ${worst}.`}
      >
        <Svg width={chartWidth} height={chartHeight + 30}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <Line
              key={ratio}
              x1={0} y1={chartHeight * (1 - ratio)}
              x2={chartWidth} y2={chartHeight * (1 - ratio)}
              stroke="#1e293b" strokeWidth={1}
            />
          ))}

          {/* Bars */}
          {values.map((val, i) => {
            const x = (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2;
            const barHeight = (val / maxVal) * chartHeight;
            const y = chartHeight - barHeight;
            return (
              <React.Fragment key={i}>
                <Rect
                  x={x} y={y} width={barWidth} height={barHeight}
                  rx={4} fill={color} opacity={0.85}
                />
                <SvgText
                  x={x + barWidth / 2} y={chartHeight + 16}
                  fill="#64748b" fontSize={10} textAnchor="middle"
                >
                  {labels[i]}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Best/Worst labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: '#22c55e', fontSize: 12 }}>Best: {best}</Text>
        <Text style={{ color: '#ef4444', fontSize: 12 }}>Lowest: {worst}</Text>
      </View>
    </View>
  );
}
