import { useEffect, useMemo, useRef } from 'react';
import { NightmareBattle, type NightmareBattleProps } from './NightmareBattle';
import { buildNightmareWave } from '../utils/nightmareWave';
import { nightmareNightSignature, nightmareDayKey } from '../utils/nightmares';
import type { DungeonEnemy } from '../utils/dungeon';
import { createRestState, type RestState } from '../utils/restWindow';
import { soulLevel } from '../utils/soulXP';

/**
 * A onda do pesadelo, sorteada AQUI (e não no `App.tsx`): `buildNightmareWave` puxa o roster de combinados com arte
 * (~40 KB) e só esta tela precisa dele — fora do chunk de entrada. A regra é a mesma de antes: a onda é sorteada uma vez
 * por noite (`nightKey` nas deps, nunca o `Date` inteiro — senão o inimigo trocaria no meio da luta).
 */
export function NightmareBattleHost(props: Omit<NightmareBattleProps, 'wave'> & {
  rest: RestState | undefined;
  nightKey: string;
  /** Não há (mais) noite para enfrentar: o App fecha o convite SEM gravar a noite como lutada (nada foi perdido). */
  onVanish?: () => void;
}) {
  const { rest, nightKey, onVanish, ...battle } = props;
  /* Uma só fonte para "há pesadelo": `nightmaresFor` (dentro de `buildNightmareWave`) lido da noite do `rest` atual. A assinatura
     da noite entra nas deps para que um `rest` que chega DEPOIS (nuvem adotada, noite fechada por outro aparelho) refaça uma onda
     que nasceu vazia — antes a onda era memoizada só por `nightKey` e ficava `[]` para sempre, e a tela mostrava o título do
     Pesadelo JUNTO de "a noite passou tranquila" (01/11/2026). */
  const sig = nightmareNightSignature(rest, nightmareDayKey(new Date(), rest?.playerDayTz));
  const built = useMemo(
    () => buildNightmareWave(rest ?? createRestState(), battle.petStage, new Date(), soulLevel(battle.soul ?? { evolutionStage: battle.petStage })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightKey, battle.petStage, sig],
  );
  /* A onda NÃO muda no meio da luta: a primeira onda com inimigos fica (a virada da meia-noite com a tela aberta trocava
     `nightKey`, esvaziava a onda e reiniciava a luta no convite "tranquilo"). */
  const kept = useRef<DungeonEnemy[] | null>(null);
  if (kept.current === null && built.length > 0) kept.current = built;
  const wave = kept.current ?? built;
  useEffect(() => {
    if (wave.length === 0) onVanish?.();
  }, [wave.length, onVanish]);
  if (wave.length === 0) return null;
  return <NightmareBattle {...battle} wave={wave} />;
}
