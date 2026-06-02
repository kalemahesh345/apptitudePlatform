-- Aptitude Platform Database Schema (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN', 'PREMIUM')),
  avatar TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK(category IN ('quantitative', 'logical', 'verbal', 'technical')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_marks INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  is_adaptive BOOLEAN DEFAULT FALSE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  explanation TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
  marks INTEGER DEFAULT 1,
  negative_marks REAL DEFAULT 0,
  time_limit_seconds INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  test_id INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'abandoned')),
  time_taken_seconds INTEGER DEFAULT 0,
  score REAL DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  tab_switch_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_option_id INTEGER DEFAULT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('quantitative', 'logical', 'verbal', 'technical')),
  tests_taken INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  avg_time_per_question INTEGER DEFAULT 0,
  skill_level TEXT DEFAULT 'beginner' CHECK(skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('quantitative', 'logical', 'verbal', 'technical')),
  type TEXT DEFAULT 'notes' CHECK(type IN ('notes', 'video', 'practice')),
  video_url TEXT,
  file_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('study_plan', 'analysis', 'topic_focus')),
  input_data TEXT,
  recommendation TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_category ON tests (category);
CREATE INDEX IF NOT EXISTS idx_difficulty ON tests (difficulty);
CREATE INDEX IF NOT EXISTS idx_test_id ON questions (test_id);
CREATE INDEX IF NOT EXISTS idx_topic ON questions (topic);
CREATE INDEX IF NOT EXISTS idx_question_id ON options (question_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON test_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_test_id2 ON test_attempts (test_id);
CREATE INDEX IF NOT EXISTS idx_status ON test_attempts (status);
CREATE INDEX IF NOT EXISTS idx_attempt_id ON user_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_question_id2 ON user_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_user_topic ON progress (user_id, topic);
