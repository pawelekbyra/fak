"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const {
    activeHlsUrl,
    isMuted,
    userPlaybackIntent,
    playVideo,
    pauseVideo,
    setCurrentTime,
    setDuration,
  } = useStore(
    (state) => ({
      activeHlsUrl: state.activeHlsUrl,
      isMuted: state.isMuted,
      userPlaybackIntent: state.userPlaybackIntent,
      playVideo: state.playVideo,
      pauseVideo: state.pauseVideo,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
    }),
    shallow
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!hlsRef.current) {
        const hls = new Hls();
        hlsRef.current = hls;
    }
    const hls = hlsRef.current;


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
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (!video || !hls) return;

      if (activeHlsUrl) {
          hls.loadSource(activeHlsUrl);
          hls.attachMedia(video);
      }
  }, [activeHlsUrl])

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const shouldPlay = !!activeHlsUrl && userPlaybackIntent !== 'pause';

    if (shouldPlay) {
      video.play().catch(e => console.error("Video play prevented:", e));
       if (!useStore.getState().isPlaying) {
        playVideo();
      }
    } else {
      video.pause();
       if (useStore.getState().isPlaying) {
        pauseVideo();
      }
    }
  }, [activeHlsUrl, userPlaybackIntent, playVideo, pauseVideo]);


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
