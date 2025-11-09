"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { useStatsStore } from "@/lib/stores/statsStore";
import { getAllLessons } from "@/lib/utils/dataLoader";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ProgressBar,
  Badge,
} from "@/components/ui";

export default function HomePage() {
  const { lessonsProgress } = useProgressStore();
  const { stats, streak, achievements, loadStats } = useStatsStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const allLessons = getAllLessons();
  const completedLessons = lessonsProgress.filter((p) => p.completed).length;
  const totalLessons = allLessons.length;
  const progressPercentage = (completedLessons / totalLessons) * 100;

  // Find next lesson to continue
  const nextLesson = allLessons.find((lesson) => {
    const progress = lessonsProgress.find((p) => p.lessonId === lesson.id);
    return !progress?.completed;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Parla Italiano
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Learn Italian, one word at a time</p>
            </div>
            <div className="flex gap-3">
              <Link href="/lessons">
                <Button variant="outline">All Lessons</Button>
              </Link>
              <Link href="/settings">
                <Button variant="secondary">Settings</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Benvenuto! Welcome back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ready to continue your Italian learning journey?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Streak */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-500 mt-1">
                    {streak.currentStreak}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {streak.currentStreak === 1 ? "day" : "days"}
                  </p>
                </div>
                <div className="text-4xl">🔥</div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons Completed */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lessons</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-1">
                    {completedLessons}/{totalLessons}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">completed</p>
                </div>
                <div className="text-4xl">📚</div>
              </div>
            </CardContent>
          </Card>

          {/* Words Learned */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Words</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-1">
                    {stats.totalWordsLearned}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">learned</p>
                </div>
                <div className="text-4xl">💬</div>
              </div>
            </CardContent>
          </Card>

          {/* Total Points */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-500 mt-1">
                    {stats.totalPoints}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">earned</p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Card */}
        <div className="mb-8">
          <Card className="lg:col-span-2" hover>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {nextLesson ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {nextLesson.title}
                      </h4>
                      <Badge variant="info">{nextLesson.category}</Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {nextLesson.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 mb-4">
                      <span>⏱️ {nextLesson.estimatedDuration} min</span>
                      <span>•</span>
                      <span>📝 {nextLesson.vocabularyIds.length} words</span>
                    </div>
                  </div>
                  <Link href={`/lessons/${nextLesson.id}`}>
                    <Button variant="primary" size="lg" className="w-full">
                      Start Lesson {nextLesson.level}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                    All Lessons Complete!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Congratulations! You've finished all available lessons.
                  </p>
                  <Link href="/practice">
                    <Button variant="primary">Practice Your Skills</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Course Completion</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <ProgressBar value={progressPercentage} size="lg" />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/lessons">
            <Card hover className="text-center">
              <CardContent className="py-6">
                <div className="text-4xl mb-2">📚</div>
                <p className="font-medium text-gray-900 dark:text-gray-100">All Lessons</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/practice">
            <Card hover className="text-center">
              <CardContent className="py-6">
                <div className="text-4xl mb-2">🎮</div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Practice</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/progress">
            <Card hover className="text-center">
              <CardContent className="py-6">
                <div className="text-4xl mb-2">📊</div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Progress</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card hover className="text-center">
              <CardContent className="py-6">
                <div className="text-4xl mb-2">⚙️</div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Settings</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
