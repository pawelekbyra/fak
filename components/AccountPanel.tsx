"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import ProfileTab from './ProfileTab';
import PasswordTab from './PasswordTab';
import DeleteTab from './DeleteTab';
import { useTranslation } from '@/context/LanguageContext';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

interface AccountPanelProps {
  onClose: () => void;
}

type Tab = 'profile' | 'password' | 'delete';

const AccountPanel: React.FC<AccountPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If the user logs out while this panel is open, close it automatically.
    if (!user) {
      onClose();
    }
  }, [user, onClose]);

  const handleTabClick = (tab: Tab) => {
      setActiveTab(tab);
  }

  const handlePublishClick = () => {
      router.push('/admin/slides');
  }

  const canPublish = user?.role === 'admin' || user?.role === 'author';

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Close on overlay click
    >
      <motion.div
        className="absolute top-0 left-0 h-full w-full max-w-md bg-gradient-to-br from-[#121212] to-[#1e1e1e] flex flex-col"
        initial={{ x: '-100%' }}
        animate={{ x: '0%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the panel
      >
        {/* Top Bar - styled to be distinct but integrated */}
        <div
            className="relative flex-shrink-0 flex items-center justify-center bg-[#121212]/90 backdrop-blur-md border-b border-white/5 shadow-sm z-10"
            style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)'}}
        >
          <h2 className="text-base font-semibold text-white tracking-wide">{t(`${activeTab}Tab`)}</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            aria-label={t('closeAccountAriaLabel')}
          >
              <X size={20} />
          </button>
        </div>

        {/* Tabs Header */}
        <div className="flex-shrink-0 flex bg-[#1a1a1a] border-b border-white/5">
          <button
            onClick={() => handleTabClick('profile')}
            aria-label={t('profileTab')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'profile' ? 'text-pink-500 border-pink-500 bg-white/5' : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'}`}
          >
            {t('profileTab')}
          </button>
          <button
            onClick={() => handleTabClick('password')}
            aria-label={t('passwordTab')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'password' ? 'text-pink-500 border-pink-500 bg-white/5' : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'}`}
          >
            {t('passwordTab')}
          </button>
          <button
            onClick={() => handleTabClick('delete')}
            aria-label={t('deleteTab')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'delete' ? 'text-pink-500 border-pink-500 bg-white/5' : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'}`}
          >
            {t('deleteTab')}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
            {activeTab === 'profile' && <ProfileTab onClose={onClose} />}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'delete' && <DeleteTab onClose={onClose} />}
        </div>

        {canPublish && (
          <div className="p-4 border-t border-white/10 bg-[#1a1a1a]/80 backdrop-blur-sm">
             <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-pink-900/20 active:scale-[0.98] transition-all" onClick={handlePublishClick}>
                 {t('publishButton')}
             </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AccountPanel;
