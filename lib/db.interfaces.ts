// This file contains the core data interfaces used in lib/db.ts
// It is separated to avoid circular dependencies when types are needed in other files.

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  displayName?: string;
  avatar?: string;
  sessionVersion?: number;
  // Standardizing role to lowercase as per Prisma schema default
  // But application logic might have been using Uppercase in some places.
  // We will allow both temporarily or stick to lowercase.
  // Prisma schema says @default("user").
  role?: 'user' | 'admin' | 'patron' | 'author';
  isFirstLogin?: boolean;
  emailConsent?: boolean;
  emailLanguage?: string | null;
}

export interface Comment {
  id: string;
  slideId: string; // Changed from videoId
  userId: string;
  text: string;
  createdAt: number; // Unix timestamp
  likedBy: string[]; // Array of userIds
  parentId?: string | null;
  replies?: Comment[];
  // This can be hydrated with user info
  user?: {
    displayName: string;
    avatar: string;
  }
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  text: string;
  link: string | null; // e.g., /slide/slide_id?comment=comment_id
  createdAt: number | Date;
  read: boolean;
  fromUserId?: string | null;
  fromUser?: {
    id: string;
    displayName: string;
    avatar: string;
  } | null;
}
