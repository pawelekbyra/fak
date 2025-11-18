import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | 'login' | 'tip' | null;

interface LikeState {
    likes: number;
    isLiked: boolean;
}

interface AppState {
    activeModal: ModalType;
    setActiveModal: (modal: ModalType) => void;
    isAnyModalOpen: () => boolean;

    // User state
    isLoggedIn: boolean;

    // Slide state
    activeSlide: Slide | null;
    activeSlideIndex: number;
    activeHlsUrl: string | null;
    setActiveSlide: (slide: Slide | null, index: number) => void;
    likeChanges: Record<string, LikeState>;
    toggleLike: (slideId: string, initialLikes: number, initialIsLiked: boolean) => void;

    // Global video player state
    isMuted: boolean;
    isPlaying: boolean;
    userPlaybackIntent: 'play' | 'pause' | null;
    currentTime: number;
    duration: number;

    // Author Profile Modal
    authorProfileId: string | null;
    isAuthorProfileModalOpen: boolean;
    openAuthorProfileModal: (userId: string) => void;
    closeAuthorProfileModal: () => void;
    jumpToSlide: (slideId: string) => Promise<void>;

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
    isLoggedIn: false, // Assume user is not logged in initially
    activeSlide: null,
    activeSlideIndex: 0,
    activeHlsUrl: null,
    likeChanges: {},

    // Video Player
    isMuted: true,
    isPlaying: false,
    userPlaybackIntent: null,
    currentTime: 0,
    duration: 0,

    // Author Profile Modal
    authorProfileId: null,
    isAuthorProfileModalOpen: false,


    // --- ACTIONS ---
    setActiveModal: (modal) => set({ activeModal: modal }),
    openAuthorProfileModal: (userId) => set({ authorProfileId: userId, isAuthorProfileModalOpen: true }),
    closeAuthorProfileModal: () => set({ authorProfileId: null, isAuthorProfileModalOpen: false }),
    jumpToSlide: async (slideId) => {
        // This will be overridden by the component
    },
    setActiveSlide: (slide, index) => {
        let hlsUrl = null;
        if (slide && slide.type === 'video' && slide.data?.hlsUrl) {
            hlsUrl = slide.data.hlsUrl;
        }
        set({ activeSlide: slide, activeSlideIndex: index, activeHlsUrl: hlsUrl })
    },

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
    seek: (time) => set({ currentTime: time }), // This is a simplified seek


    // --- COMPUTED / SELECTORS ---
    isAnyModalOpen: () => get().activeModal !== null,
}));