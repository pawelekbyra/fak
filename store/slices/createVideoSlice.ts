import { StateCreator } from 'zustand';

export interface VideoSlice {
  isMuted: boolean;
  isPlaying: boolean;
  userPlaybackIntent: 'play' | 'pause' | null;
  duration: number;
  currentTime: number;

  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  seekTo: (time: number) => void;
}

export const createVideoSlice: StateCreator<VideoSlice> = (set) => ({
  isMuted: true,
  isPlaying: false,
  userPlaybackIntent: null,
  duration: 0,
  currentTime: 0,

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
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (time) => set({ currentTime: time }),
  // seekTo logic is slightly complex because it needs to interact with the video element.
  // Usually, we set a 'seekTarget' in store and the player reacts to it.
  // For now, let's add seekTarget to the state.
  seekTo: (time) => set({ currentTime: time }), // Simplified for now, might need 'seekRequest' timestamp
});
