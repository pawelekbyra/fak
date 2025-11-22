"use client";

import React, { useMemo } from 'react';
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
  const sanitizedHtml = useMemo(() => {
    if (typeof window !== 'undefined' && data.htmlContent) {
      return DOMPurify.sanitize(data.htmlContent);
    }
    return '';
  }, [data.htmlContent]);

  return (
    <div className="h-full w-full relative bg-black overflow-y-auto">
      <div
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

export default HtmlContent;
