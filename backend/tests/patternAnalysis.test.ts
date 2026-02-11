import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  computeHourlyPatterns,
  computeWeekdayPatterns,
  computeMonthlyTrend,
  computeStreaks,
  computeRecoveryPatterns,
  computeTagCombinations,
} from '../src/utils/patternAnalysis';

function makeEntry(dateStr: string, mood: number, stress: number, energy: number) {
  return { createdAt: new Date(dateStr), mood, stress, energy };
}

function makeTagEntry(dateStr: string, mood: number, stress: number, energy: number, tags: string[]) {
  return { createdAt: new Date(dateStr), mood, stress, energy, tags };
}

describe('computeHourlyPatterns', () => {
  test('groups entries into time-of-day buckets', () => {
    const entries = [
      makeEntry('2026-02-01T08:00:00Z', 8, 3, 7), // morning
      makeEntry('2026-02-01T09:00:00Z', 7, 4, 6), // morning
      makeEntry('2026-02-01T14:00:00Z', 5, 6, 5), // afternoon
      makeEntry('2026-02-01T20:00:00Z', 4, 7, 4), // evening
      makeEntry('2026-02-02T02:00:00Z', 3, 5, 3), // night
    ];

    const result = computeHourlyPatterns(entries);
    assert.strictEqual(result.bestBucket, 'morning');
    assert.strictEqual(result.worstBucket, 'night');

    const morning = result.buckets.find(b => b.bucket === 'morning')!;
    assert.strictEqual(morning.entryCount, 2);
    assert.strictEqual(morning.avgMood, 7.5);
  });

  test('handles empty entries', () => {
    const result = computeHourlyPatterns([]);
    assert.strictEqual(result.buckets.length, 4);
    result.buckets.forEach(b => assert.strictEqual(b.entryCount, 0));
  });

  test('applies timezone offset correctly', () => {
    // Entry at 5:00 UTC should be morning (8:00) with +180 offset (3 hours)
    const entries = [makeEntry('2026-02-01T05:00:00Z', 7, 3, 6)];
    const result = computeHourlyPatterns(entries, 180);
    const morning = result.buckets.find(b => b.bucket === 'morning')!;
    assert.strictEqual(morning.entryCount, 1);
  });
});

describe('computeWeekdayPatterns', () => {
  test('groups entries by day of week', () => {
    const entries = [
      makeEntry('2026-02-02T12:00:00Z', 8, 3, 7), // Monday
      makeEntry('2026-02-03T12:00:00Z', 5, 6, 5), // Tuesday
      makeEntry('2026-02-07T12:00:00Z', 9, 2, 8), // Saturday
      makeEntry('2026-02-08T12:00:00Z', 8, 3, 7), // Sunday
    ];

    const result = computeWeekdayPatterns(entries);
    assert.strictEqual(result.bestDay, 'Sat');
    assert.strictEqual(result.worstDay, 'Tue');
  });

  test('handles single entry', () => {
    const entries = [makeEntry('2026-02-02T12:00:00Z', 7, 3, 6)];
    const result = computeWeekdayPatterns(entries);
    assert.strictEqual(result.days.length, 7);
    const mon = result.days.find(d => d.day === 'Mon')!;
    assert.strictEqual(mon.entryCount, 1);
    assert.strictEqual(mon.avgMood, 7);
  });
});

describe('computeMonthlyTrend', () => {
  test('detects improving mood trend', () => {
    const entries = [
      makeEntry('2026-01-06T12:00:00Z', 4, 6, 4),
      makeEntry('2026-01-07T12:00:00Z', 4, 6, 4),
      makeEntry('2026-01-13T12:00:00Z', 5, 5, 5),
      makeEntry('2026-01-14T12:00:00Z', 6, 4, 6),
      makeEntry('2026-01-20T12:00:00Z', 7, 3, 7),
      makeEntry('2026-01-21T12:00:00Z', 7, 3, 7),
      makeEntry('2026-01-27T12:00:00Z', 8, 2, 8),
      makeEntry('2026-01-28T12:00:00Z', 9, 2, 9),
    ];

    const result = computeMonthlyTrend(entries);
    assert.strictEqual(result.direction.mood, 'improving');
    assert.ok(result.slopes.mood > 0);
    assert.ok(result.weeks.length >= 3);
  });

  test('detects stable mood', () => {
    const entries = [
      makeEntry('2026-01-06T12:00:00Z', 6, 4, 6),
      makeEntry('2026-01-13T12:00:00Z', 6, 4, 6),
      makeEntry('2026-01-20T12:00:00Z', 6, 4, 6),
      makeEntry('2026-01-27T12:00:00Z', 6, 4, 6),
    ];

    const result = computeMonthlyTrend(entries);
    assert.strictEqual(result.direction.mood, 'stable');
  });

  test('handles empty entries', () => {
    const result = computeMonthlyTrend([]);
    assert.strictEqual(result.weeks.length, 0);
    assert.strictEqual(result.direction.mood, 'stable');
  });
});

describe('computeStreaks', () => {
  test('detects current good mood streak', () => {
    const entries = [
      makeEntry('2026-02-05T12:00:00Z', 5, 4, 5),
      makeEntry('2026-02-06T12:00:00Z', 8, 3, 7),
      makeEntry('2026-02-07T12:00:00Z', 8, 3, 7),
      makeEntry('2026-02-08T12:00:00Z', 9, 2, 8),
    ];

    const result = computeStreaks(entries);
    const currentGood = result.current.find(s => s.type === 'good_mood');
    assert.ok(currentGood);
    assert.strictEqual(currentGood!.length, 3);
  });

  test('detects best streak even when not current', () => {
    const entries = [
      makeEntry('2026-01-01T12:00:00Z', 8, 3, 7),
      makeEntry('2026-01-02T12:00:00Z', 9, 2, 8),
      makeEntry('2026-01-03T12:00:00Z', 8, 3, 7),
      makeEntry('2026-01-04T12:00:00Z', 5, 5, 5), // break
      makeEntry('2026-01-05T12:00:00Z', 8, 3, 7),
      makeEntry('2026-01-06T12:00:00Z', 5, 5, 5), // not a streak ending on last day
    ];

    const result = computeStreaks(entries);
    const bestGood = result.best.find(s => s.type === 'good_mood');
    assert.ok(bestGood);
    assert.strictEqual(bestGood!.length, 3); // first 3 days
  });

  test('computes volatility', () => {
    const entries = [
      makeEntry('2026-02-01T12:00:00Z', 2, 8, 3),
      makeEntry('2026-02-02T12:00:00Z', 9, 1, 8),
      makeEntry('2026-02-03T12:00:00Z', 3, 7, 2),
      makeEntry('2026-02-04T12:00:00Z', 8, 2, 9),
    ];

    const result = computeStreaks(entries);
    assert.ok(result.volatility.mood > 2); // high volatility
  });

  test('handles empty entries', () => {
    const result = computeStreaks([]);
    assert.deepStrictEqual(result.current, []);
    assert.deepStrictEqual(result.best, []);
  });
});

describe('computeRecoveryPatterns', () => {
  test('calculates recovery time after bad days', () => {
    const entries = [
      makeEntry('2026-02-01T12:00:00Z', 7, 3, 7), // good (baseline ~5.8)
      makeEntry('2026-02-02T12:00:00Z', 3, 7, 3), // bad day (< 4)
      makeEntry('2026-02-03T12:00:00Z', 4, 5, 4), // still below baseline
      makeEntry('2026-02-04T12:00:00Z', 6, 4, 6), // recovered above baseline
      makeEntry('2026-02-05T12:00:00Z', 7, 3, 7), // good
    ];

    const result = computeRecoveryPatterns(entries);
    assert.ok(result.recoveryInstances >= 1);
    assert.ok(result.avgRecoveryDays > 0);
  });

  test('handles no bad days', () => {
    const entries = [
      makeEntry('2026-02-01T12:00:00Z', 7, 3, 7),
      makeEntry('2026-02-02T12:00:00Z', 8, 2, 8),
    ];

    const result = computeRecoveryPatterns(entries);
    assert.strictEqual(result.recoveryInstances, 0);
    assert.strictEqual(result.avgRecoveryDays, 0);
  });
});

describe('computeTagCombinations', () => {
  test('analyzes tag impacts and combinations', () => {
    const baseline = { mood: 5, stress: 5, energy: 5 };
    const entries = [
      makeTagEntry('2026-02-01T12:00:00Z', 8, 2, 8, ['exercise', 'outdoors']),
      makeTagEntry('2026-02-02T12:00:00Z', 7, 3, 7, ['exercise', 'outdoors']),
      makeTagEntry('2026-02-03T12:00:00Z', 3, 8, 3, ['work', 'deadline']),
      makeTagEntry('2026-02-04T12:00:00Z', 4, 7, 4, ['work', 'deadline']),
      makeTagEntry('2026-02-05T12:00:00Z', 5, 5, 5, ['social']),
      makeTagEntry('2026-02-06T12:00:00Z', 6, 4, 6, ['social']),
    ];

    const result = computeTagCombinations(entries, baseline);

    // Check tag analysis
    assert.ok(result.tagAnalysis.length > 0);
    const exercise = result.tagAnalysis.find(t => t.tag === 'exercise');
    assert.ok(exercise);
    assert.strictEqual(exercise!.impact, 'positive');

    const work = result.tagAnalysis.find(t => t.tag === 'work');
    assert.ok(work);
    assert.strictEqual(work!.impact, 'negative');

    // Check combinations
    assert.ok(result.combinations.length > 0);
    const exOutdoors = result.combinations.find(c =>
      c.tags.includes('exercise') && c.tags.includes('outdoors')
    );
    assert.ok(exOutdoors);
    assert.ok(exOutdoors!.moodDeviation > 0);

    // Check negative correlations
    assert.ok(result.negativeCorrelations.length > 0);
  });

  test('handles entries without tags', () => {
    const baseline = { mood: 5, stress: 5, energy: 5 };
    const entries = [
      makeTagEntry('2026-02-01T12:00:00Z', 7, 3, 7, []),
      makeTagEntry('2026-02-02T12:00:00Z', 6, 4, 6, []),
    ];

    const result = computeTagCombinations(entries, baseline);
    assert.strictEqual(result.tagAnalysis.length, 0);
    assert.strictEqual(result.combinations.length, 0);
  });
});
