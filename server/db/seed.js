require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Wait for db init
  const pool = require('../config/db');
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Create Tables (SQLite syntax)
    const createStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'USER',
        avatar TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        total_marks INTEGER NOT NULL DEFAULT 0,
        is_premium INTEGER DEFAULT 0,
        is_adaptive INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        explanation TEXT,
        topic TEXT,
        difficulty TEXT DEFAULT 'medium',
        marks INTEGER DEFAULT 1,
        negative_marks REAL DEFAULT 0,
        time_limit_seconds INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS test_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        status TEXT DEFAULT 'in_progress',
        time_taken_seconds INTEGER DEFAULT 0,
        score REAL DEFAULT 0,
        total_marks INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        unanswered_count INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_option_id INTEGER DEFAULT NULL,
        is_correct INTEGER DEFAULT 0,
        time_spent_seconds INTEGER DEFAULT 0,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        category TEXT,
        tests_taken INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        avg_time_per_question REAL DEFAULT 0,
        skill_level TEXT DEFAULT 'beginner',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic)
      )`,
      `CREATE TABLE IF NOT EXISTS study_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        topic TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT DEFAULT 'notes',
        resource_url TEXT,
        is_premium INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS ai_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        input_data TEXT,
        recommendation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS ai_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT,
        role TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        total_score REAL DEFAULT 0,
        tests_completed INTEGER DEFAULT 0,
        avg_accuracy REAL DEFAULT 0,
        rank_position INTEGER DEFAULT 0,
        period TEXT DEFAULT 'alltime',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, period)
      )`
    ];

    for (const stmt of createStatements) {
      await pool.query(stmt);
    }
    console.log('✅ Tables created\n');

    // Check if already seeded
    const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('⚠️  Database already seeded. Skipping...\n');
      process.exit(0);
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@aptitude.com', adminPassword, 'ADMIN']
    );

    // Create demo users
    const userPassword = await bcrypt.hash('user123', 12);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Rahul Sharma', 'rahul@test.com', userPassword, 'USER']
    );
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Priya Patel', 'priya@test.com', userPassword, 'PREMIUM']
    );
    console.log('✅ Users created\n');

    // Create Tests
    const tests = [
      { title: 'Quantitative Aptitude - Basics', description: 'Test your fundamental math skills with arithmetic, percentages, and ratios', category: 'quantitative', difficulty: 'easy', duration: 15 },
      { title: 'Quantitative Aptitude - Advanced', description: 'Challenge yourself with probability, permutations, and complex problems', category: 'quantitative', difficulty: 'hard', duration: 30 },
      { title: 'Logical Reasoning - Fundamentals', description: 'Assess your ability to analyze patterns and logical sequences', category: 'logical', difficulty: 'easy', duration: 15 },
      { title: 'Logical Reasoning - Advanced', description: 'Complex puzzles, seating arrangements, and blood relations', category: 'logical', difficulty: 'hard', duration: 30 },
      { title: 'Verbal Ability - Grammar & Vocabulary', description: 'Test your English grammar, vocabulary, and comprehension', category: 'verbal', difficulty: 'medium', duration: 20 },
      { title: 'Technical Aptitude - CS Fundamentals', description: 'Data structures, algorithms, and programming concepts', category: 'technical', difficulty: 'medium', duration: 25 },
    ];

    const testIds = [];
    for (const t of tests) {
      const [result] = await pool.query(
        'INSERT INTO tests (title, description, category, difficulty, duration_minutes, total_marks, created_by) VALUES (?, ?, ?, ?, ?, 0, 1)',
        [t.title, t.description, t.category, t.difficulty, t.duration]
      );
      testIds.push(result.insertId);
    }
    console.log(`✅ ${tests.length} tests created\n`);

    // All questions
    const allQuestions = [
      // Quantitative Aptitude - Basics (testIds[0])
      { testIdx: 0, text: 'What is 15% of 200?', topic: 'Percentages', explanation: '15% of 200 = (15/100) × 200 = 30', options: [{ text: '25', correct: false }, { text: '30', correct: true }, { text: '35', correct: false }, { text: '20', correct: false }] },
      { testIdx: 0, text: 'A train travels 180 km in 3 hours. What is its speed?', topic: 'Speed, Time & Distance', explanation: 'Speed = Distance/Time = 180/3 = 60 km/h', options: [{ text: '45 km/h', correct: false }, { text: '50 km/h', correct: false }, { text: '60 km/h', correct: true }, { text: '55 km/h', correct: false }] },
      { testIdx: 0, text: 'If the ratio of boys to girls is 3:2 and there are 30 boys, how many girls are there?', topic: 'Ratios', explanation: '30/3 = 10 units, 10 × 2 = 20 girls', options: [{ text: '15', correct: false }, { text: '20', correct: true }, { text: '25', correct: false }, { text: '18', correct: false }] },
      { testIdx: 0, text: 'What is the simple interest on Rs. 5000 at 8% per annum for 2 years?', topic: 'Simple Interest', explanation: 'SI = PRT/100 = 5000 × 8 × 2 / 100 = Rs. 800', options: [{ text: 'Rs. 600', correct: false }, { text: 'Rs. 700', correct: false }, { text: 'Rs. 800', correct: true }, { text: 'Rs. 900', correct: false }] },
      { testIdx: 0, text: 'If a shirt costs Rs. 800 after a 20% discount, what was the original price?', topic: 'Percentages', explanation: '80% of original = 800, original = 1000', options: [{ text: 'Rs. 960', correct: false }, { text: 'Rs. 1000', correct: true }, { text: 'Rs. 1100', correct: false }, { text: 'Rs. 900', correct: false }] },
      { testIdx: 0, text: 'What is the average of first 10 natural numbers?', topic: 'Averages', explanation: 'Sum = 55, Average = 55/10 = 5.5', options: [{ text: '5', correct: false }, { text: '5.5', correct: true }, { text: '6', correct: false }, { text: '4.5', correct: false }] },
      { testIdx: 0, text: 'A man buys an article for Rs. 500 and sells it for Rs. 600. Profit%?', topic: 'Profit & Loss', explanation: 'Profit% = (100/500) × 100 = 20%', options: [{ text: '10%', correct: false }, { text: '15%', correct: false }, { text: '20%', correct: true }, { text: '25%', correct: false }] },
      { testIdx: 0, text: 'If x + y = 10 and x - y = 4, what is x?', topic: 'Algebra', explanation: '2x = 14, x = 7', options: [{ text: '5', correct: false }, { text: '6', correct: false }, { text: '7', correct: true }, { text: '8', correct: false }] },
      { testIdx: 0, text: 'The LCM of 12 and 18 is:', topic: 'Number System', explanation: '12=2²×3, 18=2×3². LCM=2²×3²=36', options: [{ text: '24', correct: false }, { text: '36', correct: true }, { text: '48', correct: false }, { text: '72', correct: false }] },
      { testIdx: 0, text: 'Two pipes fill a tank in 6h and 8h. Together how long?', topic: 'Time & Work', explanation: '1/6+1/8=7/24. Time=24/7≈3h26m', options: [{ text: '3h 26m', correct: true }, { text: '4h', correct: false }, { text: '3h', correct: false }, { text: '7h', correct: false }] },

      // Logical Reasoning (testIds[2])
      { testIdx: 2, text: 'Complete the series: 2, 6, 12, 20, ?', topic: 'Number Series', explanation: 'Diffs: 4,6,8. Next=10, so 30', options: [{ text: '28', correct: false }, { text: '30', correct: true }, { text: '32', correct: false }, { text: '24', correct: false }] },
      { testIdx: 2, text: 'If APPLE is coded as 50, then MANGO is coded as:', topic: 'Coding-Decoding', explanation: 'Sum of positions: M=13,A=1,N=14,G=7,O=15=50', options: [{ text: '45', correct: false }, { text: '50', correct: true }, { text: '55', correct: false }, { text: '60', correct: false }] },
      { testIdx: 2, text: 'All roses are flowers. Some flowers are red. Valid conclusion?', topic: 'Syllogisms', explanation: 'No direct link between roses and red', options: [{ text: 'All roses are red', correct: false }, { text: 'Some roses are red', correct: false }, { text: 'No valid conclusion', correct: true }, { text: 'No roses are red', correct: false }] },
      { testIdx: 2, text: 'Which number replaces? 3, 9, 27, 81, ?', topic: 'Number Series', explanation: 'Each × 3. 81 × 3 = 243', options: [{ text: '162', correct: false }, { text: '200', correct: false }, { text: '243', correct: true }, { text: '256', correct: false }] },
      { testIdx: 2, text: 'Rearrange CIFAIPC to get name of a/an:', topic: 'Puzzles', explanation: 'PACIFIC (an ocean)', options: [{ text: 'City', correct: false }, { text: 'Animal', correct: false }, { text: 'Ocean', correct: true }, { text: 'Country', correct: false }] },
      { testIdx: 2, text: 'In a row of 40, Ramesh is 15th from left, Suresh 20th from right. Students between?', topic: 'Linear Arrangement', explanation: 'Suresh=21st from left. Between=21-15-1=5', options: [{ text: '4', correct: false }, { text: '5', correct: true }, { text: '6', correct: false }, { text: '7', correct: false }] },

      // Verbal Ability (testIds[4])
      { testIdx: 4, text: 'Choose the correct synonym of "BENEVOLENT":', topic: 'Vocabulary', explanation: 'Benevolent = kind, generous', options: [{ text: 'Cruel', correct: false }, { text: 'Generous', correct: true }, { text: 'Strict', correct: false }, { text: 'Hasty', correct: false }] },
      { testIdx: 4, text: 'Choose the antonym of "OBSCURE":', topic: 'Vocabulary', explanation: 'Obscure opposite is Clear', options: [{ text: 'Hidden', correct: false }, { text: 'Vague', correct: false }, { text: 'Clear', correct: true }, { text: 'Dark', correct: false }] },
      { testIdx: 4, text: 'Select the correctly spelled word:', topic: 'Spelling', explanation: 'Accommodation has double c and double m', options: [{ text: 'Accomodation', correct: false }, { text: 'Accommodation', correct: true }, { text: 'Acomodation', correct: false }, { text: 'Accomodaton', correct: false }] },
      { testIdx: 4, text: '"She is _____ honest person." Fill in:', topic: 'Grammar', explanation: '"An" before vowel sounds (silent h)', options: [{ text: 'a', correct: false }, { text: 'an', correct: true }, { text: 'the', correct: false }, { text: 'no article', correct: false }] },
      { testIdx: 4, text: '"To burn the midnight oil" means:', topic: 'Idioms', explanation: 'To study/work late at night', options: [{ text: 'Waste resources', correct: false }, { text: 'Study/work late', correct: true }, { text: 'Start a fire', correct: false }, { text: 'Cook food', correct: false }] },

      // Technical (testIds[5])
      { testIdx: 5, text: 'Time complexity of binary search?', topic: 'Algorithms', explanation: 'Divides in half each time = O(log n)', options: [{ text: 'O(n)', correct: false }, { text: 'O(log n)', correct: true }, { text: 'O(n log n)', correct: false }, { text: 'O(1)', correct: false }] },
      { testIdx: 5, text: 'Which data structure uses LIFO?', topic: 'Data Structures', explanation: 'Stack = Last In First Out', options: [{ text: 'Queue', correct: false }, { text: 'Stack', correct: true }, { text: 'Array', correct: false }, { text: 'Linked List', correct: false }] },
      { testIdx: 5, text: 'What does SQL stand for?', topic: 'Databases', explanation: 'Structured Query Language', options: [{ text: 'Simple Query Language', correct: false }, { text: 'Structured Query Language', correct: true }, { text: 'Standard Query Logic', correct: false }, { text: 'System Query Language', correct: false }] },
      { testIdx: 5, text: 'Best average-case sorting algorithm?', topic: 'Algorithms', explanation: 'Merge Sort has O(n log n) and stable', options: [{ text: 'Bubble Sort', correct: false }, { text: 'Selection Sort', correct: false }, { text: 'Merge Sort', correct: true }, { text: 'Insertion Sort', correct: false }] },
      { testIdx: 5, text: 'HTTP 404 means?', topic: 'Web Technologies', explanation: 'Resource not found', options: [{ text: 'Server Error', correct: false }, { text: 'Not Found', correct: true }, { text: 'Unauthorized', correct: false }, { text: 'Bad Request', correct: false }] },
      { testIdx: 5, text: 'In OOP, encapsulation is?', topic: 'OOP', explanation: 'Bundling data and methods, hiding internals', options: [{ text: 'Inheriting from parent', correct: false }, { text: 'Hiding data via methods', correct: true }, { text: 'Multiple forms', correct: false }, { text: 'Creating objects', correct: false }] },
    ];

    let totalQ = 0;
    for (const q of allQuestions) {
      const [qResult] = await pool.query(
        'INSERT INTO questions (test_id, question_text, explanation, topic, difficulty, marks) VALUES (?, ?, ?, ?, ?, ?)',
        [testIds[q.testIdx], q.text, q.explanation, q.topic, 'medium', 1]
      );
      for (const opt of q.options) {
        await pool.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
          [qResult.insertId, opt.text, opt.correct ? 1 : 0]
        );
      }
      totalQ++;
    }

    // Update total_marks per test
    for (let i = 0; i < testIds.length; i++) {
      const [countRows] = await pool.query('SELECT COUNT(*) as count FROM questions WHERE test_id = ?', [testIds[i]]);
      await pool.query('UPDATE tests SET total_marks = ? WHERE id = ?', [countRows[0].count, testIds[i]]);
    }

    console.log(`✅ ${totalQ} questions created\n`);

    // Study materials
    const materials = [
      { title: 'Percentage Concepts & Shortcuts', content: 'Formula: Percentage = (Value/Total) × 100\n\nKey Shortcuts:\n- x% of y = y% of x\n- Increase by x%: multiply by (1 + x/100)\n- Decrease by x%: multiply by (1 - x/100)\n\nCommon fractions: 1/4=25%, 1/3≈33.3%, 1/5=20%', topic: 'Percentages', category: 'quantitative' },
      { title: 'Speed, Time and Distance', content: 'Key Formulas:\n- Speed = Distance/Time\n- Distance = Speed × Time\n- Time = Distance/Speed\n\nAverage Speed (same distance): 2ab/(a+b)\nRelative Speed: Same dir |a-b|, Opposite a+b', topic: 'Speed, Time & Distance', category: 'quantitative' },
      { title: 'Number Series Patterns', content: 'Common Patterns:\n1. Arithmetic: Constant difference\n2. Geometric: Constant ratio\n3. Squares: 1,4,9,16,25...\n4. Fibonacci: Sum of previous two\n\nStrategy: Check differences first, then ratios', topic: 'Number Series', category: 'logical' },
      { title: 'Binary Search Explained', content: 'Divide and conquer for sorted arrays.\n\nAlgorithm: Compare middle, go left or right.\n\nTime: O(log n)\nSpace: O(1) iterative, O(log n) recursive', topic: 'Algorithms', category: 'technical' },
    ];

    for (const m of materials) {
      await pool.query(
        'INSERT INTO study_materials (title, content, topic, category, type) VALUES (?, ?, ?, ?, ?)',
        [m.title, m.content, m.topic, m.category, 'notes']
      );
    }
    console.log(`✅ ${materials.length} study materials created\n`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:   admin@aptitude.com / admin123');
    console.log('   User:    rahul@test.com / user123');
    console.log('   Premium: priya@test.com / user123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
