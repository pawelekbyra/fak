import React, { memo } from 'react';
import { useToast } from '@/context/ToastContext';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import { formatCount } from '@/lib/utils';
import { shallow } from 'zustand/shallow';
import { VStack, IconButton, Text, Box } from '@chakra-ui/react';
import { FaHeart, FaCommentDots, FaShare, FaQuestionCircle } from 'react-icons/fa';

interface SidebarProps {
  initialLikes: number;
  initialIsLiked: boolean;
  slideId: string;
  commentsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  initialLikes,
  initialIsLiked,
  slideId,
  commentsCount,
}) => {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const {
    setActiveModal,
    toggleLike,
    likeChanges
  } = useStore(state => ({
    setActiveModal: state.setActiveModal,
    toggleLike: state.toggleLike,
    likeChanges: state.likeChanges,
  }), shallow);

  const likeState = likeChanges[slideId];
  const currentLikes = likeState ? likeState.likes : initialLikes;
  const isLiked = likeState ? likeState.isLiked : initialIsLiked;

  const handleLike = () => {
    toggleLike(slideId, initialLikes, initialIsLiked);
    addToast(isLiked ? (t('unlikedToast') || 'Unliked') : (t('likedToast') || 'Liked!'), 'success');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('shareTitle') || 'Check out this video!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast(t('linkCopied') || 'Link copied to clipboard!', 'success');
    }
  };

  return (
    <VStack
      position="absolute"
      right="0"
      zIndex="20"
      top="50%"
      transform="translateY(-50%)"
      spacing={4}
      color="white"
      textShadow="0 0 4px rgba(0, 0, 0, 0.8)"
    >
      <Box textAlign="center">
        <IconButton
          icon={<FaHeart />}
          aria-label="Like"
          onClick={handleLike}
          variant="ghost"
          size="lg"
          colorScheme={isLiked ? 'red' : 'gray'}
          isRound
        />
        <Text fontSize="xs" fontWeight="semibold">{formatCount(currentLikes)}</Text>
      </Box>

      <Box textAlign="center">
        <IconButton
          icon={<FaCommentDots />}
          aria-label="Comments"
          onClick={() => setActiveModal('comments')}
          variant="ghost"
          size="lg"
          isRound
        />
        <Text fontSize="xs" fontWeight="semibold">{formatCount(commentsCount)}</Text>
      </Box>

      <Box textAlign="center">
        <IconButton
          icon={<FaShare />}
          aria-label="Share"
          onClick={handleShare}
          variant="ghost"
          size="lg"
          isRound
        />
        <Text fontSize="xs" fontWeight="semibold">{t('shareText') || 'Share'}</Text>
      </Box>

      <Box textAlign="center" mt={4}>
        <IconButton
          icon={<FaQuestionCircle />}
          aria-label="Info"
          onClick={() => setActiveModal('info')}
          variant="ghost"
          size="lg"
          isRound
        />
        <Text fontSize="xs" fontWeight="semibold">WTF?!</Text>
      </Box>
    </VStack>
  );
};

export default memo(Sidebar);