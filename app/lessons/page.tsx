"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { getAllLessons } from "@/lib/utils/dataLoader";
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

export default function LessonsPage() {
  const { lessonsProgress, loadProgress } = useProgressStore();

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const allLessons = getAllLessons();
  const completedCount = lessonsProgress.filter((p) => p.completed).length;
  const progressPercentage = (completedCount / allLessons.length) * 100;

  // Group lessons by category
  const beginnerLessons = allLessons.filter((l) => l.category === "beginner");
  const intermediateLessons = allLessons.filter(
    (l) => l.category === "intermediate"
  );
  const advancedLessons = allLessons.filter((l) => l.category === "advanced");

  const getLessonStatus = (lessonId: string) => {
    const progress = lessonsProgress.find((p) => p.lessonId === lessonId);
    if (progress?.completed) return "completed";
    if (progress && progress.attempts > 0) return "in-progress";
    return "not-started";
  };

  const getLessonScore = (lessonId: string) => {
    const progress = lessonsProgress.find((p) => p.lessonId === lessonId);
    return progress?.score || 0;
  };

  const renderLessonCard = (lesson: any) => {
    const status = getLessonStatus(lesson.id);
    const score = getLessonScore(lesson.id);

    return (
      <Link href={`/lessons/${lesson.id}`} key={lesson.id}>
        <Card hover className="h-full">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">
                  {lesson.level}
                </div>
                {status === "completed" && (
                  <div className="text-2xl">✅</div>
                )}
                {status === "in-progress" && (
                  <div className="text-2xl">🔄</div>
                )}
              </div>
              <Badge
                variant={
                  status === "completed"
                    ? "success"
                    : status === "in-progress"
                    ? "warning"
                    : "default"
                }
              >
                {status === "completed"
                  ? "Completed"
                  : status === "in-progress"
                  ? "In Progress"
                  : "Not Started"}
              </Badge>
            </div>
            <CardTitle className="text-lg">{lesson.title}</CardTitle>
            <CardDescription>{lesson.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  ⏱️ {lesson.estimatedDuration} min
                </span>
                <span className="flex items-center gap-1">
                  📝 {lesson.vocabularyIds.length} words
                </span>
              </div>

              {status === "completed" && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Best Score</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {score}%
                    </span>
                  </div>
                  <ProgressBar value={score} size="sm" color="green" />
                </div>
              )}

              <Button
                variant={status === "completed" ? "secondary" : "primary"}
                size="sm"
                className="w-full"
              >
                {status === "completed"
                  ? "Review Lesson"
                  : status === "in-progress"
                  ? "Continue"
                  : "Start Lesson"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Lessons</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose a lesson to continue your Italian journey
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Progress */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {completedCount} of {allLessons.length} lessons completed
                </p>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.round(progressPercentage)}%
              </div>
            </div>
            <ProgressBar
              value={progressPercentage}
              size="lg"
              showLabel={false}
            />
          </CardContent>
        </Card>

        {/* Beginner Lessons */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Beginner Lessons
            </h2>
            <Badge variant="success" size="lg">
              Levels 1-5
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beginnerLessons.map((lesson) => renderLessonCard(lesson))}
          </div>
        </div>

        {/* Intermediate Lessons */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Intermediate Lessons
            </h2>
            <Badge variant="warning" size="lg">
              Levels 6-10
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intermediateLessons.map((lesson) => renderLessonCard(lesson))}
          </div>
        </div>

        {/* Advanced Lessons */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Basics
            </h2>
            <Badge variant="danger" size="lg">
              Levels 11-15
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedLessons.map((lesson) => renderLessonCard(lesson))}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="py-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Learning Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>• Complete lessons in order for the best learning experience</li>
              <li>• Review completed lessons to reinforce your memory</li>
              <li>• Practice pronunciation exercises daily for best results</li>
              <li>• Aim for at least 15 minutes of practice per day</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
