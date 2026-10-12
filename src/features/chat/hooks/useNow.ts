import { useEffect, useState } from 'react';

/** The current time, refreshed every `intervalMs`, so time-based reminders update on their own. */
export const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
};
