import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import { shallow } from 'zustand/shallow';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=5`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();

  try {
      const parsed = SlidesResponseSchema.parse(data);
      return parsed;
  } catch (e) {
      console.error("Slides API validation error:", e);
      throw new Error("Invalid data received from Slides API");
  }
};

const MainFeed = () => {
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  // Initialize active slide if not set
  useEffect(() => {
      if (slides.length > 0 && !activeSlide) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;

      if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
          const { scrollTop, clientHeight } = container;
          // Calculate current index based on scroll position
          const activeIndex = Math.round(scrollTop / clientHeight);

          setCurrentViewIndex(activeIndex);

          if (activeIndex >= 0 && activeIndex < slides.length) {
              const currentSlide = slides[activeIndex];
              const nextSlide = slides[activeIndex + 1] || null;

              if (activeSlide?.id !== currentSlide.id) {
                  setActiveSlide(currentSlide);
                  setNextSlide(nextSlide);

                  if (currentSlide.type === 'video') {
                      playVideo();
                  }
              }
          }

          // Trigger infinite scroll if we are near the end (e.g., within 2 slides)
          if (hasNextPage && !isLoading && (slides.length - activeIndex <= 2)) {
              fetchNextPage();
          }
      }, 80);
  }, [slides, activeSlide, setActiveSlide, setNextSlide, playVideo, hasNextPage, isLoading, fetchNextPage]);

  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onScroll={handleScroll}
    >
      {slides.map((slide, index) => {
         // Only prioritize loading for current and adjacent slides
         const priorityLoad = Math.abs(currentViewIndex - index) <= 1;

         return (
            <div key={slide.id} className="h-full w-full snap-start relative">
               <Slide slide={slide} priorityLoad={priorityLoad} />
            </div>
         );
      })}
    </div>
  );
};

export default MainFeed;