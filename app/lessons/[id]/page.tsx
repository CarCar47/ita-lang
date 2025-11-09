"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { getLessonWithVocabulary } from "@/lib/utils/dataLoader";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  ProgressBar,
} from "@/components/ui";
import type { Lesson, Vocabulary } from "@/types";

interface LessonDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LessonDetailPage({ params }: LessonDetailProps) {
  const router = useRouter();
  const { lessonsProgress } = useProgressStore();
  const [lesson, setLesson] = useState<
    (Lesson & { vocabulary: Vocabulary[] }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = use(params);

  useEffect(() => {
    try {
      const lessonData = getLessonWithVocabulary(id);
      setLesson(lessonData);
    } catch (error) {
      console.error("Error loading lesson:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🇮🇹</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Lesson Not Found
          </h1>
          <Link href="/lessons">
            <Button>Back to Lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress = lessonsProgress.find((p) => p.lessonId === id);
  const isCompleted = progress?.completed || false;
  const score = progress?.score || 0;
  const attempts = progress?.attempts || 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "danger";
      default:
        return "default";
    }
  };

  const startExercise = (type: string) => {
    router.push(`/lessons/${id}/exercise/${type}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/lessons"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2 inline-block"
          >
            ← Back to All Lessons
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-2xl">
                {lesson.level}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {lesson.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{lesson.description}</p>
              </div>
            </div>
            <Badge variant={getCategoryColor(lesson.category)} size="lg">
              {lesson.category.charAt(0).toUpperCase() +
                lesson.category.slice(1)}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lesson Info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Lesson Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ⏱️ {lesson.estimatedDuration} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Vocabulary</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    📝 {lesson.vocabulary.length} words
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Attempts</span>
                  <span className="font-medium text-gray-900 dark:text-white">{attempts}</span>
                </div>
                {isCompleted && (
                  <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Best Score</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {score}%
                        </span>
                      </div>
                      <ProgressBar value={score} size="md" color="green" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Exercise Options */}
            <Card>
              <CardHeader>
                <CardTitle>Practice Exercises</CardTitle>
                <CardDescription>
                  Choose an exercise to practice this lesson
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => startExercise("matching")}
                >
                  🎯 Matching Game
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => startExercise("flashcards")}
                >
                  🃏 Flashcards
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => startExercise("pronunciation")}
                >
                  🎤 Pronunciation
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => startExercise("quiz")}
                >
                  ✏️ Quiz
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="py-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                  💡 Quick Tip
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Review the vocabulary list below before starting an exercise.
                  Understanding the words first will help you learn faster!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Vocabulary List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary ({lesson.vocabulary.length} words)</CardTitle>
                <CardDescription>
                  Study these words before starting the exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lesson.vocabulary.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      No vocabulary available for this lesson yet.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Check back soon - we're adding more content!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {lesson.vocabulary.map((vocab, index) => (
                      <div
                        key={vocab.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-green-300 dark:hover:border-green-600 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
                                {index + 1}
                              </span>
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {vocab.italian}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  ({vocab.pronunciation})
                                </p>
                              </div>
                            </div>
                            <div className="ml-11">
                              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                                {vocab.english}
                              </p>
                              {vocab.exampleSentenceItalian && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-3 mt-3">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    "{vocab.exampleSentenceItalian}"
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {vocab.exampleSentenceEnglish}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="default" size="sm">
                            {vocab.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Tips for This Lesson */}
            {lesson.vocabulary.length > 0 && (
              <Card className="mt-6 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
                <CardContent className="py-4">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    📖 Study Tips
                  </h3>
                  <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                    <li>
                      • Read each word aloud using the pronunciation guide
                    </li>
                    <li>
                      • Try to memorize the example sentences - they show
                      context
                    </li>
                    <li>
                      • Start with the Matching Game to test your knowledge
                    </li>
                    <li>
                      • Review words you struggle with multiple times
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
