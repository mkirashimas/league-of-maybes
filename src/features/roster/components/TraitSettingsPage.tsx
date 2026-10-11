import {
  AddOutlined,
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  DeleteOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useRosterDeleteTraitDefinitionMutation,
  useRosterReorderTraitDefinitionsMutation,
  useRosterUpsertTraitDefinitionMutation,
} from '../api';
import { useTraitDefinitions } from '../hooks/useTraitDefinitions';
import { useTraitLabels } from '../hooks/useTraitLabels';
import {
  MAX_TRAIT_WEIGHT,
  ROSTER_NAMESPACE,
  type TraitDefinition,
  type TraitDefinitionInput,
} from '../types';
import { AddTraitDialog } from './AddTraitDialog';
import { ConfirmDialog } from './ConfirmDialog';

const toInput = (definition: TraitDefinition): TraitDefinitionInput => ({
  key: definition.key,
  builtIn: definition.builtIn,
  customLabel: definition.customLabel,
  kind: definition.kind,
  unit: definition.unit,
  options: definition.options,
  weight: definition.weight,
  order: definition.order,
  active: definition.active,
});

export const TraitSettingsPage = () => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const { definitions, isLoading, isError } = useTraitDefinitions();
  const { traitLabel, unitLabel, optionLabel } = useTraitLabels();
  const [upsert, { isError: upsertFailed }] = useRosterUpsertTraitDefinitionMutation();
  const [reorder] = useRosterReorderTraitDefinitionsMutation();
  const [deleteTrait] = useRosterDeleteTraitDefinitionMutation();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<TraitDefinition | null>(null);

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
      return `${kind} · ${definition.options.map((option) => optionLabel(definition, option)).join(', ')}`;
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
                  gap: 2,
                  flexWrap: 'wrap',
                  opacity: definition.active ? 1 : 0.6,
                  [theme.breakpoints.down('sm')]: { gap: 1 },
                })}
              >
                <ListItemText
                  primary={traitLabel(definition)}
                  secondary={
                    definition.builtIn
                      ? describe(definition)
                      : `${describe(definition)} · ${t('traitSettings.custom')}`
                  }
                  sx={(theme) => ({ minWidth: theme.spacing(20), flex: '1 1 auto' })}
                />
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {definition.kind === 'scale' && (
                    <TextField
                      select
                      size="small"
                      label={t('traitSettings.weight')}
                      value={definition.weight}
                      onChange={(event) =>
                        void upsert({ ...toInput(definition), weight: Number(event.target.value) })
                      }
                      sx={(theme) => ({ width: theme.spacing(12) })}
                    >
                      {Array.from({ length: MAX_TRAIT_WEIGHT + 1 }, (_, value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  <Tooltip title={t('traitSettings.active')}>
                    <Switch
                      checked={definition.active}
                      onChange={(event) =>
                        void upsert({ ...toInput(definition), active: event.target.checked })
                      }
                      slotProps={{
                        input: {
                          'aria-label': `${t('traitSettings.active')}: ${traitLabel(definition)}`,
                        },
                      }}
                    />
                  </Tooltip>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`${t('traitSettings.moveUp')}: ${traitLabel(definition)}`}
                  >
                    <ArrowUpwardOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === definitions.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`${t('traitSettings.moveDown')}: ${traitLabel(definition)}`}
                  >
                    <ArrowDownwardOutlined fontSize="small" />
                  </IconButton>
                  {!definition.builtIn && (
                    <IconButton
                      size="small"
                      onClick={() => setDeleting(definition)}
                      aria-label={`${t('common:actions.delete')}: ${traitLabel(definition)}`}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

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
