import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { signOut } from '../../../firebase/auth';
import { useAppSelector } from '../../../store';
import { selectCurrentUser } from '../../../store/authSlice';
import { PATHS } from '../../../types';
import { useLegalAcceptTermsMutation, useLegalGetUserDocumentQuery } from '../api';
import { hasAcceptedCurrentTerms, LEGAL_NAMESPACE } from '../types';
import type { ConsentRedirectState } from './ConsentGate';

export const ConsentPage = () => {
  const { t } = useTranslation(LEGAL_NAMESPACE);
  const user = useAppSelector(selectCurrentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const target = (location.state as ConsentRedirectState | null)?.from ?? PATHS.HOME;
  const [checked, setChecked] = useState(false);
  const { data, isLoading } = useLegalGetUserDocumentQuery(user?.uid ?? '', { skip: !user });
  const [acceptTerms, { isLoading: isSaving, isError: saveFailed }] = useLegalAcceptTermsMutation();
  const points = t('consent.points', { returnObjects: true }) as string[];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (hasAcceptedCurrentTerms(data)) {
    return <Navigate to={target} replace />;
  }

  const handleAccept = async () => {
    if (!user) {
      return;
    }
    const result = await acceptTerms(user.uid);
    if (!('error' in result)) {
      void navigate(target, { replace: true });
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={(theme) => ({
        py: 4,
        [theme.breakpoints.down('md')]: { py: 2, px: 2 },
      })}
    >
      <Paper
        variant="outlined"
        sx={(theme) => ({
          p: 4,
          [theme.breakpoints.down('sm')]: { p: 2 },
        })}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5" component="h1">
              {t('consent.title')}
            </Typography>
            <Typography color="text.secondary">{t('consent.intro')}</Typography>
          </Stack>

          <List dense disablePadding sx={{ listStyleType: 'disc', pl: 2.5 }}>
            {points.map((point) => (
              <ListItem key={point} disableGutters sx={{ display: 'list-item' }}>
                <ListItemText primary={point} />
              </ListItem>
            ))}
          </List>

          <Typography variant="body2">
            {t('consent.readFull')}{' '}
            <Link component={RouterLink} to={PATHS.TERMS} target="_blank" rel="noopener">
              {t('consent.terms')}
            </Link>{' '}
            ·{' '}
            <Link component={RouterLink} to={PATHS.PRIVACY} target="_blank" rel="noopener">
              {t('consent.privacy')}
            </Link>
          </Typography>

          <FormControlLabel
            control={
              <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            }
            label={t('consent.checkbox')}
          />

          {saveFailed && <Alert severity="error">{t('consent.saveError')}</Alert>}

          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={(theme) => ({
              justifyContent: 'flex-end',
              [theme.breakpoints.down('sm')]: { flexDirection: 'column-reverse' },
            })}
          >
            <Button onClick={() => void signOut()}>{t('consent.decline')}</Button>
            <Button
              variant="contained"
              disabled={!checked}
              loading={isSaving}
              onClick={() => void handleAccept()}
            >
              {t('consent.accept')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};
