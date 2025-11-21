"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { VideoSlideDTO } from '@/lib/dto';

interface LocalVideoPlayerProps {
    slide: VideoSlideDTO;
    isActive: boolean;
    isNext: boolean;
    isPrevious: boolean;
}

const LocalVideoPlayer = ({ slide, isActive, isNext, isPrevious }: LocalVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Global state for controls (play/pause, mute) - still relevant
    const { isPlaying, isMuted } = useStore(
        (state) => ({
            isPlaying: state.isPlaying,
            isMuted: state.isMuted,
        }),
        shallow
    );

    // --- EFFECT 1: HLS Lifecycle Management & "Double Check" Safety ---
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const { hlsUrl, mp4Url } = slide.data;
        let hls: Hls | null = null;

        if (Hls.isSupported() && hlsUrl) {
            hls = new Hls({
                capLevelToPlayerSize: true,
            });
            hlsRef.current = hls;
            hls.attachMedia(video);
        }

        // "Double Check" Intersection Observer
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && video.played.length > 0 && !video.paused) {
                    video.pause();
                }
            },
            { threshold: 0 }
        );
        observer.observe(video);

        // Cleanup function on component unmount
        return () => {
            observer.unobserve(video);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [slide.data.hlsUrl, slide.data.mp4Url]); // Reruns only if URL changes

    // --- EFFECT 2: Smart Loading (Preloading) ---
    useEffect(() => {
        const hls = hlsRef.current;
        const video = videoRef.current;
        if (!video) return;

        const { hlsUrl, mp4Url } = slide.data;
        const shouldLoad = isActive || isNext || isPrevious;

        if (hls && hlsUrl) {
            if (shouldLoad) {
                if (hls.url !== hlsUrl) {
                    hls.loadSource(hlsUrl);
                    hls.startLoad();
                }
            } else {
                 hls.stopLoad();
            }
        } else if (shouldLoad && (mp4Url || hlsUrl)) { // Fallback for native HLS / MP4
            const sourceUrl = hlsUrl || mp4Url; // iOS handles HLS natively
            if (video.src !== sourceUrl) {
                video.src = sourceUrl!;
            }
        }

    }, [isActive, isNext, isPrevious, slide.data.hlsUrl, slide.data.mp4Url]);

    // --- EFFECT 3: Playback Logic ("First Check") ---
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const shouldPlay = isActive && isPlaying;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== "AbortError") {
                        console.warn("Autoplay was prevented.", error);
                    }
                });
            }
        } else {
            video.pause();
            if(!isActive) {
                video.currentTime = 0;
            }
        }
    }, [isActive, isPlaying]);

    // --- EFFECT 4: Mute Handling ---
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    return (
        <div className="absolute inset-0 z-0 bg-black">
             <video
                ref={videoRef}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                poster={slide.data.poster}
            />
        </div>
    );
};

export default LocalVideoPlayer;