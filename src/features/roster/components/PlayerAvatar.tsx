import { Avatar } from '@mui/material';
import { initialsOf, type AvatarColor } from '../types';

interface PlayerAvatarProps {
  nickname: string;
  color: AvatarColor;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = { small: 4, medium: 5, large: 8 } as const;

export const PlayerAvatar = ({ nickname, color, size = 'medium' }: PlayerAvatarProps) => (
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
