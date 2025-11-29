'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import UserBadge from './UserBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthorProfile } from '@/lib/queries';

interface PatronProfileModalProps {
    patronId: string;
    onClose: () => void;
}

export function PatronProfileModal({ patronId, onClose }: PatronProfileModalProps) {
    const { data: profile, isLoading, isError } = useQuery({
        queryKey: ['author', patronId],
        queryFn: () => fetchAuthorProfile(patronId),
        enabled: !!patronId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[10100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                className="relative flex flex-col w-full max-w-sm bg-neutral-900 text-white rounded-2xl shadow-lg border border-neutral-700 mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                    <header className="relative flex items-center justify-center p-4 border-b border-neutral-800 shrink-0">
                        <h2 className="text-lg font-semibold">Profil Użytkownika</h2>
                        <button onClick={onClose} className="absolute p-1 right-3 top-3 rounded-full hover:bg-neutral-700">
                            <X size={20} />
                        </button>
                    </header>

                    <main className="p-6">
                        {isLoading ? (
                            <PatronProfileSkeleton />
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <p>Nie udało się załadować profilu.</p>
                            </div>
                        ) : profile ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="relative w-24 h-24 mb-4 rounded-full">
                                    <Image
                                      src={profile.avatarUrl || DEFAULT_AVATAR_URL}
                                      alt={profile.username}
                                      layout="fill"
                                      objectFit="cover"
                                      className="rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold">{profile.username}</h3>
                                <UserBadge role={profile.role} className="mb-2" />
                                {profile.bio ? (
                                    <p className="text-neutral-400 text-sm leading-relaxed mt-2">{profile.bio}</p>
                                ) : (
                                    <p className="text-neutral-600 text-sm italic">Brak opisu.</p>
                                )}
                            </div>
                        ) : null}
                    </main>
                </motion.div>
        </motion.div>
    );
}

const PatronProfileSkeleton = () => (
    <div className="flex flex-col items-center">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60" />
    </div>
)
