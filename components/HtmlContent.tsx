"use client";

import React, { useState, useEffect } from 'react';
import { HtmlSlideDataDTO } from '@/lib/dto';
import DOMPurify from 'dompurify';

interface HtmlContentProps {
  data: HtmlSlideDataDTO;
  isActive: boolean;
}

const HtmlContent: React.FC<HtmlContentProps> = ({
  data,
  isActive,
}) => {
  // Startujemy z pustym ciągiem, aby uniknąć błędu hydratacji (serwer vs klient)
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    // Upewniamy się, że jesteśmy w oknie przeglądarki i mamy dane
    if (typeof window !== 'undefined' && data?.htmlContent) {
      try {
        // Czyścimy HTML tylko po stronie klienta
        const clean = DOMPurify.sanitize(data.htmlContent);
        setSanitizedHtml(clean);
      } catch (e) {
        console.error("DOMPurify error:", e);
        // W razie błędu biblioteki, nie wywalaj całej aplikacji, po prostu zostaw puste
        setSanitizedHtml(''); 
      }
    }
  }, [data?.htmlContent]);

  return (
    <div className="h-full w-full relative bg-black overflow-y-auto">
      <div
        className="h-full w-full bg-white text-black" // Dodano text-black dla pewności czytelności
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

export default HtmlContent;
