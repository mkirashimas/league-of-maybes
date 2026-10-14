import { AddOutlined, DeleteOutlined, EditOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Rating,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCycleCreateNoteMutation,
  useCycleDeleteNoteMutation,
  useCycleGetNotesQuery,
  useCycleUpdateNoteMutation,
} from '../api';
import { useDateFormat } from '../hooks/useDateFormat';
import { PHASE_STYLES } from '../phaseIcons';
import {
  CYCLE_NAMESPACE,
  CYCLE_PHASES,
  RATING_KEYS,
  RATING_MAX,
  type CycleNote,
  type CycleNoteValues,
  type CyclePhase,
  type CycleProfileInput,
} from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { CycleNoteDialog } from './CycleNoteDialog';
import { PhaseIcon } from './PhaseIcon';

interface PhaseNotesLogProps {
  subjectId: string;
  profile: CycleProfileInput;
  /** Its group starts open. */
  currentPhase: CyclePhase | null;
}

/** Group of notes saved without cycle data (no period start on or before their date). */
const UNTAGGED = 'untagged';

type Group = CyclePhase | typeof UNTAGGED;

/** Dated observations grouped by the phase they fell in, with each phase's average ratings. */
export const PhaseNotesLog = ({ subjectId, profile, currentPhase }: PhaseNotesLogProps) => {
  const { t } = useTranslation([CYCLE_NAMESPACE, 'common']);
  const formatDate = useDateFormat();
  const { data: notes, isLoading, isError } = useCycleGetNotesQuery(subjectId);
  const [createNote, createState] = useCycleCreateNoteMutation();
  const [updateNote, updateState] = useCycleUpdateNoteMutation();
  const [deleteNote] = useCycleDeleteNoteMutation();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CycleNote | null>(null);
  const [deleting, setDeleting] = useState<CycleNote | null>(null);

  const closeDialog = () => {
    setAdding(false);
    setEditing(null);
  };

  const handleSubmit = async (values: CycleNoteValues) => {
    const result = editing
      ? await updateNote({ subjectId, noteId: editing.id, values })
      : await createNote({ subjectId, values });
    if (!('error' in result)) closeDialog();
  };

  const groups = ([...CYCLE_PHASES, UNTAGGED] as Group[])
    .map((group) => ({
      group,
      notes: (notes ?? []).filter((note) => (note.phase ?? UNTAGGED) === group),
    }))
    .filter(({ group, notes: inGroup }) => group !== UNTAGGED || inGroup.length > 0);

  const renderNote = (note: CycleNote) => (
    <Stack key={note.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(note.date)}
          {note.cycleDay !== null && ` · ${t('strip.day', { day: note.cycleDay })}`}
        </Typography>
        {note.text && (
          <Typography sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
            {note.text}
          </Typography>
        )}
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {RATING_KEYS.map((key) => {
            const value = note.ratings?.[key];
            return value == null ? null : (
              <Stack key={key} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t(`rating.${key}`)}
                </Typography>
                <Rating size="small" readOnly max={RATING_MAX} value={value} />
              </Stack>
            );
          })}
        </Stack>
      </Stack>
      <Tooltip title={t('common:actions.edit')}>
        <IconButton
          size="small"
          onClick={() => setEditing(note)}
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
  );

  return (
    <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
        >
          <Typography variant="h6" component="h2">
            {t('notes.title')}
          </Typography>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setAdding(true)}>
            {t('notes.add')}
          </Button>
        </Stack>
        <Typography color="text.secondary">{t('notes.intro')}</Typography>
        {(createState.isError || updateState.isError) && (
          <Alert severity="error">{t('common:saveError')}</Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : isError ? (
          <Alert severity="error">{t('common:loadError')}</Alert>
        ) : (
          <Box>
            {groups.map(({ group, notes: inGroup }) => {
              const summary = group === UNTAGGED ? undefined : profile.phaseSummaries?.[group];
              return (
                <Accordion
                  key={group}
                  disableGutters
                  variant="outlined"
                  defaultExpanded={group === currentPhase}
                  sx={(theme) =>
                    group === UNTAGGED
                      ? {}
                      : {
                          borderLeft: `${theme.spacing(0.5)} solid ${
                            theme.palette[PHASE_STYLES[group].color].main
                          }`,
                        }
                  }
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      useFlexGap
                      sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}
                    >
                      {group !== UNTAGGED && <PhaseIcon phase={group} />}
                      <Typography sx={{ fontWeight: 'fontWeightMedium' }}>
                        {group === UNTAGGED ? t('notes.untagged') : t(`phase.${group}`)}
                      </Typography>
                      <Chip size="small" label={inGroup.length} />
                      {group === currentPhase && (
                        <Chip size="small" color="primary" label={t('notes.now')} />
                      )}
                      {summary &&
                        RATING_KEYS.map((key) => {
                          const value = summary.avg[key];
                          return value === null ? null : (
                            <Typography key={key} variant="caption" color="text.secondary">
                              {t(`rating.${key}`)} {value.toFixed(1)}
                            </Typography>
                          );
                        })}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {inGroup.length === 0 ? (
                      <Typography color="text.secondary">{t('notes.emptyPhase')}</Typography>
                    ) : (
                      <Stack spacing={1.5}>{inGroup.map(renderNote)}</Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </Stack>

      <CycleNoteDialog
        open={adding || editing !== null}
        initial={editing}
        saving={createState.isLoading || updateState.isLoading}
        onSubmit={(values) => void handleSubmit(values)}
        onClose={closeDialog}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('notes.deleteTitle')}
        message={t('notes.deleteMessage')}
        confirmLabel={t('common:actions.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void deleteNote({ subjectId, noteId: deleting.id });
          setDeleting(null);
        }}
      />
    </Paper>
  );
};
