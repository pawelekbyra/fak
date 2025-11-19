import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Gets a paginated list of slides with cursor.
 * @param cursor The cursor for pagination.
 * @param limit The number of slides to fetch.
 * @param userId The ID of the current user to check for likes.
 */
export const getSlidesWithCursor = async (cursor: string | undefined, limit: number, userId?: string) => {
  const slides = await prisma.slide.findMany({
    take: limit,
    ...(cursor && {
      skip: 1,
      cursor: {
        id: cursor,
      },
    }),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: true,
      likes: {
        where: {
          userId: userId,
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  });

  return slides.map(slide => ({
    ...slide,
    isLiked: slide.likes.length > 0,
  }));
};

/**
 * Gets a single slide by its ID with optional related data.
 * @param id The ID of the slide.
 * @param include Optional object to include related data.
 */
export const getSlideById = async <T extends Prisma.SlideInclude>(id: string, include?: T) => {
  return prisma.slide.findUnique({
    where: { id },
    ...(include && { include }),
  });
};

/**
 * Toggles a like on a slide for a user.
 * @param slideId The ID of the slide.
 * @param userId The ID of the user.
 */
export const toggleLike = async (slideId: string, userId: string) => {
  const like = await prisma.like.findUnique({
    where: {
      userId_slideId: {
        userId,
        slideId,
      },
    },
  });

  if (like) {
    await prisma.like.delete({
      where: {
        id: like.id,
      },
    });
    return { liked: false };
  } else {
    await prisma.like.create({
      data: {
        userId,
        slideId,
      },
    });
    return { liked: true };
  }
};

import { Slide as PrismaSlide } from '@prisma/client';
import { Slide } from '@/lib/types';

/**
 * Gets all slides and transforms them to the frontend Slide type.
 */
export const getAllSlides = async (userId?: string): Promise<Slide[]> => {
  const slidesFromDb = await prisma.slide.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: true,
      likes: {
        where: {
          userId: userId,
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  });

  // Transform the Prisma Slide[] to the frontend Slide[]
  const transformedSlides: Slide[] = slidesFromDb.map((slide) => {

    // Explicitly type the data field for safety
    const slideData: any = slide.data;

    const baseSlide = {
      id: slide.id,
      x: 0, // Default value as the schema doesn't support it
      y: 0, // Default value
      userId: slide.authorId,
      username: slide.author.username,
      avatar: slide.author.avatar || '',
      access: 'public' as const, // Default value
      createdAt: slide.createdAt.getTime(),
      initialLikes: slide._count.likes,
      isLiked: slide.likes.length > 0,
      initialComments: slide._count.comments,
    };

    switch (slide.type) {
      case 'video':
        return {
          ...baseSlide,
          type: 'video',
          data: slideData,
        };
      case 'image':
        return {
          ...baseSlide,
          type: 'image',
          data: slideData,
        };
      case 'html':
        return {
          ...baseSlide,
          type: 'html',
          data: slideData,
        };
      default:
        // Handle unknown slide type if necessary
        return null;
    }
  }).filter((slide): slide is Slide => slide !== null); // Filter out any nulls from unknown types

  return transformedSlides;
};

/**
 * Creates a new slide.
 * @param data The slide data.
 */
export const createSlide = async (data: any) => {
  return prisma.slide.create({
    data,
  });
};

/**
 * Updates a slide.
 * @param id The ID of the slide to update.
 * @param data The data to update.
 */
export const updateSlide = async (id: string, data: any) => {
  return prisma.slide.update({
    where: { id },
    data,
  });
};

/**
 * Deletes a slide.
 * @param id The ID of the slide to delete.
 */
export const deleteSlide = async (id: string) => {
  return prisma.slide.delete({
    where: { id },
  });
};

/**
 * Gets a limited number of slides for a specific author.
 * @param authorId The ID of the author.
 * @param limit The number of slides to fetch.
 */
export const getSlidesByAuthorId = async (authorId: string, limit: number = 6) => {
    return prisma.slide.findMany({
        where: { authorId: authorId },
        take: limit,
        orderBy: {
            createdAt: 'desc',
        },
    });
};
