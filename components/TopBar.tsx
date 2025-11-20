"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import NotificationPopup from './NotificationPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import LoginForm from './LoginForm';
import { useToast } from '@/context/ToastContext';
import MenuIcon from './icons/MenuIcon';
import BellIcon from './icons/BellIcon';
import PwaDesktopModal from './PwaDesktopModal';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, LogOut } from 'lucide-react';

const TopBar = () => {
  const { user, logout } = useUser();
  const setActiveModal = useStore((state) => state.setActiveModal);
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // This should be replaced with real data from a notifications context or API
  const unreadCount = 0;

  const handleLoggedOutMenuClick = () => {
    setActiveModal('account');
  };

  const handleLoggedOutNotificationClick = () => {
    addToast(t('notificationAlert'), 'info');
  };

  const handleLoggedInNotificationClick = () => {
    setShowNotifPanel(p => !p);
  };

  const handleShowPwaModal = () => {
    setShowPwaModal(true);
  };

  const handleLogout = async () => {
      await logout();
      setIsMenuOpen(false);
      addToast(t('logoutSuccess'), 'success');
  };

  const handleOpenAccount = () => {
      setActiveModal('account');
      setIsMenuOpen(false);
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-1 bg-black text-white border-b border-white/10"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
          transform: 'translateZ(0)',
        }}
      >
        {!user ? (
          // --- WIDOK DLA UŻYTKOWNIKÓW NIEZALOGOWANYCH ---
          <>
            <div className="flex justify-start">
              <Button variant="ghost" size="icon" onClick={handleLoggedOutMenuClick} aria-label={t('menuAriaLabel')}>
                <MenuIcon className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex justify-center flex-1 text-center">
              <button
                onClick={() => setIsLoginPanelOpen(panel => !panel)}
                className="font-semibold text-sm text-white transition-all duration-300 focus:outline-none whitespace-nowrap"
              >
                <span>{t('loggedOutText')}</span>
              </button>
            </div>
            <div className="flex justify-end">
              {isDesktop && (
                <Button variant="ghost" size="icon" onClick={handleShowPwaModal} aria-label={t('installPwaAriaLabel')}>
                  <span className="text-sm font-semibold">{t('installAppText')}</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLoggedOutNotificationClick} aria-label={t('notificationAriaLabel')}>
                <BellIcon className="w-6 h-6" />
              </Button>
            </div>
          </>
        ) : (
          // --- WIDOK DLA ZALOGOWANYCH UŻYTKOWNIKÓW ---
          <>
            <div className="flex justify-start">
              <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('menuAriaLabel')}>
                        <MenuIcon className="w-6 h-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" sideOffset={5} className="w-24 p-2 bg-zinc-900 border-zinc-800 text-white shadow-xl rounded-xl">
                      <div className="flex flex-col gap-2">
                          <button
                            onClick={handleOpenAccount}
                            className="flex flex-col items-center justify-center gap-1 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors w-full"
                          >
                              <User size={20} className="text-blue-400" />
                              <span className="text-[10px] font-medium">{t('account')}</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center gap-1 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors w-full"
                          >
                              <LogOut size={20} className="text-red-400" />
                              <span className="text-[10px] font-medium">{t('logout')}</span>
                          </button>
                      </div>
                  </PopoverContent>
              </Popover>

              {/* User Avatar (optional, keeping it for visual balance or removing if redundant) */}
              {/* Keeping it as a shortcut to profile or just display */}
               <div className="ml-2 flex items-center">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={t('avatarAlt')}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700" />
                )}
               </div>

            </div>
            <div className="flex justify-center flex-1">
              <span className="font-semibold text-lg text-white">Ting Tong</span>
            </div>
            <div className="flex justify-end">
              {isDesktop && (
                <Button variant="ghost" size="icon" onClick={handleShowPwaModal} aria-label={t('installPwaAriaLabel')}>
                  <span className="text-sm font-semibold">{t('installAppText')}</span>
                </Button>
              )}
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={handleLoggedInNotificationClick} aria-label={t('notificationAriaLabel')}>
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-black bg-pink-500" />
                  )}
                </Button>
                <NotificationPopup
                  isOpen={showNotifPanel}
                  onClose={() => setShowNotifPanel(false)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Login Panel --- */}
      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-[50] bg-black/60 backdrop-blur-sm pt-1"
            style={{ top: 'var(--topbar-height)' }}
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <LoginForm onLoginSuccess={() => setIsLoginPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PWA Modal --- */}
      {showPwaModal && <PwaDesktopModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />}
    </>
  );
};

export default TopBar;
