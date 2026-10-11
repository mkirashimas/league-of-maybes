import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store';
import { selectThemeMode, toggleThemeMode } from '../store/themeSlice';

/** Light/dark toggle shown next to the language switcher. */
export const ThemeToggle = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const label = t(themeMode === 'light' ? 'theme.switchToDark' : 'theme.switchToLight');

  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={() => dispatch(toggleThemeMode())} aria-label={label}>
        {themeMode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
      </IconButton>
    </Tooltip>
  );
};
