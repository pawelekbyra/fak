"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { shallow } from 'zustand/shallow';
// Importujemy komponent odtwarzacza i typy
import LocalVideoPlayer from './LocalVideoPlayer';
import { VideoSlideDTO, SlideDTO } from '@/lib/dto';

const fetchSlides = async () => {
    const res = await fetch(`/api/slides?cursor=&limit=1`);
    if (!res.ok) {
        throw new Error('Failed to fetch slides');
    }
    const data = await res.json();
    return data;
};

const Preloader: React.FC = () => {
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const {
    setIsMuted,
    togglePlay,
  } = useStore(
    (state) => ({
      setIsMuted: state.setIsMuted,
      togglePlay: state.togglePlay,
    }),
    shallow
  );

  const [showLangButtons, setShowLangButtons] = useState(false);

  // Zmieniamy użycie useQuery, aby odebrać 'data'
  const { data } = useQuery({
      queryKey: ['slides', 'preload'],
      queryFn: fetchSlides,
      staleTime: Infinity,
  });

  // Wyciągamy pierwszy slajd (jeśli istnieje)
  const firstSlide = data?.slides?.[0] as SlideDTO | undefined;

  useEffect(() => {
    const timer = setTimeout(() => setShowLangButtons(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLangSelect = (lang: 'pl' | 'en') => {
    selectInitialLang(lang);
    setIsMuted(false);

    // Ensure video starts playing
    if (!useStore.getState().isPlaying) {
      togglePlay();
    }
  };

  return (
    <AnimatePresence>
      {!isLangSelected && (
        <motion.div
          className="absolute inset-0 bg-black z-[10000] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.2 } }}
        >
          {/* --- UKRYTY PREFETCHER --- */}
          {/* Renderujemy LocalVideoPlayer dla pierwszego filmu w trybie 'shouldLoad'.
              Ustawiamy isActive={false}, żeby nie próbował odtwarzać (tylko buforował).
              Ukrywamy go wizualnie (hidden), ale musi być w DOM. */}
          {firstSlide && firstSlide.type === 'video' && (
            <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
                <LocalVideoPlayer
                    slide={firstSlide as VideoSlideDTO}
                    isActive={false}
                    shouldLoad={true}
                />
            </div>
          )}
          {/* ------------------------- */}

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-[150px] h-[150px] flex-shrink-0"
              animate={{ opacity: showLangButtons ? 1 : 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                className="w-full h-full"
                animate={{ scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
              >
                <Image
                  src="/icons/icon-512x512.png"
                  alt="Ting Tong Logo"
                  width={150}
                  height={150}
                  priority
                />
              </motion.div>
            </motion.div>
          </div>

          <AnimatePresence>
            {showLangButtons && (
              <motion.div
                className="absolute bottom-16 left-0 right-0 px-4 flex justify-center w-full z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div className="text-center w-full max-w-sm flex flex-col items-center">
                  <h2 className="text-lg font-semibold text-white mb-4">{t('selectLang')}</h2>
                  <div className="flex flex-col gap-3 w-full">
                    <motion.button
                      onClick={() => handleLangSelect('pl')}
                      className="bg-white/5 border border-white/20 hover:bg-white/10 text-sm py-3 rounded-md transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      {t('polish')}
                    </motion.button>
                    <motion.button
                      onClick={() => handleLangSelect('en')}
                      className="bg-white/5 border border-white/20 hover:bg-white/10 text-sm py-3 rounded-md transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      {t('english')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
