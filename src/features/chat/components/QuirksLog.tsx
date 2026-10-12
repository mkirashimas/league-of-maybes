import { DeleteOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useChatAddChatNoteMutation,
  useChatDeleteChatNoteMutation,
  useChatGetChatNotesQuery,
} from '../api';
import { CHAT_NAMESPACE, CHAT_NOTE_CATEGORIES, PAGE_SIZE, type ChatNoteCategory } from '../types';
import { Section } from './Section';

/** Timestamped notes about how they text: humor, pace, emoji, patterns. */
export const QuirksLog = ({ playerId }: { playerId: string }) => {
  const { t, i18n } = useTranslation([CHAT_NAMESPACE, 'common']);
  const [max, setMax] = useState(PAGE_SIZE);
  const {
    data: notes,
    isLoading,
    isError,
    isFetching,
  } = useChatGetChatNotesQuery({ playerId, limit: max });
  const [addNote, addState] = useChatAddChatNoteMutation();
  const [deleteNote] = useChatDeleteChatNoteMutation();
  const [category, setCategory] = useState<ChatNoteCategory>('humor');
  const [text, setText] = useState('');
  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const result = await addNote({ playerId, category, text: trimmed });
    if (!('error' in result)) setText('');
  };

  return (
    <Section title={t('quirks.title')}>
      <Stack
        component="form"
        onSubmit={(event) => void handleSubmit(event)}
        direction="row"
        spacing={1}
        useFlexGap
        sx={(theme) => ({
          alignItems: 'flex-start',
          [theme.breakpoints.down('sm')]: { flexDirection: 'column', alignItems: 'stretch' },
        })}
      >
        <TextField
          select
          size="small"
          label={t('quirks.category')}
          value={category}
          onChange={(event) => setCategory(event.target.value as ChatNoteCategory)}
          sx={(theme) => ({ minWidth: theme.spacing(16) })}
        >
          {CHAT_NOTE_CATEGORIES.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`category.${value}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label={t('quirks.text')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!text.trim()}
          loading={addState.isLoading}
        >
          {t('quirks.add')}
        </Button>
      </Stack>
      {addState.isError && <Alert severity="error">{t('common:saveError')}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : !notes || notes.length === 0 ? (
        <Typography color="text.secondary">{t('quirks.empty')}</Typography>
      ) : (
        <Stack spacing={1}>
          {notes.map((note) => (
            <Stack key={note.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Chip size="small" variant="outlined" label={t(`category.${note.category}`)} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                  {note.text}
                </Typography>
                {note.createdAt !== null && (
                  <Typography variant="caption" color="text.secondary">
                    {dateFormat.format(note.createdAt)}
                  </Typography>
                )}
              </Box>
              <Tooltip title={t('common:actions.delete')}>
                <IconButton
                  size="small"
                  onClick={() => void deleteNote(note.id)}
                  aria-label={t('common:actions.delete')}
                >
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
          {notes.length >= max && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={() => setMax((current) => current + PAGE_SIZE)} loading={isFetching}>
                {t('quirks.loadMore')}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Section>
  );
};
