// Data loader utilities for lessons, vocabulary, and achievements

import type { Lesson, Vocabulary, Achievement } from "@/types";
import lessonsData from "@/data/lessons.json";
import vocabularyData from "@/data/vocabulary.json";
import achievementsData from "@/data/achievements.json";

// ============================================
// LESSONS
// ============================================

export const getAllLessons = (): Lesson[] => {
  return lessonsData as Lesson[];
};

export const getLessonById = (id: string): Lesson | undefined => {
  return lessonsData.find((lesson) => lesson.id === id) as Lesson | undefined;
};

export const getLessonsByCategory = (category: string): Lesson[] => {
  return lessonsData.filter((lesson) => lesson.category === category) as Lesson[];
};

export const getBeginnerLessons = (): Lesson[] => {
  return getLessonsByCategory("beginner");
};

export const getIntermediateLessons = (): Lesson[] => {
  return getLessonsByCategory("intermediate");
};

export const getAdvancedLessons = (): Lesson[] => {
  return getLessonsByCategory("advanced");
};

// ============================================
// VOCABULARY
// ============================================

export const getAllVocabulary = (): Vocabulary[] => {
  return vocabularyData as Vocabulary[];
};

export const getVocabularyById = (id: string): Vocabulary | undefined => {
  return vocabularyData.find((vocab) => vocab.id === id) as Vocabulary | undefined;
};

export const getVocabularyByLessonId = (lessonId: string): Vocabulary[] => {
  return vocabularyData.filter((vocab) => vocab.lessonId === lessonId) as Vocabulary[];
};

export const getVocabularyByIds = (ids: string[]): Vocabulary[] => {
  return vocabularyData.filter((vocab) => ids.includes(vocab.id)) as Vocabulary[];
};

export const getVocabularyByType = (type: string): Vocabulary[] => {
  return vocabularyData.filter((vocab) => vocab.type === type) as Vocabulary[];
};

export const searchVocabulary = (searchTerm: string): Vocabulary[] => {
  const term = searchTerm.toLowerCase();
  return vocabularyData.filter(
    (vocab) =>
      vocab.italian.toLowerCase().includes(term) ||
      vocab.english.toLowerCase().includes(term)
  ) as Vocabulary[];
};

// ============================================
// ACHIEVEMENTS
// ============================================

export const getAllAchievements = (): Achievement[] => {
  return achievementsData as Achievement[];
};

export const getAchievementById = (id: string): Achievement | undefined => {
  return achievementsData.find((achievement) => achievement.id === id) as Achievement | undefined;
};

export const getAchievementsByTier = (tier: string): Achievement[] => {
  return achievementsData.filter((achievement) => achievement.badgeTier === tier) as Achievement[];
};

// ============================================
// COMBINED DATA
// ============================================

/**
 * Get a lesson with its vocabulary populated
 */
export const getLessonWithVocabulary = (lessonId: string) => {
  const lesson = getLessonById(lessonId);
  if (!lesson) return null;

  const vocabulary = getVocabularyByIds(lesson.vocabularyIds);

  return {
    ...lesson,
    vocabulary,
  };
};

/**
 * Get all lessons with vocabulary counts
 */
export const getAllLessonsWithCounts = () => {
  return lessonsData.map((lesson) => ({
    ...lesson,
    vocabularyCount: lesson.vocabularyIds.length,
  }));
};

/**
 * Calculate total vocabulary count across all lessons
 */
export const getTotalVocabularyCount = (): number => {
  return vocabularyData.length;
};

/**
 * Get vocabulary statistics
 */
export const getVocabularyStats = () => {
  const all = getAllVocabulary();

  return {
    total: all.length,
    byType: {
      nouns: all.filter((v) => v.type === "noun").length,
      verbs: all.filter((v) => v.type === "verb").length,
      phrases: all.filter((v) => v.type === "phrase").length,
      greetings: all.filter((v) => v.type === "greeting").length,
      numbers: all.filter((v) => v.type === "number").length,
      colors: all.filter((v) => v.type === "color").length,
    },
    byLesson: lessonsData.map((lesson) => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      count: lesson.vocabularyIds.length,
    })),
  };
};
