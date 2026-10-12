import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  type ChipProps,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { generatePath, Link as RouterLink } from 'react-router';
import { PATHS } from '../../../types';
import {
  AGENDA_NAMESPACE,
  formatWhen,
  initialsOf,
  type AgendaItem,
  type AgendaKind,
  type PlayerRef,
} from '../types';

const KIND_COLORS: Record<AgendaKind, ChipProps['color']> = {
  now: 'success',
  event: 'info',
  plan: 'default',
};

interface AgendaItemRowProps {
  item: AgendaItem;
  /** Shown on the Upcoming page, where items of many players are mixed. */
  player?: PlayerRef;
  onToggleDone: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const AgendaItemRow = ({
  item,
  player,
  onToggleDone,
  onEdit,
  onDelete,
}: AgendaItemRowProps) => {
  const { t, i18n } = useTranslation([AGENDA_NAMESPACE, 'common']);

  return (
    <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}>
      <Checkbox
        checked={item.done}
        onChange={onToggleDone}
        slotProps={{ input: { 'aria-label': t('row.markDone', { title: item.title }) } }}
        sx={{ mt: -0.75, ml: -1 }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          {player && (
            <Link
              component={RouterLink}
              to={generatePath(PATHS.PLAYER_AGENDA, { playerId: player.id })}
              color="inherit"
              underline="hover"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                fontWeight: 'fontWeightMedium',
              }}
            >
              <Avatar
                sx={(theme) => ({
                  width: theme.spacing(3),
                  height: theme.spacing(3),
                  fontSize: theme.typography.caption.fontSize,
                  bgcolor: theme.palette[player.avatarColor].main,
                  color: theme.palette[player.avatarColor].contrastText,
                })}
              >
                {initialsOf(player.nickname) || '?'}
              </Avatar>
              {player.nickname}
            </Link>
          )}
          <Typography
            sx={{
              overflowWrap: 'anywhere',
              textDecoration: item.done ? 'line-through' : 'none',
              color: item.done ? 'text.secondary' : 'text.primary',
            }}
          >
            {item.title}
          </Typography>
          <Chip size="small" color={KIND_COLORS[item.kind]} label={t(`kind.${item.kind}`)} />
        </Stack>
        {item.when && (
          <Typography variant="caption" color="text.secondary">
            {formatWhen(item.when, i18n.resolvedLanguage)}
          </Typography>
        )}
        {item.notes && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}
          >
            {item.notes}
          </Typography>
        )}
      </Box>
      {onEdit && (
        <Tooltip title={t('common:actions.edit')}>
          <IconButton size="small" onClick={onEdit} aria-label={t('common:actions.edit')}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title={t('common:actions.delete')}>
          <IconButton size="small" onClick={onDelete} aria-label={t('common:actions.delete')}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};
