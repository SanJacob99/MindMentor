import React from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface WeekData {
  weekLabel: string;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
}

interface Props {
  weeks: WeekData[];
  direction: { mood: string; stress: string; energy: string };
  slopes: { mood: number; stress: number; energy: number };
}

export default function TrendChart({ weeks, direction, slopes }: Props) {
  const chartWidth = Platform.OS === 'web' ? Math.min(SCREEN_WIDTH - 80, 560) : SCREEN_WIDTH - 80;
  const chartHeight = 120;
  const maxVal = 10;

  const getPath = (values: number[]) => {
    if (values.length === 0) return '';
    const stepX = chartWidth / Math.max(values.length - 1, 1);
    const points = values.map((v, i) => ({
      x: i * stepX,
      y: chartHeight - (v / maxVal) * chartHeight,
    }));

    if (points.length === 1) return `M 0 ${points[0].y} L ${chartWidth} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const moodValues = weeks.map((w) => w.avgMood);
  const stressValues = weeks.map((w) => w.avgStress);
  const energyValues = weeks.map((w) => w.avgEnergy);

  const DirectionIcon = ({ dir }: { dir: string }) => {
    if (dir === 'improving') return <TrendingUp size={14} color="#22c55e" />;
    if (dir === 'declining') return <TrendingDown size={14} color="#ef4444" />;
    return <Minus size={14} color="#94a3b8" />;
  };

  const dirColor = (dir: string) => {
    if (dir === 'improving') return '#22c55e';
    if (dir === 'declining') return '#ef4444';
    return '#94a3b8';
  };

  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
        Weekly Trend
      </Text>

      <View
        accessibilityRole="image"
        accessibilityLabel={`Weekly mood trend: ${direction.mood}. Stress trend: ${direction.stress}. Energy trend: ${direction.energy}.`}
      >
        <Svg width={chartWidth} height={chartHeight + 30}>
          {/* Grid */}
          {[0, 0.5, 1].map((ratio) => (
            <Line key={ratio} x1={0} y1={chartHeight * (1 - ratio)} x2={chartWidth} y2={chartHeight * (1 - ratio)} stroke="#1e293b" strokeWidth={1} />
          ))}

          <Path d={getPath(stressValues)} stroke="#f97316" strokeWidth={2} fill="none" opacity={0.6} />
          <Path d={getPath(energyValues)} stroke="#2dd4bf" strokeWidth={2} fill="none" opacity={0.6} />
          <Path d={getPath(moodValues)} stroke="#3b82f6" strokeWidth={2.5} fill="none" />

          {/* Dots for mood */}
          {moodValues.map((v, i) => {
            const stepX = chartWidth / Math.max(moodValues.length - 1, 1);
            return (
              <Circle key={i} cx={i * stepX} cy={chartHeight - (v / maxVal) * chartHeight} r={3} fill="#0f172a" stroke="#3b82f6" strokeWidth={2} />
            );
          })}

          {/* Week labels */}
          {weeks.map((w, i) => {
            const stepX = chartWidth / Math.max(weeks.length - 1, 1);
            const label = w.weekLabel.split('-W')[1] ? `W${w.weekLabel.split('-W')[1]}` : w.weekLabel.slice(5);
            return (
              <SvgText key={i} x={i * stepX} y={chartHeight + 18} fill="#64748b" fontSize={9} textAnchor="middle">
                {label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Direction indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
        {([['Mood', direction.mood], ['Stress', direction.stress], ['Energy', direction.energy]] as [string, string][]).map(([label, dir]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <DirectionIcon dir={dir} />
            <Text style={{ color: dirColor(dir), fontSize: 12, fontWeight: '500' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
