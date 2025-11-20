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

  // Track which slide ID is loaded in which player
  const playerAIdRef = useRef<string | null>(null);
  const playerBIdRef = useRef<string | null>(null);

  // 'A' is active means Player A is visible and playing.
  // 'B' is active means Player B is visible and playing.
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');

  const {
    activeSlide,
    nextSlide,
    isMuted,
    isPlaying,
    setCurrentTime,
    setDuration,
    playVideo,
  } = useStore(
    (state) => ({
      activeSlide: state.activeSlide,
      nextSlide: state.nextSlide,
      isMuted: state.isMuted,
      isPlaying: state.isPlaying,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      playVideo: state.playVideo,
    }),
    shallow
  );

  // Initialize HLS instances
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

  // Helper to load a slide into a specific player/hls pair
  const loadSlideIntoPlayer = (slide: SlideDTO | null, video: HTMLVideoElement, hls: Hls | null) => {
      if (!slide || slide.type !== 'video') {
          video.pause();
          video.removeAttribute('src'); // Clear source
          return;
      }

      const hlsUrl = slide.data.hlsUrl;
      const mp4Url = slide.data.mp4Url;

      // Prefer HLS if supported and available
      if (Hls.isSupported() && hls && hlsUrl) {
           if (hls.url !== hlsUrl) { // Avoid reloading if same
               hls.loadSource(hlsUrl);
           }
      } else if (video.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
           // Native HLS (Safari)
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

      // Smart Switching Logic:
      // Check if either player ALREADY has the target slide loaded.
      // This prevents unnecessary switching/reloading during fast scrolls or back-and-forth navigation.

      const isA = playerAIdRef.current === activeSlide.id;
      const isB = playerBIdRef.current === activeSlide.id;

      if (isA) {
          setActivePlayer('A');
      } else if (isB) {
          setActivePlayer('B');
      } else {
          // If neither has it, we toggle to the "other" player to load it fresh.
          // This maintains the A/B pattern for new content.
          setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
      }

  }, [activeSlide?.id]);

  // Effect to manage content loading based on Active/Next state + ActivePlayer
  useEffect(() => {
      // This effect runs whenever activeSlide, nextSlide or activePlayer changes.

      const pA = playerARef.current;
      const pB = playerBRef.current;
      const hA = hlsARef.current;
      const hB = hlsBRef.current;

      if (!pA || !pB) return;

      if (activePlayer === 'A') {
          // Player A is Active -> Needs `activeSlide`
          // Player B is Inactive -> Needs `nextSlide`
          loadSlideIntoPlayer(activeSlide, pA, hA);
          playerAIdRef.current = activeSlide?.id || null;

          loadSlideIntoPlayer(nextSlide, pB, hB);
          playerBIdRef.current = nextSlide?.id || null;

          // Play A
          if (isPlaying && activeSlide?.type === 'video') {
              pA.play().catch(() => {});
          }
          pA.muted = isMuted;

          // Silence/Pause B
          pB.muted = true;
          if (nextSlide) {
               // We want it to buffer but not play visibly?
               // HLS autoStartLoad=true handles buffering manifest/segments.
               // We can play() it to buffer effectively but keep it muted and hidden?
               // Browsers might block invisible autoplay, but usually allow muted.
               pB.play().catch(() => {});
               pB.pause(); // Or just let it buffer in background? HLS does that.
          } else {
               pB.pause();
          }

      } else {
          // Player B is Active -> Needs `activeSlide`
          // Player A is Inactive -> Needs `nextSlide`
          loadSlideIntoPlayer(activeSlide, pB, hB);
          playerBIdRef.current = activeSlide?.id || null;

          loadSlideIntoPlayer(nextSlide, pA, hA);
          playerAIdRef.current = nextSlide?.id || null;

           // Play B
          if (isPlaying && activeSlide?.type === 'video') {
              pB.play().catch(() => {});
          }
          pB.muted = isMuted;

          // Silence/Pause A
          pA.muted = true;
          if (nextSlide) {
               pA.play().catch(() => {});
               pA.pause();
          } else {
               pA.pause();
          }
      }

  }, [activePlayer, activeSlide, nextSlide, isPlaying, isMuted]);

  // Event Listeners for current active player
  useEffect(() => {
      const video = activePlayer === 'A' ? playerARef.current : playerBRef.current;
      if (!video) return;

      const handleTimeUpdate = () => setCurrentTime(video.currentTime);
      const handleDurationChange = () => setDuration(video.duration);

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);

      return () => {
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('durationchange', handleDurationChange);
      };
  }, [activePlayer, setCurrentTime, setDuration]);


  return (
    <>
      {/* Player A */}
      <video
        ref={playerARef}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${activePlayer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        playsInline
        loop
        preload="auto"
      />

      {/* Player B */}
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
