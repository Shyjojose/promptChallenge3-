import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import 'dotenv/config';

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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('Raw Vertex AI Response:', JSON.stringify(data, null, 2));
      throw new Error('No content from Vertex AI');
    }
    return text;
  }
}

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
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

  // Strict numeric validation to prevent prompt injection
  if (isNaN(Number(user_input))) {
    return res.status(400).json({ error: 'Usage must be a numeric value.' });
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
      { temperature: 0.7, maxOutputTokens: 200 }
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
  const { messages } = req.body;
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
    contents.unshift({ role: 'user', parts: [{ text: 'Hi Terra, I just checked my carbon footprint.' }] });
  }

  try {
    const systemPrompt = "You are 'Terra', a friendly, animated Earth mascot in a carbon footprint app. Be encouraging and fun. Never be aggressive or overly pessimistic. Use simple, relatable comparisons.";
    const text = await generateResponse(
      systemPrompt,
      contents,
      { temperature: 0.7, maxOutputTokens: 250 }
    );

    res.json({ text: text.trim() });
  } catch (err) {
    console.error('Chat API error:', err.message);
    res.status(500).json({ error: 'Failed to communicate with Terra.' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Terra API server running on http://localhost:${PORT}`);
  });
}

export default app;
