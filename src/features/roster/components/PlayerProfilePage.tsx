import { DeleteOutlined, EditOutlined, TuneOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { PATHS } from '../../../types';
import {
  useRosterDeletePlayerMutation,
  useRosterGetPlayerQuery,
  useRosterSetPlayerStatusMutation,
  useRosterUpdatePlayerTraitsMutation,
} from '../api';
import { useTraitDefinitions } from '../hooks/useTraitDefinitions';
import {
  computeOverall,
  PLAYER_STATUSES,
  ROSTER_NAMESPACE,
  type PlayerStatus,
  type TraitValue,
} from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { EditPlayerDialog } from './EditPlayerDialog';
import { TraitEditor } from './TraitEditor';

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Stack>
  </Paper>
);

export const PlayerProfilePage = () => {
  const { t, i18n } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const { data: player } = useRosterGetPlayerQuery(playerId, { skip: !playerId });
  const traits = useTraitDefinitions();
  const [setStatus] = useRosterSetPlayerStatusMutation();
  const [updateTraits, { isError: traitsFailed }] = useRosterUpdatePlayerTraitsMutation();
  const [editing, setEditing] = useState(false);
  const [deletePlayer, { isError: deleteFailed }] = useRosterDeletePlayerMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const navigate = useNavigate();

  // PlayerLayout handles loading and not-found; this tab only renders with a player.
  if (!player) {
    return null;
  }

  const overall = computeOverall(player.traits, traits.definitions);

  const handleDelete = async () => {
    setConfirmingDelete(false);
    const result = await deletePlayer(player.id);
    if (!('error' in result)) void navigate(PATHS.ROSTER, { replace: true });
  };

  const handleTraitChange = (key: string, value: TraitValue | null) => {
    const next = { ...player.traits };
    if (value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }
    void updateTraits({ playerId: player.id, traits: next });
  };

  const metOn = player.metOn
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(
        new Date(`${player.metOn}T00:00:00`),
      )
    : '';

  const details: { label: string; value: string }[] = [
    { label: t('form.age'), value: player.age != null ? String(player.age) : '' },
    { label: t('form.occupation'), value: player.occupation },
    { label: t('form.city'), value: player.city },
    { label: t('form.metAt'), value: player.metAt },
    { label: t('form.metOn'), value: metOn },
  ];

  return (
    <Box
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
        gap: 2,
        alignItems: 'start',
        [theme.breakpoints.down('md')]: { gridTemplateColumns: 'minmax(0, 1fr)' },
      })}
    >
      <Section
        title={t('profile.details')}
        action={
          <Button size="small" startIcon={<EditOutlined />} onClick={() => setEditing(true)}>
            {t('common:actions.edit')}
          </Button>
        }
      >
        <TextField
          select
          size="small"
          label={t('form.status')}
          value={player.status}
          onChange={(event) =>
            void setStatus({ playerId: player.id, status: event.target.value as PlayerStatus })
          }
        >
          {PLAYER_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`status.${status}`)}
            </MenuItem>
          ))}
        </TextField>
        <Box
          component="dl"
          sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1 }}
        >
          {details.map((detail) => (
            <Box key={detail.label} sx={{ display: 'contents' }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                {detail.label}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: 'anywhere' }}>
                {detail.value || '–'}
              </Typography>
            </Box>
          ))}
        </Box>
        {deleteFailed && <Alert severity="error">{t('profile.deleteError')}</Alert>}
        <Box>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={() => setConfirmingDelete(true)}
          >
            {t('profile.delete')}
          </Button>
        </Box>
      </Section>

      <Section
        title={t('profile.traits')}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography variant="body2" color="text.secondary">
              {t('table.overall')}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 'fontWeightBold' }}>
              {overall !== null ? overall.toFixed(1) : '–'}
            </Typography>
          </Stack>
        }
      >
        {traitsFailed && <Alert severity="error">{t('common:saveError')}</Alert>}
        {traits.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : traits.isError ? (
          <Alert severity="error">{t('common:loadError')}</Alert>
        ) : traits.activeDefinitions.length === 0 ? (
          <Typography color="text.secondary">{t('profile.noTraits')}</Typography>
        ) : (
          <Box
            sx={(theme) => ({
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 4,
              rowGap: 2,
              [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
            })}
          >
            {traits.activeDefinitions.map((definition) => (
              <TraitEditor
                key={definition.key}
                definition={definition}
                value={player.traits[definition.key]}
                onChange={(value) => handleTraitChange(definition.key, value)}
              />
            ))}
          </Box>
        )}
        <Box>
          <Button
            size="small"
            startIcon={<TuneOutlined />}
            component={RouterLink}
            to={PATHS.TRAIT_SETTINGS}
          >
            {t('profile.manageTraits')}
          </Button>
        </Box>
      </Section>

      <EditPlayerDialog player={player} open={editing} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={confirmingDelete}
        title={t('profile.deleteTitle', { nickname: player.nickname })}
        message={t('profile.deleteMessage')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmingDelete(false)}
      />
    </Box>
  );
};
