import React, { memo, useEffect } from 'react';
import { Heart, MessageSquare, User, Share2 } from 'lucide-react';
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
  authorId: string;
  authorAvatar?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  initialLikes,
  initialIsLiked,
  slideId,
  commentsCount,
  authorId,
  authorAvatar,
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
    // Trigger Author Profile
    if (authorId) {
      openAuthorProfileModal(authorId);
    }
  };

  // Shared styles
  const buttonClass = "flex flex-col items-center gap-[2px] justify-center cursor-pointer";
  const labelClass = "text-[11px] leading-[1.1] text-center drop-shadow-md font-medium text-white";
  const iconSize = 32;

  return (
    <aside
      className="absolute right-0 flex flex-col items-center gap-[12px] z-20 pointer-events-auto"
      style={{
        top: 'calc((var(--app-height) - var(--topbar-height) - var(--bottombar-height)) / 2 + var(--topbar-height))',
        transform: 'translateY(-50%)',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Avatar / Author Profile */}
      <div className="relative w-12 h-12 mb-1.5">
        <button onClick={handleOpenAuthorProfile} className="w-full h-full flex items-center justify-center text-white bg-gray-600 rounded-full overflow-hidden border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
           {authorAvatar ? (
             <img src={authorAvatar} alt="Author" className="w-full h-full object-cover" />
           ) : (
             <User size={32} strokeWidth={1.4} />
           )}
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
        className={buttonClass}
        data-action="toggle-like"
        data-slide-id={slideId}
        whileTap={{ scale: 0.9 }}
      >
        <Heart
          size={iconSize}
          strokeWidth={1.5}
          className={`transition-colors duration-200 ${isLiked ? 'fill-[var(--accent-color,theme(colors.rose.500))] stroke-white' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className={labelClass}>{formatCount(currentLikes)}</span>
      </motion.button>

      {/* Comments */}
      <motion.button
        data-testid="comments-button"
        data-action="open-comments-modal"
        onClick={() => setActiveModal('comments')}
        className={buttonClass}
        whileTap={{ scale: 0.9 }}
      >
        <MessageSquare size={iconSize} strokeWidth={1.5} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className={labelClass}>{formatCount(commentsCount)}</span>
      </motion.button>

      {/* Share */}
      <button onClick={handleShare} data-action="share" className={buttonClass}>
        <Share2 size={iconSize} strokeWidth={1.5} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className={labelClass}>{t('shareText') || 'Udostępnij'}</span>
      </button>

      {/* Tip Jar (Custom SVG) */}
      <button onClick={openTippingModal} data-action="show-tip-jar" className={buttonClass + " mt-2"}>
        <svg viewBox="0 0 24 24" className="text-white drop-shadow-md" style={{ width: iconSize, height: iconSize }} fill="none" stroke="currentColor" strokeWidth="1.5">
           <rect x="2" y="7" width="20" height="12" rx="2" ry="2" />
           <path d="M2 10h20" />
           <circle cx="18" cy="13" r="2" />
        </svg>
        <span className={labelClass}>Napiwek</span>
      </button>
    </aside>
  );
};

export default memo(Sidebar);
