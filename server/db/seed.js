require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'system',
    database: process.env.DB_NAME || 'apptitude_db',
    multipleStatements: true
  });

  console.log('🌱 Starting database seed...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    await pool.query(`INSERT IGNORE INTO users (name, email, password, role) VALUES 
      ('Admin User', 'admin@aptitude.com', ?, 'ADMIN'),
      ('Test Student', 'student@test.com', ?, 'USER'),
      ('Premium User', 'premium@test.com', ?, 'PREMIUM')
    `, [adminPassword, userPassword, userPassword]);

    console.log('✅ Users created (admin@aptitude.com / admin123)');

    // Create Tests
    const tests = [
      { title: 'Quantitative Aptitude - Basic', desc: 'Fundamental arithmetic, algebra, and number problems', category: 'quantitative', difficulty: 'easy', duration: 30 },
      { title: 'Quantitative Aptitude - Advanced', desc: 'Advanced math concepts including permutations, probability and series', category: 'quantitative', difficulty: 'hard', duration: 45 },
      { title: 'Logical Reasoning - Patterns', desc: 'Pattern recognition, sequences, and logical puzzles', category: 'logical', difficulty: 'medium', duration: 30 },
      { title: 'Logical Reasoning - Analytical', desc: 'Analytical reasoning, deductions, and arrangements', category: 'logical', difficulty: 'hard', duration: 40 },
      { title: 'Verbal Ability - Grammar', desc: 'Grammar, vocabulary, and sentence correction', category: 'verbal', difficulty: 'easy', duration: 25 },
      { title: 'Verbal Ability - Comprehension', desc: 'Reading comprehension and critical reasoning', category: 'verbal', difficulty: 'medium', duration: 35 },
      { title: 'Technical - Programming Basics', desc: 'Basic programming concepts, data types, and logic', category: 'technical', difficulty: 'easy', duration: 30 },
      { title: 'Technical - DSA Fundamentals', desc: 'Data structures, algorithms, and complexity analysis', category: 'technical', difficulty: 'hard', duration: 45 }
    ];

    const testIds = [];
    for (const t of tests) {
      const [result] = await pool.query(
        'INSERT INTO tests (title, description, category, difficulty, duration_minutes, total_marks, created_by) VALUES (?, ?, ?, ?, ?, 0, 1)',
        [t.title, t.desc, t.category, t.difficulty, t.duration]
      );
      testIds.push(result.insertId);
    }
    console.log(`✅ Created ${tests.length} tests`);

    // Questions with options
    const allQuestions = [
      // ---- TEST 1: Quantitative Basic (testIds[0]) ----
      { tid: 0, q: 'What is 15% of 200?', opts: ['25', '30', '35', '40'], correct: 1, topic: 'Percentage', diff: 'easy', exp: '15% of 200 = (15/100) × 200 = 30' },
      { tid: 0, q: 'If a shirt costs ₹800 after a 20% discount, what was the original price?', opts: ['₹960', '₹1000', '₹1100', '₹950'], correct: 1, topic: 'Percentage', diff: 'easy', exp: 'Let original = x. x - 0.2x = 800, 0.8x = 800, x = 1000' },
      { tid: 0, q: 'A train travels 240 km in 4 hours. What is its speed?', opts: ['50 km/h', '55 km/h', '60 km/h', '65 km/h'], correct: 2, topic: 'Speed & Distance', diff: 'easy', exp: 'Speed = Distance/Time = 240/4 = 60 km/h' },
      { tid: 0, q: 'The average of 5 consecutive numbers is 12. What is the largest number?', opts: ['13', '14', '15', '16'], correct: 1, topic: 'Averages', diff: 'easy', exp: 'Consecutive numbers: 10,11,12,13,14. Largest = 14' },
      { tid: 0, q: 'If x + y = 10 and x - y = 4, find x.', opts: ['5', '6', '7', '8'], correct: 2, topic: 'Algebra', diff: 'easy', exp: 'Adding equations: 2x = 14, x = 7' },
      { tid: 0, q: 'What is the simple interest on ₹5000 at 8% per annum for 3 years?', opts: ['₹1000', '₹1100', '₹1200', '₹1300'], correct: 2, topic: 'Simple Interest', diff: 'easy', exp: 'SI = P×R×T/100 = 5000×8×3/100 = 1200' },
      { tid: 0, q: 'A man buys an article for ₹500 and sells it for ₹600. What is the profit %?', opts: ['10%', '15%', '20%', '25%'], correct: 2, topic: 'Profit & Loss', diff: 'easy', exp: 'Profit = 100, Profit% = (100/500)×100 = 20%' },
      { tid: 0, q: 'What is the LCM of 12 and 18?', opts: ['24', '30', '36', '48'], correct: 2, topic: 'LCM & HCF', diff: 'easy', exp: '12 = 2²×3, 18 = 2×3². LCM = 2²×3² = 36' },
      { tid: 0, q: 'If the ratio of boys to girls is 3:5 and there are 24 boys, how many girls?', opts: ['30', '35', '40', '45'], correct: 2, topic: 'Ratio', diff: 'easy', exp: '3/5 = 24/x, x = 24×5/3 = 40' },
      { tid: 0, q: 'A pipe can fill a tank in 6 hours. How much of the tank is filled in 2 hours?', opts: ['1/4', '1/3', '1/2', '2/3'], correct: 1, topic: 'Pipes & Cisterns', diff: 'easy', exp: 'In 1 hour = 1/6. In 2 hours = 2/6 = 1/3' },

      // ---- TEST 2: Quantitative Advanced (testIds[1]) ----
      { tid: 1, q: 'In how many ways can 5 people be seated in a row?', opts: ['60', '100', '120', '150'], correct: 2, topic: 'Permutations', diff: 'hard', exp: '5! = 5×4×3×2×1 = 120' },
      { tid: 1, q: 'If a die is thrown twice, what is the probability of getting a sum of 7?', opts: ['1/6', '5/36', '1/4', '7/36'], correct: 0, topic: 'Probability', diff: 'hard', exp: 'Favorable outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. Total = 36. P = 6/36 = 1/6' },
      { tid: 1, q: 'Find the sum of the first 20 terms of AP: 3, 7, 11, 15...', opts: ['800', '820', '840', '860'], correct: 2, topic: 'Sequences', diff: 'hard', exp: 'a=3, d=4, n=20. S = n/2[2a + (n-1)d] = 10[6 + 76] = 10×82 = 820. Wait: let me recalculate: S=20/2[2(3)+(19)(4)]=10[6+76]=10×82=820' },
      { tid: 1, q: 'A boat goes 24 km upstream in 6 hours and 24 km downstream in 4 hours. Speed of stream?', opts: ['0.5 km/h', '1 km/h', '1.5 km/h', '2 km/h'], correct: 1, topic: 'Boats & Streams', diff: 'hard', exp: 'Upstream speed=4, Downstream=6. Stream=(6-4)/2=1 km/h' },
      { tid: 1, q: 'The compound interest on ₹10000 at 10% per annum for 2 years is?', opts: ['₹2000', '₹2050', '₹2100', '₹2200'], correct: 2, topic: 'Compound Interest', diff: 'hard', exp: 'CI = P(1+R/100)^T - P = 10000(1.1)² - 10000 = 12100 - 10000 = 2100' },
      { tid: 1, q: 'How many 3-digit numbers are divisible by 7?', opts: ['127', '128', '129', '130'], correct: 2, topic: 'Number Theory', diff: 'hard', exp: 'First: 105, Last: 994. Count = (994-105)/7 + 1 = 889/7 + 1 = 127 + 1 = 128. Hmm, actually: (994-105)/7=127, 127+1=128' },

      // ---- TEST 3: Logical Reasoning Patterns (testIds[2]) ----
      { tid: 2, q: 'What comes next: 2, 6, 12, 20, 30, ?', opts: ['40', '42', '44', '46'], correct: 1, topic: 'Number Series', diff: 'medium', exp: 'Differences: 4,6,8,10,12. Next = 30+12 = 42' },
      { tid: 2, q: 'Find the odd one out: 3, 5, 11, 14, 17, 21', opts: ['14', '__(already given as 14 which is even sum gap)', '21', '3'], correct: 0, topic: 'Odd One Out', diff: 'medium', exp: '3,5,11,17 are prime numbers. 14 and 21 are not. 14 breaks the prime pattern most clearly.' },
      { tid: 2, q: 'If FRIEND is coded as HUMGPF, how is CANDLE coded?', opts: ['ECPFNG', 'EDRIJA', 'DCPEMF', 'ECPFNI'], correct: 0, topic: 'Coding-Decoding', diff: 'medium', exp: 'Each letter +2: C→E, A→C, N→P, D→F, L→N, E→G = ECPFNG' },
      { tid: 2, q: 'A is the father of B. B is the sister of C. D is the mother of C. How is A related to D?', opts: ['Husband', 'Brother', 'Father', 'Son'], correct: 0, topic: 'Blood Relations', diff: 'medium', exp: 'B is sister of C, D is mother of C, so D is mother of B too. A is father of B. So A is husband of D.' },
      { tid: 2, q: 'If in a certain code, MANGO is written as OCPIQ, then APPLE is written as?', opts: ['CRRNG', 'CRRNI', 'DSSOJ', 'BQQLE'], correct: 0, topic: 'Coding-Decoding', diff: 'medium', exp: 'Each letter +2: A→C, P→R, P→R, L→N, E→G = CRRNG' },
      { tid: 2, q: 'Complete the pattern: 1, 1, 2, 3, 5, 8, ?', opts: ['11', '12', '13', '14'], correct: 2, topic: 'Number Series', diff: 'easy', exp: 'Fibonacci series: each number is sum of previous two. 5+8 = 13' },
      { tid: 2, q: 'Pointing to a girl, Ram said "She is the daughter of my grandmother\'s only son." How is the girl related to Ram?', opts: ['Cousin', 'Sister', 'Daughter', 'Niece'], correct: 1, topic: 'Blood Relations', diff: 'medium', exp: 'Grandmother\'s only son = Ram\'s father. Daughter of Ram\'s father = Ram\'s sister' },

      // ---- TEST 4: Logical Reasoning Analytical (testIds[3]) ----
      { tid: 3, q: 'All roses are flowers. Some flowers are red. Which conclusion is valid?', opts: ['All roses are red', 'Some roses are red', 'Some red things are flowers', 'No valid conclusion about roses'], correct: 2, topic: 'Syllogisms', diff: 'hard', exp: '"Some flowers are red" means some red things are flowers. We cannot conclude anything specific about roses being red.' },
      { tid: 3, q: 'Statement: "No teacher is a student." "All students are hardworking." Conclusion?', opts: ['Some hardworking people are not teachers', 'All teachers are hardworking', 'No student is hardworking', 'All hardworking people are students'], correct: 0, topic: 'Syllogisms', diff: 'hard', exp: 'Since all students are hardworking and no teacher is a student, some hardworking people (students) are not teachers.' },
      { tid: 3, q: 'If A > B, B > C, C > D, and D > E, then which is definitely true?', opts: ['A > E', 'A > C only', 'B > D only', 'C > E only'], correct: 0, topic: 'Inequalities', diff: 'medium', exp: 'By transitivity: A > B > C > D > E, so A > E is definitely true.' },
      { tid: 3, q: 'In a row of 40 students, R is 11th from the left and S is 16th from right. How many students between them?', opts: ['12', '13', '14', '15'], correct: 1, topic: 'Linear Arrangement', diff: 'hard', exp: 'S from left = 40 - 16 + 1 = 25. Between R(11) and S(25) = 25-11-1 = 13' },
      { tid: 3, q: 'Five friends A, B, C, D, E are sitting in a circle. A is between D and B. C is to the right of B. Who is to the left of E?', opts: ['A', 'B', 'C', 'D'], correct: 3, topic: 'Circular Arrangement', diff: 'hard', exp: 'Clockwise: D-A-B-C-E. Left of E (anticlockwise) = D' },

      // ---- TEST 5: Verbal Ability Grammar (testIds[4]) ----
      { tid: 4, q: 'Choose the correct sentence:', opts: ['He don\'t know anything', 'He doesn\'t knows anything', 'He doesn\'t know anything', 'He don\'t knows anything'], correct: 2, topic: 'Grammar', diff: 'easy', exp: 'With third person singular (he/she/it), use "doesn\'t" + base verb' },
      { tid: 4, q: 'What is the synonym of "Eloquent"?', opts: ['Silent', 'Articulate', 'Clumsy', 'Rude'], correct: 1, topic: 'Vocabulary', diff: 'easy', exp: 'Eloquent means fluent, persuasive, articulate in speech' },
      { tid: 4, q: 'Find the antonym of "Benevolent":', opts: ['Kind', 'Malevolent', 'Generous', 'Caring'], correct: 1, topic: 'Vocabulary', diff: 'easy', exp: 'Benevolent = kind, generous. Antonym = Malevolent = wishing harm' },
      { tid: 4, q: 'Identify the error: "Each of the boys have completed their homework."', opts: ['Each of', 'the boys', 'have completed', 'their homework'], correct: 2, topic: 'Grammar', diff: 'medium', exp: '"Each" is singular, so it should be "has completed" not "have completed"' },
      { tid: 4, q: 'Choose the correctly spelled word:', opts: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], correct: 1, topic: 'Spelling', diff: 'easy', exp: 'Accommodate has double c and double m' },
      { tid: 4, q: 'What is the meaning of the idiom "Break the ice"?', opts: ['Freeze something', 'End a relationship', 'Start a conversation', 'Cause damage'], correct: 2, topic: 'Idioms', diff: 'easy', exp: '"Break the ice" means to initiate social interaction or conversation' },

      // ---- TEST 6: Verbal Comprehension (testIds[5]) ----
      { tid: 5, q: '"The committee has decided to postpone the meeting." What is the voice?', opts: ['Active Voice', 'Passive Voice', 'Imperative', 'None'], correct: 0, topic: 'Voice', diff: 'medium', exp: 'Subject (committee) performs the action (decided). This is Active Voice.' },
      { tid: 5, q: 'Choose the correct passive form: "She writes a letter."', opts: ['A letter is written by her', 'A letter was written by her', 'A letter written by her', 'A letter is being written by her'], correct: 0, topic: 'Voice', diff: 'medium', exp: 'Simple present active → simple present passive: is + past participle' },
      { tid: 5, q: 'Which figure of speech is used: "The wind howled in the night"?', opts: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correct: 2, topic: 'Figures of Speech', diff: 'medium', exp: 'Personification: giving human quality (howling) to non-human (wind)' },
      { tid: 5, q: '"Despite the rain, ______ went to school." Choose the correct pronoun:', opts: ['they', 'their', 'them', 'theirs'], correct: 0, topic: 'Grammar', diff: 'easy', exp: '"They" is the subject pronoun needed here as the subject of "went"' },
      { tid: 5, q: 'What does the prefix "anti-" mean?', opts: ['Before', 'After', 'Against', 'With'], correct: 2, topic: 'Vocabulary', diff: 'easy', exp: 'Anti- means against or opposite, as in antisocial, antibiotic' },

      // ---- TEST 7: Technical Programming Basics (testIds[6]) ----
      { tid: 6, q: 'What is the output of: console.log(typeof null) in JavaScript?', opts: ['"null"', '"undefined"', '"object"', '"boolean"'], correct: 2, topic: 'JavaScript', diff: 'easy', exp: 'typeof null returns "object" — this is a well-known JavaScript quirk' },
      { tid: 6, q: 'Which data structure uses FIFO (First In First Out)?', opts: ['Stack', 'Queue', 'Tree', 'Graph'], correct: 1, topic: 'Data Structures', diff: 'easy', exp: 'Queue follows FIFO - first element added is the first to be removed' },
      { tid: 6, q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correct: 2, topic: 'Algorithms', diff: 'easy', exp: 'Binary search halves the search space each step, giving O(log n)' },
      { tid: 6, q: 'Which keyword is used to define a constant in JavaScript?', opts: ['var', 'let', 'const', 'define'], correct: 2, topic: 'JavaScript', diff: 'easy', exp: 'const declares a constant that cannot be reassigned' },
      { tid: 6, q: 'What does SQL stand for?', opts: ['Structured Query Language', 'Simple Question Language', 'Standard Query Logic', 'System Query Language'], correct: 0, topic: 'Databases', diff: 'easy', exp: 'SQL = Structured Query Language, used for managing relational databases' },
      { tid: 6, q: 'In Python, which of the following is a mutable data type?', opts: ['String', 'Tuple', 'List', 'Integer'], correct: 2, topic: 'Python', diff: 'easy', exp: 'Lists are mutable (can be changed). Strings, tuples, and integers are immutable.' },
      { tid: 6, q: 'What is the purpose of a constructor in OOP?', opts: ['Destroy an object', 'Initialize an object', 'Copy an object', 'Compare objects'], correct: 1, topic: 'OOP', diff: 'easy', exp: 'A constructor is called when an object is created to initialize its properties' },

      // ---- TEST 8: Technical DSA (testIds[7]) ----
      { tid: 7, q: 'What is the worst-case time complexity of quicksort?', opts: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correct: 1, topic: 'Sorting', diff: 'hard', exp: 'Worst case occurs when pivot is always the smallest/largest element: O(n²)' },
      { tid: 7, q: 'Which data structure is used for BFS traversal of a graph?', opts: ['Stack', 'Queue', 'Heap', 'Array'], correct: 1, topic: 'Graph', diff: 'medium', exp: 'BFS uses a Queue to explore nodes level by level' },
      { tid: 7, q: 'What is the space complexity of merge sort?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 2, topic: 'Sorting', diff: 'hard', exp: 'Merge sort needs O(n) additional space for the temporary arrays during merging' },
      { tid: 7, q: 'In a max-heap, the root element is always:', opts: ['The smallest', 'The median', 'The largest', 'Random'], correct: 2, topic: 'Heap', diff: 'medium', exp: 'In a max-heap, parent >= children, so root is the maximum element' },
      { tid: 7, q: 'Which traversal of a BST gives sorted output?', opts: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correct: 1, topic: 'Trees', diff: 'medium', exp: 'In-order traversal (left-root-right) of BST visits nodes in ascending order' },
      { tid: 7, q: 'What is the time complexity of inserting at the beginning of a linked list?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 0, topic: 'Linked List', diff: 'easy', exp: 'Inserting at head requires only updating the head pointer: O(1)' },
      { tid: 7, q: 'Which algorithm is used to find the shortest path in a weighted graph?', opts: ['DFS', 'BFS', 'Dijkstra', 'Kruskal'], correct: 2, topic: 'Graph', diff: 'hard', exp: 'Dijkstra\'s algorithm finds shortest path from source to all vertices in weighted graph' },
    ];

    let totalCreated = 0;
    for (const q of allQuestions) {
      const [qResult] = await pool.query(
        'INSERT INTO questions (test_id, question_text, explanation, topic, difficulty, marks, negative_marks) VALUES (?, ?, ?, ?, ?, 1, 0.25)',
        [testIds[q.tid], q.q, q.exp, q.topic, q.diff]
      );
      const qId = qResult.insertId;

      for (let i = 0; i < q.opts.length; i++) {
        await pool.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
          [qId, q.opts[i], i === q.correct]
        );
      }

      // Update total marks
      await pool.query('UPDATE tests SET total_marks = total_marks + 1 WHERE id = ?', [testIds[q.tid]]);
      totalCreated++;
    }

    console.log(`✅ Created ${totalCreated} questions across ${tests.length} tests`);

    // Create study materials
    await pool.query(`INSERT INTO study_materials (title, content, topic, category, type) VALUES 
      ('Percentage Basics', 'Learn how to calculate percentages, percentage change, and solve word problems involving percentages.', 'Percentage', 'quantitative', 'notes'),
      ('Speed, Distance & Time', 'Master the relationship between speed, distance, and time with practical problems.', 'Speed & Distance', 'quantitative', 'notes'),
      ('Number Series Patterns', 'Identify patterns in number series: arithmetic, geometric, Fibonacci, and mixed series.', 'Number Series', 'logical', 'notes'),
      ('Coding-Decoding', 'Learn different coding patterns: letter shift, reverse, mirror, and substitution codes.', 'Coding-Decoding', 'logical', 'notes'),
      ('English Grammar Rules', 'Comprehensive guide to grammar rules: tenses, subject-verb agreement, articles, and prepositions.', 'Grammar', 'verbal', 'notes'),
      ('Data Structures Overview', 'Introduction to arrays, linked lists, stacks, queues, trees, and graphs with complexity analysis.', 'Data Structures', 'technical', 'notes'),
      ('Sorting Algorithms', 'Comparison of sorting algorithms: bubble, selection, insertion, merge, quick, and heap sort.', 'Sorting', 'technical', 'notes'),
      ('Profit and Loss', 'Learn to solve profit, loss, discount, and markup problems efficiently.', 'Profit & Loss', 'quantitative', 'notes')
    `);

    console.log('✅ Study materials created');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@aptitude.com / admin123');
    console.log('   User:  student@test.com / user123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
