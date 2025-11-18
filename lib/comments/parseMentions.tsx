import React from 'react';

const MENTION_REGEX = /@(\w+)/g;

export function parseMentions(content: string) {
  if (!content) return null;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    // Add the text before the mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add the mention component
    const username = match[1];
    parts.push(
      <span key={match.index} className="text-pink-400 font-semibold">
        @{username}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add the remaining text after the last mention
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>);
}
