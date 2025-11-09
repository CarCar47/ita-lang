/**
 * Pronunciation Scoring Utility
 *
 * Provides functions to evaluate pronunciation accuracy by comparing
 * user's spoken text with expected Italian words using Levenshtein distance
 * algorithm (industry standard for string similarity).
 */

/**
 * Italian number-to-word mapping dictionary
 * Maps digits to their Italian word equivalents for pronunciation comparison
 * Covers all number vocabulary in Lessons 2 and 11
 */
const ITALIAN_NUMBERS: Record<string, string> = {
  // Basic numbers (0-10) - Lesson 2
  "0": "zero",
  "1": "uno",
  "2": "due",
  "3": "tre",
  "4": "quattro",
  "5": "cinque",
  "6": "sei",
  "7": "sette",
  "8": "otto",
  "9": "nove",
  "10": "dieci",

  // Extended numbers - Lesson 11
  "20": "venti",
  "30": "trenta",
  "50": "cinquanta",
  "100": "cento",
  "1000": "mille",
};

/**
 * Normalize Italian text for comparison
 * Removes accents, converts to lowercase, trims whitespace
 * Converts standalone digits to Italian words (e.g., "4" → "quattro")
 */
export function normalizeItalianText(text: string): string {
  if (!text) return "";

  let normalized = text
    .toLowerCase()
    .trim()
    // Remove common Italian accents
    .replace(/[àáâä]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    // Remove extra whitespace
    .replace(/\s+/g, " ");

  // Convert standalone digits to Italian words
  // This handles Web Speech API's Inverse Text Normalization (ITN)
  // which transcribes spoken numbers as digits (e.g., "quattro" → "4")
  if (ITALIAN_NUMBERS[normalized]) {
    return ITALIAN_NUMBERS[normalized];
  }

  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into the other.
 *
 * Time complexity: O(m * n) where m and n are string lengths
 * Space complexity: O(m * n)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Number of edits needed
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column (deletions from str1)
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }

  // Initialize first row (insertions to str1)
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix using dynamic programming
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate pronunciation accuracy score (0-100%)
 * Based on Levenshtein distance relative to string length
 *
 * @param spoken - What the user said (from speech recognition)
 * @param expected - The correct Italian word
 * @returns Accuracy score from 0 to 100
 */
export function calculateAccuracy(spoken: string, expected: string): number {
  // Normalize both strings for fair comparison
  const normalizedSpoken = normalizeItalianText(spoken);
  const normalizedExpected = normalizeItalianText(expected);

  // Handle edge cases
  if (!normalizedSpoken || !normalizedExpected) {
    return 0;
  }

  // Exact match = perfect score
  if (normalizedSpoken === normalizedExpected) {
    return 100;
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);

  // Use the longer string length for percentage calculation
  const maxLength = Math.max(normalizedSpoken.length, normalizedExpected.length);

  // Calculate similarity percentage
  // Formula: (1 - distance/maxLength) * 100
  const similarity = Math.max(0, (1 - distance / maxLength) * 100);

  return Math.round(similarity);
}

/**
 * Get feedback category based on accuracy score
 */
export type FeedbackLevel = "perfect" | "good" | "needsWork";

export function getFeedbackLevel(accuracy: number): FeedbackLevel {
  if (accuracy >= 90) return "perfect";
  if (accuracy >= 70) return "good";
  return "needsWork";
}

/**
 * Generate user-friendly feedback message based on accuracy
 * Includes Italian phrases for authenticity
 *
 * @param accuracy - Score from 0-100
 * @param spoken - What the user said
 * @param expected - The correct word
 * @returns Feedback message object with title and description
 */
export function getFeedbackMessage(
  accuracy: number,
  spoken: string,
  expected: string
): {
  title: string;
  description: string;
  level: FeedbackLevel;
} {
  const level = getFeedbackLevel(accuracy);

  if (level === "perfect") {
    return {
      title: "Perfetto! Perfect pronunciation!",
      description:
        "Your pronunciation was excellent! You're speaking like a native Italian.",
      level,
    };
  }

  if (level === "good") {
    return {
      title: "Molto bene! Great job!",
      description:
        "Your pronunciation is very good! Just a small difference from perfect.",
      level,
    };
  }

  // needsWork
  const normalizedSpoken = normalizeItalianText(spoken);
  const normalizedExpected = normalizeItalianText(expected);

  // Provide specific feedback
  if (normalizedSpoken.length < normalizedExpected.length / 2) {
    return {
      title: "Continua a praticare! Keep practicing!",
      description:
        "Try speaking a bit slower and pronouncing all the syllables clearly.",
      level,
    };
  }

  return {
    title: "Continua a praticare! Keep practicing!",
    description:
      "Listen to the word again and try to match the pronunciation. You're making progress!",
    level,
  };
}

/**
 * Calculate overall exercise score from multiple attempts
 * Uses best attempt for each word
 *
 * @param attempts - Array of pronunciation attempts with accuracy scores
 * @returns Overall score from 0-100
 */
export function calculateOverallScore(
  attempts: Array<{ vocabularyId: string; accuracy: number }>
): number {
  if (attempts.length === 0) return 0;

  // Group attempts by vocabulary ID and get best score for each word
  const bestScores = new Map<string, number>();

  attempts.forEach((attempt) => {
    const current = bestScores.get(attempt.vocabularyId) || 0;
    if (attempt.accuracy > current) {
      bestScores.set(attempt.vocabularyId, attempt.accuracy);
    }
  });

  // Calculate average of best scores
  const scores = Array.from(bestScores.values());
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(average);
}

/**
 * Get color class for accuracy score (Tailwind CSS)
 */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-green-600";
  if (accuracy >= 70) return "text-yellow-600";
  return "text-orange-600";
}

/**
 * Get background color class for accuracy score (Tailwind CSS)
 */
export function getAccuracyBgColor(accuracy: number): string {
  if (accuracy >= 90) return "bg-green-100 border-green-300";
  if (accuracy >= 70) return "bg-yellow-100 border-yellow-300";
  return "bg-orange-100 border-orange-300";
}
