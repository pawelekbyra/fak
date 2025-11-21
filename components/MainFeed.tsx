import React, { useMemo, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard } from 'swiper/modules';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { SlidesResponseSchema } from '@/lib/validators';
import { SlideDTO } from '@/lib/dto';
import { shallow } from 'zustand/shallow';

// Import Swiper styles
import 'swiper/css';

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
    <div id="webyx-container" className="h-screen w-full bg-black">
      <Swiper
        direction={'vertical'}
        loop={true}
        mousewheel={true}
        keyboard={{ enabled: true }}
        modules={[Mousewheel, Keyboard]}
        className="h-full w-full"
        onSlideChange={(swiper) => {
           const realIndex = swiper.realIndex;
           const currentSlide = slides[realIndex];
           const nextSlide = slides[(realIndex + 1) % slides.length]; // Simple circular next slide for loop

           if (currentSlide && activeSlide?.id !== currentSlide.id) {
               setActiveSlide(currentSlide);
               setNextSlide(nextSlide);
               if (currentSlide.type === 'video') {
                   playVideo();
               }
           }

           // Fetch more if we are near the end of the list (accounting for loop duplicates logic roughly)
           // In loop mode, Swiper handles indices differently, but realIndex maps to data index.
           if (hasNextPage && realIndex >= slides.length - 2) {
               fetchNextPage();
           }
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="h-full w-full">
            {({ isActive }) => (
               <Slide
                 slide={slide}
                 isActive={isActive}
                 // Simple priority load: if active or next/prev (handled by Swiper buffering usually, but we can pass it)
                 priorityLoad={isActive}
               />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MainFeed;
