import { useState } from 'react';
import { DuelScreen } from './DuelScreen';
import { getSpriteForStage } from '../utils/sprites';
import type { GuildWarReplay as Replay } from '../utils/community';

/**
 * "ASSISTIR" da carta de guerra de clã (22/11/2026): reproduz, uma a uma, as lutas da guerra com a MESMA semente e as fichas
 * que o servidor gravou. Só reproduz: não envia toque, não muda resultado, seiva nem placar. Os dois lados aparecem como
 * silhuetas neutras (nunca estágio, linha ou nome de gente do outro clã).
 */
export function GuildWarReplay({ replay, isPt, onClose }: { replay: Replay; isPt: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const d = replay.duels[i];
  if (!d) return null;
  const sprite = getSpriteForStage('rookie', undefined, 256);
  const nome = (n: number) => (isPt ? `Luta ${n} de ${replay.duels.length}` : `Fight ${n} of ${replay.duels.length}`);
  return (
    <div data-guild-war-replay style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
      <DuelScreen
        key={i} observar me={d.me} opp={d.opp} seed={d.seed}
        petSprite={sprite} oppSprite={sprite} petName={nome(i + 1)} oppName={replay.enemy} isPt={isPt}
        onDone={() => { if (i + 1 < replay.duels.length) setI(i + 1); else onClose(); }}
        onClose={onClose}
      />
    </div>
  );
}
