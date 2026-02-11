export interface EntryMetrics {
  createdAt: Date;
  mood: number;
  stress: number;
  energy: number;
}

export interface EntryWithTags extends EntryMetrics {
  tags: string[];
}

export interface BucketResult {
  bucket: string;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
  entryCount: number;
}

export interface WeekdayResult {
  day: string;
  dayIndex: number;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
  entryCount: number;
}

export interface WeekData {
  weekLabel: string;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
}

export interface TrendDirection {
  mood: 'improving' | 'declining' | 'stable';
  stress: 'improving' | 'declining' | 'stable';
  energy: 'improving' | 'declining' | 'stable';
}

export interface Streak {
  type: string;
  length: number;
  startDate: string;
  endDate: string;
  metric: string;
  direction: 'above' | 'below';
  threshold: number;
}

export interface TagCombination {
  tags: [string, string];
  coOccurrences: number;
  avgMood: number;
  moodDeviation: number;
}

export interface TagFrequencyAnalysis {
  tag: string;
  entryCount: number;
  averages: { mood: number; stress: number; energy: number };
  deviations: { mood: number; stress: number; energy: number };
  frequencyInLowMood: number;
  frequencyInHighMood: number;
  impact: 'positive' | 'negative' | 'neutral';
}

const BUCKET_RANGES: Record<string, [number, number]> = {
  morning: [6, 11],
  afternoon: [12, 17],
  evening: [18, 22],
  night: [23, 5], // wraps around midnight
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = avg(arr);
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function getBucket(hour: number): string {
  if (hour >= 6 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 22) return 'evening';
  return 'night';
}

function getISOWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function toDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Applies timezone offset to a date. Returns a new Date shifted by the offset.
 * tzOffsetMinutes: offset from UTC in minutes (e.g., -300 for EST, 60 for CET)
 */
export function applyTimezone(date: Date, tzOffsetMinutes: number): Date {
  return new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);
}

export function computeHourlyPatterns(entries: EntryMetrics[], tzOffsetMinutes = 0): {
  buckets: BucketResult[];
  bestBucket: string;
  worstBucket: string;
} {
  const bucketData: Record<string, { mood: number[]; stress: number[]; energy: number[] }> = {
    morning: { mood: [], stress: [], energy: [] },
    afternoon: { mood: [], stress: [], energy: [] },
    evening: { mood: [], stress: [], energy: [] },
    night: { mood: [], stress: [], energy: [] },
  };

  for (const e of entries) {
    const adjusted = applyTimezone(e.createdAt, tzOffsetMinutes);
    const bucket = getBucket(adjusted.getUTCHours());
    bucketData[bucket].mood.push(e.mood);
    bucketData[bucket].stress.push(e.stress);
    bucketData[bucket].energy.push(e.energy);
  }

  const buckets: BucketResult[] = ['morning', 'afternoon', 'evening', 'night'].map((b) => ({
    bucket: b,
    avgMood: round2(avg(bucketData[b].mood)),
    avgStress: round2(avg(bucketData[b].stress)),
    avgEnergy: round2(avg(bucketData[b].energy)),
    entryCount: bucketData[b].mood.length,
  }));

  const withEntries = buckets.filter((b) => b.entryCount > 0);
  const bestBucket = withEntries.length > 0
    ? withEntries.reduce((best, b) => (b.avgMood > best.avgMood ? b : best)).bucket
    : 'morning';
  const worstBucket = withEntries.length > 0
    ? withEntries.reduce((worst, b) => (b.avgMood < worst.avgMood ? b : worst)).bucket
    : 'morning';

  return { buckets, bestBucket, worstBucket };
}

export function computeWeekdayPatterns(entries: EntryMetrics[], tzOffsetMinutes = 0): {
  days: WeekdayResult[];
  bestDay: string;
  worstDay: string;
} {
  const dayData: Record<number, { mood: number[]; stress: number[]; energy: number[] }> = {};
  for (let i = 0; i < 7; i++) {
    dayData[i] = { mood: [], stress: [], energy: [] };
  }

  for (const e of entries) {
    const adjusted = applyTimezone(e.createdAt, tzOffsetMinutes);
    const day = adjusted.getUTCDay();
    dayData[day].mood.push(e.mood);
    dayData[day].stress.push(e.stress);
    dayData[day].energy.push(e.energy);
  }

  const days: WeekdayResult[] = DAY_NAMES.map((name, i) => ({
    day: name,
    dayIndex: i,
    avgMood: round2(avg(dayData[i].mood)),
    avgStress: round2(avg(dayData[i].stress)),
    avgEnergy: round2(avg(dayData[i].energy)),
    entryCount: dayData[i].mood.length,
  }));

  const withEntries = days.filter((d) => d.entryCount > 0);
  const bestDay = withEntries.length > 0
    ? withEntries.reduce((best, d) => (d.avgMood > best.avgMood ? d : best)).day
    : 'Mon';
  const worstDay = withEntries.length > 0
    ? withEntries.reduce((worst, d) => (d.avgMood < worst.avgMood ? d : worst)).day
    : 'Mon';

  return { days, bestDay, worstDay };
}

function linearRegressionSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function slopeToDirection(slope: number): 'improving' | 'declining' | 'stable' {
  if (slope > 0.1) return 'improving';
  if (slope < -0.1) return 'declining';
  return 'stable';
}

export function computeMonthlyTrend(entries: EntryMetrics[]): {
  weeks: WeekData[];
  direction: TrendDirection;
  slopes: { mood: number; stress: number; energy: number };
} {
  const weekMap = new Map<string, { mood: number[]; stress: number[]; energy: number[] }>();

  for (const e of entries) {
    const week = getISOWeekLabel(e.createdAt);
    if (!weekMap.has(week)) {
      weekMap.set(week, { mood: [], stress: [], energy: [] });
    }
    const data = weekMap.get(week)!;
    data.mood.push(e.mood);
    data.stress.push(e.stress);
    data.energy.push(e.energy);
  }

  const weeks: WeekData[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekLabel, data]) => ({
      weekLabel,
      avgMood: round2(avg(data.mood)),
      avgStress: round2(avg(data.stress)),
      avgEnergy: round2(avg(data.energy)),
    }));

  const moodSlope = linearRegressionSlope(weeks.map((w) => w.avgMood));
  const stressSlope = linearRegressionSlope(weeks.map((w) => w.avgStress));
  const energySlope = linearRegressionSlope(weeks.map((w) => w.avgEnergy));

  return {
    weeks,
    direction: {
      mood: slopeToDirection(moodSlope),
      // For stress, improving means declining (less stress = better)
      stress: stressSlope < -0.1 ? 'improving' : stressSlope > 0.1 ? 'declining' : 'stable',
      energy: slopeToDirection(energySlope),
    },
    slopes: {
      mood: round2(moodSlope),
      stress: round2(stressSlope),
      energy: round2(energySlope),
    },
  };
}

export function computeStreaks(entries: EntryMetrics[]): {
  current: Streak[];
  best: Streak[];
  volatility: { mood: number; stress: number; energy: number };
} {
  // Aggregate by day
  const dailyMap = new Map<string, { mood: number[]; stress: number[]; energy: number[] }>();
  for (const e of entries) {
    const day = toDayKey(e.createdAt);
    if (!dailyMap.has(day)) {
      dailyMap.set(day, { mood: [], stress: [], energy: [] });
    }
    const data = dailyMap.get(day)!;
    data.mood.push(e.mood);
    data.stress.push(e.stress);
    data.energy.push(e.energy);
  }

  const sortedDays = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, data]) => ({
      day,
      avgMood: avg(data.mood),
      avgStress: avg(data.stress),
      avgEnergy: avg(data.energy),
    }));

  // Compute volatility
  const volatility = {
    mood: round2(stddev(sortedDays.map((d) => d.avgMood))),
    stress: round2(stddev(sortedDays.map((d) => d.avgStress))),
    energy: round2(stddev(sortedDays.map((d) => d.avgEnergy))),
  };

  // Define streak types
  const streakDefs = [
    { type: 'good_mood', metric: 'mood' as const, direction: 'above' as const, threshold: 7, getter: (d: typeof sortedDays[0]) => d.avgMood >= 7 },
    { type: 'low_mood', metric: 'mood' as const, direction: 'below' as const, threshold: 3, getter: (d: typeof sortedDays[0]) => d.avgMood <= 3 },
    { type: 'high_stress', metric: 'stress' as const, direction: 'above' as const, threshold: 7, getter: (d: typeof sortedDays[0]) => d.avgStress >= 7 },
    { type: 'low_stress', metric: 'stress' as const, direction: 'below' as const, threshold: 3, getter: (d: typeof sortedDays[0]) => d.avgStress <= 3 },
    { type: 'high_energy', metric: 'energy' as const, direction: 'above' as const, threshold: 7, getter: (d: typeof sortedDays[0]) => d.avgEnergy >= 7 },
  ];

  const current: Streak[] = [];
  const best: Streak[] = [];

  for (const def of streakDefs) {
    let bestStreak = { length: 0, start: '', end: '' };
    let currentStreak = { length: 0, start: '', end: '' };

    for (const d of sortedDays) {
      if (def.getter(d)) {
        if (currentStreak.length === 0) {
          currentStreak.start = d.day;
        }
        currentStreak.length++;
        currentStreak.end = d.day;
      } else {
        if (currentStreak.length > bestStreak.length) {
          bestStreak = { ...currentStreak };
        }
        currentStreak = { length: 0, start: '', end: '' };
      }
    }

    // Check if the streak is still active (ends on the last day)
    if (currentStreak.length > bestStreak.length) {
      bestStreak = { ...currentStreak };
    }

    if (bestStreak.length >= 2) {
      best.push({
        type: def.type,
        length: bestStreak.length,
        startDate: bestStreak.start,
        endDate: bestStreak.end,
        metric: def.metric,
        direction: def.direction,
        threshold: def.threshold,
      });
    }

    // Current streak: only if it ends on the last day
    if (currentStreak.length >= 2 && sortedDays.length > 0 && currentStreak.end === sortedDays[sortedDays.length - 1].day) {
      current.push({
        type: def.type,
        length: currentStreak.length,
        startDate: currentStreak.start,
        endDate: currentStreak.end,
        metric: def.metric,
        direction: def.direction,
        threshold: def.threshold,
      });
    }
  }

  return { current, best, volatility };
}

export function computeRecoveryPatterns(entries: EntryMetrics[]): {
  avgRecoveryDays: number;
  recoveryInstances: number;
} {
  // Aggregate by day
  const dailyMap = new Map<string, number[]>();
  for (const e of entries) {
    const day = toDayKey(e.createdAt);
    if (!dailyMap.has(day)) dailyMap.set(day, []);
    dailyMap.get(day)!.push(e.mood);
  }

  const sortedDays = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, moods]) => ({ day, avgMood: avg(moods) }));

  const overallBaseline = avg(sortedDays.map((d) => d.avgMood));
  const LOW_THRESHOLD = 4;

  const recoveryTimes: number[] = [];
  let i = 0;

  while (i < sortedDays.length) {
    if (sortedDays[i].avgMood < LOW_THRESHOLD) {
      // Found a bad day, count days until recovery
      let j = i + 1;
      while (j < sortedDays.length && sortedDays[j].avgMood < overallBaseline) {
        j++;
      }
      if (j < sortedDays.length) {
        recoveryTimes.push(j - i);
      }
      i = j;
    } else {
      i++;
    }
  }

  return {
    avgRecoveryDays: recoveryTimes.length > 0 ? round2(avg(recoveryTimes)) : 0,
    recoveryInstances: recoveryTimes.length,
  };
}

export function computeTagCombinations(
  entries: EntryWithTags[],
  baseline: { mood: number; stress: number; energy: number }
): {
  tagAnalysis: TagFrequencyAnalysis[];
  combinations: TagCombination[];
  negativeCorrelations: Array<{ tag: string; metric: string; deviation: number; entryCount: number }>;
} {
  const MAX_TAGS = 100;
  const MAX_COMBO_TAGS = 20;
  const MAX_PAIRS = 50;

  // Count tag frequency for sorting
  const tagCounts = new Map<string, number>();
  for (const e of entries) {
    for (const tag of e.tags) {
      // Skip tags we haven't seen if we've hit the cap, but still count known tags
      if (!tagCounts.has(tag) && tagCounts.size >= MAX_TAGS) continue;
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Per-tag analysis
  const tagMetrics = new Map<string, { mood: number[]; stress: number[]; energy: number[] }>();
  const lowMoodEntries = entries.filter((e) => e.mood < 4);
  const highMoodEntries = entries.filter((e) => e.mood > 7);
  const tagInLowMood = new Map<string, number>();
  const tagInHighMood = new Map<string, number>();

  for (const e of entries) {
    for (const tag of e.tags) {
      if (!tagCounts.has(tag)) continue;
      if (!tagMetrics.has(tag)) {
        tagMetrics.set(tag, { mood: [], stress: [], energy: [] });
      }
      const data = tagMetrics.get(tag)!;
      data.mood.push(e.mood);
      data.stress.push(e.stress);
      data.energy.push(e.energy);
    }
  }

  for (const e of lowMoodEntries) {
    for (const tag of e.tags) {
      if (tagCounts.has(tag)) {
        tagInLowMood.set(tag, (tagInLowMood.get(tag) || 0) + 1);
      }
    }
  }

  for (const e of highMoodEntries) {
    for (const tag of e.tags) {
      if (tagCounts.has(tag)) {
        tagInHighMood.set(tag, (tagInHighMood.get(tag) || 0) + 1);
      }
    }
  }

  const tagAnalysis: TagFrequencyAnalysis[] = Array.from(tagMetrics.entries()).map(([tag, data]) => {
    const averages = {
      mood: round2(avg(data.mood)),
      stress: round2(avg(data.stress)),
      energy: round2(avg(data.energy)),
    };
    const deviations = {
      mood: baseline.mood !== 0 ? round2(((averages.mood - baseline.mood) / baseline.mood) * 100) : 0,
      stress: baseline.stress !== 0 ? round2(((averages.stress - baseline.stress) / baseline.stress) * 100) : 0,
      energy: baseline.energy !== 0 ? round2(((averages.energy - baseline.energy) / baseline.energy) * 100) : 0,
    };

    const freqLow = lowMoodEntries.length > 0
      ? round2((tagInLowMood.get(tag) || 0) / lowMoodEntries.length)
      : 0;
    const freqHigh = highMoodEntries.length > 0
      ? round2((tagInHighMood.get(tag) || 0) / highMoodEntries.length)
      : 0;

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (deviations.mood > 10) impact = 'positive';
    else if (deviations.mood < -10) impact = 'negative';

    return {
      tag,
      entryCount: data.mood.length,
      averages,
      deviations,
      frequencyInLowMood: freqLow,
      frequencyInHighMood: freqHigh,
      impact,
    };
  });

  // Tag combinations - top N most frequent tags
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_COMBO_TAGS)
    .map(([tag]) => tag);

  const pairMetrics = new Map<string, number[]>();
  for (const e of entries) {
    const entryTopTags = e.tags.filter((t) => topTags.includes(t));
    for (let i = 0; i < entryTopTags.length; i++) {
      for (let j = i + 1; j < entryTopTags.length; j++) {
        const key = [entryTopTags[i], entryTopTags[j]].sort().join('|||');
        if (!pairMetrics.has(key)) pairMetrics.set(key, []);
        pairMetrics.get(key)!.push(e.mood);
      }
    }
  }

  const combinations: TagCombination[] = Array.from(pairMetrics.entries())
    .filter(([, moods]) => moods.length >= 2)
    .map(([key, moods]) => {
      const [t1, t2] = key.split('|||');
      const avgMood = round2(avg(moods));
      return {
        tags: [t1, t2] as [string, string],
        coOccurrences: moods.length,
        avgMood,
        moodDeviation: baseline.mood !== 0 ? round2(((avgMood - baseline.mood) / baseline.mood) * 100) : 0,
      };
    })
    .sort((a, b) => Math.abs(b.moodDeviation) - Math.abs(a.moodDeviation))
    .slice(0, MAX_PAIRS);

  // Negative correlations
  const DEVIATION_THRESHOLD = 15;
  const negativeCorrelations: Array<{ tag: string; metric: string; deviation: number; entryCount: number }> = [];

  for (const ta of tagAnalysis) {
    if (ta.entryCount < 2) continue;
    for (const metric of ['mood', 'energy'] as const) {
      if (ta.deviations[metric] < -DEVIATION_THRESHOLD) {
        negativeCorrelations.push({
          tag: ta.tag,
          metric,
          deviation: ta.deviations[metric],
          entryCount: ta.entryCount,
        });
      }
    }
    if (ta.deviations.stress > DEVIATION_THRESHOLD) {
      negativeCorrelations.push({
        tag: ta.tag,
        metric: 'stress',
        deviation: ta.deviations.stress,
        entryCount: ta.entryCount,
      });
    }
  }

  negativeCorrelations.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  return { tagAnalysis, combinations, negativeCorrelations };
}
