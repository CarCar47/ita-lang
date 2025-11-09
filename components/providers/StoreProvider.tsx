"use client";

import { useEffect } from "react";
import { initializeStorage } from "@/lib/storage";
import { useProgressStore } from "@/lib/stores/progressStore";
import { useStatsStore } from "@/lib/stores/statsStore";
import { usePreferencesStore } from "@/lib/stores/preferencesStore";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const loadProgress = useProgressStore((state) => state.loadProgress);
  const loadStats = useStatsStore((state) => state.loadStats);
  const loadPreferences = usePreferencesStore((state) => state.loadPreferences);

  useEffect(() => {
    // Initialize localStorage with default values if needed
    initializeStorage();

    // Load data from localStorage into Zustand stores
    loadProgress();
    loadStats();
    loadPreferences();
  }, [loadProgress, loadStats, loadPreferences]);

  return <>{children}</>;
}
