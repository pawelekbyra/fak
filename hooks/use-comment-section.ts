import { useState, useEffect, useCallback } from 'react';
import { Comment, EntityCommentsTree } from '@/lib/comments/types';
import { buildCommentsTree } from '@/lib/comments/tree';
import { addComment, deleteComment, updateComment, toggleCommentVote } from '@/lib/comment-actions';
import { User } from '@/lib/db.interfaces';

export interface UseCommentSectionProps {
  entityId: string;
  initialComments: Comment[];
  currentUser: User | null;
}

export function useCommentSection({ entityId, initialComments, currentUser }: UseCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentsTree, setCommentsTree] = useState<EntityCommentsTree>(() => buildCommentsTree(initialComments));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repliedToComment, setRepliedToComment] = useState<Partial<Comment> | null>(null);

  useEffect(() => {
    setCommentsTree(buildCommentsTree(comments));
  }, [comments]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, comment } = event.data;
      if (type === 'new-comment' && comment.entityId === entityId) {
        setComments(prev => [...prev, comment]);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [entityId]);

  const handleAddComment = useCallback(async (formData: FormData) => {
    if (!currentUser) {
      setError('You must be logged in to comment.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const content = formData.get('content') as string;
    const parentId = formData.get('parentId') as string | null;

    const optimisticComment: Comment = {
      id: tempId,
      entityId,
      userId: currentUser.id,
      content,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      user: currentUser,
      upvotesCount: 0,
      downvotesCount: 0,
      repliesCount: 0,
      metadata: null,
      gif: null,
      currentUserVote: null,
      isSending: true,
    };

    setComments(prev => [...prev, optimisticComment]);

    const result = await addComment(formData);

    if (result.success && result.comment) {
      setComments(prev => prev.map(c => c.id === tempId ? result.comment as Comment : c));
    } else {
      setError(result.message || 'Failed to add comment.');
      setComments(prev => prev.filter(c => c.id !== tempId));
    }
  }, [currentUser, entityId]);

  const handleDeleteComment = useCallback(async (formData: FormData) => {
    const commentId = formData.get('commentId') as string;
    setComments(prev => prev.filter(c => c.id !== commentId));
    const result = await deleteComment(formData);
    if (!result.success) {
      setError(result.message || 'Failed to delete comment.');
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
    // This part would also benefit from an optimistic update and real-time sync
    const result = await toggleCommentVote(formData);
    if (result.success) {
      // For a full implementation, the server should return the updated comment
      // and we would update it in the state here.
    } else {
      setError(result.message || 'Failed to vote.');
    }
  }, []);

  return {
    comments,
    commentsTree,
    loading,
    error,
    repliedToComment,
    setRepliedToComment,
    addComment: handleAddComment,
    deleteComment: handleDeleteComment,
    updateComment: handleUpdateComment,
    toggleVote: handleToggleVote,
  };
}
