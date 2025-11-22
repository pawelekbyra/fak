"use server";

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from '@node-rs/bcrypt';
import { Resend } from 'resend';

// Helper for generating random password
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

export async function createUserByAdmin(email: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: 'Musisz być zalogowany.' };
        }

        // Verify ADMIN role
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        // Use lowercase 'admin' to match typical convention and Prisma schema default (lower case)
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Brak uprawnień. Wymagana rola administratora.' };
        }

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

        // Send Email via Resend
        // Use environment variable for API key.
        // User stated: "klucze resend sa skonfigurowane w vercelu jako sekret jako resendAPI"
        // Standard Resend SDK looks for RESEND_API_KEY, but we can pass it explicitly.
        const resendApiKey = process.env.resendAPI || process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.warn("Resend API Key (resendAPI) is missing!");
            return { success: true, message: `Użytkownik utworzony, ale brak klucza API email. Hasło: ${tempPassword}` };
        }

        const resend = new Resend(resendApiKey);

        const { error } = await resend.emails.send({
            from: 'Ting Tong <onboarding@resend.dev>', // Default testing domain, or verified domain if set up
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
            // We return success true because the user WAS created, but warn about email.
            // In a strict system we might rollback, but here ease of use prevails.
            return { success: true, message: `Użytkownik utworzony. Błąd wysyłki email: ${error.message}. Hasło: ${tempPassword}` };
        }

        return { success: true, message: 'Użytkownik utworzony i powiadomiony mailowo.' };

    } catch (error: any) {
        console.error("Error creating user:", error);
        return { success: false, message: 'Wystąpił błąd serwera.' };
    }
}
