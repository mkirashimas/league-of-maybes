import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRosterUpsertTraitDefinitionMutation } from '../api';
import { useTraitLabels } from '../hooks/useTraitLabels';
import {
  optionScore,
  ROSTER_NAMESPACE,
  toTraitInput,
  TRAIT_WEIGHTS,
  type TraitDefinition,
} from '../types';

interface OptionScoresDialogProps {
  /** The choice trait being scored; null when closed. */
  definition: TraitDefinition | null;
  onClose: () => void;
}

/** Scores of every choice of one choice trait, 1–10 each: what the choice is worth in Overall. */
const ScoresForm = ({
  definition,
  onClose,
}: {
  definition: TraitDefinition;
  onClose: () => void;
}) => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const { traitLabel, optionLabel } = useTraitLabels();
  const [upsert, { isLoading, isError }] = useRosterUpsertTraitDefinitionMutation();
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      definition.options.map((option) => [option, optionScore(definition, option) ?? 1]),
    ),
  );

  const handleSave = async () => {
    const result = await upsert({ ...toTraitInput(definition), optionScores: scores });
    if (!('error' in result)) onClose();
  };

  return (
    <>
      <DialogTitle>{t('traitSettings.scoresTitle', { label: traitLabel(definition) })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>{t('traitSettings.scoresIntro')}</DialogContentText>
          {definition.options.map((option) => (
            <TextField
              key={option}
              select
              size="small"
              label={optionLabel(definition, option)}
              value={scores[option]}
              onChange={(event) =>
                setScores((current) => ({ ...current, [option]: Number(event.target.value) }))
              }
            >
              {TRAIT_WEIGHTS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          ))}
          {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
        <Button variant="contained" onClick={() => void handleSave()} loading={isLoading}>
          {t('common:actions.save')}
        </Button>
      </DialogActions>
    </>
  );
};

export const OptionScoresDialog = ({ definition, onClose }: OptionScoresDialogProps) => (
  <Dialog open={definition !== null} onClose={onClose} fullWidth maxWidth="xs">
    {/* Remounted per trait, so the form starts from the stored scores. */}
    {definition && <ScoresForm key={definition.key} definition={definition} onClose={onClose} />}
  </Dialog>
);
