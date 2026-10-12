import { registerNamespace } from '../../i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ro from './locales/ro.json';
import { CHAT_NAMESPACE } from './types';

registerNamespace(CHAT_NAMESPACE, { en, es, fr, it, ro });

export { ChatSettingsPage } from './components/ChatSettingsPage';
export { ChatTab } from './components/ChatTab';
export { NudgeListener } from './components/NudgeListener';
