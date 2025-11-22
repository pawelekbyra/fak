"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Loader2, MoreHorizontal, Trash, Flag, Smile } from 'lucide-react';
import Image from 'next/image';
import Ably from 'ably';
import { ably } from '@/lib/ably-client';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { z } from 'zod';
import { CommentWithRelations } from '@/lib/dto';
import { CommentSchema } from '@/lib/validators';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR_URL } from '@/lib/constants';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';

interface CommentItemProps {
  comment: CommentWithRelations;
  onLike: (id: string) => void;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReport: (id: string) => void;
  onAvatarClick: (userId: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  lang: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReplySubmit, onDelete, onReport, onAvatarClick, currentUserId, isReply = false, lang }) => {
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

  const author = comment.author;

  const dateLocale = lang === 'pl' ? pl : enUS;
  const formattedTime = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale });
  const fullDate = new Date(comment.createdAt).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US');

  // Render text with hashtags and mentions
  const renderText = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return <span key={index} className="text-blue-400 font-semibold">{part}</span>;
      }
      if (part.startsWith('@')) {
        return <span key={index} className="text-pink-400 font-semibold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-3 ${isReply ? 'ml-8' : ''} group`}
    >
      <div
        onClick={() => onAvatarClick(author.id)}
        className="cursor-pointer"
      >
          <Image
            src={author.avatar || DEFAULT_AVATAR_URL}
            alt={t('userAvatar', { user: author.displayName || 'User' })}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full mt-1 hover:opacity-80 transition-opacity"
          />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                <p
                    className="text-xs font-bold text-white/80 cursor-pointer hover:underline"
                    onClick={() => onAvatarClick(author.id)}
                >
                    {author.displayName || author.username || 'User'}
                </p>
                <Tooltip.Provider delayDuration={300}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="text-[10px] text-white/40 cursor-default hover:text-white/60 transition-colors">{formattedTime}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-[60]" sideOffset={5}>
                        {fullDate}
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
            </div>

             <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="min-w-[150px] bg-gray-800 rounded-md p-1 shadow-xl z-[60] border border-white/10" align="end">
                    {currentUserId === comment.authorId ? (
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:bg-white/10 rounded cursor-pointer outline-none"
                        onSelect={() => onDelete(comment.id)}
                      >
                        <Trash size={14} />
                        {t('delete') || 'Usuń'}
                      </DropdownMenu.Item>
                    ) : (
                      <DropdownMenu.Item
                         className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-white/10 rounded cursor-pointer outline-none"
                         onSelect={() => onReport(comment.id)}
                      >
                        <Flag size={14} />
                        {t('report') || 'Zgłoś'}
                      </DropdownMenu.Item>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
             </DropdownMenu.Root>
        </div>

        <p className="text-sm text-white whitespace-pre-wrap break-words">{renderText(comment.text)}</p>
        <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
          <button onClick={() => onLike(comment.id)} className="flex items-center gap-1 hover:text-white transition-colors">
            <Heart size={14} className={isLiked ? 'text-red-500 fill-current' : ''} />
            {comment.likedBy.length > 0 && <span>{comment.likedBy.length}</span>}
          </button>
          {!isReply && (
            <button onClick={handleReplyClick} className="flex items-center gap-1 hover:text-white transition-colors">
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
              onDelete={onDelete}
              onReport={onReport}
              onAvatarClick={onAvatarClick}
              currentUserId={currentUserId}
              isReply={true}
              lang={lang}
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
  const { t, lang } = useTranslation();
  const { user } = useUser();
  const { setActiveModal, openPatronProfileModal } = useStore();
  const { addToast } = useToast();
  const [comments, setComments] = useState<CommentWithRelations[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  const loadComments = useCallback(async (cursor?: string) => {
      if (!slideId) return;

      const isInitial = !cursor;
      if (isInitial) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
          const params = new URLSearchParams({ slideId, limit: '20' });
          if (cursor) params.append('cursor', cursor);

          const res = await fetch(`/api/comments?${params.toString()}`);
          if (!res.ok) throw new Error('Failed to fetch comments');

          const data = await res.json();
          if (data.success) {
            const parsedComments = z.array(CommentSchema).parse(data.comments);
            const commentMap = new Map<string, CommentWithRelations>(parsedComments.map((c: any) => [c.id, { ...c, author: c.author || c.user, replies: [] }]));
            const rootComments: CommentWithRelations[] = [];

            for (const rawComment of parsedComments as any[]) {
               const comment = commentMap.get(rawComment.id)!;
               // If it's a reply and we have its parent in this batch, append it
               // Note: This logic assumes replies come in the same batch or we only handle nested structure if fetch returns it that way.
               // Current backend structure fetches replies joined to comments, so `replies` field is already populated by Prisma include,
               // but the DTO flattening logic in `getComments` might need attention if we rely on `parentId` purely.
               // Update: getComments in db-postgres returns nested `replies` array.
               // So we just need to take the top-level comments (where parentId is null).
               // Prisma query filters `where: { parentId: null }` so we only get roots.
               // So simply using parsedComments is enough, they are roots.
               rootComments.push(comment);
            }

            if (isInitial) {
                setComments(rootComments);
            } else {
                setComments(prev => [...prev, ...rootComments]);
            }
            setNextCursor(data.nextCursor);
          } else {
            throw new Error(data.message || 'Failed to fetch comments');
          }
      } catch (err: any) {
          console.error("Fetch Error:", err);
          if (isInitial) setError(err.message || 'Invalid data received');
      } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
      }
  }, [slideId]);

  useEffect(() => {
    if (isOpen && slideId) {
      setComments([]);
      setNextCursor(null);
      loadComments();

      const channel = ably.channels.get(`comments:${slideId}`);
      const onNewComment = (message: Ably.Message) => {
        const data = message.data as any;
        const mappedComment: CommentWithRelations = {
            ...data,
            author: data.author || data.user,
            likedBy: data.likedBy || [],
            replies: []
        };
        // Avoid adding duplicate if it was already fetched or added optimistically (though fetch shouldn't race this usually)
        addCommentOptimistically(mappedComment);
      };

      channel.subscribe('new-comment', onNewComment);

      return () => {
        channel.unsubscribe('new-comment', onNewComment);
      };
    }
  }, [isOpen, slideId, loadComments]);

  const handleLoadMore = () => {
      if (nextCursor) {
          loadComments(nextCursor);
      }
  };

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
    // If it's a new real-time comment or own comment, we verify uniqueness before adding to avoid dups from fetch + socket
    setComments(prev => {
      const exists = prev.some(c => c.id === newComment.id);
      if (exists) return prev; // Don't add if already there (e.g. loaded from cursor or own optimistic)

      if ((newComment as any).parentId) {
        const newComments = [...prev];
        const addReply = (comment: CommentWithRelations): CommentWithRelations => {
          if (comment.id === (newComment as any).parentId) {
            // Check if reply exists
            const replyExists = comment.replies?.some(r => r.id === newComment.id);
            if (replyExists) return comment;
            return { ...comment, replies: [...(comment.replies || []), newComment] }; // Append replies at end usually
          }
          if (comment.replies) {
            return { ...comment, replies: comment.replies.map(addReply) };
          }
          return comment;
        };
        return newComments.map(addReply);
      } else {
        // New root comments go to top
        return [newComment, ...prev];
      }
    });
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

    const tempId = `temp-${Date.now()}`;
    const newReply: CommentWithRelations = {
      id: tempId,
      text,
        imageUrl: null,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
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
      parentId,
    };
    // Manually add optimistic reply since addCommentOptimistically has duplication checks that might conflict with temp IDs or logic
    setComments(prev => {
        const addReply = (comment: CommentWithRelations): CommentWithRelations => {
          if (comment.id === parentId) {
            return { ...comment, replies: [...(comment.replies || []), newReply] };
          }
          if (comment.replies) {
            return { ...comment, replies: comment.replies.map(addReply) };
          }
          return comment;
        };
        return prev.map(addReply);
    });

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

      const realComment = {
          ...data.comment,
          author: data.comment.author || data.comment.user
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
      imageUrl: null,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
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

    // Optimistic add
    setComments(prev => [newCommentData, ...prev]);

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

  const handleDelete = async (commentId: string) => {
      if (!confirm(t('deleteConfirmation') || 'Are you sure?')) return;
      removeCommentOptimistically(commentId);
      try {
          const res = await fetch(`/api/comments`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ commentId }),
          });
           if (!res.ok) {
              throw new Error('Failed to delete');
           }
      } catch (error) {
           // Revert (fetch again or undo op logic needed, but for now simple alert)
           addToast(t('deleteError') || 'Failed to delete', 'error');
      }
  };

  const handleReport = (commentId: string) => {
      console.log('Reporting comment:', commentId);
      addToast(t('reportSubmitted') || 'Report submitted', 'success');
  }

  const renderContent = () => {
    if (isLoading && comments.length === 0) {
      return (
        <div className="flex-1 p-4 space-y-4">
           {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                 <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                 <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[30%] bg-white/10" />
                    <Skeleton className="h-4 w-[80%] bg-white/10" />
                 </div>
              </div>
           ))}
        </div>
      );
    }
    if (error && comments.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-center text-red-400 p-4">
          {error}
        </div>
      );
    }
    if (comments.length === 0 && !isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-center text-white/60 p-4">
                {t('noCommentsYet')}
            </div>
        );
    }
    return (
      <div className="p-4 custom-scrollbar">
        <AnimatePresence>
          <motion.div layout className="space-y-4">
            {comments.map((comment: CommentWithRelations) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLike}
                onReplySubmit={handleReplySubmit}
                onDelete={handleDelete}
                onReport={handleReport}
                onAvatarClick={openPatronProfileModal}
                currentUserId={user?.id}
                lang={lang}
              />
            ))}
            {nextCursor && (
                 <div className="flex justify-center pt-2 pb-4">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="text-sm text-pink-400 hover:text-pink-300 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoadingMore && <Loader2 className="animate-spin h-3 w-3" />}
                        {t('loadMore') || 'Load More'}
                    </button>
                 </div>
            )}
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
            {/* Header - Fixed height */}
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{t('commentsTitle', { count: (comments.length || initialCommentsCount).toString() })}</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content - Takes remaining space */}
            <div className="flex-1 overflow-y-auto min-h-0">
               {renderContent()}
            </div>

            {/* Footer - Sticky at bottom */}
            <div className="flex-shrink-0 p-2 border-t border-white/10 bg-black/50 pb-[env(safe-area-inset-bottom)] md:pb-2 z-10">
            {user ? (
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  {user.avatar && <Image src={user.avatar} alt={t('yourAvatar')} width={32} height={32} className="w-8 h-8 rounded-full mb-1" />}
                  <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('addCommentPlaceholder')}
                        className="w-full px-4 py-2 bg-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm resize-none min-h-[40px] max-h-[120px] pr-10"
                        disabled={isSubmitting}
                        rows={1}
                      />
                      <button type="button" className="absolute right-2 bottom-2 text-white/40 hover:text-white" title="Emoji">
                          <Smile size={20} />
                      </button>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 mb-1 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[70px] transition-colors"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendButton')}
                  </button>
                </form>
            ) : (
                <div className="flex justify-center p-2">
                    <button
                        onClick={() => setActiveModal('login')}
                        className="w-full py-3 bg-white/10 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/20 hover:text-white transition-colors border border-white/5"
                    >
                        Zaloguj się, aby skomentować
                    </button>
                </div>
            )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
