import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useInfiniteQuery } from '@tanstack/react-query';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { Slide as SlideType } from '@/lib/types';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=5`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();
  return data;
};

const MainFeed = () => {
  const listRef = useRef<FixedSizeList>(null);
  const setActiveSlide = useStore(state => state.setActiveSlide);
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
    return data?.pages.flatMap(page => page.slides) ?? [];
  }, [data]);

  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const slide = slides[index];
    if (!slide) return null;

    return (
      <div style={style} className="w-full h-full" data-slide-id={slide.id}>
        <Slide slide={slide} />
      </div>
    );
  }, [slides]);

  // Handle active slide detection
  const onItemsRendered = useCallback(({ visibleStopIndex, visibleStartIndex }: { visibleStopIndex: number, visibleStartIndex: number }) => {
    // Trigger fetchNextPage when nearing the end
    if (visibleStopIndex >= slides.length - 2 && hasNextPage) {
      fetchNextPage();
    }

    // Simple active slide detection: check the middle item
    const middleIndex = Math.round((visibleStartIndex + visibleStopIndex) / 2);
    const currentSlide = slides[middleIndex];

    if (currentSlide) {
       // We only set it if it's different to avoid constant updates, though useStore might handle that.
       // Ideally we should check against current active slide in store, but let's trust Zustand's equality check or do it here.
       useStore.getState().setActiveSlide(currentSlide);
       if (currentSlide.type === 'video') {
           useStore.getState().playVideo();
       }
    }
  }, [slides, hasNextPage, fetchNextPage]); // playVideo and setActiveSlide are stable from store

  if (isLoading && slides.length === 0) {
    return <div className="w-full h-full bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div className="w-full h-full">
        <FixedSizeList
            ref={listRef}
            height={window.innerHeight}
            width="100%"
            itemCount={slides.length}
            itemSize={window.innerHeight}
            overscanCount={2}
            onItemsRendered={onItemsRendered}
            className="no-scrollbar" // Add utility class to hide scrollbar if needed
        >
            {Row}
        </FixedSizeList>
    </div>
  );
};

export default MainFeed;
