import { create } from "zustand";
import type { UserStats, UserStreak, UserAchievement } from "@/types";
import {
  getStats,
  saveStats,
  getStreak,
  saveStreak,
  getAchievements,
  addAchievement as addAchievementToStorage,
  hasAchievement,
  getLessonsProgress,
} from "@/lib/storage";

interface StatsState {
  stats: UserStats;
  streak: UserStreak;
  achievements: UserAchievement[];

  // Actions
  loadStats: () => void;
  updateStreak: () => void;
  incrementLessonsCompleted: () => void;
  incrementWordsLearned: (count: number) => void;
  addStudyTime: (minutes: number) => void;
  updateAverageScore: (newScore: number) => void;
  updatePronunciationAccuracy: (accuracy: number) => void;
  addPoints: (points: number) => void;
  updateLevel: (level: number) => void;

  checkAndAwardAchievements: (updatedStats?: UserStats, updatedStreak?: UserStreak) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: {
    totalLessonsCompleted: 0,
    totalWordsLearned: 0,
    totalStudyTimeMinutes: 0,
    averageScore: 0,
    pronunciationAccuracy: 0,
    totalPoints: 0,
    level: 1,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date(0).toISOString(), // Use epoch date so first activity will count
    totalStudyDays: 0,
  },
  achievements: [],

  // Load stats from localStorage
  loadStats: () => {
    let stats = getStats();
    const streak = getStreak();
    const achievements = getAchievements();

    console.log("=== loadStats() Debug ===");
    console.log("Stats loaded from storage:", {
      totalLessonsCompleted: stats.totalLessonsCompleted,
      totalWordsLearned: stats.totalWordsLearned,
      level: stats.level
    });

    // Sync stats with actual progress (in case they got out of sync)
    const lessonsProgress = getLessonsProgress();
    const actualCompletedLessons = lessonsProgress.filter(p => p.completed).length;

    if (actualCompletedLessons !== stats.totalLessonsCompleted) {
      console.log(`⚠️ Stats out of sync! Actual: ${actualCompletedLessons}, Stored: ${stats.totalLessonsCompleted}`);
      console.log("Syncing stats with actual progress...");

      stats = {
        ...stats,
        totalLessonsCompleted: actualCompletedLessons,
        level: Math.min(actualCompletedLessons, 15),
      };
      saveStats(stats);
      console.log("✓ Stats synced:", { totalLessonsCompleted: stats.totalLessonsCompleted });
    }

    console.log("Achievements loaded:", achievements);
    console.log("hasAchievement('first-steps'):", hasAchievement("first-steps"));

    set({ stats, streak, achievements });

    // Award achievements for existing progress (retroactive)
    console.log("Calling checkAndAwardAchievements with:", {
      totalLessonsCompleted: stats.totalLessonsCompleted
    });
    get().checkAndAwardAchievements(stats, streak);
  },

  // Update streak based on activity
  updateStreak: () => {
    const currentStreak = get().streak;
    const today = new Date().toISOString().split("T")[0];
    const lastActivity = currentStreak.lastActivityDate.split("T")[0];

    console.log("updateStreak called:", {
      today,
      lastActivity,
      currentStreakValue: currentStreak.currentStreak
    });

    // Already counted today
    if (lastActivity === today) {
      console.log("Already counted today, skipping");
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let updatedStreak: UserStreak;

    if (lastActivity === yesterdayStr) {
      // Streak continues
      updatedStreak = {
        ...currentStreak,
        currentStreak: currentStreak.currentStreak + 1,
        totalStudyDays: currentStreak.totalStudyDays + 1,
        lastActivityDate: new Date().toISOString(),
      };
    } else {
      // Streak broken - reset to 1
      updatedStreak = {
        ...currentStreak,
        currentStreak: 1,
        totalStudyDays: currentStreak.totalStudyDays + 1,
        lastActivityDate: new Date().toISOString(),
      };
    }

    // Update longest streak if needed
    if (updatedStreak.currentStreak > updatedStreak.longestStreak) {
      updatedStreak.longestStreak = updatedStreak.currentStreak;
    }

    // Save to localStorage and update state
    saveStreak(updatedStreak);
    set({ streak: updatedStreak });

    console.log("Streak updated:", {
      newStreak: updatedStreak.currentStreak,
      longestStreak: updatedStreak.longestStreak,
      totalDays: updatedStreak.totalStudyDays
    });

    // Check for streak achievements
    get().checkAndAwardAchievements(undefined, updatedStreak);
  },

  // Increment lessons completed
  incrementLessonsCompleted: () => {
    const stats = get().stats;
    const updatedStats = {
      ...stats,
      totalLessonsCompleted: stats.totalLessonsCompleted + 1,
      level: Math.min(stats.totalLessonsCompleted + 1, 15), // Level = lessons completed (max 15)
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
    console.log("Lesson completed! New total:", updatedStats.totalLessonsCompleted);
    get().checkAndAwardAchievements(updatedStats);
  },

  // Increment words learned
  incrementWordsLearned: (count: number) => {
    const stats = get().stats;
    const updatedStats = {
      ...stats,
      totalWordsLearned: stats.totalWordsLearned + count,
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
    get().checkAndAwardAchievements(updatedStats);
  },

  // Add study time
  addStudyTime: (minutes: number) => {
    const stats = get().stats;
    const updatedStats = {
      ...stats,
      totalStudyTimeMinutes: stats.totalStudyTimeMinutes + minutes,
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
  },

  // Update average score (running average)
  updateAverageScore: (newScore: number) => {
    const stats = get().stats;
    const totalLessons = stats.totalLessonsCompleted + 1;
    const currentTotal = stats.averageScore * stats.totalLessonsCompleted;
    const newAverage = (currentTotal + newScore) / totalLessons;

    const updatedStats = {
      ...stats,
      averageScore: Math.round(newAverage * 100) / 100, // Round to 2 decimals
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
  },

  // Update pronunciation accuracy (running average)
  updatePronunciationAccuracy: (accuracy: number) => {
    const stats = get().stats;
    const updatedStats = {
      ...stats,
      pronunciationAccuracy: Math.round(accuracy * 100) / 100,
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
    get().checkAndAwardAchievements(updatedStats);
  },

  // Add points
  addPoints: (points: number) => {
    const stats = get().stats;
    const updatedStats = {
      ...stats,
      totalPoints: stats.totalPoints + points,
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
  },

  // Update level
  updateLevel: (level: number) => {
    const stats = get().stats;
    const updatedStats = {
      ...stats,
      level,
    };
    saveStats(updatedStats);
    set({ stats: updatedStats });
  },

  // Check and award achievements based on current stats
  checkAndAwardAchievements: (updatedStats?: UserStats, updatedStreak?: UserStreak) => {
    // Use provided values or get from store
    const stats = updatedStats || get().stats;
    const streak = updatedStreak || get().streak;

    console.log("Checking achievements with stats:", {
      totalLessonsCompleted: stats.totalLessonsCompleted,
      totalWordsLearned: stats.totalWordsLearned,
      currentStreak: streak.currentStreak,
      pronunciationAccuracy: stats.pronunciationAccuracy
    });

    // Achievement: Complete 1 lesson
    if (stats.totalLessonsCompleted >= 1 && !hasAchievement("first-steps")) {
      console.log("🏆 Achievement unlocked: First Steps!");
      addAchievementToStorage("first-steps");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "first-steps",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(10);
    }

    // Achievement: Complete 5 lessons
    if (stats.totalLessonsCompleted >= 5 && !hasAchievement("getting-started")) {
      addAchievementToStorage("getting-started");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "getting-started",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(25);
    }

    // Achievement: Complete 10 lessons
    if (stats.totalLessonsCompleted >= 10 && !hasAchievement("dedicated-learner")) {
      addAchievementToStorage("dedicated-learner");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "dedicated-learner",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(50);
    }

    // Achievement: Complete all 15 lessons
    if (stats.totalLessonsCompleted >= 15 && !hasAchievement("italian-scholar")) {
      addAchievementToStorage("italian-scholar");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "italian-scholar",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(100);
    }

    // Achievement: 7-day streak
    if (streak.currentStreak >= 7 && !hasAchievement("on-fire")) {
      addAchievementToStorage("on-fire");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "on-fire",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(30);
    }

    // Achievement: 30-day streak
    if (streak.currentStreak >= 30 && !hasAchievement("unstoppable")) {
      addAchievementToStorage("unstoppable");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "unstoppable",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(100);
    }

    // Achievement: Learn 100 words
    if (stats.totalWordsLearned >= 100 && !hasAchievement("vocabulary-builder")) {
      addAchievementToStorage("vocabulary-builder");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "vocabulary-builder",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(50);
    }

    // Achievement: Learn 500 words
    if (stats.totalWordsLearned >= 500 && !hasAchievement("word-master")) {
      addAchievementToStorage("word-master");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "word-master",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(150);
    }

    // Achievement: 90% pronunciation accuracy
    if (stats.pronunciationAccuracy >= 90 && !hasAchievement("pronunciation-pro")) {
      addAchievementToStorage("pronunciation-pro");
      set((state) => ({
        achievements: [...state.achievements, {
          achievementId: "pronunciation-pro",
          earnedAt: new Date().toISOString()
        }]
      }));
      get().addPoints(75);
    }
  },
}));
