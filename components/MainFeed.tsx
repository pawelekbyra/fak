import React, { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

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

  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <Virtuoso
      style={{ height: '100vh' }}
      data={slides}
      overscan={200}
      endReached={() => hasNextPage && fetchNextPage()}
      itemContent={(index, slide) => {
        const isActive = index === activeSlideIndex;
        const loadingPriority = isActive || index === activeSlideIndex + 1;
        return (
          <div className="h-screen w-full snap-start">
             <Slide slide={slide} isActive={isActive} loadingPriority={loadingPriority} />
          </div>
        );
      }}
      rangeChanged={(range) => {
          // Synchronous update to avoid race conditions.
          // The startIndex is the index of the first visible item, which is our active slide.
          setActiveSlideIndex(range.startIndex);
      }}
      className="snap-y snap-mandatory"
    />
  );
};

export default MainFeed;
