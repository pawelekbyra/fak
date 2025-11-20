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

  // SWAP Logic: Watch activeSlide changes
  useEffect(() => {
      // Determine which player should be active based on current toggle state.
      // Actually, we toggle state first.

      // Logic: If activeSlide changes, we need to ensure the *active* player is playing it.
      // But wait, the goal is that the *inactive* player ALREADY has it loaded.
      // So if we were A, and slide changed, we switch to B (because B ideally has the next slide).

      // However, we need to verify if B actually has the current activeSlide.
      // A simplified Double Buffering strategy:
      // 1. Determine which player holds activeSlide content (or should hold it).
      // 2. If it's the inactive one, swap.

      // Better yet: strict rotation.
      // Slide N: Player A.
      // Slide N+1: Player B (preloading).
      // When moving N -> N+1: activePlayer becomes B.

      // We can maintain a reference to "last active slide id" to detect change?
      // Or just trust the swap.

      // Let's blindly toggle for now on slide change, but we need to be careful on init.
      // On Init: activePlayer A loads Slide 0. activePlayer B loads Slide 1.

      // Refined Logic:
      // We don't know if we moved forward or backward.
      // But `nextSlide` is always N+1 (or whatever feed logic says).
      // Virtualization might jump.

      // Let's load Active content into Active Player, and Next content into Inactive Player.
      // Wait, that defeats 0ms delay if we load Active into Active *after* change.
      // The Active Player *must already have* the content.

      // So:
      // When `activeSlide` updates, we check if Player A or Player B has this URL.
      // If neither, load into A and make A active.
      // If B has it, make B active.
      // Then load `nextSlide` into the *other* one.

      if (!activeSlide) return;

      const activeUrl = activeSlide.type === 'video' ? (activeSlide.data.hlsUrl || activeSlide.data.mp4Url) : null;

      if (!activeUrl) return;

      // Check current sources (approximate check, HLS.js url vs native src)
      const getUrl = (video: HTMLVideoElement, hls: Hls | null) => hls?.url || video.src;

      const urlA = playerARef.current ? getUrl(playerARef.current, hlsARef.current) : '';
      const urlB = playerBRef.current ? getUrl(playerBRef.current, hlsBRef.current) : '';

      // Normalize URLs (sometimes full path vs relative)
      // Ideally we store the slide ID associated with the player in a ref

  }, [activeSlide]);

  // Implementing simpler approach:
  // We track `lastActiveSlideId`.
  const lastActiveSlideId = useRef<string | null>(null);

  useEffect(() => {
      if (!activeSlide || activeSlide.id === lastActiveSlideId.current) return;

      // Slide changed.
      // If we were A, switch to B. If B, switch to A.
      setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
      lastActiveSlideId.current = activeSlide.id;

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
          loadSlideIntoPlayer(nextSlide, pB, hB);

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
          loadSlideIntoPlayer(nextSlide, pA, hA);

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
