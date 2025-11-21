"use client";

import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import { SlideDTO, HtmlSlideDTO } from '@/lib/dto';
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

// --- Prop Types for Sub-components ---
interface HtmlContentProps {
  slide: HtmlSlideDTO;
}
interface SlideUIProps {
    slide: SlideDTO;
}

// --- Sub-components ---

const HtmlContent = ({ slide }: HtmlContentProps) => {
  const sanitizedHtml = useMemo(() => {
    if (!slide.data?.htmlContent) return '';
    return typeof window !== 'undefined'
      ? DOMPurify.sanitize(slide.data.htmlContent)
      : slide.data.htmlContent;
  }, [slide.data?.htmlContent]);

  if (!slide.data?.htmlContent) return null;

  return (
    <div
      className="w-full h-full overflow-y-auto bg-white"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

const SlideUI = ({ slide }: SlideUIProps) => {
    const {
        activeModal,
        setActiveModal,
        togglePlay,
        isPlaying,
        isMuted,
        seekTo,
        setIsMuted
    } = useStore(state => ({
        activeModal: state.activeModal,
        setActiveModal: state.setActiveModal,
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
                <Image src={slide.avatar || '/avatars/default.png'} alt={slide.username} width={40} height={40} className="rounded-full border-2 border-white" />
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
}

const Slide = memo<SlideProps>(({ slide }) => {
    const { isLoggedIn } = useUser();
    const showSecretOverlay = slide.access === 'secret' && !isLoggedIn;

    const renderContent = () => {
        switch (slide.type) {
            case 'video':
                return <div className="w-full h-full bg-transparent" />;
            case 'html':
                return <HtmlContent slide={slide as HtmlSlideDTO} />;
            default:
                return <div className="w-full h-full bg-gray-800 flex items-center justify-center"><p>Unsupported slide type</p></div>;
        }
    };

    return (
        <div className={cn(
            "relative w-full h-full bg-black",
            showSecretOverlay && "blur-md brightness-50"
        )}>
            {renderContent()}
            {showSecretOverlay ? <SecretOverlay /> : <SlideUI slide={slide} />}
        </div>
    );
});

Slide.displayName = 'Slide';
export default Slide;
