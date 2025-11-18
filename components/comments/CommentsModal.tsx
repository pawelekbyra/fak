'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { useCommentSection } from '@/hooks/use-comment-section';
import { Comment } from '@/lib/comments/types';
import { db } from '@/lib/db';
import { useUser } from '@/context/UserContext';
import { CommentsList } from './CommentsList';
import { CommentForm } from './CommentForm';
import { Skeleton } from '@/components/ui/skeleton';

export function CommentsModal() {
  const { activeModal, setActiveModal, activeSlide } = useStore();
  const { user } = useUser();
  const isVisible = activeModal === 'comments';

  const [initialComments, setInitialComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      if (isVisible && activeSlide?.id) {
        setIsLoading(true);
        const comments = await db.getCommentsByEntityId(activeSlide.id, user?.id);
        setInitialComments(comments);
        setIsLoading(false);
      }
    }
    fetchComments();
  }, [isVisible, activeSlide, user]);

  const {
    commentsTree,
    repliedToComment,
    setRepliedToComment,
    addComment,
    deleteComment,
    toggleVote,
  } = useCommentSection({
    entityId: activeSlide?.id || '',
    initialComments: initialComments,
    currentUser: user,
  });

  const handleClose = () => setActiveModal(null);
  const handleReply = (comment: Comment) => setRepliedToComment(comment);
  const handleCommentAdded = () => {
     if (repliedToComment) setRepliedToComment(null);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="relative flex flex-col w-full max-w-lg h-[85vh] bg-neutral-900 text-white rounded-t-2xl shadow-lg border-t border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="relative flex items-center justify-center p-4 border-b border-neutral-800">
              <h2 className="text-base font-semibold">Comments</h2>
              <button onClick={handleClose} className="absolute p-1 right-3 top-3 rounded-full hover:bg-neutral-700">
                <X size={20} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                  <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                  </div>
              ) : (
                <CommentsList
                  commentsTree={commentsTree}
                  onReply={handleReply}
                  onDelete={deleteComment}
                  onVote={toggleVote}
                />
              )}
            </main>

            <footer className="p-4 border-t border-neutral-800 bg-neutral-900">
              {repliedToComment && (
                <div className="mb-2 text-xs text-neutral-400">
                  Replying to @{repliedToComment.user?.username || 'user'}
                  <button onClick={() => setRepliedToComment(null)} className="ml-2 font-semibold text-pink-500 hover:text-pink-400">[Cancel]</button>
                </div>
              )}
              <CommentForm
                entityId={activeSlide!.id}
                parentId={repliedToComment?.id}
                onCommentAdded={handleCommentAdded}
                addCommentAction={addComment}
              />
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
