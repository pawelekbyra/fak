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
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReport: (id: string) => void;
  onAvatarClick: (userId: string) => void;
  currentUserId?: string;
  lang: string;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReplySubmit, onDelete, onReport, onAvatarClick, currentUserId, lang, level = 0 }) => {
  const { t } = useTranslation();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [areRepliesVisible, setAreRepliesVisible] = useState(true);
  const { user } = useUser();
  const isLiked = currentUserId ? comment.likedBy.includes(currentUserId) : false;
  const likeCount = comment._count?.likes ?? comment.likedBy.length;

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

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-start gap-2 group", level > 0 && "pl-4")}
    >
      {level > 0 && <div className="w-px bg-white/10 self-stretch -ml-2 mr-2"></div>}
      <div
        onClick={() => onAvatarClick(author.id)}
        className="cursor-pointer flex-shrink-0 flex flex-col items-center"
      >
        <Image
          src={author.avatar || DEFAULT_AVATAR_URL}
          alt={t('userAvatar', { user: author.displayName || 'User' })}
          width={level > 0 ? 24 : 32}
          height={level > 0 ? 24 : 32}
          className="rounded-full object-cover mt-1"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white/5 rounded-lg px-3 py-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white/90 cursor-pointer hover:underline" onClick={() => onAvatarClick(author.id)}>
                {author.displayName || author.username || 'User'}
              </p>
              <UserBadge role={author.role} className="scale-[0.6] transform origin-left" />
            </div>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <MoreHorizontal size={14} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="min-w-[150px] bg-gray-800 rounded-md p-1 shadow-xl z-[60] border border-white/10" align="end">
                    {currentUserId === comment.authorId ? (
                      <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:bg-white/10 rounded cursor-pointer outline-none" onSelect={() => { if (confirm(t('deleteConfirmation'))) onDelete(comment.id); }}>
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
          <p className="text-sm text-white/90 whitespace-pre-wrap break-words">{comment.text}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/50 mt-1 pl-2">
          <span>{formattedTime}</span>
          <button onClick={() => setIsReplying(!isReplying)} className="font-semibold hover:text-white transition-colors">
            {t('reply')}
          </button>
        </div>

        {isReplying && user && (
          <form onSubmit={handleLocalReplySubmit} className="flex items-center gap-2 mt-2">
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

        {hasReplies && (
          <div className="mt-2">
            <button onClick={() => setAreRepliesVisible(!areRepliesVisible)} className="flex items-center gap-1 text-xs text-white/60 font-semibold mb-2">
              <ChevronDown size={14} className={cn("transition-transform", !areRepliesVisible && "-rotate-90")} />
              {areRepliesVisible ? t('hideReplies') : t('showReplies', { count: (comment.replies || []).length.toString() })}
            </button>
            <AnimatePresence>
            {areRepliesVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {comment.replies?.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} onLike={onLike} onReplySubmit={onReplySubmit} onDelete={onDelete} onReport={onReport} onAvatarClick={onAvatarClick} currentUserId={currentUserId} lang={lang} level={level + 1} />
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5 text-white/50 pt-2">
        <button onClick={() => onLike(comment.id)} className="group/like">
          <Heart size={16} className={cn("transition-colors", isLiked ? 'text-red-500 fill-current' : 'group-hover/like:text-white')} />
        </button>
        <span className="text-[10px]">{likeCount > 0 ? likeCount : ''}</span>
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
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
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
    mutationFn: ({ parentId, text }: { parentId: string | null; text: string }) => fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideId, text, parentId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      setNewComment('');
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
    replyMutation.mutate({ parentId: null, text: trimmedComment });
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
              comment={comment}
              onLike={likeMutation.mutate}
              onReplySubmit={async (parentId, text) => {
                await replyMutation.mutateAsync({ parentId, text });
              }}
              onDelete={async (id) => {
                await deleteMutation.mutateAsync(id);
              }}
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

            <div className="flex-shrink-0 px-2 py-1.5 border-b border-white/10 flex items-center gap-2">
                <button onClick={() => setSortBy('newest')} className={cn("px-3 py-1 text-xs rounded-full", sortBy === 'newest' ? 'bg-white/90 text-black font-semibold' : 'bg-white/10 text-white/80')}>{t('newest')}</button>
                <button onClick={() => setSortBy('top')} className={cn("px-3 py-1 text-xs rounded-full", sortBy === 'top' ? 'bg-white/90 text-black font-semibold' : 'bg-white/10 text-white/80')}>{t('top')}</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">{renderContent()}</div>

            <div className="flex-shrink-0 p-2 border-t border-white/10 bg-black/30 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-10">
              {user ? (
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <Image src={user.avatar || DEFAULT_AVATAR_URL} alt={t('yourAvatar')} width={32} height={32} className="w-8 h-8 rounded-full object-cover mb-1" />
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
                    <button type="button" className="absolute right-2 bottom-2 text-white/40 hover:text-white" title="Emoji"><Smile size={20} /></button>
                  </div>
                  <button type="submit" className="px-4 py-2 mb-1 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[70px] transition-colors" disabled={!newComment.trim() || replyMutation.isPending}>
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
