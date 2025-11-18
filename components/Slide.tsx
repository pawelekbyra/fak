"use client";

import React, { memo, useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  Slide as SlideUnionType,
  HtmlSlide,
  ImageSlide,
  VideoSlide,
} from '@/lib/types';
import { useStore } from '@/store/useStore';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import { shallow } from 'zustand/shallow';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { useUser } from '@/context/UserContext';
import SecretOverlay from './SecretOverlay';
import {
  Box,
  Flex,
  Text,
  Heading,
  Image,
  Avatar,
  Fade,
  ScaleFade,
  Center,
} from '@chakra-ui/react';
import { FaPlay, FaPause } from 'react-icons/fa';

// --- Prop Types for Sub-components ---
interface HtmlContentProps {
  slide: HtmlSlide;
}
interface ImageContentProps {
  slide: ImageSlide;
}
interface SlideUIProps {
  slide: SlideUnionType;
}

// --- Sub-components ---

const HtmlContent = ({ slide }: HtmlContentProps) => {
  if (!slide.data?.htmlContent) return null;
  const sanitizedHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(slide.data.htmlContent) : slide.data.htmlContent;
  return (
    <Box
      w="full"
      h="full"
      overflowY="auto"
      bg="white"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

const ImageContent = ({ slide }: ImageContentProps) => {
  if (!slide.data?.imageUrl) return null;
  return (
    <Flex position="relative" w="full" h="full" bg="black" align="center" justify="center">
      <Image
        src={slide.data.imageUrl}
        alt={slide.data.altText || 'Slide image'}
        objectFit="contain"
        maxW="100%"
        maxH="100%"
      />
    </Flex>
  );
};

const SlideUI = ({ slide }: SlideUIProps) => {
  const {
    togglePlay,
    currentTime,
    duration,
    isPlaying,
    isMuted,
    seek,
    setIsMuted
  } = useStore(state => ({
    togglePlay: state.togglePlay,
    currentTime: state.currentTime,
    duration: state.duration,
    isPlaying: state.isPlaying,
    isMuted: state.isMuted,
    seek: state.seek,
    setIsMuted: state.setIsMuted,
  }), shallow);

  const [showPlaybackIcon, setShowPlaybackIcon] = useState(false);
  const iconTimer = useRef<NodeJS.Timeout | null>(null);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      togglePlay();
      setShowPlaybackIcon(true);
      if (iconTimer.current) {
        clearTimeout(iconTimer.current);
      }
      iconTimer.current = setTimeout(() => {
        setShowPlaybackIcon(false);
      }, 800);
    }
  }

  useEffect(() => {
    return () => {
      if (iconTimer.current) {
        clearTimeout(iconTimer.current);
      }
    };
  }, []);

  const isVideoSlide = slide.type === 'video';

  return (
    <Box
      position="absolute"
      inset="0"
      zIndex="10"
      p="4"
      display="flex"
      flexDir="column"
      justifyContent="flex-end"
      color="white"
      onClick={handleContainerClick}
    >
      <Box
        position="absolute"
        insetX="0"
        top="0"
        h="24"
        bgGradient="linear(to-b, blackAlpha.500, transparent)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        insetX="0"
        bottom="0"
        h="48"
        bgGradient="linear(to-t, blackAlpha.500, transparent)"
        pointerEvents="none"
      />

      <AnimatePresence>
        {showPlaybackIcon && (
          <ScaleFade initialScale={1.5} in={showPlaybackIcon}>
            <Center position="absolute" inset="0">
              <Center bg="blackAlpha.500" borderRadius="full" p="4">
                {isPlaying ? <FaPlay size="3rem" color="white" /> : <FaPause size="3rem" color="white" />}
              </Center>
            </Center>
          </ScaleFade>
        )}
      </AnimatePresence>

      <Box position="relative" zIndex="20">
        <Flex align="center" gap="2" mb="2">
          <Avatar size="md" src={slide.avatar || '/avatars/default.png'} name={slide.username} border="2px solid white" />
          <Text fontWeight="bold" fontSize="lg">{slide.username}</Text>
        </Flex>

        {slide.data && 'title' in slide.data && <Heading as="h2" size="xl" mb="1">{slide.data.title}</Heading>}
        {slide.data && 'description' in slide.data && <Text fontSize="sm" opacity="0.9">{slide.data.description}</Text>}
      </Box>

      <Sidebar
        slideId={slide.id}
        initialLikes={slide.initialLikes}
        initialIsLiked={slide.isLiked}
        commentsCount={slide.initialComments}
      />

      {isVideoSlide && (
        <VideoControls
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onToggleMute={() => setIsMuted(!isMuted)}
          onSeek={seek}
        />
      )}
    </Box>
  );
};

// --- Main Slide Component ---

interface SlideProps {
  slide: SlideUnionType;
}

const Slide = memo<SlideProps>(({ slide }) => {
  const { isLoggedIn } = useUser();
  const showSecretOverlay = slide.access === 'secret' && !isLoggedIn;

  const renderContent = () => {
    switch (slide.type) {
      case 'video':
        const videoSlide = slide as VideoSlide;
        if (!videoSlide.data?.hlsUrl) return <Box w="full" h="full" bg="black" />;
        return <VideoPlayer hlsUrl={videoSlide.data.hlsUrl} />;
      case 'html':
        return <HtmlContent slide={slide as HtmlSlide} />;
      case 'image':
        return <ImageContent slide={slide as ImageSlide} />;
      default:
        return <Center w="full" h="full" bg="gray.800"><Text>Unsupported slide type</Text></Center>;
    }
  };

  return (
    <Box
      position="relative"
      w="full"
      h="full"
      bg="black"
      sx={showSecretOverlay ? { filter: 'blur(8px) brightness(0.5)' } : {}}
    >
      {renderContent()}
      {showSecretOverlay ? <SecretOverlay /> : <SlideUI slide={slide} />}
    </Box>
  );
});

Slide.displayName = 'Slide';
export default Slide;