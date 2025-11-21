import { create } from 'zustand';
import { createVideoSlice, VideoSlice } from './slices/createVideoSlice';
import { createUISlice, UISlice } from './slices/createUISlice';
import { createContentSlice, ContentSlice } from './slices/createContentSlice';
import { createInteractionSlice, InteractionSlice } from './slices/createInteractionSlice';

// Combine all slice interfaces into one AppState
type AppState = VideoSlice & UISlice & ContentSlice & InteractionSlice;

export const useStore = create<AppState>()((...a) => ({
  ...createVideoSlice(...a),
  ...createUISlice(...a),
  ...createContentSlice(...a),
  ...createInteractionSlice(...a),
}));
