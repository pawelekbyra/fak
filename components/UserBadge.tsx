import React from 'react';
import { Star, Shield, Zap } from 'lucide-react';

interface UserBadgeProps {
  role?: string;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role, className = '' }) => {
  if (!role) return null;

  switch (role.toLowerCase()) {
    case 'admin':
      return (
        <div className={`inline-flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${className}`}>
          <Shield size={10} fill="currentColor" />
          <span>Admin</span>
        </div>
      );
    case 'author':
    case 'creator':
    case 'tworca':
      return (
        <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${className}`}>
          <Zap size={10} fill="currentColor" />
          <span>Twórca</span>
        </div>
      );
    case 'patron':
      return (
        <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${className}`}>
          <Star size={10} fill="currentColor" />
          <span>Patron</span>
        </div>
      );
    default:
      return null;
  }
};
