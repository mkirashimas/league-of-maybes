import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectEffectiveThemeMode,
  selectIsDarkOnlyTheme,
  toggleThemeMode,
} from '../store/themeSlice';

/** Light/dark toggle shown next to the language switcher; disabled for dark-only themes. */
export const ThemeToggle = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectEffectiveThemeMode);
  const isDarkOnly = useAppSelector(selectIsDarkOnlyTheme);
  const label = isDarkOnly
    ? t('theme.darkOnly')
    : t(themeMode === 'light' ? 'theme.switchToDark' : 'theme.switchToLight');

  return (
    <Tooltip title={label}>
      {/* The span keeps the tooltip working while the button is disabled. */}
      <span>
        <IconButton
          color="inherit"
          onClick={() => dispatch(toggleThemeMode())}
          disabled={isDarkOnly}
          aria-label={label}
        >
          {themeMode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
        </IconButton>
      </span>
    </Tooltip>
  );
};
