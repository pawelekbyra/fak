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
import { MOCK_SLIDES } from '@/lib/mock-data';

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
    retry: false,
  });

  const slides = useMemo(() => {
    if (isError || (data?.pages.length === 0)) {
        return MOCK_SLIDES;
    }
    const fetchedSlides = (data?.pages.flatMap(page => page.slides) ?? []) as SlideDTO[];
    return fetchedSlides.length > 0 ? fetchedSlides : MOCK_SLIDES;
  }, [data, isError]);

  useEffect(() => {
      if (slides.length > 0 && !activeSlide) {
          setActiveSlide(slides[0]);
          setNextSlide(slides[1] || null);
      }
  }, [slides, activeSlide, setActiveSlide, setNextSlide]);


  if (isLoading && !isError && slides === MOCK_SLIDES) {
     if (!data) return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
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
           const nextIndex = (realIndex + 1) % slides.length;
           const nextSlide = slides[nextIndex];

           if (currentSlide && activeSlide?.id !== currentSlide.id) {
               setActiveSlide(currentSlide);
               setNextSlide(nextSlide);
               if (currentSlide.type === 'video') {
                   playVideo();
               }
           }

           if (hasNextPage && realIndex >= slides.length - 2 && slides !== MOCK_SLIDES) {
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
