"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Ably from 'ably';
import { ably } from '@/lib/ably-client';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { z } from 'zod';
import { CommentWithRelations } from '@/lib/dto';
import { CommentSchema } from '@/lib/validators';

interface CommentItemProps {
  comment: CommentWithRelations;
  onLike: (id: string) => void;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  currentUserId?: string;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReplySubmit, currentUserId, isReply = false }) => {
  const { t } = useTranslation();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { user } = useUser();
  const isLiked = currentUserId ? comment.likedBy.includes(currentUserId) : false;

  const handleReplyClick = () => {
    setIsReplying(!isReplying);
  };

  const handleLocalReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReplySubmit(comment.id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  // Fallback to 'user' if 'author' is missing (though DTO guarantees author)
  // We cast to any temporarily if we need to access legacy fields, but we should try to use author.
  const author = comment.author;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-3 ${isReply ? 'ml-8' : ''}`}
    >
      <Image src={author.avatar || '/avatars/default.png'} alt={t('userAvatar', { user: author.displayName || 'User' })} width={32} height={32} className="w-8 h-8 rounded-full mt-1" />
      <div className="flex-1">
        <p className="text-xs font-bold text-white/80">{author.displayName || author.username || 'User'}</p>
        <p className="text-sm text-white">{comment.text}</p>
        <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
          <button onClick={() => onLike(comment.id)} className="flex items-center gap-1">
            <Heart size={14} className={isLiked ? 'text-red-500 fill-current' : ''} />
            {comment.likedBy.length > 0 && <span>{comment.likedBy.length}</span>}
          </button>
          {!isReply && (
            <button onClick={handleReplyClick} className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{t('reply')}</span>
            </button>
          )}
        </div>
        {isReplying && user && (
          <form onSubmit={handleLocalReplySubmit} className="flex items-center gap-2 mt-2">
            {user.avatar && <Image src={user.avatar} alt={t('yourAvatar')} width={24} height={24} className="w-6 h-6 rounded-full" />}
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('addCommentPlaceholder')}
              className="flex-1 px-3 py-1 bg-white/10 text-white rounded-full focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs"
              autoFocus
            />
            <button type="submit" className="px-3 py-1 bg-pink-500 text-white rounded-full text-xs font-semibold disabled:opacity-50" disabled={!replyText.trim()}>
              {t('sendButton')}
            </button>
          </form>
        )}
        <div className="mt-2 space-y-3">
          {comment.replies?.map((reply: CommentWithRelations) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReplySubmit={onReplySubmit}
              currentUserId={currentUserId}
              isReply={true}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId?: string;
  initialCommentsCount: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, slideId, initialCommentsCount }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { addToast } = useToast();
  const [comments, setComments] = useState<CommentWithRelations[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && slideId) {
      const channel = ably.channels.get(`comments:${slideId}`);

      const onNewComment = (message: Ably.Message) => {
        // We need to ensure the incoming message matches our DTO structure
        // Ideally we should validate it too, but for now we cast it.
        const data = message.data as any;
        // Map incoming real-time data to DTO if needed, or assume server sends correct shape
        const mappedComment: CommentWithRelations = {
            ...data,
            author: data.author || data.user, // Fallback
            likedBy: data.likedBy || [],
            replies: []
        };
        addCommentOptimistically(mappedComment);
      };

      channel.subscribe('new-comment', onNewComment);

      setIsLoading(true);
      setError(null);
      fetch(`/api/comments?slideId=${slideId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch comments');
          }
          return res.json();
        })
        .then(data => {
          if (data.success) {
            // Runtime Validation using Zod
            const parsedComments = z.array(CommentSchema).parse(data.comments);

            // Transform/Nest comments
            // We need to cast parsedComments to any[] first because Zod output might be slightly different from Prisma types
            // depending on exact schema definition vs DTO type.
            // However, our DTO is defined based on Prisma, so it should align.

            const commentMap = new Map<string, CommentWithRelations>(parsedComments.map((c: any) => [c.id, { ...c, author: c.author || c.user, replies: [] }]));
            const rootComments: CommentWithRelations[] = [];

            // Use 'as any' loop or strict typing
            // The parser ensures structure.
            for (const rawComment of parsedComments as any[]) {
               // Ensure author is set (Schema allows it to be optional or user, but DTO needs author)
               const comment = commentMap.get(rawComment.id)!;

               if (rawComment.parentId && commentMap.has(rawComment.parentId)) {
                const parentComment = commentMap.get(rawComment.parentId);
                if (parentComment) {
                  if (!parentComment.replies) parentComment.replies = [];
                  parentComment.replies.push(comment);
                }
              } else {
                rootComments.push(comment);
              }
            }
            setComments(rootComments);
          } else {
            throw new Error(data.message || 'Failed to fetch comments');
          }
        })
        .catch(err => {
          console.error("Validation or Fetch Error:", err);
          setError(err.message || 'Invalid data received');
        })
        .finally(() => {
          setIsLoading(false);
        });

      return () => {
        channel.unsubscribe('new-comment', onNewComment);
      };
    }
  }, [isOpen, slideId]);

  const handleLike = async (commentId: string) => {
    if (!user) {
      return;
    }

    const originalComments = [...comments];
    const newComments = comments.map(comment => {
      if (comment.id === commentId) {
        const isLiked = comment.likedBy.includes(user.id);
        const newLikedBy = isLiked
          ? comment.likedBy.filter((id: string) => id !== user.id)
          : [...comment.likedBy, user.id];
        return { ...comment, likedBy: newLikedBy };
      }
      return comment;
    });

    setComments(newComments);

    try {
      const res = await fetch(`/api/comments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (!res.ok) {
        setComments(originalComments);
        console.error('Failed to like comment');
      }
    } catch (error) {
      setComments(originalComments);
      console.error('An error occurred while liking the comment', error);
    }
  };

  const addCommentOptimistically = (newComment: CommentWithRelations) => {
    // Note: newComment must have author property populated
    if ((newComment as any).parentId) { // Cast because parentId isn't on CommentWithRelations base type strictly in some versions if not added
      setComments(prev => {
        const newComments = [...prev];
        const addReply = (comment: CommentWithRelations): CommentWithRelations => {
          if (comment.id === (newComment as any).parentId) {
            return { ...comment, replies: [newComment, ...(comment.replies || [])] };
          }
          if (comment.replies) {
            return { ...comment, replies: comment.replies.map(addReply) };
          }
          return comment;
        };
        return newComments.map(addReply);
      });
    } else {
      setComments(prev => [newComment, ...prev]);
    }
  };

  const removeCommentOptimistically = (commentId: string) => {
    setComments(prev => {
        const filterReplies = (comments: CommentWithRelations[]): CommentWithRelations[] => {
            return comments.filter(c => c.id !== commentId).map(c => {
                if (c.replies) {
                    return { ...c, replies: filterReplies(c.replies) };
                }
                return c;
            });
        };
        return filterReplies(prev);
    });
  };

  const replaceTempComment = (tempId: string, realComment: CommentWithRelations) => {
    setComments(prev => {
        const replaceInReplies = (comments: CommentWithRelations[]): CommentWithRelations[] => {
            return comments.map(c => {
                if (c.id === tempId) {
                    return realComment;
                }
                if (c.replies) {
                    return { ...c, replies: replaceInReplies(c.replies) };
                }
                return c;
            });
        };
        return replaceInReplies(prev);
    });
  };

  const handleReplySubmit = async (parentId: string, text: string) => {
    if (!text.trim() || !user || !slideId) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newReply: CommentWithRelations = {
      id: tempId,
      text,
      createdAt: new Date(), // DTO expects Date object (or we adjust DTO to allow string)
      updatedAt: new Date(),
      authorId: user.id,
      slideId: slideId,
      likedBy: [],
      author: {
          id: user.id,
          displayName: user.displayName || user.username || 'User',
          avatar: user.avatar || '',
          username: user.username || null
      },
      replies: [],
      // @ts-ignore - parentId is often not in the main DTO but used in logic
      parentId,
    };
    addCommentOptimistically(newReply);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId, text, parentId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.success) {
        const errorMessage = data?.message ? t(data.message) : t('commentError');
        throw new Error(errorMessage);
      }

      // The API returns 'comment' which matches our Schema/DTO mostly.
      // Ensure author is present
      const realComment = {
          ...data.comment,
          author: data.comment.author || data.comment.user // Handle backend variation
      };

      replaceTempComment(tempId, realComment);

    } catch (err: any) {
      const msg = err.message || t('commentError');
      addToast(msg, 'error');
      removeCommentOptimistically(tempId);
      console.error("Failed to post reply:", msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment || !user || !slideId) return;

    setIsSubmitting(true);
    setError(null);
    setNewComment('');

    const tempId = `temp-${Date.now()}`;
    const newCommentData: CommentWithRelations = {
      id: tempId,
      text: trimmedComment,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: user.id,
      slideId: slideId,
      likedBy: [],
      author: {
          id: user.id,
          displayName: user.displayName || user.username || 'User',
          avatar: user.avatar || '',
          username: user.username || null
      },
      replies: [],
      // @ts-ignore
      parentId: null,
    };
    addCommentOptimistically(newCommentData);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId, text: trimmedComment }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.success) {
         const errorMessage = data?.message ? t(data.message) : t('commentError');
         throw new Error(errorMessage);
      }

      const realComment = {
          ...data.comment,
          author: data.comment.author || data.comment.user
      };

      replaceTempComment(tempId, realComment);
    } catch (err: any) {
      removeCommentOptimistically(tempId);
      const msg = err.message || t('commentError');
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center text-center text-red-400 p-4">
          {error}
        </div>
      );
    }
    if (comments.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-center text-white/60 p-4">
                {t('noCommentsYet')}
            </div>
        );
    }
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          <motion.div layout className="space-y-4">
            {comments.map((comment: CommentWithRelations) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLike}
                onReplySubmit={handleReplySubmit}
                currentUserId={user?.id}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full bg-black/80 backdrop-blur-md rounded-t-2xl flex flex-col border-t border-white/10"
            style={{ height: '75dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{t('commentsTitle', { count: (comments.length || initialCommentsCount).toString() })}</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {renderContent()}

            {user && (
              <div className="flex-shrink-0 p-2 border-t border-white/10 bg-black/50">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  {user.avatar && <Image src={user.avatar} alt={t('yourAvatar')} width={32} height={32} className="w-8 h-8 rounded-full" />}
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('addCommentPlaceholder')}
                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[70px] transition-colors"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendButton')}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
