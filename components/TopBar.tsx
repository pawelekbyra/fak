"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import LoginForm from './LoginForm';
import { useToast } from '@/context/ToastContext';
import MenuIcon from './icons/MenuIcon';
import BellIcon from './icons/BellIcon';
import PwaDesktopModal from './PwaDesktopModal';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { usePathname } from 'next/navigation';

const TopBar = () => {
  const { user, logout } = useUser();
  const { activeModal, setActiveModal, openAdminModal } = useStore();
  const { t, lang } = useTranslation();
  const { addToast } = useToast();
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hook for push subscription
  const { permission, subscribe } = usePushSubscription();

  useEffect(() => {
    if (activeModal === 'login') {
      setIsLoginPanelOpen(true);
    }
  }, [activeModal]);

  const handleToggleLoginPanel = () => {
    setIsLoginPanelOpen(prev => {
      const newState = !prev;
      if (!newState && activeModal === 'login') {
        setActiveModal(null);
      }
      return newState;
    });
  };

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  if (pathname?.startsWith('/setup')) {
    return null;
  }

  // This should be replaced with real data from a notifications context or API
  const unreadCount = 0;

  const handleLoggedOutMenuClick = () => {
    addToast(t('loginRequired') || 'Musisz się zalogować', 'locked');
  };

  const handleBellClick = async () => {
    // 'prompt' is sometimes used in older APIs or specific contexts, but Notification.permission is 'default'
    if (permission === 'default') {
      const granted = await subscribe();
      if (granted) {
          addToast(t('notificationsEnabled') || 'Powiadomienia włączone', 'success');
      } else {
          // If denied or failed, we might want to guide user or just do nothing for now
          // If they just dismissed, permission remains default/prompt usually
      }
    } else if (permission === 'granted') {
        if (!user) {
            addToast(t('loginRequired') || 'Musisz się zalogować', 'locked');
        } else {
            setActiveModal('notifications');
        }
    } else {
       // Denied
       // Optionally show instruction how to enable
       if (!user) {
            addToast(t('loginRequired') || 'Musisz się zalogować', 'locked');
        } else {
            setActiveModal('notifications');
        }
    }
  };

  const handleShowPwaModal = () => {
    setShowPwaModal(true);
  };

  const handleLogout = async () => {
      setIsMenuOpen(false);
      setTimeout(async () => {
        await logout();
        addToast(t('logoutSuccess'), 'success');
      }, 300);
  };

  const handleOpenAccount = () => {
      setActiveModal('account');
      setIsMenuOpen(false);
  };

  const handleOpenAdmin = () => {
      openAdminModal();
      setIsMenuOpen(false);
  };

  // Custom titles
  const loggedOutTitle = lang === 'pl' ? "Nie masz psychy się zalogować" : "Too scared to log in?";
  const loggedInTitle = "Ting Tong";

  return (
    <>
      <div
        className="absolute top-0 left-0 w-full z-[60] flex items-center justify-between px-1 bg-black text-white border-b border-white/10"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
        }}
      >
        {!user ? (
          // --- WIDOK DLA UŻYTKOWNIKÓW NIEZALOGOWANYCH ---
          <>
            <div className="flex justify-start">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 text-white hover:text-white transition-colors active:bg-white/10 rounded-md outline-none"
                onClick={handleLoggedOutMenuClick}
                aria-label={t('menuAriaLabel')}
              >
                <MenuIcon className="w-6 h-6" />
              </motion.button>
            </div>
            <div className="flex justify-center flex-1 text-center">
              <button
                onClick={handleToggleLoginPanel}
                className="relative flex items-center justify-center font-semibold text-sm text-white transition-all duration-300 focus:outline-none whitespace-nowrap outline-none"
              >
                <span>{loggedOutTitle}</span>
                <div className="absolute left-full ml-0.5 flex items-center">
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isLoginPanelOpen ? 'rotate-180' : ''}`}
                  />
                </div>
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
                 className="p-2 text-white hover:text-white transition-colors active:bg-white/10 rounded-md outline-none"
                 onClick={handleBellClick}
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
                  <PopoverContent
                    align="start"
                    sideOffset={5}
                    className="w-auto min-w-[150px] p-2 bg-zinc-900 border-zinc-800 text-white shadow-xl rounded-xl data-[state=closed]:slide-out-to-top-5 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                  >
                      <div className="flex flex-col gap-2">
                          {/* Admin Button */}
                          {user.role === 'admin' && (
                              <button
                                  onClick={handleOpenAdmin}
                                  className="flex flex-row items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors w-full mb-1 border border-pink-500/30"
                              >
                                  <Settings size={20} className="text-pink-500" />
                                  <span className="text-sm font-medium whitespace-nowrap text-pink-100">Zarządzaj</span>
                              </button>
                          )}
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
                <Button variant="ghost" size="icon" onClick={handleBellClick} aria-label={t('notificationAriaLabel')}>
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-black bg-pink-500" />
                  )}
                </Button>
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
            {/* Spacer to match bottom empty space if needed, or just container style */}
            <div className="relative z-[70] pt-4"> {/* Added pt-4 to give some space above */}
                <div className="h-4 bg-transparent w-full" /> {/* Explicit spacer if needed */}
                <LoginForm onLoginSuccess={() => {
                  setIsLoginPanelOpen(false);
                  if (activeModal === 'login') setActiveModal(null);
                }} />
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
