import { DeleteForeverOutlined, DownloadOutlined } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { signOut } from '../../../firebase/auth';
import { useAppDispatch, useAppSelector } from '../../../store';
import { api } from '../../../store/api';
import { selectCurrentUser } from '../../../store/authSlice';
import { PATHS } from '../../../types';
import { useLegalDeleteAccountMutation, useLegalExportAccountMutation } from '../api';
import { LEGAL_NAMESPACE, type AccountExport } from '../types';

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

const cardSx = { p: 3 } as const;

/** Account: who is signed in, export everything as JSON, or delete the account with all its data. */
export const AccountPage = () => {
  const { t } = useTranslation(LEGAL_NAMESPACE);
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [exportAccount, { isLoading: isExporting, isError: exportFailed }] =
    useLegalExportAccountMutation();
  const [deleteAccount, { isLoading: isDeleting, isError: deleteFailed, reset: resetDelete }] =
    useLegalDeleteAccountMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleExport = async () => {
    const result = await exportAccount();
    if ('data' in result && result.data) download(result.data);
  };

  const openConfirm = () => {
    resetDelete();
    setUnderstood(false);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    const result = await deleteAccount();
    if ('error' in result) return;
    // The auth user is gone server-side: leave the session and drop every cached document (R15).
    await signOut();
    dispatch(api.util.resetApiState());
    void navigate(PATHS.LOGIN, { replace: true });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" component="h1">
        {t('account.title')}
      </Typography>

      <Paper
        variant="outlined"
        sx={(theme) => ({ ...cardSx, [theme.breakpoints.down('sm')]: { p: 2 } })}
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
        sx={(theme) => ({ ...cardSx, [theme.breakpoints.down('sm')]: { p: 2 } })}
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

      <Paper
        variant="outlined"
        sx={(theme) => ({
          ...cardSx,
          borderColor: theme.palette.error.main,
          [theme.breakpoints.down('sm')]: { p: 2 },
        })}
      >
        <Stack spacing={2}>
          <Typography variant="h6" component="h2" color="error">
            {t('account.delete.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('account.delete.body')}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverOutlined />}
            onClick={openConfirm}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('account.delete.action')}
          </Button>
        </Stack>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !isDeleting && setConfirmOpen(false)}>
        <DialogTitle>{t('account.delete.confirmTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>{t('account.delete.confirmBody')}</DialogContentText>
            <FormControlLabel
              control={
                <Checkbox
                  checked={understood}
                  onChange={(event) => setUnderstood(event.target.checked)}
                />
              }
              label={t('account.delete.understood')}
            />
            {deleteFailed && <Alert severity="error">{t('account.delete.error')}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
            {t('account.delete.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={!understood}
            loading={isDeleting}
          >
            {t('account.delete.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
