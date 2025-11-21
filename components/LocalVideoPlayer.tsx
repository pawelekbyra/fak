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
}

const LocalVideoPlayer = ({ slide, isActive, isNext }: LocalVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Global state for mute is acceptable as it's a global UI control
    const { isMuted, isPlaying } = useStore(
        (state) => ({
            isMuted: state.isMuted,
            isPlaying: state.isPlaying
        }),
        shallow
    );

    // Step 1: Initialize HLS.js and IntersectionObserver (runs once)
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const { hlsUrl, mp4Url } = slide.data;

        // A. Initialize HLS.js
        if (Hls.isSupported() && hlsUrl) {
            const hls = new Hls({
                autoStartLoad: false,
                capLevelToPlayerSize: true,
            });
            hlsRef.current = hls;
            hls.attachMedia(videoElement);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
            videoElement.src = hlsUrl;
        } else if (mp4Url) {
            videoElement.src = mp4Url;
        }

        // B. Initialize IntersectionObserver ("Double Check")
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    videoElement.pause();
                }
            },
            { threshold: 0.5 } // Trigger when 50% of the element is visible
        );
        observer.observe(videoElement);

        // C. Cleanup function
        return () => {
            observer.disconnect();
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [slide.data]);

    // Step 2: Smart Preloading Logic
    useEffect(() => {
        const hls = hlsRef.current;
        if (!hls) return;

        const shouldLoadData = isActive || isNext;

        if (shouldLoadData) {
            hls.loadSource(slide.data.hlsUrl);
            hls.startLoad();
        } else {
            hls.stopLoad();
        }
    }, [isActive, isNext, slide.data.hlsUrl]);

    // Step 3: Playback Logic
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const shouldPlay = isActive && isPlaying;

        if (shouldPlay) {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay was prevented.", error);
                });
            }
        } else {
            videoElement.pause();
            if (!isActive && videoElement.currentTime > 0) {
                 videoElement.currentTime = 0;
            }
        }
    }, [isActive, isPlaying]);

    // Step 4: Mute Logic
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
                muted={isMuted} // Mute initially based on global state
                poster={slide.data.poster}
            />
        </div>
    );
};

export default LocalVideoPlayer;
// EOL comment