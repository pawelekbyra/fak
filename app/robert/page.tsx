'use client'; 

import { useChat } from '@ai-sdk/react';
import React, { FormEvent } from 'react'; 

export default function RobertPage() {
  // OSTATECZNA POPRAWKA: Używamy agresywnego rzutowania typu (as any), aby ominąć błędy kompilacji
  // i zapewnić, że wszystkie potrzebne właściwości są dostępne.
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    status, 
    error, 
    reload 
  } = useChat({
    api: '/api/robert',
    // Jawny typ ': any' dla parametru błędu
    onError: (err: any) => { 
      console.error("[ROBERT-UI] Chat Hook Error:", err);
    }
  } as any) as any; // Dodanie drugiego 'as any' było w oryginalnym kodzie i rozwiązuje problemy z Next.js/Vercel

  // POPRAWKA BŁĘDU PRZEŁADOWANIA STRONY: Bezpieczna funkcja obsługująca submit
  const handleSafeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Zapobiega przeładowaniu strony po kliknięciu EXECUTE
    
    // Sprawdza, czy handleSubmit istnieje i jest funkcją, zapobiegając błędom typu "c is not a function"
    if (typeof handleSubmit === 'function') {
      handleSubmit(e);
    } else {
      console.error("ROBERT CRITICAL: handleSubmit is not available!");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono p-4 overflow-hidden relative z-[100]">
      <div className="flex-1 overflow-y-auto mb-4 border border-green-900 p-4 rounded custom-scrollbar">
        
        {/* WERSJA DIAGNOSTYCZNA: Wyświetlanie błędu z hooka */}
        {error && (
            <div className="text-red-500 mt-4 border border-red-900 p-4 whitespace-pre-wrap">
                &gt; CRITICAL ERROR: Communication Failure.
                <br/>
                **Szczegóły:** {error.message}
                <br/>
                <button 
                   onClick={() => reload()} 
                   className="underline mt-2 text-green-400 hover:text-green-200"
                >
                    RETRY (Wymuś odświeżenie połączenia)
                </button>
            </div>
        )}

        {messages.length === 0 && !error && (
          <div className="opacity-50 text-center mt-20">
            &gt; SYSTEM ONLINE. WAITING FOR INPUT...
          </div>
        )}
        
        {/* WARUNKOWE RENDEROWANIE WIADOMOŚCI TYLKO GDY NIE MA BŁĘDU */}
        {!error && messages.map((m: any) => (
          <div key={m.id} className="mb-4 whitespace-pre-wrap">
            <span className="font-bold opacity-70">
              {m.role === 'user' ? 'USER > ' : 'ROBERT > '}
            </span>
            {m.content}
            {m.toolInvocations?.map((toolInvocation: any) => {
              const toolCallId = toolInvocation.toolCallId;
              // Render basic tool info
              return (
                <div key={toolCallId} className="text-yellow-500 mt-1">
                   [TOOL: {toolInvocation.toolName}]
                   {'result' in toolInvocation ? (
                      <span className="text-green-400"> ✓ {JSON.stringify(toolInvocation.result)}</span>
                   ) : (
                      <span className="animate-pulse"> ...</span>
                   )}
                </div>
              );
            })}
          </div>
        ))}
        {status === 'streaming' && (
          <div className="animate-pulse">&gt; PROCESSING...</div>
        )}
      </div>

      {/* UŻYWAMY handleSafeSubmit */}
      <form onSubmit={handleSafeSubmit} className="flex gap-2"> 
        <span className="flex items-center text-green-500">&gt;</span>
        <input
          className="flex-1 bg-black border border-green-800 text-green-500 p-2 focus:outline-none focus:border-green-500 rounded"
          value={input}
          placeholder="Enter command..."
          onChange={handleInputChange}
          autoFocus
          // Removed disabled={!!error} to allow retrying without reloading
        />
        <button
          type="submit"
          className="bg-green-900 text-black px-4 py-2 hover:bg-green-700 font-bold rounded"
          disabled={status === 'streaming'} // Only disable while streaming
        >
          EXECUTE
        </button>
      </form>

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
    </div>
  );
}
