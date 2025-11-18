'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { getAllUsersAction, updateUserRoleAction } from '@/lib/admin-actions';
import { User } from '@/lib/db.interfaces';

export default function AdminUserManagementPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('You do not have permission to view this page.');
      setLoading(false);
      return;
    }

    async function fetchUsers() {
      try {
        const allUsers = await getAllUsersAction();
        setUsers(allUsers);
      } catch (err) {
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'PATRON' | 'TWÓRCA') => {
    try {
      const updatedUser = await updateUserRoleAction(userId, newRole);
      if (updatedUser) {
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      }
    } catch (err) {
      setError('Failed to update user role.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Username</th>
            <th className="text-left">Email</th>
            <th className="text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as 'ADMIN' | 'PATRON' | 'TWÓRCA')}
                >
                  <option value="PATRON">Patron</option>
                  <option value="TWÓRCA">Twórca</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
