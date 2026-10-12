import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ROSTER_NAMESPACE, type TraitDefinition } from '../types';

/** Labels for traits, their enum options and units: translated for built-in traits, as typed for custom ones. */
export const useTraitLabels = () => {
  const { t } = useTranslation(ROSTER_NAMESPACE);

  const traitLabel = useCallback(
    (definition: TraitDefinition) =>
      definition.builtIn ? t(`trait.${definition.key}`) : definition.customLabel,
    [t],
  );

  const optionLabel = useCallback(
    (definition: TraitDefinition, option: string) =>
      definition.builtIn ? t(`traitOption.${definition.key}.${option}`) : option,
    [t],
  );

  const unitLabel = useCallback(
    (definition: TraitDefinition) =>
      definition.builtIn && definition.unit ? t(`unit.${definition.unit}`) : definition.unit,
    [t],
  );

  return { traitLabel, optionLabel, unitLabel };
};
