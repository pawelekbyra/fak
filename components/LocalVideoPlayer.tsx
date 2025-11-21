"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { VideoSlideDTO } from '@/lib/dto';
import { cn } from '@/lib/utils';

interface LocalVideoPlayerProps {
    slide: VideoSlideDTO;
    isActive: boolean;
    shouldLoad: boolean;
}

const LocalVideoPlayer = ({ slide, isActive, shouldLoad }: LocalVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isHlsSupported, setIsHlsSupported] = useState(false);
    const [showManualPlay, setShowManualPlay] = useState(false);

    // Global state
    const { isPlaying, isMuted, setIsMuted, togglePlay } = useStore(
        (state) => ({
            isPlaying: state.isPlaying,
            isMuted: state.isMuted,
            setIsMuted: state.setIsMuted,
            togglePlay: state.togglePlay,
        }),
        shallow
    );

    // 1. Initialize HLS or Native
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const { hlsUrl, mp4Url } = slide.data;

        if (Hls.isSupported() && hlsUrl) {
            setIsHlsSupported(true);
            const hls = new Hls({
                autoStartLoad: false, // Wait until active/priority to load
            });
            hlsRef.current = hls;
            hls.attachMedia(video);

            // Cleanup hls instance on unmount
            return () => {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
             // Native HLS (iOS)
             video.src = hlsUrl;
        } else if (mp4Url) {
             // Fallback MP4
             video.src = mp4Url;
        }
    }, [slide.data.hlsUrl, slide.data.mp4Url]);

    // 2. Manage Loading Logic (Preloading)
    useEffect(() => {
        const hls = hlsRef.current;
        if (!hls || !slide.data.hlsUrl) return;

        if (shouldLoad) {
            if (hls.url !== slide.data.hlsUrl) {
                hls.loadSource(slide.data.hlsUrl);
            }
            hls.startLoad();
        } else {
            // Optional: aggressive cleanup to save bandwidth
            hls.stopLoad();
        }
    }, [shouldLoad, slide.data.hlsUrl]);

    // 3. Manage Playback Logic & Autoplay Error Handling
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const shouldPlay = isActive && isPlaying;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setShowManualPlay(false);
                    })
                    .catch(error => {
                        console.warn("Autoplay prevented", error);
                        setShowManualPlay(true);
                    });
            }
        } else {
            video.pause();
            setShowManualPlay(false);
        }

    }, [isActive, isPlaying]);

    const handleManualPlay = () => {
        const video = videoRef.current;
        if (!video) return;

        // Force unmute and play
        setIsMuted(false);
        if (!isPlaying) togglePlay();

        video.muted = false;
        video.play()
            .then(() => setShowManualPlay(false))
            .catch(e => console.error("Manual play failed", e));
    };

    // 3. Handle Mute
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // 4. Dispatch Progress Events (for UI controls)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let rafId: number;

        const update = () => {
            if (isActive && !video.paused && !video.ended) {
                 const event = new CustomEvent('video-progress', {
                    detail: {
                        currentTime: video.currentTime,
                        duration: video.duration || 0
                    }
                });
                window.dispatchEvent(event);
            }
            rafId = requestAnimationFrame(update);
        };

        if (isActive && isPlaying) {
             rafId = requestAnimationFrame(update);
        }

        return () => cancelAnimationFrame(rafId);
    }, [isActive, isPlaying]);


    return (
        <div className="absolute inset-0 z-0 bg-black">
             <video
                ref={videoRef}
                className={cn(
                    "w-full h-full object-cover",
                    // Optional: Fade in when active?
                    // For now, keep it simple to avoid glitches
                )}
                loop
                playsInline
                muted={isMuted} // Initial mute state
                poster={slide.data.poster}
            />

            {/* Manual Play Overlay for Autoplay Blocks */}
            {showManualPlay && isActive && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 cursor-pointer"
                    onClick={handleManualPlay}
                >
                    <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all hover:scale-110">
                        {/* Large Play Icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-16 h-16 text-white"
                        >
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                        <p className="mt-2 text-white font-semibold text-sm text-center">Tap to play</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalVideoPlayer;
