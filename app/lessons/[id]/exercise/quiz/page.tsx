"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { getLessonWithVocabulary } from "@/lib/utils/dataLoader";
import { Button, Card, CardContent, Badge, ProgressBar } from "@/components/ui";
import type { Vocabulary, MultipleChoiceQuestion } from "@/types";

interface QuizExerciseProps {
  params: Promise<{
    id: string;
  }>;
}

interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function QuizExercisePage({ params }: QuizExerciseProps) {
  const router = useRouter();
  const { completeLesson, updateVocabularyMastery } = useProgressStore();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { id } = use(params);

  // Generate quiz questions from vocabulary
  const generateQuestions = (vocab: Vocabulary[]): MultipleChoiceQuestion[] => {
    const generatedQuestions: MultipleChoiceQuestion[] = [];

    vocab.forEach((currentVocab, index) => {
      // Randomly choose question type (50% Italian→English, 50% English→Italian)
      const questionType = Math.random() > 0.5 ? "italian-to-english" : "english-to-italian";

      // Get wrong answers from other vocabulary items
      const otherVocabs = vocab.filter((_, i) => i !== index);
      const shuffledOthers = [...otherVocabs].sort(() => Math.random() - 0.5);

      let wrongAnswers: string[];
      let correctAnswer: string;
      let question: string;

      if (questionType === "italian-to-english") {
        question = currentVocab.italian;
        correctAnswer = currentVocab.english;
        wrongAnswers = shuffledOthers
          .slice(0, 3)
          .map(v => v.english);
      } else {
        question = currentVocab.english;
        correctAnswer = currentVocab.italian;
        wrongAnswers = shuffledOthers
          .slice(0, 3)
          .map(v => v.italian);
      }

      // Combine correct and wrong answers, then shuffle
      const allOptions = [correctAnswer, ...wrongAnswers];
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      generatedQuestions.push({
        question,
        questionType,
        options: shuffledOptions,
        correctAnswer,
        vocabularyId: currentVocab.id,
      });
    });

    // Shuffle the questions
    return generatedQuestions.sort(() => Math.random() - 0.5);
  };

  // Load lesson and generate questions
  useEffect(() => {
    try {
      const lessonData = getLessonWithVocabulary(id);
      if (!lessonData) return;

      setLessonTitle(lessonData.title);

      if (lessonData.vocabulary.length === 0) {
        return;
      }

      setVocabulary(lessonData.vocabulary);
      const generatedQuestions = generateQuestions(lessonData.vocabulary);
      setQuestions(generatedQuestions);
      setIsTimerRunning(true);
      setQuestionStartTime(0);
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

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || showFeedback) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const timeSpent = timer - questionStartTime;

    // Record answer
    const newAnswer: QuizAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setShowFeedback(true);

    // Update vocabulary mastery
    updateVocabularyMastery(currentQuestion.vocabularyId, isCorrect);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(timer);
    } else {
      // Quiz complete - calculate final score from answers array
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setIsComplete(true);
    setIsTimerRunning(false);

    // Calculate final score from all recorded answers
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = questions.length;
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Save progress
    completeLesson(id, finalScore, timer);
  };

  const resetQuiz = () => {
    const regeneratedQuestions = generateQuestions(vocabulary);
    setQuestions(regeneratedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowFeedback(false);
    setIsComplete(false);
    setTimer(0);
    setQuestionStartTime(0);
    setIsTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getOptionStyle = (option: string) => {
    if (!showFeedback) {
      if (selectedAnswer === option) {
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 border-2";
      }
      return "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer";
    }

    // After submission, show correct/incorrect
    const currentQuestion = questions[currentQuestionIndex];
    if (option === currentQuestion.correctAnswer) {
      return "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 border-2";
    }
    if (selectedAnswer === option && option !== currentQuestion.correctAnswer) {
      return "bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-400 border-2";
    }
    return "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50";
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🇮🇹</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const correctAnswersCount = answers.filter((a) => a.isCorrect).length;
  const currentScore = questions.length > 0
    ? Math.round((correctAnswersCount / (currentQuestionIndex || 1)) * 100)
    : 0;

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
                ✏️ Quiz
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
                  {currentQuestionIndex + 1}/{questions.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {correctAnswersCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Correct</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isComplete ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quiz Progress
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(progress)}%
                </span>
              </div>
              <ProgressBar value={progress} size="lg" color="green" />
            </div>

            {/* Question Card */}
            <Card className="mb-6">
              <CardContent className="py-8">
                {/* Question Type Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <Badge
                    variant={currentQuestion.questionType === "italian-to-english" ? "info" : "warning"}
                    size="lg"
                  >
                    {currentQuestion.questionType === "italian-to-english"
                      ? "🇮🇹 → 🇬🇧 Translate to English"
                      : "🇬🇧 → 🇮🇹 Translate to Italian"}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>

                {/* Question */}
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select the correct translation
                  </p>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => !showFeedback && handleAnswerSelect(option)}
                      className={`p-4 border rounded-lg transition-all duration-200 ${getOptionStyle(
                        option
                      )}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 flex-1">{option}</p>
                        {showFeedback && option === currentQuestion.correctAnswer && (
                          <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                        )}
                        {showFeedback &&
                          selectedAnswer === option &&
                          option !== currentQuestion.correctAnswer && (
                            <span className="text-red-600 dark:text-red-400 text-2xl">✗</span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Message */}
                {showFeedback && (
                  <div
                    className={`mt-6 p-4 rounded-lg ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        selectedAnswer === currentQuestion.correctAnswer
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}
                    >
                      {selectedAnswer === currentQuestion.correctAnswer
                        ? "🎉 Correct! Well done!"
                        : `❌ Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/lessons/${id}`)}
              >
                Exit Quiz
              </Button>

              <div className="flex gap-3">
                {!showFeedback ? (
                  <Button
                    variant="primary"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNextQuestion}
                  >
                    {currentQuestionIndex < questions.length - 1
                      ? "Next Question →"
                      : "Finish Quiz"}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          // Completion Screen
          (() => {
            // Calculate completion stats
            const totalCorrect = answers.filter((a) => a.isCorrect).length;
            const finalScorePercent = Math.round((totalCorrect / questions.length) * 100);
            const avgTimePerQuestion = formatTime(Math.round(timer / questions.length));

            return (
              <Card className="max-w-2xl mx-auto text-center">
                <CardContent className="py-12">
                  <div className="text-6xl mb-4">
                    {finalScorePercent >= 80 ? "🎉" : "👏"}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Quiz Complete!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You answered {questions.length} questions
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {formatTime(timer)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {finalScorePercent}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Final Score</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {totalCorrect}/{questions.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {avgTimePerQuestion}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Time</div>
                    </div>
                  </div>

                  {finalScorePercent === 100 && (
                    <Badge variant="success" size="lg" className="mb-6">
                      Perfect Score! 🌟
                    </Badge>
                  )}

                  {finalScorePercent >= 80 && finalScorePercent < 100 && (
                    <Badge variant="success" size="lg" className="mb-6">
                      Great Job! 🎯
                    </Badge>
                  )}

                  <div className="flex gap-4 justify-center">
                    <Button variant="primary" onClick={resetQuiz}>
                      Retake Quiz
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
            );
          })()
        )}
      </main>
    </div>
  );
}
