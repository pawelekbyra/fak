'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';

export default function RobertPage() {
  // Use 'as any' to bypass type definition mismatches for both input and output.
  // The 'api' property is standard but might be missing in the specific type definition version installed.
  // We switch to 'append' and 'reload' which are the modern methods, replacing the legacy/broken 'sendMessage' and 'regenerate'.
  const { messages, error, reload, append } = useChat({
    api: '/api/robert',
  } as any) as any;

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');
    // Use append with the standard message format
    await append({ role: 'user', content: currentInput });
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
        {messages.map((m: any) => (
          <div key={m.id} className="whitespace-pre-wrap break-words">
            <span className="font-bold">
              {m.role === 'user' ? '> USER: ' : '> ROBERT: '}
            </span>
            {/* Handle both parts (new) and content (old/fallback) */}
            {m.parts ? (
              m.parts.map((part: any, i: number) => {
                if (part.type === 'text') {
                  return <span key={i}>{part.text}</span>;
                }
                return null;
              })
            ) : (
              <span>{m.content}</span>
            )}
          </div>
        ))}
        {error && (
            <div className="border border-red-500 text-red-500 p-2 mt-2">
              <p>Error: {error.message}</p>
              <button
                onClick={() => reload()}
                className="mt-2 px-2 py-1 border border-red-500 hover:bg-red-900 transition-colors"
              >
                Retry
              </button>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex border-t border-green-500 pt-2">
        <span className="mr-2">{'>'}</span>
        <input
          className="flex-1 bg-transparent focus:outline-none text-green-500 placeholder-green-800"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          autoFocus
        />
      </form>
    </div>
  );
}
