"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Trash2,
    MoreVertical,
    Shield,
    User as UserIcon,
    Loader2,
    ChevronLeft,
    ChevronRight,
    BadgeCheck,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { getUsers, deleteUser, updateUserRole } from '@/lib/admin-actions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

// Helper for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function UserManagementTable() {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const debouncedSearch = useDebounce(searchTerm, 500);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter]);

    // Data Fetching
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-users', page, debouncedSearch, roleFilter],
        queryFn: async () => {
            const res = await getUsers(page, 10, debouncedSearch, roleFilter);
            if (!res.success) throw new Error(res.message);
            return res;
        }
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: (res) => {
            if (res.success) {
                addToast(res.message || 'Użytkownik usunięty', 'success');
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            } else {
                addToast(res.message || 'Błąd', 'error');
            }
        },
        onError: (err: any) => {
            addToast(err.message, 'error');
        }
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string, role: string }) => updateUserRole(userId, role),
        onSuccess: (res) => {
            if (res.success) {
                addToast(res.message || 'Rola zmieniona', 'success');
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            } else {
                addToast(res.message || 'Błąd', 'error');
            }
        },
        onError: (err: any) => {
            addToast(err.message, 'error');
        }
    });

    const handleDelete = async (userId: string) => {
        if (confirm('Czy na pewno chcesz usunąć tego użytkownika? Tej operacji nie można cofnąć.')) {
            deleteMutation.mutate(userId);
        }
    };

    const handleRoleChange = (userId: string, newRole: string) => {
        roleMutation.mutate({ userId, role: newRole });
    };

    const roles = [
        { value: 'all', label: 'Wszystkie role' },
        { value: 'user', label: 'Użytkownik' },
        { value: 'patron', label: 'Patron' },
        { value: 'author', label: 'Twórca' },
        { value: 'admin', label: 'Admin' },
    ];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Szukaj po emailu, nazwie..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {roles.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRoleFilter(r.value)}
                            className={cn(
                                "px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                                roleFilter === r.value
                                    ? "bg-pink-500/20 border-pink-500 text-pink-500"
                                    : "bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-white/50">
                        <Loader2 size={32} className="animate-spin mb-4 text-pink-500" />
                        <p>Ładowanie użytkowników...</p>
                    </div>
                ) : isError ? (
                    <div className="p-20 flex flex-col items-center justify-center text-red-400">
                        <AlertCircle size={32} className="mb-4" />
                        <p>Wystąpił błąd podczas pobierania danych.</p>
                    </div>
                ) : (data?.users || []).length === 0 ? (
                    <div className="p-20 text-center text-white/30">
                        Brak użytkowników spełniających kryteria.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/40 text-xs uppercase text-white/40 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Użytkownik</th>
                                    <th className="px-6 py-4">Rola</th>
                                    <th className="px-6 py-4">Data dołączenia</th>
                                    <th className="px-6 py-4 text-right">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(data?.users || []).map((user: any) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative border border-white/10 flex-shrink-0">
                                                    {user.avatar ? (
                                                        <Image
                                                            src={user.avatar}
                                                            alt={user.username}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-white/30">
                                                            <UserIcon size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.displayName || user.username}</div>
                                                    <div className="text-xs text-white/50">{user.email}</div>
                                                    <div className="text-[10px] text-white/30 font-mono mt-0.5 opacity-50">{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                user.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                user.role === 'author' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                user.role === 'patron' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                                                "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                            )}>
                                                {user.role}
                                                {user.role === 'author' && <BadgeCheck size={12} className="ml-1" />}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/60">
                                            {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#1c1c1e] border-white/10 text-white min-w-[160px]">
                                                    <DropdownMenuLabel>Zarządzaj</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleRoleChange(user.id, 'user')}
                                                        className="hover:bg-white/10 cursor-pointer text-xs"
                                                    >
                                                        Ustaw jako: User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleRoleChange(user.id, 'patron')}
                                                        className="hover:bg-white/10 cursor-pointer text-xs"
                                                    >
                                                        Ustaw jako: Patron
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleRoleChange(user.id, 'author')}
                                                        className="hover:bg-white/10 cursor-pointer text-xs"
                                                    >
                                                        Ustaw jako: Twórca
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleRoleChange(user.id, 'admin')}
                                                        className="text-red-400 hover:bg-red-500/10 cursor-pointer text-xs"
                                                    >
                                                        Ustaw jako: Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(user.id)}
                                                        className="text-red-500 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-500"
                                                    >
                                                        <Trash2 size={14} className="mr-2" />
                                                        Usuń konto
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {data && (data.pages || 0) > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm text-white/60">
                        Strona {page} z {data.pages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(data.pages || 1, p + 1))}
                        disabled={page === (data.pages || 1)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
