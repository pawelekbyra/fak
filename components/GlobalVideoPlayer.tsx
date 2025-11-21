"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { SlideDTO } from '@/lib/dto';

const GlobalVideoPlayer = () => {
  const playerARef = useRef<HTMLVideoElement>(null);
  const playerBRef = useRef<HTMLVideoElement>(null);
  const hlsARef = useRef<Hls | null>(null);
  const hlsBRef = useRef<Hls | null>(null);

  const playerAIdRef = useRef<string | null>(null);
  const playerBIdRef = useRef<string | null>(null);

  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');

  const {
    activeSlide,
    nextSlide,
    isMuted,
    isPlaying,
    playVideo,
  } = useStore(
    (state) => ({
      activeSlide: state.activeSlide,
      nextSlide: state.nextSlide,
      isMuted: state.isMuted,
      isPlaying: state.isPlaying,
      playVideo: state.playVideo,
    }),
    shallow
  );

  useEffect(() => {
    if (Hls.isSupported()) {
      if (!hlsARef.current && playerARef.current) {
        hlsARef.current = new Hls({ autoStartLoad: true });
        hlsARef.current.attachMedia(playerARef.current);
      }
      if (!hlsBRef.current && playerBRef.current) {
        hlsBRef.current = new Hls({ autoStartLoad: true });
        hlsBRef.current.attachMedia(playerBRef.current);
      }
    }

    return () => {
      if (hlsARef.current) hlsARef.current.destroy();
      if (hlsBRef.current) hlsBRef.current.destroy();
    };
  }, []);

  const loadSlideIntoPlayer = (slide: SlideDTO | null, video: HTMLVideoElement, hls: Hls | null) => {
      if (!slide || slide.type !== 'video') {
          video.pause();
          video.removeAttribute('src');
          if (hls) hls.detachMedia();
          if (hls && video) hls.attachMedia(video);
          return;
      }

      const hlsUrl = slide.data.hlsUrl;
      const mp4Url = slide.data.mp4Url;

      if (Hls.isSupported() && hls && hlsUrl) {
           if (hls.url !== hlsUrl) {
               hls.loadSource(hlsUrl);
           }
      } else if (video.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
           if (video.src !== hlsUrl) {
               video.src = hlsUrl;
           }
      } else if (mp4Url) {
           if (video.src !== mp4Url) {
               video.src = mp4Url;
           }
      }
  };

  useEffect(() => {
      if (!activeSlide) return;
      const isA = playerAIdRef.current === activeSlide.id;
      const isB = playerBIdRef.current === activeSlide.id;

      if (isA) {
          setActivePlayer('A');
      } else if (isB) {
          setActivePlayer('B');
      } else {
          setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
      }
  }, [activeSlide?.id]);

  useEffect(() => {
      const pA = playerARef.current;
      const pB = playerBRef.current;
      const hA = hlsARef.current;
      const hB = hlsBRef.current;

      if (!pA || !pB) return;

      if (activePlayer === 'A') {
          loadSlideIntoPlayer(activeSlide, pA, hA);
          playerAIdRef.current = activeSlide?.id || null;

          loadSlideIntoPlayer(nextSlide, pB, hB);
          playerBIdRef.current = nextSlide?.id || null;

          if (isPlaying && activeSlide?.type === 'video') {
              pA.play().catch(() => {});
          } else {
              pA.pause();
          }
          pA.muted = isMuted;
          pB.muted = true;

          pB.pause();
      } else {
          loadSlideIntoPlayer(activeSlide, pB, hB);
          playerBIdRef.current = activeSlide?.id || null;

          loadSlideIntoPlayer(nextSlide, pA, hA);
          playerAIdRef.current = nextSlide?.id || null;

          if (isPlaying && activeSlide?.type === 'video') {
              pB.play().catch(() => {});
          } else {
              pB.pause();
          }
          pB.muted = isMuted;
          pA.muted = true;
          pA.pause();
      }
  }, [activePlayer, activeSlide, nextSlide, isPlaying, isMuted]);

  useEffect(() => {
      const video = activePlayer === 'A' ? playerARef.current : playerBRef.current;
      if (!video) return;

      let rafId: number;

      const update = () => {
          if (!video.paused && !video.ended) {
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

      rafId = requestAnimationFrame(update);
      return () => cancelAnimationFrame(rafId);
  }, [activePlayer, isPlaying]);

  return (
    <>
      <video
        ref={playerARef}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${activePlayer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        playsInline
        loop
        preload="auto"
      />
      <video
        ref={playerBRef}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${activePlayer === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        playsInline
        loop
        preload="auto"
      />
    </>
  );
};

export default GlobalVideoPlayer;
