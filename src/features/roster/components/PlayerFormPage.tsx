import { Alert, AlertTitle, Button, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { generatePath, Link as RouterLink, useNavigate } from 'react-router';
import { PATHS } from '../../../types';
import { useRosterCreatePlayerMutation } from '../api';
import { useResponsibilityNotice } from '../hooks/useResponsibilityNotice';
import { ROSTER_NAMESPACE } from '../types';
import { PlayerForm, type PlayerDetails } from './PlayerForm';

const FORM_ID = 'new-player-form';

export const PlayerFormPage = () => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const navigate = useNavigate();
  const notice = useResponsibilityNotice();
  const [createPlayer, { isLoading, isError }] = useRosterCreatePlayerMutation();

  const handleSubmit = async (details: PlayerDetails) => {
    const result = await createPlayer({ ...details, traits: {} });
    if ('data' in result && result.data) {
      notice.dismiss();
      void navigate(generatePath(PATHS.PLAYER, { playerId: result.data }), { replace: true });
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        {t('form.titleNew')}
      </Typography>

      {notice.visible && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={notice.dismiss}>
              {t('form.responsibility.dismiss')}
            </Button>
          }
        >
          <AlertTitle>{t('form.responsibility.title')}</AlertTitle>
          {t('form.responsibility.body')}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}
      >
        <PlayerForm formId={FORM_ID} onSubmit={(details) => void handleSubmit(details)}>
          {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button component={RouterLink} to={PATHS.ROSTER}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={isLoading}>
              {t('form.create')}
            </Button>
          </Stack>
        </PlayerForm>
      </Paper>
    </Stack>
  );
};
