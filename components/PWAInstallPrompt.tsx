"use client";

import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Button, IconButton, Slide, VStack } from '@chakra-ui/react';
import { FaShare, FaPlusSquare, FaTimes } from 'react-icons/fa';
import { useTranslation } from '@/context/LanguageContext';
import PwaDesktopModal from './PwaDesktopModal';

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth > 768);
        const handleResize = () => setIsDesktop(window.innerWidth > 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    const userAgent = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (isDesktop) {
        setShowPwaModal(true);
        return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
      });
    } else if (isIOS) {
      setShowInstructions(true);
    }
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  if (isStandalone) {
    return null;
  }

  if (!isDesktop && !installPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <Slide direction="bottom" in={isIOS && showInstructions} style={{ zIndex: 50 }}>
        <Box
          bg="rgba(0,0,0,0.8)"
          backdropFilter="blur(10px)"
          color="white"
          p={4}
          roundedTop="2xl"
          pb="var(--safe-area-bottom)"
        >
          <Flex w="full" justify="space-between" align="center" mb={4}>
            <Heading size="lg">Jak zainstalować aplikację</Heading>
            <IconButton
              icon={<FaTimes />}
              aria-label="Close instructions"
              variant="ghost"
              onClick={handleCloseInstructions}
            />
          </Flex>
          <VStack spacing={4} textAlign="center" fontSize="sm">
            <Text>1. Stuknij ikonę **udostępniania** na pasku przeglądarki Safari.</Text>
            <FaShare size={32} />
            <Text>2. Z menu, które się pojawi, wybierz **&quot;Dodaj do ekranu początkowego&quot;**.</Text>
            <FaPlusSquare size={32} />
            <Text>3. Potwierdź, a aplikacja pojawi się na Twoim ekranie!</Text>
          </VStack>
        </Box>
      </Slide>

      {! (isIOS && showInstructions) && (
        <Flex
          position="fixed"
          bottom="0"
          left="0"
          w="full"
          bg="gray.800"
          color="white"
          p={6}
          justify="space-between"
          align="center"
          textAlign="left"
          gap={4}
          zIndex={9999}
          h="var(--bottombar-height)"
          pb="calc(1.5rem + var(--safe-area-bottom))"
        >
          <Box>
            <Heading size="lg">Zainstaluj aplikację!</Heading>
            <Text fontSize="sm">Uzyskaj pełne wrażenia. Zainstaluj aplikację Ting Tong na swoim urządzeniu.</Text>
          </Box>
          <Button onClick={handleInstallClick} flexShrink={0} colorScheme="red">
            Zainstaluj
          </Button>
        </Flex>
      )}

      <PwaDesktopModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />
    </>
  );
};

export default PWAInstallPrompt;