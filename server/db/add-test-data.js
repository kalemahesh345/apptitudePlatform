require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

async function addTestData() {
  console.log('📊 Adding comprehensive test data...\n');

  const pool = require('../config/db');
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // ── 1. Add more users ──────────────────────────────────
    const pwd = await bcrypt.hash('user123', 12);
    const newUsers = [
      ['Amit Kumar', 'amit@test.com', pwd, 'USER'],
      ['Sneha Reddy', 'sneha@test.com', pwd, 'USER'],
      ['Vikram Singh', 'vikram@test.com', pwd, 'PREMIUM'],
      ['Neha Gupta', 'neha@test.com', pwd, 'USER'],
      ['Arjun Nair', 'arjun@test.com', pwd, 'USER'],
      ['Kavya Sharma', 'kavya@test.com', pwd, 'PREMIUM'],
      ['Rohan Desai', 'rohan@test.com', pwd, 'USER'],
      ['Ananya Iyer', 'ananya@test.com', pwd, 'USER'],
      ['Siddharth Joshi', 'sid@test.com', pwd, 'USER'],
      ['Meera Pillai', 'meera@test.com', pwd, 'USER'],
    ];

    const userIds = [];
    // Get existing user IDs
    const [existingUsers] = await pool.query('SELECT id FROM users ORDER BY id');
    existingUsers.forEach(u => userIds.push(u.id));

    for (const u of newUsers) {
      try {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', u
        );
        userIds.push(result.insertId);
      } catch (e) {
        // User already exists, get their ID
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u[1]]);
        if (existing.length) userIds.push(existing[0].id);
      }
    }
    console.log(`✅ ${newUsers.length} new users added (total: ${userIds.length})\n`);

    // ── 2. Add more questions to existing tests ────────────
    const [tests] = await pool.query('SELECT id, title, category FROM tests');
    const testMap = {};
    tests.forEach(t => { testMap[t.category] = testMap[t.category] || []; testMap[t.category].push(t); });

    const moreQuestions = [
      // ─── Quantitative Extra ───
      { category: 'quantitative', text: 'A shopkeeper marks up goods by 40% and gives 20% discount. Find profit%?', topic: 'Profit & Loss', explanation: 'MP=140. SP=140×0.8=112. Profit=12%', opts: ['10%','12%','15%','8%'], correct: 1 },
      { category: 'quantitative', text: 'If a pipe fills a tank in 6 hours and another empties it in 12 hours, time to fill if both open?', topic: 'Time & Work', explanation: '1/6 - 1/12 = 1/12. Time = 12 hours', opts: ['8 hours','10 hours','12 hours','15 hours'], correct: 2 },
      { category: 'quantitative', text: 'The compound interest on Rs.10000 for 2 years at 10% per annum is:', topic: 'Compound Interest', explanation: 'CI = 10000(1.1²-1) = 10000×0.21 = Rs.2100', opts: ['Rs.2000','Rs.2100','Rs.2200','Rs.1900'], correct: 1 },
      { category: 'quantitative', text: 'A boat goes 12 km upstream in 1.5 hours and downstream in 1 hour. Speed of stream?', topic: 'Speed, Time & Distance', explanation: 'Up=8, Down=12. Stream=(12-8)/2=2 km/h', opts: ['1 km/h','2 km/h','3 km/h','4 km/h'], correct: 1 },
      { category: 'quantitative', text: 'The probability of getting a sum of 7 when rolling two dice is:', topic: 'Probability', explanation: '6 outcomes: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1). P=6/36=1/6', opts: ['1/9','1/6','1/4','5/36'], correct: 1 },
      { category: 'quantitative', text: 'If 3x + 2y = 12 and x - y = 1, find x + y:', topic: 'Algebra', explanation: 'x=1+y → 3(1+y)+2y=12 → y=9/5. x=14/5. x+y=23/5=4.6', opts: ['4','4.6','5','3.8'], correct: 1 },
      { category: 'quantitative', text: 'A sum of money doubles in 8 years at simple interest. Rate per annum?', topic: 'Simple Interest', explanation: 'SI=P, so P=PTR/100 → R=100/8=12.5%', opts: ['10%','12.5%','15%','8%'], correct: 1 },
      { category: 'quantitative', text: 'In how many ways can 5 books be arranged on a shelf?', topic: 'Permutations', explanation: '5! = 120', opts: ['60','100','120','150'], correct: 2 },
      { category: 'quantitative', text: 'The area of a circle with radius 7 cm is:', topic: 'Geometry', explanation: 'A = πr² = 22/7 × 49 = 154 cm²', opts: ['144 cm²','154 cm²','164 cm²','174 cm²'], correct: 1 },
      { category: 'quantitative', text: 'A clock shows 3:15. What is the angle between hour and minute hands?', topic: 'Clocks', explanation: 'At 3:15, minute=90°, hour=97.5°. Angle=7.5°', opts: ['0°','7.5°','15°','22.5°'], correct: 1 },
      { category: 'quantitative', text: 'If the cost price of 12 oranges equals selling price of 10, what is profit%?', topic: 'Profit & Loss', explanation: 'CP of 12 = SP of 10. Let CP=1, SP=12/10=1.2. Profit=20%', opts: ['15%','20%','25%','10%'], correct: 1 },
      { category: 'quantitative', text: 'What is the HCF of 36, 48, and 60?', topic: 'Number System', explanation: 'Factors: 36=2²×3², 48=2⁴×3, 60=2²×3×5. HCF=2²×3=12', opts: ['6','8','12','24'], correct: 2 },

      // ─── Logical Reasoning Extra ───
      { category: 'logical', text: 'If Monday = 1, Tuesday = 2, ..., what day is 100th day starting from Monday?', topic: 'Calendar', explanation: '100/7 = 14 remainder 2. So 2nd day = Tuesday', opts: ['Monday','Tuesday','Wednesday','Sunday'], correct: 1 },
      { category: 'logical', text: 'A is the father of B, but B is not the son of A. How is B related to A?', topic: 'Blood Relations', explanation: 'B is the daughter of A', opts: ['Nephew','Daughter','Mother','Brother'], correct: 1 },
      { category: 'logical', text: 'Find the odd one out: 3, 5, 7, 12, 17, 19', topic: 'Odd One Out', explanation: '12 is the only non-prime number', opts: ['3','5','12','17'], correct: 2 },
      { category: 'logical', text: 'In a certain code, WATER is written as YCVGT. How is FIRE written?', topic: 'Coding-Decoding', explanation: 'Each letter +2: F→H, I→K, R→T, E→G = HKTG', opts: ['HKTG','GKSF','HLTG','GJTF'], correct: 0 },
      { category: 'logical', text: 'If A > B, B > C, and C > D, which is definitely true?', topic: 'Inequalities', explanation: 'A > D by transitivity', opts: ['A > D','D > A','A = D','Cannot determine'], correct: 0 },
      { category: 'logical', text: 'Complete: 1, 1, 2, 3, 5, 8, ?', topic: 'Number Series', explanation: 'Fibonacci: 5 + 8 = 13', opts: ['10','11','13','15'], correct: 2 },
      { category: 'logical', text: 'If you face North and turn 135° clockwise, which direction do you face?', topic: 'Direction Sense', explanation: '135° clockwise from North = South-East', opts: ['South','South-East','East','North-East'], correct: 1 },
      { category: 'logical', text: 'Five people sit in a row. A is to the left of B. C is to the right of D. E sits in the middle. Who sits at the leftmost?', topic: 'Seating Arrangement', explanation: 'With constraints: D must be leftmost since C is right of D and E is middle', opts: ['A','B','D','E'], correct: 2 },
      { category: 'logical', text: 'Mirror image of the word "AMBULANCE" when read in a mirror appears as:', topic: 'Mirror Image', explanation: 'AMBULANCE is written reversed on ambulances so it reads correctly in mirrors', opts: ['ECNALUBMA','AMBULANCE','ECNALUBMA reversed','Cannot determine'], correct: 1 },
      { category: 'logical', text: 'A cube is painted red on all faces, then cut into 27 equal cubes. How many have exactly 2 faces painted?', topic: 'Cubes & Dice', explanation: 'Edge cubes excluding corners: 12 edges × 1 = 12', opts: ['6','8','12','24'], correct: 2 },

      // ─── Verbal Extra ───
      { category: 'verbal', text: 'Choose the correct synonym of "EPHEMERAL":', topic: 'Vocabulary', explanation: 'Ephemeral means short-lived, temporary', opts: ['Eternal','Temporary','Strong','Beautiful'], correct: 1 },
      { category: 'verbal', text: 'Choose the antonym of "VERBOSE":', topic: 'Vocabulary', explanation: 'Verbose = wordy; opposite is Concise', opts: ['Lengthy','Concise','Loud','Boring'], correct: 1 },
      { category: 'verbal', text: '"The ball was _____ by the player." (Active to Passive)', topic: 'Grammar', explanation: 'Passive voice: was + past participle (caught)', opts: ['catch','caught','catching','catches'], correct: 1 },
      { category: 'verbal', text: '"A penny for your thoughts" means:', topic: 'Idioms', explanation: 'Asking someone to share what they are thinking about', opts: ['Money is valuable','Asking someone their opinion','Cheap thoughts','Wasting money'], correct: 1 },
      { category: 'verbal', text: 'The plural of "criterion" is:', topic: 'Grammar', explanation: 'Greek origin: criterion → criteria', opts: ['Criterions','Criterias','Criteria','Criterian'], correct: 2 },
      { category: 'verbal', text: 'Select the sentence with correct punctuation:', topic: 'Punctuation', explanation: 'Its is possessive; It\'s = It is', opts: ["Its a nice day","It's a nice day.","Its' a nice day","Its a nice day."], correct: 1 },
      { category: 'verbal', text: '"She has been working _____ morning." Fill in the correct preposition:', topic: 'Grammar', explanation: '"Since" is used for a specific point in time', opts: ['from','since','for','at'], correct: 1 },
      { category: 'verbal', text: 'Choose the word that is spelt correctly:', topic: 'Spelling', explanation: 'Occurrence is correct (double c, double r)', opts: ['Occurence','Occurrance','Occurrence','Occurance'], correct: 2 },

      // ─── Technical Extra ───
      { category: 'technical', text: 'Which data structure would be best for implementing browser history (back/forward)?', topic: 'Data Structures', explanation: 'Two stacks: one for back, one for forward history', opts: ['Queue','Stack','Array','Hash Map'], correct: 1 },
      { category: 'technical', text: 'What is the worst-case time complexity of Quick Sort?', topic: 'Algorithms', explanation: 'When pivot is always min/max: O(n²)', opts: ['O(n)','O(n log n)','O(n²)','O(log n)'], correct: 2 },
      { category: 'technical', text: 'In a relational database, what does ACID stand for?', topic: 'Databases', explanation: 'Atomicity, Consistency, Isolation, Durability', opts: ['Atomicity, Consistency, Isolation, Durability','Automatic, Consistent, Isolated, Durable','Atomic, Concurrent, Independent, Distributed','None of above'], correct: 0 },
      { category: 'technical', text: 'What is the output of: console.log(typeof null)?', topic: 'JavaScript', explanation: 'typeof null returns "object" - a known JS quirk', opts: ['"null"','"undefined"','"object"','"boolean"'], correct: 2 },
      { category: 'technical', text: 'Which HTTP method is idempotent?', topic: 'Web Technologies', explanation: 'GET, PUT, DELETE are idempotent. POST is not.', opts: ['POST','GET','PATCH','All of above'], correct: 1 },
      { category: 'technical', text: 'What is the space complexity of merge sort?', topic: 'Algorithms', explanation: 'Merge sort requires O(n) extra space for merging', opts: ['O(1)','O(log n)','O(n)','O(n²)'], correct: 2 },
      { category: 'technical', text: 'In OOP, what is polymorphism?', topic: 'OOP', explanation: 'Same method behaving differently based on the object', opts: ['Hiding data','Inheriting properties','Same interface different behavior','Creating classes'], correct: 2 },
      { category: 'technical', text: 'What is a closure in JavaScript?', topic: 'JavaScript', explanation: 'A function that remembers its outer scope even after the outer function returns', opts: ['A locked variable','Function with access to outer scope','A class method','Loop structure'], correct: 1 },
      { category: 'technical', text: 'Which protocol is used for secure web communication?', topic: 'Web Technologies', explanation: 'HTTPS = HTTP + TLS/SSL encryption', opts: ['HTTP','FTP','HTTPS','SMTP'], correct: 2 },
      { category: 'technical', text: 'What does DNS stand for?', topic: 'Networking', explanation: 'Domain Name System - translates domain names to IP addresses', opts: ['Data Network Service','Domain Name System','Digital Network Security','Dynamic Naming Service'], correct: 1 },
    ];

    let addedQ = 0;
    for (const q of moreQuestions) {
      const testList = testMap[q.category];
      if (!testList || testList.length === 0) continue;
      // Add to the first test of this category (easy/basic), or second if available
      const targetTest = testList.length > 1 ? testList[1] : testList[0];

      const [result] = await pool.query(
        'INSERT INTO questions (test_id, question_text, explanation, topic, difficulty, marks) VALUES (?, ?, ?, ?, ?, ?)',
        [targetTest.id, q.text, q.explanation, q.topic, 'medium', 1]
      );
      for (let i = 0; i < q.opts.length; i++) {
        await pool.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
          [result.insertId, q.opts[i], i === q.correct ? 1 : 0]
        );
      }
      addedQ++;
    }

    // Update total_marks per test
    for (const t of tests) {
      const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM questions WHERE test_id = ?', [t.id]);
      await pool.query('UPDATE tests SET total_marks = ? WHERE id = ?', [countRows[0].cnt, t.id]);
    }
    console.log(`✅ ${addedQ} additional questions added across all categories\n`);

    // ── 3. Simulate test attempts & results ────────────────
    const [allTests] = await pool.query('SELECT id, total_marks, duration_minutes FROM tests');
    const [allQuestions] = await pool.query('SELECT q.id as question_id, q.test_id, q.marks, o.id as correct_option_id FROM questions q JOIN options o ON o.question_id = q.id AND o.is_correct = 1');
    const questionsByTest = {};
    allQuestions.forEach(q => {
      if (!questionsByTest[q.test_id]) questionsByTest[q.test_id] = [];
      questionsByTest[q.test_id].push(q);
    });

    // Get ALL option IDs for each question (to pick wrong ones)
    const [allOptions] = await pool.query('SELECT id, question_id, is_correct FROM options');
    const optionsByQuestion = {};
    allOptions.forEach(o => {
      if (!optionsByQuestion[o.question_id]) optionsByQuestion[o.question_id] = [];
      optionsByQuestion[o.question_id].push(o);
    });

    let attemptCount = 0;
    // Each user takes 2-4 tests with varying performance
    for (const userId of userIds) {
      // Skip admin (id 1) from having too many test attempts
      const numAttempts = Math.floor(Math.random() * 3) + 2; // 2-4 attempts
      const shuffledTests = [...allTests].sort(() => Math.random() - 0.5);

      for (let a = 0; a < Math.min(numAttempts, shuffledTests.length); a++) {
        const test = shuffledTests[a];
        const questions = questionsByTest[test.id];
        if (!questions || questions.length === 0) continue;

        // Simulate varying skill levels
        const skillFactor = 0.3 + Math.random() * 0.6; // 30%-90% accuracy
        const timeTaken = Math.floor(test.duration_minutes * 60 * (0.4 + Math.random() * 0.5));

        // Create attempt
        const [attemptResult] = await pool.query(
          "INSERT INTO test_attempts (user_id, test_id, started_at, status) VALUES (?, ?, datetime('now', ?), 'in_progress')",
          [userId, test.id, `-${Math.floor(Math.random() * 30)} days`]
        );
        const attemptId = attemptResult.insertId;

        let correct = 0, incorrect = 0, score = 0;

        for (const q of questions) {
          const isCorrect = Math.random() < skillFactor;
          const options = optionsByQuestion[q.question_id] || [];
          let selectedOptionId;

          if (isCorrect) {
            selectedOptionId = q.correct_option_id;
            correct++;
            score += q.marks;
          } else {
            const wrongOptions = options.filter(o => !o.is_correct);
            selectedOptionId = wrongOptions.length > 0 ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)].id : options[0]?.id;
            incorrect++;
          }

          const timeSpent = Math.floor(Math.random() * 60) + 10;

          await pool.query(
            'INSERT INTO user_answers (attempt_id, question_id, selected_option_id, is_correct, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
            [attemptId, q.question_id, selectedOptionId, isCorrect ? 1 : 0, timeSpent]
          );
        }

        const unanswered = questions.length - correct - incorrect;
        const accuracy = questions.length > 0 ? ((correct / questions.length) * 100) : 0;

        await pool.query(
          "UPDATE test_attempts SET status = 'completed', completed_at = datetime('now', ?), time_taken_seconds = ?, score = ?, total_marks = ?, correct_count = ?, incorrect_count = ?, unanswered_count = ?, accuracy = ? WHERE id = ?",
          [`-${Math.floor(Math.random() * 30)} days`, timeTaken, score, test.total_marks, correct, incorrect, unanswered, accuracy.toFixed(2), attemptId]
        );

        attemptCount++;
      }
    }
    console.log(`✅ ${attemptCount} test attempts simulated\n`);

    // ── 4. Generate progress data ──────────────────────────
    const [allAttempts] = await pool.query(`
      SELECT ua.is_correct, ua.time_spent_seconds, q.topic, q.marks, ta.user_id, t.category
      FROM user_answers ua
      JOIN test_attempts ta ON ua.attempt_id = ta.id
      JOIN questions q ON ua.question_id = q.id
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.status = 'completed'
    `);

    const progressMap = {};
    allAttempts.forEach(a => {
      const key = `${a.user_id}_${a.topic}`;
      if (!progressMap[key]) progressMap[key] = {
        user_id: a.user_id, topic: a.topic, category: a.category,
        tests: new Set(), total: 0, correct: 0, totalTime: 0
      };
      progressMap[key].total++;
      if (a.is_correct) progressMap[key].correct++;
      progressMap[key].totalTime += a.time_spent_seconds || 0;
    });

    let progressCount = 0;
    for (const p of Object.values(progressMap)) {
      const accuracy = p.total > 0 ? (p.correct / p.total * 100) : 0;
      const avgTime = p.total > 0 ? (p.totalTime / p.total) : 0;
      let skill = 'beginner';
      if (accuracy >= 90) skill = 'expert';
      else if (accuracy >= 70) skill = 'advanced';
      else if (accuracy >= 50) skill = 'intermediate';

      // Upsert
      const [existing] = await pool.query(
        'SELECT id FROM progress WHERE user_id = ? AND topic = ?', [p.user_id, p.topic]
      );
      if (existing.length) {
        await pool.query(
          'UPDATE progress SET tests_taken = ?, total_questions = ?, correct_answers = ?, accuracy = ?, avg_time_per_question = ?, skill_level = ? WHERE id = ?',
          [1, p.total, p.correct, accuracy, avgTime, skill, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO progress (user_id, topic, category, tests_taken, total_questions, correct_answers, accuracy, avg_time_per_question, skill_level) VALUES (?,?,?,1,?,?,?,?,?)',
          [p.user_id, p.topic, p.category, p.total, p.correct, accuracy, avgTime, skill]
        );
      }
      progressCount++;
    }
    console.log(`✅ ${progressCount} progress records created\n`);

    // ── 5. Generate leaderboard ────────────────────────────
    const [leaderData] = await pool.query(`
      SELECT ta.user_id, u.name,
        SUM(ta.score) as total_score,
        COUNT(*) as tests_completed,
        AVG(ta.accuracy) as avg_accuracy
      FROM test_attempts ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.status = 'completed'
      GROUP BY ta.user_id
      ORDER BY total_score DESC
    `);

    for (const period of ['alltime', 'monthly', 'weekly']) {
      let rank = 0;
      for (const entry of leaderData) {
        rank++;
        const score = period === 'weekly' ? entry.total_score * 0.3 : period === 'monthly' ? entry.total_score * 0.6 : entry.total_score;
        const [existing] = await pool.query(
          'SELECT id FROM leaderboard WHERE user_id = ? AND period = ?', [entry.user_id, period]
        );
        if (existing.length) {
          await pool.query(
            'UPDATE leaderboard SET user_name=?, total_score=?, tests_completed=?, avg_accuracy=?, rank_position=? WHERE id=?',
            [entry.name, score, entry.tests_completed, entry.avg_accuracy, rank, existing[0].id]
          );
        } else {
          await pool.query(
            'INSERT INTO leaderboard (user_id, user_name, total_score, tests_completed, avg_accuracy, rank_position, period) VALUES (?,?,?,?,?,?,?)',
            [entry.user_id, entry.name, score, entry.tests_completed, parseFloat(entry.avg_accuracy).toFixed(2), rank, period]
          );
        }
      }
    }
    console.log(`✅ Leaderboard populated for all periods\n`);

    // ── 6. Add more study materials ────────────────────────
    const extraMaterials = [
      { title: 'Profit & Loss Shortcuts', content: 'Key Formulas:\n- Profit = SP - CP\n- Loss = CP - SP\n- Profit% = (Profit/CP) × 100\n- Loss% = (Loss/CP) × 100\n- SP = CP × (100 + P%)/100\n- If marked price and discount: SP = MP × (100 - D%)/100\n\nShortcuts:\n- If CP of x items = SP of y items, then P% = (x-y)/y × 100\n- Two successive discounts of a% and b% = (a + b - ab/100)%', topic: 'Profit & Loss', category: 'quantitative' },
      { title: 'Compound Interest Made Easy', content: 'Formula: A = P(1 + R/100)^T\n\nCI = A - P\n\nShortcuts:\n- For 2 years: CI - SI = P(R/100)²\n- Effective rate for 2 years at R%: 2R + R²/100\n- Half-yearly compounding: Use R/2 and 2T\n- Quarterly: Use R/4 and 4T\n\nRule of 72: Money doubles in ≈ 72/R years', topic: 'Compound Interest', category: 'quantitative' },
      { title: 'Blood Relations Tricks', content: 'Key Terms:\n- Father\'s/Mother\'s son = Brother\n- Father\'s/Mother\'s daughter = Sister\n- Father\'s father = Grandfather\n- Mother\'s brother = Maternal Uncle\n\nTips:\n1. Draw a family tree\n2. Use + for male, - for female\n3. Track generations: Same level = siblings/cousins\n4. One level up = parent/uncle/aunt\n5. One level down = children/nephew/niece', topic: 'Blood Relations', category: 'logical' },
      { title: 'Syllogism Rules', content: 'Key Rules:\n1. All + All = All\n2. All + Some = No Conclusion\n3. Some + All = Some\n4. Some + Some = No Conclusion\n5. No + All = Some Not (reversed)\n6. All + No = No\n\nAlways draw Venn diagrams for complex problems.\n\nTip: Look for the middle term that connects the premises.', topic: 'Syllogisms', category: 'logical' },
      { title: 'Common Idioms & Phrases', content: '1. A hot potato - A controversial issue\n2. Beat around the bush - Avoid the main topic\n3. Bite the bullet - Accept something difficult\n4. Break the ice - Initiate conversation\n5. Hit the nail on the head - Be exactly right\n6. Kill two birds with one stone - Solve two problems at once\n7. Piece of cake - Very easy\n8. Spill the beans - Reveal a secret\n9. Under the weather - Feeling ill\n10. When pigs fly - Something that will never happen', topic: 'Idioms', category: 'verbal' },
      { title: 'Data Structures Comparison', content: 'Array: O(1) access, O(n) insert/delete\nLinked List: O(n) access, O(1) insert/delete\nStack: LIFO - push/pop O(1)\nQueue: FIFO - enqueue/dequeue O(1)\nHash Table: O(1) avg access, O(n) worst\nBST: O(log n) avg for all operations\nHeap: O(1) findMin/Max, O(log n) insert/delete\n\nWhen to use what:\n- Random access → Array\n- Frequent insertions → Linked List\n- Undo operations → Stack\n- BFS/scheduling → Queue\n- Key-value lookup → Hash Map\n- Sorted data → BST', topic: 'Data Structures', category: 'technical' },
      { title: 'JavaScript ES6+ Cheatsheet', content: 'Arrow Functions: const fn = (x) => x * 2\nTemplate Literals: `Hello ${name}`\nDestructuring: const {a, b} = obj\nSpread: [...arr1, ...arr2]\nPromises: fetch().then().catch()\nAsync/Await: const data = await fetch()\n\nArray Methods:\n.map() - transform\n.filter() - select\n.reduce() - aggregate\n.find() - first match\n.some()/.every() - boolean checks', topic: 'JavaScript', category: 'technical' },
      { title: 'Probability Fundamentals', content: 'Basic Formula: P(E) = Favorable / Total\n\nRules:\n1. P(A or B) = P(A) + P(B) - P(A and B)\n2. P(A and B) = P(A) × P(B) [if independent]\n3. P(not A) = 1 - P(A)\n\nDice: Total = 6 (1 die), 36 (2 dice)\nCards: 52 total, 4 suits, 13 each\nCoins: 2 outcomes per toss\n\nConditional: P(A|B) = P(A∩B) / P(B)', topic: 'Probability', category: 'quantitative' },
    ];

    for (const m of extraMaterials) {
      await pool.query(
        'INSERT INTO study_materials (title, content, topic, category, type) VALUES (?, ?, ?, ?, ?)',
        [m.title, m.content, m.topic, m.category, 'notes']
      );
    }
    console.log(`✅ ${extraMaterials.length} additional study materials added\n`);

    // ── 7. Add AI recommendation samples ───────────────────
    for (const userId of userIds.slice(0, 5)) {
      await pool.query(
        'INSERT INTO ai_recommendations (user_id, type, recommendation) VALUES (?, ?, ?)',
        [userId, 'study_plan', JSON.stringify({
          plan: { title: 'Personalized 14-Day Study Plan', days: [
            { day: 1, topic: 'Percentages', duration: '2 hours' },
            { day: 2, topic: 'Profit & Loss', duration: '2 hours' },
            { day: 3, topic: 'Time & Work', duration: '1.5 hours' },
            { day: 4, topic: 'Number Series', duration: '1.5 hours' },
            { day: 5, topic: 'Coding-Decoding', duration: '2 hours' },
            { day: 6, topic: 'Syllogisms', duration: '2 hours' },
            { day: 7, topic: 'Review & Practice Test', duration: '3 hours' },
          ]},
          priorityTopics: ['Percentages', 'Profit & Loss', 'Number Series'],
          estimatedImprovement: '15-20% improvement expected in 2 weeks'
        })]
      );
    }
    console.log('✅ Sample AI recommendations added\n');

    // ── 8. Add premium subscriptions ───────────────────────
    const [premiumUsers] = await pool.query("SELECT id FROM users WHERE role = 'PREMIUM'");
    for (const pu of premiumUsers) {
      const [existing] = await pool.query('SELECT id FROM subscriptions WHERE user_id = ?', [pu.id]);
      if (!existing.length) {
        await pool.query(
          "INSERT INTO subscriptions (user_id, plan, status, expires_at) VALUES (?, 'quarterly', 'active', datetime('now', '+90 days'))",
          [pu.id]
        );
      }
    }
    console.log('✅ Premium subscriptions activated\n');

    // Print summary
    const [userCount] = await pool.query('SELECT COUNT(*) as c FROM users');
    const [testCount] = await pool.query('SELECT COUNT(*) as c FROM tests');
    const [qCount] = await pool.query('SELECT COUNT(*) as c FROM questions');
    const [aCount] = await pool.query('SELECT COUNT(*) as c FROM test_attempts WHERE status = "completed"');
    const [mCount] = await pool.query('SELECT COUNT(*) as c FROM study_materials');
    const [pCount] = await pool.query('SELECT COUNT(*) as c FROM progress');
    const [lCount] = await pool.query('SELECT COUNT(*) as c FROM leaderboard');

    console.log('═══════════════════════════════════════');
    console.log('🎉 TEST DATA SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`   👤 Users:          ${userCount[0].c}`);
    console.log(`   📝 Tests:          ${testCount[0].c}`);
    console.log(`   ❓ Questions:      ${qCount[0].c}`);
    console.log(`   📊 Attempts:       ${aCount[0].c}`);
    console.log(`   📚 Study Materials: ${mCount[0].c}`);
    console.log(`   📈 Progress Items: ${pCount[0].c}`);
    console.log(`   🏆 Leaderboard:    ${lCount[0].c}`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestData();
