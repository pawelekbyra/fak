import { z } from 'zod';
import { CommentWithRelations } from '@/lib/dto';

// --- Schemas ---

export const PublicUserSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.string().default('user'),
});

// Explicit Interface Definition for Recursive Comment
export interface CommentSchemaType {
  id: string;
  text: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  slideId: string;
  author?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    role?: string;
  };
  likedBy: string[];
  _count?: {
    likes?: number;
  };
  user?: {
    displayName: string | null;
    avatar: string | null;
  };
  parentId?: string | null | undefined;
  replies: CommentSchemaType[];
}

// Recursive Comment Schema implementation
export const CommentSchema: z.ZodType<CommentSchemaType> = z.lazy(() =>
  z.object({
    id: z.string(),
    text: z.string(),
    imageUrl: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).transform((val) => {
        if (val instanceof Date) return val.toISOString();
        return val;
    }),
    updatedAt: z.union([z.string(), z.date()]).transform((val) => {
        if (val instanceof Date) return val.toISOString();
        return val;
    }).optional(),
    authorId: z.string(),
    slideId: z.string(),
    author: z.object({
      id: z.string(),
      username: z.string().nullable(),
      displayName: z.string().nullable(),
      avatar: z.string().nullable(),
      role: z.string().default('user'),
    }).optional(),
    likedBy: z.array(z.string()).default([]),
    _count: z.object({
      likes: z.number().optional(),
    }).optional(),
    user: z.object({
      displayName: z.string().nullable(),
      avatar: z.string().nullable(),
    }).optional(),
    parentId: z.string().nullable().optional(),
    replies: z.array(CommentSchema).default([]),
  })
);

export const BaseSlideSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().nullable().transform(val => val || "Anonymous"), // Fallback
  avatar: z.string().nullable().transform(val => val || ""),

  createdAt: z.union([z.string(), z.number()]).transform(val => {
      if (typeof val === 'number') return new Date(val).toISOString();
      return val;
  }),

  initialLikes: z.number().default(0),
  isLiked: z.boolean().default(false),
  initialComments: z.number().default(0),

  access: z.enum(['public', 'secret']).default('public'),
});

export const HtmlSlideSchema = BaseSlideSchema.extend({
  type: z.literal('html'),
  data: z.object({
    htmlContent: z.string(),
  }),
});

export const VideoSlideSchema = BaseSlideSchema.extend({
  type: z.literal('video'),
  data: z.object({
    mp4Url: z.string(),
    hlsUrl: z.string().nullable(),
    poster: z.string(),
    title: z.string(),
    description: z.string(),
  }),
});

export const SlideSchema = z.discriminatedUnion('type', [
  HtmlSlideSchema,
  VideoSlideSchema,
]);

export const SlidesResponseSchema = z.object({
  slides: z.array(SlideSchema),
  nextCursor: z.string().nullable().optional(),
});

export const CommentsResponseSchema = z.object({
  success: z.boolean(),
  comments: z.array(CommentSchema),
  message: z.string().optional(),
});
