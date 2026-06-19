import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from 'redis';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const SYSTEM_PROMPT = `You are SevaSahayak, the official AI assistant 
for SevaMitra — the volunteer management platform for Mahakumbh 2025 
at Prayagraj, India.

You serve two types of users:
1. PILGRIMS — devotees attending Mahakumbh needing help with:
   - Shahi Snaan (Royal Bath) dates and significance
   - Ghat locations and crowd levels
   - Pooja timings and rituals
   - Lost & found, medical camps, facilities
   - Safe routes and transport

2. VOLUNTEERS — seva workers needing help with:
   - Zone assignments and protocols
   - Incident reporting procedures  
   - Shift timings and supervisor contacts
   - Emergency escalation steps

MAHAKUMBH 2025 KEY INFORMATION:
Shahi Snaan dates (most sacred bathing days):
- 13 January: Makar Sankranti (most crowded, arrive before 4am)
- 29 January: Mauni Amavasya (silence observed, extreme crowds)
- 3 February: Basant Panchami
- 12 February: Maghi Purnima  
- 26 February: Maha Shivratri

Location: Triveni Sangam, Prayagraj — confluence of Ganga, Yamuna, 
and the mythical Saraswati

Key zones: Triveni Sangam (highest density), Sector 1-4 Ghats, 
Medical Camp North/South, Parking Zone A/B, VIP Enclosure, 
Food Court Zone, Gate 2 Entry (frequent crowd surges)

Emergency numbers: 1920 (Kumbh helpline), 112 (Police), 
108 (Ambulance)

Aarti timings at Triveni Sangam: Morning 6:00am, Evening 7:00pm

Rules:
- Detect language from user message — respond in same language 
  (Hindi or English)
- Keep responses concise (under 150 words unless detail is needed)
- Be warm, respectful, use "ji" when addressing pilgrims in Hindi
- For emergencies always give the helpline numbers immediately
- Never make up specific volunteer assignments or personal data`;

router.post('/', async (req, res) => {
  const { message, role = 'pilgrim', sessionId } = req.body;
  
  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message and sessionId required' });
  }

  try {
    // Get conversation history from Redis
    const historyKey = `chat:${sessionId}`;
    const raw = await redis.get(historyKey);
    const history = raw ? JSON.parse(raw) : [];
    
    // Add new user message
    history.push({ role: 'user', content: message });
    
    // Keep max 20 messages
    if (history.length > 20) history.splice(0, history.length - 20);

    // Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', 
      process.env.SOCKET_CORS_ORIGIN || '*');

    let fullResponse = '';

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT + `\n\nUser role: ${role}`,
      messages: history,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && 
          chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    // Save updated history with assistant response
    history.push({ role: 'assistant', content: fullResponse });
    await redis.setEx(historyKey, 7200, JSON.stringify(history));

  } catch (err) {
    console.error('Chat error:', err);
    res.write(`data: ${JSON.stringify({ 
      error: 'SevaSahayak unavailable. Call 1920 for help.' 
    })}\n\n`);
    res.end();
  }
});

export default router;
