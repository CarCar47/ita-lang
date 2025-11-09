import { create } from "zustand";
import type { LessonProgress, VocabularyMastery } from "@/types";
import {
  getLessonsProgress,
  getVocabularyMasteryList,
  saveLessonProgress,
  saveVocabularyMastery,
} from "@/lib/storage";
import {
  calculateNextReview,
  updateMasteryLevel,
} from "@/lib/utils/spacedRepetition";
import { getLessonWithVocabulary } from "@/lib/utils/dataLoader";
import { useStatsStore } from "./statsStore";

interface ProgressState {
  lessonsProgress: LessonProgress[];
  vocabularyMastery: VocabularyMastery[];

  // Actions
  loadProgress: () => void;
  getLessonProgress: (lessonId: string) => LessonProgress | undefined;
  updateLessonProgress: (lessonId: string, progress: Partial<LessonProgress>) => void;
  completeLesson: (lessonId: string, score: number, studyTimeSeconds?: number) => void;

  getVocabularyMastery: (vocabularyId: string) => VocabularyMastery | undefined;
  updateVocabularyMastery: (vocabularyId: string, wasCorrect: boolean) => void;
  initializeVocabularyMastery: (vocabularyId: string) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  lessonsProgress: [],
  vocabularyMastery: [],

  // Load progress from localStorage
  loadProgress: () => {
    const lessonsProgress = getLessonsProgress();
    const vocabularyMastery = getVocabularyMasteryList();
    set({ lessonsProgress, vocabularyMastery });
  },

  // Get progress for a specific lesson
  getLessonProgress: (lessonId: string) => {
    return get().lessonsProgress.find((p) => p.lessonId === lessonId);
  },

  // Update lesson progress
  updateLessonProgress: (lessonId: string, progress: Partial<LessonProgress>) => {
    const currentProgress = get().getLessonProgress(lessonId);

    const updatedProgress: LessonProgress = {
      lessonId,
      completed: false,
      score: 0,
      attempts: 0,
      lastAttemptAt: new Date().toISOString(),
      ...currentProgress,
      ...progress,
    };

    saveLessonProgress(updatedProgress);

    set((state) => ({
      lessonsProgress: state.lessonsProgress.some(p => p.lessonId === lessonId)
        ? state.lessonsProgress.map(p => p.lessonId === lessonId ? updatedProgress : p)
        : [...state.lessonsProgress, updatedProgress]
    }));

    // Update streak activity
    useStatsStore.getState().updateStreak();
  },

  // Complete a lesson
  completeLesson: (lessonId: string, score: number, studyTimeSeconds?: number) => {
    const currentProgress = get().getLessonProgress(lessonId);

    const updatedProgress: LessonProgress = {
      lessonId,
      completed: true,
      score,
      attempts: (currentProgress?.attempts || 0) + 1,
      lastAttemptAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    saveLessonProgress(updatedProgress);

    set((state) => ({
      lessonsProgress: state.lessonsProgress.some(p => p.lessonId === lessonId)
        ? state.lessonsProgress.map(p => p.lessonId === lessonId ? updatedProgress : p)
        : [...state.lessonsProgress, updatedProgress]
    }));

    // Update all stats
    const statsStore = useStatsStore.getState();
    statsStore.updateStreak();
    statsStore.incrementLessonsCompleted();
    statsStore.updateAverageScore(score);

    // Track words learned from this lesson
    try {
      const lesson = getLessonWithVocabulary(lessonId);
      if (lesson?.vocabulary && lesson.vocabulary.length > 0) {
        statsStore.incrementWordsLearned(lesson.vocabulary.length);
        console.log(`Words learned: +${lesson.vocabulary.length}`);
      }
    } catch (error) {
      console.error("Error tracking words learned:", error);
    }

    // Track study time
    if (studyTimeSeconds) {
      const studyTimeMinutes = Math.ceil(studyTimeSeconds / 60);
      statsStore.addStudyTime(studyTimeMinutes);
      console.log(`Study time: +${studyTimeMinutes} minutes`);
    }

    console.log("Lesson completed - stats updated:", { lessonId, score, studyTimeSeconds });
  },

  // Get mastery for a specific vocabulary word
  getVocabularyMastery: (vocabularyId: string) => {
    return get().vocabularyMastery.find((m) => m.vocabularyId === vocabularyId);
  },

  // Initialize vocabulary mastery for a new word
  initializeVocabularyMastery: (vocabularyId: string) => {
    const existing = get().getVocabularyMastery(vocabularyId);
    if (existing) return;

    const now = new Date().toISOString();
    const newMastery: VocabularyMastery = {
      vocabularyId,
      masteryLevel: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewedAt: now,
      nextReviewAt: calculateNextReview(0, now),
    };

    saveVocabularyMastery(newMastery);

    set((state) => ({
      vocabularyMastery: [...state.vocabularyMastery, newMastery],
    }));
  },

  // Update vocabulary mastery based on answer correctness
  updateVocabularyMastery: (vocabularyId: string, wasCorrect: boolean) => {
    const currentMastery = get().getVocabularyMastery(vocabularyId);

    if (!currentMastery) {
      // Initialize if not exists
      get().initializeVocabularyMastery(vocabularyId);
      return;
    }

    const now = new Date().toISOString();
    const newMasteryLevel = updateMasteryLevel(currentMastery.masteryLevel, wasCorrect);

    const updatedMastery: VocabularyMastery = {
      ...currentMastery,
      masteryLevel: newMasteryLevel,
      correctCount: wasCorrect
        ? currentMastery.correctCount + 1
        : currentMastery.correctCount,
      incorrectCount: !wasCorrect
        ? currentMastery.incorrectCount + 1
        : currentMastery.incorrectCount,
      lastReviewedAt: now,
      nextReviewAt: calculateNextReview(newMasteryLevel, now),
    };

    saveVocabularyMastery(updatedMastery);

    set((state) => ({
      vocabularyMastery: state.vocabularyMastery.map(m =>
        m.vocabularyId === vocabularyId ? updatedMastery : m
      ),
    }));
  },
}));
