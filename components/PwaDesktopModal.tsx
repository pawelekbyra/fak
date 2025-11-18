"use client";

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Center,
  Image,
} from '@chakra-ui/react';
import { useTranslation } from '@/context/LanguageContext';

interface PwaDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PwaDesktopModal: React.FC<PwaDesktopModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent bg="zinc.800" color="white" borderRadius="lg" p={8} maxW="sm">
        <ModalHeader fontSize="2xl" fontWeight="bold" textAlign="center">{t('pwaModalTitle')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody textAlign="center">
          <Text mb={6}>{t('pwaModalBody')}</Text>
          <Center w={32} h={32} bg="white" mx="auto" borderRadius="lg">
            <Image src="/qr-code-placeholder.png" alt="QR Code" boxSize="128px" />
          </Center>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PwaDesktopModal;