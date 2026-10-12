import { Check, PaletteOutlined } from '@mui/icons-material';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store';
import { selectThemeMode, selectThemeName, setThemeName } from '../store/themeSlice';
import { getThemeSwatch } from '../theme';
import { DARK_ONLY_THEMES, THEME_NAMES, type ThemeName } from '../types';

const GROUPS = [
  { key: 'lightDark', names: THEME_NAMES.filter((name) => !DARK_ONLY_THEMES.includes(name)) },
  { key: 'darkOnly', names: THEME_NAMES.filter((name) => DARK_ONLY_THEMES.includes(name)) },
] as const;

/** Three overlapping dots: background, primary and secondary (or the stripe) of a theme. */
const Swatch = ({ name }: { name: ThemeName }) => {
  const mode = useAppSelector(selectThemeMode);
  const { background, primary, secondary, stripe } = getThemeSwatch(name, mode);

  return (
    <Box sx={{ display: 'flex' }} aria-hidden>
      {[background, primary, stripe ?? secondary].map((color, index) => (
        <Box
          key={index}
          sx={(theme) => ({
            width: theme.spacing(2),
            height: theme.spacing(2),
            borderRadius: '50%',
            background: color,
            border: `1px solid ${theme.palette.divider}`,
            ml: index === 0 ? 0 : -0.75,
          })}
        />
      ))}
    </Box>
  );
};

/** Colour theme menu shown next to the light/dark toggle. */
export const ThemePicker = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectThemeName);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const choose = (name: ThemeName) => {
    dispatch(setThemeName(name));
    setAnchor(null);
  };

  return (
    <>
      <Tooltip title={t('theme.choose')}>
        <IconButton
          color="inherit"
          onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
          aria-label={t('theme.choose')}
          aria-haspopup="menu"
        >
          <PaletteOutlined />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {GROUPS.flatMap((group) => [
          <ListSubheader key={group.key}>{t(`theme.groups.${group.key}`)}</ListSubheader>,
          ...group.names.map((name) => (
            <MenuItem key={name} selected={name === current} onClick={() => choose(name)}>
              <ListItemIcon>
                <Swatch name={name} />
              </ListItemIcon>
              <ListItemText primary={t(`theme.names.${name}`)} />
              {name === current && <Check fontSize="small" sx={{ ml: 2 }} />}
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  );
};
