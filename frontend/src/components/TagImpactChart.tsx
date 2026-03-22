import React from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Tag } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TagData {
  tag: string;
  entryCount: number;
  deviations: { mood: number; stress: number; energy: number };
  impact: 'positive' | 'negative' | 'neutral';
}

interface Props {
  tagAnalysis: TagData[];
}

export default function TagImpactChart({ tagAnalysis }: Props) {
  const chartWidth = Platform.OS === 'web' ? Math.min(SCREEN_WIDTH - 80, 560) : SCREEN_WIDTH - 80;
  const barHeight = 24;
  const gap = 8;
  const labelWidth = 80;

  // Sort by absolute deviation, take top 8
  const sorted = [...tagAnalysis]
    .filter((t) => t.entryCount >= 2)
    .sort((a, b) => Math.abs(b.deviations.mood) - Math.abs(a.deviations.mood))
    .slice(0, 8);

  if (sorted.length === 0) {
    return (
      <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 9999, marginBottom: 12 }}>
          <Tag size={24} color="#3b82f6" />
        </View>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
          No Tag Data Yet
        </Text>
        <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
          Add tags to your check-ins to see how they impact your mood.
        </Text>
      </View>
    );
  }

  const maxDev = Math.max(30, ...sorted.map((t) => Math.abs(t.deviations.mood)));
  const chartAreaWidth = chartWidth - labelWidth;
  const centerX = labelWidth + chartAreaWidth / 2;
  const totalHeight = sorted.length * (barHeight + gap) + 10;

  // Calculate accessibility label summary
  const bestTag = sorted.filter(t => t.deviations.mood > 0).sort((a, b) => b.deviations.mood - a.deviations.mood)[0];
  const worstTag = sorted.filter(t => t.deviations.mood < 0).sort((a, b) => a.deviations.mood - b.deviations.mood)[0];

  let a11ySummary = `Tag impact chart showing top ${sorted.length} tags.`;
  if (bestTag) {
    a11ySummary += ` Highest positive: ${bestTag.tag} (+${Math.round(bestTag.deviations.mood)}%).`;
  }
  if (worstTag) {
    a11ySummary += ` Highest negative: ${worstTag.tag} (${Math.round(worstTag.deviations.mood)}%).`;
  }

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
        Tag Impact on Mood
      </Text>

      <View
        accessibilityRole="image"
        accessibilityLabel={a11ySummary}
      >
        <Svg width={chartWidth} height={totalHeight}>
          {/* Center line */}
          <Line x1={centerX} y1={0} x2={centerX} y2={totalHeight} stroke="#475569" strokeWidth={1} strokeDasharray="4,4" />

          {sorted.map((tag, i) => {
            const y = i * (barHeight + gap) + 4;
            const dev = tag.deviations.mood;
            const barW = (Math.abs(dev) / maxDev) * (chartAreaWidth / 2);
            const isPositive = dev >= 0;
            const barX = isPositive ? centerX : centerX - barW;
            const color = isPositive ? '#22c55e' : '#ef4444';

            return (
              <React.Fragment key={tag.tag}>
                {/* Tag label */}
                <SvgText x={labelWidth - 4} y={y + barHeight / 2 + 4} fill="#94a3b8" fontSize={11} textAnchor="end">
                  {tag.tag.length > 10 ? tag.tag.slice(0, 10) + '..' : tag.tag}
                </SvgText>
                {/* Bar */}
                <Rect x={barX} y={y} width={Math.max(barW, 2)} height={barHeight} rx={4} fill={color} opacity={0.75} />
                {/* Deviation label */}
                <SvgText
                  x={isPositive ? centerX + barW + 4 : centerX - barW - 4}
                  y={y + barHeight / 2 + 4}
                  fill={color} fontSize={10}
                  textAnchor={isPositive ? 'start' : 'end'}
                >
                  {dev > 0 ? '+' : ''}{Math.round(dev)}%
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}
