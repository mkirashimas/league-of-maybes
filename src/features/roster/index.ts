import { registerNamespace } from '../../i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ro from './locales/ro.json';
import { ROSTER_NAMESPACE } from './types';

registerNamespace(ROSTER_NAMESPACE, { en, es, fr, it, ro });

export { LeagueTablePage } from './components/LeagueTablePage';
export { PlayerFormPage } from './components/PlayerFormPage';
export { PlayerLayout } from './components/PlayerLayout';
export { PlayerProfilePage } from './components/PlayerProfilePage';
export { TraitSettingsPage } from './components/TraitSettingsPage';
