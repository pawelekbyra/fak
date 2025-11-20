"use client";

import React, { useEffect } from 'react';
import Preloader from './Preloader';
import { useTranslation } from '@/context/LanguageContext';
import TopBar from './TopBar';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import GlobalVideoPlayer from './GlobalVideoPlayer';
import { AuthorProfileModal } from './AuthorProfileModal';
import TippingModal from './TippingModal';
import CommentsModal from './CommentsModal';
import AccountPanel from './AccountPanel';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    activeModal,
    setActiveModal,
    activeSlide
  } = useStore(state => ({
    activeModal: state.activeModal,
    setActiveModal: state.setActiveModal,
    activeSlide: state.activeSlide
  }), shallow);

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  return (
    <div className="flex h-full flex-col relative">
      <GlobalVideoPlayer />
      <TopBar />
      <div className="flex-1 overflow-auto z-10">
        {children}
      </div>
      <AuthorProfileModal />
      <TippingModal />
      <CommentsModal
        isOpen={activeModal === 'comments'}
        onClose={() => setActiveModal(null)}
        slideId={activeSlide?.id}
        initialCommentsCount={activeSlide?.initialComments || 0}
      />
      {activeModal === 'account' && <AccountPanel onClose={() => setActiveModal(null)} />}
    </div>
  );
}
