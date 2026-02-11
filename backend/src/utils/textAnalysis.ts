// AFINN-style sentiment lexicon (~200 words, scores -3 to +3)
const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive words
  happy: 3, joy: 3, wonderful: 3, amazing: 3, excellent: 3, fantastic: 3,
  love: 3, loved: 3, grateful: 3, blessed: 3, thrilled: 3, ecstatic: 3,
  great: 2, good: 2, nice: 2, pleased: 2, glad: 2, content: 2,
  enjoyed: 2, peaceful: 2, calm: 2, relaxed: 2, comfortable: 2, confident: 2,
  motivated: 2, inspired: 2, proud: 2, accomplished: 2, hopeful: 2,
  optimistic: 2, cheerful: 2, delighted: 2, excited: 2, enthusiastic: 2,
  fun: 2, laugh: 2, smiled: 2, smile: 2, beautiful: 2, success: 2,
  better: 1, okay: 1, fine: 1, decent: 1, improved: 1, progress: 1,
  manageable: 1, productive: 1, satisfying: 1, interesting: 1, helpful: 1,
  relief: 1, rested: 1, energized: 1, focused: 1, balanced: 1,
  // Negative words
  terrible: -3, horrible: -3, awful: -3, miserable: -3, devastated: -3,
  hopeless: -3, worthless: -3, unbearable: -3, agonizing: -3, despair: -3,
  hate: -3, hated: -3, furious: -3, enraged: -3, suicidal: -3,
  anxious: -2, stressed: -2, worried: -2, nervous: -2, angry: -2,
  sad: -2, depressed: -2, frustrated: -2, irritated: -2, annoyed: -2,
  overwhelmed: -2, exhausted: -2, drained: -2, lonely: -2, isolated: -2,
  crying: -2, cried: -2, panic: -2, fearful: -2, scared: -2, afraid: -2,
  upset: -2, disappointed: -2, hurt: -2, rejected: -2, insecure: -2,
  guilty: -2, ashamed: -2, helpless: -2, trapped: -2, stuck: -2,
  painful: -2, suffering: -2, struggling: -2, broken: -2, failed: -2,
  tired: -1, bored: -1, restless: -1, uneasy: -1, tense: -1,
  distracted: -1, confused: -1, uncertain: -1, unsure: -1, mediocre: -1,
  difficult: -1, tough: -1, hard: -1, challenging: -1, busy: -1,
  sluggish: -1, lazy: -1, unmotivated: -1, low: -1, down: -1,
  bad: -1, worse: -1, poor: -1, lacking: -1, missing: -1,
};

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
  'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above',
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
  't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
  'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'today', 'yesterday', 'tomorrow', 'day', 'week', 'month',
  'really', 'also', 'got', 'went', 'going', 'like', 'much', 'lot', 'bit',
  'still', 'even', 'well', 'back', 'thing', 'things', 'time', 'feel', 'feeling',
  'felt', 'get', 'make', 'made', 'think', 'know', 'want', 'need', 'take', 'come',
]);

const EMOTION_KEYWORDS: Record<string, string[]> = {
  happy: ['happy', 'joy', 'joyful', 'excited', 'grateful', 'wonderful', 'amazing',
    'fantastic', 'great', 'blessed', 'thrilled', 'ecstatic', 'delighted', 'cheerful',
    'pleased', 'glad', 'fun', 'laugh', 'celebrate'],
  sad: ['sad', 'crying', 'cried', 'lonely', 'hopeless', 'depressed', 'grief',
    'mourning', 'heartbroken', 'disappointed', 'miserable', 'empty', 'lost',
    'hurt', 'pain', 'suffering'],
  anxious: ['anxious', 'worried', 'nervous', 'panic', 'afraid', 'scared', 'fearful',
    'overwhelmed', 'uneasy', 'restless', 'tense', 'dread', 'stress', 'stressed',
    'insecure', 'uncertain'],
  angry: ['angry', 'frustrated', 'furious', 'annoyed', 'irritated', 'enraged',
    'mad', 'resentful', 'bitter', 'hostile', 'agitated', 'livid', 'outraged',
    'hate', 'hated'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'content', 'tranquil', 'quiet',
    'still', 'centered', 'grounded', 'mindful', 'meditated', 'rested', 'balanced',
    'comfortable', 'at ease'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export interface SentimentResult {
  score: number; // normalized -1 to 1
  wordCount: number;
  positiveWords: string[];
  negativeWords: string[];
}

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, wordCount: 0, positiveWords: [], negativeWords: [] };
  }

  const words = tokenize(text);
  let totalScore = 0;
  let scoredCount = 0;
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];

  for (const word of words) {
    const score = SENTIMENT_LEXICON[word];
    if (score !== undefined) {
      totalScore += score;
      scoredCount++;
      if (score > 0 && !positiveWords.includes(word)) positiveWords.push(word);
      if (score < 0 && !negativeWords.includes(word)) negativeWords.push(word);
    }
  }

  // Normalize to -1..1 range (max possible per word is 3)
  const normalized = scoredCount > 0 ? Math.max(-1, Math.min(1, totalScore / (scoredCount * 3))) : 0;

  return {
    score: Math.round(normalized * 100) / 100,
    wordCount: words.length,
    positiveWords: positiveWords.slice(0, 10),
    negativeWords: negativeWords.slice(0, 10),
  };
}

export interface KeywordResult {
  word: string;
  count: number;
  avgMoodWhenMentioned: number;
}

export interface EntryText {
  text: string;
  mood: number;
}

export function extractKeywords(entries: EntryText[], maxKeywords = 30): KeywordResult[] {
  const wordData = new Map<string, { count: number; moods: number[] }>();

  for (const entry of entries) {
    if (!entry.text) continue;
    // Truncate to first 1000 chars for performance
    const truncated = entry.text.slice(0, 1000);
    const words = tokenize(truncated);
    // Use a set to count each word once per entry
    const seen = new Set<string>();

    for (const word of words) {
      if (STOP_WORDS.has(word)) continue;
      if (word.length < 3) continue;
      if (seen.has(word)) continue;
      seen.add(word);

      if (!wordData.has(word)) {
        wordData.set(word, { count: 0, moods: [] });
      }
      const data = wordData.get(word)!;
      data.count++;
      data.moods.push(entry.mood);
    }
  }

  return Array.from(wordData.entries())
    .filter(([, data]) => data.count >= 2) // Must appear in at least 2 entries
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxKeywords)
    .map(([word, data]) => ({
      word,
      count: data.count,
      avgMoodWhenMentioned: Math.round(
        (data.moods.reduce((a, b) => a + b, 0) / data.moods.length) * 100
      ) / 100,
    }));
}

export interface EmotionClassification {
  primary: string;
  confidence: number;
}

export function classifyEmotion(text: string): EmotionClassification {
  if (!text || text.trim().length === 0) {
    return { primary: 'neutral', confidence: 0.5 };
  }

  const words = new Set(tokenize(text));
  const scores: Record<string, number> = {};

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (words.has(keyword)) matches++;
    }
    scores[emotion] = matches;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    // Fall back to sentiment analysis
    const sentiment = analyzeSentiment(text);
    if (sentiment.score > 0.2) return { primary: 'happy', confidence: 0.4 };
    if (sentiment.score < -0.2) return { primary: 'sad', confidence: 0.4 };
    return { primary: 'neutral', confidence: 0.5 };
  }

  const primary = Object.entries(scores).reduce((best, [emotion, score]) =>
    score > best[1] ? [emotion, score] : best
  )[0];

  // Confidence based on how many keywords matched vs total words
  const totalKeywordMatches = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(0.9, 0.4 + (maxScore / Math.max(totalKeywordMatches, 1)) * 0.3 + Math.min(maxScore, 3) * 0.1);

  return {
    primary,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export interface EmotionBreakdownEntry {
  emotion: string;
  percentage: number;
  entryCount: number;
}

export function computeEmotionBreakdown(entries: EntryText[]): EmotionBreakdownEntry[] {
  const counts: Record<string, number> = {
    happy: 0, sad: 0, anxious: 0, angry: 0, calm: 0, neutral: 0,
  };

  const entriesWithText = entries.filter((e) => e.text && e.text.trim().length > 0);
  if (entriesWithText.length === 0) return [];

  for (const entry of entriesWithText) {
    const { primary } = classifyEmotion(entry.text.slice(0, 1000));
    counts[primary] = (counts[primary] || 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([emotion, count]) => ({
      emotion,
      percentage: Math.round((count / entriesWithText.length) * 100),
      entryCount: count,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}
