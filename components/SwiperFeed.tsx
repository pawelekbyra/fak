import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
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

const SwiperFeed = () => {
  const { setActiveSlide, setNextSlide, playVideo, activeSlide } = useStore(state => ({
    setActiveSlide: state.setActiveSlide,
    setNextSlide: state.setNextSlide,
    playVideo: state.playVideo,
    activeSlide: state.activeSlide
  }), shallow);

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
          // Initialize first slide as active
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <Swiper
      modules={[Mousewheel, Keyboard]}
      direction={'vertical'}
      className="w-full h-screen"
      mousewheel
      keyboard
      onSlideChange={(swiper) => {
        const activeIndex = swiper.realIndex;
        if (activeIndex >= 0 && activeIndex < slides.length) {
            const currentSlide = slides[activeIndex];
            const nextSlide = slides[activeIndex + 1] || null;

            if (activeSlide?.id !== currentSlide.id) {
                setActiveSlide(currentSlide);
                setNextSlide(nextSlide);

                if (currentSlide.type === 'video') {
                    playVideo();
                }
            }
        }
        if (hasNextPage && activeIndex >= slides.length - 2) {
          fetchNextPage();
        }
      }}
      loop={true}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={slide.id} virtualIndex={index}>
          <Slide slide={slide} priorityLoad={index < 2} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwiperFeed;
