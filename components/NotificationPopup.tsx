"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, Mail, ChevronDown, Loader2,
  Heart, MessageSquare, UserPlus, CheckCheck
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Upewnij się, że masz ten util, lub użyj classnames

type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  preview: string;
  time: string; // Pre-formatted time string
  rawDate: Date; // For sorting/logic if needed
  full: string;
  unread: boolean;
  user: {
    displayName: string;
    avatar: string;
  };
}

// --- Helper Components ---

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const styles = {
    like: "bg-red-500/20 text-red-500",
    comment: "bg-blue-500/20 text-blue-400",
    follow: "bg-green-500/20 text-green-400",
    message: "bg-purple-500/20 text-purple-400",
    system: "bg-gray-500/20 text-gray-400"
  };

  const icons = {
    like: <Heart size={14} className="fill-current" />,
    comment: <MessageSquare size={14} />,
    follow: <UserPlus size={14} />,
    message: <Mail size={14} />,
    system: <Bell size={14} />
  };

  return (
    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full shrink-0", styles[type] || styles.system)}>
      {icons[type] || icons.system}
    </div>
  );
};

// --- Single Notification Item ---

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void
}> = ({ notification, onMarkRead }) => {
  const { t, lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const readTimer = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    // Logika opóźnionego oznaczania jako przeczytane (UX: aby użytkownik zdążył zauważyć, że to było nowe)
    if (nextState && notification.unread) {
      if (readTimer.current) clearTimeout(readTimer.current);
      readTimer.current = setTimeout(() => {
        onMarkRead(notification.id);
      }, 2000); // 2 sekundy czytania = oznaczenie jako przeczytane
    } else {
      if (readTimer.current) clearTimeout(readTimer.current);
    }
  };

  // Czyszczenie timera przy odmontowaniu
  useEffect(() => {
    return () => {
      if (readTimer.current) clearTimeout(readTimer.current);
    };
  }, []);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={handleToggle}
      className={cn(
        "group relative mb-2 rounded-xl overflow-hidden cursor-pointer border transition-all duration-300",
        // Stylowanie stanu nieprzeczytanego vs przeczytanego
        notification.unread
          ? "bg-white/10 border-pink-500/30 hover:bg-white/15"
          : "bg-transparent border-transparent hover:bg-white/5"
      )}
    >
      {/* Pasek akcentujący dla nieprzeczytanych */}
      {notification.unread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
      )}

      <div className="flex items-start gap-3 p-3 pl-4">
        {/* Awatar + Ikona typu (overlay) */}
        <div className="relative shrink-0">
          <Image
            src={notification.user.avatar}
            alt={notification.user.displayName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]">
            <NotificationIcon type={notification.type} />
          </div>
        </div>

        {/* Treść */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm text-gray-200 leading-snug">
              <span className="font-semibold text-white">{notification.user.displayName}</span>{' '}
              <span className="opacity-90">{notification.preview}</span>
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">{notification.time}</p>
        </div>

        {/* Strzałka rozwijania */}
        <div className="pt-1 pr-1 text-gray-500 group-hover:text-white transition-colors">
           <ChevronDown size={16} className={cn("transition-transform duration-300", isExpanded && "rotate-180")} />
        </div>
      </div>

      {/* Rozwijana treść */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pl-14 pt-0 pb-4 text-sm text-gray-300/90 leading-relaxed border-t border-white/5 mx-4 mt-1">
               {/* Tutaj normalnie użylibyśmy t() z parametrami, uproszczone dla demo */}
               {notification.full || notification.preview}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
};

// --- Main Modal Component ---

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data (symulacja + API call)
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);

      fetch('/api/notifications')
        .then(res => res.ok ? res.json() : Promise.reject('Failed'))
        .then(data => {
            if (data.success) {
                const mapped = data.notifications.map((n: any) => ({
                    id: n.id,
                    type: (n.type || 'system') as NotificationType,
                    preview: t(n.previewKey) || n.previewKey,
                    full: n.fullKey ? t(n.fullKey, { name: n.fromUser?.displayName }) : '',
                    time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: lang === 'pl' ? pl : undefined }),
                    rawDate: new Date(n.createdAt),
                    unread: !n.read,
                    user: n.fromUser || { displayName: 'System', avatar: '/icons/icon-192x192.png' },
                }));
                setNotifications(mapped);
            } else {
               // Fallback dla pustych stanów lub błędów API w demo
               setNotifications([]);
            }
        })
        .catch(() => setError('Błąd pobierania powiadomień'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, lang, t]);

  // API Actions
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));

    // Silent API call
    fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
    }).catch(console.error);
  }, []);

  const markAllRead = () => {
    const unreadIds = notifications.filter(n => n.unread).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

    // Tutaj w realnym API byłby endpoint /mark-all-read
    unreadIds.forEach(id => {
        fetch('/api/notifications/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id }),
        }).catch(console.error);
    });
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Render Content Logic
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-10 text-white/40 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <span className="text-xs uppercase tracking-widest">Ładowanie...</span>
        </div>
      );
    }

    if (error) {
      return <div className="p-8 text-center text-red-400 text-sm">{t('notificationsError') || error}</div>;
    }

    if (notifications.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-10 text-white/30 gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Bell size={32} />
          </div>
          <p className="text-sm">{t('notificationsEmpty') || "Brak nowych powiadomień"}</p>
        </div>
      );
    }

    return (
      <ul className="flex-grow px-2 py-2 overflow-y-auto custom-scrollbar max-h-[50vh]">
        <AnimatePresence mode='popLayout'>
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={markAsRead}
            />
          ))}
        </AnimatePresence>
      </ul>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop z obsługą zamknięcia */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="fixed bottom-[calc(var(--bottombar-height)_+_16px)] right-4 z-50 w-full max-w-[380px] md:right-8 md:bottom-8"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div
              className="
                relative flex flex-col w-full
                bg-gray-900/80 backdrop-blur-xl
                border border-white/10
                rounded-2xl shadow-2xl shadow-black/50
                overflow-hidden
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base tracking-tight">
                    {t('notificationsTitle') || "Powiadomienia"}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-600 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="p-2 text-xs text-gray-400 hover:text-pink-400 transition-colors flex items-center gap-1 mr-1"
                      title="Oznacz wszystkie jako przeczytane"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="min-h-[200px] flex flex-col">
                {renderContent()}
              </div>

              {/* Footer (opcjonalny gradient zanikający) */}
              <div className="h-4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none absolute bottom-0 left-0 right-0" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;