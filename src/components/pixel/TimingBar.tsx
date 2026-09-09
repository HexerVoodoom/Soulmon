/**
 * A BARRA DE TEMPO — a mecânica de ação de todo combate do Soulmon.
 *
 * Um marcador vai e volta; parar perto do centro acerta melhor. `onStop`
 * recebe a precisão em 0..1, onde 1 é o centro exato. Quem interpreta esse
 * número (dano, esquiva, crítico) é cada jogo — a barra só mede.
 *
 * ## Por que ela mora aqui
 *
 * Ela nasceu local dentro de `DungeonGame.tsx` e foi COPIADA para
 * `NightmareBattle.tsx`, que registrou a dívida no próprio cabeçalho:
 *
 *   > "O caminho de refatoração, quando alguém puder mexer nos dois arquivos:
 *   >  extrair `TimingBar` para `components/pixel/` (…). Enquanto isso, a
 *   >  duplicação está confinada às ~40 linhas marcadas com ⚠️ DUPLICADO."
 *
 * Este arquivo é essa extração. Ela foi feita antes de a Arena existir de
 * propósito: uma terceira cópia da mesma barra seria o footgun 9 do CLAUDE.md
 * ("regra copiada = regra que diverge em silêncio") em cima da mecânica que o
 * jogador mais toca — e a divergência apareceria como "o combate da Arena
 * parece diferente", que ninguém consegue depurar.
 *
 * ⚠️ NÃO acrescente regra de jogo aqui. Dano, elemento, crítico e carga de
 * especial são de quem chama. O dia em que esta barra souber qual jogo está
 * rodando, ela deixa de ser reutilizável e a dívida volta pela porta dos
 * fundos.
 */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

export interface TimingBarProps {
  /** Ciclos por segundo do vaivém. Inimigo mais rápido = barra mais rápida. */
  speed: number;
  /** Cor do marcador e do botão. */
  color: string;
  /** Texto do botão ("Atacar!", "Desviar!"). */
  label: string;
  /**
   * Precisão em 0..1 — 1 é o centro exato. Chamado UMA vez: parar duas vezes
   * (toque no trilho + toque no botão, ou um toque que dispara os dois) não
   * pode contar como dois ataques.
   */
  onStop: (accuracy: number) => void;
  /**
   * Nome acessível da barra. Sem ele, quem usa leitor de tela ouve só o
   * rótulo do botão e não sabe que existe um alvo em movimento.
   */
  ariaLabel?: string;
}

export function TimingBar({ speed, color, label, onStop, ariaLabel }: TimingBarProps) {
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = (((t - t0) / 1000) * speed) % 2;
      const x = p < 1 ? p : 2 - p; // vaivém 0..1..0
      posRef.current = x;
      setPos(x);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  const stop = () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onStop(1 - Math.abs(posRef.current - 0.5) * 2); // 1 = centro exato
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onPointerDown={stop}
        aria-hidden="true"
        style={{ position: 'relative', height: 34, background: '#131a26', border: '1px solid color-mix(in srgb, var(--sm-px-copper) 55%, transparent)', overflow: 'hidden', cursor: 'pointer', touchAction: 'manipulation' }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: '30%', background: 'rgba(250, 204, 21, 0.22)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '46%', width: '8%', background: 'rgba(74, 222, 128, 0.45)' }} />
        <div style={{ position: 'absolute', top: 2, bottom: 2, left: `calc(${pos * 100}% - 3px)`, width: 6, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <button
        onPointerDown={stop}
        className="sm-btn"
        aria-label={ariaLabel}
        style={{ width: '100%', marginTop: 8, backgroundColor: color, borderColor: 'color-mix(in srgb, ' + color + ' 55%, black)', ['--sm-cham-line' as string]: 'color-mix(in srgb, ' + color + ' 55%, black)', color: '#0b0f17' } as CSSProperties}
      >
        {label}
      </button>
    </div>
  );
}
