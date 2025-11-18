"use client";

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FixedSizeList } from 'react-window';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { Slide as SlideType } from '@/lib/types';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=10`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();
  return data;
};

const MainFeed = () => {
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const { setActiveSlide, activeSlideIndex } = useStore(
    (state) => ({
      setActiveSlide: state.setActiveSlide,
      activeSlideIndex: state.activeSlideIndex,
    }),
    shallow
  );

  const handleItemsRendered = useCallback(({ visibleStopIndex }: { visibleStopIndex: number }) => {
    if (visibleStopIndex !== activeSlideIndex && slides[visibleStopIndex]) {
        setActiveSlide(slides[visibleStopIndex], visibleStopIndex);
    }
    if (!isLoading && hasNextPage && visibleStopIndex >= slides.length - 3) {
      fetchNextPage();
    }
  }, [activeSlideIndex, slides, setActiveSlide, isLoading, hasNextPage, fetchNextPage]);


  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    if (slides.length === 0) return null;
    const slide = slides[index % slides.length]; // Looping logic
    return (
      <div style={style} className="h-full w-full snap-start">
        <Slide slide={slide} isVisible={index === activeSlideIndex} />
      </div>
    );
  }, [slides, activeSlideIndex]);


  if (isLoading && slides.length === 0) {
    return <div className="w-full h-full bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  if (windowHeight === 0) {
      return null; // Don't render until we have window height
  }

  return (
    <FixedSizeList
      height={windowHeight}
      itemCount={10000} // Simulate infinite scroll
      itemSize={windowHeight}
      width="100%"
      onItemsRendered={handleItemsRendered}
    >
      {Row}
    </FixedSizeList>
  );
};

export default MainFeed;
