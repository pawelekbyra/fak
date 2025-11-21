"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { VideoSlideDTO } from '@/lib/dto';

interface LocalVideoPlayerProps {
    slide: VideoSlideDTO;
    isActive: boolean;
    shouldLoad: boolean;
    isPlaying: boolean;
    isMuted: boolean;
}

const LocalVideoPlayer = ({ slide, isActive, shouldLoad, isPlaying, isMuted }: LocalVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Inicjalizacja HLS i "Double Check" Intersection Observer
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !containerRef.current) return;

        const { hlsUrl, mp4Url } = slide.data;

        // "Double Check" Intersection Observer
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the video is not intersecting (not visible), forcefully pause it.
                if (!entry.isIntersecting) {
                    video.pause();
                }
            },
            { threshold: 0.5 } // Trigger when 50% of the video is out of view
        );
        observer.observe(containerRef.current);

        if (Hls.isSupported() && hlsUrl) {
            const hls = new Hls({
                autoStartLoad: false,
                capLevelToPlayerSize: true,
            });
            hlsRef.current = hls;
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
             video.src = hlsUrl;
        } else if (mp4Url) {
             video.src = mp4Url;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, [slide.data.hlsUrl, slide.data.mp4Url]);

    // 2. Logika Preloadingu (Smart Loading)
    useEffect(() => {
        const hls = hlsRef.current;
        if (!hls || !slide.data.hlsUrl) return;

        if (shouldLoad) {
            if (hls.url !== slide.data.hlsUrl) {
                 hls.loadSource(slide.data.hlsUrl);
                 hls.startLoad();
            }
        }
    }, [shouldLoad, slide.data.hlsUrl]);

    // 3. Logika Odtwarzania
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive && isPlaying) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay was prevented.", error);
                });
            }
        } else {
            video.pause();
        }
    }, [isActive, isPlaying]);

    // 4. Obsługa Mute
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 bg-black">
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
