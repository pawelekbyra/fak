import React, { memo, useEffect } from 'react';
import { Heart, MessageSquare, User, Share2, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import Ably from 'ably';
import { ably } from '@/lib/ably-client';
import { useToast } from '@/context/ToastContext';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import { formatCount } from '@/lib/utils';
import { shallow } from 'zustand/shallow';
import { useUser } from '@/context/UserContext';

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
  const { isLoggedIn } = useUser();
  const {
    setActiveModal,
    toggleLike,
    likeChanges,
    openAuthorProfileModal,
    openTippingModal
  } = useStore(state => ({
    setActiveModal: state.setActiveModal,
    toggleLike: state.toggleLike,
    likeChanges: state.likeChanges,
    openAuthorProfileModal: state.openAuthorProfileModal,
    openTippingModal: state.openTippingModal
  }), shallow);

  const likeState = likeChanges[slideId];
  const [liveLikes, setLiveLikes] = React.useState(initialLikes);
  const currentLikes = likeState ? likeState.likes : liveLikes;
  const isLiked = likeState ? likeState.isLiked : initialIsLiked;

  useEffect(() => {
    setLiveLikes(initialLikes);
    const channel = ably.channels.get(`likes:${slideId}`);

    const onLikeUpdate = (message: Ably.Message) => {
      setLiveLikes((message.data as { likeCount: number }).likeCount);
    };

    channel.subscribe('update', onLikeUpdate);

    return () => {
      channel.unsubscribe('update', onLikeUpdate);
    };
  }, [initialLikes, slideId]);

  const handleLike = () => {
    if (!isLoggedIn) {
      setActiveModal('login');
      return;
    }
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

  const handleOpenAuthorProfile = () => {
      // Use a mock ID for now as FeedItem does not pass authorId yet.
      // In a real app, this should come from `slide.userId` or similar passed prop.
      // Since I am restricted to this file change for now:
      const mockAuthorId = 'mock-author-id';
      openAuthorProfileModal(mockAuthorId);
  };

  return (
    <aside
      className="absolute right-0 flex flex-col items-center gap-[6px] z-20"
      style={{
        top: 'calc((var(--app-height) - var(--topbar-height) - var(--bottombar-height)) / 2 + var(--topbar-height))',
        transform: 'translateY(-50%)',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Avatar / Author Profile */}
      <div className="relative w-12 h-12 mb-1.5">
        <button onClick={handleOpenAuthorProfile} className="w-full h-full flex items-center justify-center text-white bg-gray-600 rounded-full overflow-hidden">
           <User size={32} strokeWidth={1.4} />
        </button>
         <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white pointer-events-none bg-primary"
          >
            +
          </div>
      </div>

      {/* Like */}
      <motion.button
        onClick={handleLike}
        className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold"
        data-action="toggle-like"
        data-slide-id={slideId}
        whileTap={{ scale: 0.9 }}
      >
        <Heart
          size={32}
          strokeWidth={1.4}
          className={`transition-colors duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className="icon-label">{formatCount(currentLikes)}</span>
      </motion.button>

      {/* Comments */}
      <motion.button
        data-testid="comments-button"
        data-action="open-comments-modal"
        onClick={() => setActiveModal('comments')}
        className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold"
        whileTap={{ scale: 0.9 }}
      >
        <MessageSquare size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{formatCount(commentsCount)}</span>
      </motion.button>

      {/* Share */}
      <button onClick={handleShare} data-action="share" className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Share2 size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('shareText') || 'Share'}</span>
      </button>

      {/* Tip Jar */}
      <button onClick={openTippingModal} data-action="show-tip-jar" className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold mt-4">
        <Wallet size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">Napiwek</span>
      </button>
    </aside>
  );
};

export default memo(Sidebar);
