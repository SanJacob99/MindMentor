import type { BucketResult, WeekdayResult, Streak, TagFrequencyAnalysis, TagCombination } from './patternAnalysis';
import type { KeywordResult, EmotionBreakdownEntry } from './textAnalysis';

const MAX_INSIGHTS = 10;

export function generateTimeInsights(
  hourlyBuckets: BucketResult[],
  bestBucket: string,
  worstBucket: string,
  weekdayDays: WeekdayResult[],
  bestDay: string,
  worstDay: string,
  trendDirection: { mood: string; stress: string; energy: string }
): string[] {
  const insights: string[] = [];

  // Time-of-day insights
  const bestB = hourlyBuckets.find((b) => b.bucket === bestBucket);
  const worstB = hourlyBuckets.find((b) => b.bucket === worstBucket);
  if (bestB && worstB && bestBucket !== worstBucket && bestB.entryCount >= 2 && worstB.entryCount >= 2) {
    const diff = Math.round(((bestB.avgMood - worstB.avgMood) / Math.max(worstB.avgMood, 0.1)) * 100);
    if (Math.abs(diff) >= 10) {
      insights.push(
        `Your mood tends to be ${Math.abs(diff)}% higher in the ${bestBucket} compared to ${worstBucket}.`
      );
    }
  }

  // Weekday insights
  const bestDayData = weekdayDays.find((d) => d.day === bestDay);
  const worstDayData = weekdayDays.find((d) => d.day === worstDay);
  if (bestDayData && worstDayData && bestDay !== worstDay && bestDayData.entryCount >= 2 && worstDayData.entryCount >= 2) {
    insights.push(`${bestDay} tends to be your best day for mood, while ${worstDay} is typically your lowest.`);
  }

  // High stress weekday
  const highStressDay = weekdayDays
    .filter((d) => d.entryCount >= 2)
    .reduce((max, d) => (d.avgStress > max.avgStress ? d : max), weekdayDays[0]);
  if (highStressDay && highStressDay.avgStress >= 6 && highStressDay.entryCount >= 2) {
    insights.push(`${highStressDay.day}s tend to be your most stressful day of the week.`);
  }

  // Trend insights
  if (trendDirection.mood === 'improving') {
    insights.push('Your overall mood has been improving over the recent weeks.');
  } else if (trendDirection.mood === 'declining') {
    insights.push('Your mood has been trending downward recently. Consider what might be contributing.');
  }

  if (trendDirection.stress === 'declining') {
    insights.push('Your stress levels have been increasing recently.');
  } else if (trendDirection.stress === 'improving') {
    insights.push('Great news — your stress levels have been decreasing.');
  }

  return insights.slice(0, MAX_INSIGHTS);
}

export function generateStreakInsights(
  currentStreaks: Streak[],
  bestStreaks: Streak[],
  volatility: { mood: number; stress: number; energy: number },
  recovery: { avgRecoveryDays: number; recoveryInstances: number }
): string[] {
  const insights: string[] = [];

  // Current streaks
  for (const streak of currentStreaks) {
    if (streak.type === 'good_mood' && streak.length >= 3) {
      insights.push(`You're on a ${streak.length}-day good mood streak! Keep it up!`);
    }
    if (streak.type === 'low_mood' && streak.length >= 2) {
      insights.push(`Your mood has been low for ${streak.length} consecutive days. Consider reaching out for support.`);
    }
    if (streak.type === 'high_stress' && streak.length >= 3) {
      insights.push(`You've had ${streak.length} consecutive high-stress days. Consider taking a break.`);
    }
    if (streak.type === 'low_stress' && streak.length >= 3) {
      insights.push(`You've maintained low stress for ${streak.length} days straight — well done!`);
    }
    if (streak.type === 'high_energy' && streak.length >= 3) {
      insights.push(`${streak.length} days of high energy! Your routine seems to be working.`);
    }
  }

  // Best streaks
  const bestGoodMood = bestStreaks.find((s) => s.type === 'good_mood');
  if (bestGoodMood && bestGoodMood.length >= 5) {
    insights.push(`Your longest good mood streak was ${bestGoodMood.length} days (${bestGoodMood.startDate} to ${bestGoodMood.endDate}).`);
  }

  // Volatility
  if (volatility.mood > 2.5) {
    insights.push('Your mood has been quite volatile. Tracking triggers could help identify patterns.');
  } else if (volatility.mood < 1.0 && volatility.mood > 0) {
    insights.push('Your mood has been very stable recently.');
  }

  // Recovery
  if (recovery.recoveryInstances >= 2) {
    insights.push(`After a tough day, you typically recover within ${recovery.avgRecoveryDays} days.`);
  }

  return insights.slice(0, MAX_INSIGHTS);
}

export function generateTagInsights(
  tagAnalysis: TagFrequencyAnalysis[],
  combinations: TagCombination[],
  negativeCorrelations: Array<{ tag: string; metric: string; deviation: number; entryCount: number }>
): string[] {
  const insights: string[] = [];

  // Top positive tags
  const positiveTags = tagAnalysis
    .filter((t) => t.impact === 'positive' && t.entryCount >= 2)
    .sort((a, b) => b.deviations.mood - a.deviations.mood);

  for (const tag of positiveTags.slice(0, 2)) {
    insights.push(
      `Entries tagged '${tag.tag}' show ${Math.abs(tag.deviations.mood)}% higher mood than your baseline.`
    );
  }

  // Negative correlations
  for (const nc of negativeCorrelations.slice(0, 2)) {
    if (nc.metric === 'stress') {
      insights.push(
        `'${nc.tag}' is associated with ${Math.abs(nc.deviation)}% higher stress.`
      );
    } else {
      insights.push(
        `'${nc.tag}' is associated with ${Math.abs(nc.deviation)}% lower ${nc.metric}.`
      );
    }
  }

  // Best combination
  const bestCombo = combinations.find((c) => c.moodDeviation > 15);
  if (bestCombo) {
    insights.push(
      `The combination of '${bestCombo.tags[0]}' + '${bestCombo.tags[1]}' produces your best mood scores (${Math.abs(bestCombo.moodDeviation)}% above baseline).`
    );
  }

  // Frequency in low vs high mood
  for (const tag of tagAnalysis.slice(0, 10)) {
    if (tag.frequencyInHighMood > 0.4 && tag.frequencyInLowMood < 0.1 && tag.entryCount >= 3) {
      insights.push(
        `'${tag.tag}' appears in ${Math.round(tag.frequencyInHighMood * 100)}% of your good days but rarely on bad days.`
      );
      break;
    }
  }

  return insights.slice(0, MAX_INSIGHTS);
}

export function generateTextInsights(
  keywords: KeywordResult[],
  sentimentDirection: string,
  emotions: EmotionBreakdownEntry[],
  baselineMood: number
): string[] {
  const insights: string[] = [];

  // Keywords with low mood correlation
  const lowMoodKeywords = keywords.filter(
    (k) => k.avgMoodWhenMentioned < baselineMood - 1 && k.count >= 3
  );
  for (const kw of lowMoodKeywords.slice(0, 2)) {
    insights.push(
      `Your entries mentioning '${kw.word}' have below-average mood (${kw.avgMoodWhenMentioned} vs ${Math.round(baselineMood * 100) / 100} baseline).`
    );
  }

  // Keywords with high mood correlation
  const highMoodKeywords = keywords.filter(
    (k) => k.avgMoodWhenMentioned > baselineMood + 1 && k.count >= 3
  );
  for (const kw of highMoodKeywords.slice(0, 2)) {
    insights.push(
      `Entries mentioning '${kw.word}' consistently show higher mood (${kw.avgMoodWhenMentioned}).`
    );
  }

  // Sentiment trend
  if (sentimentDirection === 'improving') {
    insights.push('Your writing sentiment has been trending more positive recently.');
  } else if (sentimentDirection === 'declining') {
    insights.push('Your journal sentiment has been trending more negative recently.');
  }

  // Primary emotion
  if (emotions.length > 0) {
    const primary = emotions[0];
    if (primary.percentage >= 30) {
      insights.push(
        `Your most common emotional state in journal entries: ${primary.emotion} (${primary.percentage}% of entries).`
      );
    }
  }

  return insights.slice(0, 8);
}
