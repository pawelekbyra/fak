import { User } from '@/lib/db.interfaces';

export interface Comment {
  id: string;
  entityId: string;
  userId: string;
  parentId: string | null;
  content: string | null;
  gif: any | null; // Define a proper GIF type if needed
  repliesCount: number;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user: Partial<User>;
  upvotesCount: number;
  downvotesCount: number;
  currentUserVote: 'upvote' | 'downvote' | null;
  new?: boolean; // For newly added comments in the UI
}

export type EntityCommentsTree = Record<
  string,
  {
    comment: Comment;
    replies: Record<string, Comment>;
    new?: boolean;
  }
>;
