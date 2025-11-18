'use server';

import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { User } from './db.interfaces';

export async function getAllUsersAction(): Promise<User[]> {
  const payload = await verifySession();
  if (!payload || !payload.user || payload.user.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  // @ts-ignore
  return db.getAllUsers();
}

export async function updateUserRoleAction(userId: string, role: 'ADMIN' | 'PATRON' | 'TWÓRCA'): Promise<User | null> {
  const payload = await verifySession();
  if (!payload || !payload.user || payload.user.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  // @ts-ignore
  const updatedUser = await db.updateUser(userId, { role });
  revalidatePath('/admin/users');
  return updatedUser;
}
