import { DeleteForeverOutlined, KeyOutlined } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { signOut } from '../../../firebase/auth';
import { useAppDispatch, useAppSelector } from '../../../store';
import { api } from '../../../store/api';
import { selectCurrentUser } from '../../../store/authSlice';
import { PATHS } from '../../../types';
import {
  useLegalDeleteAccountMutation,
  useLegalGetUserDocumentQuery,
  useLegalSetDeletionCodeMutation,
} from '../api';
import { LEGAL_NAMESPACE, MIN_DELETION_CODE_LENGTH } from '../types';

/** The i18n key of a callable's error: wrong code, locked after too many tries, or anything else. */
const errorKey = (error: unknown) => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code === 'functions/permission-denied') return 'account.code.wrong';
  if (code === 'functions/resource-exhausted') return 'account.code.locked';
  return 'account.delete.error';
};

const codeFieldProps = {
  type: 'password',
  autoComplete: 'new-password',
  fullWidth: true,
} as const;

/** Sets the deletion code, or changes it (which needs the current one). */
const CodeForm = ({ hasCode, onDone }: { hasCode: boolean; onDone: () => void }) => {
  const { t } = useTranslation(LEGAL_NAMESPACE);
  const [setCode, { isLoading, error }] = useLegalSetDeletionCodeMutation();
  const [currentCode, setCurrentCode] = useState('');
  const [code, setNewCode] = useState('');
  const [repeat, setRepeat] = useState('');

  const tooShort = code.length > 0 && code.length < MIN_DELETION_CODE_LENGTH;
  const mismatch = repeat.length > 0 && repeat !== code;
  const valid =
    code.length >= MIN_DELETION_CODE_LENGTH && repeat === code && (!hasCode || currentCode !== '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    const result = await setCode(hasCode ? { code, currentCode } : { code });
    if (!('error' in result)) onDone();
  };

  return (
    <Stack component="form" spacing={2} onSubmit={(event) => void handleSubmit(event)}>
      {hasCode && (
        <TextField
          {...codeFieldProps}
          label={t('account.code.current')}
          value={currentCode}
          onChange={(event) => setCurrentCode(event.target.value)}
        />
      )}
      <TextField
        {...codeFieldProps}
        label={t('account.code.new')}
        value={code}
        onChange={(event) => setNewCode(event.target.value)}
        error={tooShort}
        helperText={t('account.code.helper', { min: MIN_DELETION_CODE_LENGTH })}
      />
      <TextField
        {...codeFieldProps}
        label={t('account.code.repeat')}
        value={repeat}
        onChange={(event) => setRepeat(event.target.value)}
        error={mismatch}
        helperText={mismatch ? t('account.code.mismatch') : ' '}
      />
      {error !== undefined && <Alert severity="error">{t(errorKey(error))}</Alert>}
      <Button
        type="submit"
        variant="outlined"
        startIcon={<KeyOutlined />}
        disabled={!valid}
        loading={isLoading}
        sx={{ alignSelf: 'flex-start' }}
      >
        {hasCode ? t('account.code.change') : t('account.code.set')}
      </Button>
    </Stack>
  );
};

/**
 * Deleting the account: final, and only with the deletion code the user set beforehand.
 * Afterwards the client signs out, drops every cached document and goes to Login (R15).
 */
export const DeleteAccountCard = () => {
  const { t, i18n } = useTranslation(LEGAL_NAMESPACE);
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: userDocument } = useLegalGetUserDocumentQuery(user?.uid ?? '', { skip: !user });
  const [deleteAccount, { isLoading: isDeleting, error, reset }] = useLegalDeleteAccountMutation();
  const [changingCode, setChangingCode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [code, setCode] = useState('');
  const [understood, setUnderstood] = useState(false);

  const codeSetAt = userDocument?.deletionCodeSetAt;
  const hasCode = typeof codeSetAt === 'number';

  const openConfirm = () => {
    reset();
    setCode('');
    setUnderstood(false);
    setConfirmOpen(true);
  };

  const handleDelete = async (event: FormEvent) => {
    event.preventDefault();
    const result = await deleteAccount(code);
    if ('error' in result) return;
    await signOut();
    dispatch(api.util.resetApiState());
    void navigate(PATHS.LOGIN, { replace: true });
  };

  const finalWarning = (
    <Alert severity="error">
      <AlertTitle>{t('account.delete.finalTitle')}</AlertTitle>
      {t('account.delete.finalBody')}
    </Alert>
  );

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 3,
        borderColor: theme.palette.error.main,
        [theme.breakpoints.down('sm')]: { p: 2 },
      })}
    >
      <Stack spacing={2}>
        <Typography variant="h6" component="h2" color="error">
          {t('account.delete.title')}
        </Typography>
        {finalWarning}

        {!hasCode ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('account.code.intro')}
            </Typography>
            <CodeForm hasCode={false} onDone={() => undefined} />
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('account.code.setOn', {
                date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                  dateStyle: 'medium',
                }).format(codeSetAt),
              })}{' '}
              {t('account.code.forgot')}
            </Typography>
            {changingCode ? (
              <CodeForm hasCode onDone={() => setChangingCode(false)} />
            ) : (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<KeyOutlined />}
                  onClick={() => setChangingCode(true)}
                >
                  {t('account.code.change')}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteForeverOutlined />}
                  onClick={openConfirm}
                >
                  {t('account.delete.action')}
                </Button>
              </Stack>
            )}
          </>
        )}
      </Stack>

      <Dialog
        open={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={(event) => void handleDelete(event)}>
          <DialogTitle>{t('account.delete.confirmTitle')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              {finalWarning}
              <Typography variant="body2">{t('account.delete.confirmBody')}</Typography>
              <TextField
                {...codeFieldProps}
                autoFocus
                label={t('account.code.label')}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={understood}
                    onChange={(event) => setUnderstood(event.target.checked)}
                  />
                }
                label={t('account.delete.understood')}
              />
              {error !== undefined && <Alert severity="error">{t(errorKey(error))}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
              {t('account.delete.cancel')}
            </Button>
            <Button
              type="submit"
              color="error"
              variant="contained"
              disabled={!understood || code.length < MIN_DELETION_CODE_LENGTH}
              loading={isDeleting}
            >
              {t('account.delete.confirm')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};
