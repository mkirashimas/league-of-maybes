import { MenuItem, Select, useMediaQuery, useTheme, type SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { toLanguage } from '../i18n';
import { LANGUAGES, type Language } from '../types';

/** Language select for the top bars; languages are listed alphabetically. */
export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation('common');
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (event: SelectChangeEvent<Language>) => {
    void i18n.changeLanguage(event.target.value);
  };

  return (
    <Select
      value={toLanguage(i18n.resolvedLanguage)}
      onChange={handleChange}
      variant="standard"
      disableUnderline
      renderValue={(language) => (isSmall ? language.toUpperCase() : t(`languages.${language}`))}
      inputProps={{ 'aria-label': t('language') }}
      sx={{ color: 'inherit', '& .MuiSvgIcon-root': { color: 'inherit' } }}
    >
      {LANGUAGES.map((language) => (
        <MenuItem key={language} value={language}>
          {t(`languages.${language}`)}
        </MenuItem>
      ))}
    </Select>
  );
};
