"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const {
    activeSlide,
    isMuted,
    isPlaying,
    setCurrentTime,
    setDuration,
    playVideo,
    pauseVideo,
  } = useStore(
    (state) => ({
      activeSlide: state.activeSlide,
      isMuted: state.isMuted,
      isPlaying: state.isPlaying,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      playVideo: state.playVideo,
      pauseVideo: state.pauseVideo,
    }),
    shallow
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      if (!hlsRef.current) {
        hlsRef.current = new Hls();
        hlsRef.current.attachMedia(video);
      }
    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [setCurrentTime, setDuration]);

  useEffect(() => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;

    if (activeSlide && activeSlide.type === 'video' && activeSlide.data?.hlsUrl) {
      hls.loadSource(activeSlide.data.hlsUrl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          video.play().catch(e => console.error("Video play prevented:", e));
        }
      });
    } else {
      video.pause();
    }
  }, [activeSlide, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
      playsInline
      loop
      preload="auto"
    />
  );
};

export default GlobalVideoPlayer;
