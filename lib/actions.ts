'use server';

import { db } from '@/lib/db';
import { auth, signIn, signOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { put, del } from '@vercel/blob';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';

export interface ActionResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | string>;
}

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

// Removed standalone uploadAvatar as it is now integrated into updateUserProfile
// or can be kept if needed for other parts, but the prompt implies a replacement logic.
// For safety, I'll keep the export but it won't be used by the new ProfileTab.
export async function uploadAvatar(formData: FormData): Promise<ActionResponse> {
  // Legacy/Unused in new ProfileTab flow, kept for backward compatibility if needed
  return { success: false, message: 'Please use the profile save button.' };
}

export async function updateUserProfile(prevState: ActionResponse | any, formData: FormData): Promise<ActionResponse> {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;

    const displayName = formData.get('displayName') as string;
    const bio = formData.get('bio') as string;
    const email = formData.get('email') as string;
    const avatarFile = formData.get('avatar') as File;

    // New fields handling
    const emailConsentRaw = formData.get('emailConsent');
    const emailLanguage = formData.get('emailLanguage') as string;
    const emailConsent = emailConsentRaw === 'true' || emailConsentRaw === 'on';

    if (!email || !email.includes('@')) {
        return { success: false, message: 'Invalid email address.' };
    }

    // Update Object
    const updateData: any = {
        displayName: displayName || undefined,
        bio: bio || undefined,
        email: email,
        emailConsent: emailConsent,
        emailLanguage: emailConsent ? (emailLanguage || 'pl') : null
    };

    try {
        // Handle File Upload
        if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
            // Delete old avatar if it exists and is not the default one
            if (session.user.avatar && session.user.avatar !== DEFAULT_AVATAR_URL) {
                try {
                   // Only attempt to delete if it looks like a Vercel Blob URL to avoid errors with external/legacy URLs
                   if (session.user.avatar.includes('.public.blob.vercel-storage.com')) {
                       await del(session.user.avatar);
                   }
                } catch (e) {
                    console.warn("Failed to delete old avatar:", e);
                }
            }

            const blob = await put(avatarFile.name, avatarFile, { access: 'public' });
            updateData.avatar = blob.url;
        } else if (!session.user.avatar) {
             // If user has no avatar, set it to default
             updateData.avatar = DEFAULT_AVATAR_URL;
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

export async function changePassword(prevState: ActionResponse | any, formData: FormData): Promise<ActionResponse> {
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

import { sendAccountDeletedEmail } from '@/lib/email';

export async function deleteAccount(prevState: ActionResponse | any, formData: FormData): Promise<ActionResponse> {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;
    const userEmail = session.user.email;

    try {
        await db.deleteUser(userId);

        if (userEmail) {
            sendAccountDeletedEmail(userEmail).catch(err => console.error('Failed to send deletion email', err));
        }

        await signOut({ redirect: false });
        revalidatePath('/');
        return { success: true, message: 'Twoje konto zostało usunięte. Zostałeś wylogowany.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to delete account.' };
    }
}
