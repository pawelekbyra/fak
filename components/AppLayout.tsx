"use client";

import React, { useEffect } from 'react';
import Preloader from './Preloader';
import { useTranslation } from '@/context/LanguageContext';
import TopBar from './TopBar';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { AuthorProfileModal } from './AuthorProfileModal';
import { PatronProfileModal } from './PatronProfileModal';
import AdminModal from './AdminModal';
import TippingModal from './TippingModal';
import CommentsModal from './CommentsModal';
import AccountPanel from './AccountPanel';
import NotificationPopup from './NotificationPopup';
import { AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    activeModal,
    setActiveModal,
    activeSlide,
    isAuthorProfileModalOpen,
    activeAuthorId,
    closeAuthorProfileModal,
    isPatronProfileModalOpen,
    activePatronId,
    closePatronProfileModal,
    isAdminModalOpen,
    closeAdminModal
  } = useStore(state => ({
    activeModal: state.activeModal,
    setActiveModal: state.setActiveModal,
    activeSlide: state.activeSlide,
    isAuthorProfileModalOpen: state.isAuthorProfileModalOpen,
    activeAuthorId: state.activeAuthorId,
    closeAuthorProfileModal: state.closeAuthorProfileModal,
    isPatronProfileModalOpen: state.isPatronProfileModalOpen,
    activePatronId: state.activePatronId,
    closePatronProfileModal: state.closePatronProfileModal,
    isAdminModalOpen: state.isAdminModalOpen,
    closeAdminModal: state.closeAdminModal
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
    <div className="flex h-full flex-col relative md:w-[calc(100vh*9/16)] md:mx-auto md:border md:border-zinc-800">
      <TopBar />
      <div className="flex-1 overflow-auto z-10">
        {children}
      </div>
      <AnimatePresence mode="wait">
        {isAuthorProfileModalOpen && activeAuthorId && (
          <AuthorProfileModal
            authorId={activeAuthorId}
            onClose={closeAuthorProfileModal}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {isPatronProfileModalOpen && activePatronId && (
            <PatronProfileModal
                patronId={activePatronId}
                onClose={closePatronProfileModal}
            />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
          {isAdminModalOpen && (
              <AdminModal />
          )}
      </AnimatePresence>
      <TippingModal />
      <CommentsModal
        isOpen={activeModal === 'comments'}
        onClose={() => setActiveModal(null)}
        slideId={activeSlide?.id}
        initialCommentsCount={activeSlide?.initialComments || 0}
      />
      <NotificationPopup
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
      />
      <AnimatePresence>
        {activeModal === 'account' && <AccountPanel key="account-panel" onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
