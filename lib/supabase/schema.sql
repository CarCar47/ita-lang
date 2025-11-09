-- Parla Italiano Database Schema
-- This schema includes all tables for the Italian learning game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LESSONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'beginner', 'intermediate', 'advanced'
  order_index INTEGER NOT NULL,
  estimated_duration INTEGER, -- in minutes
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(level, order_index)
);

-- ============================================
-- VOCABULARY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  italian VARCHAR(255) NOT NULL,
  english VARCHAR(255) NOT NULL,
  pronunciation VARCHAR(255), -- phonetic transcription
  audio_url TEXT, -- URL to audio file in Supabase Storage
  type VARCHAR(50), -- 'noun', 'verb', 'adjective', 'phrase', etc.
  gender VARCHAR(10), -- 'masculine', 'feminine', 'neutral' for nouns
  example_sentence_italian TEXT,
  example_sentence_english TEXT,
  difficulty_level INTEGER DEFAULT 1, -- 1-5
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, order_index)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson_id ON vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_type ON vocabulary(type);

-- ============================================
-- USER PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0, -- 0-100
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed);

-- ============================================
-- VOCABULARY MASTERY TABLE
-- (Track individual word progress for spaced repetition)
-- ============================================
CREATE TABLE IF NOT EXISTS vocabulary_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0, -- 0-5 (higher = better mastered)
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE, -- for spaced repetition
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_vocabulary_mastery_user_id ON vocabulary_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_mastery_next_review ON vocabulary_mastery(next_review_at);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon_name VARCHAR(100), -- icon identifier for UI
  requirement_type VARCHAR(50), -- 'lessons_completed', 'streak_days', 'words_learned', 'perfect_scores'
  requirement_value INTEGER, -- threshold to unlock
  points INTEGER DEFAULT 0, -- gamification points
  badge_tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);

-- ============================================
-- USER STREAKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_study_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER STATS TABLE
-- (Overall user statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_lessons_completed INTEGER DEFAULT 0,
  total_words_learned INTEGER DEFAULT 0,
  total_study_time_minutes INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.0,
  pronunciation_accuracy DECIMAL(5,2) DEFAULT 0.0,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1, -- user overall level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal_minutes INTEGER DEFAULT 15,
  notification_enabled BOOLEAN DEFAULT true,
  audio_enabled BOOLEAN DEFAULT true,
  pronunciation_practice_enabled BOOLEAN DEFAULT true,
  ui_language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Lessons and Vocabulary: Everyone can read, only authenticated users can use them
CREATE POLICY "Lessons are viewable by everyone"
  ON lessons FOR SELECT
  USING (is_published = true);

CREATE POLICY "Vocabulary is viewable by everyone"
  ON vocabulary FOR SELECT
  USING (true);

-- User Progress: Users can only see and modify their own progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Vocabulary Mastery: Users can only see and modify their own mastery
CREATE POLICY "Users can view their own vocabulary mastery"
  ON vocabulary_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabulary mastery"
  ON vocabulary_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary mastery"
  ON vocabulary_mastery FOR UPDATE
  USING (auth.uid() = user_id);

-- Achievements: Everyone can read
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- User Achievements: Users can only see their own
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Streaks: Users can only access their own
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- User Stats: Users can only access their own
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- User Preferences: Users can only access their own
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON vocabulary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_mastery_updated_at BEFORE UPDATE ON vocabulary_mastery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user data on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_streaks (user_id)
  VALUES (NEW.id);

  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA - Sample Achievements
-- ============================================

INSERT INTO achievements (name, description, icon_name, requirement_type, requirement_value, points, badge_tier) VALUES
('First Steps', 'Complete your first lesson', 'trophy', 'lessons_completed', 1, 10, 'bronze'),
('Getting Started', 'Complete 5 lessons', 'trophy', 'lessons_completed', 5, 25, 'bronze'),
('Dedicated Learner', 'Complete 10 lessons', 'trophy', 'lessons_completed', 10, 50, 'silver'),
('Italian Scholar', 'Complete all 15 lessons', 'trophy', 'lessons_completed', 15, 100, 'gold'),
('On Fire', 'Maintain a 7-day streak', 'fire', 'streak_days', 7, 30, 'silver'),
('Unstoppable', 'Maintain a 30-day streak', 'fire', 'streak_days', 30, 100, 'gold'),
('Vocabulary Builder', 'Learn 100 words', 'book', 'words_learned', 100, 50, 'silver'),
('Word Master', 'Learn 500 words', 'book', 'words_learned', 500, 150, 'platinum'),
('Perfectionist', 'Get 3 perfect scores in a row', 'star', 'perfect_scores', 3, 50, 'gold'),
('Pronunciation Pro', 'Achieve 90% pronunciation accuracy', 'microphone', 'pronunciation_accuracy', 90, 75, 'gold')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE lessons IS 'Stores all Italian learning lessons with metadata';
COMMENT ON TABLE vocabulary IS 'Individual Italian words and phrases for each lesson';
COMMENT ON TABLE user_progress IS 'Tracks user completion and scores for each lesson';
COMMENT ON TABLE vocabulary_mastery IS 'Spaced repetition system for individual vocabulary words';
COMMENT ON TABLE achievements IS 'Definitions of all available achievements';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has earned';
COMMENT ON TABLE user_streaks IS 'Daily activity streaks for gamification';
COMMENT ON TABLE user_stats IS 'Aggregate statistics for each user';
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
