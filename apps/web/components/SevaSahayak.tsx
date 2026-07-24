'use client';
import { useState, useRef, useEffect } from 'react';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message to chat
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessage };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);
    setInput('');

    try {
      // Send recent conversation history so the assistant has context
      // across turns, not just the latest message.
      const history = nextMessages
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Kshama karein, kuch takniki samasya hai. Dobara koshish karein. 🙏' }]);
    } finally {
      setIsLoading(false);
    }
  };

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
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232,101,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, marginTop: '2px' }}>ॐ</div>
            <div style={{
              maxWidth: '78%', padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.06)',
              color: '#FFF8EE', fontSize: '14px', lineHeight: '1.5',
            }}>
              SevaSahayak soch raha hai... 🙏
            </div>
          </div>
        )}
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
