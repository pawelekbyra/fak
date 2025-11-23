'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { UserBadge } from './UserBadge';
import { fetchAuthorProfile } from '@/lib/queries';
import { AuthorProfile } from '@/types';

interface AuthorProfileModalProps {
    authorId: string;
    onClose: () => void;
}

export function AuthorProfileModal({ authorId, onClose }: AuthorProfileModalProps) {
    const { jumpToSlide } = useStore();
    const { data: profile, isLoading, isError } = useQuery<AuthorProfile>({
        queryKey: ['author', authorId],
        queryFn: () => fetchAuthorProfile(authorId),
        enabled: !!authorId,
    });

    const handleSlideClick = (slideId: string) => {
        jumpToSlide(slideId);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                className="relative flex flex-col w-full max-w-md bg-neutral-900 text-white rounded-2xl shadow-lg border border-neutral-700 mx-4 max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                    <header className="relative flex items-center justify-center p-4 border-b border-neutral-800 shrink-0">
                        <h2 className="text-lg font-semibold">Author Profile</h2>
                        <button onClick={onClose} className="absolute p-1 right-3 top-3 rounded-full hover:bg-neutral-700">
                            <X size={20} />
                        </button>
                    </header>

                    <main className="flex-1 p-6 overflow-y-auto">
                        {isLoading ? (
                            <AuthorProfileSkeleton />
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <p>Could not load profile.</p>
                            </div>
                        ) : profile ? (
                            <>
                                <div className="flex items-center space-x-4 mb-4">
                                    <Image
                                      src={profile.avatarUrl || DEFAULT_AVATAR_URL}
                                      alt={profile.username}
                                      width={80}
                                      height={80}
                                      className="rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] object-cover"
                                    />
                                    <div>
                                        <h3 className="text-2xl font-bold">{profile.username}</h3>
                                        <UserBadge role={profile.role} />
                                    </div>
                                </div>
                                {profile.bio && (
                                    <p className="text-neutral-400 text-sm mb-6">{profile.bio}</p>
                                )}
                                <h4 className="text-lg font-semibold mb-4 text-neutral-300">Slides</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {profile.slides.map(slide => (
                                        <motion.div
                                            key={slide.id}
                                            className="aspect-video bg-neutral-800 rounded-md overflow-hidden cursor-pointer relative"
                                            onClick={() => handleSlideClick(slide.id)}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <Image
                                                src={slide.thumbnailUrl || 'https://placehold.co/600x400?text=No+Cover'}
                                                alt={slide.title}
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                            <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                                                <p className="text-xs text-white font-semibold truncate">{slide.title}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </main>
                </motion.div>
        </motion.div>
    );
}

const AuthorProfileSkeleton = () => (
    <div>
        <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-60" />
            </div>
        </div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-3 gap-2">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="aspect-video w-full rounded-md" />
        </div>
    </div>
)
