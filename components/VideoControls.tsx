"use client";

import React from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import {
  Flex,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
} from '@chakra-ui/react';

interface VideoControlsProps {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isMuted: boolean;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onSeek: (time: number) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
    currentTime,
    duration,
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onSeek,
}) => {
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleSeek = (value: number) => {
    onSeek(value);
  };

  if (!duration || isNaN(duration)) {
    return null;
  }

  return (
    <Flex
      position="absolute"
      bottom="4"
      left="4"
      right="4"
      align="center"
      gap="2"
      color="white"
      zIndex="20"
      bg="blackAlpha.300"
      p="2"
      borderRadius="lg"
    >
      <IconButton
        icon={isPlaying ? <FaPause /> : <FaPlay />}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={onTogglePlay}
        size="sm"
        isRound
      />
      <Text fontSize="xs" fontFamily="mono" w="12" textAlign="center">
        {formatTime(currentTime)}
      </Text>
      <Slider
        aria-label="seek-slider"
        min={0}
        max={duration}
        step={1}
        value={currentTime}
        onChange={handleSeek}
      >
        <SliderTrack bg="gray.700">
          <SliderFilledTrack bg="white" />
        </SliderTrack>
        <SliderThumb boxSize={4} />
      </Slider>
      <Text fontSize="xs" fontFamily="mono" w="12" textAlign="center">
        {formatTime(duration)}
      </Text>
      <IconButton
        icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        onClick={onToggleMute}
        size="sm"
        isRound
      />
    </Flex>
  );
};

export default VideoControls;