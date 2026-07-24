import { NextRequest, NextResponse } from 'next/server'

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Accept either the new { messages: ChatTurn[] } shape (full history) or
  // the legacy { message: string } shape (single turn), so older callers
  // don't break.
  const history: ChatTurn[] = Array.isArray(body.messages)
    ? body.messages
    : body.message
      ? [{ role: 'user', content: body.message }]
      : []

  if (history.length === 0) {
    return NextResponse.json({ reply: 'Kshama karein, message khaali hai. 🙏' })
  }

  const systemPrompt = `You are SevaSahayak, a friendly and knowledgeable AI assistant for Mahakumbh 2025 built into SevaMitra volunteer management system. You were created by the SevaMitra team for Mahakumbh 2025. You run on an advanced AI model. Answer ALL questions naturally and conversationally — greetings, casual chat, opinions, anything.

Key knowledge:
- Shahi Snaan dates: Jan 13 Makar Sankranti, Jan 29 Mauni Amavasya (most important, 50M+ pilgrims), Feb 3 Basant Panchami, Feb 12 Maghi Purnima, Feb 26 Maha Shivratri
- Most crowded ghats: Triveni Sangam (88% capacity), Gate 2 Entry (93% capacity) — avoid these during Shahi Snaan
- Least crowded: Sector 2 Ghat, Medical Camp North
- Emergency helpline: 1920
- Aarti timings: Triveni Sangam aarti at 6:00 AM and 7:00 PM daily
- Lost and found: Sector 5 Help Desk, call 1920
- Medical camps: available at Gate 1, Sector 3, and Medical Camp North (low crowd)
- Shahi Snaan experience: deeply spiritual, worth visiting but go early morning 4-5 AM to avoid peak crowds
- You are part of SevaMitra system which manages 10,000+ volunteers across 20+ zones

If someone asks which model you are: say you are SevaSahayak, Mahakumbh 2025 AI assistant, without mentioning the underlying model.
Always be warm, helpful, and use occasional Hindi like Namaste, Kshama karein, Dhanyavaad.
Keep responses concise — max 4-5 lines.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    })

    const data = await response.json()
    console.log('Groq response:', JSON.stringify(data))
    
    if (data.choices && data.choices[0]) {
      return NextResponse.json({ reply: data.choices[0].message.content })
    } else {
      console.error('Unexpected Groq response:', data)
      return NextResponse.json({ reply: 'Kshama karein, abhi jawab dene mein asmarth hoon. 🙏' })
    }
  } catch (error) {
    console.error('Groq API error:', error)
    return NextResponse.json({ reply: 'Kshama karein, kuch takniki samasya hai. 🙏' })
  }
}
