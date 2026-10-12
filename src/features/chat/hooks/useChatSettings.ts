import { useMemo } from 'react';
import { useChatGetChatSettingsQuery } from '../api';
import { withDefaults } from '../types';

/** Chat settings with defaults applied: a missing doc (or missing fields) means defaults. */
export const useChatSettings = () => {
  const { data, isLoading, isError } = useChatGetChatSettingsQuery();
  const settings = useMemo(() => withDefaults(data), [data]);
  return { settings, stored: data ?? null, isLoading, isError };
};
