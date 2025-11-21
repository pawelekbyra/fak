import { StateCreator } from 'zustand';

export interface LikeState {
    likes: number;
    isLiked: boolean;
}

export interface InteractionSlice {
  likeChanges: Record<string, LikeState>;
  toggleLike: (slideId: string, initialLikes: number, initialIsLiked: boolean) => void;
}

export const createInteractionSlice: StateCreator<InteractionSlice> = (set) => ({
  likeChanges: {},
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
});
