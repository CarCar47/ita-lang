"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePreferencesStore } from "@/lib/stores/preferencesStore";
import { useStatsStore } from "@/lib/stores/statsStore";
import { exportProgress, importProgress, resetAllProgress } from "@/lib/storage";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@/components/ui";

export default function SettingsPage() {
  const { preferences, loadPreferences, setDailyGoal, toggleAudio, togglePronunciationPractice, setTheme, setUILanguage } = usePreferencesStore();
  const { streak, loadStats } = useStatsStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPreferences();
    loadStats();
  }, [loadPreferences, loadStats]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportProgress = () => {
    try {
      const jsonData = exportProgress();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `parla-italiano-progress-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Progress exported successfully!", "success");
    } catch (error) {
      showToast("Failed to export progress", "error");
      console.error(error);
    }
  };

  const handleImportProgress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const success = importProgress(jsonString);
        if (success) {
          showToast("Progress imported successfully! Refreshing page...", "success");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showToast("Failed to import progress - Invalid file format", "error");
        }
      } catch (error) {
        showToast("Failed to import progress", "error");
        console.error(error);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleResetProgress = () => {
    if (resetConfirmText !== "DELETE") {
      showToast("Please type DELETE to confirm", "error");
      return;
    }

    try {
      resetAllProgress();
      showToast("All progress reset successfully! Refreshing page...", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      showToast("Failed to reset progress", "error");
      console.error(error);
    }
  };

  const dailyGoalOptions = [5, 10, 15, 20, 30, 45, 60];

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
                ⚙️ Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Customize your learning experience
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-green-600 dark:bg-green-700" : "bg-red-600 dark:bg-red-700"
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Preferences Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🎯 Learning Preferences
          </h2>

          <Card>
            <CardContent className="py-6 space-y-6">
              {/* Daily Goal */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Daily Study Goal</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Set your daily learning target</p>
                  </div>
                  <Badge variant="info" size="lg">
                    {preferences.dailyGoalMinutes} min
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dailyGoalOptions.map((minutes) => (
                    <Button
                      key={minutes}
                      variant={preferences.dailyGoalMinutes === minutes ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setDailyGoal(minutes)}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Audio Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Audio / Text-to-Speech</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable pronunciation audio</p>
                </div>
                <button
                  onClick={toggleAudio}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.audioEnabled ? "bg-green-600 dark:bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.audioEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Pronunciation Practice */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pronunciation Practice</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable voice recording exercises</p>
                </div>
                <button
                  onClick={togglePronunciationPractice}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.pronunciationPracticeEnabled ? "bg-green-600 dark:bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.pronunciationPracticeEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Theme */}
              <div>
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Theme</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose your display theme</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={preferences.theme === "light" ? "primary" : "outline"}
                    onClick={() => setTheme("light")}
                  >
                    ☀️ Light
                  </Button>
                  <Button
                    variant={preferences.theme === "dark" ? "primary" : "outline"}
                    onClick={() => setTheme("dark")}
                  >
                    🌙 Dark
                  </Button>
                  <Button
                    variant={preferences.theme === "auto" ? "primary" : "outline"}
                    onClick={() => setTheme("auto")}
                  >
                    🔄 Auto
                  </Button>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* UI Language */}
              <div>
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Interface Language</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose your UI language</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={preferences.uiLanguage === "en" ? "primary" : "outline"}
                    onClick={() => setUILanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    variant={preferences.uiLanguage === "it" ? "primary" : "outline"}
                    onClick={() => setUILanguage("it")}
                  >
                    🇮🇹 Italiano
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Management Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            💾 Data Management
          </h2>

          <Card>
            <CardContent className="py-6 space-y-4">
              {/* Export Progress */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Export Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download your progress as JSON</p>
                </div>
                <Button variant="secondary" onClick={handleExportProgress}>
                  📥 Export
                </Button>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Import Progress */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Import Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Restore from a backup file</p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportProgress}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📤 Import
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            ⚠️ Danger Zone
          </h2>

          <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <CardContent className="py-6">
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Reset All Progress</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  This will permanently delete all your lessons progress, vocabulary mastery,
                  achievements, and statistics. This action cannot be undone!
                </p>
                <Button
                  variant="danger"
                  onClick={() => setShowResetModal(true)}
                >
                  🗑️ Reset All Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Info Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            👤 Account Information
          </h2>

          <Card>
            <CardContent className="py-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Active</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(streak.lastActivityDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Study Days</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{streak.totalStudyDays}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Data Storage</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">Local (Browser)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Account Required</span>
                <Badge variant="success" size="sm">No</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ℹ️ About Parla Italiano
          </h2>

          <Card>
            <CardContent className="py-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Parla Italiano</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learn Italian, one word at a time. A free, offline-first Italian learning app
                  built with modern web technologies.
                </p>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">1.0.0</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cost</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">$0/month</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Technology</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Next.js + PWA</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Privacy</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">100% Local</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">⚠️ Confirm Reset</CardTitle>
              <CardDescription>
                This action cannot be undone. All your progress will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleResetProgress}
                  disabled={resetConfirmText !== "DELETE"}
                >
                  Reset All Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
