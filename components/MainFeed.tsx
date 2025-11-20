import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=5`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();

  // Runtime validation of the API response
  // We use the Zod schema to ensure the data is exactly what we expect.
  // If the API returns extra fields, they are stripped (if configured so) or ignored.
  // If fields are missing or wrong type, this will throw an error, alerting us to the mismatch immediately.
  try {
      const parsed = SlidesResponseSchema.parse(data);
      return parsed;
  } catch (e) {
      console.error("Slides API validation error:", e);
      // In production, we might want to gracefully fallback, but the requirement is to "shout" about mismatches.
      // Retrying might not help if the schema is wrong, so we rethrow.
      throw new Error("Invalid data received from Slides API");
  }
};

const MainFeed = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [isLooping, setIsLooping] = useState(false);
  const isJumping = useRef(false);
  const setActiveSlide = useStore(state => state.setActiveSlide);
  const playVideo = useStore(state => state.playVideo);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    // Cast to SlideDTO because Zod schema output aligns with it, but TS needs a nudge if they aren't identical type refs
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  const loopedSlides = useMemo(() => {
      if (!isLooping || slides.length === 0) return slides;
      return [...slides, ...slides, ...slides];
  }, [slides, isLooping]);

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    } else if (slides.length > 0) {
        setIsLooping(true);
    }
  }, [hasNextPage, fetchNextPage, slides.length]);

  useEffect(() => {
    if (isLooping && scrollContainerRef.current) {
        const slideHeight = scrollContainerRef.current.clientHeight;
        const initialScrollTop = slides.length * slideHeight;
        scrollContainerRef.current.scrollTop = initialScrollTop;
    }
  }, [isLooping, slides.length]);

  useEffect(() => {
      if (!isLooping) return;

      const observer = new IntersectionObserver(
          (entries) => {
              if (isJumping.current) return;
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      const slideHeight = scrollContainerRef.current!.clientHeight;
                      isJumping.current = true;
                      if (entry.target === topSentinelRef.current) {
                          const newScrollTop = scrollContainerRef.current!.scrollTop + (slides.length * slideHeight);
                          scrollContainerRef.current!.scrollTop = newScrollTop;
                      } else if (entry.target === bottomSentinelRef.current) {
                          const newScrollTop = scrollContainerRef.current!.scrollTop - (slides.length * slideHeight);
                          scrollContainerRef.current!.scrollTop = newScrollTop;
                      }
                      setTimeout(() => { isJumping.current = false; }, 100);
                  }
              });
          },
          { root: scrollContainerRef.current, threshold: 0.1 }
      );

      if (topSentinelRef.current) observer.observe(topSentinelRef.current);
      if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

      return () => {
          observer.disconnect();
      };
  }, [isLooping, slides]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideId = (entry.target as HTMLElement).dataset.slideId;
            const slide = slides.find(s => s.id === slideId);
            if (slide) {
              // We might need to adapt SlideDTO to whatever internal store expects if it differs
              // Assuming store is flexible or updated to match
              setActiveSlide(slide as any);
              if (slide.type === 'video') {
                playVideo();
              }
            }
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.5 }
    );

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [slides, setActiveSlide]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div ref={scrollContainerRef} className="w-full h-screen overflow-y-scroll snap-y snap-mandatory">
      {isLooping && <div ref={topSentinelRef} />}
      {loopedSlides.map((slide, index) => (
        <div
          key={`${slide.id}-${index}`}
          className="h-full w-full snap-start"
          ref={el => { slideRefs.current[index] = el; }}
          data-slide-id={slide.id}
        >
          <Slide slide={slide} />
        </div>
      ))}
      {isLooping && <div ref={bottomSentinelRef} />}
    </div>
  );
};

export default MainFeed;
