"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgressStore } from "@/lib/stores/progressStore";
import { useStatsStore } from "@/lib/stores/statsStore";
import { getLessonWithVocabulary } from "@/lib/utils/dataLoader";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import {
  speakItalian,
  stopSpeaking,
  isTTSSupported,
  waitForVoices,
} from "@/lib/utils/textToSpeech";
import {
  calculateAccuracy,
  getFeedbackMessage,
  calculateOverallScore,
  getAccuracyColor,
  getAccuracyBgColor,
  type FeedbackLevel,
} from "@/lib/utils/pronunciationScoring";
import type { Vocabulary } from "@/types";

interface PronunciationExerciseProps {
  params: Promise<{
    id: string;
  }>;
}

interface PronunciationAttempt {
  vocabularyId: string;
  accuracy: number;
  transcript: string;
  timestamp: number;
}

export default function PronunciationExercisePage({
  params,
}: PronunciationExerciseProps) {
  const router = useRouter();
  const { completeLesson } = useProgressStore();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [pronunciationAttempts, setPronunciationAttempts] = useState<
    PronunciationAttempt[]
  >([]);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<{
    title: string;
    description: string;
    level: FeedbackLevel;
  } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const { id } = use(params);

  // Speech recognition hook
  const {
    isSupported: speechSupported,
    status: recognitionStatus,
    isListening,
    transcript,
    error: recognitionError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: "it-IT",
    continuous: false, // Auto-stop after silence (industry standard for mobile compatibility)
    timeout: 10000, // 10 second recording limit
    interimResults: true, // Enable interim results for real-time feedback
  });

  // Load lesson and vocabulary
  useEffect(() => {
    async function loadLesson() {
      try {
        const lessonData = getLessonWithVocabulary(id);
        if (!lessonData) return;

        setLessonTitle(lessonData.title);

        if (lessonData.vocabulary.length === 0) {
          return;
        }

        // Limit to 10 words for pronunciation practice
        const vocabToUse = lessonData.vocabulary.slice(0, 10);
        setVocabulary(vocabToUse);

        setIsTimerRunning(true);

        // Check TTS support and wait for voices
        if (isTTSSupported()) {
          await waitForVoices();
          setTtsAvailable(true);
        }
      } catch (error) {
        console.error("Error loading lesson:", error);
      }
    }

    loadLesson();
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

  // Process transcript when recognition completes
  useEffect(() => {
    console.log("[Pronunciation Page] Transcript useEffect triggered");
    console.log("[Pronunciation Page] transcript:", transcript);
    console.log("[Pronunciation Page] recognitionStatus:", recognitionStatus);
    console.log("[Pronunciation Page] vocabulary.length:", vocabulary.length);
    console.log("[Pronunciation Page] currentWordIndex:", currentWordIndex);

    if (
      transcript &&
      recognitionStatus === "processing" &&
      vocabulary.length > 0
    ) {
      console.log("[Pronunciation Page] Processing transcript...");
      const currentWord = vocabulary[currentWordIndex];
      console.log("[Pronunciation Page] Current word:", currentWord.italian);

      // Calculate accuracy
      const accuracy = calculateAccuracy(transcript, currentWord.italian);
      console.log("[Pronunciation Page] Calculated accuracy:", accuracy);
      setCurrentAccuracy(accuracy);

      // Get feedback
      const feedback = getFeedbackMessage(
        accuracy,
        transcript,
        currentWord.italian
      );
      console.log("[Pronunciation Page] Generated feedback:", feedback);
      setCurrentFeedback(feedback);

      // Save attempt
      const attempt: PronunciationAttempt = {
        vocabularyId: currentWord.id,
        accuracy,
        transcript,
        timestamp: Date.now(),
      };
      console.log("[Pronunciation Page] Saving attempt:", attempt);
      setPronunciationAttempts((prev) => [...prev, attempt]);
    } else {
      console.log("[Pronunciation Page] Conditions not met - skipping processing");
      console.log("[Pronunciation Page] - transcript exists:", !!transcript);
      console.log("[Pronunciation Page] - status is processing:", recognitionStatus === "processing");
      console.log("[Pronunciation Page] - vocabulary loaded:", vocabulary.length > 0);
    }
  }, [transcript, recognitionStatus, vocabulary, currentWordIndex]);

  // Check for completion
  useEffect(() => {
    if (vocabulary.length === 0) return;

    // Get unique vocabulary IDs that have been attempted
    const attemptedVocabIds = new Set(
      pronunciationAttempts.map((a) => a.vocabularyId)
    );

    // Check if all words have at least one attempt
    const allWordsAttempted = vocabulary.every((vocab) =>
      attemptedVocabIds.has(vocab.id)
    );

    if (allWordsAttempted && !isComplete && pronunciationAttempts.length > 0) {
      setIsComplete(true);
      setIsTimerRunning(false);

      // Calculate final score
      const finalScore = calculateOverallScore(pronunciationAttempts);

      // Save progress
      completeLesson(id, finalScore, timer);

      // Update pronunciation accuracy stat
      useStatsStore.getState().updatePronunciationAccuracy(finalScore);
    }
  }, [
    pronunciationAttempts,
    vocabulary,
    isComplete,
    id,
    completeLesson,
  ]);

  // Handle play word (TTS)
  const handlePlayWord = () => {
    if (!ttsAvailable || vocabulary.length === 0) return;

    const currentWord = vocabulary[currentWordIndex];

    // Stop any current speech
    stopSpeaking();

    setIsSpeaking(true);

    speakItalian(
      currentWord.italian,
      {},
      {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      }
    );
  };

  // Handle start recording
  const handleStartRecording = async () => {
    console.log("[Pronunciation Page] handleStartRecording called");

    // Stop TTS if playing
    if (isSpeaking) {
      console.log("[Pronunciation Page] Stopping TTS playback");
      stopSpeaking();
      setIsSpeaking(false);
    }

    // Reset previous attempt
    console.log("[Pronunciation Page] Resetting previous state");
    resetTranscript();
    setCurrentAccuracy(null);
    setCurrentFeedback(null);

    // Start listening
    console.log("[Pronunciation Page] Calling startListening()");
    await startListening();
    console.log("[Pronunciation Page] startListening() completed");
  };

  // Handle stop recording
  const handleStopRecording = () => {
    console.log("[Pronunciation Page] handleStopRecording called");
    stopListening();
    console.log("[Pronunciation Page] stopListening() completed");
  };

  // Handle retry
  const handleRetry = () => {
    resetTranscript();
    setCurrentAccuracy(null);
    setCurrentFeedback(null);
  };

  // Handle next word
  const handleNextWord = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      // Stop any ongoing speech/recording
      stopSpeaking();
      stopListening();
      setIsSpeaking(false);

      // Reset states
      resetTranscript();
      setCurrentAccuracy(null);
      setCurrentFeedback(null);

      // Move to next word
      setTimeout(() => {
        setCurrentWordIndex((prev) => prev + 1);
      }, 100);
    }
  };

  // Handle previous word
  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      // Stop any ongoing speech/recording
      stopSpeaking();
      stopListening();
      setIsSpeaking(false);

      // Reset states
      resetTranscript();
      setCurrentAccuracy(null);
      setCurrentFeedback(null);

      // Move to previous word
      setTimeout(() => {
        setCurrentWordIndex((prev) => prev - 1);
      }, 100);
    }
  };

  // Reset exercise
  const resetExercise = () => {
    setCurrentWordIndex(0);
    setPronunciationAttempts([]);
    setCurrentAccuracy(null);
    setCurrentFeedback(null);
    setIsComplete(false);
    setTimer(0);
    setIsTimerRunning(true);
    resetTranscript();
    stopSpeaking();
    stopListening();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate stats
  const attemptedWords = new Set(
    pronunciationAttempts.map((a) => a.vocabularyId)
  ).size;

  const perfectCount = pronunciationAttempts.filter((a) => a.accuracy >= 90)
    .length;
  const goodCount = pronunciationAttempts.filter(
    (a) => a.accuracy >= 70 && a.accuracy < 90
  ).length;

  const currentScore =
    pronunciationAttempts.length > 0
      ? calculateOverallScore(pronunciationAttempts)
      : 0;

  // Handle empty vocabulary
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

  const currentWord = vocabulary[currentWordIndex];

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
                🎤 Pronunciation Practice
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
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {attemptedWords}/{vocabulary.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentScore}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Exercise Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isComplete ? (
          <>
            {/* Browser Support Warning */}
            {!speechSupported && (
              <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                        Speech Recognition Not Supported
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Your browser doesn't support speech recognition. Please
                        use Chrome, Edge, or Safari for the pronunciation
                        exercise.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="py-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Instructions:</strong> Click "Play Word" to hear the
                  Italian pronunciation. Then click "Record" to say the word
                  yourself. You'll receive instant feedback on your
                  pronunciation accuracy!
                </p>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Word {currentWordIndex + 1} of {vocabulary.length}
                </span>
                <div className="flex gap-2">
                  <Badge variant="success" size="sm">
                    Perfect: {perfectCount}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    Good: {goodCount}
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(attemptedWords / vocabulary.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Word Display Card */}
            <Card className="mb-6">
              <CardContent className="py-8">
                <div className="text-center">
                  <Badge variant="default" size="sm" className="mb-4">
                    {currentWord.type}
                  </Badge>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {currentWord.italian}
                  </h2>
                  {currentWord.pronunciation && (
                    <p className="text-xl text-gray-600 dark:text-gray-400 italic mb-4">
                      ({currentWord.pronunciation})
                    </p>
                  )}
                  <p className="text-2xl text-gray-900 dark:text-gray-100 mb-6">
                    {currentWord.english}
                  </p>

                  {currentWord.exampleSentenceItalian && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-xl mx-auto">
                      <p className="text-sm text-gray-900 dark:text-gray-100 italic mb-1">
                        "{currentWord.exampleSentenceItalian}"
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {currentWord.exampleSentenceEnglish}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audio Playback Button */}
            {ttsAvailable && (
              <div className="mb-6 text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handlePlayWord}
                  disabled={isListening || isSpeaking}
                  className="min-w-48"
                >
                  {isSpeaking ? (
                    <>
                      <span className="mr-2">🔊</span>
                      Playing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔊</span>
                      Play Word
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Recording Interface */}
            <Card className="mb-6 bg-gray-50">
              <CardContent className="py-8">
                <div className="text-center">
                  {currentAccuracy === null ? (
                    <>
                      {/* Recording Button */}
                      <Button
                        variant={isListening ? "outline" : "primary"}
                        size="lg"
                        onClick={
                          isListening
                            ? handleStopRecording
                            : handleStartRecording
                        }
                        disabled={!speechSupported}
                        className={`min-w-64 ${
                          isListening
                            ? "border-red-500 bg-red-50 hover:bg-red-100 animate-pulse"
                            : ""
                        }`}
                      >
                        {isListening ? (
                          <>
                            <span className="text-2xl mr-2">🔴</span>
                            Recording... (Click to stop)
                          </>
                        ) : recognitionStatus === "processing" ? (
                          <>
                            <span className="text-2xl mr-2">⏳</span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="text-2xl mr-2">🎤</span>
                            Tap to Record
                          </>
                        )}
                      </Button>

                      {recognitionError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-semibold text-red-900 mb-1">
                            Error
                          </p>
                          <p className="text-sm text-red-800">
                            {recognitionError.message}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Feedback Display */
                    <div
                      className={`p-6 border-2 rounded-lg ${getAccuracyBgColor(
                        currentAccuracy
                      )}`}
                    >
                      <div className="text-6xl mb-4">
                        {currentFeedback?.level === "perfect"
                          ? "🎉"
                          : currentFeedback?.level === "good"
                          ? "😊"
                          : "💪"}
                      </div>
                      <h3
                        className={`text-2xl font-bold mb-2 ${getAccuracyColor(
                          currentAccuracy
                        )}`}
                      >
                        {currentAccuracy}% Accurate
                      </h3>
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        {currentFeedback?.title}
                      </p>
                      <p className="text-sm text-gray-700 mb-4">
                        {currentFeedback?.description}
                      </p>

                      <div className="bg-white/50 rounded p-3 mb-4 text-sm">
                        <p className="text-gray-700">
                          <span className="font-semibold">You said:</span> "
                          {transcript}"
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Expected:</span> "
                          {currentWord.italian}"
                        </p>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={handleRetry}>
                          Try Again
                        </Button>
                        {currentWordIndex < vocabulary.length - 1 && (
                          <Button variant="primary" onClick={handleNextWord}>
                            Next Word →
                          </Button>
                        )}
                        {currentWordIndex === vocabulary.length - 1 && (
                          <Button
                            variant="primary"
                            onClick={() => {
                              // Will trigger completion via useEffect
                            }}
                          >
                            Finish Exercise
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousWord}
                disabled={currentWordIndex === 0 || isListening}
              >
                ← Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextWord}
                disabled={
                  currentWordIndex === vocabulary.length - 1 || isListening
                }
              >
                Next →
              </Button>
            </div>
          </>
        ) : (
          /* Completion Screen */
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ottimo lavoro! Excellent work!
              </h2>
              <p className="text-gray-600 mb-8">
                You've practiced {vocabulary.length} Italian words!
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(timer)}
                  </div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">
                    {currentScore}%
                  </div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {perfectCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    Perfect (90%+)
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-600">
                    {goodCount}
                  </div>
                  <div className="text-sm text-gray-600">Good (70-89%)</div>
                </div>
              </div>

              {currentScore === 100 && (
                <Badge variant="success" size="lg" className="mb-6">
                  Perfect Pronunciation! All Words Mastered! 🌟
                </Badge>
              )}

              <div className="flex gap-4 justify-center">
                <Button variant="primary" onClick={resetExercise}>
                  Practice Again
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
