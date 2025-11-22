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
import { User, LogOut, ChevronDown } from 'lucide-react';

const TopBar = () => {
  const { user, logout } = useUser();
  const setActiveModal = useStore((state) => state.setActiveModal);
  const { t, lang } = useTranslation();
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

  // Custom titles
  const loggedOutTitle = lang === 'pl' ? "Nie masz psychy się zalogować" : "Too scared to log in?";
  const loggedInTitle = "Ting Tong";

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
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 text-white/80 hover:text-white transition-colors active:bg-white/10 rounded-md outline-none"
                onClick={handleLoggedOutMenuClick}
                aria-label={t('menuAriaLabel')}
              >
                <MenuIcon className="w-6 h-6" />
              </motion.button>
            </div>
            <div className="flex justify-center flex-1 text-center">
              <button
                onClick={() => setIsLoginPanelOpen(panel => !panel)}
                className="flex items-center justify-center gap-2 font-semibold text-sm text-white transition-all duration-300 focus:outline-none whitespace-nowrap outline-none"
              >
                <span>{loggedOutTitle}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isLoginPanelOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <div className="flex justify-end items-center gap-1">
              {isDesktop && (
                <Button variant="ghost" size="icon" onClick={handleShowPwaModal} aria-label={t('installPwaAriaLabel')}>
                  <span className="text-sm font-semibold">{t('installAppText')}</span>
                </Button>
              )}
              <motion.button
                 whileTap={{ scale: 0.9 }}
                 className="p-2 text-white/80 hover:text-white transition-colors active:bg-white/10 rounded-md outline-none"
                 onClick={handleLoggedOutNotificationClick}
                 aria-label={t('notificationAriaLabel')}
              >
                <BellIcon className="w-6 h-6" />
              </motion.button>
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
                  <PopoverContent align="start" sideOffset={5} className="w-auto min-w-[150px] p-2 bg-zinc-900 border-zinc-800 text-white shadow-xl rounded-xl">
                      <div className="flex flex-col gap-2">
                          <button
                            onClick={handleOpenAccount}
                            className="flex flex-row items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors w-full"
                          >
                              <User size={20} className="text-blue-400" />
                              <span className="text-sm font-medium whitespace-nowrap">{t('account')}</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex flex-row items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors w-full"
                          >
                              <LogOut size={20} className="text-red-400" />
                              <span className="text-sm font-medium whitespace-nowrap">{t('logout')}</span>
                          </button>
                      </div>
                  </PopoverContent>
              </Popover>

            </div>
            <div className="flex justify-center flex-1">
              <span className="font-semibold text-lg text-white">{loggedInTitle}</span>
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
            className="absolute left-0 w-full z-[50] bg-black/80 backdrop-blur-md pt-0 border-b border-zinc-800"
            style={{ top: 'var(--topbar-height)' }}
            initial={{ y: '-100%' }}
            animate={{ y: '0%', transition: { type: 'spring', stiffness: 200, damping: 30 } }}
            exit={{ y: '-100%', transition: { ease: 'easeInOut', duration: 0.5 } }}
          >
            <div className="relative z-[70]">
                <LoginForm onLoginSuccess={() => setIsLoginPanelOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PWA Modal --- */}
      {showPwaModal && <PwaDesktopModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />}
    </>
  );
};

export default TopBar;
