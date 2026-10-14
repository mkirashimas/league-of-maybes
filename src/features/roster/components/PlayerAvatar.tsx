import { Avatar, Badge } from '@mui/material';
import type { ReactNode } from 'react';
import { initialsOf, type AvatarColor } from '../types';

interface PlayerAvatarProps {
  nickname: string;
  color: AvatarColor;
  size?: 'small' | 'medium' | 'large';
  /** Shown on the bottom-right corner (e.g. the cycle phase). */
  badge?: ReactNode;
}

const SIZES = { small: 4, medium: 5, large: 8 } as const;

export const PlayerAvatar = ({ nickname, color, size = 'medium', badge }: PlayerAvatarProps) => {
  const avatar = (
    <Avatar
      sx={(theme) => ({
        width: theme.spacing(SIZES[size]),
        height: theme.spacing(SIZES[size]),
        bgcolor: theme.palette[color].main,
        color: theme.palette[color].contrastText,
        fontSize: size === 'large' ? theme.typography.h5.fontSize : theme.typography.body2.fontSize,
        fontWeight: theme.typography.fontWeightMedium,
      })}
    >
      {initialsOf(nickname) || '?'}
    </Avatar>
  );
  if (!badge) {
    return avatar;
  }
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={badge}
      // The badge brings its own look; drop the default pill padding and size.
      slotProps={{ badge: { sx: { p: 0, minWidth: 0, height: 'auto' } } }}
      sx={{ flexShrink: 0 }}
    >
      {avatar}
    </Badge>
  );
};
