'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Crown, Shield, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { UserBadge } from './UserBadge';

interface AuthorProfile {
    id: string;
    username: string;
    avatarUrl: string;
    bio: string;
    role?: string;
    slides: { id: string; thumbnailUrl: string; title: string; }[];
}

interface AuthorProfileModalProps {
    authorId: string;
    onClose: () => void;
}

const MOCK_PROFILE: AuthorProfile = {
    id: 'mock-1',
    username: 'Mock Author',
    avatarUrl: DEFAULT_AVATAR_URL,
    bio: 'This is a mock profile because the API is missing.',
    role: 'author',
    slides: [
        { id: '1', thumbnailUrl: 'https://placehold.co/600x400?text=Video+1', title: 'Mock Video 1' },
        { id: '2', thumbnailUrl: 'https://placehold.co/600x400?text=Video+2', title: 'Mock Video 2' },
        { id: '3', thumbnailUrl: 'https://placehold.co/600x400?text=Video+3', title: 'Mock Video 3' },
    ]
};

export function AuthorProfileModal({ authorId, onClose }: AuthorProfileModalProps) {
    const { jumpToSlide } = useStore();
    const [profile, setProfile] = useState<AuthorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchAuthorProfile() {
            if (authorId) {
                setIsLoading(true);
                setProfile(null);
                try {
                    // Attempt fetch, fallback to mock
                    const res = await fetch(`/api/author/${authorId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                    } else {
                        console.warn("Failed to fetch author profile, using mock data.");
                         // Simulate delay
                        await new Promise(resolve => setTimeout(resolve, 500));
                        setProfile({ ...MOCK_PROFILE, id: authorId, username: `User ${authorId.slice(0, 5)}` });
                    }
                } catch (error) {
                    console.warn("Error fetching author profile, using mock data.", error);
                    setProfile({ ...MOCK_PROFILE, id: authorId });
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchAuthorProfile();
    }, [authorId]);

    const handleSlideClick = (slideId: string) => {
        jumpToSlide(slideId);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
                        ) : profile ? (
                            <>
                                <div className="flex items-center space-x-4 mb-4">
                                    <Image
                                      src={profile.avatarUrl || DEFAULT_AVATAR_URL}
                                      alt={profile.username}
                                      width={80}
                                      height={80}
                                      className="rounded-full border-2 border-pink-500 object-cover"
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
                            </div>
                        )}
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
