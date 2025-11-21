import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import { shallow } from 'zustand/shallow';

// 1. Fetch Function
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
  // 2. Store & State
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  const containerRef = useRef<HTMLDivElement>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // 3. Data Query
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

  // 4. Intersection Observer Logic (The Core "Engine")
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // TikTok style: strict snapping usually aligns quickly.
            // We use a high threshold to detect the "dominant" slide.
            if (entry.intersectionRatio >= 0.6) {
               const index = Number(entry.target.getAttribute('data-index'));
               if (!isNaN(index)) {
                   setCurrentViewIndex(index);
               }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6, // Trigger when 60% visible
      }
    );

    const elements = container.querySelectorAll('[data-index]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [slides.length]); // Re-run when list grows

  // 5. Sync State with Zustand (Debounced effect not strictly needed if Observer is stable, but safe)
  useEffect(() => {
      if (slides.length === 0) return;

      const currentSlide = slides[currentViewIndex];
      if (currentSlide && activeSlide?.id !== currentSlide.id) {
          const nextSlide = slides[currentViewIndex + 1] || null;
          setActiveSlide(currentSlide);
          setNextSlide(nextSlide);

          // Auto-play if video
          if (currentSlide.type === 'video') {
              playVideo();
          }
      }
  }, [currentViewIndex, slides, activeSlide?.id, setActiveSlide, setNextSlide, playVideo]);

  // 6. Infinite Scroll Trigger
  useEffect(() => {
      // Load more when we are 2 slides away from the end
      if (currentViewIndex >= slides.length - 2 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
      }
  }, [currentViewIndex, slides.length, hasNextPage, isFetchingNextPage, fetchNextPage]);


  // 7. Loading / Error States
  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-[100dvh] bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-[100dvh] bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  // 8. Render (Virtualization + Scroll Snap)
  return (
    <div
        ref={containerRef}
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
    >
        {slides.map((slide, index) => {
            // Lightweight Virtualization:
            // Only render content for [current - 1, current, current + 1, current + 2]
            // Keep DOM nodes for others to maintain scroll position, but empty.
            const shouldRenderContent = index >= currentViewIndex - 1 && index <= currentViewIndex + 2;

            // Priority Load: Active or Next one
            const priorityLoad = index === currentViewIndex || index === currentViewIndex + 1;

            return (
                <div
                    key={`${slide.id}-${index}`}
                    data-index={index}
                    className="h-[100dvh] w-full snap-start snap-always relative"
                >
                    {shouldRenderContent ? (
                        <Slide
                            slide={slide}
                            priorityLoad={priorityLoad}
                        />
                    ) : (
                         /* Placeholder to keep scroll height correct */
                        <div className="w-full h-full bg-black" />
                    )}
                </div>
            );
        })}
    </div>
  );
};

export default MainFeed;
