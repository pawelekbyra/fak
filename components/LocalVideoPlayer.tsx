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
    shouldLoad?: boolean; // Odbieramy prop do preloadingu
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

    // 1. Inicjalizacja HLS (tylko raz)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const { hlsUrl, mp4Url } = slide.data;

        if (Hls.isSupported() && hlsUrl) {
            const hls = new Hls({
                autoStartLoad: false, // WAŻNE: Nie ładuj automatycznie, czekaj na sygnał
                capLevelToPlayerSize: true,
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

    // 2. Logika Preloadingu (Smart Loading)
    useEffect(() => {
        const hls = hlsRef.current;
        
        // Jeśli slajd jest aktywny LUB jest następny w kolejce (shouldLoad) -> ładujemy dane
        if ((isActive || shouldLoad) && hls && slide.data.hlsUrl) {
            // Sprawdź, czy już nie załadowano, aby uniknąć duplikatów
            if (hls.url !== slide.data.hlsUrl) {
                 console.log(`Preloading video ${slide.id}`);
                 hls.loadSource(slide.data.hlsUrl);
                 hls.startLoad();
            }
        }
    }, [isActive, shouldLoad, slide.data.hlsUrl, slide.id]);

    // 3. Logika Odtwarzania (Tylko Active)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const shouldPlay = isActive && isPlaying;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay prevented", error);
                    // Tu można dodać logikę pokazania przycisku "Play" w razie błędu
                });
            }
        } else {
            video.pause();
            if (!isActive) {
                // Opcjonalnie: przewiń do początku po przewinięciu dalej
                // video.currentTime = 0; 
            }
        }
    }, [isActive, isPlaying]);

    // 4. Obsługa Mute
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
