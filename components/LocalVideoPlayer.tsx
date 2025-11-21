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
    shouldLoad?: boolean; // Received for preloading
}

const LocalVideoPlayer = ({ slide, isActive, shouldLoad = false }: LocalVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isReadyToPlay, setIsReadyToPlay] = useState(false);

    // Global state
    const { isPlaying, isMuted } = useStore(
        (state) => ({
            isPlaying: state.isPlaying,
            isMuted: state.isMuted,
        }),
        shallow
    );

    // 1. Initialize HLS (once)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const { hlsUrl, mp4Url } = slide.data;

        if (Hls.isSupported() && hlsUrl) {
            const hls = new Hls({
                autoStartLoad: false, // IMPORTANT: Do not auto load, wait for signal
                capLevelToPlayerSize: true,
                // Optimization for "Instant Start" (ExoPlayer feel)
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                enableWorker: true,
                startLevel: -1, // Auto start level
                backBufferLength: 10, // Keep some back buffer for replays
            });
            hlsRef.current = hls;
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsReadyToPlay(true);
            });

            // Cleanup
            return () => {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
             // Native HLS (iOS)
             video.src = hlsUrl;
             setIsReadyToPlay(true);
        } else if (mp4Url) {
             video.src = mp4Url;
             setIsReadyToPlay(true);
        }
    }, [slide.data.hlsUrl, slide.data.mp4Url]);

    // 2. Preloading Logic (Smart Loading)
    useEffect(() => {
        const hls = hlsRef.current;
        
        // If slide is active OR next in queue (shouldLoad) -> load data
        if ((isActive || shouldLoad) && hls && slide.data.hlsUrl) {
            // Check if not already loaded to avoid duplicates
            // Hls.js internal check or simplistic url check
            // note: hls.url might not always be populated directly depending on version,
            // but safe to call loadSource if we manage state correctly.
            // We can assume if hlsRef exists and we are here, we want to load.

            // We can check if media is already attached and has source
            if (!videoRef.current?.src && !hls.url) {
                 // console.log(`Preloading video ${slide.id}`);
                 hls.loadSource(slide.data.hlsUrl);
                 hls.startLoad();
            } else if (hls.url === slide.data.hlsUrl && !isActive && shouldLoad) {
                // Ensure we are loading if it was stopped?
                hls.startLoad();
            }
        }
    }, [isActive, shouldLoad, slide.data.hlsUrl, slide.id]);

    // 3. Playback Logic (Only Active)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const shouldPlay = isActive && isPlaying;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                   // console.warn("Autoplay prevented", error);
                });
            }
        } else {
            video.pause();
            if (!isActive) {
                // Optional: reset time if needed, but usually keeping it paused is better for "resume" feel
                // unless we want TikTok style reset. TikTok resets usually.
                // video.currentTime = 0; 
            }
        }
    }, [isActive, isPlaying]);

    // 4. Handle Mute
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
