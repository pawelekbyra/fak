"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Loader2, MoreHorizontal, Trash, Flag, Smile, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { ably } from '@/lib/ably-client';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { CommentWithRelations } from '@/lib/dto';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { UserBadge } from './UserBadge';
import { fetchComments } from '@/lib/queries';
import { cn } from '@/lib/utils';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string | null;
  initialCommentsCount: number;
}

interface CommentItemProps {
  comment: CommentWithRelations;
  onLike: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onReport: (id: string) => void;
  onAvatarClick: (userId: string) => void;
  onStartReply: (comment: CommentWithRelations) => void;
  currentUserId?: string;
  lang: string;
  level?: number;
  slideId: string | null;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onDelete, onReport, onAvatarClick, onStartReply, currentUserId, lang, level = 0, slideId }) => {
  const { t } = useTranslation();
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);

  const {
    data: repliesData,
    fetchNextPage: fetchReplies,
    hasNextPage: hasMoreReplies,
    isLoading: isLoadingReplies,
  } = useInfiniteQuery({
    queryKey: ['comments', slideId, 'replies', comment.id],
    queryFn: ({ pageParam }) => fetch(`/api/comments/replies?parentId=${comment.id}&cursor=${pageParam || ''}`).then(res => res.json()),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: areRepliesVisible, // Only fetch when the accordion is open
  });

  const replies = repliesData?.pages.flatMap(page => page.replies) ?? [];

  const isLiked = currentUserId ? comment.likedBy.includes(currentUserId) : false;
  const likeCount = comment._count?.likes ?? comment.likedBy.length;
  const replyCount = comment._count?.replies ?? 0;

  const handleToggleReplies = () => {
    setAreRepliesVisible(prev => !prev);
  };

  const author = comment.author;
  const dateLocale = lang === 'pl' ? pl : enUS;
  const formattedTime = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale });

  const isL0 = level === 0;
  const isL1Plus = level >= 1;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-start gap-2 group", isL1Plus && "pl-8")}
    >
      <div
        onClick={() => onAvatarClick(author.id)}
        className="cursor-pointer flex-shrink-0"
      >
        <Image
          src={author.avatar || DEFAULT_AVATAR_URL}
          alt={t('userAvatar', { user: author.displayName || 'User' })}
          width={isL0 ? 36 : 28}
          height={isL0 ? 36 : 28}
          className="rounded-full object-cover mt-1"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-transparent rounded-lg">
           <p className="text-xs font-semibold text-[#A6A6A6] cursor-pointer hover:underline" onClick={() => onAvatarClick(author.id)}>
              @{author.displayName || author.username || 'User'}
            </p>
          <p className="text-[13px] text-white whitespace-pre-wrap break-words">
            {isL1Plus && comment.parentAuthorUsername && (
                <span
                  className="text-pink-400 font-semibold mr-1 cursor-pointer"
                  onClick={() => onAvatarClick(comment.parentAuthorId!)}
                >
                  @{comment.parentAuthorUsername}
                </span>
            )}
            {comment.text}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#808080] mt-1.5">
          <span>{formattedTime}</span>
          <button onClick={() => onStartReply(comment)} className="font-semibold hover:text-white transition-colors">
            {t('reply')}
          </button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[150px] bg-[#282828] rounded-md p-1 shadow-xl z-[60] border border-white/10" align="end">
                {currentUserId === comment.authorId ? (
                  <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-[#FF4D4D] hover:bg-white/10 rounded cursor-pointer outline-none" onSelect={() => { if (confirm(t('deleteConfirmation'))) onDelete(comment.id); }}>
                    <Trash size={14} />{t('delete') || 'Usuń'}
                  </DropdownMenu.Item>
                ) : (
                  <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-white/10 rounded cursor-pointer outline-none" onSelect={() => onReport(comment.id)}>
                    <Flag size={14} />{t('report') || 'Zgłoś'}
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {replyCount > 0 && (
          <div className="mt-2">
            <button onClick={handleToggleReplies} className="flex items-center gap-1.5 text-xs text-[#8F8F8F] font-semibold mb-2">
              <ChevronDown size={16} className={cn("transition-transform duration-200", areRepliesVisible && "rotate-180")} />
              {areRepliesVisible ? t('hideReplies') : t('viewReplies', { count: replyCount.toString() })}
            </button>
            <AnimatePresence>
            {areRepliesVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden pt-2"
              >
                {replies.map((reply) => (
                  <CommentItem key={reply.id} slideId={slideId} comment={reply} onLike={onLike} onDelete={onDelete} onReport={onReport} onAvatarClick={onAvatarClick} onStartReply={onStartReply} currentUserId={currentUserId} lang={lang} level={level + 1} />
                ))}
                {hasMoreReplies && (
                   <button onClick={() => fetchReplies()} disabled={isLoadingReplies} className="text-xs text-[#8F8F8F] font-semibold flex items-center gap-2">
                      {isLoadingReplies ? <Loader2 className="animate-spin h-3 w-3" /> : t('loadMore')}
                   </button>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5 text-[#808080] pt-2">
        <button onClick={() => onLike(comment.id)} className="group/like">
          <Heart size={18} className={cn("transition-colors", isLiked ? 'text-[#FE2C55] fill-current' : 'group-hover/like:text-white')} />
        </button>
        <span className="text-[11px] font-semibold">{likeCount > 0 ? likeCount : ''}</span>
      </div>
    </motion.div>
  );
};

const recursivelyUpdateComment = (comments: CommentWithRelations[], commentId: string, updateFn: (comment: CommentWithRelations) => CommentWithRelations): [CommentWithRelations[], boolean] => {
  let foundAndUpdated = false;
  const updatedComments = comments.map(c => {
    if (c.id === commentId) {
      foundAndUpdated = true;
      return updateFn(c);
    }
    if (c.replies && c.replies.length > 0) {
      const [updatedReplies, didUpdate] = recursivelyUpdateComment(c.replies, commentId, updateFn);
      if (didUpdate) {
        foundAndUpdated = true;
        return { ...c, replies: updatedReplies };
      }
    }
    return c;
  });
  return [updatedComments, foundAndUpdated];
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, slideId, initialCommentsCount }) => {
  const { t, lang } = useTranslation();
  const { user } = useUser();
  const { setActiveModal, openPatronProfileModal } = useStore();
  const { addToast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('top');
  const [replyingTo, setReplyingTo] = useState<CommentWithRelations | null>(null);
  const queryClient = useQueryClient();

  const {
    data, error, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['comments', slideId, sortBy],
    queryFn: ({ pageParam }) => fetchComments({ pageParam, slideId: slideId!, sortBy }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isOpen && !!slideId,
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  useEffect(() => {
    if (!isOpen || !slideId) return;
    const channel = ably.channels.get(`comments:${slideId}`);
    const onNewComment = () => queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    channel.subscribe('new-comment', onNewComment);
    return () => channel.unsubscribe('new-comment', onNewComment);
  }, [isOpen, slideId, queryClient]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => fetch('/api/comments/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId }) }),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', slideId, sortBy] });
      const previousData = queryClient.getQueryData(['comments', slideId, sortBy]);

      queryClient.setQueryData(['comments', slideId, sortBy], (oldData: any) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: any) => {
              const [updatedComments] = recursivelyUpdateComment(page.comments, commentId, (comment) => {
                  const isLiked = comment.likedBy.includes(user!.id);
                  const newLikedBy = isLiked ? comment.likedBy.filter(id => id !== user!.id) : [...comment.likedBy, user!.id];
                  const newLikeCount = (comment._count?.likes ?? 0) + (isLiked ? -1 : 1);
                  return { ...comment, likedBy: newLikedBy, _count: { ...comment._count, likes: newLikeCount } };
              });
              return { ...page, comments: updatedComments };
          });
          return { ...oldData, pages: newPages };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['comments', slideId, sortBy], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId, sortBy] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, text }: { parentId: string | null; text: string }) =>
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId, text, parentId }),
      }).then(res => res.json()),
    onMutate: async ({ parentId, text }) => {
      const optimisticComment: CommentWithRelations = {
        id: `temp-${Date.now()}`,
        text,
        imageUrl: null,
        authorId: user!.id,
        slideId: slideId!,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: user!.id,
          username: user!.username,
          displayName: user!.displayName || null,
          avatar: user!.avatar || null,
          role: user!.role || 'user',
        },
        likedBy: [],
        _count: { likes: 0, replies: 0 },
      };

      if (parentId) {
        // Optimistic update for a reply
        await queryClient.cancelQueries({ queryKey: ['comments', slideId, 'replies', parentId] });
        const previousReplies = queryClient.getQueryData(['comments', slideId, 'replies', parentId]);
        queryClient.setQueryData(['comments', slideId, 'replies', parentId], (old: any) => {
          const newPages = old ? [...old.pages] : [];
          if (newPages.length === 0) {
            newPages.push({ replies: [] });
          }
          newPages[0] = { ...newPages[0], replies: [optimisticComment, ...newPages[0].replies] };
          return { ...old, pages: newPages };
        });
        return { previousReplies };
      } else {
        // Optimistic update for a root comment
        await queryClient.cancelQueries({ queryKey: ['comments', slideId, sortBy] });
        const previousComments = queryClient.getQueryData(['comments', slideId, sortBy]);
        queryClient.setQueryData(['comments', slideId, sortBy], (old: any) => {
          const newPages = old ? [...old.pages] : [];
          if (newPages.length === 0) {
            newPages.push({ comments: [] });
          }
          newPages[0] = { ...newPages[0], comments: [optimisticComment, ...newPages[0].comments] };
          return { ...old, pages: newPages };
        });
        return { previousComments };
      }
    },
    onError: (err, { parentId }, context) => {
      addToast(t('commentPostError'), 'error');
      if (parentId && context?.previousReplies) {
        queryClient.setQueryData(['comments', slideId, 'replies', parentId], context.previousReplies);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId, 'replies', variables.parentId] });
      if (!variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['comments', slideId, sortBy] });
      }
      setNewComment('');
      setReplyingTo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => fetch('/api/comments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', slideId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment || !user || !slideId) return;
    replyMutation.mutate({ parentId: replyingTo?.id || null, text: trimmedComment });
  };

  const handleStartReply = (comment: CommentWithRelations) => {
    setReplyingTo(comment);
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const renderContent = () => {
    if (isLoading && comments.length === 0) {
      return (
        <div className="flex-1 px-2 pt-2 space-y-4">
           {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                 <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                 <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[100px] bg-white/10" />
                    <Skeleton className="h-4 w-[200px] bg-white/10" />
                 </div>
              </div>
           ))}
        </div>
      );
    }
    if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-4">{t('commentsError')}</div>;
    if (comments.length === 0) return <div className="flex-1 flex items-center justify-center text-white/60 p-4">{t('noCommentsYet')}</div>;

    return (
      <div className="px-2 pt-2 custom-scrollbar">
        <motion.div layout className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              slideId={slideId}
              comment={comment}
              onLike={likeMutation.mutate}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
              onStartReply={handleStartReply}
              onReport={(id) => addToast(t('reportSubmitted'), 'success')}
              onAvatarClick={openPatronProfileModal}
              currentUserId={user?.id}
              lang={lang}
            />
          ))}
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="text-sm text-pink-400 hover:text-pink-300 disabled:opacity-50 flex items-center gap-2">
                {isFetchingNextPage && <Loader2 className="animate-spin h-3 w-3" />}
                {t('loadMore')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="absolute inset-0 bg-black/60 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose}>
          <motion.div
            className="w-full bg-[#1C1C1E] backdrop-blur-md rounded-t-2xl flex flex-col border-t border-white/10"
            style={{ height: '75dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 relative text-center p-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{t('commentsTitle', { count: (comments.length || initialCommentsCount).toString() })}</h2>
              <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"><X size={24} /></button>
            </div>

            <div className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center gap-4 text-sm">
                <button onClick={() => setSortBy('top')} className={cn("font-semibold", sortBy === 'top' ? 'text-white' : 'text-white/40')}>{t('top')}</button>
                <button onClick={() => setSortBy('newest')} className={cn("font-semibold", sortBy === 'newest' ? 'text-white' : 'text-white/40')}>{t('newest')}</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">{renderContent()}</div>

            <div className="flex-shrink-0 border-t border-white/10 bg-[#121212] pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-10">
              {replyingTo && (
                <div className="bg-[#282828] px-4 py-1.5 text-xs text-[#A6A6A6] flex justify-between items-center">
                  <span>{t('replyingTo', { user: replyingTo.author.displayName || replyingTo.author.username || '' })}</span>
                  <button onClick={handleCancelReply}><X size={14} /></button>
                </div>
              )}
              {user ? (
                <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2">
                  <Image src={user.avatar || DEFAULT_AVATAR_URL} alt={t('yourAvatar')} width={32} height={32} className="w-8 h-8 rounded-full object-cover mb-1" />
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? t('replyTo', { user: replyingTo.author.displayName || replyingTo.author.username || '' }) : t('addCommentPlaceholder')}
                      className="w-full px-4 py-2 bg-[#282828] text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FE2C55] text-sm resize-none min-h-[38px] max-h-[120px] pr-10"
                      disabled={replyMutation.isPending}
                      rows={1}
                    />
                    <button type="button" className="absolute right-2 bottom-2 text-white/40 hover:text-white" title="Emoji"><Smile size={20} /></button>
                  </div>
                  <button type="submit" className="px-4 py-2 mb-1 text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[70px] transition-colors text-[#FE2C55] disabled:text-[#FE2C55]/50" disabled={!newComment.trim() || replyMutation.isPending}>
                    {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendButton')}
                  </button>
                </form>
              ) : (
                <div className="text-center p-2">
                  <button onClick={() => { setActiveModal('login'); onClose(); }} className="w-full py-3 bg-white/10 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/20">Zaloguj się, aby skomentować</button>
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
