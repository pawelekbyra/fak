"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Loader2, MoreHorizontal, Trash, Flag, Smile, Image as ImageIcon, Send, XCircle } from 'lucide-react';
import Image from 'next/image';
import Ably from 'ably';
import { ably } from '@/lib/ably-client';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { CommentWithRelations } from '@/lib/dto';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { useComments } from '@/hooks/use-comments';
import { useQueryClient } from '@tanstack/react-query';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { put } from '@vercel/blob';

interface CommentItemProps {
  comment: CommentWithRelations;
  onLike: (id: string) => void;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReport: (id: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  lang: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReplySubmit, onDelete, onReport, currentUserId, isReply = false, lang }) => {
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
    if (!text || typeof text !== 'string') return null;
    try {
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
    } catch (e) {
        return text;
    }
  };

  // Only show the menu if the current user is the author
  const isAuthor = currentUserId === comment.authorId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-3 ${isReply ? 'ml-8' : ''} group`}
    >
      <Image src={author.avatar || DEFAULT_AVATAR_URL} alt={t('userAvatar', { user: author.displayName || 'User' })} width={32} height={32} className="w-8 h-8 rounded-full mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white/80">{author.displayName || author.username || 'User'}</p>
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

             {isAuthor && (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                    <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={16} />
                    </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-[150px] bg-gray-800 rounded-md p-1 shadow-xl z-[60] border border-white/10" align="end">
                        <DropdownMenu.Item
                            className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:bg-white/10 rounded cursor-pointer outline-none"
                            onSelect={() => onDelete(comment.id)}
                        >
                            <Trash size={14} />
                            {t('delete') || 'Usuń'}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
             )}
        </div>

        <p className="text-sm text-white whitespace-pre-wrap break-words mt-0.5">{renderText(comment.text)}</p>

        {/* Render Image if exists */}
        {comment.imageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden relative max-w-[200px]">
                <Image
                    src={comment.imageUrl}
                    alt="Comment attachment"
                    width={200}
                    height={200}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '200px' }}
                />
            </div>
        )}

        <div className="flex items-center gap-4 text-xs text-white/60 mt-2">
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
  const { addToast } = useToast();

  // Use React Query Hook
  const { comments: fetchedComments, isLoading, queryClient } = useComments(slideId || '');
  const [localComments, setLocalComments] = useState<CommentWithRelations[]>([]);

  // Sync fetched comments to local state (for optimistic updates)
  useEffect(() => {
    if (fetchedComments) {
        setLocalComments(fetchedComments);
    }
  }, [fetchedComments]);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  // Real-time updates
  useEffect(() => {
    if (isOpen && slideId) {
      const channel = ably.channels.get(`comments:${slideId}`);
      const onNewComment = (message: Ably.Message) => {
        const data = message.data as any;
        const mappedComment: CommentWithRelations = {
            ...data,
            author: data.author || data.user,
            likedBy: data.likedBy || [],
            replies: []
        };
        addCommentOptimistically(mappedComment);
      };

      channel.subscribe('new-comment', onNewComment);

      return () => {
        channel.unsubscribe('new-comment', onNewComment);
      };
    }
  }, [isOpen, slideId]);

  const handleLike = async (commentId: string) => {
    if (!user) return;

    setLocalComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const isLiked = comment.likedBy.includes(user.id);
        const newLikedBy = isLiked
          ? comment.likedBy.filter((id: string) => id !== user.id)
          : [...comment.likedBy, user.id];
        return { ...comment, likedBy: newLikedBy };
      }
      return comment;
    }));

    try {
      const res = await fetch(`/api/comments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) throw new Error();
    } catch (error) {
       // Revert on error? For now silent fail or re-fetch
       queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    }
  };

  const addCommentOptimistically = (newComment: CommentWithRelations) => {
    setLocalComments(prev => {
      const exists = prev.some(c => c.id === newComment.id);
      if (exists) return prev;

      if ((newComment as any).parentId) {
        const addReply = (comment: CommentWithRelations): CommentWithRelations => {
          if (comment.id === (newComment as any).parentId) {
            const replyExists = comment.replies?.some(r => r.id === newComment.id);
            if (replyExists) return comment;
            return { ...comment, replies: [...(comment.replies || []), newComment] };
          }
          if (comment.replies) {
            return { ...comment, replies: comment.replies.map(addReply) };
          }
          return comment;
        };
        return prev.map(addReply);
      } else {
        return [newComment, ...prev];
      }
    });
  };

  const removeCommentOptimistically = (commentId: string) => {
    setLocalComments(prev => {
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const handleRemoveImage = () => {
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if ((!trimmedComment && !selectedImage) || !user || !slideId) return;

    setIsSubmitting(true);
    let uploadedImageUrl = null;

    try {
        if (selectedImage) {
            const res = await fetch(`/api/upload?filename=${selectedImage.name}`, {
                method: 'POST',
                body: selectedImage,
            });
            const blob = await res.json();
            if (blob.error) throw new Error(blob.error);
            uploadedImageUrl = blob.url;
        }

        const tempId = `temp-${Date.now()}`;
        const newCommentData: CommentWithRelations = {
            id: tempId,
            text: trimmedComment || (uploadedImageUrl ? ' ' : ''), // Allow empty text if image
            imageUrl: uploadedImageUrl,
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

        // Optimistic add (Wait for real response for IDs usually, but this is fine for now)
        addCommentOptimistically(newCommentData);
        setNewComment('');
        handleRemoveImage();

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slideId, text: trimmedComment || ' ', imageUrl: uploadedImageUrl }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Error posting comment');
        }

        // Refresh query to get real ID
        queryClient.invalidateQueries({ queryKey: ['comments', slideId] });

    } catch (err: any) {
        addToast(err.message || 'Error posting comment', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string, text: string) => {
      // (Implementation kept similar to original, just ensuring endpoint match)
      // For brevity, using direct fetch here but can be refactored
      try {
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slideId, text, parentId }),
        });
        if (res.ok) {
            queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
        }
      } catch (e) {}
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
           if (!res.ok) throw new Error();
           queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      } catch (error) {
           addToast(t('deleteError') || 'Failed to delete', 'error');
           queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      }
  };

  const handleReport = (commentId: string) => {
      addToast(t('reportSubmitted') || 'Report submitted', 'success');
  }

  const renderContent = () => {
    // If no comments and not loading
    if (localComments.length === 0 && !isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-center text-white/60 p-4">
                {t('noCommentsYet')}
            </div>
        );
    }
    // Note: Skeletons are effectively removed because we pre-fetch.
    // If it is still loading (first open, slow network), show spinner or minimal skeleton.
    if (isLoading && localComments.length === 0) {
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

    return (
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence>
          <motion.div layout className="space-y-4 pb-2">
            {localComments.map((comment: CommentWithRelations) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLike}
                onReplySubmit={handleReplySubmit}
                onDelete={handleDelete}
                onReport={handleReport}
                currentUserId={user?.id}
                lang={lang}
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
            {/* Header */}
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{t('commentsTitle', { count: (localComments.length || initialCommentsCount).toString() })}</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Comments List */}
            {renderContent()}

            {/* Footer Form Area */}
            <div className="flex-shrink-0 p-3 border-t border-white/10 bg-black pb-8 md:pb-4 relative z-20 w-full">
              {!user ? (
                 <div className="flex flex-col items-center justify-center gap-2 py-2">
                     <p className="text-white font-semibold">Zaloguj się, aby skomentować</p>
                     <p className="text-white/60 text-xs">Możesz czytać komentarze jako gość.</p>
                 </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full">
                  <div className="flex-shrink-0">
                     {user.avatar ? (
                        <Image src={user.avatar} alt={user.username || 'User'} width={32} height={32} className="w-8 h-8 rounded-full mb-1" />
                     ) : (
                        <div className="w-8 h-8 rounded-full bg-pink-500 mb-1" />
                     )}
                  </div>

                  <div className="flex-1 bg-white/10 rounded-2xl flex flex-col relative px-3 py-2">
                      {imagePreview && (
                          <div className="mb-2 relative w-fit">
                              <Image src={imagePreview} alt="Preview" width={60} height={60} className="w-16 h-16 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full p-0.5"
                              >
                                <XCircle size={14} />
                              </button>
                          </div>
                      )}
                      <div className="flex items-center gap-2 w-full">
                          <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('addCommentPlaceholder')}
                            className="flex-1 bg-transparent text-white focus:outline-none text-sm resize-none min-h-[20px] max-h-[100px] py-1 self-center"
                            rows={1}
                            disabled={isSubmitting}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0 self-center">
                                <button
                                    type="button"
                                    className="text-white/60 hover:text-white transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Add Image"
                                >
                                    <ImageIcon size={20} />
                                </button>
                                <button type="button" className="text-white/60 hover:text-white transition-colors" title="Emoji">
                                    <Smile size={20} />
                                </button>
                          </div>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                  </div>

                  <button
                    type="submit"
                    className="flex-shrink-0 w-10 h-10 mb-1 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(!newComment.trim() && !selectedImage) || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} className="ml-0.5" />}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
