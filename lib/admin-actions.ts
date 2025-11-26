"use server";

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

// Helper for generating random password
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Musisz być zalogowany.');
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Brak uprawnień. Wymagana rola administratora.');
    }
    return session.user.id;
}

export async function getUsers(page = 1, limit = 10, search = '', roleFilter = 'all') {
    try {
        await checkAdmin();

        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (roleFilter !== 'all') {
            where.role = roleFilter;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    avatar: true, // prioritizing 'avatar' field as per component usage
                    role: true,
                    createdAt: true,
                }
            }),
            prisma.user.count({ where })
        ]);

        return {
            success: true,
            users,
            pages: Math.ceil(total / limit)
        };

    } catch (error: any) {
        console.error('getUsers error:', error);
        return { success: false, message: error.message || 'Błąd pobierania użytkowników.' };
    }
}

export async function deleteUser(userId: string) {
    try {
        const adminId = await checkAdmin();

        if (userId === adminId) {
            return { success: false, message: 'Nie możesz usunąć własnego konta.' };
        }

        const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
        if (!userToDelete) {
            return { success: false, message: 'Użytkownik nie istnieje.' };
        }

        // Manual Cascade Delete Transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete Push Subscriptions
            await tx.pushSubscription.deleteMany({ where: { userId } });

            // 2. Delete Notifications (sent and received)
            await tx.notification.deleteMany({
                where: {
                    OR: [
                        { userId: userId },
                        { fromUserId: userId }
                    ]
                }
            });

            // 3. Delete Comment Likes (by user)
            await tx.commentLike.deleteMany({ where: { userId } });

            // 4. Delete Video Likes (by user) - Note: Like model uses authorId
            await tx.like.deleteMany({ where: { authorId: userId } });

            // 5. Handle User's Comments
            // First find all comments by user to delete their relations if necessary
            // Note: Comment replies cascade on delete of parent, but we are deleting the author.
            // When we delete a comment, its replies should be handled.
            // We can delete all comments by author.
            const userComments = await tx.comment.findMany({ where: { authorId: userId }, select: { id: true } });
            if (userComments.length > 0) {
                const commentIds = userComments.map(c => c.id);
                // Delete likes on these comments
                await tx.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
                // Replies will be deleted via cascade if we delete the comments?
                // Schema says: parent Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
                // So deleting a comment deletes its replies.
                // We just need to delete the comments themselves.
                await tx.comment.deleteMany({ where: { authorId: userId } });
            }

            // 6. Handle User's Slides
            const userSlides = await tx.slide.findMany({ where: { userId }, select: { id: true } });
            if (userSlides.length > 0) {
                const slideIds = userSlides.map(s => s.id);

                // Delete likes on these slides
                await tx.like.deleteMany({ where: { slideId: { in: slideIds } } });

                // Delete comments on these slides
                // We need to find all comments on these slides first to delete their sub-relations (likes, replies)
                // Or rely on the previous step? No, these are comments BY OTHERS on THIS USER'S slides.
                const slideComments = await tx.comment.findMany({ where: { slideId: { in: slideIds } }, select: { id: true } });
                const slideCommentIds = slideComments.map(c => c.id);

                if (slideCommentIds.length > 0) {
                     await tx.commentLike.deleteMany({ where: { commentId: { in: slideCommentIds } } });
                     await tx.comment.deleteMany({ where: { slideId: { in: slideIds } } });
                }

                // Delete the slides
                await tx.slide.deleteMany({ where: { userId } });
            }

            // 7. Delete Accounts and Sessions (Cascade should handle this if defined, but being safe)
            await tx.account.deleteMany({ where: { userId } });
            await tx.session.deleteMany({ where: { userId } });

            // 8. Finally Delete User
            await tx.user.delete({ where: { id: userId } });
        });

        revalidatePath('/admin');
        return { success: true, message: 'Użytkownik został usunięty.' };

    } catch (error: any) {
        console.error('deleteUser error:', error);
        return { success: false, message: error.message || 'Błąd usuwania użytkownika.' };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        const adminId = await checkAdmin();

        if (userId === adminId && newRole !== 'admin') {
             return { success: false, message: 'Nie możesz odebrać sobie roli administratora.' };
        }

        if (!['user', 'admin', 'patron', 'author'].includes(newRole)) {
            return { success: false, message: 'Nieprawidłowa rola.' };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });

        revalidatePath('/admin');
        return { success: true, message: `Rola użytkownika zmieniona na ${newRole}.` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Błąd aktualizacji roli.' };
    }
}

export async function createUserByAdmin(email: string) {
    try {
        await checkAdmin();

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, message: 'Użytkownik z tym adresem email już istnieje.' };
        }

        const tempPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Ensure username is unique
        let username = email.split('@')[0];
        const checkUsername = await prisma.user.findUnique({ where: { username } });
        if (checkUsername) {
            username = `${username}_${Math.floor(Math.random() * 1000)}`;
        }

        // Create User
        // Note: username is required @unique in schema, so we keep the random logic for it.
        // But displayName should be the email part or empty, and we set isFirstLogin = true
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username: username,
                displayName: email.split('@')[0], // Set initial displayName to email prefix, user must change it
                role: 'user', // Default role
                isFirstLogin: true,
                emailConsent: true,
                emailLanguage: 'pl'
            }
        });

        // Send Welcome Email
        const emailResult = await sendWelcomeEmail(email, tempPassword);

        if (!emailResult.success) {
            // We return success true because the user WAS created, but warn about email.
            return {
                success: true,
                message: `Użytkownik utworzony. Błąd wysyłki email. Hasło: ${tempPassword}`
            };
        }

        revalidatePath('/admin');
        return { success: true, message: 'Użytkownik został utworzony. Email powitalny wysłany.' };

    } catch (error: any) {
        console.error('createUserByAdmin error:', error);
        return { success: false, message: error.message || 'Błąd tworzenia użytkownika.' };
    }
}
