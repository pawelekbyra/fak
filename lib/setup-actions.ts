"use server";

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from '@node-rs/bcrypt';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { setSessionCookie } from '@/lib/auth'; // We might need this if we manually update session, but revalidating path might be enough if session is refreshed.

// Validation Schemas
const PasswordSchema = z.string()
  .min(8, 'Hasło musi mieć co najmniej 8 znaków.')
  .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną dużą literę.')
  .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę.');

const DisplayNameSchema = z.string()
  .min(3, 'Nazwa wyświetlana musi mieć co najmniej 3 znaki.')
  .max(30, 'Nazwa wyświetlana może mieć maksymalnie 30 znaków.')
  .regex(/^[a-zA-Z0-9_ ]+$/, 'Nazwa może zawierać tylko litery, cyfry, spacje i podkreślniki.');

const FirstLoginSetupSchema = z.object({
  newPassword: PasswordSchema,
  newPasswordConfirm: z.string(),
  displayName: DisplayNameSchema,
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: "Hasła muszą być identyczne.",
  path: ["newPasswordConfirm"],
});

export async function checkDisplayNameAvailability(displayName: string) {
    // Basic sanitization
    const name = displayName.trim();
    if (!name || name.length < 3) return false;

    // Check case-insensitive
    const existing = await prisma.user.findFirst({
        where: {
            displayName: {
                equals: name,
                mode: 'insensitive'
            }
        },
        select: { id: true }
    });

    return !existing;
}

export async function completeFirstLoginSetup(data: z.infer<typeof FirstLoginSetupSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Sesja wygasła. Zaloguj się ponownie.' };
        }

        const userId = session.user.id;

        // Verify User Status (Double check)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isFirstLogin: true }
        });

        if (!user || !user.isFirstLogin) {
            return { success: false, message: 'Konfiguracja konta została już zakończona lub użytkownik nie istnieje.' };
        }

        // Validate Inputs
        const validation = FirstLoginSetupSchema.safeParse(data);
        if (!validation.success) {
            // safeParse returns a discriminated union. If success is false, validation.error exists.
            return { success: false, message: validation.error.issues[0].message };
        }

        const { newPassword, displayName } = validation.data;

        // Validate Uniqueness again (Race condition check)
        const isAvailable = await checkDisplayNameAvailability(displayName);
        if (!isAvailable) {
            return { success: false, message: 'Ta nazwa wyświetlana jest już zajęta.' };
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                displayName: displayName,
                isFirstLogin: false,
                emailVerified: new Date(), // Implicit verification since they logged in and set it up
                // We might also want to update sessionVersion to invalidate other potential sessions,
                // but keeping current session alive is preferred here.
            }
        });

        // Revalidate to update UI
        revalidatePath('/');

        return { success: true, message: 'Konfiguracja zakończona pomyślnie.' };

    } catch (error: any) {
        console.error('completeFirstLoginSetup error:', error);
        return { success: false, message: 'Wystąpił błąd podczas zapisywania zmian.' };
    }
}
