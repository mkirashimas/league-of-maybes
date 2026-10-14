import {
  AddOutlined,
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  DeleteOutlined,
  ScoreboardOutlined,
  TableChart,
  TableChartOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useRosterDeleteTraitDefinitionMutation,
  useRosterReorderTraitDefinitionsMutation,
  useRosterUpsertTraitDefinitionMutation,
} from '../api';
import { useTraitDefinitions } from '../hooks/useTraitDefinitions';
import { useTraitLabels } from '../hooks/useTraitLabels';
import {
  isWeighted,
  optionScore,
  ROSTER_NAMESPACE,
  toTraitInput,
  TRAIT_WEIGHTS,
  type TraitDefinition,
} from '../types';
import { AddTraitDialog } from './AddTraitDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { OptionScoresDialog } from './OptionScoresDialog';

/** A fixed-width cell for one control, centered, so the controls line up from row to row. */
const Slot = ({ children }: { children?: ReactNode }) => (
  <Box
    sx={(theme) => ({
      width: theme.spacing(5.5),
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'center',
    })}
  >
    {children}
  </Box>
);

export const TraitSettingsPage = () => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const { definitions, isLoading, isError } = useTraitDefinitions();
  const { traitLabel, unitLabel, optionLabel } = useTraitLabels();
  const [upsert, { isError: upsertFailed }] = useRosterUpsertTraitDefinitionMutation();
  const [reorder] = useRosterReorderTraitDefinitionsMutation();
  const [deleteTrait] = useRosterDeleteTraitDefinitionMutation();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<TraitDefinition | null>(null);
  const [scoring, setScoring] = useState<TraitDefinition | null>(null);

  const move = (index: number, offset: -1 | 1) => {
    const keys = definitions.map((definition) => definition.key);
    const [moved] = keys.splice(index, 1);
    keys.splice(index + offset, 0, moved);
    void reorder(keys);
  };

  const describe = (definition: TraitDefinition) => {
    const kind = t(`kind.${definition.kind}`);
    if (definition.kind === 'number' && definition.unit)
      return `${kind} · ${unitLabel(definition)}`;
    if (definition.kind === 'enum') {
      // Each choice with its score in the overall, e.g. "Secure (10)".
      const choices = definition.options.map(
        (option) => `${optionLabel(definition, option)} (${optionScore(definition, option)})`,
      );
      return `${kind} · ${choices.join(', ')}`;
    }
    return kind;
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {t('traitSettings.title')}
          </Typography>
          <Typography color="text.secondary">{t('traitSettings.intro')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setAdding(true)}>
          {t('traitSettings.add')}
        </Button>
      </Stack>

      {upsertFailed && <Alert severity="error">{t('common:saveError')}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {definitions.map((definition, index) => (
              <ListItem
                key={definition.key}
                divider={index < definitions.length - 1}
                sx={(theme) => ({
                  // Text left, controls in a fixed column on the right: every row lines up, and
                  // a long description wraps instead of pushing the controls down.
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'center',
                  columnGap: 2,
                  opacity: definition.active ? 1 : 0.6,
                  [theme.breakpoints.down('sm')]: {
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    rowGap: 1,
                  },
                })}
              >
                <ListItemText
                  primary={traitLabel(definition)}
                  secondary={
                    definition.builtIn
                      ? describe(definition)
                      : `${describe(definition)} · ${t('traitSettings.custom')}`
                  }
                />
                {/* Fixed-width slots, so a missing control leaves its space empty. Wraps on phones. */}
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Box sx={(theme) => ({ width: theme.spacing(12), flexShrink: 0 })}>
                    {isWeighted(definition.kind) && (
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label={t('traitSettings.weight')}
                        value={definition.weight}
                        onChange={(event) =>
                          void upsert({
                            ...toTraitInput(definition),
                            weight: Number(event.target.value),
                          })
                        }
                      >
                        {TRAIT_WEIGHTS.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Box>
                  <Slot>
                    {definition.kind === 'enum' && (
                      <Tooltip title={t('traitSettings.scores')}>
                        <IconButton
                          onClick={() => setScoring(definition)}
                          aria-label={`${t('traitSettings.scores')}: ${traitLabel(definition)}`}
                        >
                          <ScoreboardOutlined />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Slot>
                  <Slot>
                    {isWeighted(definition.kind) && (
                      <Tooltip title={t('traitSettings.showInTable')}>
                        <Checkbox
                          icon={<TableChartOutlined />}
                          checkedIcon={<TableChart />}
                          checked={toTraitInput(definition).showInTable}
                          onChange={(event) =>
                            void upsert({
                              ...toTraitInput(definition),
                              showInTable: event.target.checked,
                            })
                          }
                          slotProps={{
                            input: {
                              'aria-label': `${t('traitSettings.showInTable')}: ${traitLabel(definition)}`,
                            },
                          }}
                        />
                      </Tooltip>
                    )}
                  </Slot>
                  <Tooltip title={t('traitSettings.active')}>
                    <Switch
                      checked={definition.active}
                      onChange={(event) =>
                        void upsert({ ...toTraitInput(definition), active: event.target.checked })
                      }
                      slotProps={{
                        input: {
                          'aria-label': `${t('traitSettings.active')}: ${traitLabel(definition)}`,
                        },
                      }}
                    />
                  </Tooltip>
                  <Slot>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`${t('traitSettings.moveUp')}: ${traitLabel(definition)}`}
                    >
                      <ArrowUpwardOutlined fontSize="small" />
                    </IconButton>
                  </Slot>
                  <Slot>
                    <IconButton
                      size="small"
                      disabled={index === definitions.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`${t('traitSettings.moveDown')}: ${traitLabel(definition)}`}
                    >
                      <ArrowDownwardOutlined fontSize="small" />
                    </IconButton>
                  </Slot>
                  <Slot>
                    {!definition.builtIn && (
                      <IconButton
                        size="small"
                        onClick={() => setDeleting(definition)}
                        aria-label={`${t('common:actions.delete')}: ${traitLabel(definition)}`}
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    )}
                  </Slot>
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <OptionScoresDialog definition={scoring} onClose={() => setScoring(null)} />
      <AddTraitDialog
        open={adding}
        nextOrder={definitions.reduce((max, definition) => Math.max(max, definition.order), -1) + 1}
        onClose={() => setAdding(false)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('traitSettings.deleteTitle')}
        message={t('traitSettings.deleteMessage', { label: deleting ? traitLabel(deleting) : '' })}
        confirmLabel={t('common:actions.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void deleteTrait(deleting.key);
          setDeleting(null);
        }}
      />
    </Stack>
  );
};
