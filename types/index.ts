// ============================================
// LESSON TYPES
// ============================================

export type ExerciseType =
  | "matching"
  | "fill-in-blank"
  | "multiple-choice"
  | "pronunciation"
  | "listening";

export type LessonCategory = "beginner" | "intermediate" | "advanced";

export interface Lesson {
  id: string;
  level: number;
  title: string;
  description: string;
  category: LessonCategory;
  estimatedDuration: number; // in minutes
  vocabularyIds: string[]; // References to vocabulary items
  order: number;
}

// ============================================
// VOCABULARY TYPES
// ============================================

export type VocabularyType =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrase"
  | "greeting"
  | "number"
  | "color"
  | "time"
  | "day"
  | "month"
  | "food"
  | "body"
  | "direction"
  | "profession"
  | "preposition";

export type Gender = "masculine" | "feminine" | "neutral";

export interface Vocabulary {
  id: string;
  italian: string;
  english: string;
  pronunciation?: string; // Phonetic transcription
  audioUrl?: string; // Path to audio file
  type: VocabularyType;
  gender?: Gender; // For nouns
  exampleSentenceItalian?: string;
  exampleSentenceEnglish?: string;
  difficultyLevel: number; // 1-5
  lessonId: string; // Which lesson this belongs to
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export type RequirementType =
  | "lessons_completed"
  | "streak_days"
  | "words_learned"
  | "perfect_scores"
  | "pronunciation_accuracy";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string; // Icon identifier for UI
  requirementType: RequirementType;
  requirementValue: number; // Threshold to unlock
  points: number; // Gamification points
  badgeTier: BadgeTier;
}

// ============================================
// USER PROGRESS TYPES (localStorage)
// ============================================

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number; // 0-100
  attempts: number;
  lastAttemptAt: string; // ISO date string
  completedAt?: string; // ISO date string
}

export interface VocabularyMastery {
  vocabularyId: string;
  masteryLevel: number; // 0-5 (higher = better mastered)
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: string; // ISO date string
  nextReviewAt: string; // ISO date string for spaced repetition
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO date string
  totalStudyDays: number;
}

export interface UserStats {
  totalLessonsCompleted: number;
  totalWordsLearned: number;
  totalStudyTimeMinutes: number;
  averageScore: number; // 0-100
  pronunciationAccuracy: number; // 0-100
  totalPoints: number;
  level: number; // User overall level (1-15)
}

export interface UserAchievement {
  achievementId: string;
  earnedAt: string; // ISO date string
}

export interface UserPreferences {
  dailyGoalMinutes: number;
  notificationEnabled: boolean;
  audioEnabled: boolean;
  pronunciationPracticeEnabled: boolean;
  uiLanguage: "en" | "it";
  theme: "light" | "dark" | "auto";
}

// ============================================
// COMBINED USER PROGRESS TYPE
// ============================================

export interface UserProgress {
  lessonsProgress: LessonProgress[];
  vocabularyMastery: VocabularyMastery[];
  streak: UserStreak;
  stats: UserStats;
  achievements: UserAchievement[];
  preferences: UserPreferences;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================
// EXERCISE TYPES
// ============================================

export interface MatchingPair {
  italian: string;
  english: string;
  vocabularyId: string;
}

export interface FillInBlankQuestion {
  sentenceItalian: string;
  sentenceEnglish: string;
  missingWord: string;
  options: string[]; // Multiple choice options
  correctAnswer: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  questionType: "italian-to-english" | "english-to-italian";
  options: string[];
  correctAnswer: string;
  vocabularyId: string;
}

export interface PronunciationExercise {
  italian: string;
  english: string;
  audioUrl: string;
  vocabularyId: string;
}

export interface ListeningExercise {
  audioUrl: string;
  question: string;
  options: string[];
  correctAnswer: string;
  vocabularyId: string;
}

// ============================================
// EXPORT/IMPORT TYPES
// ============================================

export interface ExportData {
  version: string; // App version for compatibility
  exportDate: string; // ISO date string
  progress: UserProgress;
}
