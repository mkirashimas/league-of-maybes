import { registerNamespace } from '../../i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ro from './locales/ro.json';
import { AUTH_NAMESPACE } from './types';

registerNamespace(AUTH_NAMESPACE, { en, es, fr, it, ro });

export { LoginPage } from './components/LoginPage';
