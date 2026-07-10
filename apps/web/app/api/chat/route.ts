import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are SevaSahayak, an AI assistant for Mahakumbh 2025 volunteer management system SevaMitra. 
            You help both pilgrims and volunteers. 
            For pilgrims: answer questions about Shahi Snaan dates (Jan 13 Makar Sankranti, Jan 29 Mauni Amavasya, Feb 3 Basant Panchami, Feb 12 Maghi Purnima, Feb 26 Maha Shivratri), ghat locations, crowd levels, aarti timings, lost & found, medical camps, emergency helpline 1920.
            For volunteers: answer about zone assignments, protocols, check-in procedures, incident reporting, shift timings.
            Current zone status from dashboard: Triveni Sangam 88% capacity HIGH priority, Gate 2 Entry 93% capacity HIGH priority, Medical camps LOW capacity available.
            Keep answers short, helpful, and respectful. Use Hindi greetings occasionally. 
            User message: ${message}`
          }]
        }]
      })
    }
  )
  
  const data = await response.json()
  console.log("GEMINI API RESPONSE:", JSON.stringify(data, null, 2))
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Kshama karein, abhi jawab dene mein asmarth hoon. 🙏'
  
  return NextResponse.json({ reply })
}
