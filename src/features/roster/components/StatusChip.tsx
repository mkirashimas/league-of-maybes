import { Chip, type ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ROSTER_NAMESPACE, type PlayerStatus } from '../types';

const STATUS_COLORS: Record<PlayerStatus, ChipProps['color']> = {
  prospect: 'info',
  active: 'success',
  bench: 'default',
  injuredReserve: 'warning',
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
