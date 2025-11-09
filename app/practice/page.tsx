"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Lesson } from "@/types";

type FilterType = "all" | "completed" | "beginner" | "intermediate" | "advanced";

export default function PracticePage() {
  const router = useRouter();
  const { lessonsProgress, loadProgress } = useProgressStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadProgress();
    const allLessons = getAllLessons();
    setLessons(allLessons);
  }, [loadProgress]);

  const startExercise = (lessonId: string, exerciseType: string) => {
    router.push(`/lessons/${lessonId}/exercise/${exerciseType}`);
  };

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

  // Filter lessons based on selected filter
  const filteredLessons = lessons.filter((lesson) => {
    if (filter === "all") return true;
    if (filter === "completed") {
      const progress = lessonsProgress.find((p) => p.lessonId === lesson.id);
      return progress?.completed;
    }
    return lesson.category === filter;
  });

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
                🎮 Practice Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose a lesson and exercise type to practice
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === "all" ? "primary" : "outline"}
                onClick={() => setFilter("all")}
              >
                All Lessons
              </Button>
              <Button
                variant={filter === "completed" ? "primary" : "outline"}
                onClick={() => setFilter("completed")}
              >
                Completed Only
              </Button>
              <div className="border-l border-gray-300 dark:border-gray-600 mx-2"></div>
              <Button
                variant={filter === "beginner" ? "success" : "outline"}
                onClick={() => setFilter("beginner")}
              >
                Beginner
              </Button>
              <Button
                variant={filter === "intermediate" ? "secondary" : "outline"}
                onClick={() => setFilter("intermediate")}
              >
                Intermediate
              </Button>
              <Button
                variant={filter === "advanced" ? "danger" : "outline"}
                onClick={() => setFilter("advanced")}
              >
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredLessons.length}</span>{" "}
            {filter === "all" ? "lessons" : `${filter} lessons`}
          </p>
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Lessons Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your filters or complete some lessons first.
              </p>
              <Link href="/lessons">
                <Button variant="primary">View All Lessons</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLessons.map((lesson) => {
              const progress = lessonsProgress.find((p) => p.lessonId === lesson.id);
              const isCompleted = progress?.completed || false;
              const score = progress?.score || 0;
              const attempts = progress?.attempts || 0;

              return (
                <Card key={lesson.id} hover>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold text-lg">
                          {lesson.level}
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 dark:text-gray-100">{lesson.title}</CardTitle>
                          <CardDescription>{lesson.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={getCategoryColor(lesson.category)} size="sm">
                        {lesson.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Info */}
                    {isCompleted && (
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Best Score</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{score}%</span>
                        </div>
                        <ProgressBar value={score} size="sm" color="green" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {attempts} {attempts === 1 ? "attempt" : "attempts"}
                        </p>
                      </div>
                    )}

                    {/* Exercise Buttons */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Practice Exercises:
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => startExercise(lesson.id, "matching")}
                        >
                          🎯 Matching
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => startExercise(lesson.id, "flashcards")}
                        >
                          🃏 Flashcards
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => startExercise(lesson.id, "pronunciation")}
                        >
                          🎤 Pronunciation
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => startExercise(lesson.id, "quiz")}
                        >
                          ✏️ Quiz
                        </Button>
                      </div>

                      {/* View Lesson Link */}
                      <Link href={`/lessons/${lesson.id}`}>
                        <Button variant="secondary" className="w-full mt-2">
                          View Lesson Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="py-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">💡 Practice Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• <strong>Matching Game:</strong> Perfect for quick vocabulary review and word association</li>
              <li>• <strong>Flashcards:</strong> Self-paced learning with knowledge assessment</li>
              <li>• <strong>Pronunciation:</strong> Practice speaking Italian with voice recognition</li>
              <li>• <strong>Quiz:</strong> Test your knowledge with multiple-choice questions</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
