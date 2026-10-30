/**
 * ETAPA DUELO do onboarding (cena 7, D16). Totalmente local: sem servidor, sem recompensa,
 * não lê nem grava save/HP. Compõe a lógica pura de `dueloLogic`; NÃO usa `NightmareBattle`
 * (acoplado a GameState/recompensas/motor de grupo) para não mexer em código de combate compartilhado.
 * Arte provisória: placeholders nomeados (`desfeito.png`/`desfeito-pesadelo.png` entram depois).
 */
import { useState } from 'react';
import { arteOnboarding } from '../sequencia/assets';
import { DUELO_MAX, duelCut, duelFoeStrike, duelPlayerStrike, duelStart, type DueloState } from './dueloLogic';

export interface EtapaDueloProps {
  onDone: () => void;
  language?: 'pt-BR' | 'en';
  /** Sprite do BB do jogador (opcional; placeholder se ausente). */
  playerSprite?: string;
}

const ART = {
  anciao: arteOnboarding('velado-anciao.png') ?? '',
  anciaoSoulmon: arteOnboarding('anciao-soulmon.png') ?? '',
  desfeito: arteOnboarding('desfeito.png') ?? '',
  pesadelo: arteOnboarding('desfeito-soulmon.png') ?? arteOnboarding('desfeito-pesadelo.png') ?? '',
  jogadorBB: arteOnboarding('bb-placeholder.png') ?? '',
};

function Bar({ label, hp, max, testId }: { label: string; hp: number; max: number; testId: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12 }}>{label}</div>
      <div style={{ height: 6, background: '#0003', borderRadius: 3 }}>
        <div data-testid={testId} data-hp={hp} style={{ height: 6, width: `${(hp / max) * 100}%`, background: '#2bd4c4', borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Art({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={64}
      height={64}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

export function EtapaDuelo({ onDone, language = 'pt-BR', playerSprite }: EtapaDueloProps) {
  const pt = language === 'pt-BR';
  const [s, setS] = useState<DueloState>(duelStart);
  const [done, setDone] = useState(false);

  const attack = () => {
    if (done) return;
    const after = duelPlayerStrike(s);
    if (duelCut(after)) {
      setS(after);
      setDone(true);
      onDone();
      return;
    }
    setS(duelFoeStrike(after).state);
  };

  return (
    <div role="group" aria-label={pt ? 'Duelo' : 'Duel'} style={{ display: 'grid', gap: 12, padding: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Bar label={pt ? 'Desfeito' : 'The Undone'} hp={s.desfeito} max={DUELO_MAX.desfeito} testId="hp-desfeito" />
        <Bar label={pt ? 'Pesadelo' : 'Nightmare'} hp={s.pesadelo} max={DUELO_MAX.pesadelo} testId="hp-pesadelo" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Art src={ART.desfeito} alt="Desfeito" />
        <Art src={ART.pesadelo} alt="Soulmon-pesadelo" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Art src={playerSprite ?? ART.jogadorBB} alt={pt ? 'Seu Soulmon' : 'Your Soulmon'} />
        <Art src={ART.anciao} alt={pt ? 'Ancião' : 'Elder'} />
        <Art src={ART.anciaoSoulmon} alt={pt ? 'Soulmon do ancião' : "Elder's Soulmon"} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Bar label={pt ? 'Ancião' : 'Elder'} hp={s.anciao} max={DUELO_MAX.anciao} testId="hp-anciao" />
        <Bar label={pt ? 'Soulmon do ancião' : "Elder's Soulmon"} hp={s.anciaoSoulmon} max={DUELO_MAX.anciaoSoulmon} testId="hp-anciao-soulmon" />
      </div>
      <button type="button" onClick={attack} disabled={done}>
        {pt ? 'Atacar' : 'Attack'}
      </button>
    </div>
  );
}

export default EtapaDuelo;
