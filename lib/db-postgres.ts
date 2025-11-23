import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { User, Comment, Notification } from './db.interfaces';
import { SlideDTO as Slide } from './dto';
import { prisma } from './prisma';
import { CommentWithRelations } from './dto';

let sql: NeonQueryFunction<false, false>;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;
const QUERY_TIMEOUT_MS = 10000; // Increased to 10 seconds

async function queryWithTimeout(query: Promise<any>) {
  return Promise.race([
    query,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timed out')), QUERY_TIMEOUT_MS)
    ),
  ]);
}

async function executeWithRetry(queryFn: () => Promise<any>) {
  let lastError: Error | undefined;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await queryWithTimeout(queryFn());
    } catch (error: any) {
      lastError = error;
      if (error.message === 'Query timed out' || error.name === 'NeonDbError') {
        console.warn(`Query failed (attempt ${i + 1}/${MAX_RETRIES}): ${error.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Query failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
}

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }

  // Wrap the sql function to include retry logic
  const wrappedSql: any = (strings: TemplateStringsArray, ...values: any[]) => {
    return executeWithRetry(() => sql(strings, ...values));
  }

  // Copy properties from the original sql function, like `sql.query`
  Object.assign(wrappedSql, {
    query: (query: string, params: any[]) => {
      return executeWithRetry(() => sql.query(query, params));
    }
  });

  return wrappedSql as NeonQueryFunction<false, false> & { query: (query: string, params: any[]) => Promise<any> };
}


// --- Table Creation ---
export async function createTables() {
  const sql = getDb();
  await sql`DROP TABLE IF EXISTS password_reset_tokens CASCADE;`;
  await sql`DROP TABLE IF EXISTS push_subscriptions CASCADE;`;
  await sql`DROP TABLE IF EXISTS notifications CASCADE;`;
  await sql`DROP TABLE IF EXISTS comment_likes CASCADE;`;
  await sql`DROP TABLE IF EXISTS likes CASCADE;`;
  await sql`DROP TABLE IF EXISTS comments CASCADE;`;
  await sql`DROP TABLE IF EXISTS slides CASCADE;`;
  await sql`DROP TABLE IF EXISTS users CASCADE;`;

  await sql`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      "displayName" VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      avatar VARCHAR(255),
      "role" VARCHAR(50) DEFAULT 'user',
      "sessionVersion" INTEGER DEFAULT 1
    );
  `;
  await sql`
    CREATE TABLE password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
    );
  `;
  await sql`
    CREATE TABLE slides (
        id VARCHAR(255) PRIMARY KEY,
        "userId" UUID REFERENCES users(id),
        username VARCHAR(255) NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        "slideType" VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        content TEXT,
        "accessLevel" VARCHAR(50) DEFAULT 'PUBLIC',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(x, y)
    );
  `;
  await sql`
    CREATE TABLE comments (
        id VARCHAR(255) PRIMARY KEY,
        "slideId" VARCHAR(255) REFERENCES slides(id),
        "userId" UUID REFERENCES users(id),
        "parentId" VARCHAR(255) REFERENCES comments(id) DEFAULT NULL,
        text TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
      CREATE TABLE comment_likes (
          "commentId" VARCHAR(255) REFERENCES comments(id),
          "userId" UUID REFERENCES users(id),
          PRIMARY KEY ("commentId", "userId")
      );
    `;
  await sql`
    CREATE TABLE likes (
        "slideId" VARCHAR(255) REFERENCES slides(id),
        "userId" UUID REFERENCES users(id),
        PRIMARY KEY ("slideId", "userId")
    );
  `;
  await sql`
    CREATE TABLE notifications (
        id VARCHAR(255) PRIMARY KEY,
        "userId" UUID REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        link VARCHAR(255),
        "fromUserId" UUID REFERENCES users(id),
        read BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    CREATE TABLE push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id) UNIQUE,
        subscription JSONB NOT NULL,
        is_pwa_installed BOOLEAN DEFAULT FALSE
    );
  `;
}

// --- User Functions ---
export async function findUserById(id: string): Promise<User | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM users WHERE id = ${id};`;
    return result[0] as User || null;
}
export async function findUserByEmail(email: string): Promise<User | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM users WHERE email = ${email};`;
    return result[0] as User || null;
}
export async function findUserByUsername(username: string): Promise<User | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM users WHERE username = ${username};`;
    return result[0] as User || null;
}
export async function getAllUsers(): Promise<User[]> {
    const sql = getDb();
    const result = await sql`SELECT * FROM users;`;
    return result as unknown as User[];
}
export async function createUser(userData: Omit<User, 'id' | 'sessionVersion' | 'password'> & {password: string | null}): Promise<User> {
    const sql = getDb();
    const { username, displayName, email, password, avatar, role } = userData;
    // Ensure avatar is NULL if undefined or empty string to differentiate from default URL logic in UI
    const avatarValue = avatar || null;
    const result = await sql`
        INSERT INTO users (username, "displayName", email, password, avatar, "role")
        VALUES (${username}, ${displayName}, ${email}, ${password}, ${avatarValue}, ${role || 'user'})
        RETURNING *;
    `;
    return result[0] as User;
}
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const sql = getDb();

    const keys = Object.keys(updates).filter(key => (updates as any)[key] !== undefined);
    if (keys.length === 0) {
        // No updates provided, just return the user
        return findUserById(userId);
    }

    // Dynamically build the SET clause
    const setClauses = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const values = keys.map(key => (updates as any)[key]);

    // Add the userId to the values array for the WHERE clause
    values.push(userId);
    const whereClauseIndex = values.length;

    const query = `
        UPDATE users
        SET ${setClauses}
        WHERE id = $${whereClauseIndex}
        RETURNING *;
    `;

    const result = await sql.query(query, values);

    return (result[0] as User) || null;
}
export async function deleteUser(userId: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id;`;
    return result.length > 0;
}

// --- Password Reset Token Functions ---
export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO password_reset_tokens ("userId", token, "expiresAt")
        VALUES (${userId}, ${token}, ${expiresAt.toISOString()});
    `;
}

export async function getPasswordResetToken(token: string): Promise<{ id: string, userId: string, expiresAt: Date } | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM password_reset_tokens WHERE token = ${token};`;
    if (result.length === 0) {
        return null;
    }
    const dbToken = result[0];
    return {
        id: dbToken.id as string,
        userId: dbToken.userId as string,
        expiresAt: new Date(dbToken.expiresAt as string),
    };
}

export async function deletePasswordResetToken(id: string): Promise<void> {
    const sql = getDb();
    await sql`DELETE FROM password_reset_tokens WHERE id = ${id};`;
}


export async function pingDb() {
  const sql = getDb();
  await sql`SELECT 1`;
}

// --- Slide Functions ---
export async function createSlide(slideData: any): Promise<any> {
    const sql = getDb();
    const id = 'slide_' + Math.random().toString(36).substring(2, 15);
    const { userId, username, x, y, type, data, accessLevel, avatar } = slideData;

    const title = data?.title || (type === 'html' ? 'HTML Slide' : 'Video Slide');
    // Store complex objects in content, including avatar which isn't a column in the table
    // We move accessLevel to a proper column, but keep access in content for legacy if needed, though DTO uses accessLevel now
    const content = JSON.stringify({
        data,
        avatar
    });

    await sql`
        INSERT INTO slides (id, "userId", username, x, y, "slideType", title, content, "accessLevel")
        VALUES (${id}, ${userId}, ${username}, ${x}, ${y}, ${type}, ${title}, ${content}, ${accessLevel || 'PUBLIC'});
    `;
    return { id };
}

// --- Like Functions ---
export async function toggleLike(slideId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const sql = getDb();
    const isLikedResult = await sql`SELECT 1 FROM likes WHERE "slideId" = ${slideId} AND "userId" = ${userId};`;
    const isLiked = isLikedResult.length > 0;

    if (isLiked) {
        // Atomic decrement
        await sql`
            BEGIN;
            DELETE FROM likes WHERE "slideId" = ${slideId} AND "userId" = ${userId};
            UPDATE slides SET "likeCount" = "likeCount" - 1 WHERE id = ${slideId};
            COMMIT;
        `;
    } else {
        // Atomic increment
        await sql`
            BEGIN;
            INSERT INTO likes ("slideId", "userId") VALUES (${slideId}, ${userId});
            UPDATE slides SET "likeCount" = "likeCount" + 1 WHERE id = ${slideId};
            COMMIT;
        `;
    }

    // Fetch updated count directly from slide
    const slideResult = await sql`SELECT "likeCount" FROM slides WHERE id = ${slideId}`;
    const likeCount = slideResult[0].likeCount as number;

    return { newStatus: isLiked ? 'unliked' : 'liked', likeCount };
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    // Switch to Prisma logic as requested by the user for 'Like Logic'
    // "Ensure the backend logic actually writes to the CommentLike table."
    const existingLike = await prisma.commentLike.findUnique({
        where: {
            userId_commentId: {
                userId,
                commentId,
            },
        },
    });

    if (existingLike) {
        await prisma.commentLike.delete({
            where: {
                id: existingLike.id,
            },
        });
    } else {
        await prisma.commentLike.create({
            data: {
                userId,
                commentId,
            },
        });
    }

    const likeCount = await prisma.commentLike.count({
        where: {
            commentId
        }
    });

    return { newStatus: existingLike ? 'unliked' : 'liked', likeCount };
}

// --- Comment Functions ---

export async function getComments(
  slideId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<{ comments: CommentWithRelations[]; nextCursor: string | null }> {
  const { limit = 20, cursor } = options;

  // Use Prisma Client to fetch comments with relations
  const comments = await prisma.comment.findMany({
    where: {
      slideId,
      parentId: null // Fetch only top-level threads
    },
    take: limit + 1, // Fetch one extra to determine next cursor
    skip: cursor ? 1 : 0, // Skip the cursor itself if present
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      likes: true, // Needed to map to likedBy
      replies: {
        include: {
          author: true,
          likes: true
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: { likes: true }
      }
    }
  });

  let nextCursor: string | null = null;
  if (comments.length > limit) {
    const nextItem = comments.pop(); // Remove the extra item
    nextCursor = nextItem?.id || null;
  }

  // Map Prisma result to DTO (transform likes -> likedBy)
  const mappedComments = comments.map(c => ({
    ...c,
    likedBy: c.likes.map(l => l.userId),
    replies: c.replies.map(r => ({
      ...r,
      likedBy: r.likes.map(l => l.userId),
      replies: [], // Max depth 1 for now, or recursive if needed
      _count: { likes: r.likes.length }
    }))
  }));

  return { comments: mappedComments, nextCursor };
}

export async function addComment(
  slideId: string,
  userId: string,
  text: string,
  parentId?: string | null
): Promise<CommentWithRelations> {
  // Transaction ensures both actions happen or fail together
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        slideId,
        authorId: userId,
        text,
        parentId: parentId || null
      },
      include: {
        author: true,
        likes: true
      }
    }),
    prisma.slide.update({
      where: { id: slideId },
      data: { commentCount: { increment: 1 } }
    })
  ]);

  // Return DTO shape
  return {
    ...comment,
    likedBy: [],
    replies: [],
    _count: { likes: 0 }
  };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
    // Verify ownership first
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, slideId: true }
    });

    if (!comment) {
        throw new Error("Comment not found");
    }

    if (comment.authorId !== userId) {
        // Optionally allow admin to delete? For now, strict ownership.
        throw new Error("Unauthorized");
    }

    // Transaction to delete comment and decrement count
    await prisma.$transaction([
        prisma.comment.delete({
            where: { id: commentId }
        }),
        prisma.slide.update({
            where: { id: comment.slideId },
            data: { commentCount: { decrement: 1 } }
        })
    ]);
}


// --- Notification Functions ---
export async function createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const sql = getDb();
    const { userId, type, text, link, fromUser } = notificationData;
    const fromUserId = fromUser?.id;
    const result = await sql`
        INSERT INTO notifications ("userId", type, text, link, "fromUserId")
        VALUES (${userId}, ${type}, ${text}, ${link}, ${fromUserId})
        RETURNING *;
    `;
    return result[0] as Notification;
}
export async function getNotifications(userId: string): Promise<Notification[]> {
    const sql = getDb();
    const results = await sql`
        SELECT n.*, u.username as "fromUsername", u.avatar as "fromUserAvatar"
        FROM notifications n
        LEFT JOIN users u ON n."fromUserId" = u.id
        WHERE n."userId" = ${userId}
        ORDER BY n."createdAt" DESC;
    `;
    return (results as unknown as any[]).map(n => {
        const { fromUsername, fromUserAvatar, ...rest } = n;
        return {
            ...rest,
            fromUser: n.fromUserId ? {
                id: n.fromUserId,
                username: fromUsername,
                avatar: fromUserAvatar,
            } : undefined,
        };
    }) as Notification[];
}
export async function markNotificationAsRead(notificationId: string): Promise<Notification | null> {
    const sql = getDb();
    const result = await sql`UPDATE notifications SET read = true WHERE id = ${notificationId} RETURNING *;`;
    return result[0] as Notification || null;
}
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const sql = getDb();
    const result = await sql`SELECT COUNT(*) as count FROM notifications WHERE "userId" = ${userId} AND read = false;`;
    return parseInt(result[0].count as string, 10);
}

// --- Push Subscription Functions ---
export async function savePushSubscription(userId: string, subscription: object, isPwaInstalled: boolean): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO push_subscriptions ("userId", subscription, is_pwa_installed)
        VALUES (${userId}, ${JSON.stringify(subscription)}, ${isPwaInstalled})
        ON CONFLICT ("userId") DO UPDATE
        SET subscription = EXCLUDED.subscription, is_pwa_installed = EXCLUDED.is_pwa_installed;
    `;
}

export async function getPushSubscriptions(options: { userId?: string, role?: string, isPwaInstalled?: boolean }): Promise<any[]> {
    const sql = getDb();
    const { userId, role, isPwaInstalled } = options;

    if (userId) {
        return await sql`SELECT ps.subscription FROM push_subscriptions ps WHERE ps."userId" = ${userId}`;
    }

    if (role) {
        return await sql`
            SELECT ps.subscription FROM push_subscriptions ps
            JOIN users u ON ps."userId" = u.id
            WHERE u.role = ${role}`;
    }

    if (isPwaInstalled !== undefined) {
        return await sql`
            SELECT ps.subscription FROM push_subscriptions ps
            WHERE ps.is_pwa_installed = ${isPwaInstalled}`;
    }

    // This case is for when options is empty, meaning get all subscriptions.
    return await sql`SELECT ps.subscription FROM push_subscriptions ps`;
}

// --- Slide Management Functions (Added) ---

export async function getSlide(id: string): Promise<Slide | null> {
    const sql = getDb();
    // Refactored: Reads directly from denormalized counters on 'slides' table.
    const result = await sql`
        SELECT s.*
        FROM slides s
        WHERE s.id = ${id}
    `;

    if (result.length === 0) return null;

    const row = result[0];
    const content = row.content ? JSON.parse(row.content) : {};
    return {
        id: row.id,
        x: row.x,
        y: row.y,
        type: row.slideType as 'video' | 'html',
        userId: row.userId,
        username: row.username,
        createdAt: new Date(row.createdAt).toISOString(),
        initialLikes: row.likeCount || 0,
        initialComments: row.commentCount || 0,
        isLiked: false,
        avatar: content.avatar || '',
        accessLevel: row.accessLevel || 'PUBLIC',
        data: content.data,
    } as Slide;
}

export async function getSlides(options: { limit?: number, cursor?: string, currentUserId?: string }): Promise<Slide[]> {
    const sql = getDb();
    const { limit = 5, cursor, currentUserId } = options;

    let result;

    // Use Date object for cursor comparison if provided
    const cursorDate = cursor ? new Date(parseInt(cursor)) : null;

    // Refactored: Reads directly from denormalized counters.
    // Removed complex JOINs for counts.
    // 'isLiked' still requires a subquery or join, but exists() is efficient.

    if (cursorDate) {
        result = await sql`
            SELECT
                s.*,
                u.avatar as "userAvatar",
                ${currentUserId ? sql`EXISTS(SELECT 1 FROM likes WHERE "slideId" = s.id AND "userId" = ${currentUserId})` : false} as "isLiked"
            FROM slides s
            LEFT JOIN users u ON s."userId" = u.id
            WHERE s."createdAt" < ${cursorDate}
            ORDER BY s."createdAt" DESC
            LIMIT ${limit}
        `;
    } else {
        result = await sql`
            SELECT
                s.*,
                u.avatar as "userAvatar",
                ${currentUserId ? sql`EXISTS(SELECT 1 FROM likes WHERE "slideId" = s.id AND "userId" = ${currentUserId})` : false} as "isLiked"
            FROM slides s
            LEFT JOIN users u ON s."userId" = u.id
            ORDER BY s."createdAt" DESC
            LIMIT ${limit}
        `;
    }

    return result.map((row: any) => {
        const content = row.content ? JSON.parse(row.content) : {};
        return {
            id: row.id,
            x: row.x,
            y: row.y,
            type: row.slideType as 'video' | 'html',
            userId: row.userId,
            username: row.username,
            createdAt: new Date(row.createdAt).toISOString(),
            initialLikes: row.likeCount || 0,
            initialComments: row.commentCount || 0,
            isLiked: !!row.isLiked,
            avatar: row.userAvatar || content.avatar || '',
            accessLevel: row.accessLevel || 'PUBLIC',
            data: content.data,
        } as Slide;
    });
}

export async function getAllSlides(): Promise<Slide[]> {
    const sql = getDb();
    // Refactored: Reads directly from denormalized counters.
    const result = await sql`
        SELECT s.*
        FROM slides s
        ORDER BY s."createdAt" DESC;
    `;

    return result.map((row: any) => {
        const content = row.content ? JSON.parse(row.content) : {};
        return {
            id: row.id,
            x: row.x,
            y: row.y,
            type: row.slideType as 'video' | 'html',
            userId: row.userId,
            username: row.username,
            createdAt: new Date(row.createdAt).toISOString(),
            initialLikes: row.likeCount || 0,
            initialComments: row.commentCount || 0,
            isLiked: false,
            avatar: content.avatar || '',
            accessLevel: row.accessLevel || 'PUBLIC',
            data: content.data,
        } as Slide;
    });
}

export async function updateSlide(id: string, updates: Partial<Slide>): Promise<void> {
    const sql = getDb();

    // Fetch current slide to preserve existing content fields
    const slides = await sql`SELECT * FROM slides WHERE id = ${id}`;
    if (slides.length === 0) throw new Error('Slide not found');
    const slide = slides[0];
    const content = slide.content ? JSON.parse(slide.content) : {};

    // Update content fields if provided in updates
    if (updates.data) content.data = updates.data;
    // access is now accessLevel and stored in a column, but we might want to keep it in content for legacy read?
    // DTO doesn't have 'access' anymore, so updates (Partial<Slide>) won't have it.
    if (updates.avatar) content.avatar = updates.avatar;

    const newContent = JSON.stringify(content);

    // Also update top-level columns if necessary.
    let title = slide.title;
    if (updates.data && 'title' in updates.data) {
         title = (updates.data as any).title;
    }

    await sql`
        UPDATE slides
        SET content = ${newContent}, title = ${title}
        WHERE id = ${id}
    `;
}

export async function deleteSlide(id: string): Promise<void> {
    const sql = getDb();

    // Delete likes associated with the slide
    await sql`DELETE FROM likes WHERE "slideId" = ${id}`;

    // Delete comments and their likes
    // first delete comment_likes for comments of this slide
    await sql`
        DELETE FROM comment_likes
        WHERE "commentId" IN (SELECT id FROM comments WHERE "slideId" = ${id})
    `;

    // then delete comments
    await sql`DELETE FROM comments WHERE "slideId" = ${id}`;

    // finally delete the slide
    await sql`DELETE FROM slides WHERE id = ${id}`;
}
