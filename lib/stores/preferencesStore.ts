import { create } from "zustand";
import type { UserPreferences } from "@/types";
import { getPreferences, savePreferences } from "@/lib/storage";

interface PreferencesState {
  preferences: UserPreferences;

  // Actions
  loadPreferences: () => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  toggleAudio: () => void;
  togglePronunciationPractice: () => void;
  setDailyGoal: (minutes: number) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setUILanguage: (language: "en" | "it") => void;
}

// Helper function to apply theme to DOM
const applyThemeToDom = (theme: "light" | "dark" | "auto") => {
  if (typeof window === "undefined") return;

  try {
    const root = window.document.documentElement;

    if (!root) {
      console.warn("documentElement not available");
      return;
    }

    console.log("Applying theme:", theme);

    // Remove dark class first to ensure clean state
    root.classList.remove("dark");

    if (theme === "dark") {
      root.classList.add("dark");
      console.log("Dark mode applied, classList:", root.classList.toString());
    } else if (theme === "light") {
      // Already removed above
      console.log("Light mode applied, classList:", root.classList.toString());
    } else {
      // Auto: use system preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
        console.log("Auto mode (dark) applied, classList:", root.classList.toString());
      } else {
        console.log("Auto mode (light) applied, classList:", root.classList.toString());
      }
    }
  } catch (error) {
    console.error("Error applying theme:", error);
  }
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: {
    dailyGoalMinutes: 15,
    notificationEnabled: false,
    audioEnabled: true,
    pronunciationPracticeEnabled: true,
    uiLanguage: "en",
    theme: "auto",
  },

  // Load preferences from localStorage
  loadPreferences: () => {
    const preferences = getPreferences();
    set({ preferences });

    // Apply theme using helper function
    applyThemeToDom(preferences.theme);
  },

  // Update preferences
  updatePreferences: (updates: Partial<UserPreferences>) => {
    const currentPreferences = get().preferences;
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
    };
    savePreferences(updatedPreferences);
    set({ preferences: updatedPreferences });

    // Update theme if changed
    if (updates.theme) {
      applyThemeToDom(updates.theme);
    }
  },

  // Toggle audio
  toggleAudio: () => {
    const current = get().preferences.audioEnabled;
    get().updatePreferences({ audioEnabled: !current });
  },

  // Toggle pronunciation practice
  togglePronunciationPractice: () => {
    const current = get().preferences.pronunciationPracticeEnabled;
    get().updatePreferences({ pronunciationPracticeEnabled: !current });
  },

  // Set daily goal
  setDailyGoal: (minutes: number) => {
    get().updatePreferences({ dailyGoalMinutes: minutes });
  },

  // Set theme
  setTheme: (theme: "light" | "dark" | "auto") => {
    get().updatePreferences({ theme });
  },

  // Set UI language
  setUILanguage: (language: "en" | "it") => {
    get().updatePreferences({ uiLanguage: language });
  },
}));
