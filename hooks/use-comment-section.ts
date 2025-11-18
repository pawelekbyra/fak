import { useState, useEffect, useCallback } from 'react';
import { Comment, EntityCommentsTree } from '@/lib/comments/types';
import { buildCommentsTree } from '@/lib/comments/tree';
import { getCommentsByEntityId } from '@/lib/db'; // This will be replaced by a client-side fetcher or initial data
import { addComment, deleteComment, updateComment, toggleCommentVote } from '@/lib/comment-actions';

export interface UseCommentSectionProps {
  entityId: string;
  initialComments: Comment[];
  currentUser: { id: string; [key: string]: any } | null;
}

export function useCommentSection({ entityId, initialComments, currentUser }: UseCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentsTree, setCommentsTree] = useState<EntityCommentsTree>(() => buildCommentsTree(initialComments));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for UI interactions
  const [repliedToComment, setRepliedToComment] = useState<Partial<Comment> | null>(null);

  // Update tree whenever comments array changes
  useEffect(() => {
    setCommentsTree(buildCommentsTree(comments));
  }, [comments]);

  const handleAddComment = useCallback(async (formData: FormData) => {
    // Optimistic UI update can be implemented here
    const result = await addComment(formData);
    if (result.success && result.comment) {
      setComments(prev => [...prev, result.comment as Comment]);
    } else {
      setError(result.message || 'Failed to add comment.');
    }
  }, []);

  const handleDeleteComment = useCallback(async (formData: FormData) => {
    const commentId = formData.get('commentId') as string;
    // Optimistic UI update
    setComments(prev => prev.filter(c => c.id !== commentId));
    const result = await deleteComment(formData);
    if (!result.success) {
      setError(result.message || 'Failed to delete comment.');
      // Revert optimistic update if needed
      // For simplicity, we're not doing that here yet.
    }
  }, []);

  const handleUpdateComment = useCallback(async (formData: FormData) => {
    const result = await updateComment(formData);
    if (result.success && result.comment) {
      setComments(prev => prev.map(c => c.id === result.comment!.id ? result.comment as Comment : c));
    } else {
      setError(result.message || 'Failed to update comment.');
    }
  }, []);

  const handleToggleVote = useCallback(async (formData: FormData) => {
    const result = await toggleCommentVote(formData);
    if (result.success) {
      // Here you would update the specific comment's vote count
      // This requires fetching the comment again or getting updated counts from the server action
    } else {
      setError(result.message || 'Failed to vote.');
    }
  }, []);


  return {
    comments,
    commentsTree,
    loading,
    error,

    // UI state and handlers
    repliedToComment,
    setRepliedToComment,

    // Actions
    addComment: handleAddComment,
    deleteComment: handleDeleteComment,
    updateComment: handleUpdateComment,
    toggleVote: handleToggleVote,
  };
}
