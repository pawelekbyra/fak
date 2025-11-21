import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import useEmblaCarousel from 'embla-carousel-react';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
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
  // 1. Setup Embla Carousel: Vertical, Loop enabled
  // dragFree: false means it snaps to slides.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: true,
    dragFree: false,
    duration: 25, // Slightly faster snapping
    skipSnaps: false
  });

  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  // 2. Infinite Query for data
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

  // 3. Embla Event Listeners
  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    // Get the index of the slide currently in focus
    const index = emblaApi.selectedScrollSnap();
    const slide = slides[index];

    if (slide && slide.id !== activeSlide?.id) {
        // Set Active Slide
        setActiveSlide(slide);
        setNextSlide(slides[index + 1] || slides[0] || null); // Loop logic for next slide

        // Auto Play if it's a video
        if (slide.type === 'video') {
            playVideo();
        }
    }

    // Infinite Scroll Trigger:
    // If we are near the end of the list, fetch more.
    // Note: 'scroll-progress' isn't ideal for loops, but checking index vs length works.
    if (hasNextPage && (index >= slides.length - 2)) {
         fetchNextPage();
    }

  }, [emblaApi, slides, activeSlide, setActiveSlide, setNextSlide, playVideo, hasNextPage, fetchNextPage]);

  // Attach listeners
  useEffect(() => {
    if (!emblaApi) return;

    // Trigger once on init to set the first slide active
    onSelect();

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
        emblaApi.off('select', onSelect);
        emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // 4. Ensure Store is initialized with the first slide if needed
  useEffect(() => {
      if (slides.length > 0 && !activeSlide) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);


  if (isLoading && slides.length === 0) {
    return (
        <div className="w-full h-[100dvh] bg-black flex items-center justify-center">
            <Skeleton className="w-full h-full bg-zinc-900" />
        </div>
    );
  }

  if (isError) {
    return (
        <div className="w-full h-[100dvh] bg-black flex items-center justify-center text-white">
            <p>Błąd ładowania wideo.</p>
        </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-black" ref={emblaRef}>
      <div className="flex flex-col h-full touch-pan-y touch-pinch-zoom">
        {slides.map((slide, index) => {
             // Determine priority load based on distance from active slide
             // (Approximation, since Embla handles the exact viewport)
             // In a loop, we might need smarter logic, but this suffices for typical cases.
             // We rely on LocalVideoPlayer's 'shouldLoad' prop which we can derive here if needed.
             // Actually, Slide checks 'activeSlide.id === slide.id' internally for playback.
             // For preloading, we can pass 'true' if it's the next one.

             const isNext = activeSlide ? (slides.indexOf(activeSlide) + 1 === index) : false;
             // Also handle the loop edge case: if active is last, next is 0
             const isNextLoop = activeSlide ? (slides.indexOf(activeSlide) === slides.length - 1 && index === 0) : false;

             const shouldLoad = isNext || isNextLoop;

             return (
                <div
                    key={slide.id}
                    className="flex-[0_0_100%] min-w-0 relative"
                    // flex-[0_0_100%] ensures it takes full height of the flex container (which is h-full)
                >
                    <Slide slide={slide} priorityLoad={!!shouldLoad} />
                </div>
             )
        })}
      </div>
    </div>
  );
};

export default MainFeed;
