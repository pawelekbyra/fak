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
import MenuIcon from './icons/MenuIcon';
import BellIcon from './icons/BellIcon';
import PwaDesktopModal from './PwaDesktopModal';
import {
  Box,
  Flex,
  IconButton,
  Text,
  Avatar,
  useDisclosure,
} from '@chakra-ui/react';
import { HamburgerIcon, BellIcon as ChakraBellIcon } from '@chakra-ui/icons';

const TopBar = () => {
  const { user } = useUser();
  const setActiveModal = useStore((state) => state.setActiveModal);
  const { t } = useTranslation();
  const { isOpen: isLoginPanelOpen, onToggle: toggleLoginPanel, onClose: closeLoginPanel } = useDisclosure();
  const { isOpen: showNotifPanel, onToggle: toggleNotifPanel, onClose: closeNotifPanel } = useDisclosure();
  const { isOpen: showPwaModal, onOpen: openPwaModal, onClose: closePwaModal } = useDisclosure();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const unreadCount = 0; // Replace with real data

  return (
    <>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex="60"
        bg="black"
        color="white"
        borderBottom="1px solid"
        borderColor="whiteAlpha.200"
        h="var(--topbar-height)"
        pt="var(--safe-area-top)"
        px="1"
        transform="translateZ(0)"
      >
        <Flex align="center" justify="space-between" h="100%">
          <IconButton
            icon={<HamburgerIcon />}
            variant="ghost"
            aria-label={t('menuAriaLabel')}
            onClick={() => setActiveModal('account')}
          />

          <Text
            flex="1"
            textAlign="center"
            fontWeight="semibold"
            fontSize="lg"
            cursor="pointer"
            onClick={toggleLoginPanel}
          >
            Ting Tong
          </Text>

          <Flex align="center">
            {isDesktop && (
              <Button variant="ghost" size="icon" onClick={openPwaModal} aria-label={t('installPwaAriaLabel')}>
                <span className="text-sm font-semibold">{t('installAppText')}</span>
              </Button>
            )}
            <Box position="relative">
              <IconButton
                icon={<ChakraBellIcon />}
                variant="ghost"
                aria-label={t('notificationAriaLabel')}
                onClick={toggleNotifPanel}
              />
              {unreadCount > 0 && (
                <Box
                  position="absolute"
                  top="1"
                  right="1"
                  boxSize="2"
                  borderRadius="full"
                  bg="pink.500"
                  ring="2px"
                  ringColor="black"
                />
              )}
              <NotificationPopup
                isOpen={showNotifPanel}
                onClose={closeNotifPanel}
              />
            </Box>
            <IconButton
              variant="ghost"
              aria-label={t('accountMenuButton')}
              onClick={() => setActiveModal('account')}
              icon={
                user?.avatar ? (
                  <Avatar size="sm" src={user.avatar} />
                ) : (
                  <Avatar size="sm" />
                )
              }
            />
          </Flex>
        </Flex>
      </Box>

      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-[50] bg-black/60 backdrop-blur-sm"
            style={{ top: 'var(--topbar-height)' }}
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <LoginForm onLoginSuccess={closeLoginPanel} />
          </motion.div>
        )}
      </AnimatePresence>

      {showPwaModal && <PwaDesktopModal isOpen={showPwaModal} onClose={closePwaModal} />}
    </>
  );
};

export default TopBar;