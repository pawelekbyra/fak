import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
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
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce logic for slide activation
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['slides'],
    queryFn: fetchSlides,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const slides = useMemo(() => {
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  // Calculate active index for priority loading logic
  const activeIndex = useMemo(() => {
      if (!activeSlide) return 0;
      return slides.findIndex(s => s.id === activeSlide.id);
  }, [slides, activeSlide]);


  // Initialize first slide as active if none set
  useEffect(() => {
      if (slides.length > 0 && !activeSlide) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);


  // Intersection Observer for handling Active Slide
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));

            if (!isNaN(index) && slides[index]) {
                const currentSlide = slides[index];

                // Avoid redundant updates
                if (activeSlide?.id === currentSlide.id) return;

                // Debounce the activation to prevent skipping jitter
                if (activationTimeoutRef.current) clearTimeout(activationTimeoutRef.current);

                activationTimeoutRef.current = setTimeout(() => {
                    const nextSlide = slides[index + 1] || null;
                    setActiveSlide(currentSlide);
                    setNextSlide(nextSlide);

                    if (currentSlide.type === 'video') {
                        playVideo();
                    }
                }, 150); // Short delay to ensure user settled on this slide
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6, // Item must be 60% visible to be "active"
      }
    );

    const slideElements = container.querySelectorAll('.slide-item');
    slideElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (activationTimeoutRef.current) clearTimeout(activationTimeoutRef.current);
    };
  }, [slides, activeSlide, setActiveSlide, setNextSlide, playVideo]);


  // Intersection Observer for Infinite Scroll (Load More)
  useEffect(() => {
      const container = containerRef.current;
      if (!container || !hasNextPage || isFetchingNextPage) return;

      const observer = new IntersectionObserver(
          (entries) => {
              if (entries[0].isIntersecting) {
                  fetchNextPage();
              }
          },
          { root: container, threshold: 0.1, rootMargin: '200px' } // Preload when within 200px of bottom
      );

      const sentinel = container.querySelector('#load-more-sentinel');
      if (sentinel) observer.observe(sentinel);

      return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, slides.length]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div
        ref={containerRef}
        className="relative h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] bg-black"
    >
        {slides.map((slide, index) => {
             // Priority load logic: Load current and next 1
             const shouldLoad = index === activeIndex || index === activeIndex + 1;

             return (
                <div
                    key={`${slide.id}-${index}`}
                    data-index={index}
                    className="slide-item h-[100dvh] w-full snap-start relative"
                >
                    <Slide slide={slide} priorityLoad={shouldLoad} />
                </div>
             );
        })}

        {/* Sentinel for infinite scroll */}
        <div id="load-more-sentinel" className="h-20 w-full snap-start flex items-center justify-center">
            {isFetchingNextPage && <div className="text-white text-xs">Loading...</div>}
        </div>
    </div>
  );
};

export default MainFeed;
