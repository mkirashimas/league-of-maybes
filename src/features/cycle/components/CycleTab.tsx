import { useParams } from 'react-router';
import { CyclePanel } from './CyclePanel';

/** Player tab: the player's cycle, today's phase and how she tends to be in each phase. */
export const CycleTab = () => {
  const { playerId = '' } = useParams();
  return playerId ? <CyclePanel subjectId={playerId} /> : null;
};
