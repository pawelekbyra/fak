'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { put } from '@vercel/blob';
import { z } from 'zod';
import { checkRateLimit } from './rate-limiter';

// Zod schemas for input validation
const addCommentSchema = z.object({
  entityId: z.string().min(1, 'Entity ID is required'),
  content: z.string().min(1, 'Comment content cannot be empty').max(1000, 'Comment is too long'),
  parentId: z.string().uuid().optional().nullable(),
});

const updateCommentSchema = z.object({
    commentId: z.string().uuid('Invalid Comment ID'),
    content: z.string().min(1, 'Comment content cannot be empty').max(1000, 'Comment is too long'),
});

const deleteCommentSchema = z.object({
    commentId: z.string().uuid('Invalid Comment ID'),
});

const voteCommentSchema = z.object({
    commentId: z.string().uuid('Invalid Comment ID'),
    voteType: z.enum(['upvote', 'downvote']),
});


export async function addComment(formData: FormData) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return { success: false, message: 'Not authenticated' };
  }
  const currentUser = payload.user;

  const rateLimitResult = await checkRateLimit(currentUser.id);
  if (!rateLimitResult.success) {
    return { success: false, message: rateLimitResult.message };
  }

  const validatedFields = addCommentSchema.safeParse({
    entityId: formData.get('entityId'),
    content: formData.get('content'),
    parentId: formData.get('parentId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { entityId, content, parentId } = validatedFields.data;

  let imageUrl: string | undefined;
  const imageFile = formData.get('image') as File;
  if (imageFile) {
    const blob = await put(imageFile.name, imageFile, { access: 'public' });
    imageUrl = blob.url;
  }

  try {
    const newComment = await db.addComment({
      entityId,
      userId: currentUser.id,
      content,
      imageUrl,
      parentId: parentId || null,
    });
    revalidatePath('/');
    return { success: true, message: 'Comment added', comment: newComment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, message: 'Failed to add comment.' };
  }
}

export async function updateComment(formData: FormData) {
    const payload = await verifySession();
    if (!payload || !payload.user) {
        return { success: false, message: 'Not authenticated' };
    }
    const currentUser = payload.user;

    const validatedFields = updateCommentSchema.safeParse({
        commentId: formData.get('commentId'),
        content: formData.get('content'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors, };
    }

    const { commentId, content } = validatedFields.data;

    try {
        const updatedComment = await db.updateComment(commentId, currentUser.id, content);
        if (!updatedComment) {
            return { success: false, message: 'Comment not found or user not authorized.' };
        }
        revalidatePath('/');
        return { success: true, message: 'Comment updated', comment: updatedComment };
    } catch (error) {
        console.error('Error updating comment:', error);
        return { success: false, message: 'Failed to update comment.' };
    }
}


export async function deleteComment(formData: FormData) {
    const payload = await verifySession();
    if (!payload || !payload.user) {
        return { success: false, message: 'Not authenticated' };
    }
    const currentUser = payload.user;

    const validatedFields = deleteCommentSchema.safeParse({
        commentId: formData.get('commentId'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors };
    }

    const { commentId } = validatedFields.data;

    try {
        const success = await db.deleteComment(commentId, currentUser.id);
        if (!success) {
            return { success: false, message: 'Comment not found or user not authorized.' };
        }
        revalidatePath('/');
        return { success: true, message: 'Comment deleted' };
    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, message: 'Failed to delete comment.' };
    }
}

export async function toggleCommentVote(formData: FormData) {
    const payload = await verifySession();
    if (!payload || !payload.user) {
        return { success: false, message: 'Not authenticated' };
    }
    const currentUser = payload.user;

    const rateLimitResult = await checkRateLimit(currentUser.id);
    if (!rateLimitResult.success) {
        return { success: false, message: rateLimitResult.message };
    }

    const validatedFields = voteCommentSchema.safeParse({
        commentId: formData.get('commentId'),
        voteType: formData.get('voteType'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors };
    }

    const { commentId, voteType } = validatedFields.data;

    try {
        const result = await db.toggleCommentVote(commentId, currentUser.id, voteType);
        revalidatePath('/');
        return { success: true, ...result };
    } catch (error) {
        console.error('Error toggling comment vote:', error);
        return { success: false, message: 'Failed to toggle vote.' };
    }
}
