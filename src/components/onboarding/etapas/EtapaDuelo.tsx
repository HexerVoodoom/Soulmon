/**
 * ETAPA DUELO da intro narrativa (cena 5): 2x1 roteirizado, visual do combate (cenário `combate/bg-*`),
 * turnos fixos. Totalmente local: não lê nem grava save/HP, sem recompensa. Compõe `dueloLogic`; não usa
 * `BattleStage`/`NightmareBattle` (acoplados a GameState, mira de um só lado e recompensas) para não mexer
 * em código de combate compartilhado.
 */
import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../../utils/i18n';
import { ArteIntro } from '../sequencia/ArteIntro';
import { t as tx, UI } from '../sequencia/copy';
import { prefersReducedMotion } from '../../../utils/combatFx';
import { aliadoCortou, duelRodada, duelStart, DUELO_MAX, type DueloState } from './dueloLogic';

const CENARIOS = import.meta.glob('../../../assets/soulmon/combate/bg-neutro.png', { eager: true, import: 'default' }) as Record<string, string>;
const CENARIO = Object.values(CENARIOS)[0];

/** Pausa depois do golpe que corta a luta, para o jogador ver o fim antes da fala do ancião. */
export const DUELO_CORTE_MS = 900;

export interface EtapaDueloProps {
  onDone: () => void;
  language?: Language;
  /** Sprite do Soulmon do jogador (sem ele, silhueta). */
  playerSprite?: string;
}

function Barra({ rotulo, hp, max, testId }: { rotulo: string; hp: number; max: number; testId: string }) {
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 'var(--sm2-text-xs)', color: '#f2f2f2' }}>{rotulo}</div>
      <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}
        style={{ height: 8, background: 'rgba(0,0,0,.5)', borderRadius: 4, overflow: 'hidden' }}>
        <div data-testid={testId} data-hp={hp} style={{ height: 8, width: `${(hp / max) * 100}%`, background: '#2bd4c4', transition: 'width .25s' }} />
      </div>
    </div>
  );
}

export function EtapaDuelo({ onDone, language = 'pt-BR', playerSprite }: EtapaDueloProps) {
  const isPt = language === 'pt-BR';
  const [s, setS] = useState<DueloState>(duelStart);
  const [golpe, setGolpe] = useState(0); // contador para a vibração do aliado
  const [terminou, setTerminou] = useState(false);
  const feito = useRef(false);
  const reduzido = useRef(prefersReducedMotion());

  const atacar = () => {
    if (terminou) return;
    const r = duelRodada(s);
    setS(r.state);
    setGolpe(g => g + 1);
    if (aliadoCortou(r.state)) setTerminou(true);
  };

  useEffect(() => {
    if (!terminou) return;
    const id = setTimeout(() => { if (!feito.current) { feito.current = true; onDone(); } }, DUELO_CORTE_MS);
    return () => clearTimeout(id);
  }, [terminou, onDone]);

  const nomeAliado = isPt ? 'Aliado do Ancião' : "Elder's ally";
  const nomeInimigo = isPt ? 'Soulmon do Desfeito' : "The Undone's Soulmon";
  const nomeJogador = isPt ? 'Seu Soulmon' : 'Your Soulmon';
  const aviso = s.rodada === 0
    ? (isPt ? 'O Soulmon do Desfeito é mais forte. Ataque junto com o aliado do Ancião.' : "The Undone's Soulmon is stronger. Attack together with the Elder's ally.")
    : terminou
      ? (isPt ? 'O aliado do Ancião não aguenta mais um golpe.' : "The Elder's ally cannot take another hit.")
      : (isPt ? 'O Soulmon do Desfeito golpeia o aliado do Ancião.' : "The Undone's Soulmon strikes the Elder's ally.");

  return (
    <div role="group" aria-label={isPt ? 'Duelo' : 'Duel'} data-etapa="duelo"
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, color: '#f2f2f2',
        background: CENARIO ? `center / cover no-repeat url(${CENARIO})` : '#10201f' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Barra rotulo={nomeInimigo} hp={s.inimigo} max={DUELO_MAX.inimigo} testId="hp-inimigo" />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
        <div style={{ width: '38%', maxWidth: 180, aspectRatio: '1', position: 'relative' }}>
          <ArteIntro k="desfeito-soulmon" language={language} contain extra={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ width: '34%', maxWidth: 150, aspectRatio: '1', position: 'relative' }}>
          {playerSprite
            ? <img src={playerSprite} alt={nomeJogador} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
            : <div role="img" aria-label={nomeJogador} style={{ position: 'absolute', inset: 0, border: '1px dashed #5b6b70', color: '#9fb2b7', fontSize: 'var(--sm2-text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nomeJogador}</div>}
        </div>
        <div data-testid="aliado" data-golpe={golpe}
          style={{ width: '34%', maxWidth: 150, aspectRatio: '1', position: 'relative',
            animation: !reduzido.current && golpe > 0 ? 'seq-glitch .3s steps(4)' : undefined }} key={golpe}>
          <ArteIntro k="anciao-soulmon" language={language} contain extra={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Barra rotulo={nomeAliado} hp={s.aliado} max={DUELO_MAX.aliado} testId="hp-aliado" />
        <Barra rotulo={nomeJogador} hp={s.jogador} max={DUELO_MAX.jogador} testId="hp-jogador" />
      </div>
      <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 'var(--sm2-text-sm)' }}>{aviso}</p>
      <button type="button" onClick={atacar} disabled={terminou}
        style={{ minHeight: 48, borderRadius: 8, border: '1px solid #4a6068', background: '#1d2b2f', color: '#f2f2f2', fontSize: 'var(--sm2-text-md)' }}>
        {tx(UI.atacar, language)}
      </button>
    </div>
  );
}

export default EtapaDuelo;
