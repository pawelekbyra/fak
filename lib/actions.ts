'use server';

import { put, del } from '@vercel/blob';
import { db } from '@/lib/db';
import { auth, signIn, signOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import * as bcrypt from '@node-rs/bcrypt';
import { AuthError } from 'next-auth';

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
  const session = await auth();
  if (!session || !session.user) {
    return { success: false, message: 'Not authenticated' };
  }
  const currentUser = session.user;

  const file = formData.get('avatar') as File;
  if (!file) {
    return { success: false, message: 'No file provided.' };
  }

  // Attempt to delete old avatar if it exists and is a blob URL
  // We need to fetch the user from DB to get the current avatar URL,
  // as the session might be stale regarding the avatar.
  const dbUser = await db.findUserById(currentUser.id!);
  const currentAvatar = dbUser?.avatar || currentUser.image; // use DB or session fallback

  if (currentAvatar && currentAvatar.includes('public.blob.vercel-storage.com')) {
      try {
          await del(currentAvatar);
      } catch (error) {
          console.error("Failed to delete old avatar:", error);
      }
  }

  const blob = await put(file.name, file, {
    access: 'public',
  });

  const avatarUrl = blob.url;

  const updatedUser = await db.updateUser(currentUser.id!, { avatar: avatarUrl });
  if (!updatedUser) {
    return { success: false, message: 'Failed to update user record.' };
  }

  revalidatePath('/');
  return { success: true, url: avatarUrl };
}

export async function updateUserProfile(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || !session.user) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
        return { success: false, message: 'Invalid email address.' };
    }

    const displayName = `${firstName || ''} ${lastName || ''}`.trim();

    try {
        // Check if email is taken by another user (if email changed)
        if (email !== session.user.email) {
            const existingUser = await db.findUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return { success: false, message: 'Email already in use.' };
            }
        }

        await db.updateUser(userId, {
            displayName: displayName || undefined,
            email: email
        });

        revalidatePath('/');
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update profile.' };
    }
}

export async function changePassword(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || !session.user) {
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
    if (!session || !session.user) {
        return { success: false, message: 'Not authenticated' };
    }
    const userId = session.user.id!;

    try {
        await db.deleteUser(userId);
        await signOut({ redirect: false }); // Sign out without immediate redirect if in SPA
        revalidatePath('/');
        return { success: true, message: 'Account deleted successfully.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to delete account.' };
    }
}
