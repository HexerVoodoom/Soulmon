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
import { sm2Button } from '../form/FormKit';

export interface TimingBarProps {
  /** Ciclos por segundo do vaivém. Inimigo mais rápido = barra mais rápida. */
  speed: number;
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

/**
 * A barra em VETOR por token (canvas Jogos D-J6): trilho `surface-2` com
 * fronteira `muted`, a zona central (40–60 %) em `primary-soft` com filetes
 * `primary-ink`, o marcador `primary-ink` 3×22 saindo 4 px do trilho, e o
 * botão primário 48 que o para. As cores cruas (`#4ade80`/`#60a5fa`/`#facc15`)
 * e a prop `color` saíram: a barra é a mesma peça em todo jogo — o que muda
 * é o RÓTULO, nunca a tinta (dano é leitura, não alarme — D-J8).
 */
export function TimingBar({ speed, label, onStop, ariaLabel }: TimingBarProps) {
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
    <div data-timing-bar style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
      {/* O trilho também para o marcador no toque (reflexo, `onPointerDown`);
          é decorativo para o leitor — o botão abaixo é o controle nomeado. */}
      <div
        onPointerDown={stop}
        aria-hidden="true"
        data-timing-trail
        style={{
          position: 'relative', height: 16, boxSizing: 'border-box', margin: '4px 0',
          borderRadius: 999,
          backgroundColor: 'var(--sm2-surface-2)',
          border: '1px solid var(--sm2-muted)',
          cursor: 'pointer', touchAction: 'manipulation',
        }}
      >
        <div
          style={{
            position: 'absolute', left: '40%', right: '40%', top: 0, bottom: 0,
            backgroundColor: 'var(--sm2-primary-soft)',
            borderLeft: '1px solid var(--sm2-primary-ink)',
            borderRight: '1px solid var(--sm2-primary-ink)',
          }}
        />
        <div
          data-timing-mark
          style={{
            position: 'absolute', top: -4, width: 3, height: 22, borderRadius: 2,
            left: `calc(${pos * 100}% - 1.5px)`,
            backgroundColor: 'var(--sm2-primary-ink)',
          }}
        />
      </div>
      <button
        type="button"
        onPointerDown={stop}
        aria-label={ariaLabel}
        style={{ ...sm2Button('primary'), width: '100%', maxWidth: 240, alignSelf: 'center', touchAction: 'manipulation' }}
      >
        {label}
      </button>
    </div>
  );
}
