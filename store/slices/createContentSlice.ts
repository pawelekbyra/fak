import { StateCreator } from 'zustand';
import { SlideDTO } from '@/lib/dto';

export interface ContentSlice {
  activeSlide: SlideDTO | null;
  nextSlide: SlideDTO | null;
  setActiveSlide: (slide: SlideDTO | null) => void;
  setNextSlide: (slide: SlideDTO | null) => void;
  jumpToSlide: (slideId: string) => void;
}

export const createContentSlice: StateCreator<ContentSlice> = (set) => ({
  activeSlide: null,
  nextSlide: null,
  setActiveSlide: (slide) => set({ activeSlide: slide }),
  setNextSlide: (slide) => set({ nextSlide: slide }),
  jumpToSlide: (slideId) => console.log('Jump to slide not implemented globally yet', slideId),
});
