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
import { useTranslation } from 'react-i18next';
import { useRosterUpdatePlayerMutation } from '../api';
import { ROSTER_NAMESPACE, type Player } from '../types';
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
  const [updatePlayer, { isLoading, isError, reset }] = useRosterUpdatePlayerMutation();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (details: PlayerDetails) => {
    const result = await updatePlayer({ playerId: player.id, changes: details });
    if (!('error' in result)) {
      handleClose();
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
          </PlayerForm>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
        <Button type="submit" form={FORM_ID} variant="contained" loading={isLoading}>
          {t('common:actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
