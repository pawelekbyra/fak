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
}

const LocalVideoPlayer = ({ slide, isActive }: LocalVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isHlsSupported, setIsHlsSupported] = useState(false);

    // Global state
    const { isPlaying, isMuted } = useStore(
        (state) => ({
            isPlaying: state.isPlaying,
            isMuted: state.isMuted,
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
                autoStartLoad: false, // Wait until active to load
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

    // 2. Manage Loading & Playback based on Activity
    useEffect(() => {
        const video = videoRef.current;
        const hls = hlsRef.current;

        if (!video) return;

        // Load Source logic
        if (isActive) {
            if (hls && slide.data.hlsUrl) {
                // If we haven't loaded the source yet or URL changed
                if (hls.url !== slide.data.hlsUrl) {
                     hls.loadSource(slide.data.hlsUrl);
                     hls.startLoad();
                }
            }
        } else {
            // Optional: aggressive cleanup to save bandwidth
            // if (hls) hls.stopLoad();
        }

        // Playback logic
        const shouldPlay = isActive && isPlaying;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Auto-play was prevented
                    // console.warn("Autoplay prevented", error);
                });
            }
        } else {
            video.pause();
        }

    }, [isActive, isPlaying, slide.data.hlsUrl]);

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
        </div>
    );
};

export default LocalVideoPlayer;
