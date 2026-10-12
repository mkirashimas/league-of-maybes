import { registerNamespace } from '../../i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ro from './locales/ro.json';
import { DATES_NAMESPACE } from './types';

registerNamespace(DATES_NAMESPACE, { en, es, fr, it, ro });

export { DatesTab } from './components/DatesTab';
export { TimelinePage } from './components/TimelinePage';
