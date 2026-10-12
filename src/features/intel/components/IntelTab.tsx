import { CloseOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  useIntelAddIntelMutation,
  useIntelDeleteIntelMutation,
  useIntelGetIntelQuery,
  useIntelUpdateIntelMutation,
} from '../api';
import { INTEL_CATEGORIES, INTEL_NAMESPACE, PAGE_SIZE, type IntelEntry } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { IntelForm } from './IntelForm';

/** Player tab: what you know before (and while) dating, grouped by category. */
export const IntelTab = () => {
  const { t, i18n } = useTranslation([INTEL_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const [max, setMax] = useState(PAGE_SIZE);
  const {
    data: entries,
    isLoading,
    isError,
    isFetching,
  } = useIntelGetIntelQuery({ playerId, limit: max }, { skip: !playerId });
  const [addIntel, addState] = useIntelAddIntelMutation();
  const [updateIntel, updateState] = useIntelUpdateIntelMutation();
  const [deleteIntel] = useIntelDeleteIntelMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<IntelEntry | null>(null);
  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });

  const groups = INTEL_CATEGORIES.map((category) => ({
    category,
    items: (entries ?? []).filter((entry) => entry.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {t('tab.title')}
      </Typography>
      <Typography color="text.secondary">{t('tab.intro')}</Typography>

      <Paper
        variant="outlined"
        sx={(theme) => ({ p: 2, [theme.breakpoints.down('sm')]: { p: 1.5 } })}
      >
        <IntelForm
          submitLabel={t('form.add')}
          saving={addState.isLoading}
          resetOnSave
          onSubmit={async (values) => {
            const result = await addIntel({ playerId, ...values });
            return !('error' in result);
          }}
        />
      </Paper>
      {(addState.isError || updateState.isError) && (
        <Alert severity="error">{t('common:saveError')}</Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : groups.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('tab.empty')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {groups.map((group) => (
            <Paper key={group.category} variant="outlined">
              <Typography
                variant="subtitle2"
                component="h3"
                sx={(theme) => ({
                  px: 2,
                  py: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  color:
                    group.category === 'redFlag'
                      ? 'error.main'
                      : group.category === 'greenFlag'
                        ? 'success.main'
                        : 'text.secondary',
                })}
              >
                {t(`category.${group.category}`)}
              </Typography>
              <Stack
                divider={
                  <Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}` })} />
                }
              >
                {group.items.map((entry) =>
                  editingId === entry.id ? (
                    <Stack
                      key={entry.id}
                      direction="row"
                      spacing={1}
                      sx={{ p: 2, alignItems: 'flex-start' }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <IntelForm
                          initialCategory={entry.category}
                          initialText={entry.text}
                          submitLabel={t('common:actions.save')}
                          saving={updateState.isLoading}
                          autoFocus
                          onSubmit={async (values) => {
                            const result = await updateIntel({
                              entryId: entry.id,
                              changes: values,
                            });
                            if ('error' in result) return false;
                            setEditingId(null);
                            return true;
                          }}
                        />
                      </Box>
                      <Tooltip title={t('common:actions.cancel')}>
                        <IconButton
                          onClick={() => setEditingId(null)}
                          aria-label={t('common:actions.cancel')}
                        >
                          <CloseOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    <Stack
                      key={entry.id}
                      direction="row"
                      spacing={1}
                      sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                          {entry.text}
                        </Typography>
                        {entry.createdAt !== null && (
                          <Typography variant="caption" color="text.secondary">
                            {dateFormat.format(entry.createdAt)}
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title={t('common:actions.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => setEditingId(entry.id)}
                          aria-label={t('common:actions.edit')}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common:actions.delete')}>
                        <IconButton
                          size="small"
                          onClick={() => setDeleting(entry)}
                          aria-label={t('common:actions.delete')}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ),
                )}
              </Stack>
            </Paper>
          ))}
          {entries && entries.length >= max && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={() => setMax((current) => current + PAGE_SIZE)} loading={isFetching}>
                {t('tab.loadMore')}
              </Button>
            </Box>
          )}
        </Stack>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t('delete.title')}
        message={t('delete.message')}
        confirmLabel={t('common:actions.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void deleteIntel(deleting.id);
          setDeleting(null);
        }}
      />
    </Stack>
  );
};
