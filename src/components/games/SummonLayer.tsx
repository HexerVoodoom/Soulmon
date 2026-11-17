/**
 * COMPANHEIRO INVOCADO na cena (PR 2, 16/11/2026): o sprite fixo da criatura aparece um pouco À FRENTE de quem invocou (na
 * direção do oponente) enquanto o contador real de turnos do núcleo (`FighterFx.comp`) é maior que zero. A presença vem SÓ desse
 * contador: nada aqui mede tempo para decidir se o companheiro está em cena (o único timer é o da saída suave, de 200 ms, que não
 * altera a presença). Sem sprite para a criatura (os PNG chegam no PR 1b) = não desenha nada e não quebra.
 *
 * Custo de rede: 1 PNG por companheiro VISÍVEL, só enquanto está em cena (`loading="lazy"`, `decoding="async"`); sem preload.
 * `prefers-reduced-motion` (e o avanço rápido): entra e sai sem transição.
 */
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { spriteDoCompanheiro } from '../../assets/soulmon/companheiros';

/** Um companheiro: de quem (`'me'` ou o índice do inimigo), qual criatura e quantos turnos de ataque faltam (0 = fora de cena). */
export interface StageSummon {
  readonly side: 'me' | number;
  readonly creature: string | null | undefined;
  readonly turns: number;
}

/** Ponto de apoio de um lutador na cena (a mesma forma de `Spot` do `BattleStage`). */
interface SpotLike { readonly x: number; readonly y: number; readonly size: number }

/** Tamanho do companheiro em relação ao invocador, e o quanto ele se adianta (frações do tamanho do invocador). */
export const SUMMON_SIZE = 0.7;
/** Avanço HORIZONTAL (lado do oponente): o companheiro fica no chão ao lado do invocador, não em cima do corpo dele. */
export const SUMMON_ADVANCE = 0.65;
/** Subida leve (profundidade), SEMPRE para cima: o companheiro do inimigo não desce sobre a barra de HP do jogador. */
export const SUMMON_LIFT = 0.12;
const OUT_MS = 200;

/**
 * Onde o companheiro fica: AO LADO do invocador, do lado do oponente e quase na mesma linha do chão (prévia de 16/11: com o vetor
 * reto até o oponente ele subia para o peito do invocador e, no inimigo, caía sobre a barra de HP do jogador). Puro, para teste.
 */
export function summonPlace(from: SpotLike, to: SpotLike): { x: number; y: number; size: number; flip: boolean } {
  const dx = to.x - from.x;
  return {
    x: from.x + (dx < 0 ? -1 : 1) * from.size * SUMMON_ADVANCE,
    y: from.y - from.size * SUMMON_LIFT,
    size: Math.round(from.size * SUMMON_SIZE),
    flip: dx < 0,
  };
}

function SummonSprite({ summon, from, to, reduced, z }: { summon: StageSummon; from: SpotLike; to: SpotLike; reduced: boolean; z: number }) {
  const src = spriteDoCompanheiro(summon.creature);
  const present = summon.turns > 0 && !!src;
  const [mounted, setMounted] = useState(present);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (present) {
      setMounted(true);
      if (reduced) { setShown(true); return undefined; }
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    if (reduced) { setMounted(false); return undefined; }
    const tm = setTimeout(() => setMounted(false), OUT_MS);
    return () => clearTimeout(tm);
  }, [present, reduced]);
  if (!mounted || !src) return null;
  const p = summonPlace(from, to);
  const style: CSSProperties = {
    position: 'absolute', left: p.x - p.size / 2, top: p.y - p.size, width: p.size, height: p.size, zIndex: z, pointerEvents: 'none',
    imageRendering: 'pixelated', objectFit: 'contain', opacity: shown ? 1 : 0,
    transform: `${p.flip ? 'scaleX(-1) ' : ''}translateY(${shown ? 0 : 10}px) scale(${shown ? 1 : 0.7})`,
    transformOrigin: '50% 100%',
    // Surge/some embebido em luz branca: o sprite nasce e morre estourado de brilho.
    filter: shown ? 'none' : 'brightness(6)',
    transition: reduced ? 'none' : `opacity ${OUT_MS}ms ease-out, transform ${OUT_MS}ms ease-out, filter ${OUT_MS}ms ease-out`,
  };
  const flash: CSSProperties = {
    position: 'absolute', left: p.x - p.size, top: p.y - p.size * 1.5, width: p.size * 2, height: p.size * 1.5, zIndex: z + 1, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 50% 60%, #fff 0%, rgba(255,255,255,.85) 30%, rgba(255,255,255,0) 70%)',
    animation: `sm-summon-flash ${OUT_MS * 2}ms ease-out both`,
  };
  return (
    <>
      <img src={src} alt="" aria-hidden="true" data-stage-summon={String(summon.side)} data-stage-summon-turns={summon.turns} loading="lazy" decoding="async" draggable={false} style={style} />
      {!reduced && <div key={shown ? 'in' : 'out'} aria-hidden="true" data-stage-summon-flash={shown ? 'in' : 'out'} style={flash} />}
    </>
  );
}

/** A camada: um sprite por companheiro (no máximo 1 por combatente, `COMPANHEIROS_POR_COMBATENTE`). */
export function SummonLayer({ summons, me, foes, reduced }: { summons: readonly StageSummon[]; me: SpotLike; foes: readonly SpotLike[]; reduced: boolean }) {
  return (
    <>
      {summons.map((s) => {
        const from = s.side === 'me' ? me : foes[s.side];
        const to = s.side === 'me' ? (foes[0] ?? me) : me;
        if (!from) return null;
        return <SummonSprite key={`sm-${String(s.side)}`} summon={s} from={from} to={to} reduced={reduced} z={s.side === 'me' ? 3 : 2} />;
      })}
    </>
  );
}

/** Os companheiros em cena de uma luta de grupo (`GroupBattle.summon`: índice 0 = pet, 1+i = inimigo i). Vazio sem companheiro. */
export function summonsDoGrupo(turns: readonly number[], pet: string | null | undefined, foes: ReadonlyArray<string | null | undefined> = []): StageSummon[] {
  if (turns.length === 0) return [];
  const out: StageSummon[] = [];
  if ((turns[0] ?? 0) > 0) out.push({ side: 'me', creature: pet, turns: turns[0] });
  foes.forEach((c, i) => { if ((turns[i + 1] ?? 0) > 0) out.push({ side: i, creature: c, turns: turns[i + 1] }); });
  return out;
}
