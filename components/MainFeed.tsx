"use client";

import React, { useEffect, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { SlideDTO } from '@/lib/dto';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidesResponseSchema } from '@/lib/validators';
import { shallow } from 'zustand/shallow';
import { Loader2 } from 'lucide-react';

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
  // Access Zustand store
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  // Data fetching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['slides'],
    queryFn: fetchSlides,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten slides
  const slides = useMemo(() => {
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  // Initialize Embla with configuration for "TikTok-style" vertical snap
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      axis: 'y',
      dragFree: false, // Snap strictly to slide
      containScroll: 'trimSnaps', // Prevents excess scroll at ends but allows bounce if configured
      duration: 25, // Physics speed (lower = faster snap)
      watchDrag: true, // Essential for touch
    },
    [WheelGesturesPlugin({ forceWheelAxis: 'y' })]
  );

  // Handle slide selection (navigation)
  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    const index = emblaApi.selectedScrollSnap();
    const currentSlide = slides[index];
    const nextSlide = slides[index + 1] || null;

    if (currentSlide && activeSlide?.id !== currentSlide.id) {
      setActiveSlide(currentSlide);
      setNextSlide(nextSlide);
      if (currentSlide.type === 'video') {
        playVideo();
      }
    }

    // Infinite scroll trigger: if close to end (e.g., last 2 slides), fetch more
    if (hasNextPage && !isFetchingNextPage && index >= slides.length - 2) {
      fetchNextPage();
    }
  }, [emblaApi, slides, activeSlide, setActiveSlide, setNextSlide, playVideo, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Attach listeners
  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Initial run
    onSelect();

    return () => {
        emblaApi.off('select', onSelect);
        emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Initial Active Slide Set (if not set via Embla yet)
  useEffect(() => {
      if (slides.length > 0 && !activeSlide && !emblaApi) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide, emblaApi]);


  // Render Loading State
  if (isLoading && slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Skeleton className="w-full h-full bg-gray-900" />
      </div>
    );
  }

  // Render Error State
  if (isError) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-50">
        <p>Nie udało się załadować treści. Odśwież stronę.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Embla Viewport */}
      <div className="h-[100dvh] w-full outline-none" ref={emblaRef}>
        {/* Embla Container */}
        <div className="flex flex-col h-full touch-pan-x">
          {slides.map((slide, index) => {
             // Optimization: Only load "heavy" content for nearby slides
             // We can use the index relative to the active slide if we had the index in state,
             // but embla handles rendering fairly efficiently.
             // The Slide component uses `activeSlide` ID to decide playback.
             const isActive = activeSlide?.id === slide.id;
             // Quick optimization: Render simplified content if far away?
             // For now, we rely on Slide component's internal `shouldLoad` prop logic if it existed,
             // or just the fact that LocalVideoPlayer checks `isActive`.

             // We pass a priorityLoad hint if it's the current or next slide (captured via index in a broader scope if needed, but here relying on simple mapping)
             // Actually, we can infer proximity roughly by checking if it's the active slide ID.

             return (
              <div
                key={slide.id}
                className="flex-[0_0_100%] h-full w-full relative min-h-[100dvh]"
              >
                 <Slide slide={slide} priorityLoad={isActive} />
              </div>
            );
          })}

          {/* Loading Indicator at bottom */}
          {isFetchingNextPage && (
             <div className="flex-[0_0_auto] h-20 w-full flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainFeed;
