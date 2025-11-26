import { StateCreator } from 'zustand';

export interface LikeState {
    likes: number;
    isLiked: boolean;
}

export interface InteractionSlice {
  likeChanges: Record<string, LikeState>;
  commentCountChanges: Record<string, number>;
  toggleLike: (slideId: string, initialLikes: number, initialIsLiked: boolean) => void;
  incrementCommentCount: (slideId: string, initialCount: number) => void;
}

export const createInteractionSlice: StateCreator<InteractionSlice> = (set) => ({
  likeChanges: {},
  commentCountChanges: {},
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
  incrementCommentCount: (slideId, initialCount) => set((state) => {
    const currentCount = state.commentCountChanges[slideId] ?? initialCount;
    return {
        commentCountChanges: {
            ...state.commentCountChanges,
            [slideId]: currentCount + 1,
        },
    };
  }),
});
