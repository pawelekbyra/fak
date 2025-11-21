import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentWithRelations } from '@/lib/dto';
import { CommentSchema } from '@/lib/validators';
import { z } from 'zod';

export const useComments = (slideId: string) => {
  const queryClient = useQueryClient();

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?slideId=${slideId}&limit=50`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch comments');

    // Validate and Parse
    const parsedComments = z.array(CommentSchema).parse(data.comments);

    // Add missing DTO fields if necessary (like likedBy from likes)
    // The API mostly returns relations, but we ensure structure
    return parsedComments.map((c: any) => ({
      ...c,
      author: c.author || c.user,
      replies: c.replies || [],
      likedBy: c.likedBy || []
    })) as CommentWithRelations[];
  };

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', slideId],
    queryFn: fetchComments,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!slideId,
  });

  return {
    comments: comments || [],
    isLoading,
    error,
    queryClient
  };
};
