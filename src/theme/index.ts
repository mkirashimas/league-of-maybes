import { enUS, esES, frFR, itIT, roRO, type Localization } from '@mui/material/locale';
import type { Language } from '../types';

export { createAppTheme } from './theme';

export const MUI_LOCALES: Record<Language, Localization> = {
  en: enUS,
  es: esES,
  fr: frFR,
  it: itIT,
  ro: roRO,
};
