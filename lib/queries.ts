
import { z } from 'zod';
import { CommentSchema } from '@/lib/validators';
import { AuthorProfile } from '@/types';

export const fetchComments = async ({ pageParam = '', slideId, sortBy = 'latest' }: { pageParam?: string; slideId: string, sortBy?: 'latest' | 'top' }) => {
  const params = new URLSearchParams({ slideId, limit: '20', sortBy });
  if (pageParam) params.append('cursor', pageParam);

  const res = await fetch(`/api/comments?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch comments');

  const data = await res.json();
  if (data.success) {
    const parsedComments = z.array(CommentSchema).parse(data.comments);
    return {
      comments: parsedComments,
      nextCursor: data.nextCursor,
    };
  }
  throw new Error(data.message || 'Failed to fetch comments');
};

export const fetchAuthorProfile = async (authorId: string): Promise<AuthorProfile> => {
    const res = await fetch(`/api/author/${authorId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch author profile');
    }
    return res.json();
};
