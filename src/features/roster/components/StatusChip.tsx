import { Chip, type ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ROSTER_NAMESPACE, type PlayerStatus } from '../types';

// Each colour theme sets success/info/warning/error to its own status colours.
const STATUS_COLORS: Record<PlayerStatus, ChipProps['color']> = {
  prospect: 'info',
  active: 'success',
  bench: 'warning',
  injuredReserve: 'error',
  retired: 'default',
};

export const StatusChip = ({
  status,
  size = 'small',
}: {
  status: PlayerStatus;
  size?: ChipProps['size'];
}) => {
  const { t } = useTranslation(ROSTER_NAMESPACE);

  return (
    <Chip
      label={t(`status.${status}`)}
      color={STATUS_COLORS[status]}
      size={size}
      variant={status === 'retired' ? 'outlined' : 'filled'}
    />
  );
};
