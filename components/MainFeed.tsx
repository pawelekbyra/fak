import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import { shallow } from 'zustand/shallow';

// CSS for hiding scrollbar but keeping functionality
const hideScrollbarStyle: React.CSSProperties = {
  msOverflowStyle: 'none',  /* IE and Edge */
  scrollbarWidth: 'none',  /* Firefox */
};

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
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [slidesList, setSlidesList] = useState<SlideDTO[]>([]);
  // We keep track if we are currently appending recycled slides to avoid rapid loops
  const [isRecycling, setIsRecycling] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetching
  } = useInfiniteQuery({
    queryKey: ['slides'],
    queryFn: fetchSlides,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Sync React Query data to our local list
  useEffect(() => {
    if (data?.pages) {
      const newSlides = data.pages.flatMap(page => page.slides) as SlideDTO[];

      setSlidesList(prev => {
          const isLooping = prev.length > newSlides.length;
          if (isLooping) {
            return prev;
          }
          return newSlides;
      });
    }
  }, [data]);

  // Handle Infinite Loop Logic
  const handleEndReached = useCallback(() => {
    if (hasNextPage) {
       fetchNextPage();
    } else if (slidesList.length > 0 && !isFetching && !isRecycling) {
       setIsRecycling(true);

       setSlidesList(prev => {
         return [...prev, ...prev];
       });

       setTimeout(() => setIsRecycling(false), 1000);
    }
  }, [hasNextPage, fetchNextPage, slidesList.length, isFetching, isRecycling]);

  if (isLoading && slidesList.length === 0) {
    return <div className="w-full h-[100dvh] bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-full h-[100dvh] bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <>
        <style jsx global>{`
            .hide-scrollbar::-webkit-scrollbar {
                display: none;
            }
        `}</style>
        <Virtuoso
          ref={virtuosoRef}
          className="snap-y snap-mandatory h-[100dvh] w-full overflow-y-scroll hide-scrollbar"
          style={{ ...hideScrollbarStyle, height: '100dvh' }}
          data={slidesList}
          overscan={1}
          endReached={handleEndReached}
          // Note: activeSlide logic is now handled inside the Slide component via IntersectionObserver
          // to ensure precise "enter viewport" behavior.
          itemContent={(index, slide) => {
            return (
              <div
                className="h-[100dvh] w-full snap-start relative"
                key={`${slide.id}-${index}`}
              >
                 <Slide slide={slide} priorityLoad={true} />
              </div>
            );
          }}
        />
    </>
  );
};

export default MainFeed;