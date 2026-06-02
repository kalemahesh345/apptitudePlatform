const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

module.exports = {
  apiKey: GEMINI_API_KEY,
  apiUrl: GEMINI_API_URL,
  isEnabled: !!GEMINI_API_KEY,
  defaultModel: 'gemini-2.5-flash-lite'
};
