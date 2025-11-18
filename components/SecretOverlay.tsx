"use client";

import React, { memo } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import { Center, Heading, Text, Button, ScaleFade } from '@chakra-ui/react';

const SecretOverlay: React.FC = memo(() => {
  const { t } = useTranslation();
  const { setActiveModal } = useStore();

  const handleLoginClick = () => {
    setActiveModal('login');
  };

  return (
    <Center
      position="absolute"
      inset="0"
      zIndex="10"
      p="6"
      textAlign="center"
      color="white"
      userSelect="none"
    >
      <ScaleFade initialScale={0.9} in={true}>
        <Heading as="h2" size="2xl" fontWeight="bold" textShadow="0 0 4px rgba(0,0,0,0.8)">
          {t('secretTitle')}
        </Heading>
        <Text opacity="0.75" mt="1" textShadow="0 0 2px rgba(0,0,0,0.8)">
          {t('secretSubtitle')}
        </Text>
        <Button onClick={handleLoginClick} mt="4" px="6" py="3" fontWeight="semibold" borderRadius="full" colorScheme="pink">
          {t('secretLoginText') || 'Log in to watch'}
        </Button>
      </ScaleFade>
    </Center>
  );
});

SecretOverlay.displayName = 'SecretOverlay';

export default SecretOverlay;