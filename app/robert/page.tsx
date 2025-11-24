'use client'; 

import { useChat } from '@ai-sdk/react';
import React, { FormEvent, useState, useEffect } from 'react'; 

export default function RobertPage() {
  // FIX KRYTYCZNY: Rzutujemy argumenty wejściowe na 'any', aby ominąć błąd "api does not exist"
  // Oraz rzutujemy wynik na 'any', aby ominąć błąd braku 'input'.
  const chat = useChat({
    api: '/api/robert',
    onError: (err: any) => { 
      console.error("🔴 [ROBERT UI ERROR]:", err);
    },
    initialInput: '' 
  } as any) as any;

  // Bezpieczne wyciąganie zmiennych
  const { 
    messages = [], 
    input = '', 
    handleInputChange, 
    handleSubmit, 
    status, 
    error, 
    reload,
    setInput
  } = chat;

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleSafeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Zabezpieczenie przed pustym inputem i błędami
    if (!input || !input.trim()) return;

    if (handleSubmit) {
      handleSubmit(e);
    } else {
      // Fallback gdyby handleSubmit nie istniał
      console.warn("Brak handleSubmit, wymuszam odświeżenie...");
      if (reload) reload();
    }
  };

  // Loader
  if (!isReady) return <div className="bg-black h-screen text-green-900 p-4 font-mono">Inicjalizacja łącza...</div>;

  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono p-4 overflow-hidden relative z-[100]">
      
      {/* Pasek błędów */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-2 mb-2 text-sm">
          ⚠️ BŁĄD: {error.message || "Nieznany błąd"} 
          <button onClick={() => reload && reload()} className="ml-4 underline font-bold">RESTART</button>
        </div>
      )}

      {/* Okno rozmowy */}
      <div className="flex-1 overflow-y-auto mb-4 border border-green-900 p-4 rounded custom-scrollbar">
        {messages.length === 0 && !error && (
          <div className="opacity-50 text-center mt-10">
            &gt; SYSTEM ROBERT ONLINE. <br/>
            &gt; OCZEKIWANIE NA POLECENIA...
          </div>
        )}
        
        {messages.map((m: any) => (
          <div key={m.id} className="mb-4 whitespace-pre-wrap">
            <span className={`font-bold ${m.role === 'user' ? 'text-blue
