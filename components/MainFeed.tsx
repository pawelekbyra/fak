"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';

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
  const setActiveSlide = useStore(state => state.setActiveSlide);
  const setNextSlide = useStore(state => state.setNextSlide);
  const playVideo = useStore(state => state.playVideo);

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
      if (slides.length > 0) {
          // Set initial slides logic can be here or handled by rangeChanged on mount
      }
  }, [slides]);


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
          // Detect which slide is active.
          // Since items are full screen, startIndex is effectively the active one when snapping completes.
          // We might want to double check logic if partially scrolling, but for full page snap, startIndex is reliable.
          const activeIndex = range.startIndex;

          if (activeIndex >= 0 && activeIndex < slides.length) {
              const currentSlide = slides[activeIndex];
              const nextSlide = slides[activeIndex + 1] || null;

              setActiveSlide(currentSlide);
              setNextSlide(nextSlide);

              if (currentSlide.type === 'video') {
                  playVideo();
              }
          }
      }}
    />
  );
};

export default MainFeed;