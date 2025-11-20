import { z } from 'zod';

// --- Schemas ---

export const PublicUserSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.string().default('user'),
});

// Recursive Comment Schema
export const CommentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    text: z.string(),
    createdAt: z.string().or(z.date().transform(d => d.toISOString())), // Handle both Date objects and ISO strings
    authorId: z.string(),
    slideId: z.string(),
    // Author relation (often flattened or nested depending on query, aligning with DTO)
    author: z.object({
      id: z.string(),
      username: z.string().nullable(),
      displayName: z.string().nullable(),
      avatar: z.string().nullable(),
    }).optional(),
    // Legacy frontend format often expects 'user' instead of 'author' or a flat structure
    // We will enforce the 'author' object structure but can transform if needed.
    // For now, let's stick to the DTO definition:

    likedBy: z.array(z.string()).default([]),
    replies: z.array(CommentSchema).optional().default([]),
    _count: z.object({
      likes: z.number().optional(),
    }).optional(),

    // Handling the specific frontend requirement where user details are attached
    user: z.object({
       displayName: z.string().nullable(),
       avatar: z.string().nullable(),
    }).optional(),

    parentId: z.string().nullable().optional(),
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
