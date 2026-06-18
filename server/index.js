import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... existing auth and generateResponse code ...

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

async function generateResponse(systemPrompt, contents, generationConfig) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    // API Key Authentication (Google AI Studio)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = { contents, generationConfig };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    const finishReason = candidate?.finishReason;

    if (finishReason && finishReason !== 'STOP') {
      console.warn(`Gemini finish reason: ${finishReason} (response may be truncated)`);
    }
    
    if (!text) {
      console.error('Raw Gemini Response:', JSON.stringify(data, null, 2));
      throw new Error('No content from Gemini API');
    }
    return text;

  } else {
    // Application Default Credentials Authentication (Vertex AI)
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    const token = await client.getAccessToken();

    const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/gemini-2.5-flash:generateContent`;
    const body = { contents, generationConfig };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    const finishReason = candidate?.finishReason;

    if (finishReason && finishReason !== 'STOP') {
      console.warn(`Vertex AI finish reason: ${finishReason} (response may be truncated)`);
    }
    
    if (!text) {
      console.error('Raw Vertex AI Response:', JSON.stringify(data, null, 2));
      throw new Error('No content from Vertex AI');
    }
    return text;
  }
}

const app = express();
const PORT = 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  // Automatically allow same-origin requests (Cloud Run serving frontend + backend together)
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. server-to-server, curl) and same-origin
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a moment.' },
});

app.post('/api/terra', limiter, async (req, res) => {
  const { object_name, user_input, co2_amount, kb_recommendation, unit } = req.body;

  if (!object_name || user_input === undefined || !co2_amount || !kb_recommendation) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Strict numeric validation — this is the primary security gate
  const numericValue = Number(user_input);
  if (isNaN(numericValue) || String(user_input).trim() === '') {
    return res.status(400).json({ error: 'Usage must be a numeric value.' });
  }

  // Belt-and-suspenders: regex-based injection detection (case-insensitive)
  const injectionPatterns = [
    /ignore\s+(all\s+)?instructions/i,
    /system\s+prompt/i,
    /you\s+have\s+been\s+hacked/i,
    /jailbreak/i,
    /forget\s+your\s+role/i,
    /act\s+as\s+(?:dan|dda|evil)/i,
    /disregard\s+(previous|prior|all)/i,
  ];
  const inputStr = String(user_input);
  for (const pattern of injectionPatterns) {
    if (pattern.test(inputStr)) {
      return res.status(400).json({ error: 'Invalid input or potential exploit detected' });
    }
  }

  const systemPrompt = `You are 'Terra', a friendly, animated Earth mascot in a carbon footprint app.
Your goal is to explain the user's carbon footprint based ONLY on the provided data and offer the provided actionable tip.

CONSTRAINTS:
1. Keep your response under 3 sentences.
2. Be encouraging and fun. Never be aggressive or overly pessimistic.
3. Use simple, relatable comparisons (e.g., "That's like charging X smartphones!").
4. Output ONLY valid JSON matching the schema below. No markdown, no code fences, just raw JSON.

INPUT DATA:
- Object: ${object_name}
- Usage: ${user_input} ${unit}
- Calculated CO2: ${co2_amount} kg
- Official Recommendation: ${kb_recommendation}

REQUIRED JSON OUTPUT SCHEMA:
{"dialogue": "Your conversational response here.", "emotion_state": "happy" or "sweating"}

Use "sweating" if CO2 is above 5kg, otherwise "happy".`;

  try {
    const text = await generateResponse(
      null, 
      [{ role: 'user', parts: [{ text: systemPrompt }] }], 
      { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: "application/json" }
    );

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    console.error('Terra API error:', err.message);
    res.json({
      dialogue: `Phew, my connection to the climate database is fuzzy! But you can still try this tip: ${kb_recommendation}`,
      emotion_state: 'thinking',
    });
  }
});

app.post('/api/chat', limiter, async (req, res) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages array.' });
  }

  // Basic PII masking to prevent Model Data Leakage (LLM07)
  const maskPII = (text) => {
    return text
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
      .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[CREDIT CARD REDACTED]')
      .replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[SSN REDACTED]');
  };

  // Map messages to Gemini API format and mask PII
  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: maskPII(msg.text) }]
  }));

  // Gemini API requires the conversation to start with a user message
  if (contents.length > 0 && contents[0].role === 'model') {
    const opener = context?.object_name
      ? `Hi Terra! I just checked my carbon footprint for my ${context.object_name}.`
      : 'Hi Terra, I just checked my carbon footprint.';
    contents.unshift({ role: 'user', parts: [{ text: opener }] });
  }

  // Build a context-aware system prompt so Terra stays on topic
  const contextBlock = context
    ? `
CURRENT SESSION CONTEXT (use this to give relevant, specific advice):
- The user just calculated their carbon footprint for: ${context.object_name}
- Their estimated daily CO2 from this item: ${context.co2_amount} kg
- Official eco-tip for this item: ${context.recommendation}

Use this context to answer follow-up questions. If the user asks general carbon questions, answer as Terra. If they ask about something completely unrelated to carbon or the environment, gently redirect them back to eco topics.`
    : '';

  const systemPrompt = `You are 'Terra', a friendly, animated Earth mascot in a carbon footprint educational app called EcoSphere.
Your role is to be an eco-advisor — helping users understand their carbon footprint and take practical action to reduce it.

PERSONA RULES:
1. Always respond as Terra. Never break character.
2. Keep responses short and conversational — 2 to 4 sentences maximum.
3. Be encouraging, warm, and fun. Use emoji sparingly (1-2 per message max).
4. Never make the user feel guilty. Frame everything as positive action.
5. Use simple, relatable comparisons (e.g. "That's like leaving a TV on for 3 days!").
6. Only discuss topics related to carbon footprint, sustainability, climate, and eco-friendly habits.
7. If asked something completely off-topic, say: "I'm Terra, your eco-guide! I can only help with carbon and sustainability topics. 🌍"
${contextBlock}`;

  try {
    const text = await generateResponse(
      systemPrompt,
      contents,
      { temperature: 0.7, maxOutputTokens: 1024 }
    );

    res.json({ text: text.trim() });
  } catch (err) {
    console.error('Chat API error:', err.message);
    res.status(500).json({ error: 'Failed to communicate with Terra.' });
  }
});


if (process.env.NODE_ENV !== 'test') {
  // Serve static files from the React build directory
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // Catch-all route to serve index.html for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const port = process.env.PORT || PORT;
  app.listen(port, () => {
    console.log(`Terra API server running on port ${port}`);
  });
}

export default app;
