import { Prisma } from '@prisma/client';

// --- Base Types from Prisma (Extended) ---

// Public User Profile (stripped of sensitive data)
export type PublicUser = Pick<Prisma.UserGetPayload<{}>, 'id' | 'username' | 'displayName' | 'avatar' | 'role'>;

// Comment with Relations (matching what the frontend needs)
// Includes author, nested replies (recursive), and like count/status
export type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        displayName: true;
        avatar: true;
        role: true; // Added role for badge/border logic
      };
    };
  };
}> & {
  likedBy: string[]; // IDs of users who liked this comment
  replies?: CommentWithRelations[]; // Recursive structure for client-side state
  parentAuthorUsername?: string | null; // For displaying "@username" in nested replies
  parentAuthorId?: string | null; // For linking to the parent author's profile
  _count?: {
    likes: number;
    replies?: number; // Add reply count
  };
};

// --- Slide Types (Consolidating Frontend & Backend) ---

export interface BaseSlideDTO {
  id: string;
  // Core data
  userId: string;
  username: string;
  avatar: string;

  // Metadata
  createdAt: string; // ISO string from JSON

  // Social
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;

  // Settings
  accessLevel: 'PUBLIC' | 'SECRET_PATRON' | 'SECRET_PWA';
}

export interface HtmlSlideDataDTO {
  htmlContent: string;
}

export interface HtmlSlideDTO extends BaseSlideDTO {
  type: 'html';
  data: HtmlSlideDataDTO;
}

export interface VideoSlideDataDTO {
  mp4Url: string;
  hlsUrl: string | null;
  poster: string;
  title: string;
  description: string;
}

export interface VideoSlideDTO extends BaseSlideDTO {
  type: 'video';
  data: VideoSlideDataDTO;
}

export type SlideDTO = HtmlSlideDTO | VideoSlideDTO;

// --- API Responses ---

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string>;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  nextCursor?: string | null;
}
