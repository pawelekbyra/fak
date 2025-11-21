"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoControlsProps {
    isPlaying: boolean;
    isMuted: boolean;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onSeek: (time: number) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onSeek,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const handleProgress = (event: Event) => {
          const customEvent = event as CustomEvent;
          if (!isDragging) {
            const { currentTime, duration } = customEvent.detail;
            setCurrentTime(currentTime);
            setDuration(duration);
          }
      };

      window.addEventListener('video-progress', handleProgress);
      return () => window.removeEventListener('video-progress', handleProgress);
  }, [isDragging]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const handleSeekStart = () => {
      setIsDragging(true);
  }

  const handleSeekEnd = () => {
      setIsDragging(false);
      onSeek(currentTime);
  }

  // Hide controls if no duration (optional, but might flash 0:00 initially)
  // Keeping it visible but 0:00 is usually better UX than popping in.

  return (
    <div
        className="flex items-center gap-2 text-white bg-black/30 p-2 rounded-lg mt-4 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onTogglePlay} className="p-1 hover:text-pink-500 transition-colors">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <span className="text-xs font-mono w-10 text-center">{formatTime(currentTime)}</span>

      <input
        ref={progressRef}
        type="range"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        onMouseDown={handleSeekStart}
        onTouchStart={handleSeekStart}
        onChange={handleSeekChange}
        onMouseUp={handleSeekEnd}
        onTouchEnd={handleSeekEnd}
        className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer hover:bg-white/50 transition-colors accent-pink-500"
      />

      <span className="text-xs font-mono w-10 text-center">{formatTime(duration)}</span>

      <button onClick={onToggleMute} className="p-1 hover:text-pink-500 transition-colors">
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};

export default VideoControls;
