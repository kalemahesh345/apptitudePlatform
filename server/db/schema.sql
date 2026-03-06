-- Aptitude Platform Database Schema (MySQL)
-- Run: mysql -u root -psystem < db/schema.sql

CREATE DATABASE IF NOT EXISTS apptitude_db;
USE apptitude_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('USER', 'ADMIN', 'PREMIUM') DEFAULT 'USER',
  avatar VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Tests / Categories
CREATE TABLE IF NOT EXISTS tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('quantitative', 'logical', 'verbal', 'technical') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  total_marks INT NOT NULL DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  is_adaptive BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty)
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  question_text TEXT NOT NULL,
  explanation TEXT,
  topic VARCHAR(100),
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  marks INT DEFAULT 1,
  negative_marks DECIMAL(3,2) DEFAULT 0,
  time_limit_seconds INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_test_id (test_id),
  INDEX idx_topic (topic)
);

-- Options for questions
CREATE TABLE IF NOT EXISTS options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id)
);

-- Test Attempts
CREATE TABLE IF NOT EXISTS test_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  time_taken_seconds INT DEFAULT 0,
  score DECIMAL(6,2) DEFAULT 0,
  total_marks INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  unanswered_count INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  tab_switch_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_test_id (test_id),
  INDEX idx_status (status)
);

-- User Answers
CREATE TABLE IF NOT EXISTS user_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option_id INT DEFAULT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE SET NULL,
  INDEX idx_attempt_id (attempt_id)
);

-- User Progress tracking
CREATE TABLE IF NOT EXISTS progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  topic VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  tests_taken INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  avg_time_per_question DECIMAL(6,2) DEFAULT 0,
  skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_topic (user_id, topic),
  INDEX idx_user_id (user_id)
);

-- Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  topic VARCHAR(100) NOT NULL,
  category ENUM('quantitative', 'logical', 'verbal', 'technical') NOT NULL,
  type ENUM('notes', 'pdf', 'practice', 'link') DEFAULT 'notes',
  resource_url VARCHAR(500),
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_topic (topic),
  INDEX idx_category (category)
);

-- Subscriptions (Premium)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('analysis', 'study_plan', 'explanation', 'chat') NOT NULL,
  input_data JSON,
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type)
);

-- AI Chat Logs
CREATE TABLE IF NOT EXISTS ai_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(100),
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id)
);

-- Leaderboard (cached/materialized)
CREATE TABLE IF NOT EXISTS leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(100),
  total_score DECIMAL(10,2) DEFAULT 0,
  tests_completed INT DEFAULT 0,
  avg_accuracy DECIMAL(5,2) DEFAULT 0,
  rank_position INT DEFAULT 0,
  period ENUM('weekly', 'monthly', 'alltime') DEFAULT 'alltime',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_period (user_id, period),
  INDEX idx_rank (rank_position)
);
