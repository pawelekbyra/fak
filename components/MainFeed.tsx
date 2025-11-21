import React, { useMemo, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
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
      return SlidesResponseSchema.parse(data);
  } catch (e) {
      console.error("Slides API validation error:", e);
      throw new Error("Invalid data received from Slides API");
  }
};

interface FeedItemProps {
    slide: SlideDTO;
    nextSlide: SlideDTO | null;
    onActive: (slide: SlideDTO, next: SlideDTO | null) => void;
}

const FeedItem = React.memo(({ slide, nextSlide, onActive }: FeedItemProps) => {
    const { ref: activeRef, inView: isActiveView } = useInView({
        threshold: 0.6, // Higher threshold to ensure it's the main focused item
    });

    const { ref: loadRef, inView: isLoadView } = useInView({
        rootMargin: '200px 0px 200px 0px', // Preload when approaching
    });

    // Combine refs
    const setRefs = useCallback((node: HTMLDivElement | null) => {
        activeRef(node);
        loadRef(node);
    }, [activeRef, loadRef]);

    useEffect(() => {
        if (isActiveView) {
            onActive(slide, nextSlide);
        }
    }, [isActiveView, slide, nextSlide, onActive]);

    return (
        <div ref={setRefs} className="h-[100dvh] w-full snap-start flex-shrink-0 relative">
            <Slide slide={slide} priorityLoad={isLoadView} />
        </div>
    );
});

FeedItem.displayName = 'FeedItem';

const MainFeed = () => {
    const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(
        (state) => ({
            setActiveSlide: state.setActiveSlide,
            setNextSlide: state.setNextSlide,
            playVideo: state.playVideo,
            activeSlide: state.activeSlide,
        }),
        shallow
    );

    const { data, fetchNextPage, hasNextPage, isLoading, isError } = useInfiniteQuery({
        queryKey: ['slides'],
        queryFn: fetchSlides,
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const slides = useMemo(() => {
        return (data?.pages.flatMap((page) => page.slides) ?? []) as SlideDTO[];
    }, [data]);

    // Initialize first slide
    useEffect(() => {
        if (slides.length > 0 && !activeSlide) {
            setActiveSlide(slides[0]);
            setNextSlide(slides[1] || null);
        }
    }, [slides, activeSlide, setActiveSlide, setNextSlide]);

    // Infinite scroll trigger
    const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
        rootMargin: '400px',
    });

    useEffect(() => {
        if (loadMoreInView && hasNextPage) {
            fetchNextPage();
        }
    }, [loadMoreInView, hasNextPage, fetchNextPage]);

    const handleActive = useCallback((slide: SlideDTO, next: SlideDTO | null) => {
        // Only update if the slide is different to avoid loops/renders
        // Note: We can't access state directly inside useCallback if we want it stable,
        // but we can rely on the component re-rendering if activeSlide changes.
        // Actually, we want handleActive to NOT change so FeedItem doesn't re-render.
        // So we use the functional updates or state.getState if outside, but here we rely on the store.
        // To avoid dependency on 'activeSlide' (which changes often), we check inside the store action or here?
        // Let's check if it matches the *current* store state to avoid dispatching.

        const currentActive = useStore.getState().activeSlide;
        if (currentActive?.id !== slide.id) {
            setActiveSlide(slide);
            setNextSlide(next);
            if (slide.type === 'video') {
                playVideo();
            }
        }
    }, [setActiveSlide, setNextSlide, playVideo]);

    if (isLoading && slides.length === 0) {
        return (
            <div className="w-screen h-[100dvh] bg-black flex items-center justify-center">
                <Skeleton className="w-full h-full bg-zinc-900" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-screen h-[100dvh] bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <p>Something went wrong.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-pink-600 rounded-full text-sm font-bold">
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {slides.map((slide, index) => (
                <FeedItem
                    key={slide.id}
                    slide={slide}
                    nextSlide={slides[index + 1] || null}
                    onActive={handleActive}
                />
            ))}

            {/* Sentinel for loading more */}
            <div ref={loadMoreRef} className="h-20 w-full flex justify-center items-center snap-start">
                {hasNextPage && <div className="w-6 h-6 border-2 border-white/30 border-t-pink-500 rounded-full animate-spin" />}
            </div>
        </div>
    );
};

export default MainFeed;
