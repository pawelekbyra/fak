'use client';

'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, ThumbsUp, ThumbsDown, MoreHorizontal, CornerDownRight } from 'lucide-react';

import { Comment } from '@/lib/comments/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from '@/context/UserContext';
import { EntityCommentsTree } from '@/lib/comments/types';


interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: (comment: Comment) => void;
  onDelete: (formData: FormData) => Promise<void>;
  onVote: (formData: FormData) => Promise<void>;
  commentsTree: EntityCommentsTree;
}

export function CommentItem({ comment, replies, onReply, onDelete, onVote, commentsTree }: CommentItemProps) {
  const { user } = useUser();
  const [areRepliesVisible, setAreRepliesVisible] = useState(true);
  const hasReplies = replies && replies.length > 0;

  const handleToggleReplies = () => {
    if(hasReplies) setAreRepliesVisible(!areRepliesVisible);
  };

  return (
    <div className="flex items-start space-x-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.avatar || undefined} alt={`@${comment.user.username}`} />
        <AvatarFallback>{comment.user.username?.[0].toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="text-sm">
          <span className="font-semibold text-neutral-200">{comment.user.displayName || comment.user.username}</span>
        </div>

        <p className="mt-1 text-sm text-neutral-300 whitespace-pre-wrap">
          {comment.content}
        </p>

        <div className="mt-2 flex items-center space-x-4 text-xs text-neutral-400">
          <span className="hover:underline">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          <Button variant="ghost" size="xs" onClick={() => onReply(comment)} className="font-semibold">
            Reply
          </Button>
        </div>

        <div className="mt-2 flex items-center space-x-2">
           <form action={onVote}>
               <input type="hidden" name="commentId" value={comment.id} />
               <input type="hidden" name="voteType" value="upvote" />
               <Button type="submit" variant="ghost" size="xs" className="flex items-center space-x-1 px-2">
                <ThumbsUp size={14} className={cn(comment.currentUserVote === 'upvote' && 'fill-current text-pink-500')} />
                <span className="font-semibold">{comment.upvotesCount}</span>
              </Button>
           </form>
            <form action={onVote}>
               <input type="hidden" name="commentId" value={comment.id} />
               <input type="hidden" name="voteType" value="downvote" />
               <Button type="submit" variant="ghost" size="xs" className="flex items-center space-x-1 px-2">
                <ThumbsDown size={14} className={cn(comment.currentUserVote === 'downvote' && 'fill-current')} />
                <span className="font-semibold">{comment.downvotesCount}</span>
              </Button>
           </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {user?.id === comment.userId && (
                <form action={onDelete}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <DropdownMenuItem asChild>
                        <button type="submit" className="w-full text-left">Delete</button>
                    </DropdownMenuItem>
                </form>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasReplies && (
          <Button variant="ghost" size="xs" onClick={handleToggleReplies} className="mt-2 text-xs font-semibold text-pink-400">
             <CornerDownRight size={14} className="mr-1" />
            {areRepliesVisible ? `Hide ${replies.length} replies` : `View ${replies.length} replies`}
          </Button>
        )}

        <AnimatePresence>
            {hasReplies && areRepliesVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2 pl-4 border-l-2 border-neutral-800"
              >
                {replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    replies={commentsTree[reply.id]?.replies ? Object.values(commentsTree[reply.id].replies) : []}
                    onReply={onReply}
                    onDelete={onDelete}
                    onVote={onVote}
                    commentsTree={commentsTree}
                  />
                ))}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
