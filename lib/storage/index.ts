// Local Storage Manager for Parla Italiano
// Handles all localStorage operations for user progress, stats, and preferences

import type {
  UserProgress,
  LessonProgress,
  VocabularyMastery,
  UserStreak,
  UserStats,
  UserAchievement,
  UserPreferences,
} from "@/types";

// Storage keys
const STORAGE_KEYS = {
  LESSONS_PROGRESS: "parla_italiano_lessons_progress",
  VOCABULARY_MASTERY: "parla_italiano_vocabulary_mastery",
  STREAK: "parla_italiano_streak",
  STATS: "parla_italiano_stats",
  ACHIEVEMENTS: "parla_italiano_achievements",
  PREFERENCES: "parla_italiano_preferences",
  METADATA: "parla_italiano_metadata",
} as const;

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// ============================================
// INITIALIZATION
// ============================================

export const initializeStorage = (): void => {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return;
  }

  // Initialize with default values if not exists
  if (!localStorage.getItem(STORAGE_KEYS.LESSONS_PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.LESSONS_PROGRESS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.VOCABULARY_MASTERY)) {
    localStorage.setItem(STORAGE_KEYS.VOCABULARY_MASTERY, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.STREAK)) {
    const defaultStreak: UserStreak = {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString(),
      totalStudyDays: 0,
    };
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(defaultStreak));
  }

  if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
    const defaultStats: UserStats = {
      totalLessonsCompleted: 0,
      totalWordsLearned: 0,
      totalStudyTimeMinutes: 0,
      averageScore: 0,
      pronunciationAccuracy: 0,
      totalPoints: 0,
      level: 1,
    };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PREFERENCES)) {
    const defaultPreferences: UserPreferences = {
      dailyGoalMinutes: 15,
      notificationEnabled: false,
      audioEnabled: true,
      pronunciationPracticeEnabled: true,
      uiLanguage: "en",
      theme: "auto",
    };
    localStorage.setItem(
      STORAGE_KEYS.PREFERENCES,
      JSON.stringify(defaultPreferences)
    );
  }

  if (!localStorage.getItem(STORAGE_KEYS.METADATA)) {
    const metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: "1.0.0",
    };
    localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
  }
};

// ============================================
// LESSONS PROGRESS
// ============================================

export const getLessonsProgress = (): LessonProgress[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LESSONS_PROGRESS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading lessons progress:", error);
    return [];
  }
};

export const getLessonProgress = (lessonId: string): LessonProgress | null => {
  const allProgress = getLessonsProgress();
  return allProgress.find((p) => p.lessonId === lessonId) || null;
};

export const saveLessonProgress = (progress: LessonProgress): void => {
  try {
    const allProgress = getLessonsProgress();
    const index = allProgress.findIndex((p) => p.lessonId === progress.lessonId);

    if (index >= 0) {
      allProgress[index] = progress;
    } else {
      allProgress.push(progress);
    }

    localStorage.setItem(
      STORAGE_KEYS.LESSONS_PROGRESS,
      JSON.stringify(allProgress)
    );
    updateMetadata();
  } catch (error) {
    console.error("Error saving lesson progress:", error);
  }
};

// ============================================
// VOCABULARY MASTERY
// ============================================

export const getVocabularyMasteryList = (): VocabularyMastery[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY_MASTERY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading vocabulary mastery:", error);
    return [];
  }
};

export const getVocabularyMastery = (
  vocabularyId: string
): VocabularyMastery | null => {
  const allMastery = getVocabularyMasteryList();
  return allMastery.find((m) => m.vocabularyId === vocabularyId) || null;
};

export const saveVocabularyMastery = (mastery: VocabularyMastery): void => {
  try {
    const allMastery = getVocabularyMasteryList();
    const index = allMastery.findIndex(
      (m) => m.vocabularyId === mastery.vocabularyId
    );

    if (index >= 0) {
      allMastery[index] = mastery;
    } else {
      allMastery.push(mastery);
    }

    localStorage.setItem(
      STORAGE_KEYS.VOCABULARY_MASTERY,
      JSON.stringify(allMastery)
    );
    updateMetadata();
  } catch (error) {
    console.error("Error saving vocabulary mastery:", error);
  }
};

// ============================================
// STREAK
// ============================================

export const getStreak = (): UserStreak => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STREAK);
    return data
      ? JSON.parse(data)
      : {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date().toISOString(),
          totalStudyDays: 0,
        };
  } catch (error) {
    console.error("Error reading streak:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString(),
      totalStudyDays: 0,
    };
  }
};

export const saveStreak = (streak: UserStreak): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
    updateMetadata();
  } catch (error) {
    console.error("Error saving streak:", error);
  }
};

export const updateStreakActivity = (): void => {
  const streak = getStreak();
  const today = new Date().toISOString().split("T")[0];
  const lastActivity = streak.lastActivityDate.split("T")[0];

  if (lastActivity === today) {
    // Already counted today
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastActivity === yesterdayStr) {
    // Streak continues
    streak.currentStreak += 1;
    streak.totalStudyDays += 1;
  } else {
    // Streak broken
    streak.currentStreak = 1;
    streak.totalStudyDays += 1;
  }

  // Update longest streak
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  streak.lastActivityDate = new Date().toISOString();
  saveStreak(streak);
};

// ============================================
// STATS
// ============================================

export const getStats = (): UserStats => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data
      ? JSON.parse(data)
      : {
          totalLessonsCompleted: 0,
          totalWordsLearned: 0,
          totalStudyTimeMinutes: 0,
          averageScore: 0,
          pronunciationAccuracy: 0,
          totalPoints: 0,
          level: 1,
        };
  } catch (error) {
    console.error("Error reading stats:", error);
    return {
      totalLessonsCompleted: 0,
      totalWordsLearned: 0,
      totalStudyTimeMinutes: 0,
      averageScore: 0,
      pronunciationAccuracy: 0,
      totalPoints: 0,
      level: 1,
    };
  }
};

export const saveStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    updateMetadata();
  } catch (error) {
    console.error("Error saving stats:", error);
  }
};

// ============================================
// ACHIEVEMENTS
// ============================================

export const getAchievements = (): UserAchievement[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading achievements:", error);
    return [];
  }
};

export const hasAchievement = (achievementId: string): boolean => {
  const achievements = getAchievements();
  return achievements.some((a) => a.achievementId === achievementId);
};

export const addAchievement = (achievementId: string): void => {
  if (hasAchievement(achievementId)) {
    return; // Already earned
  }

  try {
    const achievements = getAchievements();
    achievements.push({
      achievementId,
      earnedAt: new Date().toISOString(),
    });

    localStorage.setItem(
      STORAGE_KEYS.ACHIEVEMENTS,
      JSON.stringify(achievements)
    );
    updateMetadata();
  } catch (error) {
    console.error("Error adding achievement:", error);
  }
};

// ============================================
// PREFERENCES
// ============================================

export const getPreferences = (): UserPreferences => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data
      ? JSON.parse(data)
      : {
          dailyGoalMinutes: 15,
          notificationEnabled: false,
          audioEnabled: true,
          pronunciationPracticeEnabled: true,
          uiLanguage: "en",
          theme: "auto",
        };
  } catch (error) {
    console.error("Error reading preferences:", error);
    return {
      dailyGoalMinutes: 15,
      notificationEnabled: false,
      audioEnabled: true,
      pronunciationPracticeEnabled: true,
      uiLanguage: "en",
      theme: "auto",
    };
  }
};

export const savePreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    updateMetadata();
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

// ============================================
// METADATA
// ============================================

const updateMetadata = (): void => {
  try {
    const metadata = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.METADATA) || "{}"
    );
    metadata.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
  } catch (error) {
    console.error("Error updating metadata:", error);
  }
};

// ============================================
// EXPORT/IMPORT
// ============================================

export const exportProgress = (): string => {
  const data = {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    progress: {
      lessonsProgress: getLessonsProgress(),
      vocabularyMastery: getVocabularyMasteryList(),
      streak: getStreak(),
      stats: getStats(),
      achievements: getAchievements(),
      preferences: getPreferences(),
      createdAt:
        JSON.parse(localStorage.getItem(STORAGE_KEYS.METADATA) || "{}").createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  return JSON.stringify(data, null, 2);
};

export const importProgress = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);

    if (!data.version || !data.progress) {
      throw new Error("Invalid import data format");
    }

    // Import all data
    if (data.progress.lessonsProgress) {
      localStorage.setItem(
        STORAGE_KEYS.LESSONS_PROGRESS,
        JSON.stringify(data.progress.lessonsProgress)
      );
    }

    if (data.progress.vocabularyMastery) {
      localStorage.setItem(
        STORAGE_KEYS.VOCABULARY_MASTERY,
        JSON.stringify(data.progress.vocabularyMastery)
      );
    }

    if (data.progress.streak) {
      localStorage.setItem(
        STORAGE_KEYS.STREAK,
        JSON.stringify(data.progress.streak)
      );
    }

    if (data.progress.stats) {
      localStorage.setItem(
        STORAGE_KEYS.STATS,
        JSON.stringify(data.progress.stats)
      );
    }

    if (data.progress.achievements) {
      localStorage.setItem(
        STORAGE_KEYS.ACHIEVEMENTS,
        JSON.stringify(data.progress.achievements)
      );
    }

    if (data.progress.preferences) {
      localStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(data.progress.preferences)
      );
    }

    updateMetadata();
    return true;
  } catch (error) {
    console.error("Error importing progress:", error);
    return false;
  }
};

// ============================================
// RESET
// ============================================

export const resetAllProgress = (): void => {
  if (
    confirm(
      "Are you sure you want to reset all progress? This cannot be undone."
    )
  ) {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    initializeStorage();
  }
};
