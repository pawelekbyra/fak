"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { SlideDTO } from '@/lib/dto';
import { SlidesResponseSchema } from '@/lib/validators';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=5`);
  if (!res.ok) throw new Error('Failed to fetch slides');
  const data = await res.json();
  try {
      return SlidesResponseSchema.parse(data);
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
        }
    }, [slides, activeSlide, setActiveSlide, setNextSlide]);

    // Setup Intersection Observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const options = {
            root: container,
            threshold: 0.6, // Must be 60% visible to count
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.getAttribute('data-index'));
                    if (!isNaN(index)) {
                        setActiveIndex(index);
                    }
                }
            });
        }, options);

        const elements = container.querySelectorAll('.slide-item');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [slides]);

    // Handle Active Slide Update and Infinite Scroll trigger
    useEffect(() => {
        if (slides.length > 0) {
            const currentSlide = slides[activeIndex];

            // Update store if changed
            if (currentSlide && currentSlide.id !== activeSlide?.id) {
                setActiveSlide(currentSlide);
                setNextSlide(slides[activeIndex + 1] || null);

                // Auto-play video
                if (currentSlide.type === 'video') {
                    playVideo();
                }
            }

            // Load more if near end (within 2 items)
            if (activeIndex >= slides.length - 2 && hasNextPage) {
                fetchNextPage();
            }
        }
    }, [activeIndex, slides, activeSlide, setActiveSlide, setNextSlide, playVideo, hasNextPage, fetchNextPage]);

    if (isLoading && slides.length === 0) {
        return <div className="w-full h-[100dvh] bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
    }

    if (isError) {
        return <div className="w-full h-[100dvh] bg-black flex items-center justify-center text-white">Error loading slides.</div>;
    }

    return (
        <div
            ref={containerRef}
            className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
        >
            {slides.map((slide, index) => {
                // Optimization: "Manual Virtualization" / Windowing
                // Only render video players for active index +/- 2.
                // Others get a lightweight placeholder.
                const isNear = Math.abs(index - activeIndex) <= 2;
                const shouldLoad = index === activeIndex + 1; // Preload next

                return (
                    <div
                        key={`${slide.id}-${index}`}
                        data-index={index}
                        className="slide-item h-[100dvh] w-full snap-start snap-always"
                    >
                        <Slide
                            slide={slide}
                            priorityLoad={shouldLoad}
                            shouldRenderVideo={isNear}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default MainFeed;
