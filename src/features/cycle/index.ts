import { registerNamespace } from '../../i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ro from './locales/ro.json';
import { CYCLE_NAMESPACE } from './types';

registerNamespace(CYCLE_NAMESPACE, { en, es, fr, it, ro });

export { CycleTab } from './components/CycleTab';
export { PersonalDetailsPage } from './components/PersonalDetailsPage';
export { PhaseBadge } from './components/PhaseBadge';
export { useCyclePhase } from './hooks/useCyclePhase';
export { GENDERS, MAX_HEALTH_NOTES_LENGTH, type Gender } from './types';
