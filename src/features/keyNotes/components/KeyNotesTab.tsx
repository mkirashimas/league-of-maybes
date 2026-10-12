import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PushPin,
  PushPinOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  type ChipProps,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  useKeyNotesCreateKeyNoteMutation,
  useKeyNotesDeleteKeyNoteMutation,
  useKeyNotesGetKeyNotesQuery,
  useKeyNotesToggleKeyNotePinMutation,
  useKeyNotesUpdateKeyNoteMutation,
} from '../api';
import {
  IMPORTANCE_KEYS,
  KEY_NOTES_NAMESPACE,
  PAGE_SIZE,
  type Importance,
  type KeyNote,
} from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { KeyNoteForm } from './KeyNoteForm';

const IMPORTANCE_COLORS: Record<Importance, ChipProps['color']> = {
  3: 'error',
  2: 'warning',
  1: 'default',
};

/** Player tab: facts worth remembering, pinned first, then by importance. */
export const KeyNotesTab = () => {
  const { t } = useTranslation([KEY_NOTES_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const [max, setMax] = useState(PAGE_SIZE);
  const {
    data: notes,
    isLoading,
    isError,
    isFetching,
  } = useKeyNotesGetKeyNotesQuery({ playerId, limit: max }, { skip: !playerId });
  const [createNote, createState] = useKeyNotesCreateKeyNoteMutation();
  const [updateNote, updateState] = useKeyNotesUpdateKeyNoteMutation();
  const [togglePin] = useKeyNotesToggleKeyNotePinMutation();
  const [deleteNote] = useKeyNotesDeleteKeyNoteMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<KeyNote | null>(null);

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
        <KeyNoteForm
          submitLabel={t('form.add')}
          saving={createState.isLoading}
          resetOnSave
          onSubmit={async (values) => {
            const result = await createNote({ playerId, ...values });
            return !('error' in result);
          }}
        />
      </Paper>
      {(createState.isError || updateState.isError) && (
        <Alert severity="error">{t('common:saveError')}</Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : !notes || notes.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('tab.empty')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notes.map((note) =>
            editingId === note.id ? (
              <Paper key={note.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <KeyNoteForm
                      initial={note}
                      submitLabel={t('common:actions.save')}
                      saving={updateState.isLoading}
                      autoFocus
                      onSubmit={async (values) => {
                        const result = await updateNote({ noteId: note.id, changes: values });
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
              </Paper>
            ) : (
              <Paper
                key={note.id}
                variant="outlined"
                sx={(theme) => ({
                  p: 2,
                  borderColor: note.pinned ? theme.palette.primary.main : theme.palette.divider,
                  [theme.breakpoints.down('sm')]: { p: 1.5 },
                })}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <Tooltip title={note.pinned ? t('card.unpin') : t('card.pin')}>
                    <IconButton
                      size="small"
                      color={note.pinned ? 'primary' : 'default'}
                      onClick={() => void togglePin({ noteId: note.id, pinned: !note.pinned })}
                      aria-label={note.pinned ? t('card.unpin') : t('card.pin')}
                      aria-pressed={note.pinned}
                    >
                      {note.pinned ? (
                        <PushPin fontSize="small" />
                      ) : (
                        <PushPinOutlined fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t(`category.${note.category}`)}
                      />
                      <Chip
                        size="small"
                        color={IMPORTANCE_COLORS[note.importance]}
                        label={t(`importance.${IMPORTANCE_KEYS[note.importance]}`)}
                      />
                    </Stack>
                    <Typography sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                      {note.text}
                    </Typography>
                  </Stack>
                  <Tooltip title={t('common:actions.edit')}>
                    <IconButton
                      size="small"
                      onClick={() => setEditingId(note.id)}
                      aria-label={t('common:actions.edit')}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common:actions.delete')}>
                    <IconButton
                      size="small"
                      onClick={() => setDeleting(note)}
                      aria-label={t('common:actions.delete')}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            ),
          )}
          {notes.length >= max && (
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
          if (deleting) void deleteNote(deleting.id);
          setDeleting(null);
        }}
      />
    </Stack>
  );
};
