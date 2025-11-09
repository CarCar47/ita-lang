/**
 * useSpeechRecognition Hook
 *
 * Custom React hook for speech recognition using Web Speech API.
 * Handles microphone access, Italian speech recognition, and transcript capture.
 *
 * Browser Support:
 * - Chrome: ✓ Full support
 * - Edge: ✓ Full support
 * - Safari: ✓ Partial support (iOS 14.5+)
 * - Firefox: ✗ No support
 *
 * Usage:
 * const { isSupported, isListening, transcript, error, startListening, stopListening } = useSpeechRecognition();
 */

import { useState, useEffect, useRef, useCallback } from "react";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Speech Recognition status types
 */
export type RecognitionStatus =
  | "idle"
  | "initializing"
  | "listening"
  | "processing"
  | "error";

/**
 * Speech Recognition error types
 */
export type RecognitionErrorType =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported"
  | "no-microphone"
  | "browser-not-supported"
  | "unknown";

/**
 * Speech Recognition error details
 */
export interface RecognitionError {
  type: RecognitionErrorType;
  message: string;
}

/**
 * Hook options
 */
export interface UseSpeechRecognitionOptions {
  lang?: string; // Language code (default: 'it-IT')
  continuous?: boolean; // Continue listening after result (default: false)
  interimResults?: boolean; // Return interim results (default: false)
  maxAlternatives?: number; // Max alternative transcripts (default: 1)
  timeout?: number; // Auto-stop timeout in ms (default: 5000)
}

/**
 * Hook return type
 */
export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  status: RecognitionStatus;
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: RecognitionError | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(errorType: RecognitionErrorType): string {
  switch (errorType) {
    case "no-speech":
      return "No speech was detected. Please try speaking louder or closer to the microphone.";
    case "aborted":
      return "Speech recognition was stopped unexpectedly.";
    case "audio-capture":
      return "No microphone was found. Please ensure your microphone is connected and enabled.";
    case "network":
      return "Network error occurred. Please check your internet connection.";
    case "not-allowed":
      return "Microphone permission was denied. Please enable microphone access in your browser settings.";
    case "service-not-allowed":
      return "Speech recognition service is not allowed on this page.";
    case "bad-grammar":
      return "Speech recognition grammar error.";
    case "language-not-supported":
      return "Italian language is not supported by your browser's speech recognition.";
    case "no-microphone":
      return "No microphone detected. Please connect a microphone.";
    case "browser-not-supported":
      return "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.";
    default:
      return "An unknown error occurred during speech recognition.";
  }
}

/**
 * useSpeechRecognition Hook
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = "it-IT",
    continuous = false,
    interimResults = false,
    maxAlternatives = 1,
    timeout = 5000,
  } = options;

  // State
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<RecognitionError | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterimResultRef = useRef<string>("");
  const hasFinalResultRef = useRef<boolean>(false);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Initialize recognition instance (singleton pattern)
  useEffect(() => {
    if (!isSupported) return;

    console.log("[SpeechRecognition] Creating recognition instance");

    try {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      const recognition = new SpeechRecognitionAPI();

      // Configure recognition
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      // Event handlers
      recognition.onstart = () => {
        console.log("[SpeechRecognition] Recording started");
        setStatus("listening");
        setError(null);
      };

      recognition.onresult = (event: any) => {
        console.log("[SpeechRecognition] Got result event, total results:", event.results.length);
        const result = event.results[event.results.length - 1];

        console.log("[SpeechRecognition] Result isFinal:", result.isFinal);

        if (result.isFinal) {
          const transcriptText = result[0].transcript;
          const confidenceScore = result[0].confidence;

          console.log("[SpeechRecognition] Final transcript:", transcriptText);
          console.log("[SpeechRecognition] Confidence:", confidenceScore);

          setTranscript(transcriptText);
          setConfidence(confidenceScore);
          setStatus("processing");

          // Mark that we received a final result
          hasFinalResultRef.current = true;
          lastInterimResultRef.current = "";
        } else {
          // Save interim result in case recording ends without final result
          const interimText = result[0].transcript;
          console.log("[SpeechRecognition] Interim result:", interimText);
          lastInterimResultRef.current = interimText;
        }
      };

      recognition.onerror = (event: any) => {
        console.error("[SpeechRecognition] Error occurred:", event.error, event.message);

        // Ignore "aborted" errors when manually stopping
        if (event.error === "aborted") {
          console.log("[SpeechRecognition] Recognition aborted (expected when stopping)");
          return;
        }

        let errorType: RecognitionErrorType;

        switch (event.error) {
          case "no-speech":
            errorType = "no-speech";
            break;
          case "audio-capture":
            errorType = "audio-capture";
            break;
          case "network":
            errorType = "network";
            break;
          case "not-allowed":
            errorType = "not-allowed";
            break;
          case "service-not-allowed":
            errorType = "service-not-allowed";
            break;
          case "bad-grammar":
            errorType = "bad-grammar";
            break;
          case "language-not-supported":
            errorType = "language-not-supported";
            break;
          default:
            errorType = "unknown";
        }

        setError({
          type: errorType,
          message: getErrorMessage(errorType),
        });
        setStatus("error");
      };

      recognition.onend = () => {
        console.log("[SpeechRecognition] Recording ended");
        console.log("[SpeechRecognition] hasFinalResult:", hasFinalResultRef.current);
        console.log("[SpeechRecognition] lastInterimResult:", lastInterimResultRef.current);

        // If we have an interim result but no final result was captured,
        // use the last interim result (happens when user manually stops)
        if (!hasFinalResultRef.current && lastInterimResultRef.current) {
          console.log("[SpeechRecognition] Using last interim result as final:", lastInterimResultRef.current);
          setTranscript(lastInterimResultRef.current);
          setConfidence(0.85); // Estimated confidence for interim results
          setStatus("processing");
          lastInterimResultRef.current = "";
        } else if (hasFinalResultRef.current) {
          console.log("[SpeechRecognition] Final result already captured");
        } else {
          console.log("[SpeechRecognition] No speech detected");
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Error initializing speech recognition:", err);
      setError({
        type: "browser-not-supported",
        message: getErrorMessage("browser-not-supported"),
      });
    }

    // Cleanup on unmount or when options change
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors during cleanup
        }
        recognitionRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSupported, lang, continuous, interimResults, maxAlternatives]);

  // Start listening
  const startListening = useCallback(async (): Promise<void> => {
    console.log("[SpeechRecognition] startListening called");

    if (!isSupported) {
      console.error("[SpeechRecognition] Browser not supported");
      setError({
        type: "browser-not-supported",
        message: getErrorMessage("browser-not-supported"),
      });
      setStatus("error");
      return;
    }

    if (!recognitionRef.current) {
      console.error("[SpeechRecognition] Recognition instance not initialized");
      setError({
        type: "unknown",
        message: "Speech recognition not initialized",
      });
      setStatus("error");
      return;
    }

    try {
      // Check microphone permission
      console.log("[SpeechRecognition] Checking microphone permission...");
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("[SpeechRecognition] Microphone permission granted");
        } catch (permissionError) {
          console.error("[SpeechRecognition] Microphone permission denied:", permissionError);
          setError({
            type: "not-allowed",
            message: getErrorMessage("not-allowed"),
          });
          setStatus("error");
          return;
        }
      }

      // Reset previous state
      console.log("[SpeechRecognition] Resetting state and starting recognition...");
      setTranscript("");
      setConfidence(0);
      setError(null);
      setStatus("initializing");
      lastInterimResultRef.current = ""; // Clear any previous interim results
      hasFinalResultRef.current = false; // Reset final result flag

      // Start recognition (reuse existing instance)
      recognitionRef.current.start();
      console.log("[SpeechRecognition] Recognition.start() called");

      // Set timeout to auto-stop
      if (timeout > 0) {
        console.log(`[SpeechRecognition] Auto-stop timeout set to ${timeout}ms`);
        timeoutRef.current = setTimeout(() => {
          console.log("[SpeechRecognition] Auto-stop timeout reached");
          stopListening();
        }, timeout);
      }
    } catch (err) {
      console.error("[SpeechRecognition] Error starting speech recognition:", err);
      setError({
        type: "unknown",
        message: "Failed to start speech recognition",
      });
      setStatus("error");
    }
  }, [isSupported, timeout]);

  // Stop listening
  const stopListening = useCallback((): void => {
    console.log("[SpeechRecognition] stopListening called");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("[SpeechRecognition] Recognition.stop() called");
        setStatus("idle");
      } catch (err) {
        console.error("[SpeechRecognition] Error stopping speech recognition:", err);
      }
    }

    if (timeoutRef.current) {
      console.log("[SpeechRecognition] Clearing auto-stop timeout");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback((): void => {
    setTranscript("");
    setConfidence(0);
    setError(null);
    lastInterimResultRef.current = "";
    hasFinalResultRef.current = false;
  }, []);

  return {
    isSupported,
    status,
    isListening: status === "listening" || status === "initializing",
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
