import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/** Formats an ISO date (yyyy-mm-dd) in the current language. */
export const useDateFormat = () => {
  const { i18n } = useTranslation();
  return useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(
        new Date(`${iso}T00:00:00`),
      ),
    [i18n.resolvedLanguage],
  );
};
