"use client";

import React, { memo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { SlideDTO, HtmlSlideDTO, VideoSlideDTO, CommentWithRelations } from '@/lib/dto';
import { useStore } from '@/store/useStore';
import VideoControls from './VideoControls';
import { shallow } from 'zustand/shallow';
import { AnimatePresence, motion } from 'framer-motion';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import Sidebar from './Sidebar';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import SecretOverlay from './SecretOverlay';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import LocalVideoPlayer from './LocalVideoPlayer';
import { useQueryClient } from '@tanstack/react-query';
import { CommentSchema } from '@/lib/validators';
import { z } from 'zod';

import HtmlContent from './HtmlContent';

interface SlideUIProps {
    slide: SlideDTO;
}

const SlideUI = ({ slide }: SlideUIProps) => {
    const {
        togglePlay,
        isPlaying,
        isMuted,
        seekTo,
        setIsMuted
    } = useStore(state => ({
        togglePlay: state.togglePlay,
        isPlaying: state.isPlaying,
        isMuted: state.isMuted,
        seekTo: state.seekTo,
        setIsMuted: state.setIsMuted,
    }), shallow);

    const [showPlaybackIcon, setShowPlaybackIcon] = useState(false);
    const iconTimer = useRef<NodeJS.Timeout | null>(null);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            togglePlay();
            setShowPlaybackIcon(true);
            if (iconTimer.current) {
                clearTimeout(iconTimer.current);
            }
            iconTimer.current = setTimeout(() => {
                setShowPlaybackIcon(false);
            }, 800);
        }
    }

    useEffect(() => {
        return () => {
            if (iconTimer.current) {
                clearTimeout(iconTimer.current);
            }
        };
    }, []);

    const isVideoSlide = slide.type === 'video';

    return (
      <div
        className="absolute inset-0 z-10 p-4 flex flex-col justify-end text-white"
        onClick={handleContainerClick}
      >
        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        <AnimatePresence>
            {showPlaybackIcon && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0, scale: 1.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="bg-black/50 rounded-full p-4">
                        {isPlaying ? (
                            <PlayIcon className="w-12 h-12 text-white" />
                        ) : (
                            <PauseIcon className="w-12 h-12 text-white" />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* UI Controls Container */}
        <div className="relative z-20 pointer-events-none">
            <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                <Image 
                    src={slide.avatar || DEFAULT_AVATAR_URL} 
                    alt={slide.username || 'User'} 
                    width={40} 
                    height={40} 
                    className="rounded-full border-2 border-white" 
                />
                <p className="font-bold text-lg">{slide.username}</p>
            </div>

            {slide.data && 'title' in slide.data && <h2 className="text-xl font-semibold mb-1">{slide.data.title}</h2>}
            {slide.data && 'description' in slide.data && <p className="text-sm opacity-90">{slide.data.description}</p>}
        </div>

        <Sidebar
            slideId={slide.id}
            initialLikes={slide.initialLikes}
            initialIsLiked={slide.isLiked}
            commentsCount={slide.initialComments}
            authorId={slide.userId}
        />

        {isVideoSlide && (
            <div className="pointer-events-auto">
                <VideoControls
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    onTogglePlay={togglePlay}
                    onToggleMute={() => setIsMuted(!isMuted)}
                    onSeek={seekTo}
                />
            </div>
        )}
      </div>
    );
};

// --- Main Slide Component ---

interface SlideProps {
    slide: SlideDTO;
    priorityLoad?: boolean;
}

const Slide = memo<SlideProps>(({ slide, priorityLoad = false }) => {
    const { isLoggedIn } = useUser();
    const activeSlideId = useStore(state => state.activeSlide?.id);
    const isActive = activeSlideId === slide.id;
    const showSecretOverlay = slide.access === 'secret' && !isLoggedIn;
    const queryClient = useQueryClient();

    // Prefetch comments logic (Safe implementation)
    useEffect(() => {
        if (isActive && slide?.id) {
            try {
                queryClient.prefetchQuery({
                    queryKey: ['comments', slide.id],
                    queryFn: async () => {
                          try {
                             const res = await fetch(`/api/comments?slideId=${slide.id}&limit=50`);
                             if (!res.ok) return []; 
                             const data = await res.json();
                             if (!data.success || !data.comments) return [];

                             const parsedComments = z.array(CommentSchema).parse(data.comments);
                             return parsedComments.map((c: any) => ({
                               ...c,
                               author: c.author || c.user,
                               replies: c.replies || [],
                               likedBy: c.likedBy || []
                             })) as CommentWithRelations[];
                          } catch (e) {
                             console.error("Prefetch error:", e);
                             return [];
                          }
                    },
                    staleTime: 1000 * 60 * 5,
                });
            } catch (err) {
                console.error("Prefetch setup error:", err);
            }
        }
    }, [isActive, slide?.id, queryClient]);

    const renderContent = () => {
        switch (slide.type) {
            case 'video':
                return <LocalVideoPlayer slide={slide as VideoSlideDTO} isActive={isActive} shouldLoad={priorityLoad} />;
            case 'html':
                return (
                    <HtmlContent
                        data={(slide as HtmlSlideDTO).data}
                        isActive={isActive}
                    />
                );
            default:
                return <div className="w-full h-full bg-gray-800 flex items-center justify-center"><p>Unsupported slide type</p></div>;
        }
    };

    return (
        <div className={cn(
            "relative w-full h-full z-10 bg-black", 
            showSecretOverlay && "blur-md brightness-50"
        )}>
            {renderContent()}
            {showSecretOverlay ? <SecretOverlay /> : <SlideUI slide={slide} />}
        </div>
    );
});

Slide.displayName = 'Slide';
export default Slide;
