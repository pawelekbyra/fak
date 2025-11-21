import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Local state to track active index for priority loading
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Initialize active slide if not set
  useEffect(() => {
      if (slides.length > 0 && !activeSlide) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
          playVideo();
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide, playVideo]);

  // Setup Intersection Observer for slides
  useEffect(() => {
    const container = containerRef.current;
    if (!container || slides.length === 0) return;

    const options = {
      root: container,
      threshold: 0.6, // Item must be 60% visible to be considered "active"
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
            setActiveIndex(index);
            const currentSlide = slides[index];
            const nextSlide = slides[index + 1] || null;

            // Update global store only if changed
            // We access the latest state via useStore directly or just trust the effect
            // Since activeSlide is in dep array of this effect, we need to be careful to not create loops.
            // But here we use the Ref/Closure.
            // Ideally we check against the current store value, but we don't have it in the closure unless activeSlide is in deps.
            // Instead, we rely on state updates.
            setActiveSlide(currentSlide);
            setNextSlide(nextSlide);
            if (currentSlide.type === 'video') {
                playVideo();
            }
          }
        }
      });
    }, options);

    const slideElements = container.querySelectorAll('.slide-item');
    slideElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [slides, setActiveSlide, setNextSlide, playVideo]); // Re-run when slides list changes

  // Setup "Load More" observer
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasNextPage) return;

    loadMoreObserverRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { root: containerRef.current, threshold: 0.1 });

    loadMoreObserverRef.current.observe(trigger);

    return () => {
      loadMoreObserverRef.current?.disconnect();
    };
  }, [hasNextPage, fetchNextPage, slides]); // Re-bind when content changes/grows


  if (isLoading && slides.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <Skeleton className="w-full h-full bg-zinc-900" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center text-white">
        <p>Błąd ładowania treści.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-black scroll-smooth"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        overscrollBehaviorY: 'contain' // Prevent bounce on parent
      }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          data-index={index}
          className="h-full w-full snap-start slide-item relative"
        >
          <Slide
            slide={slide}
            priorityLoad={Math.abs(index - activeIndex) <= 1}
          />
        </div>
      ))}

      {/* Bottom Sentinel for Infinite Scroll */}
      {hasNextPage && (
        <div
          ref={loadMoreTriggerRef}
          className="h-1 w-full snap-align-none pointer-events-none opacity-0"
        />
      )}

      {!hasNextPage && slides.length > 0 && (
        <div className="h-20 w-full flex items-center justify-center text-white/50 snap-align-none pb-10">
          <p className="text-sm">To już wszystko!</p>
        </div>
      )}
    </div>
  );
};

export default MainFeed;
