import { cn } from "@/lib/utils";

type UserRole = 'user' | 'admin' | 'patron' | 'verified';

interface UserBadgeProps {
  role?: string;
  className?: string;
}

export default function UserBadge({ role = 'user', className }: UserBadgeProps) {
  if (role === 'user') return null;

  const getBadgeConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          text: 'Admin',
          styles: 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
        };
      case 'patron':
        return {
          text: 'Patron',
          styles: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
        };
      case 'verified':
        return {
          text: 'Zweryfikowany',
          styles: 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig(role);
  if (!config) return null;

  return (
    <span className={cn(
      "px-1.5 py-[1px] text-[9px] font-bold tracking-wider rounded-sm",
      config.styles,
      className
    )}>
      {config.text}
    </span>
  );
}
