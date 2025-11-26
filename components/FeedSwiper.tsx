"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Swiper from 'swiper';
import { Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/mousewheel';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import { shallow } from 'zustand/shallow';
import { fetchComments, fetchAuthorProfile } from '@/lib/queries';

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

const FeedSwiper = () => {
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

  const queryClient = useQueryClient();
  const swiperRef = useRef(null);
  const swiperInstance = useRef<Swiper | null>(null);

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

  const [activeIndex, setActiveIndex] = useState(0);
  const slidesRef = useRef<SlideDTO[]>([]);
  const activeSlideRef = useRef<SlideDTO | null>(null);
  const queryStateRef = useRef({ hasNextPage: false, fetchNextPage: () => {} });

  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  useEffect(() => {
    queryStateRef.current = { hasNextPage, fetchNextPage };
  }, [hasNextPage, fetchNextPage]);

  const slides = useMemo(() => {
    return (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
  }, [data]);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  const hasSlides = slides.length > 0;
  useEffect(() => {
    if (hasSlides && swiperRef.current && !swiperInstance.current) {
      swiperInstance.current = new Swiper(swiperRef.current, {
        modules: [Mousewheel, Keyboard],
        direction: 'vertical',
        loop: true,
        mousewheel: true,
        keyboard: {
          enabled: true,
        },
        on: {
          slideChange: () => {
            if (swiperInstance.current) {
              const newActiveIndex = swiperInstance.current.realIndex;
              setActiveIndex(newActiveIndex);
              const slides = slidesRef.current;
              if (newActiveIndex >= 0 && newActiveIndex < slides.length) {
                const currentSlide = slides[newActiveIndex];
                const nextSlide = slides[newActiveIndex + 1] || null;

                if (activeSlideRef.current?.id !== currentSlide.id) {
                  setActiveSlide(currentSlide);
                  setNextSlide(nextSlide);

                  // Pre-fetch comments and author profile
                  if (currentSlide.id) {
                    queryClient.prefetchInfiniteQuery({
                      queryKey: ['comments', currentSlide.id],
                      queryFn: () => fetchComments({ slideId: currentSlide.id }),
                      initialPageParam: '',
                    });
                  }
                  if (currentSlide.userId) {
                    queryClient.prefetchQuery({
                      queryKey: ['author', currentSlide.userId],
                      queryFn: () => fetchAuthorProfile(currentSlide.userId),
                    });
                  }

                  if (currentSlide.type === 'video') {
                    playVideo();
                  }
                }
              }
              if (newActiveIndex >= slides.length - 2 && queryStateRef.current.hasNextPage) {
                queryStateRef.current.fetchNextPage();
              }
            }
          },
        },
      });
    }
  }, [hasSlides, queryClient, playVideo, setActiveSlide, setNextSlide]);

  useEffect(() => {
    if (swiperInstance.current) {
      swiperInstance.current.update();
    }
  }, [slides]);


  useEffect(() => {
    return () => {
      if (swiperInstance.current) {
        swiperInstance.current.destroy(true, true);
        swiperInstance.current = null;
      }
    };
  }, []);

  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div className="swiper" ref={swiperRef} style={{ height: '100vh' }}>
      <div className="swiper-wrapper">
        {slides.map((slide, index) => {
          const priorityLoad = index === activeIndex || index === activeIndex + 1;
          return (
            <div className="swiper-slide" key={slide.id}>
              <Slide slide={slide} priorityLoad={priorityLoad} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeedSwiper;
