import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  IconButton,
  Avatar,
  Spinner,
  Collapse,
  useDisclosure,
  List,
  ListItem,
  Icon,
  Center,
} from '@chakra-ui/react';
import {
  FaTimes,
  FaBell,
  FaEnvelope,
  FaUser,
  FaTag,
  FaChevronDown,
  FaHeart,
  FaCommentDots,
  FaUserPlus,
} from 'react-icons/fa';
import { useTranslation } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

type NotificationType = 'like' | 'comment' | 'follow' | 'message';

interface Notification {
  id: string;
  type: NotificationType;
  preview: string;
  time: string;
  full: string;
  unread: boolean;
  user: {
    displayName: string;
    avatar: string;
  };
}

const iconMap: Record<NotificationType, React.ElementType> = {
  like: FaHeart,
  comment: FaCommentDots,
  follow: FaUserPlus,
  message: FaEnvelope,
};

const iconColorMap: Record<NotificationType, string> = {
    like: 'red.500',
    comment: 'whiteAlpha.800',
    follow: 'whiteAlpha.800',
    message: 'whiteAlpha.800',
}

const NotificationItem: React.FC<{ notification: Notification; onToggle: (id: string) => void }> = ({ notification, onToggle }) => {
  const { t } = useTranslation();
  const { isOpen, onToggle: toggleCollapse } = useDisclosure();

  const handleToggle = () => {
    toggleCollapse();
    if (notification.unread) {
      onToggle(notification.id);
      fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id }),
      }).catch(error => {
        console.error('Error marking notification as read:', error);
      });
    }
  };

  const getFullText = (key: string, user: string) => {
    return t(key, { name: user });
  };

  return (
    <ListItem
      rounded="lg"
      cursor="pointer"
      transition="background-color 0.2s"
      _hover={{ bg: 'whiteAlpha.100' }}
      mb="1"
    >
      <Flex align="start" gap="3" p="3" onClick={handleToggle}>
        <Avatar size="md" src={notification.user.avatar} name={notification.user.displayName} mt="1" />
        <Box flex="1">
          <Text fontSize="sm">
            <Text as="span" fontWeight="bold">{notification.user.displayName}</Text> {notification.preview}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.600" mt="1">{notification.time}</Text>
        </Box>
        <Flex align="center" gap="2" pt="1">
          {notification.unread && <Box boxSize="2" bg="pink.500" borderRadius="full" />}
          <Icon
            as={FaChevronDown}
            boxSize="14px"
            transition="transform 0.2s"
            transform={isOpen ? 'rotate(180deg)' : ''}
          />
        </Flex>
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Text fontSize="sm" color="whiteAlpha.800" p="3" pt="0">
          {getFullText(notification.full, notification.user.displayName)}
        </Text>
      </Collapse>
    </ListItem>
  );
};

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      fetch('/api/notifications')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch notifications'))
        .then(data => {
          if (data.success) {
            const transformedNotifications = data.notifications.map((n: any) => ({
              id: n.id,
              type: n.type as NotificationType,
              preview: t(n.previewKey),
              time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: lang === 'pl' ? pl : undefined }),
              full: n.fullKey,
              unread: !n.read,
              user: n.fromUser || { displayName: 'System', avatar: '/icons/icon-192x192.png' },
            }));
            setNotifications(transformedNotifications);
          } else {
            throw new Error(data.message || 'Failed to fetch notifications');
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, lang, t]);

  const handleToggle = (id: string) => {
    setNotifications(
      notifications.map(n =>
        n.id === id ? { ...n, unread: false } : n
      )
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <Center flexGrow={1} p={4}><Spinner color="whiteAlpha.400" /></Center>;
    }
    if (error) {
      return <Center flexGrow={1} color="red.400" p={4}><Text>{t('notificationsError')}</Text></Center>;
    }
    if (notifications.length === 0) {
      return (
        <Center flexGrow={1} color="whiteAlpha.600" flexDirection="column" gap={4} p={4}>
          <Icon as={FaBell} boxSize="48px" opacity="0.5" />
          <Text>{t('notificationsEmpty')}</Text>
        </Center>
      );
    }
    return (
      <List flexGrow={1} p={2} maxH="45vh" overflowY="auto">
        {notifications.map((notif) => (
          <NotificationItem key={notif.id} notification={notif} onToggle={handleToggle} />
        ))}
      </List>
    );
  };

  if (!isOpen) return null;

  return (
    <Flex
      position="fixed"
      inset="0"
      zIndex="50"
      align="flex-end"
      justify="center"
      bg="blackAlpha.500"
      pb={{ base: "calc(var(--bottombar-height) + 20px)", md: 5 }}
      onClick={onClose}
    >
      <Box
        w="350px"
        maxW="calc(100vw - 20px)"
        bg="rgba(30,30,30,0.9)"
        border="1px solid"
        borderColor="whiteAlpha.15"
        borderRadius="xl"
        boxShadow="lg"
        color="white"
        display="flex"
        flexDirection="column"
        backdropFilter="blur(12px)"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor="whiteAlpha.10">
          <Heading as="h3" size="sm">{t('notificationsTitle')}</Heading>
          <IconButton
            icon={<FaTimes />}
            aria-label="Close notifications"
            onClick={onClose}
            variant="ghost"
            size="sm"
            color="whiteAlpha.700"
            _hover={{ color: 'white' }}
          />
        </Flex>
        {renderContent()}
      </Box>
    </Flex>
  );
};

export default NotificationPopup;