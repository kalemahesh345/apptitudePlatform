const pool = require('../config/db');
const User = require('../models/user.model');
const Test = require('../models/test.model');
const Question = require('../models/question.model');
const Attempt = require('../models/attempt.model');
const csv = require('csv-parser');
const { Readable } = require('stream');
const PDFDocument = require('pdfkit');

// Admin Dashboard Stats
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.getCount();
    const totalTests = await Test.getCount();
    
    const [activeUsers] = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM test_attempts 
      WHERE started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    const [testStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN accuracy >= 50 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN accuracy < 50 THEN 1 ELSE 0 END) as failed,
        AVG(accuracy) as avg_accuracy
      FROM test_attempts WHERE status = 'completed'
    `);

    const [popularTopics] = await pool.query(`
      SELECT q.topic, COUNT(ua.id) as attempt_count
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      GROUP BY q.topic
      ORDER BY attempt_count DESC
      LIMIT 10
    `);

    const [recentAttempts] = await pool.query(`
      SELECT ta.*, u.name as user_name, t.title as test_title
      FROM test_attempts ta
      JOIN users u ON ta.user_id = u.id
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.status = 'completed'
      ORDER BY ta.completed_at DESC
      LIMIT 10
    `);

    res.json({
      totalUsers,
      totalTests,
      activeUsers: activeUsers[0].count,
      testStats: testStats[0],
      popularTopics,
      recentAttempts
    });
  } catch (error) {
    next(error);
  }
};

// User Management
const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN', 'PREMIUM'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await User.updateRole(req.params.id, role);
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Question Management
const createQuestion = async (req, res, next) => {
  try {
    const questionId = await Question.create(req.body);
    const question = await Question.findById(questionId);
    res.status(201).json({ message: 'Question created', question });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    await Question.update(req.params.id, req.body);
    const question = await Question.findById(req.params.id);
    res.json({ message: 'Question updated', question });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    await Question.delete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

// Bulk upload questions via CSV or Excel
const bulkUploadQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let results = [];
    const errors = [];
    const filename = req.file.originalname.toLowerCase();

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      // Handle Excel file
      const XLSX = require('xlsx');
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      results = XLSX.utils.sheet_to_json(sheet);
    } else {
      // Handle CSV file
      const stream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => {
            results.push(row);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    let created = 0;
    for (const [idx, row] of results.entries()) {
      try {
        const options = [];
        if (row.option_a) options.push({ option_text: row.option_a, is_correct: row.correct_answer === 'A' });
        if (row.option_b) options.push({ option_text: row.option_b, is_correct: row.correct_answer === 'B' });
        if (row.option_c) options.push({ option_text: row.option_c, is_correct: row.correct_answer === 'C' });
        if (row.option_d) options.push({ option_text: row.option_d, is_correct: row.correct_answer === 'D' });

        await Question.create({
          test_id: parseInt(row.test_id),
          question_text: row.question,
          explanation: row.explanation || '',
          topic: row.topic || 'General',
          difficulty: row.difficulty || 'medium',
          marks: parseInt(row.marks) || 1,
          negative_marks: parseFloat(row.negative_marks) || 0,
          options
        });
        created++;
      } catch (err) {
        errors.push({ row: idx + 1, error: err.message });
      }
    }

    res.json({ message: `Uploaded ${created} questions`, errors });
  } catch (error) {
    next(error);
  }
};

// Download Excel template
const downloadTemplate = async (req, res, next) => {
  try {
    const XLSX = require('xlsx');
    
    const templateData = [
      {
        test_id: 1,
        question: 'What is 2 + 2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        explanation: 'Basic addition: 2 + 2 = 4',
        topic: 'Arithmetic',
        difficulty: 'easy',
        marks: 1,
        negative_marks: 0
      },
      {
        test_id: 1,
        question: 'What is the square root of 144?',
        option_a: '10',
        option_b: '11',
        option_c: '12',
        option_d: '13',
        correct_answer: 'C',
        explanation: '12 × 12 = 144',
        topic: 'Arithmetic',
        difficulty: 'medium',
        marks: 1,
        negative_marks: 0.25
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 }, { wch: 40 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
      { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Test Management
const createTest = async (req, res, next) => {
  try {
    const testId = await Test.create({ ...req.body, created_by: req.user.id });
    const test = await Test.findById(testId);
    res.status(201).json({ message: 'Test created', test });
  } catch (error) {
    next(error);
  }
};

const updateTest = async (req, res, next) => {
  try {
    await Test.update(req.params.id, req.body);
    const test = await Test.findById(req.params.id);
    res.json({ message: 'Test updated', test });
  } catch (error) {
    next(error);
  }
};

const deleteTest = async (req, res, next) => {
  try {
    await Test.delete(req.params.id);
    res.json({ message: 'Test deleted' });
  } catch (error) {
    next(error);
  }
};

// Get all results (admin)
const getAllResults = async (req, res, next) => {
  try {
    const results = await Attempt.getAllCompleted(100);
    res.json({ results });
  } catch (error) {
    next(error);
  }
};

// Leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'alltime' } = req.query;
    let dateFilter = '';
    
    if (period === 'weekly') dateFilter = "AND ta.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    else if (period === 'monthly') dateFilter = "AND ta.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";

    const [rows] = await pool.query(`
      SELECT 
        u.id as user_id, u.name, u.avatar,
        COUNT(ta.id) as tests_completed,
        ROUND(AVG(ta.accuracy), 2) as avg_accuracy,
        ROUND(SUM(ta.score), 2) as total_score
      FROM users u
      JOIN test_attempts ta ON u.id = ta.user_id
      WHERE ta.status = 'completed' ${dateFilter}
      GROUP BY u.id, u.name, u.avatar
      ORDER BY total_score DESC
      LIMIT 50
    `);

    // Add rank
    const leaderboard = rows.map((row, idx) => ({ ...row, rank: idx + 1 }));
    res.json({ leaderboard, period });
  } catch (error) {
    next(error);
  }
};

// Question stats for admin
const getQuestionStats = async (req, res, next) => {
  try {
    const stats = await Question.getStats();
    
    const [hardest] = await pool.query(`
      SELECT q.id, q.question_text, q.topic,
        COUNT(ua.id) as total_attempts,
        SUM(ua.is_correct) as correct_count,
        ROUND(SUM(ua.is_correct) / COUNT(ua.id) * 100, 2) as success_rate
      FROM questions q
      JOIN user_answers ua ON q.id = ua.question_id
      GROUP BY q.id, q.question_text, q.topic
      HAVING COUNT(ua.id) >= 3
      ORDER BY success_rate ASC
      LIMIT 10
    `);

    res.json({ topicStats: stats, hardestQuestions: hardest });
  } catch (error) {
    next(error);
  }
};

// Generate PDF report for a test attempt
const generateResultPDF = async (req, res, next) => {
  try {
    const attemptId = req.params.id;
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Get user info
    const [userRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [attempt.user_id]);
    const user = userRows[0];

    // Get answers
    const answers = await Attempt.getAnswers(attemptId);

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Report_${attemptId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#6366f1').text('AptitudeAI', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Test Performance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Student Info
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Student Information');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#475569');
    doc.text(`Name: ${user?.name || 'Unknown'}`);
    doc.text(`Email: ${user?.email || 'Unknown'}`);
    doc.text(`Test: ${attempt.test_title}`);
    doc.text(`Category: ${attempt.category || 'N/A'} | Difficulty: ${attempt.difficulty || 'N/A'}`);
    doc.text(`Date: ${attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : 'N/A'}`);
    doc.moveDown(1);

    // Score Summary
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Score Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#475569');

    const accuracy = parseFloat(attempt.accuracy || 0).toFixed(1);
    doc.text(`Score: ${attempt.score} / ${attempt.total_marks}`);
    doc.text(`Accuracy: ${accuracy}%`);
    doc.text(`Correct: ${attempt.correct_count} | Incorrect: ${attempt.incorrect_count} | Unanswered: ${attempt.unanswered_count}`);
    const timeMins = Math.floor((attempt.time_taken_seconds || 0) / 60);
    const timeSecs = (attempt.time_taken_seconds || 0) % 60;
    doc.text(`Time Taken: ${timeMins}m ${timeSecs}s`);
    doc.text(`Tab Switches: ${attempt.tab_switch_count || 0}`);
    doc.text(`Result: ${parseFloat(accuracy) >= 50 ? 'PASSED' : 'FAILED'}`);
    doc.moveDown(1);

    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Question Details
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Question-wise Breakdown');
    doc.moveDown(0.5);

    answers.forEach((ans, i) => {
      // Check if enough space - add page if less than 120px remaining
      if (doc.y > 650) {
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Question-wise Breakdown (continued)');
        doc.moveDown(0.5);
      }

      const status = ans.is_correct ? '✓' : (ans.selected_option_id ? '✗' : '–');
      const statusColor = ans.is_correct ? '#10b981' : (ans.selected_option_id ? '#ef4444' : '#f59e0b');

      // Question number and status
      doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor);
      doc.text(`${status} Q${i + 1}. ${ans.question_text || ''}`, {
        lineGap: 3,
        width: 480
      });

      // Topic and answer details  
      doc.moveDown(0.2);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b');
      doc.text(`Topic: ${ans.topic || 'General'} | Your Answer: ${ans.selected_answer || 'Not answered'} | Correct: ${ans.correct_answer || 'N/A'}`, {
        width: 480
      });
      doc.moveDown(0.8);
    });

    // Footer
    doc.moveDown(1);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#94a3b8').text('Generated by AptitudeAI Platform', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats, getUsers, updateUserRole,
  createQuestion, updateQuestion, deleteQuestion, bulkUploadQuestions,
  createTest, updateTest, deleteTest,
  getAllResults, getLeaderboard, getQuestionStats,
  generateResultPDF, downloadTemplate
};
