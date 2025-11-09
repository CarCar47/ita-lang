/**
 * Text-to-Speech Utility
 *
 * Provides Italian text-to-speech functionality using the Web Speech API's
 * SpeechSynthesis interface. Allows the app to pronounce Italian words
 * for pronunciation practice.
 *
 * Browser Support: Chrome ✓, Edge ✓, Safari ✓, Firefox ✓
 * (Better support than SpeechRecognition)
 */

/**
 * Check if Text-to-Speech is supported in the current browser
 */
export function isTTSSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

/**
 * Get available Italian voices
 * Filters for voices with 'it' or 'it-IT' language code
 */
export function getItalianVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(
    (voice) =>
      voice.lang === "it-IT" ||
      voice.lang === "it" ||
      voice.lang.startsWith("it-")
  );
}

/**
 * Get the best Italian voice available
 * Prefers:
 * 1. Local voices (better quality, no network needed)
 * 2. Female voices (often clearer for learning)
 * 3. First available Italian voice
 */
export function getBestItalianVoice(): SpeechSynthesisVoice | null {
  const italianVoices = getItalianVoices();

  if (italianVoices.length === 0) return null;

  // Prefer local voices
  const localVoices = italianVoices.filter((voice) => voice.localService);
  if (localVoices.length > 0) {
    // Prefer female voices among local voices
    const femaleLocal = localVoices.find((voice) =>
      voice.name.toLowerCase().includes("female")
    );
    if (femaleLocal) return femaleLocal;

    return localVoices[0];
  }

  // Fallback to any Italian voice
  const femaleVoice = italianVoices.find((voice) =>
    voice.name.toLowerCase().includes("female")
  );
  if (femaleVoice) return femaleVoice;

  return italianVoices[0];
}

/**
 * TTS Settings interface
 */
export interface TTSSettings {
  rate?: number; // Speed: 0.1 to 10 (1 = normal)
  pitch?: number; // Pitch: 0 to 2 (1 = normal)
  volume?: number; // Volume: 0 to 1 (1 = full volume)
  voice?: SpeechSynthesisVoice | null;
}

/**
 * Default TTS settings optimized for language learning
 */
export const DEFAULT_TTS_SETTINGS: Required<Omit<TTSSettings, "voice">> = {
  rate: 0.85, // Slightly slower than normal for clarity
  pitch: 1.0, // Normal pitch
  volume: 1.0, // Full volume
};

/**
 * Speak Italian text using Text-to-Speech
 *
 * @param text - Italian text to speak
 * @param settings - Optional TTS settings
 * @param callbacks - Optional event callbacks
 * @returns SpeechSynthesisUtterance instance (can be used to cancel)
 */
export function speakItalian(
  text: string,
  settings: TTSSettings = {},
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (event: SpeechSynthesisErrorEvent) => void;
  }
): SpeechSynthesisUtterance | null {
  if (!isTTSSupported()) {
    console.error("Text-to-Speech is not supported in this browser");
    callbacks?.onError?.(
      new Event("error") as SpeechSynthesisErrorEvent
    );
    return null;
  }

  if (!text || text.trim() === "") {
    console.error("No text provided for TTS");
    return null;
  }

  // Stop any currently speaking utterance
  stopSpeaking();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Set language to Italian
  utterance.lang = "it-IT";

  // Apply settings with defaults
  utterance.rate = settings.rate ?? DEFAULT_TTS_SETTINGS.rate;
  utterance.pitch = settings.pitch ?? DEFAULT_TTS_SETTINGS.pitch;
  utterance.volume = settings.volume ?? DEFAULT_TTS_SETTINGS.volume;

  // Set voice (or use best available)
  const voice = settings.voice ?? getBestItalianVoice();
  if (voice) {
    utterance.voice = voice;
  }

  // Attach event listeners
  if (callbacks?.onStart) {
    utterance.onstart = callbacks.onStart;
  }

  if (callbacks?.onEnd) {
    utterance.onend = callbacks.onEnd;
  }

  if (callbacks?.onError) {
    utterance.onerror = callbacks.onError;
  }

  // Speak the text
  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Error speaking text:", error);
    callbacks?.onError?.(error as SpeechSynthesisErrorEvent);
    return null;
  }

  return utterance;
}

/**
 * Stop current speech synthesis
 */
export function stopSpeaking(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Pause current speech synthesis
 */
export function pauseSpeaking(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech synthesis
 */
export function resumeSpeaking(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.resume();
  }
}

/**
 * Check if speech synthesis is currently speaking
 */
export function isSpeaking(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Check if speech synthesis is paused
 */
export function isPaused(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.paused;
}

/**
 * Wait for voices to be loaded
 * Some browsers load voices asynchronously
 *
 * @returns Promise that resolves when voices are available
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();

    // If voices are already loaded, resolve immediately
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voiceschanged event (Chrome/Edge behavior)
    window.speechSynthesis.onvoiceschanged = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      resolve(loadedVoices);
    };

    // Timeout fallback (in case event never fires)
    setTimeout(() => {
      const loadedVoices = window.speechSynthesis.getVoices();
      resolve(loadedVoices);
    }, 1000);
  });
}

/**
 * Get TTS error message for user-friendly display
 */
export function getTTSErrorMessage(error: SpeechSynthesisErrorEvent): string {
  switch (error.error) {
    case "canceled":
      return "Speech was canceled";
    case "interrupted":
      return "Speech was interrupted";
    case "audio-busy":
      return "Audio system is busy";
    case "audio-hardware":
      return "Audio hardware error";
    case "network":
      return "Network error during speech";
    case "synthesis-unavailable":
      return "Speech synthesis unavailable";
    case "synthesis-failed":
      return "Speech synthesis failed";
    case "language-unavailable":
      return "Italian voice not available";
    case "voice-unavailable":
      return "Selected voice not available";
    case "text-too-long":
      return "Text too long to speak";
    case "invalid-argument":
      return "Invalid speech argument";
    case "not-allowed":
      return "Speech not allowed";
    default:
      return "Speech error occurred";
  }
}
