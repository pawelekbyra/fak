'use server';

import { put } from '@vercel/blob';
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
