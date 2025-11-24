'use client';

import { useChat } from '@ai-sdk/react';

export default function RobertPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/robert',
    onError: (error: any) => console.error("Chat Error:", error),
  } as any) as any;

  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono p-4 overflow-hidden relative z-[100]">
      <div className="flex-1 overflow-y-auto mb-4 border border-green-900 p-4 rounded custom-scrollbar">
        {/* WYŚWIETLANIE BŁĘDU ZAMIAST TREŚCI */}
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
        {error && (
          <div className="text-red-500 border border-red-500 p-2 mt-2 rounded">
             ERROR: {error.message}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          console.log("ROBERT DEBUG: Attempting form submission.");
          handleSubmit(e);
        }}
        className="flex gap-2"
      >
        <span className="flex items-center text-green-500">&gt;</span>
        <input
          className="flex-1 bg-black border border-green-800 text-green-500 p-2 focus:outline-none focus:border-green-500 rounded"
          value={input}
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
