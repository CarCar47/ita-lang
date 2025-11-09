"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { getLessonWithVocabulary } from "@/lib/utils/dataLoader";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import type { Vocabulary } from "@/types";

interface MatchingExerciseProps {
  params: Promise<{
    id: string;
  }>;
}

interface MatchCard {
  id: string;
  text: string;
  type: "italian" | "english";
  vocabularyId: string;
  isMatched: boolean;
}

export default function MatchingExercisePage({
  params,
}: MatchingExerciseProps) {
  const router = useRouter();
  const { completeLesson } = useProgressStore();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
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

      // Limit to 10 words for the matching game
      const vocabToUse = lessonData.vocabulary.slice(0, 10);
      setVocabulary(vocabToUse);

      // Create shuffled cards
      const italianCards: MatchCard[] = vocabToUse.map((v) => ({
        id: `italian-${v.id}`,
        text: v.italian,
        type: "italian",
        vocabularyId: v.id,
        isMatched: false,
      }));

      const englishCards: MatchCard[] = vocabToUse.map((v) => ({
        id: `english-${v.id}`,
        text: v.english,
        type: "english",
        vocabularyId: v.id,
        isMatched: false,
      }));

      // Shuffle both arrays separately
      const shuffledItalian = [...italianCards].sort(() => Math.random() - 0.5);
      const shuffledEnglish = [...englishCards].sort(() => Math.random() - 0.5);

      setCards([...shuffledItalian, ...shuffledEnglish]);
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

  // Check for completion
  useEffect(() => {
    if (vocabulary.length > 0 && matches === vocabulary.length) {
      setIsComplete(true);
      setIsTimerRunning(false);

      // Calculate score (100% - penalty for incorrect attempts)
      const totalPairs = vocabulary.length;
      const penalty = Math.floor((incorrectAttempts / totalPairs) * 20); // 20% penalty per wrong attempt
      const finalScore = Math.max(0, 100 - penalty);

      // Save progress
      completeLesson(id, finalScore, timer);
    }
  }, [matches, vocabulary.length, incorrectAttempts, id, completeLesson]);

  const handleCardClick = (card: MatchCard) => {
    // Don't allow clicking matched cards or more than 2 selections
    if (card.isMatched || selectedCards.length >= 2) {
      return;
    }

    // Don't allow selecting same card twice
    if (selectedCards.find((c) => c.id === card.id)) {
      return;
    }

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    // Check for match when 2 cards are selected
    if (newSelected.length === 2) {
      setAttempts((prev) => prev + 1);

      const [first, second] = newSelected;

      // Check if they match (same vocabularyId but different types)
      if (
        first.vocabularyId === second.vocabularyId &&
        first.type !== second.type
      ) {
        // Match found!
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches((prev) => prev + 1);
          setSelectedCards([]);
        }, 500);
      } else {
        // No match
        setIncorrectAttempts((prev) => prev + 1);
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCardStyle = (card: MatchCard) => {
    if (card.isMatched) {
      return "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200 cursor-default";
    }
    if (selectedCards.find((c) => c.id === card.id)) {
      const isCorrectMatch =
        selectedCards.length === 2 &&
        selectedCards[0].vocabularyId === selectedCards[1].vocabularyId &&
        selectedCards[0].type !== selectedCards[1].type;

      if (isCorrectMatch) {
        return "bg-green-200 dark:bg-green-900/40 border-green-500 dark:border-green-500 text-green-900 dark:text-green-100 scale-105";
      } else if (selectedCards.length === 2) {
        return "bg-red-200 dark:bg-red-900/40 border-red-500 dark:border-red-500 text-red-900 dark:text-red-100 scale-105";
      }
      return "bg-blue-200 dark:bg-blue-900/40 border-blue-500 dark:border-blue-500 text-blue-900 dark:text-blue-100 scale-105";
    }
    return "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer text-gray-900 dark:text-gray-100";
  };

  const resetGame = () => {
    // Re-shuffle cards
    const italianCards = cards
      .filter((c) => c.type === "italian")
      .map((c) => ({ ...c, isMatched: false }));
    const englishCards = cards
      .filter((c) => c.type === "english")
      .map((c) => ({ ...c, isMatched: false }));

    const shuffledItalian = [...italianCards].sort(() => Math.random() - 0.5);
    const shuffledEnglish = [...englishCards].sort(() => Math.random() - 0.5);

    setCards([...shuffledItalian, ...shuffledEnglish]);
    setSelectedCards([]);
    setMatches(0);
    setAttempts(0);
    setIncorrectAttempts(0);
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

  const italianCards = cards.filter((c) => c.type === "italian");
  const englishCards = cards.filter((c) => c.type === "english");
  const score = Math.max(
    0,
    100 - Math.floor((incorrectAttempts / vocabulary.length) * 20)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
                🎯 Matching Game
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{lessonTitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(timer)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {matches}/{vocabulary.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isComplete ? (
          <>
            {/* Instructions */}
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="py-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Instructions:</strong> Click on an Italian word, then
                  click on its English translation to make a match. Match all
                  pairs to complete the exercise!
                </p>
              </CardContent>
            </Card>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Italian Column */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  🇮🇹 Italian
                </h2>
                <div className="space-y-3">
                  {italianCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 ${getCardStyle(
                        card
                      )}`}
                    >
                      <p className="text-lg font-medium text-center">
                        {card.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* English Column */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  🇬🇧 English
                </h2>
                <div className="space-y-3">
                  {englishCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 ${getCardStyle(
                        card
                      )}`}
                    >
                      <p className="text-lg font-medium text-center">
                        {card.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Completion Screen
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Excellent Work!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                You matched all {vocabulary.length} pairs!
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatTime(timer)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {score}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Final Score</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {attempts}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</div>
                </div>
              </div>

              {score === 100 && (
                <Badge variant="success" size="lg" className="mb-6">
                  Perfect Score! 🌟
                </Badge>
              )}

              <div className="flex gap-4 justify-center">
                <Button variant="primary" onClick={resetGame}>
                  Play Again
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
