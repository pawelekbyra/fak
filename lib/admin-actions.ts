"use server";

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from '@node-rs/bcrypt';
import { Resend } from 'resend';
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
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username: username,
                displayName: username,
                role: 'user', // Default role
                emailConsent: true,
                emailLanguage: 'pl'
            }
        });

        const resendApiKey = process.env.resendAPI || process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.warn("Resend API Key (resendAPI) is missing!");
            return { success: true, message: `Użytkownik utworzony, ale brak klucza API email. Hasło: ${tempPassword}` };
        }

        const resend = new Resend(resendApiKey);

        const { error } = await resend.emails.send({
            from: 'Ting Tong <onboarding@resend.dev>',
            to: [email],
            subject: 'Witaj w Ting Tong! Twoje konto zostało utworzone.',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Witaj w Ting Tong!</h2>
                    <p>Twoje konto zostało utworzone przez administratora.</p>
                    <p>Oto Twoje dane do logowania:</p>
                    <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 5px 0;"><strong>Hasło:</strong> ${tempPassword}</p>
                    </div>
                    <p>Zaloguj się i zmień hasło w ustawieniach profilu.</p>
                    <p>Pozdrawiamy,<br>Zespół Ting Tong</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: true, message: `Użytkownik utworzony. Błąd wysyłki email: ${error.message}. Hasło: ${tempPassword}` };
        }

        revalidatePath('/admin');
        return { success: true, message: 'Użytkownik utworzony i powiadomiony mailowo.' };

    } catch (error: any) {
        console.error("Error creating user:", error);
        return { success: false, message: error.message || 'Wystąpił błąd serwera.' };
    }
}

export async function getUsers(page = 1, limit = 10, search = '', role = 'all') {
    try {
        await checkAdmin();

        const skip = (page - 1) * limit;
        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (role && role !== 'all') {
            where.role = role;
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
                    avatar: true,
                    role: true,
                    createdAt: true,
                }
            }),
            prisma.user.count({ where })
        ]);

        return { success: true, users, total, pages: Math.ceil(total / limit) };
    } catch (error: any) {
        return { success: false, message: error.message || 'Błąd pobierania użytkowników.' };
    }
}

export async function deleteUser(userId: string) {
    try {
        const currentAdminId = await checkAdmin();

        if (userId === currentAdminId) {
            return { success: false, message: 'Nie możesz usunąć własnego konta.' };
        }

        // Get user slides to cleanup related data
        const userSlides = await prisma.slide.findMany({
            where: { userId },
            select: { id: true }
        });
        const slideIds = userSlides.map(s => s.id);

        await prisma.$transaction(async (tx) => {
            // 1. Cleanup Push Subscriptions
            await tx.pushSubscription.deleteMany({ where: { userId } });

            // 2. Cleanup Notifications
            await tx.notification.deleteMany({
                where: { OR: [{ userId }, { fromUserId: userId }] }
            });

            // 3. Cleanup Likes (on videos)
            await tx.like.deleteMany({ where: { userId } });

            // 4. Cleanup Comment Likes
            await tx.commentLike.deleteMany({ where: { userId } });

            // 5. Cleanup Comments (and their replies via Cascade usually, but let's be safe)
            // Note: Deleting a user who is an author of a comment.
            // Replies are linked to parentId. If we delete a parent, children go via cascade in DB schema usually.
            await tx.comment.deleteMany({ where: { authorId: userId } });

            // 6. Cleanup Slides Data
            if (slideIds.length > 0) {
                // Delete likes on these slides
                await tx.like.deleteMany({ where: { slideId: { in: slideIds } } });
                // Delete comments on these slides
                // First delete likes on those comments
                // Find comments on these slides first?
                // Actually, simplest is to let constraints handle it if they exist, but they don't for Slide->Comment relation (Slide side).
                // Comments reference Slide.
                await tx.comment.deleteMany({ where: { slideId: { in: slideIds } } });

                // Finally delete slides
                await tx.slide.deleteMany({ where: { id: { in: slideIds } } });
            }

            // 7. Delete Sessions/Accounts (Cascade exists in schema, but explicit is fine)
            await tx.session.deleteMany({ where: { userId } });
            await tx.account.deleteMany({ where: { userId } });

            // 8. Delete User
            await tx.user.delete({ where: { id: userId } });
        });

        revalidatePath('/admin');
        return { success: true, message: 'Użytkownik został usunięty.' };
    } catch (error: any) {
        console.error("Delete user error:", error);
        return { success: false, message: error.message || 'Błąd usuwania użytkownika.' };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        const currentAdminId = await checkAdmin();

        if (userId === currentAdminId) {
            return { success: false, message: 'Nie możesz zmienić własnej roli.' };
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
