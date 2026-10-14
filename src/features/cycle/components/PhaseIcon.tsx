import { Box, type Theme } from '@mui/material';
import { PHASE_STYLES } from '../phaseIcons';
import type { CyclePhase } from '../types';

interface PhaseIconProps {
  phase: CyclePhase;
  /** Size in theme spacing units. */
  size?: number;
}

/** The phase artwork; decorative, the caller provides the accessible name. */
export const PhaseIcon = ({ phase, size = 3 }: PhaseIconProps) => (
  <Box
    component="img"
    src={PHASE_STYLES[phase].icon}
    alt=""
    sx={(theme: Theme) => ({
      display: 'block',
      width: theme.spacing(size),
      height: theme.spacing(size),
      flexShrink: 0,
    })}
  />
);
