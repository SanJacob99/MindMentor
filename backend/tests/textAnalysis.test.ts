import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  analyzeSentiment,
  extractKeywords,
  classifyEmotion,
  computeEmotionBreakdown,
} from '../src/utils/textAnalysis';

describe('analyzeSentiment', () => {
  test('scores positive text positively', () => {
    const result = analyzeSentiment('I feel happy and grateful today, everything is wonderful');
    assert.ok(result.score > 0);
    assert.ok(result.positiveWords.length > 0);
    assert.ok(result.positiveWords.includes('happy'));
  });

  test('scores negative text negatively', () => {
    const result = analyzeSentiment('I feel terrible and anxious, everything is miserable');
    assert.ok(result.score < 0);
    assert.ok(result.negativeWords.length > 0);
    assert.ok(result.negativeWords.includes('terrible'));
  });

  test('scores neutral text near zero', () => {
    const result = analyzeSentiment('I went to the store and bought some groceries');
    assert.strictEqual(result.score, 0);
  });

  test('handles empty string', () => {
    const result = analyzeSentiment('');
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.wordCount, 0);
  });

  test('normalizes score to -1..1 range', () => {
    const result = analyzeSentiment('happy happy happy wonderful amazing fantastic excellent');
    assert.ok(result.score <= 1);
    assert.ok(result.score >= -1);
  });
});

describe('extractKeywords', () => {
  test('extracts frequent keywords with mood correlation', () => {
    const entries = [
      { text: 'Had a meeting at work today about the project', mood: 5 },
      { text: 'Work was stressful, too many meetings', mood: 3 },
      { text: 'Went for a walk in the park, very relaxing', mood: 8 },
      { text: 'Another walk in the park today', mood: 7 },
      { text: 'Work project deadline approaching', mood: 4 },
    ];

    const keywords = extractKeywords(entries);
    assert.ok(keywords.length > 0);

    const work = keywords.find(k => k.word === 'work');
    assert.ok(work);
    assert.ok(work!.count >= 2);
    assert.ok(work!.avgMoodWhenMentioned < 5); // work entries have lower mood

    const walk = keywords.find(k => k.word === 'walk');
    assert.ok(walk);
    assert.ok(walk!.avgMoodWhenMentioned > 6); // walk entries have higher mood
  });

  test('filters stop words', () => {
    const entries = [
      { text: 'I am going to the store and then the park', mood: 5 },
      { text: 'I am going to the store and then the park again', mood: 5 },
    ];

    const keywords = extractKeywords(entries);
    const stopWord = keywords.find(k => k.word === 'the');
    assert.strictEqual(stopWord, undefined);
  });

  test('handles empty entries', () => {
    const keywords = extractKeywords([]);
    assert.strictEqual(keywords.length, 0);
  });

  test('respects maxKeywords limit', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      text: `word${i} word${i} another${i} unique${i} special${i}`,
      mood: 5,
    }));
    // Each word appears once per entry, but we need >= 2 mentions
    const keywords = extractKeywords(entries, 5);
    assert.ok(keywords.length <= 5);
  });
});

describe('classifyEmotion', () => {
  test('classifies happy text', () => {
    const result = classifyEmotion('I am so happy and excited about today');
    assert.strictEqual(result.primary, 'happy');
    assert.ok(result.confidence > 0.3);
  });

  test('classifies anxious text', () => {
    const result = classifyEmotion('I feel so anxious and worried about everything');
    assert.strictEqual(result.primary, 'anxious');
  });

  test('classifies angry text', () => {
    const result = classifyEmotion('I am so angry and frustrated with this situation');
    assert.strictEqual(result.primary, 'angry');
  });

  test('classifies calm text', () => {
    const result = classifyEmotion('I feel calm and peaceful after meditation');
    assert.strictEqual(result.primary, 'calm');
  });

  test('returns neutral for unrecognizable text', () => {
    const result = classifyEmotion('The sky is blue and the grass is green');
    assert.strictEqual(result.primary, 'neutral');
  });

  test('handles empty text', () => {
    const result = classifyEmotion('');
    assert.strictEqual(result.primary, 'neutral');
  });
});

describe('computeEmotionBreakdown', () => {
  test('computes emotion distribution', () => {
    const entries = [
      { text: 'I am so happy and excited', mood: 8 },
      { text: 'I feel calm and peaceful', mood: 7 },
      { text: 'I am anxious and worried', mood: 3 },
      { text: 'I am angry and frustrated', mood: 2 },
      { text: 'I feel happy and joyful', mood: 9 },
    ];

    const breakdown = computeEmotionBreakdown(entries);
    assert.ok(breakdown.length > 0);
    const total = breakdown.reduce((sum, b) => sum + b.percentage, 0);
    assert.ok(total >= 95 && total <= 105); // roughly 100% (rounding)

    // Happy should be most common (2 out of 5)
    assert.strictEqual(breakdown[0].emotion, 'happy');
  });

  test('handles empty entries', () => {
    const breakdown = computeEmotionBreakdown([]);
    assert.strictEqual(breakdown.length, 0);
  });

  test('handles entries without text', () => {
    const entries = [
      { text: '', mood: 5 },
      { text: '', mood: 6 },
    ];
    const breakdown = computeEmotionBreakdown(entries);
    assert.strictEqual(breakdown.length, 0);
  });
});
