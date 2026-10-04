import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * `TypewriterText` — texto que surge AOS POUCOS, letra a letra (máquina de
 * escrever). Pedido do dono (02/10/2026, I1): a fala do NPC não aparece de uma
 * vez, ela é "dita". Reutilizável por qualquer fala/legenda curta.
 *
 * Regras (todas travadas por `TypewriterText.render.test.tsx`):
 *  - ~30 ms por caractere (`speedMs`, padrão 30; faixa pedida 25–35). Sem som.
 *  - SEM reflow do balão: o texto COMPLETO fica no fluxo o tempo todo — a parte
 *    ainda não dita é só `visibility: hidden` —, então a altura final já está
 *    reservada desde o 1º quadro e as quebras de linha não mudam.
 *  - Toque no texto completa na hora (e `instant` deixa quem hospeda completar por
 *    um toque em volta, ex.: o balão inteiro).
 *  - `prefers-reduced-motion: reduce` mostra tudo de uma vez. Sem `matchMedia`
 *    (jsdom) também — nada a animar.
 *  - Leitor de tela: o texto inteiro mora num nó visualmente oculto e o
 *    desenho animado é `aria-hidden` — nunca se lê letra por letra, e não há
 *    `aria-live` (a fala não é um alerta).
 *  - `onDone` dispara UMA vez por texto, ao terminar (ou ao completar pelo toque).
 *  - Trocar `text` recomeça a fala.
 *
 * Sem classes de CSS: tudo inline (footgun do `index.css.contract`).
 */

/** Nó "só para leitor de tela": fora da vista, mas na árvore de acessibilidade. */
const SR_ONLY: CSSProperties = {
  position: 'absolute', width: 1, height: 1, margin: -1, padding: 0,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

/** Sem como animar (sem `matchMedia`, ex. jsdom/SSR): mostra tudo.
 *  ATENÇÃO (04/10/2026): "remover animações" do Android liga `prefers-reduced-motion`
 *  em TODO WebView — e a digitação NÃO é movimento vestibular (o texto não se
 *  desloca). Desligá-la com esse flag escondia a fala do NPC do dono. Agora a
 *  digitação continua, só mais rápida (`reducedSpeed`). */
export function prefersNoTypewriter(): boolean {
  return typeof window === 'undefined' || typeof window.matchMedia !== 'function';
}

/** Metade do tempo por caractere quando a pessoa pediu menos movimento. */
function reducedSpeed(speedMs: number): number {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Math.max(10, Math.round(speedMs / 2));
  } catch { /* segue com a velocidade normal */ }
  return speedMs;
}

export function TypewriterText({ text, speedMs = 30, onDone, instant = false, style, className }: {
  text: string;
  /** `true` mostra o texto inteiro agora (completar por um toque fora do próprio texto). */
  instant?: boolean;
  /** Milissegundos por caractere. */
  speedMs?: number;
  onDone?: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  // Array.from: emoji e pares substitutos contam como UM caractere.
  const chars = Array.from(text);
  const total = chars.length;
  // O contador é amarrado ao texto a que pertence: trocar `text` recomeça sem
  // um quadro com o contador do texto antigo.
  const [prog, setProg] = useState<{ text: string; n: number }>(() => ({ text, n: prefersNoTypewriter() ? total : 0 }));
  const count = instant ? total : prog.text === text ? prog.n : (prefersNoTypewriter() ? total : 0);
  const done = count >= total;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setProg(p => {
        const base = p.text === text ? p.n : 0;
        return { text, n: Math.min(total, base + 1) };
      });
    }, Math.max(10, reducedSpeed(speedMs)));
    return () => window.clearInterval(id);
  }, [done, total, speedMs, text]);

  useEffect(() => {
    if (done && firedFor.current !== text) {
      firedFor.current = text;
      doneRef.current?.();
    }
  }, [done, text]);

  const complete = useCallback(() => setProg({ text, n: total }), [text, total]);
  const shown = chars.slice(0, count).join('');
  const rest = chars.slice(count).join('');

  return (
    <span data-typewriter data-typewriter-done={done ? 'true' : 'false'} className={className} style={style}>
      <span data-typewriter-sr style={SR_ONLY}>{text}</span>
      <span
        aria-hidden="true"
        data-typewriter-visual
        onClick={done ? undefined : complete}
      >
        <span data-typewriter-shown>{shown}</span>
        <span data-typewriter-rest style={{ visibility: 'hidden' }}>{rest}</span>
      </span>
    </span>
  );
}
