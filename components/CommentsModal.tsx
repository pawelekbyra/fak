"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
import { UserBadge } from './UserBadge';
import { fetchComments } from '@/lib/queries';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';

import { fetchAuthorProfile } from '@/lib/queries';

interface CommentItemProps {
  comment: CommentWithRelations;
  onLike: (id: string) => void;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReport: (id: string) => void;
  onAvatarClick: (userId: string) => void;
  onPrefetchUser: (userId: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  lang: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReplySubmit, onDelete, onReport, onAvatarClick, onPrefetchUser, currentUserId, isReply = false, lang }) => {
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
        className="cursor-pointer flex-shrink-0 flex flex-col items-center"
      >
          <div className="relative w-8 h-8 mt-1">
            <Image
              src={author.avatar || DEFAULT_AVATAR_URL}
              alt={t('userAvatar', { user: author.displayName || 'User' })}
              width={32}
              height={32}
              className={`w-full h-full rounded-full object-cover hover:opacity-80 transition-opacity border border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]`}
            />
          </div>
          <div className="mt-1 flex justify-center">
             <UserBadge role={author.role} className="scale-[0.7] transform origin-top" />
          </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 pt-1">
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
                {currentUserId === comment.authorId && (
                    <DropdownMenu.Trigger asChild>
                      <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                )}
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
                onPrefetchUser={onPrefetchUser}
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
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['comments', slideId],
    queryFn: ({ pageParam }) => fetchComments({ pageParam, slideId: slideId! }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isOpen && !!slideId,
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  useEffect(() => {
    if (!isOpen || !slideId) return;

    const channel = ably.channels.get(`comments:${slideId}`);
    const onNewComment = (message: Ably.Message) => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    };

    channel.subscribe('new-comment', onNewComment);

    return () => {
      channel.unsubscribe('new-comment', onNewComment);
    };
  }, [isOpen, slideId, queryClient]);


  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => fetch('/api/comments/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    }).then(res => {
        if (!res.ok) {
            return res.json().then(data => { throw new Error(data.message || 'Failed to like comment') });
        }
        return res.json();
    }),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', slideId] });
      const previousComments = queryClient.getQueryData(['comments', slideId]);
      queryClient.setQueryData(['comments', slideId], (oldData: any) => {
        const newData = { ...oldData };
        newData.pages = newData.pages.map((page: any) => ({
          ...page,
          comments: page.comments.map((comment: CommentWithRelations) => {
            if (comment.id === commentId) {
              const isLiked = comment.likedBy.includes(user!.id);
              const newLikedBy = isLiked
                ? comment.likedBy.filter((id) => id !== user!.id)
                : [...comment.likedBy, user!.id];
              return { ...comment, likedBy: newLikedBy };
            }
            return comment;
          }),
        }));
        return newData;
      });
      return { previousComments };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', slideId], context.previousComments);
      }
      addToast(t(err.message) || 'Action failed', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, text }: { parentId: string; text: string }) => fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideId, text, parentId }),
    }).then(res => {
        if (!res.ok) {
            return res.json().then(data => { throw new Error(data.message || 'Failed to post comment') });
        }
        return res.json();
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
    onError: (err: Error) => {
        addToast(t(err.message) || 'Failed to post comment', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    }).then(res => {
        if (!res.ok) {
            return res.json().then(data => { throw new Error(data.message || 'Failed to delete comment') });
        }
        return res.json();
    }),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', slideId] });
      const previousComments = queryClient.getQueryData(['comments', slideId]);
      queryClient.setQueryData(['comments', slideId], (oldData: any) => {
        const newData = { ...oldData };
        newData.pages = newData.pages.map((page: any) => ({
          ...page,
          comments: page.comments.filter((comment: CommentWithRelations) => comment.id !== commentId),
        }));
        return newData;
      });
      return { previousComments };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', slideId], context.previousComments);
      }
      addToast(t(err.message) || 'Failed to delete comment', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const handleLike = (commentId: string) => {
    if (!user) return;
    likeMutation.mutate(commentId);
  };

  const handleReplySubmit = async (parentId: string, text: string) => {
    if (!user) return;
    await replyMutation.mutateAsync({ parentId, text });
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t('deleteConfirmation') || 'Are you sure?')) return;
    await deleteMutation.mutateAsync(commentId);
  };

  const handleReport = (commentId: string) => {
    console.log('Reporting comment:', commentId);
    addToast(t('reportSubmitted') || 'Report submitted', 'success');
  };

  const handlePrefetchUser = (userId: string) => {
      queryClient.prefetchQuery({
          queryKey: ['author', userId],
          queryFn: () => fetchAuthorProfile(userId),
          staleTime: 1000 * 60 * 5, // 5 minutes
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment || !user || !slideId) return;

    // We'll use a mutation for this as well for consistency
    await replyMutation.mutateAsync({ parentId: '', text: trimmedComment });
    setNewComment('');
  };


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
          <p>{t('commentsError') || 'Could not load comments.'}</p>
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
            {comments.map((c) => {
              const comment = c as unknown as CommentWithRelations;
              if (!comment.author) return null;
              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLike}
                  onReplySubmit={handleReplySubmit}
                  onDelete={handleDelete}
                  onReport={handleReport}
                  onAvatarClick={openPatronProfileModal}
                  onPrefetchUser={handlePrefetchUser}
                  currentUserId={user?.id}
                  lang={lang}
                />
              );
            })}
            {hasNextPage && (
                 <div className="flex justify-center pt-2 pb-4">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-sm text-pink-400 hover:text-pink-300 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isFetchingNextPage && <Loader2 className="animate-spin h-3 w-3" />}
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
          className="absolute inset-0 bg-black/60 z-50 flex items-end"
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

            <div className="flex-1 overflow-y-auto min-h-0">
               {renderContent()}
            </div>

            <div className="flex-shrink-0 p-2 border-t border-white/10 bg-black/50 pb-[env(safe-area-inset-bottom)] md:pb-2 z-10">
            {user ? (
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full mb-1">
                      <Image
                        src={user.avatar || DEFAULT_AVATAR_URL}
                        alt={t('yourAvatar')}
                        width={32}
                        height={32}
                        className={`w-full h-full rounded-full object-cover`}
                      />
                  </div>
                  <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('addCommentPlaceholder')}
                        className="w-full px-4 py-2 bg-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm resize-none min-h-[40px] max-h-[120px] pr-10"
                        disabled={replyMutation.isPending}
                        rows={1}
                      />
                      <button type="button" className="absolute right-2 bottom-2 text-white/40 hover:text-white" title="Emoji">
                          <Smile size={20} />
                      </button>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 mb-1 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[70px] transition-colors"
                    disabled={!newComment.trim() || replyMutation.isPending}
                  >
                    {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendButton')}
                  </button>
                </form>
            ) : (
                <div className="flex justify-center p-2">
                    <button
                        onClick={() => {
                            setActiveModal('login');
                            onClose();
                        }}
                        className="w-full py-3 bg-white/10 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/20 hover:text-white transition-colors border border-white/5 active:scale-[0.98] transition-transform"
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
