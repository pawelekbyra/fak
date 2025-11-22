import { StateCreator } from 'zustand';

export type ModalType = 'account' | 'comments' | 'info' | 'login' | 'tipping' | 'author' | 'patron' | 'admin' | null;

export interface UISlice {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  isAuthorProfileModalOpen: boolean;
  activeAuthorId: string | null;
  openAuthorProfileModal: (authorId: string) => void;
  closeAuthorProfileModal: () => void;

  isPatronProfileModalOpen: boolean;
  activePatronId: string | null;
  openPatronProfileModal: (patronId: string) => void;
  closePatronProfileModal: () => void;

  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;

  isTippingModalOpen: boolean;
  openTippingModal: () => void;
  closeTippingModal: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  activeModal: null,
  isAuthorProfileModalOpen: false,
  activeAuthorId: null,

  isPatronProfileModalOpen: false,
  activePatronId: null,

  isAdminModalOpen: false,

  isTippingModalOpen: false,

  setActiveModal: (modal) => set({ activeModal: modal }),
  isAnyModalOpen: () => get().activeModal !== null,

  openAuthorProfileModal: (authorId) => set({ isAuthorProfileModalOpen: true, activeAuthorId: authorId }),
  closeAuthorProfileModal: () => set({ isAuthorProfileModalOpen: false, activeAuthorId: null }),

  openPatronProfileModal: (patronId) => set({ isPatronProfileModalOpen: true, activePatronId: patronId }),
  closePatronProfileModal: () => set({ isPatronProfileModalOpen: false, activePatronId: null }),

  openAdminModal: () => set({ isAdminModalOpen: true }),
  closeAdminModal: () => set({ isAdminModalOpen: false }),

  openTippingModal: () => set({ isTippingModalOpen: true }),
  closeTippingModal: () => set({ isTippingModalOpen: false }),
});
