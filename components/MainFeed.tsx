import React, { useMemo, useEffect, useRef } from 'react';
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
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  const activeIndex = useMemo(() => {
      if (!activeSlide) return 0;
      return slides.findIndex(s => s.id === activeSlide.id);
  }, [slides, activeSlide]);

  // Initialize first slide
  useEffect(() => {
      if (slides.length > 0 && !activeSlide) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);

  // Active Slide Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = {
      root: container,
      threshold: 0.6,
    };

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index) && slides[index]) {
             const currentSlide = slides[index];

             if (activeSlide?.id !== currentSlide.id) {
                 setActiveSlide(currentSlide);
                 setNextSlide(slides[index + 1] || null);
                 if (currentSlide.type === 'video') {
                     playVideo();
                 }
             }
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, options);

    const elements = container.querySelectorAll('.slide-item');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [slides, activeSlide, setActiveSlide, setNextSlide, playVideo]);

  // Infinite Scroll Observer
  useEffect(() => {
      if (loadMoreObserverRef.current) loadMoreObserverRef.current.disconnect();

      loadMoreObserverRef.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
              fetchNextPage();
          }
      });

      if (loadMoreRef.current) {
          loadMoreObserverRef.current.observe(loadMoreRef.current);
      }

      return () => {
          loadMoreObserverRef.current?.disconnect();
      };
  }, [hasNextPage, fetchNextPage]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-[100dvh] bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-[100dvh] bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div
        ref={containerRef}
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black"
    >
        {slides.map((slide, index) => {
            const priorityLoad = index === activeIndex || index === activeIndex + 1;
            return (
                <div
                    key={slide.id}
                    data-index={index}
                    className="slide-item h-[100dvh] w-full snap-start flex-shrink-0"
                >
                    <Slide slide={slide} priorityLoad={priorityLoad} />
                </div>
            )
        })}

        <div ref={loadMoreRef} className="h-20 w-full snap-start flex items-center justify-center text-white/50 text-sm">
             {hasNextPage && "Loading..."}
        </div>
    </div>
  );
};

export default MainFeed;
