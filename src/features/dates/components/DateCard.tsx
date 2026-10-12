import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  type ChipProps,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DATES_NAMESPACE, type DateRecord, type Outcome } from '../types';

const OUTCOME_COLORS: Record<Outcome, ChipProps['color']> = {
  great: 'success',
  good: 'info',
  meh: 'warning',
  bad: 'error',
};

interface DateCardProps {
  record: DateRecord;
  onEdit: () => void;
  onDelete: () => void;
}

export const DateCard = ({ record, onEdit, onDelete }: DateCardProps) => {
  const { t, i18n } = useTranslation(DATES_NAMESPACE);
  const day = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${record.date}T00:00:00`));
  const title = [record.activity, record.venue].filter(Boolean).join(' · ') || t('card.untitled');

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({ p: 2, [theme.breakpoints.down('sm')]: { p: 1.5 } })}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {day}
            </Typography>
            <Typography variant="subtitle1" sx={{ overflowWrap: 'anywhere' }}>
              {title}
            </Typography>
          </Box>
          <Tooltip title={t('card.edit')}>
            <IconButton size="small" onClick={onEdit} aria-label={t('card.edit')}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('card.delete')}>
            <IconButton size="small" onClick={onDelete} aria-label={t('card.delete')}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip
            size="small"
            color={OUTCOME_COLORS[record.outcome]}
            label={t(`outcome.${record.outcome}`)}
          />
          {record.rating !== null && (
            <Chip
              size="small"
              variant="outlined"
              label={t('card.rating', { rating: record.rating })}
            />
          )}
        </Stack>
        {record.highlights && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
            {record.highlights}
          </Typography>
        )}
        {record.nextStep && (
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {t('card.nextStep', { step: record.nextStep })}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};
