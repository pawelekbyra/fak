'use client'; 

import { useChat } from '@ai-sdk/react';
import React, { FormEvent, useEffect } from 'react'; 

export default function RobertPage() {
  // Pobieramy więcej funkcji z hooka, w tym 'append' i 'setInput' jako zapas
  const chatHook = useChat({
    api: '/api/robert',
    onError: (err: any) => { 
      console.error("[ROBERT-UI] Chat Hook Error:", err);
    }
  } as any) as any;

  // Destrukturyzacja z bezpiecznym dostępem
  const { 
    messages, 
    input, 
    setInput,
    handleInputChange, 
    handleSubmit, 
    status, 
    error, 
    reload,
    append // Funkcja bezpośredniego wysyłania wiadomości
  } = chatHook;

  // DIAGNOSTYKA: Pokaż w konsoli co naprawdę zwraca hook
  useEffect(() => {
    console.log("[ROBERT-UI] Chat Hook state:", chatHook);
  }, [chatHook]);

  // NAPRAWIONA FUNKCJA OBSŁUGI: Fallback do 'append'
  const handleSafeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Zawsze zapobiegaj przeładowaniu
    
    if (!input || input.trim() === '') return;

    // 1. Próba standardowa: handleSubmit
    if (typeof handleSubmit === 'function') {
      handleSubmit(e);
    } 
    // 2. Próba awaryjna: append (jeśli handleSubmit nie istnieje)
    else if (typeof append === 'function') {
      console.warn("[ROBERT-UI] handleSubmit missing, using append fallback.");
      // Ręczne wysłanie wiadomości
      await append({ role: 'user', content: input });
      // Przy ręcznym append trzeba często samemu wyczyścić input
      if (setInput) setInput('');
    } 
    // 3. Krytyczny błąd
    else {
      console.error("ROBERT CRITICAL: Both handleSubmit and append are missing! Check console for hook state.");
      alert("BŁĄD KRYTYCZNY: Nie można wysłać wiadomości. Sprawdź konsolę (F12).");
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

        {(messages || []).length === 0 && !error && (
          <div className="opacity-50 text-center mt-20">
            &gt; SYSTEM ONLINE. WAITING FOR INPUT...
          </div>
        )}
        
        {/* BEZPIECZNE RENDEROWANIE WIADOMOŚCI */}
        {!error && (messages || []).map((m: any) => (
          <div key={m.id} className="mb-4 whitespace-pre-wrap">
            <span className="font-bold opacity-70">
              {m.role === 'user' ? 'USER > ' : 'ROBERT > '}
            </span>
            {m.content}
            {m.toolInvocations?.map((toolInvocation: any) => {
              const toolCallId = toolInvocation.toolCallId;
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

      <form onSubmit={handleSafeSubmit} className="flex gap-2"> 
        <span className="flex items-center text-green-500">&gt;</span>
        <input
          className="flex-1 bg-black border border-green-800 text-green-500 p-2 focus:outline-none focus:border-green-500 rounded"
          value={input || ''}
          placeholder="Enter command..."
          onChange={handleInputChange}
          autoFocus
          disabled={!!error}
        />
        <button
          type="submit"
          className="bg-green-900 text-black px-4 py-2 hover:bg-green-700 font-bold rounded"
          disabled={status === 'streaming' || !!error}
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
