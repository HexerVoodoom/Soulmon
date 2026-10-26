import { useMemo } from 'react';
import { NightmareBattle, type NightmareBattleProps } from './NightmareBattle';
import { buildNightmareWave } from '../utils/nightmareWave';
import { createRestState, type RestState } from '../utils/restWindow';
import { soulLevel } from '../utils/soulXP';

/**
 * A onda do pesadelo, sorteada AQUI (e não no `App.tsx`): `buildNightmareWave` puxa o roster de combinados com arte
 * (~40 KB) e só esta tela precisa dele — fora do chunk de entrada. A regra é a mesma de antes: a onda é sorteada uma vez
 * por noite (`nightKey` nas deps, nunca o `Date` inteiro — senão o inimigo trocaria no meio da luta).
 */
export function NightmareBattleHost(props: Omit<NightmareBattleProps, 'wave'> & { rest: RestState | undefined; nightKey: string }) {
  const { rest, nightKey, ...battle } = props;
  const wave = useMemo(
    () => buildNightmareWave(rest ?? createRestState(), battle.petStage, new Date(), soulLevel(battle.soul ?? { evolutionStage: battle.petStage })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightKey, battle.petStage],
  );
  return <NightmareBattle {...battle} wave={wave} />;
}
