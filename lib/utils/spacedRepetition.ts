// Spaced Repetition Algorithm
// Determines when vocabulary words should be reviewed next

/**
 * Calculate the next review date based on mastery level
 * Uses increasing intervals: 1 day, 3 days, 7 days, 14 days, 30 days
 *
 * @param masteryLevel - Current mastery level (0-5)
 * @param lastReviewedAt - ISO date string of last review
 * @returns ISO date string for next review
 */
export const calculateNextReview = (
  masteryLevel: number,
  lastReviewedAt: string
): string => {
  const lastReview = new Date(lastReviewedAt);
  const intervals = [0, 1, 3, 7, 14, 30]; // days to wait for each mastery level

  const daysToAdd = intervals[Math.min(masteryLevel, intervals.length - 1)];
  const nextReview = new Date(lastReview);
  nextReview.setDate(nextReview.getDate() + daysToAdd);

  return nextReview.toISOString();
};

/**
 * Determine if a vocabulary word is due for review
 *
 * @param nextReviewAt - ISO date string for next review
 * @returns boolean indicating if review is due
 */
export const isReviewDue = (nextReviewAt: string): boolean => {
  const now = new Date();
  const nextReview = new Date(nextReviewAt);
  return now >= nextReview;
};

/**
 * Update mastery level based on correctness
 *
 * @param currentLevel - Current mastery level (0-5)
 * @param wasCorrect - Whether the answer was correct
 * @returns new mastery level
 */
export const updateMasteryLevel = (
  currentLevel: number,
  wasCorrect: boolean
): number => {
  if (wasCorrect) {
    return Math.min(currentLevel + 1, 5); // Max level is 5
  } else {
    return Math.max(currentLevel - 1, 0); // Min level is 0
  }
};

/**
 * Get words due for review from vocabulary mastery list
 *
 * @param vocabularyMastery - Array of vocabulary mastery records
 * @returns Array of vocabulary IDs due for review
 */
export const getWordsDueForReview = (
  vocabularyMastery: Array<{
    vocabularyId: string;
    nextReviewAt: string;
  }>
): string[] => {
  return vocabularyMastery
    .filter((mastery) => isReviewDue(mastery.nextReviewAt))
    .map((mastery) => mastery.vocabularyId);
};
