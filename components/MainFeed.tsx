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
  const { activeSlide, setActiveSlide, setNextSlide } = useStore(state => ({
    activeSlide: state.activeSlide,
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
  }), shallow);

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

  const virtuosoRef = useRef(null);
  const slides = useMemo(() => {
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  useEffect(() => {
    if (slides.length > 0 && !activeSlide) {
      setActiveSlide(slides[0]);
    }
  }, [slides, activeSlide, setActiveSlide]);

  useEffect(() => {
    if (activeSlide) {
      const currentIndex = slides.findIndex(s => s.id === activeSlide.id);
      if (currentIndex !== -1) {
        const nextSlide = slides[(currentIndex + 1) % slides.length] || null;
        setNextSlide(nextSlide);
      }
    }
  }, [activeSlide, slides, setNextSlide]);

  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="snap-y snap-mandatory"
      style={{ height: '100vh' }}
      totalCount={hasNextPage ? slides.length + 1 : slides.length}
      overscan={200}
      endReached={() => hasNextPage && fetchNextPage()}
      itemContent={(index) => {
        const slide = slides[index % slides.length];
        if (!slide) return null;

        const isActive = activeSlide?.id === slide.id;
        const isNext = activeSlide?.id === slides[(index - 1 + slides.length) % slides.length]?.id;
        const priorityLoad = isActive || isNext;

        return (
          <div className="h-screen w-full snap-start">
             <Slide slide={slide} priorityLoad={priorityLoad} />
          </div>
        );
      }}
    />
  );
};

export default MainFeed;