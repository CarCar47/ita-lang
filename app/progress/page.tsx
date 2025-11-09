"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { useStatsStore } from "@/lib/stores/statsStore";
import { getAllLessons, getAllAchievements } from "@/lib/utils/dataLoader";
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

export default function ProgressPage() {
  const { lessonsProgress, vocabularyMastery, loadProgress } = useProgressStore();
  const { stats, streak, achievements, loadStats } = useStatsStore();

  useEffect(() => {
    loadProgress();
    loadStats();
  }, [loadProgress, loadStats]);

  const allLessons = getAllLessons();
  const allAchievements = getAllAchievements();

  // Calculate derived stats
  const completedLessons = lessonsProgress.filter((p) => p.completed).length;
  const totalLessons = allLessons.length;
  const progressPercentage = (completedLessons / totalLessons) * 100;

  // Format study time
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get achievement status
  const isAchievementEarned = (achievementId: string) => {
    return achievements.some((a) => a.achievementId === achievementId);
  };

  // Get badge tier icon
  const getBadgeTierIcon = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "🥉";
      case "silver":
        return "🥈";
      case "gold":
        return "🥇";
      case "platinum":
        return "💎";
      default:
        return "🏆";
    }
  };

  // Group vocabulary by mastery level
  const vocabularyByMastery = vocabularyMastery.reduce((acc, vocab) => {
    const level = vocab.masteryLevel;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                📊 Your Progress
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your Italian learning journey
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📈 Statistics Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Streak */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      {streak.currentStreak}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      days | Best: {streak.longestStreak}
                    </p>
                  </div>
                  <div className="text-4xl">🔥</div>
                </div>
              </CardContent>
            </Card>

            {/* Lessons Completed */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lessons</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {completedLessons}/{totalLessons}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">completed</p>
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
              </CardContent>
            </Card>

            {/* Words Learned */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Words</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {stats.totalWordsLearned}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">learned</p>
                  </div>
                  <div className="text-4xl">💬</div>
                </div>
              </CardContent>
            </Card>

            {/* Total Points */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {stats.totalPoints}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">earned</p>
                  </div>
                  <div className="text-4xl">⭐</div>
                </div>
              </CardContent>
            </Card>

            {/* Study Time */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Study Time</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {formatStudyTime(stats.totalStudyTimeMinutes)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      total | {streak.totalStudyDays} days
                    </p>
                  </div>
                  <div className="text-4xl">⏱️</div>
                </div>
              </CardContent>
            </Card>

            {/* Average Score */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {Math.round(stats.averageScore)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">across lessons</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </CardContent>
            </Card>

            {/* Pronunciation */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pronunciation</p>
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-1">
                      {Math.round(stats.pronunciationAccuracy)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">accuracy</p>
                  </div>
                  <div className="text-4xl">🎤</div>
                </div>
              </CardContent>
            </Card>

            {/* Current Level */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {stats.level}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of 15</p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Progress */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📚 Course Progress
          </h2>
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Overall Completion
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <ProgressBar value={progressPercentage} size="lg" color="green" />
            </CardContent>
          </Card>
        </div>

        {/* Lessons Details */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📖 Lesson Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLessons.map((lesson) => {
              const progress = lessonsProgress.find((p) => p.lessonId === lesson.id);
              const isCompleted = progress?.completed || false;
              const score = progress?.score || 0;
              const attempts = progress?.attempts || 0;

              return (
                <Card key={lesson.id} hover>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                          isCompleted
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {isCompleted ? "✓" : lesson.level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
                          {lesson.title}
                        </h3>
                        {isCompleted ? (
                          <>
                            <div className="mb-2">
                              <ProgressBar value={score} size="sm" color="green" />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Score: {score}% • {attempts} {attempts === 1 ? "attempt" : "attempts"}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Not started</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🏆 Achievements ({achievements.length}/{allAchievements.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAchievements.map((achievement) => {
              const earned = isAchievementEarned(achievement.id);
              const earnedData = achievements.find((a) => a.achievementId === achievement.id);

              return (
                <Card
                  key={achievement.id}
                  className={`${
                    earned
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800"
                      : "opacity-60 dark:opacity-40"
                  }`}
                >
                  <CardContent className="py-6">
                    <div className="text-center">
                      <div className="text-5xl mb-3">
                        {earned ? getBadgeTierIcon(achievement.badgeTier) : "🔒"}
                      </div>
                      <h3 className={`font-bold mb-1 ${earned ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm mb-3 ${earned ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {achievement.description}
                      </p>
                      <Badge
                        variant={earned ? "success" : "default"}
                        size="sm"
                      >
                        {achievement.points} points
                      </Badge>
                      {earned && earnedData && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Earned {new Date(earnedData.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                      {!earned && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Locked</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Vocabulary Mastery */}
        {vocabularyMastery.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              💬 Vocabulary Mastery
            </h2>
            <Card>
              <CardContent className="py-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[0, 1, 2, 3, 4, 5].map((level) => {
                    const count = vocabularyByMastery[level] || 0;
                    return (
                      <div key={level} className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {count}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Level {level}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {level === 0 && "New"}
                          {level === 1 && "Learning"}
                          {level === 2 && "Familiar"}
                          {level === 3 && "Known"}
                          {level === 4 && "Strong"}
                          {level === 5 && "Mastered"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Vocabulary</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {vocabularyMastery.length} words
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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

          <Link href="/">
            <Card hover className="text-center">
              <CardContent className="py-6">
                <div className="text-4xl mb-2">🏠</div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Dashboard</p>
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
