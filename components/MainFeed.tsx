"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { Slide as SlideType } from '@/lib/types';
import { produce } from 'immer';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=10`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();
  return data;
};

const MainFeed = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [slides, setSlides] = useState<SlideType[]>([]);

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

  useEffect(() => {
    setSlides(data?.pages.flatMap(page => page.slides) ?? []);
  }, [data]);

  const rowVirtualizer = useVirtualizer({
      count: hasNextPage ? slides.length + 1 : slides.length,
      getScrollElement: () => parentRef.current,
      itemSize: () => parentRef.current?.clientHeight || 0,
      estimateSize: () => parentRef.current?.clientHeight || 0,
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem && lastItem.index >= slides.length - 1 && hasNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), slides.length, hasNextPage, isLoading, fetchNextPage]);


  const { setActiveSlide, activeSlideIndex } = useStore(
    (state) => ({
      setActiveSlide: state.setActiveSlide,
      activeSlideIndex: state.activeSlideIndex,
    }),
    shallow
  );

  const handleScroll = () => {
      const visibleRange = rowVirtualizer.getVirtualItems();
      if (visibleRange.length > 0) {
          // Używamy pierwszego widocznego elementu, co jest typowe dla snap-scrolla
          const middleIndex = visibleRange[0].index; 
          if (middleIndex !== activeSlideIndex && slides[middleIndex]) {
              setActiveSlide(slides[middleIndex], middleIndex);
          }
      }
  };


  useEffect(() => {
      // Przypisanie funkcji jumpToSlide do stanu globalnego
      useStore.setState({
          jumpToSlide: async (slideId: string) => {
              try {
                  const res = await fetch(`/api/slide/${slideId}`);
                  if (res.ok) {
                      const newSlide = await res.json();
                      setSlides(produce(draft => {
                          // Aktualizacja aktywnego slajdu
                          draft[activeSlideIndex] = newSlide;
                      }));
                      // Przewinięcie, aby upewnić się, że slajd jest widoczny
                      rowVirtualizer.scrollToIndex(activeSlideIndex, { align: 'start' });
                  }
              } catch (error) {
                  console.error("Failed to jump to slide", error);
              }
          }
      });
  }, [activeSlideIndex, rowVirtualizer]);


  if (isLoading && slides.length === 0) {
    return <div className="w-full h-full bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div ref={parentRef} onScroll={handleScroll} className="w-full h-screen overflow-y-scroll snap-y snap-mandatory">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const isLoaderRow = virtualItem.index > slides.length - 1;
                const slide = slides[virtualItem.index];

                return (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="h-full w-full snap-start"
                    >
                        {isLoaderRow ? (
                           hasNextPage ? <div className="w-full h-full bg-black flex items-center justify-center text-white">Loading more...</div> : null
                        ) : (
                            <Slide slide={slide} isVisible={virtualItem.index === activeSlideIndex} />
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default MainFeed;