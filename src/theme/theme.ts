import type { Localization } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import type { ThemeMode } from '../types';
import { components } from './components';
import { getPalette } from './palette';
import { shape } from './shape';
import { typography } from './typography';

export const createAppTheme = (mode: ThemeMode, locale: Localization) =>
  createTheme({ palette: getPalette(mode), typography, shape, components }, locale);
