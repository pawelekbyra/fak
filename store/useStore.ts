import { create } from 'zustand';
import { SlideDTO } from '@/lib/dto';
import React from 'react';

// Backward compatibility for components that might still import Slide from types
// but generally we should move to SlideDTO.
// We'll alias it here if needed, or just use SlideDTO.
// The GlobalVideoPlayer uses Slide | null, but we are moving to SlideDTO.
type Slide = SlideDTO;

export type ModalType = 'account' | 'comments' | 'info' | 'login' | 'tipping' | 'author' | null;

interface LikeState {
    likes: number;
    isLiked: boolean;
}

interface AppState {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  // Author Profile Modal State
  isAuthorProfileModalOpen: boolean;
  authorProfileId: string | null;
  openAuthorProfileModal: (authorId: string) => void;
  closeAuthorProfileModal: () => void;
  jumpToSlide: (slideId: string) => void; // Placeholder

  // Tipping Modal State
  isTippingModalOpen: boolean;
  openTippingModal: () => void;
  closeTippingModal: () => void;

  // User state
  isLoggedIn: boolean;

  // Slide state
  activeSlide: Slide | null;
  nextSlide: Slide | null;
  setActiveSlide: (slide: Slide | null) => void;
  setNextSlide: (slide: Slide | null) => void;

  likeChanges: Record<string, LikeState>;
  toggleLike: (slideId: string, initialLikes: number, initialIsLiked: boolean) => void;

  // Global video player state
  isMuted: boolean;
  isPlaying: boolean;
  userPlaybackIntent: 'play' | 'pause' | null;
  currentTime: number;
  duration: number;

  // Video player actions
  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isLoggedIn: false,
  activeSlide: null,
  nextSlide: null,
  likeChanges: {},

  isAuthorProfileModalOpen: false,
  authorProfileId: null,
  isTippingModalOpen: false,

  // Video Player
  isMuted: true,
  isPlaying: false,
  userPlaybackIntent: null,
  currentTime: 0,
  duration: 0,


  // --- ACTIONS ---
  setActiveModal: (modal) => set({ activeModal: modal }),
  setActiveSlide: (slide) => set({ activeSlide: slide }),
  setNextSlide: (slide) => set({ nextSlide: slide }),

  openAuthorProfileModal: (authorId) => set({ isAuthorProfileModalOpen: true, authorProfileId: authorId }),
  closeAuthorProfileModal: () => set({ isAuthorProfileModalOpen: false, authorProfileId: null }),
  jumpToSlide: (slideId) => console.log('Jump to slide not implemented globally yet', slideId),

  openTippingModal: () => set({ isTippingModalOpen: true }),
  closeTippingModal: () => set({ isTippingModalOpen: false }),

  toggleLike: (slideId, initialLikes, initialIsLiked) => set((state) => {
    const currentChanges = state.likeChanges[slideId];
    const isCurrentlyLiked = currentChanges ? currentChanges.isLiked : initialIsLiked;
    const currentLikes = currentChanges ? currentChanges.likes : initialLikes;

    const newIsLiked = !isCurrentlyLiked;
    const newLikes = newIsLiked ? currentLikes + 1 : currentLikes - 1;

    return {
        likeChanges: {
            ...state.likeChanges,
            [slideId]: { likes: newLikes, isLiked: newIsLiked },
        },
    };
  }),

  // Video Player
  setIsMuted: (isMuted) => set({ isMuted }),
  togglePlay: () => set((state) => {
    const newIsPlaying = !state.isPlaying;
    return {
      isPlaying: newIsPlaying,
      userPlaybackIntent: newIsPlaying ? 'play' : 'pause',
    };
  }),
  playVideo: () => set({ isPlaying: true }),
  pauseVideo: () => set({ isPlaying: false }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  seek: (time) => set({ currentTime: time }),


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
