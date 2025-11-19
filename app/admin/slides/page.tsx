import { getAllSlides, getAllUsers, findUserById, createSlide, updateSlide, deleteSlide, User } from '@/lib/db';
import { Slide } from '@/lib/types';
import React from 'react';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import SlideManagementClient from './SlideManagementClient';
import { redirect } from 'next/navigation';
import { sanitize } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export default async function SlideManagementPage() {
  const session = await verifySession();
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const slides = await getAllSlides();
  const users: User[] = await getAllUsers();

  async function createSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    'use server';
    const session = await verifySession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const type = formData.get('type') as 'video' | 'image' | 'html';
      const authorId = formData.get('author_id') as string;
      const author = await findUserById(authorId);

      if (!author) {
        return { success: false, error: 'Author not found' };
      }

      const commonData = {
        userId: author.id,
        username: author.username,
        avatar: author.avatar || '',
        x: 0, // Default value
        y: 0, // Default value
        access: 'public' as const,
        data: {
          title: formData.get('title') as string,
          content: formData.get('content') as string,
        },
      };

      let newSlide: Omit<Slide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'>;

      switch (type) {
        case 'video':
          newSlide = { ...commonData, type: 'video', data: { mp4Url: commonData.data.content, hlsUrl: null, poster: '', title: commonData.data.title, description: '' } };
          break;
        case 'image':
          newSlide = { ...commonData, type: 'image', data: { imageUrl: commonData.data.content, altText: commonData.data.title } };
          break;
        case 'html':
          newSlide = { ...commonData, type: 'html', data: { htmlContent: sanitize(commonData.data.content) } };
          break;
        default:
          return { success: false, error: 'Invalid slide type' };
      }

      await createSlide(newSlide);
      revalidatePath('/admin/slides');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to create slide: ${errorMessage}` };
    }
  }

  async function updateSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    'use server';
    const session = await verifySession();
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const slideId = formData.get('id') as string;
      const type = formData.get('type') as 'video' | 'image' | 'html';
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;

      let updatedData: Slide['data'];

      switch (type) {
        case 'video':
          updatedData = { mp4Url: content, hlsUrl: null, poster: '', title: title, description: '' };
          break;
        case 'image':
          updatedData = { imageUrl: content, altText: title };
          break;
        case 'html':
          updatedData = { htmlContent: sanitize(content) };
          break;
        default:
          return { success: false, error: 'Invalid slide type' };
      }

      const updatedSlide: Partial<Omit<Slide, 'id' | 'createdAt' | 'userId' | 'username' | 'x' | 'y'>> = {
        data: updatedData
      };

      await updateSlide(slideId, updatedSlide);
      revalidatePath('/admin/slides');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to update slide: ${errorMessage}` };
    }
  }

  async function deleteSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }>{
    'use server';
    const session = await verifySession();
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const slideId = formData.get('id') as string;
      await deleteSlide(slideId);
      revalidatePath('/admin/slides');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to delete slide: ${errorMessage}` };
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Slide Management</h2>
      <SlideManagementClient
        slides={slides}
        users={users}
        createSlideAction={createSlideAction}
        updateSlideAction={updateSlideAction}
        deleteSlideAction={deleteSlideAction}
      />
    </div>
  );
}
