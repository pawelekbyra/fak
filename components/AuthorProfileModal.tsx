'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface AuthorProfile {
    id: string;
    username: string;
    avatarUrl: string;
    bio: string;
    slides: { id: string; thumbnailUrl: string; title: string; }[];
}

export function AuthorProfileModal() {
    const { isAuthorProfileModalOpen, authorProfileId, closeAuthorProfileModal, jumpToSlide } = useStore();
    const [profile, setProfile] = useState<AuthorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchAuthorProfile() {
            if (isAuthorProfileModalOpen && authorProfileId) {
                setIsLoading(true);
                setProfile(null);
                try {
                    const res = await fetch(`/api/author/${authorProfileId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                    } else {
                        console.error("Failed to fetch author profile", res.statusText);
                    }
                } catch (error) {
                    console.error("Failed to fetch author profile", error);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchAuthorProfile();
    }, [isAuthorProfileModalOpen, authorProfileId]);

    const handleSlideClick = (slideId: string) => {
        jumpToSlide(slideId);
        closeAuthorProfileModal();
    };

    if (!isAuthorProfileModalOpen) return null;

    return (
        <AnimatePresence>
            {isAuthorProfileModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={closeAuthorProfileModal}
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
                            <button onClick={closeAuthorProfileModal} className="absolute p-1 right-3 top-3 rounded-full hover:bg-neutral-700">
                                <X size={20} />
                            </button>
                        </header>

                        <main className="flex-1 p-6 overflow-y-auto">
                            {isLoading ? (
                                <AuthorProfileSkeleton />
                            ) : profile ? (
                                <>
                                    <div className="flex items-center space-x-4 mb-6">
                                        <Image
                                          src={profile.avatarUrl || '/avatars/default.png'}
                                          alt={profile.username}
                                          width={80}
                                          height={80}
                                          className="rounded-full border-2 border-pink-500 object-cover"
                                        />
                                        <div>
                                            <h3 className="text-2xl font-bold">{profile.username}</h3>
                                            <p className="text-neutral-400 text-sm mt-1">{profile.bio}</p>
                                        </div>
                                    </div>
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
                                                <Image src={slide.thumbnailUrl} alt={slide.title} layout="fill" objectFit="cover" />
                                                <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                                                    <p className="text-xs text-white font-semibold truncate">{slide.title}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <p>Could not load profile.</p>
                                    <div className="text-xs text-gray-500">
                                        (This is likely because /api/author/[id] is not implemented or DB is empty)
                                    </div>
                                </div>
                            )}
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
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
