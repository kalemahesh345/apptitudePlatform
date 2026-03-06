require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function addDummyData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'system',
    database: process.env.DB_NAME || 'apptitude_db',
    multipleStatements: true
  });

  console.log('🎲 Adding dummy data...\n');

  try {
    // ============ 1. CREATE DUMMY USERS ============
    const password = await bcrypt.hash('password123', 12);
    const users = [
      { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', role: 'USER' },
      { name: 'Priya Patel', email: 'priya.patel@gmail.com', role: 'USER' },
      { name: 'Amit Kumar', email: 'amit.kumar@yahoo.com', role: 'USER' },
      { name: 'Sneha Reddy', email: 'sneha.reddy@outlook.com', role: 'PREMIUM' },
      { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', role: 'USER' },
      { name: 'Anjali Gupta', email: 'anjali.gupta@gmail.com', role: 'USER' },
      { name: 'Rohan Desai', email: 'rohan.desai@hotmail.com', role: 'USER' },
      { name: 'Kavya Nair', email: 'kavya.nair@gmail.com', role: 'PREMIUM' },
      { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', role: 'USER' },
      { name: 'Divya Joshi', email: 'divya.joshi@yahoo.com', role: 'USER' },
      { name: 'Saurabh Shinde', email: 'saurabh.shinde@gmail.com', role: 'USER' },
      { name: 'Neha Kulkarni', email: 'neha.kulkarni@gmail.com', role: 'USER' },
      { name: 'Raj Malhotra', email: 'raj.malhotra@outlook.com', role: 'USER' },
      { name: 'Pooja Iyer', email: 'pooja.iyer@gmail.com', role: 'PREMIUM' },
      { name: 'Karan Chopra', email: 'karan.chopra@gmail.com', role: 'USER' },
    ];

    const userIds = [];
    for (const u of users) {
      try {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [u.name, u.email, password, u.role]
        );
        userIds.push(result.insertId);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
          userIds.push(existing[0].id);
        }
      }
    }
    console.log(`✅ Created/found ${userIds.length} dummy users (password: password123)`);

    // Get all test IDs
    const [tests] = await pool.query('SELECT id, title, duration_minutes FROM tests ORDER BY id');
    if (tests.length === 0) {
      console.log('❌ No tests found! Run seed.js first.');
      await pool.end();
      return;
    }
    console.log(`📝 Found ${tests.length} tests`);

    // Get questions per test
    const testQuestions = {};
    for (const t of tests) {
      const [qs] = await pool.query('SELECT q.id, q.marks FROM questions q WHERE q.test_id = ?', [t.id]);
      const questionOptions = [];
      for (const q of qs) {
        const [opts] = await pool.query('SELECT id, is_correct FROM options WHERE question_id = ?', [q.id]);
        questionOptions.push({ ...q, options: opts });
      }
      testQuestions[t.id] = questionOptions;
    }

    // ============ 2. CREATE TEST ATTEMPTS & ANSWERS ============
    let attemptCount = 0;
    const now = new Date();

    for (const userId of userIds) {
      // Each user takes 3-6 random tests
      const numTests = 3 + Math.floor(Math.random() * 4);
      const shuffledTests = [...tests].sort(() => Math.random() - 0.5).slice(0, numTests);

      for (const test of shuffledTests) {
        const questions = testQuestions[test.id];
        if (!questions || questions.length === 0) continue;

        // Random date in last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const startDate = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000);
        
        // Random time taken (40-90% of duration)
        const timeTaken = Math.floor(test.duration_minutes * 60 * (0.4 + Math.random() * 0.5));
        const completedDate = new Date(startDate.getTime() + timeTaken * 1000);

        // Simulate skill level (random accuracy between 30-95%)
        const skillLevel = 0.3 + Math.random() * 0.65;
        const tabSwitches = Math.floor(Math.random() * 3);

        // Create attempt
        const [attemptResult] = await pool.query(
          `INSERT INTO test_attempts (user_id, test_id, started_at, completed_at, status, time_taken_seconds, tab_switch_count) 
           VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
          [userId, test.id, startDate, completedDate, timeTaken, tabSwitches]
        );
        const attemptId = attemptResult.insertId;

        let correct = 0, incorrect = 0, score = 0, totalMarks = 0;

        for (const q of questions) {
          totalMarks += q.marks;
          const isCorrect = Math.random() < skillLevel;
          const correctOpt = q.options.find(o => o.is_correct);
          const wrongOpts = q.options.filter(o => !o.is_correct);
          
          let selectedOptionId;
          if (isCorrect && correctOpt) {
            selectedOptionId = correctOpt.id;
            correct++;
            score += q.marks;
          } else if (wrongOpts.length > 0) {
            selectedOptionId = wrongOpts[Math.floor(Math.random() * wrongOpts.length)].id;
            incorrect++;
            score -= 0.25;
          } else {
            selectedOptionId = correctOpt ? correctOpt.id : null;
          }

          const timeSpent = 10 + Math.floor(Math.random() * 120);

          await pool.query(
            `INSERT INTO user_answers (attempt_id, question_id, selected_option_id, is_correct, time_spent_seconds) 
             VALUES (?, ?, ?, ?, ?)`,
            [attemptId, q.id, selectedOptionId, isCorrect, timeSpent]
          );
        }

        const unanswered = questions.length - correct - incorrect;
        const accuracy = questions.length > 0 ? (correct / questions.length * 100) : 0;

        await pool.query(
          `UPDATE test_attempts SET score = ?, total_marks = ?, correct_count = ?, incorrect_count = ?, 
           unanswered_count = ?, accuracy = ? WHERE id = ?`,
          [Math.max(0, score), totalMarks, correct, incorrect, unanswered, accuracy.toFixed(2), attemptId]
        );

        attemptCount++;
      }
    }
    console.log(`✅ Created ${attemptCount} test attempts with answers`);

    // ============ 3. UPDATE PROGRESS DATA ============
    let progressCount = 0;
    for (const userId of userIds) {
      const [answers] = await pool.query(`
        SELECT q.topic, t.category, ua.is_correct, ua.time_spent_seconds
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        JOIN test_attempts ta ON ua.attempt_id = ta.id
        JOIN tests t ON ta.test_id = t.id
        WHERE ta.user_id = ? AND ta.status = 'completed'
      `, [userId]);

      const topicStats = {};
      for (const a of answers) {
        const topic = a.topic || 'General';
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0, totalTime: 0, category: a.category || 'quantitative' };
        }
        topicStats[topic].total++;
        if (a.is_correct) topicStats[topic].correct++;
        topicStats[topic].totalTime += a.time_spent_seconds || 0;
      }

      for (const [topic, stats] of Object.entries(topicStats)) {
        const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100) : 0;
        const avgTime = stats.total > 0 ? (stats.totalTime / stats.total) : 0;
        let skillLevel = 'beginner';
        if (accuracy >= 90) skillLevel = 'expert';
        else if (accuracy >= 70) skillLevel = 'advanced';
        else if (accuracy >= 50) skillLevel = 'intermediate';

        try {
          await pool.query(
            `INSERT INTO progress (user_id, topic, category, tests_taken, total_questions, correct_answers, accuracy, avg_time_per_question, skill_level) 
             VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             tests_taken = tests_taken + 1, total_questions = total_questions + VALUES(total_questions),
             correct_answers = correct_answers + VALUES(correct_answers),
             accuracy = VALUES(accuracy), avg_time_per_question = VALUES(avg_time_per_question), skill_level = VALUES(skill_level)`,
            [userId, topic, stats.category, stats.total, stats.correct, accuracy, avgTime, skillLevel]
          );
          progressCount++;
        } catch (e) {
          // ignore
        }
      }
    }
    console.log(`✅ Created ${progressCount} progress entries`);

    // ============ 4. ADD LEADERBOARD DATA ============
    const [leaderboardData] = await pool.query(`
      SELECT 
        u.id as user_id, u.name as user_name,
        COUNT(ta.id) as tests_completed,
        ROUND(AVG(ta.accuracy), 2) as avg_accuracy,
        ROUND(SUM(ta.score), 2) as total_score
      FROM users u
      JOIN test_attempts ta ON u.id = ta.user_id
      WHERE ta.status = 'completed'
      GROUP BY u.id, u.name
      ORDER BY total_score DESC
    `);

    for (const [idx, row] of leaderboardData.entries()) {
      try {
        await pool.query(
          `INSERT INTO leaderboard (user_id, user_name, total_score, tests_completed, avg_accuracy, rank_position, period) 
           VALUES (?, ?, ?, ?, ?, ?, 'alltime')
           ON DUPLICATE KEY UPDATE 
           total_score = VALUES(total_score), tests_completed = VALUES(tests_completed), 
           avg_accuracy = VALUES(avg_accuracy), rank_position = VALUES(rank_position)`,
          [row.user_id, row.user_name, row.total_score, row.tests_completed, row.avg_accuracy, idx + 1]
        );
      } catch (e) {
        // ignore
      }
    }
    console.log(`✅ Updated leaderboard with ${leaderboardData.length} entries`);

    // ============ 5. ADD AI CHAT LOGS ============
    const chatMessages = [
      { role: 'user', msg: 'How do I improve my accuracy in Percentages?' },
      { role: 'assistant', msg: 'Great question! Here are some tips for improving accuracy in percentages:\n\n1. **Master the basics**: Understand that percentage = (part/whole) × 100\n2. **Learn shortcuts**: 10% = divide by 10, 5% = half of 10%, 1% = divide by 100\n3. **Practice mental math**: Try calculating tips and discounts in daily life\n4. **Focus on word problems**: Most errors come from misreading percentage word problems\n5. **Review common formulas**: Profit%, Loss%, Discount%, successive percentages' },
      { role: 'user', msg: 'Can you explain the concept of compound interest?' },
      { role: 'assistant', msg: '## Compound Interest\n\nCompound interest is interest calculated on both the initial principal and accumulated interest.\n\n**Formula**: A = P(1 + R/100)^T\n\nWhere:\n- A = Final amount\n- P = Principal amount\n- R = Rate of interest per annum\n- T = Time in years\n\n**CI = A - P**\n\n**Example**: ₹10,000 at 10% for 2 years\n- A = 10000(1 + 10/100)² = 10000 × 1.21 = ₹12,100\n- CI = 12,100 - 10,000 = ₹2,100\n\nNotice: Simple interest would be ₹2,000. The extra ₹100 is "interest on interest"!' },
      { role: 'user', msg: 'What is a good study plan for logical reasoning?' },
      { role: 'assistant', msg: '## 2-Week Logical Reasoning Study Plan\n\n**Week 1: Foundations**\n- Day 1-2: Number Series & Pattern Recognition\n- Day 3-4: Coding-Decoding (letter shift, mirror, reverse)\n- Day 5-6: Blood Relations & Family Trees\n- Day 7: Practice Test + Review Mistakes\n\n**Week 2: Advanced**\n- Day 8-9: Syllogisms & Logical Deductions\n- Day 10-11: Arrangements (Linear & Circular)\n- Day 12-13: Inequalities & Decision Making\n- Day 14: Full Mock Test + Analysis\n\n**Daily Tips**:\n- Spend 30-45 minutes per topic\n- Solve 10-15 questions daily\n- Review wrong answers before sleeping\n- Track accuracy weekly!' },
      { role: 'user', msg: 'Give me a practice question on Time & Work' },
      { role: 'assistant', msg: '## Practice Question\n\n**Q: A can complete a work in 12 days and B can complete the same work in 18 days. If they work together, how many days will they take?**\n\nA) 6.2 days  B) 7.2 days  C) 8.2 days  D) 9.2 days\n\n---\n\n**Solution**:\n- A\'s 1-day work = 1/12\n- B\'s 1-day work = 1/18\n- Combined 1-day work = 1/12 + 1/18 = 3/36 + 2/36 = 5/36\n- Days = 36/5 = **7.2 days**\n\n**Answer: B) 7.2 days** ✅\n\n**Key Formula**: If A finishes in \'a\' days and B in \'b\' days, together = (a×b)/(a+b) days' },
    ];

    // Add chat logs for some users
    for (let i = 0; i < Math.min(5, userIds.length); i++) {
      const sessionId = `session_${Date.now()}_${i}`;
      for (const chat of chatMessages) {
        await pool.query(
          'INSERT INTO ai_logs (user_id, session_id, role, message) VALUES (?, ?, ?, ?)',
          [userIds[i], sessionId, chat.role, chat.msg]
        );
      }
    }
    console.log('✅ Added AI chat history for 5 users');

    // ============ 6. ADD MORE STUDY MATERIALS ============
    const materials = [
      { title: 'Time & Work Problems', content: 'Master time and work problems with these key formulas:\n\n1. If A can do a piece of work in n days, per day work = 1/n\n2. If A and B work together: 1/A + 1/B = 1/Total\n3. Efficiency is inversely proportional to time\n\nPractice 20 problems daily for mastery.', topic: 'Time & Work', category: 'quantitative', type: 'notes' },
      { title: 'Probability Made Easy', content: 'Probability = Favorable outcomes / Total outcomes\n\nKey concepts:\n- P(A or B) = P(A) + P(B) - P(A and B)\n- P(A and B) = P(A) × P(B) for independent events\n- Complementary: P(not A) = 1 - P(A)\n\nCommon problems: Dice, cards, coins, balls in bags.', topic: 'Probability', category: 'quantitative', type: 'notes' },
      { title: 'Syllogism Rules', content: 'All-All: If All A are B, and All B are C → All A are C\nAll-Some: If All A are B, and Some B are C → No conclusion\nSome-All: If Some A are B, and All B are C → Some A are C\n\nUse Venn diagrams to visualize and verify conclusions.', topic: 'Syllogisms', category: 'logical', type: 'notes' },
      { title: 'Binary Search Explained', content: 'Binary search works on sorted arrays.\n\n1. Find mid = (low + high) / 2\n2. If arr[mid] == target → found\n3. If arr[mid] < target → search right half\n4. If arr[mid] > target → search left half\n\nTime: O(log n), Space: O(1)\n\nUsed in: searching, finding boundaries, optimization problems.', topic: 'Algorithms', category: 'technical', type: 'notes' },
      { title: 'Graph Theory Basics', content: 'Types: Directed, Undirected, Weighted, Unweighted\n\nRepresentations:\n- Adjacency Matrix: O(V²) space\n- Adjacency List: O(V+E) space\n\nTraversals:\n- BFS (Queue): Level-order, shortest path\n- DFS (Stack/Recursion): Topological sort, cycle detection\n\nAlgorithms: Dijkstra, Bellman-Ford, Kruskal, Prim.', topic: 'Graph', category: 'technical', type: 'notes' },
      { title: 'Common Idioms & Phrases', content: 'Important idioms for verbal ability:\n\n1. Break the ice - Start a conversation\n2. Hit the nail on the head - Be exactly right\n3. Burn the midnight oil - Study/work late\n4. Piece of cake - Very easy\n5. Bite the bullet - Face difficulties bravely\n6. Once in a blue moon - Very rarely\n7. The ball is in your court - Your decision\n8. Costs an arm and a leg - Very expensive', topic: 'Idioms', category: 'verbal', type: 'notes' },
      { title: 'OOP Concepts Summary', content: '4 Pillars of OOP:\n\n1. **Encapsulation**: Bundling data + methods, access modifiers\n2. **Abstraction**: Hiding complexity, showing essentials\n3. **Inheritance**: Child class inherits from parent\n4. **Polymorphism**: Same method, different behavior\n\nAdditional: Composition over inheritance, SOLID principles, Design patterns.', topic: 'OOP', category: 'technical', type: 'notes' },
      { title: 'Speed, Distance & Time Shortcuts', content: 'Formula: Speed = Distance / Time\n\nShortcuts:\n- Average speed (same distance) = 2ab/(a+b)\n- Relative speed (same direction) = |a-b|\n- Relative speed (opposite) = a+b\n- Train problems: Add train length to distance\n- Boats: Upstream speed = boat - stream, Downstream = boat + stream', topic: 'Speed & Distance', category: 'quantitative', type: 'notes' },
    ];

    for (const m of materials) {
      try {
        await pool.query(
          'INSERT INTO study_materials (title, content, topic, category, type) VALUES (?, ?, ?, ?, ?)',
          [m.title, m.content, m.topic, m.category, m.type]
        );
      } catch (e) { /* ignore duplicates */ }
    }
    console.log(`✅ Added ${materials.length} more study materials`);

    // ============ 7. ADD SUBSCRIPTIONS ============
    const premiumUserIds = userIds.filter((_, i) => users[i].role === 'PREMIUM');
    for (const uid of premiumUserIds) {
      const expiresAt = new Date(now.getTime() + 90 * 86400000); // 90 days from now
      try {
        await pool.query(
          'INSERT INTO subscriptions (user_id, plan, status, expires_at) VALUES (?, ?, ?, ?)',
          [uid, 'quarterly', 'active', expiresAt]
        );
      } catch (e) { /* ignore */ }
    }
    console.log(`✅ Added subscriptions for ${premiumUserIds.length} premium users`);

    // ============ SUMMARY ============
    const [userCount] = await pool.query('SELECT COUNT(*) as c FROM users');
    const [testCount] = await pool.query('SELECT COUNT(*) as c FROM tests');
    const [questionCount] = await pool.query('SELECT COUNT(*) as c FROM questions');
    const [attemptCountDb] = await pool.query('SELECT COUNT(*) as c FROM test_attempts WHERE status = "completed"');
    const [answerCount] = await pool.query('SELECT COUNT(*) as c FROM user_answers');
    const [progressDb] = await pool.query('SELECT COUNT(*) as c FROM progress');
    const [materialsDb] = await pool.query('SELECT COUNT(*) as c FROM study_materials');

    console.log('\n🎉 Dummy data complete! Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  👤 Users:           ${userCount[0].c}`);
    console.log(`  📝 Tests:           ${testCount[0].c}`);
    console.log(`  ❓ Questions:       ${questionCount[0].c}`);
    console.log(`  📊 Test Attempts:   ${attemptCountDb[0].c}`);
    console.log(`  ✏️  Answers:         ${answerCount[0].c}`);
    console.log(`  📈 Progress:        ${progressDb[0].c}`);
    console.log(`  📚 Study Materials: ${materialsDb[0].c}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 All dummy users password: password123');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addDummyData();
