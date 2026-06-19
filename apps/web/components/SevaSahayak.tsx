'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const QUICK_REPLIES = {
  pilgrim: [
    'Next Shahi Snaan date?',
    'Least crowded ghat right now',
    'Nearest medical camp',
    'Aarti timing today',
    'Emergency helpline',
  ],
  volunteer: [
    'My zone assignment',
    'Incident reporting steps',
    'Emergency protocol',
    'Supervisor contact',
    'Shift timing',
  ],
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface Props {
  isInline?: boolean;
}

function getOfflineResponse(message: string, role: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('shahi') || msg.includes('snaan') || msg.includes('bath')) {
    return `Shahi Snaan dates for Mahakumbh 2025:\n\n• 13 Jan — Makar Sankranti (most sacred, arrive before 4am)\n• 29 Jan — Mauni Amavasya (silence observed, extreme crowds)\n• 3 Feb — Basant Panchami\n• 12 Feb — Maghi Purnima\n• 26 Feb — Maha Shivratri\n\nArrive 2-3 hours early on these dates.`;
  }
  if (msg.includes('crowd') || msg.includes('ghat') || msg.includes('least')) {
    return `Current crowd levels (live data unavailable, showing estimates):\n\n🟢 Low: Sector 2 Ghat, Medical Camp North, Parking Zone B\n🟡 Medium: Sector 1 Ghat, Food Court Zone, Sector 3 Ghat\n🔴 High: Triveni Sangam, Gate 2 Entry, Sector 4 Ghat\n\nRecommended: Sector 2 Ghat is currently least crowded.`;
  }
  if (msg.includes('medical') || msg.includes('doctor') || msg.includes('hospital')) {
    return `Medical facilities at Mahakumbh 2025:\n\n🏥 Medical Camp North — Sector 4 (24/7)\n🏥 Medical Camp South — Near Sangam Ghat (24/7)\n🚑 Emergency: 108 (Ambulance)\n📞 Kumbh Helpline: 1920\n\nFor serious emergencies call 108 immediately.`;
  }
  if (msg.includes('emergency') || msg.includes('help') || msg.includes('lost')) {
    return `Emergency contacts for Mahakumbh 2025:\n\n📞 Kumbh Helpline: 1920\n🚔 Police: 112\n🚑 Ambulance: 108\n🏥 Medical Emergency: 108\n\nLost & Found center is located near Gate 2 Entry. If you are lost, stay where you are and call 1920.`;
  }
  if (msg.includes('aarti') || msg.includes('pooja') || msg.includes('timing')) {
    return `Pooja & Aarti timings at Triveni Sangam:\n\n🌅 Morning Aarti: 6:00 AM daily\n🌇 Evening Aarti: 7:00 PM daily\n\nGanga Aarti is most crowded on Shahi Snaan days. Arrive 45 minutes early for a good spot.`;
  }
  if (msg.includes('volunteer') || msg.includes('assignment') || msg.includes('zone')) {
    return role === 'volunteer' 
      ? `Volunteer protocol:\n\n1. Check your zone assignment on the Zones section above\n2. Report to your sector supervisor 30 min before shift\n3. For incidents: log in Incident Tracker immediately\n4. Emergency escalation: call supervisor → 1920\n\nYour shift details are in the Volunteer Roster section.`
      : `Volunteer information:\n\nSevaMitra has 44 active volunteers across 12 zones. Volunteers wear orange vests and are stationed at all major ghats. For volunteer assistance, look for the orange vest or call 1920.`;
  }
  if (msg.includes('parking') || msg.includes('transport') || msg.includes('route')) {
    return `Transport & Parking at Mahakumbh 2025:\n\n🅿️ Parking Zone A — North entry (74% full)\n🅿️ Parking Zone B — South entry (55% full)\n\n🚌 Free shuttle buses run every 15 min from parking to Sangam\n🚶 Walking routes are marked with saffron flags\n\nFor least traffic: use Parking Zone B and enter via Sector 2 Ghat route.`;
  }
  
  return `Namaste ji 🙏 I am SevaSahayak, your Mahakumbh 2025 guide.\n\nI can help you with:\n• Shahi Snaan dates and timings\n• Ghat crowd levels and routes\n• Medical camps and emergency contacts\n• Aarti and pooja timings\n• Volunteer assignments and protocols\n\nWhat would you like to know?`;
}

export default function SevaSahayak({ isInline = false }: Props) {
  const [isOpen, setIsOpen] = useState(isInline);
  const [role, setRole] = useState<'pilgrim' | 'volunteer'>('pilgrim');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: isInline 
        ? 'नमस्ते 🙏 I am SevaSahayak. Ask me anything about Mahakumbh 2025 — Shahi Snaan dates, ghat locations, crowd levels, or volunteer protocols.'
        : 'नमस्ते 🙏 How can I help you today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => 
    Math.random().toString(36).substring(2));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text 
    };
    const assistantId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, userMsg, { 
      id: assistantId, 
      role: 'assistant', 
      content: '', 
      streaming: true 
    }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, role, sessionId }),
      });
      
      if (!res.ok) {
        throw new Error('API unavailable');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  accumulated += data.text;
                  setMessages(prev => prev.map(m => 
                    m.id === assistantId 
                      ? { ...m, content: accumulated, streaming: true }
                      : m
                  ));
                }
                if (data.done || data.error) {
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, 
                          content: data.error || accumulated, 
                          streaming: false }
                      : m
                  ));
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      const fallbackText = getOfflineResponse(text, role);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: fallbackText, streaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, role, sessionId]);

  const chatPanel = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isInline ? '600px' : '520px',
      background: isInline ? 'transparent' : '#1C0A00',
      borderRadius: isInline ? '0' : '20px',
      border: isInline ? 'none' : '1px solid rgba(232,101,10,0.2)',
      overflow: 'hidden',
    }}>
      
      {/* Header - only for floating */}
      {!isInline && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(232,101,10,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(232,101,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>ॐ</div>
            <div>
              <div style={{ color: '#FFF8EE', fontWeight: '500', fontSize: '14px' }}>SevaSahayak</div>
              <div style={{ color: '#1DB954', fontSize: '11px' }}>● Online</div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,248,238,0.4)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Role toggle */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(232,101,10,0.1)', display: 'flex', gap: '8px' }}>
        {(['pilgrim', 'volunteer'] as const).map(r => (
          <button key={r} onClick={() => setRole(r)} style={{
            padding: '6px 16px', borderRadius: '20px', fontSize: '12px',
            cursor: 'pointer', transition: 'all 0.2s',
            background: role === r ? '#E8650A' : 'transparent',
            color: role === r ? '#FFF8EE' : 'rgba(255,248,238,0.5)',
            border: role === r ? 'none' : '1px solid rgba(232,101,10,0.2)',
            fontFamily: 'inherit',
          }}>
            {r === 'pilgrim' ? '🙏 Pilgrim' : '🦺 Volunteer'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(232,101,10,0.2) transparent' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232,101,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, marginTop: '2px' }}>ॐ</div>
            )}
            <div style={{
              maxWidth: '78%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#E8650A' : 'rgba(255,255,255,0.06)',
              color: '#FFF8EE', fontSize: '14px', lineHeight: '1.5',
              border: msg.role === 'assistant' ? '1px solid rgba(232,101,10,0.1)' : 'none',
            }}>
              {msg.streaming && msg.content === '' ? (
                <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '6px', verticalAlign: 'middle' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,248,238,0.6)', display: 'inline-block', animation: `dot-bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 2 && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid rgba(232,101,10,0.1)' }}>
          {QUICK_REPLIES[role].map(q => (
            <button key={q} onClick={() => sendMessage(q)} style={{
              padding: '5px 10px', borderRadius: '12px', fontSize: '11px',
              background: 'rgba(232,101,10,0.1)', border: '1px solid rgba(232,101,10,0.2)',
              color: 'rgba(255,248,238,0.7)', cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>{q}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(232,101,10,0.15)', display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={role === 'pilgrim' ? 'Ask about Mahakumbh...' : 'Ask about your assignment...'}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px', fontSize: '14px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(232,101,10,0.2)',
            color: '#FFF8EE', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} style={{
          width: '40px', height: '40px', borderRadius: '50%', border: 'none',
          background: input.trim() ? '#E8650A' : 'rgba(232,101,10,0.2)',
          color: '#FFF8EE', cursor: input.trim() ? 'pointer' : 'default',
          fontSize: '16px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', flexShrink: 0,
        }}>➤</button>
      </div>
    </div>
  );

  return (
    <>
      {/* FLOATING BUBBLE */}
      {!isInline && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          {isOpen ? (
            <div style={{ width: '360px', filter: 'drop-shadow(0 8px 32px rgba(232,101,10,0.3))' }}>
              {chatPanel}
            </div>
          ) : (
            <button onClick={() => setIsOpen(true)} style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#E8650A', border: 'none', cursor: 'pointer',
              fontSize: '22px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 4px 20px rgba(232,101,10,0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              ॐ
            </button>
          )}
        </div>
      )}

      {/* INLINE SECTION VERSION */}
      {isInline && chatPanel}
    </>
  );
}
