import { useCallback, useState } from 'react';

const STORAGE_KEY = 'roster.responsibilityNoticeSeen';

const readSeen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // Storage can be unavailable; then the notice simply shows again next time.
    return false;
  }
};

/** One-time notice on the player form: the user is responsible for what they write. */
export const useResponsibilityNotice = () => {
  const [visible, setVisible] = useState(() => !readSeen());

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore: the notice is a convenience.
    }
  }, []);

  return { visible, dismiss };
};
