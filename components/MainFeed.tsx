"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
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

  // Timer ref for debounce
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
          // Initialize first slide as active
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <Virtuoso
      className="snap-y snap-mandatory"
      style={{ height: '100vh' }}
      data={slides}
      overscan={200}
      endReached={() => hasNextPage && fetchNextPage()}
      itemContent={(index, slide) => (
        <div className="h-screen w-full snap-start">
           <Slide slide={slide} />
        </div>
      )}
      rangeChanged={(range) => {
          // Clear any existing timer to debounce rapid scrolling
          if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
          }

          // Set a new timer
          debounceTimerRef.current = setTimeout(() => {
              // Detect which slide is active.
              // Since items are full screen, startIndex is effectively the active one when snapping completes.
              const activeIndex = range.startIndex;

              if (activeIndex >= 0 && activeIndex < slides.length) {
                  const currentSlide = slides[activeIndex];
                  const nextSlide = slides[activeIndex + 1] || null;

                  // Only update if changed to avoid unnecessary re-renders
                  if (activeSlide?.id !== currentSlide.id) {
                      setActiveSlide(currentSlide);
                      setNextSlide(nextSlide);

                      if (currentSlide.type === 'video') {
                          playVideo();
                      }
                  }
              }
          }, 80); // Reduced debounce to 80ms for snappier response
      }}
    />
  );
};

export default MainFeed;
