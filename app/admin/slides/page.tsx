import { db, User } from '@/lib/db';
import { SlideDTO } from '@/lib/dto';
import React from 'react';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import SlideManagementClient from './SlideManagementClient';
import { redirect } from 'next/navigation';
import { sanitize } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export default async function SlideManagementPage() {
  const session = await verifySession();
  // Allow admin and author to access
  if (!session || !['admin', 'author'].includes(session.user.role || '')) {
    redirect('/admin/login');
  }

  // Use the new getAllSlides function
  // We need to cast the DB result to SlideDTO because db-postgres returns strict DB types
  // and we are in a transition phase where we want to use DTOs in frontend components.
  const slidesRaw = await db.getAllSlides();

  // Mapping DB slides to SlideDTO
  // Note: getAllSlides returns a type that matches the DB schema.
  // We need to ensure it matches SlideDTO structure.
  const slides: SlideDTO[] = slidesRaw.map(s => {
      const base = {
          id: s.id,
          userId: s.userId,
          username: s.username,
          avatar: s.avatar,
          createdAt: new Date(s.createdAt).toISOString(), // DTO expects string
          initialLikes: s.initialLikes,
          isLiked: s.isLiked,
          initialComments: s.initialComments,
          accessLevel: s.accessLevel,
      };

      if (s.type === 'video') {
          return {
              ...base,
              type: 'video',
              data: {
                  mp4Url: s.data.mp4Url || '',
                  hlsUrl: s.data.hlsUrl || null,
                  poster: s.data.poster || '',
                  title: s.data.title || '',
                  description: s.data.description || '',
              }
          } as SlideDTO;
      } else {
           return {
              ...base,
              type: 'html',
              data: {
                  htmlContent: s.data.htmlContent || ''
              }
          } as SlideDTO;
      }
  });

  const users: User[] = await db.getAllUsers();

  async function createSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    'use server';
    const session = await verifySession();
    // Allow admin and author to create slides
    if (!session?.user || !['admin', 'author'].includes(session.user.role || '')) {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const type = formData.get('type') as 'video' | 'html';
      const authorId = formData.get('author_id') as string;
      const author = await db.findUserById(authorId);

      if (!author) {
        return { success: false, error: 'Author not found' };
      }

      // Common data structure for creation
      // Note: We are passing this to db.createSlide which expects specific DB types.
      // We'll construct the object that matches what db.createSlide expects.

      const commonData = {
        userId: author.id,
        username: author.username,
        avatar: author.avatar || '',
        x: 0, // Default value
        y: 0, // Default value
        accessLevel: 'PUBLIC' as const,
      };

      let newSlideData: any; // Using any to bypass strict type checks for now during refactor

      if (type === 'video') {
          newSlideData = {
              ...commonData,
              type: 'video',
              data: {
                  mp4Url: formData.get('content') as string,
                  hlsUrl: null,
                  poster: '',
                  title: formData.get('title') as string,
                  description: ''
              }
          };
      } else if (type === 'html') {
          newSlideData = {
              ...commonData,
              type: 'html',
              data: {
                  htmlContent: sanitize(formData.get('content') as string)
              }
          };
      } else {
          return { success: false, error: 'Invalid slide type' };
      }

      await db.createSlide(newSlideData);
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
    // Allow admin and author to update slides
    if (!session?.user || !['admin', 'author'].includes(session.user.role || '')) {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const slideId = formData.get('id') as string;
      const type = formData.get('type') as 'video' | 'html';
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;

      let updatedData: any;

      switch (type) {
        case 'video':
          updatedData = { mp4Url: content, hlsUrl: null, poster: '', title: title, description: '' };
          break;
        case 'html':
          updatedData = { htmlContent: sanitize(content) };
          break;
        default:
          return { success: false, error: 'Invalid slide type' };
      }

      // We cast to any here because the exact Partial<Slide> type is tricky with the union
      const updatedSlide = {
        data: updatedData
      };

      await db.updateSlide(slideId, updatedSlide as any);
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
    // Allow admin and author to delete slides
    if (!session?.user || !['admin', 'author'].includes(session.user.role || '')) {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      const slideId = formData.get('id') as string;
      await db.deleteSlide(slideId);
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
