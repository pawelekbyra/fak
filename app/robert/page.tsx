'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Terminal, Send, Trash2, Cpu } from 'lucide-react';

export default function RobertPage() {
  const { messages, error, reload, input, setInput, handleSubmit, setMessages } = useChat({
    api: '/api/robert',
    onError: (err) => {
        console.error("Chat error:", err);
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clearChat = () => {
      setMessages([]);
      inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-green-500 font-mono text-sm md:text-base p-4 overflow-hidden relative">
      {/* CRT Scanline Effect Overlay (Optional but cool) */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-green-800 pb-2 mb-4 z-20">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 animate-pulse" />
          <h1 className="font-bold tracking-widest uppercase">Robert_v1.0.exe</h1>
        </div>
        <div className="flex gap-2">
            <button
                onClick={clearChat}
                className="hover:text-red-500 transition-colors p-1"
                title="Clear Memory"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </header>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 custom-scrollbar z-20 pr-2">
        {messages.length === 0 && (
            <div className="opacity-50 mt-10 text-center">
                <p>Initializing neural link...</p>
                <p>Connection established.</p>
                <p>Waiting for user input.</p>
            </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`text-xs opacity-50 mb-1 ${m.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
              {m.role === 'user' ? 'USR-CMD >' : 'SYS-OUT >'}
            </span>
            <div className={`max-w-[85%] whitespace-pre-wrap break-words ${m.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {error && (
            <div className="border border-red-500 text-red-500 p-2 mt-2 bg-red-900/20">
              <p className="font-bold">CRITICAL ERROR</p>
              <p>{error.message}</p>
              <button
                onClick={() => reload()}
                className="mt-2 px-2 py-1 border border-red-500 hover:bg-red-900 transition-colors uppercase text-xs"
              >
                Retry Execution
              </button>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-center border border-green-800 bg-black/50 p-2 z-20 relative group focus-within:border-green-500 transition-colors">
        <span className="mr-2 text-green-500 animate-pulse">{'>'}</span>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent focus:outline-none text-green-500 placeholder-green-800"
          value={input ?? ''}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          autoComplete="off"
        />
        <button
            type="submit"
            disabled={!input || !input.trim()}
            className="ml-2 px-3 py-1 bg-green-900/30 border border-green-800 hover:bg-green-800/50 hover:border-green-500 text-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase text-xs flex items-center gap-1"
        >
            <span>Execute</span>
            <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
