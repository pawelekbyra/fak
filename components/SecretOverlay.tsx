"use client";

import React, { memo } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useStore } from '@/store/useStore';
import { usePWAStatus } from '@/hooks/usePWAStatus';

const SecretOverlay: React.FC = memo(() => {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useUser();
  const { setActiveModal } = useStore();
  const { isStandalone } = usePWAStatus();

  const handleLoginClick = () => setActiveModal('login');
  const handleTipClick = () => setActiveModal('tipping');

  const OverlayContent: React.FC<{
    title: string;
    subtitle: string;
    buttonText: string;
    onClick: () => void;
  }> = ({ title, subtitle, buttonText, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="secret-title font-bold leading-tight drop-shadow-md">{title}</h2>
      <p className="secret-subtitle opacity-75 drop-shadow-sm mt-1">{subtitle}</p>
      <Button onClick={onClick} className="mt-4 px-6 py-3 font-semibold rounded-full" variant="secondary">
        {buttonText}
      </Button>
    </motion.div>
  );

  let content = null;
  if (!isLoggedIn) {
    // Overlay A: Not logged in
    content = (
      <OverlayContent
        title={t('secretTitle')}
        subtitle={t('secretSubtitle')}
        buttonText={t('secretLoginText') || 'Log in to watch'}
        onClick={handleLoginClick}
      />
    );
  } else if (!isStandalone) {
    // Overlay B: Logged in, but not in standalone PWA
    content = (
      <OverlayContent
        title="Użyj zainstalowanej aplikacji"
        subtitle="Aby oglądać dalej, otwórz aplikację Ting Tong na swoim urządzeniu."
        buttonText="Rozumiem"
        onClick={() => {}}
      />
    );
  } else if (!['admin', 'author', 'patron'].includes(user?.role || '')) {
    // Overlay C: Logged in, in PWA, but not a privileged user (Admin, Author, Patron)
    content = (
      <OverlayContent
        title="Odblokuj dostęp"
        subtitle="Zostań patronem, aby oglądać wszystkie treści bez ograniczeń."
        buttonText="Wpłać napiwek, aby odblokować"
        onClick={handleTipClick}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-white select-none">
      {content}
    </div>
  );
});

SecretOverlay.displayName = 'SecretOverlay';

export default SecretOverlay;
