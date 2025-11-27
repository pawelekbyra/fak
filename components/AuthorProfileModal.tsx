'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Instagram, Grid, Heart, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { UserBadge } from './UserBadge';
import { fetchAuthorProfile } from '@/lib/queries';
import { AuthorProfile } from '@/types';
import { formatCount } from '@/lib/utils';

interface AuthorProfileModalProps {
    authorId: string;
    onClose: () => void;
}

export function AuthorProfileModal({ authorId, onClose }: AuthorProfileModalProps) {
    const { jumpToSlide, openTippingModal, closeAuthorProfileModal } = useStore();
    const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'private'>('videos');
    const [isPatron, setIsPatron] = useState(false); // Mock state for "Become a Patron"

    const { data: profile, isLoading, isError } = useQuery<AuthorProfile>({
        queryKey: ['author', authorId],
        queryFn: () => fetchAuthorProfile(authorId),
        enabled: !!authorId,
    });

    // Mock stats generation based on authorId (deterministic for specific user, random otherwise)
    const stats = useMemo(() => {
        if (!profile) return { followers: 0, likes: 0 };
        // Use authorId chars to seed a pseudo-random number
        const seed = authorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return {
            followers: 10 + (seed * 123) % 1000, // Mock "Patrons" count
            likes: 5000 + (seed * 456) % 5000000
        };
    }, [profile, authorId]);

    const handleSlideClick = (slideId: string) => {
        jumpToSlide(slideId);
        onClose();
    };

    const togglePatron = () => {
        closeAuthorProfileModal();
        openTippingModal({ fromLeft: true });
    };

    if (!authorId) return null;

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="absolute inset-0 z-[70] bg-[#121212] flex flex-col overflow-hidden"
            style={{
                height: '100%',
                width: '100%',
            }}
        >
            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">

                {/* Top Bar - Now inside scroll view and relative (not sticky/fixed to viewport) */}
                <div
                    className="flex items-center justify-between px-1 bg-black text-white border-b border-white/10 z-10 relative"
                    style={{
                      height: 'var(--topbar-height)',
                      paddingTop: 'var(--safe-area-top)',
                    }}
                >
                    <div className="flex justify-start w-12 pl-0">
                        <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors">
                            <ChevronLeft size={28} />
                        </button>
                    </div>
                    <div className="flex justify-center flex-1">
                        <span className="font-bold text-base truncate max-w-[200px] text-white">
                            {profile?.username || '...'}
                        </span>
                    </div>
                    <div className="w-12" /> {/* Spacer to balance the back button */}
                </div>
                {isLoading ? (
                    <AuthorProfileSkeleton />
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-white/50">
                        <p>Nie udało się załadować profilu.</p>
                        <button onClick={onClose} className="text-white underline">Zamknij</button>
                    </div>
                ) : profile ? (
                    <div className="pb-20">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center pt-4 px-4">
                            {/* Avatar */}
                            <div className="relative mb-2">
                                <Image
                                    src={profile.avatarUrl || DEFAULT_AVATAR_URL}
                                    alt={profile.username}
                                    width={96}
                                    height={96}
                                    className="rounded-full object-cover w-24 h-24 border border-white/10"
                                />
                            </div>

                            {/* Name */}
                            <h1 className="text-lg font-bold text-white mb-1">@{profile.username}</h1>

                            {/* Badge */}
                            <div className="mb-2">
                                <UserBadge role={profile.role} />
                            </div>

                            {/* Bio (Description) */}
                            {profile.bio ? (
                                <p className="text-sm text-center text-white/90 whitespace-pre-wrap mb-3 px-2 leading-tight max-w-sm">
                                    {profile.bio}
                                </p>
                            ) : (
                                <p className="text-sm text-center text-white/40 mb-3 italic">Brak opisu</p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 mt-1 mb-4">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-white text-lg">{formatCount(profile.slides.length)}</span>
                                    <span className="text-xs text-white/60">Filmików</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-white text-lg">{formatCount(stats.followers)}</span>
                                    <span className="text-xs text-white/60">Patronów</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-white text-lg">{formatCount(stats.likes)}</span>
                                    <span className="text-xs text-white/60">Polubień</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 w-full max-w-xs mb-4">
                                <button
                                    onClick={togglePatron}
                                    className={`flex-1 py-2.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2
                                        ${isPatron
                                            ? 'bg-[#3A3A3A] text-white hover:bg-[#4A4A4A]'
                                            : 'bg-[#FE2C55] text-white hover:bg-[#E0274B]'
                                        }`}
                                >
                                    {isPatron ? (
                                        <>Jesteś Patronem</>
                                    ) : (
                                        <>Zostań Patronem</>
                                    )}
                                </button>
                                <button className="px-3 py-2.5 bg-[#3A3A3A] rounded hover:bg-[#4A4A4A] text-white transition-colors">
                                    <Instagram size={20} />
                                </button>
                                <button className="px-3 py-2.5 bg-[#3A3A3A] rounded hover:bg-[#4A4A4A] text-white transition-colors">
                                    <ChevronLeft className="rotate-180" size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 mt-2 sticky top-0 bg-[#121212] z-10" style={{ top: 0 }}>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`flex-1 flex justify-center items-center py-3 relative transition-colors ${activeTab === 'videos' ? 'bg-[#1a1a1a] text-pink-500' : 'bg-[#121212] text-white/40 hover:bg-[#1a1a1a]/50'}`}
                            >
                                <Grid size={20} />
                                {activeTab === 'videos' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 w-full h-[2px] bg-pink-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('liked')}
                                className={`flex-1 flex justify-center items-center py-3 relative transition-colors ${activeTab === 'liked' ? 'bg-[#1a1a1a] text-pink-500' : 'bg-[#121212] text-white/40 hover:bg-[#1a1a1a]/50'}`}
                            >
                                <Heart size={20} />
                                {activeTab === 'liked' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 w-full h-[2px] bg-pink-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('private')}
                                className={`flex-1 flex justify-center items-center py-3 relative transition-colors ${activeTab === 'private' ? 'bg-[#1a1a1a] text-pink-500' : 'bg-[#121212] text-white/40 hover:bg-[#1a1a1a]/50'}`}
                            >
                                <Lock size={20} />
                                {activeTab === 'private' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 w-full h-[2px] bg-pink-500" />
                                )}
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="min-h-[300px]">
                            {activeTab === 'videos' ? (
                                <div className="grid grid-cols-3 gap-[1px]">
                                    {profile.slides && profile.slides.length > 0 ? profile.slides.map(slide => (
                                        <div
                                            key={slide.id}
                                            className="aspect-[3/4] bg-neutral-800 relative cursor-pointer overflow-hidden group"
                                            onClick={() => handleSlideClick(slide.id)}
                                        >
                                            <Image
                                                src={slide.thumbnailUrl || 'https://placehold.co/600x800/222/FFF?text=Video'}
                                                alt={slide.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 33vw, 150px"
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                            <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white drop-shadow-md">
                                                <div className="flex items-center gap-1">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                    <span className="text-[10px] font-bold">
                                                        {formatCount(Math.floor(Math.random() * 50000))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-3 py-20 flex flex-col items-center text-white/40">
                                            <p className="text-sm">Użytkownik nie dodał jeszcze żadnych filmów.</p>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'liked' ? (
                                <div className="flex flex-col items-center justify-center min-h-[300px] text-white/40 space-y-2 py-10">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <Heart size={32} />
                                    </div>
                                    <h3 className="font-bold text-white">Polubione filmy tego użytkownika są prywatne</h3>
                                    <p className="text-xs text-center px-8">Filmy polubione przez użytkownika @{profile.username} są widoczne tylko dla niego.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[300px] text-white/40 space-y-2 py-10">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <Lock size={32} />
                                    </div>
                                    <h3 className="font-bold text-white">Te filmy są prywatne</h3>
                                    <p className="text-xs text-center px-8">Tylko użytkownik @{profile.username} może je zobaczyć.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
}

const AuthorProfileSkeleton = () => (
    <div className="w-full h-full p-4 flex flex-col items-center pt-10">
        <Skeleton className="w-24 h-24 rounded-full mb-4 bg-white/10" />
        <Skeleton className="h-6 w-32 mb-2 bg-white/10" />
        <Skeleton className="h-4 w-20 mb-6 bg-white/10" />

        <div className="flex gap-8 mb-6">
            <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-10 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
            <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-10 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
            <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-10 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
        </div>

        <div className="flex gap-2 w-full max-w-xs mb-8">
            <Skeleton className="flex-1 h-10 rounded bg-white/10" />
            <Skeleton className="w-10 h-10 rounded bg-white/10" />
        </div>

        <div className="w-full grid grid-cols-3 gap-1">
            <Skeleton className="aspect-[3/4] bg-white/10" />
            <Skeleton className="aspect-[3/4] bg-white/10" />
            <Skeleton className="aspect-[3/4] bg-white/10" />
            <Skeleton className="aspect-[3/4] bg-white/10" />
            <Skeleton className="aspect-[3/4] bg-white/10" />
            <Skeleton className="aspect-[3/4] bg-white/10" />
        </div>
    </div>
)
