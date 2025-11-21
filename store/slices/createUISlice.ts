import { StateCreator } from 'zustand';

export type ModalType = 'account' | 'comments' | 'info' | 'login' | 'tipping' | 'author' | null;

export interface UISlice {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  isAuthorProfileModalOpen: boolean;
  authorProfileId: string | null;
  openAuthorProfileModal: (authorId: string) => void;
  closeAuthorProfileModal: () => void;

  isTippingModalOpen: boolean;
  openTippingModal: () => void;
  closeTippingModal: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  activeModal: null,
  isAuthorProfileModalOpen: false,
  authorProfileId: null,
  isTippingModalOpen: false,

  setActiveModal: (modal) => set({ activeModal: modal }),
  isAnyModalOpen: () => get().activeModal !== null,

  openAuthorProfileModal: (authorId) => set({ isAuthorProfileModalOpen: true, authorProfileId: authorId }),
  closeAuthorProfileModal: () => set({ isAuthorProfileModalOpen: false, authorProfileId: null }),

  openTippingModal: () => set({ isTippingModalOpen: true }),
  closeTippingModal: () => set({ isTippingModalOpen: false }),
});
