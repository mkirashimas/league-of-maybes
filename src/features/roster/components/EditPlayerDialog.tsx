import { DeleteOutlined } from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { PATHS } from '../../../types';
import { useRosterDeletePlayerMutation, useRosterUpdatePlayerMutation } from '../api';
import { ROSTER_NAMESPACE, type Player } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { PlayerForm, type PlayerDetails } from './PlayerForm';

const FORM_ID = 'edit-player-form';

interface EditPlayerDialogProps {
  player: Player;
  open: boolean;
  onClose: () => void;
}

export const EditPlayerDialog = ({ player, open, onClose }: EditPlayerDialogProps) => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [updatePlayer, { isLoading, isError, reset }] = useRosterUpdatePlayerMutation();
  const [deletePlayer, { isLoading: isDeleting, isError: deleteFailed, reset: resetDelete }] =
    useRosterDeletePlayerMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleClose = () => {
    reset();
    resetDelete();
    onClose();
  };

  const handleSubmit = async (details: PlayerDetails) => {
    const result = await updatePlayer({ playerId: player.id, changes: details });
    if (!('error' in result)) {
      handleClose();
    }
  };

  // Deletes the player doc; the onPlayerDeleted function removes their records.
  const handleDelete = async () => {
    setConfirmingDelete(false);
    const result = await deletePlayer(player.id);
    if (!('error' in result)) {
      onClose();
      void navigate(PATHS.ROSTER, { replace: true });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{t('form.titleEdit')}</DialogTitle>
      <DialogContent>
        {/* Remounted on every open, so the form starts from the current player. */}
        {open && (
          <PlayerForm
            key={player.id}
            initial={player}
            formId={FORM_ID}
            onSubmit={(details) => void handleSubmit(details)}
          >
            {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
            {deleteFailed && <Alert severity="error">{t('profile.deleteError')}</Alert>}
          </PlayerForm>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          startIcon={<DeleteOutlined />}
          onClick={() => setConfirmingDelete(true)}
          loading={isDeleting}
          sx={{ mr: 'auto' }}
        >
          {t('profile.delete')}
        </Button>
        <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
        <Button type="submit" form={FORM_ID} variant="contained" loading={isLoading}>
          {t('common:actions.save')}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('profile.deleteTitle', { nickname: player.nickname })}
        message={t('profile.deleteMessage')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmingDelete(false)}
      />
    </Dialog>
  );
};
