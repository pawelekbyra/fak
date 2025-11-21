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

const TOTAL_VIRTUAL_COUNT = 10000;

const MainFeed = () => {
  const { setActiveSlide, setNextSlide, playVideo, pauseVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    pauseVideo: state.pauseVideo,
    activeSlide: state.activeSlide
  }), shallow);

  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [initialIndex, setInitialIndex] = useState<number | undefined>(undefined);
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

  useEffect(() => {
    if (initialIndex === undefined && slides.length > 0) {
        const middleIndex = Math.floor(TOTAL_VIRTUAL_COUNT / 2);
        const start = middleIndex - (middleIndex % slides.length);
        setInitialIndex(start);

        if (!activeSlide) {
            const realIndex = start % slides.length;
            setActiveSlide(slides[realIndex]);
            setNextSlide(slides[(realIndex + 1) % slides.length] || null);
        }
    }
  }, [slides, initialIndex, activeSlide, setActiveSlide, setNextSlide]);

  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  if (initialIndex === undefined) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  return (
    <Virtuoso
      style={{ height: '100vh' }}
      totalCount={slides.length > 0 ? TOTAL_VIRTUAL_COUNT : 0}
      initialTopMostItemIndex={initialIndex}
      itemContent={(index) => {
        if (slides.length === 0) return null;
        const slide = slides[index % slides.length];
        const priorityLoad = index === currentViewIndex || index === currentViewIndex + 1;
        return (
          <div className="h-screen w-full snap-start">
             <Slide slide={slide} priorityLoad={priorityLoad} />
          </div>
        );
      }}
      rangeChanged={(range) => {
          if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
              if (slides.length === 0) return;

              const activeVirtualIndex = range.startIndex;
              setCurrentViewIndex(activeVirtualIndex);

              const realIndex = activeVirtualIndex % slides.length;

              if (hasNextPage && !isLoading && realIndex >= slides.length - 3) {
                  fetchNextPage();
              }

              const currentSlide = slides[realIndex];
              const nextSlide = slides[(realIndex + 1) % slides.length] || null;

              if (activeSlide?.id !== currentSlide.id) {
                  pauseVideo();
                  setActiveSlide(currentSlide);
                  setNextSlide(nextSlide);

                  if (currentSlide.type === 'video') {
                      playVideo();
                  }
              }
          }, 100);
      }}
      className="snap-y snap-mandatory"
      overscan={200}
    />
  );
};

export default MainFeed;