'use client';

import React from 'react';
import { EntityCommentsTree, Comment } from '@/lib/comments/types';
import { CommentItem } from './CommentItem';

interface CommentsListProps {
  commentsTree: EntityCommentsTree;
  onReply: (comment: Comment) => void;
  onDelete: (formData: FormData) => Promise<void>;
  onVote: (formData: FormData) => Promise<void>;
}

export function CommentsList({ commentsTree, onReply, onDelete, onVote }: CommentsListProps) {
  const topLevelComments = Object.values(commentsTree)
    .map(node => node.comment)
    .filter(comment => !comment.parentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (topLevelComments.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400 py-8">
        No comments yet. Be the first to say something!
      </div>
    );
  }

  const getReplies = (commentId: string): Comment[] => {
    const node = commentsTree[commentId];
    if (!node || !node.replies) return [];

    return Object.values(node.replies)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  return (
    <div className="space-y-4">
      {topLevelComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={getReplies(comment.id)}
          onReply={onReply}
          onDelete={onDelete}
          onVote={onVote}
          commentsTree={commentsTree}
        />
      ))}
    </div>
  );
}
