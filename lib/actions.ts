'use server';

import { db } from '@/lib/db';
import { auth, signIn, signOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import * as bcrypt from '@node-rs/bcrypt';
import { AuthError } from 'next-auth';
import fs from 'fs/promises';
import path from 'path';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function uploadAvatar(formData: FormData) {
  // Legacy/Unused in new ProfileTab flow
  return { success: false, message: 'Please use the profile save button.' };
}

export async function updateUserProfile(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;

    const displayName = formData.get('displayName') as string;
    const email = formData.get('email') as string;
    const avatarFile = formData.get('avatar') as File;
    const emailConsentRaw = formData.get('emailConsent');
    const emailLanguage = formData.get('emailLanguage') as string;

    // Parse emailConsent (checkbox sends 'on' if checked, or nothing if unchecked)
    const emailConsent = emailConsentRaw === 'on' || emailConsentRaw === 'true';

    if (!email || !email.includes('@')) {
        return { success: false, message: 'Invalid email address.' };
    }

    // Update Object
    const updateData: any = {
        displayName: displayName || undefined,
        email: email,
        emailConsent: emailConsent,
        // If consent is false, language doesn't matter, but user wants to save it as chosen if consent is true.
        // If consent is false, we can either clear it or keep it.
        // The request says: "uzytkownik decyduje czy chce dostawac mailin i jesli tak to w jakim jezyku."
        // We will save the language if provided.
        emailLanguage: emailLanguage || 'pl'
    };

    try {
        // Handle File Upload
        if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

            // Ensure directory exists
            await fs.mkdir(uploadsDir, { recursive: true });

            // Generate unique filename
            const ext = path.extname(avatarFile.name);
            const filename = `avatar-${userId}-${Date.now()}${ext}`;
            const filepath = path.join(uploadsDir, filename);

            // Convert file to buffer and write to disk
            const arrayBuffer = await avatarFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(filepath, buffer);

            // Update data with new avatar path
            updateData.avatar = `/uploads/${filename}`;
        }

        // Check if email is taken by another user (if email changed)
        if (email !== session.user.email) {
            const existingUser = await db.findUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return { success: false, message: 'Email already in use.' };
            }
        }

        await db.updateUser(userId, updateData);

        revalidatePath('/');
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { success: false, message: error.message || 'Failed to update profile.' };
    }
}

export async function changePassword(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, message: 'All fields are required.' };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
    }

    if (newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
    }

    try {
        const user = await db.findUserById(userId);
        if (!user || !user.password) {
             return { success: false, message: 'User not found or password not set.' };
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { success: false, message: 'Incorrect current password.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.updateUser(userId, {
            password: hashedPassword,
            sessionVersion: (user.sessionVersion || 0) + 1
        });

        return { success: true, message: 'Password changed successfully.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to change password.' };
    }
}

export async function deleteAccount(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;

    try {
        await db.deleteUser(userId);
        await signOut({ redirect: false });
        revalidatePath('/');
        return { success: true, message: 'Account deleted successfully.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to delete account.' };
    }
}
