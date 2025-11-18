// lib/db/comments.ts
import { prisma } from '@/lib/prisma';
import type { comments as Comment, users as User, comment_votes } from '@prisma/client';

export type CommentWithDetails = Comment & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  upvotesCount: number;
  downvotesCount: number;
  currentUserVote: 'upvote' | 'downvote' | null;
};

export async function getCommentsForSlide(
  slideId: string,
  currentUserId?: string
): Promise<CommentWithDetails[]> {
  const comments = await prisma.comments.findMany({
    where: {
      entityId: slideId,
      deletedAt: null,
    },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      comment_votes: true,
    },
    orderBy: {
      createdAt: 'desc', // Domyślne sortowanie po najnowszych
    },
  });

  return comments.map((comment) => {
    const { users, comment_votes, ...commentData } = comment;
    const upvotesCount = comment_votes.filter((v) => v.voteType === 'upvote').length;
    const downvotesCount = comment_votes.filter((v) => v.voteType === 'downvote').length;

    const currentUserVote = currentUserId
      ? comment_votes.find((v) => v.userId === currentUserId)?.voteType ?? null
      : null;

    return {
      ...commentData,
      user: users,
      upvotesCount,
      downvotesCount,
      // @ts-ignore
      currentUserVote,
    };
  });
}

export async function createComment(data: {
  entityId: string;
  userId: string;
  content: string;
  imageUrl?: string;
  parentId?: string | null;
}): Promise<CommentWithDetails> {
  const newComment = await prisma.comments.create({
    data: {
      entityId: data.entityId,
      userId: data.userId,
      content: data.content,
      imageUrl: data.imageUrl,
      parentId: data.parentId || null,
    },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    },
  });

  const { users, ...commentData } = newComment;

  return {
    ...commentData,
    user: users,
    upvotesCount: 0,
    downvotesCount: 0,
    currentUserVote: null,
  };
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<{ newStatus: 'upvoted' | 'downvoted' | 'none'; upvotesCount: number; downvotesCount: number }> {
  let newStatus: 'upvoted' | 'downvoted' | 'none';

  await prisma.$transaction(async (tx) => {
    const existingVote = await tx.comment_votes.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await tx.comment_votes.delete({ where: { commentId_userId: { commentId, userId } } });
        newStatus = 'none';
      } else {
        await tx.comment_votes.update({
          where: { commentId_userId: { commentId, userId } },
          data: { voteType },
        });
        // @ts-ignore
        newStatus = voteType;
      }
    } else {
      await tx.comment_votes.create({
        data: {
          commentId,
          userId,
          voteType,
        },
      });
       // @ts-ignore
      newStatus = voteType;
    }
  });

  const upvotesCount = await prisma.comment_votes.count({ where: { commentId, voteType: 'upvote' } });
  const downvotesCount = await prisma.comment_votes.count({ where: { commentId, voteType: 'downvote' } });
   // @ts-ignore
  return { newStatus, upvotesCount, downvotesCount };
}
