import { DownloadOutlined } from '@mui/icons-material';
import { Alert, Avatar, Button, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../store';
import { selectCurrentUser } from '../../../store/authSlice';
import { useLegalExportAccountMutation } from '../api';
import { LEGAL_NAMESPACE, type AccountExport } from '../types';
import { DeleteAccountCard } from './DeleteAccountCard';

/** Saves the export as league-of-maybes-YYYY-MM-DD.json. */
const download = (data: AccountExport) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `league-of-maybes-${data.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/** Account: who is signed in, an export of everything as JSON, and deleting the account. */
export const AccountPage = () => {
  const { t } = useTranslation(LEGAL_NAMESPACE);
  const user = useAppSelector(selectCurrentUser);
  const [exportAccount, { isLoading: isExporting, isError: exportFailed }] =
    useLegalExportAccountMutation();

  const handleExport = async () => {
    const result = await exportAccount();
    if ('data' in result && result.data) download(result.data);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" component="h1">
        {t('account.title')}
      </Typography>

      <Paper
        variant="outlined"
        sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Avatar src={user?.photoURL ?? undefined} alt={user?.displayName ?? ''} />
          <Stack sx={{ minWidth: 0 }}>
            <Typography noWrap>{user?.displayName}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}
      >
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            {t('account.export.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('account.export.body')}
          </Typography>
          {exportFailed && <Alert severity="error">{t('account.export.error')}</Alert>}
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={() => void handleExport()}
            loading={isExporting}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('account.export.action')}
          </Button>
        </Stack>
      </Paper>

      <DeleteAccountCard />
    </Stack>
  );
};
