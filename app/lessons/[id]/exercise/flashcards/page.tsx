"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { getLessonWithVocabulary } from "@/lib/utils/dataLoader";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import type { Vocabulary } from "@/types";

interface FlashcardsExerciseProps {
  params: Promise<{
    id: string;
  }>;
}

type CardKnowledge = "unknown" | "learning" | "known";

interface CardProgress {
  vocabularyId: string;
  knowledge: CardKnowledge;
  reviewCount: number;
}

export default function FlashcardsExercisePage({
  params,
}: FlashcardsExerciseProps) {
  const router = useRouter();
  const { completeLesson } = useProgressStore();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardProgress, setCardProgress] = useState<CardProgress[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { id } = use(params);

  // Load lesson and vocabulary
  useEffect(() => {
    try {
      const lessonData = getLessonWithVocabulary(id);
      if (!lessonData) return;

      setLessonTitle(lessonData.title);

      if (lessonData.vocabulary.length === 0) {
        return;
      }

      // Shuffle vocabulary for variety
      const shuffled = [...lessonData.vocabulary].sort(
        () => Math.random() - 0.5
      );
      setVocabulary(shuffled);

      // Initialize progress tracking
      const initialProgress: CardProgress[] = shuffled.map((v) => ({
        vocabularyId: v.id,
        knowledge: "unknown",
        reviewCount: 0,
      }));
      setCardProgress(initialProgress);
      setIsTimerRunning(true);
    } catch (error) {
      console.error("Error loading lesson:", error);
    }
  }, [id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !isComplete) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isComplete]);

  // Check for completion - when user has reviewed all cards
  useEffect(() => {
    if (cardProgress.length > 0) {
      const allReviewed = cardProgress.every((card) => card.reviewCount > 0);
      if (allReviewed && !isComplete) {
        setIsComplete(true);
        setIsTimerRunning(false);

        // Calculate score based on knowledge ratings
        const knownCards = cardProgress.filter(
          (c) => c.knowledge === "known"
        ).length;
        const learningCards = cardProgress.filter(
          (c) => c.knowledge === "learning"
        ).length;

        // Known = 100%, Learning = 70%, Unknown = 40%
        const totalScore =
          (knownCards * 100 + learningCards * 70 + (cardProgress.length - knownCards - learningCards) * 40) /
          cardProgress.length;
        const finalScore = Math.round(totalScore);

        // Save progress
        completeLesson(id, finalScore, timer);
      }
    }
  }, [cardProgress, isComplete, id, completeLesson]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnowledgeRating = (knowledge: CardKnowledge) => {
    // Update progress for current card
    setCardProgress((prev) =>
      prev.map((card, index) =>
        index === currentCardIndex
          ? { ...card, knowledge, reviewCount: card.reviewCount + 1 }
          : card
      )
    );

    // Move to next card or complete
    if (currentCardIndex < vocabulary.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => prev + 1);
      }, 100);
    } else {
      // Check if all cards have been reviewed at least once
      const updatedProgress = cardProgress.map((card, index) =>
        index === currentCardIndex
          ? { ...card, knowledge, reviewCount: card.reviewCount + 1 }
          : card
      );
      const allReviewed = updatedProgress.every((card) => card.reviewCount > 0);

      if (allReviewed) {
        // Will trigger completion in useEffect
        setCardProgress(updatedProgress);
      } else {
        // Go to first unreviewed card
        const nextUnreviewed = updatedProgress.findIndex(
          (card) => card.reviewCount === 0
        );
        if (nextUnreviewed !== -1) {
          setIsFlipped(false);
          setTimeout(() => {
            setCurrentCardIndex(nextUnreviewed);
          }, 100);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => prev - 1);
      }, 100);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < vocabulary.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => prev + 1);
      }, 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetFlashcards = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCardProgress(
      vocabulary.map((v) => ({
        vocabularyId: v.id,
        knowledge: "unknown",
        reviewCount: 0,
      }))
    );
    setIsComplete(false);
    setTimer(0);
    setIsTimerRunning(true);
  };

  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            No Vocabulary Available
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This lesson doesn't have vocabulary content yet. Please try another
            lesson or check back soon!
          </p>
          <Link href={`/lessons/${id}`}>
            <Button>Back to Lesson</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = vocabulary[currentCardIndex];
  const progress = cardProgress[currentCardIndex];
  const reviewedCount = cardProgress.filter((c) => c.reviewCount > 0).length;
  const knownCount = cardProgress.filter((c) => c.knowledge === "known").length;
  const learningCount = cardProgress.filter(
    (c) => c.knowledge === "learning"
  ).length;

  const calculateCurrentScore = () => {
    if (reviewedCount === 0) return 0;
    const totalScore =
      (knownCount * 100 + learningCount * 70 + (reviewedCount - knownCount - learningCount) * 40) /
      reviewedCount;
    return Math.round(totalScore);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/lessons/${id}`}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2 inline-block"
          >
            ← Back to Lesson
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                🃏 Flashcards
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{lessonTitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(timer)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {reviewedCount}/{vocabulary.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Reviewed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculateCurrentScore()}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Score</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Flashcard Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isComplete ? (
          <>
            {/* Instructions */}
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="py-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Instructions:</strong> Click the card to flip between
                  Italian and English. Rate your knowledge of each word to track
                  your progress. Review all cards to complete the exercise!
                </p>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Card {currentCardIndex + 1} of {vocabulary.length}
                </span>
                <div className="flex gap-2">
                  <Badge variant="success" size="sm">
                    Known: {knownCount}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    Learning: {learningCount}
                  </Badge>
                  <Badge variant="default" size="sm">
                    New: {vocabulary.length - knownCount - learningCount}
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(reviewedCount / vocabulary.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Flashcard */}
            <div className="mb-6 perspective-1000">
              <div
                onClick={handleFlip}
                className={`relative w-full h-96 cursor-pointer transition-transform duration-500 transform-style-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front of card (Italian) */}
                <div
                  className="absolute w-full h-full backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <Card className="h-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/30 border-2 border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 transition-colors">
                    <CardContent className="h-full flex flex-col items-center justify-center p-8">
                      <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-4">
                        ITALIAN
                      </div>
                      <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
                        {currentCard.italian}
                      </div>
                      {currentCard.pronunciation && (
                        <div className="text-xl text-gray-600 dark:text-gray-400 italic mb-4">
                          ({currentCard.pronunciation})
                        </div>
                      )}
                      <Badge variant="default" size="lg">
                        {currentCard.type}
                      </Badge>
                      <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
                        Click to reveal English
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Back of card (English) */}
                <div
                  className="absolute w-full h-full backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <Card className="h-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/30 border-2 border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <CardContent className="h-full flex flex-col items-center justify-center p-8">
                      <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-4">
                        ENGLISH
                      </div>
                      <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                        {currentCard.english}
                      </div>
                      {currentCard.exampleSentenceItalian && (
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 max-w-md border border-white/20 dark:border-gray-700/50">
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
                            "{currentCard.exampleSentenceItalian}"
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {currentCard.exampleSentenceEnglish}
                          </p>
                        </div>
                      )}
                      <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
                        Click to see Italian
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentCardIndex === 0}
              >
                ← Previous
              </Button>

              <Button variant="secondary" onClick={handleFlip} size="lg">
                {isFlipped ? "Show Italian" : "Show English"}
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentCardIndex === vocabulary.length - 1}
              >
                Next →
              </Button>
            </div>

            {/* Knowledge Rating Buttons */}
            {isFlipped && (
              <Card className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <CardContent className="py-6">
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-4 text-center">
                    How well do you know this word?
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600"
                      onClick={() => handleKnowledgeRating("unknown")}
                    >
                      <div>
                        <div className="text-2xl mb-1">😕</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Don't Know</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Need more practice</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-yellow-300 dark:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-400 dark:hover:border-yellow-600"
                      onClick={() => handleKnowledgeRating("learning")}
                    >
                      <div>
                        <div className="text-2xl mb-1">🤔</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Learning</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Getting there</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-600"
                      onClick={() => handleKnowledgeRating("known")}
                    >
                      <div>
                        <div className="text-2xl mb-1">😊</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Know It!</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Mastered</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // Completion Screen
          <Card className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardContent className="py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Great Job!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                You've reviewed all {vocabulary.length} flashcards!
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatTime(timer)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {knownCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Known</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {learningCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Learning</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {calculateCurrentScore()}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                </div>
              </div>

              {calculateCurrentScore() === 100 && (
                <Badge variant="success" size="lg" className="mb-6">
                  Perfect! All Words Mastered! 🌟
                </Badge>
              )}

              <div className="flex gap-4 justify-center">
                <Button variant="primary" onClick={resetFlashcards}>
                  Review Again
                </Button>
                <Link href={`/lessons/${id}`}>
                  <Button variant="secondary">Back to Lesson</Button>
                </Link>
                <Link href="/lessons">
                  <Button variant="outline">All Lessons</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
