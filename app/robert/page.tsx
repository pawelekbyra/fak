'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function RobertPage() {
  const { messages, sendMessage, status } = useChat({
    api: '/api/robert',
  } as any);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    setMounted(true);
    // Add overflow hidden to body to prevent scrolling the underlying app
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Save current input and clear it immediately
    const text = input;
    setInput('');

    await sendMessage({ text });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black text-green-500 font-mono p-4 overflow-hidden"
      style={{ zIndex: 2147483647 }} // Maximum safe integer z-index
    >
      <div className="flex-1 h-full flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 border border-green-900 p-4 rounded custom-scrollbar">
          {messages.length === 0 && (
            <div className="opacity-50 text-center mt-20">
              &gt; SYSTEM ONLINE. WAITING FOR INPUT...
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className="mb-4 whitespace-pre-wrap">
              <span className="font-bold opacity-70">
                {m.role === 'user' ? 'USER > ' : 'ROBERT > '}
              </span>
              {m.parts ? (
                m.parts.map((part: any, i: number) => {
                   if (part.type === 'text') return <span key={i}>{part.text}</span>;
                   if (part.type === 'tool-invocation') return <span key={i} className="text-yellow-500">[TOOL: {part.toolInvocation.toolName}]</span>;
                   return null;
                })
              ) : (
                // Fallback for older message format or simplified text
                 (m as any).content
              )}
            </div>
          ))}
          {status === 'streaming' && (
             <div className="animate-pulse">&gt; PROCESSING...</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <span className="flex items-center text-green-500">&gt;</span>
          <input
            className="flex-1 bg-black border border-green-800 text-green-500 p-2 focus:outline-none focus:border-green-500 rounded"
            value={input}
            placeholder="Enter command..."
            onChange={handleInputChange}
            autoFocus
          />
          <button
              type="submit"
              className="bg-green-900 text-black px-4 py-2 hover:bg-green-700 font-bold rounded"
              disabled={status === 'streaming'}
          >
            EXECUTE
          </button>
        </form>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #14532d;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #15803d;
        }
      `}</style>
    </div>,
    document.body
  );
}
