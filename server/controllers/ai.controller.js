const aiConfig = require('../config/ai');
const pool = require('../config/db');
const Attempt = require('../models/attempt.model');

// Helper: Call Gemini API
const callGemini = async (prompt) => {
  if (!aiConfig.isEnabled) {
    console.log('AI disabled, returning mock response.');
    return generateMockResponse(prompt);
  }

  try {
    console.log('Calling Gemini API...');
    const response = await fetch(`${aiConfig.apiUrl}?key=${aiConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Gemini API Error Response:', data.error);
      return generateMockResponse(prompt);
    }
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    console.error('Gemini API unexpected response format:', data);
    return 'AI analysis is currently unavailable. Please try again later.';
  } catch (error) {
    console.error('Gemini API request error:', error.message);
    return generateMockResponse(prompt);
  }
};

const cleanJsonResponse = (text) => {
  if (!text) return {};
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
};

// Mock AI responses when no API key
const generateMockResponse = (prompt) => {
  if (prompt.includes('analyze')) {
    return JSON.stringify({
      summary: "Based on your recent test performance, you show strong analytical skills in Logical Reasoning with consistent accuracy above 75%. However, there's room for improvement in Quantitative Aptitude, particularly in topics like Probability and Time & Work.",
      strengths: ["Logical Reasoning", "Pattern Recognition", "Verbal Analogies"],
      weaknesses: ["Probability", "Time & Work", "Percentages"],
      recommendations: [
        "Focus 30 minutes daily on Probability concepts",
        "Practice Time & Work problems with varying difficulty",
        "Review percentage shortcuts and tricks"
      ],
      overallRating: "Good - Keep improving!"
    });
  }
  if (prompt.includes('study plan') || prompt.includes('recommendation')) {
    return JSON.stringify({
      plan: {
        title: "14-Day Personalized Study Plan",
        days: [
          { day: 1, topic: "Probability Basics", duration: "45 mins", resources: ["Study Notes: Probability Fundamentals"] },
          { day: 2, topic: "Probability Practice", duration: "30 mins", resources: ["Practice MCQs: Probability"] },
          { day: 3, topic: "Time & Work Concepts", duration: "45 mins", resources: ["Study Notes: Time & Work"] },
          { day: 4, topic: "Time & Work Practice", duration: "30 mins", resources: ["Practice MCQs: Time & Work"] },
          { day: 5, topic: "Percentages Review", duration: "40 mins", resources: ["Study Notes: Percentages"] },
          { day: 6, topic: "Mixed Practice Test", duration: "30 mins", resources: ["Take a practice test"] },
          { day: 7, topic: "Review & Revision", duration: "30 mins", resources: ["Review incorrect answers"] },
          { day: 8, topic: "Ratio & Proportion", duration: "45 mins", resources: ["Study Notes: Ratios"] },
          { day: 9, topic: "Speed, Time & Distance", duration: "40 mins", resources: ["Study Notes: STD"] },
          { day: 10, topic: "Number System", duration: "45 mins", resources: ["Study Notes: Numbers"] },
          { day: 11, topic: "Mixed Practice", duration: "30 mins", resources: ["Practice MCQs"] },
          { day: 12, topic: "Logical Reasoning Advanced", duration: "45 mins", resources: ["Study Notes: Advanced LR"] },
          { day: 13, topic: "Full Mock Test", duration: "60 mins", resources: ["Complete mock test"] },
          { day: 14, topic: "Analysis & Planning", duration: "30 mins", resources: ["Review all progress"] }
        ]
      },
      estimatedImprovement: "15-20% accuracy improvement expected",
      priorityTopics: ["Probability", "Time & Work", "Percentages"]
    });
  }
  if (prompt.includes('explain')) {
    return JSON.stringify({
      explanation: "Let's break down this problem step by step:\n\n**Step 1:** Identify what's being asked\n**Step 2:** List the given information\n**Step 3:** Apply the relevant formula\n**Step 4:** Calculate the answer\n\n**Key Formula:** The formula used here is fundamental to this topic.\n\n**Common Mistake:** Many students confuse this with a similar concept. The key difference is...\n\n**Tip:** Always double-check your units and ensure consistency throughout the calculation.",
      formula: "Relevant formula for this type of problem",
      concept: "Core concept explanation",
      tips: ["Always check units", "Draw diagrams when possible", "Estimate before calculating"]
    });
  }
  // Chat response
  return "I'm your AI Study Mentor! I can help you with:\n\n• **Topic explanations** - Ask me about any concept\n• **Study tips** - Get personalized advice\n• **Practice problems** - I'll create custom questions\n• **Motivation** - Stay on track with your goals\n\nWhat would you like to work on today?";
};

// AI Result Analysis
const analyzeResults = async (req, res, next) => {
  try {
    const { attemptId } = req.body;
    const userId = req.user.id;

    let context = '';
    if (attemptId) {
      const attempt = await Attempt.findById(attemptId);
      const answers = await Attempt.getAnswers(attemptId);
      const topicStats = await Attempt.getTopicWiseStats(userId);
      
      context = `Analyze this aptitude test result:
        Score: ${attempt.score}/${attempt.total_marks}
        Accuracy: ${attempt.accuracy}%
        Correct: ${attempt.correct_count}, Incorrect: ${attempt.incorrect_count}, Unanswered: ${attempt.unanswered_count}
        Category: ${attempt.category}
        Topic-wise performance: ${JSON.stringify(topicStats)}
        Return a JSON object with: summary, strengths (array), weaknesses (array), recommendations (array), overallRating.
        IMPORTANT: Keep all text including the summary extremely short, concise, and summary-type.`;
    } else {
      const topicStats = await Attempt.getTopicWiseStats(userId);
      const stats = await Attempt.getUserStats(userId);
      context = `Analyze overall aptitude performance:
        Total tests: ${stats.total_tests}, Avg accuracy: ${stats.avg_accuracy}%
        Topic-wise: ${JSON.stringify(topicStats)}
        Return a JSON object with: summary, strengths (array), weaknesses (array), recommendations (array), overallRating.
        IMPORTANT: Keep all text extremely short, concise, and summary-type.`;
    }

    const response = await callGemini(context + ' analyze');
    let parsed;
    try { parsed = cleanJsonResponse(response); } catch (e) { console.error("Parse Error:", e); parsed = { summary: response }; }

    // Save to DB
    await pool.query(
      'INSERT INTO ai_recommendations (user_id, type, input_data, recommendation) VALUES (?, ?, ?, ?)',
      [userId, 'analysis', JSON.stringify({ attemptId }), JSON.stringify(parsed)]
    );

    res.json({ analysis: parsed });
  } catch (error) {
    next(error);
  }
};

// AI Study Recommendation
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const topicStats = await Attempt.getTopicWiseStats(userId);
    const stats = await Attempt.getUserStats(userId);

    const prompt = `Generate a personalized study plan and recommendation for aptitude exam:
      Student stats: Total tests: ${stats.total_tests}, Avg accuracy: ${stats.avg_accuracy}%
      Topic performance: ${JSON.stringify(topicStats)}
      Weak areas need more focus. Create a 14-day study plan.
      Return JSON with: plan (object with title, days array), estimatedImprovement, priorityTopics (array)
      study plan recommendation`;

    const response = await callGemini(prompt);
    let parsed;
    try { parsed = cleanJsonResponse(response); } catch (e) { console.error("Parse Error:", e); parsed = { plan: response }; }

    await pool.query(
      'INSERT INTO ai_recommendations (user_id, type, input_data, recommendation) VALUES (?, ?, ?, ?)',
      [userId, 'study_plan', JSON.stringify(topicStats), JSON.stringify(parsed)]
    );

    res.json({ recommendation: parsed });
  } catch (error) {
    next(error);
  }
};

// AI Question Explanation
const explainQuestion = async (req, res, next) => {
  try {
    const { questionId, userAnswer } = req.body;
    const Question = require('../models/question.model');
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const correctOption = question.options.find(o => o.is_correct);
    const prompt = `Explain this aptitude question step by step:
      Question: ${question.question_text}
      Options: ${question.options.map(o => o.option_text).join(', ')}
      Correct Answer: ${correctOption?.option_text}
      User's Answer: ${userAnswer || 'Not answered'}
      Existing explanation: ${question.explanation || 'None'}
      Provide: step-by-step solution, formula used, common mistakes, tips.
      Return JSON with: explanation, formula, concept, tips (array).
      IMPORTANT: Keep the explanation and all text extremely short, concise, and summary-type.
      explain`;

    const response = await callGemini(prompt);
    let parsed;
    try { parsed = cleanJsonResponse(response); } catch (e) { console.error("Parse Error:", e); parsed = { explanation: response }; }

    res.json({ explanation: parsed });
  } catch (error) {
    next(error);
  }
};

// AI Mentor Chat
const chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    // Check premium chat limit (non-premium: 10 messages/day)
    if (req.user.role === 'USER') {
      const [countRows] = await pool.query(`
        SELECT COUNT(*) as count FROM ai_logs 
        WHERE user_id = ? AND role = 'user' AND date(created_at) = date('now')
      `, [userId]);
      if (countRows[0].count >= 10) {
        return res.status(429).json({ message: 'Daily AI mentor limit reached. Upgrade to Premium for unlimited access.' });
      }
    }

    // Save user message
    const sid = sessionId || `session_${Date.now()}`;
    await pool.query(
      'INSERT INTO ai_logs (user_id, session_id, role, message) VALUES (?, ?, ?, ?)',
      [userId, sid, 'user', message]
    );

    // Get conversation history
    const [history] = await pool.query(
      'SELECT role, message FROM ai_logs WHERE user_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId, sid]
    );

    const context = history.reverse().map(h => `${h.role}: ${h.message}`).join('\n');
    const prompt = `You are an AI study mentor for aptitude exam preparation. 
      Be helpful, encouraging, and educational. 
      CRITICAL RULE: Keep your response extremely short, concise, and provide only a brief summary-type answer. Do not write long paragraphs.
      Previous conversation:\n${context}\n\nStudent says: ${message}\n\nRespond helpfully:`;

    const response = await callGemini(prompt);

    // Save AI response
    await pool.query(
      'INSERT INTO ai_logs (user_id, session_id, role, message) VALUES (?, ?, ?, ?)',
      [userId, sid, 'assistant', response]
    );

    res.json({ reply: response, sessionId: sid });
  } catch (error) {
    next(error);
  }
};

// Get chat history
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    let query = 'SELECT * FROM ai_logs WHERE user_id = ?';
    const params = [req.user.id];
    
    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const [messages] = await pool.query(query, params);
    res.json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeResults, getRecommendations, explainQuestion, chat, getChatHistory };
