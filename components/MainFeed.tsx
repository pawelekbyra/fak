import React, { useCallback, useEffect, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import { shallow } from 'zustand/shallow';
import Slide from '@/components/Slide';
import { useUser } from '@/context/UserContext';

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
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  // Embla configuration for vertical full-screen scrolling
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: true, // Enabling infinite loop
    dragFree: false, // Ensures one-slide-at-a-time snapping
    duration: 20, // Adjust snap speed
    skipSnaps: false,
    watchDrag: true,
  });

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

  // Flatten slides from pages
  const slides = useMemo(() => {
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  // Handle slide selection (snap)
  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    // In loop mode, selectedScrollSnap gives the index relative to the slide list (0..length-1)
    // Embla handles the modulo math internally.
    const index = emblaApi.selectedScrollSnap();

    if (slides.length > 0 && slides[index]) {
        const currentSlide = slides[index];
        // Logic for next slide (for preloading) - handle loop wrap manually if needed for simple arrays
        const nextIndex = (index + 1) % slides.length;
        const nextSlide = slides[nextIndex] || null;

        if (activeSlide?.id !== currentSlide.id) {
            setActiveSlide(currentSlide);
            setNextSlide(nextSlide);
            if (currentSlide.type === 'video') {
                 playVideo();
            }
        }
    }

    // Infinite Scroll trigger
    // Check if we are close to the "end" of the list (even in loop mode, the underlying list has an end)
    // In loop mode, Embla doesn't really have an "end" event in the traditional sense because it wraps.
    // However, we can check if the current index is near the last fetched index.
    if (hasNextPage && (slides.length - index) < 3) {
        fetchNextPage();
    }

  }, [emblaApi, slides, activeSlide, setActiveSlide, setNextSlide, playVideo, hasNextPage, fetchNextPage]);

  // Attach Embla event listeners
  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect); // Re-run onSelect when slides update (api re-initializes)

    // Initial check
    onSelect();

    return () => {
        emblaApi.off('select', onSelect);
        emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Initial active slide set (fallback)
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
            <p>Wystąpił błąd podczas ładowania feedu.</p>
        </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden fixed top-0 left-0 right-0 bottom-0 z-0">
      {/* Embla Viewport */}
      <div className="w-full h-full" ref={emblaRef}>
        {/* Embla Container */}
        <div className="w-full h-full flex flex-col touch-pan-x touch-pinch-zoom">
          {slides.map((slide, index) => {
             // Determine if this slide should load resources
             // In loop mode, checking strict index equality is tricky because Embla clones nodes.
             // However, React renders the *source* list. Embla handles the cloning for visual loop.
             // For performance, we rely on the 'isActive' prop inside Slide -> LocalVideoPlayer.
             // But for preloading, we might want to pass a hint.
             // We can calculate distance from active index if we had it in state,
             // but relying on Slide's internal checks (via store) is safer.
             const priorityLoad = activeSlide?.id === slide.id;

             return (
                <div className="embla__slide flex-[0_0_100%] w-full h-full min-h-[100dvh] relative" key={slide.id}>
                    <Slide slide={slide} priorityLoad={priorityLoad} />
                </div>
             )
          })}
        </div>
      </div>
    </div>
  );
};

export default MainFeed;
