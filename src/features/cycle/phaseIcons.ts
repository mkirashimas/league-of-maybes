import earlyLuteal from './icons/early-luteal.svg';
import follicular from './icons/follicular.svg';
import lateLuteal from './icons/late-luteal-pms.svg';
import menstrual from './icons/menstrual.svg';
import ovulation from './icons/ovulation.svg';
import type { CyclePhase } from './types';

type PhaseColor = 'error' | 'success' | 'warning' | 'info' | 'secondary';

/**
 * Icon and palette colour of each phase. The icons carry their own colours (artwork); the palette
 * colour is used for the cycle strip and accents, so those follow the theme.
 */
export const PHASE_STYLES: Record<CyclePhase, { icon: string; color: PhaseColor }> = {
  menstrual: { icon: menstrual, color: 'error' },
  follicular: { icon: follicular, color: 'success' },
  ovulation: { icon: ovulation, color: 'warning' },
  earlyLuteal: { icon: earlyLuteal, color: 'info' },
  lateLuteal: { icon: lateLuteal, color: 'secondary' },
};
