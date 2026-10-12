import type { Localization } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import type { ThemeMode, ThemeName } from '../types';
import { components } from './components';
import { getPalette } from './palette';
import { shape } from './shape';
import { typography } from './typography';

export const createAppTheme = (name: ThemeName, mode: ThemeMode, locale: Localization) =>
  createTheme({ palette: getPalette(name, mode), typography, shape, components }, locale);
