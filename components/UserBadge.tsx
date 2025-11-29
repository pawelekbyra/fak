import React from 'react';
import { Trophy, Shield, Zap, Bot } from 'lucide-react';

interface UserBadgeProps {
  role?: string;
  isRobot?: boolean;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role, isRobot, className = '' }) => {
  if (isRobot) {
    return (
      <div className={`inline-flex items-center justify-center bg-zinc-800 text-white px-1.5 py-0.5 rounded text-[9px] font-bold ${className}`}>
        Robot
      </div>
    );
  }

  if (!role) return null;

  switch (role.toLowerCase()) {
    case 'admin':
      return (
        <div className={`inline-flex items-center justify-center bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold ${className}`}>
          Admin
        </div>
      );
    case 'author':
    case 'creator':
    case 'tworca':
      return (
        <div className={`inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold ${className}`}>
          Twórca
        </div>
      );
    case 'patron':
      return (
        <div className={`inline-flex items-center justify-center bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 px-1.5 py-0.5 rounded text-[9px] font-bold ${className}`}>
          Patron
        </div>
      );
    default:
      return null;
  }
};
