'use server';

import { put, del } from '@vercel/blob';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function uploadAvatar(formData: FormData) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return { success: false, message: 'Not authenticated' };
  }
  const currentUser = payload.user;

  const file = formData.get('avatar') as File;
  if (!file) {
    return { success: false, message: 'No file provided.' };
  }

  // If the user already has an avatar, delete it from blob storage
  const existingUser = await db.findUserById(currentUser.id);
  if (existingUser && existingUser.avatar) {
    try {
      // The avatar URL from Vercel Blob typically looks like: https://<id>.public.blob.vercel-storage.com/<filename>
      // We can just pass the URL to del() if it's a Vercel Blob URL.
      // However, we should be careful not to delete external avatars (e.g. from Google Auth) if we supported that.
      // Assuming for now all avatars are from blob storage or we just try to delete and ignore errors.
      if (existingUser.avatar.includes('public.blob.vercel-storage.com')) {
        await del(existingUser.avatar);
      }
    } catch (error) {
      console.error('Failed to delete old avatar:', error);
      // Continue even if delete fails
    }
  }

  const blob = await put(file.name, file, {
    access: 'public',
  });

  const avatarUrl = blob.url;

  const updatedUser = await db.updateUser(currentUser.id, { avatar: avatarUrl });
  if (!updatedUser) {
    return { success: false, message: 'Failed to update user record.' };
  }

  return { success: true, url: avatarUrl };
}
