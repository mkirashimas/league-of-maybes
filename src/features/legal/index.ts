import { registerNamespace } from '../../i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ro from './locales/ro.json';
import { LEGAL_NAMESPACE } from './types';

registerNamespace(LEGAL_NAMESPACE, { en, es, fr, it, ro });

export { ConsentGate } from './components/ConsentGate';
export { ConsentPage } from './components/ConsentPage';
export { PrivacyPage, TermsPage } from './components/LegalPage';
