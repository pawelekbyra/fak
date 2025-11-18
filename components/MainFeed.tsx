import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Slide from '@/components/Slide';
import { Box, Skeleton, Center, Text } from '@chakra-ui/react';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=5`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();
  return data;
};

const MainFeed = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [isLooping, setIsLooping] = useState(false);
  const isJumping = useRef(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['slides'],
    queryFn: fetchSlides,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const slides = useMemo(() => {
    return data?.pages.flatMap(page => page.slides) ?? [];
  }, [data]);

  const loopedSlides = useMemo(() => {
      if (!isLooping || slides.length === 0) return slides;
      return [...slides, ...slides, ...slides];
  }, [slides, isLooping]);

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    } else if (slides.length > 0) {
        setIsLooping(true);
    }
  }, [hasNextPage, fetchNextPage, slides.length]);

  useEffect(() => {
    if (isLooping && scrollContainerRef.current) {
        const slideHeight = scrollContainerRef.current.clientHeight;
        const initialScrollTop = slides.length * slideHeight;
        scrollContainerRef.current.scrollTop = initialScrollTop;
    }
  }, [isLooping, slides.length]);

  useEffect(() => {
      if (!isLooping) return;

      const observer = new IntersectionObserver(
          (entries) => {
              if (isJumping.current) return;
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      const slideHeight = scrollContainerRef.current!.clientHeight;
                      isJumping.current = true;
                      if (entry.target === topSentinelRef.current) {
                          const newScrollTop = scrollContainerRef.current!.scrollTop + (slides.length * slideHeight);
                          scrollContainerRef.current!.scrollTop = newScrollTop;
                      } else if (entry.target === bottomSentinelRef.current) {
                          const newScrollTop = scrollContainerRef.current!.scrollTop - (slides.length * slideHeight);
                          scrollContainerRef.current!.scrollTop = newScrollTop;
                      }
                      setTimeout(() => { isJumping.current = false; }, 100);
                  }
              });
          },
          { root: scrollContainerRef.current, threshold: 0.1 }
      );

      if (topSentinelRef.current) observer.observe(topSentinelRef.current);
      if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

      return () => {
          observer.disconnect();
      };
  }, [isLooping, slides]);


  if (isLoading && slides.length === 0) {
    return (
      <Center w="100vw" h="100vh" bg="black">
        <Skeleton w="100%" h="100%" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center w="100vw" h="100vh" bg="black" color="white">
        <Text>Error loading slides.</Text>
      </Center>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      w="100%"
      h="100vh"
      overflowY="scroll"
      sx={{
        scrollSnapType: 'y mandatory',
      }}
    >
      {isLooping && <Box ref={topSentinelRef} />}
      {loopedSlides.map((slide, index) => (
        <Box key={`${slide.id}-${index}`} h="100%" w="100%" sx={{ scrollSnapAlign: 'start' }}>
          <Slide slide={slide} />
        </Box>
      ))}
      {isLooping && <Box ref={bottomSentinelRef} />}
    </Box>
  );
};

export default MainFeed;