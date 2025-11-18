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

export async function uploadVideo(formData: FormData) {
  const payload = await verifySession();
  if (!payload || !payload.user || payload.user.role !== 'TWÓRCA') {
    throw new Error('Not authorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const video = formData.get('video') as File;
  const userId = formData.get('userId') as string;
  const username = formData.get('username') as string;
  const avatar = formData.get('avatar') as string;

  const blob = await put(video.name, video, {
    access: 'public',
  });

  await db.createSlide({
    userId,
    username,
    avatar,
    x: 0,
    y: 0,
    type: 'video',
    access: 'public',
    data: {
      title,
      description,
      mp4Url: blob.url,
      hlsUrl: null,
      poster: '',
    },
  });
}
