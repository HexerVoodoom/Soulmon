import { CSSProperties, ReactNode, useEffect, useState } from 'react';

/**
 * `Viewport` — o elemento de marca do Soulmon.
 *
 * É a FRONTEIRA entre os dois mundos visuais do app: **dentro** é pixel
 * (sprite, HUD do aparelho, fonte Silkscreen); **fora** é vetor (tipografia
 * de leitura, ícones, cards). Sem essa fronteira declarada, pixel art e UI
 * moderna disputam a mesma superfície e as duas parecem erradas.
 *
 * Anatomia, fixa e não negociável:
 *  · **anel de cobre de 4px** (padding real) = 2px de linha + 2px de sombra
 *    interna, com material (gradiente) — este componente é o ANEL e a TELA;
 *  · o **corpo do aparelho** (bisel de 16px com material, e a fileira de
 *    controles cravada nele) é `.sm2-device`, a peça que ENVOLVE este
 *    componente. Ele não mora aqui por um motivo de acessibilidade, não de
 *    composição: com `label` este elemento é `role="img"`, e tudo dentro de
 *    um `role="img"` some da árvore de acessibilidade. Um `<button>` aqui
 *    dentro seria focável e invisível para leitor de tela — o defeito
 *    clássico. Anel + tela = imagem; corpo = chassi que carrega controles.
 *    Somados, os 16px do corpo + 4px do anel são os 20px de bisel do plano;
 *  · interior `--sm2-viewport-bg`, **escuro nos DOIS temas** (é um visor,
 *    não um cartão — visor claro não lê como aparelho);
 *  · UM único reflexo + vinheta de 12%;
 *  · respiração = o anel ACENDE (cor + halo) num loop de 4s. Era variação de
 *    blur de 1px e alfa de 0,015 — literalmente imperceptível, movimento que
 *    custava recálculo e não comunicava nada. Desligada por
 *    `prefers-reduced-motion`;
 *  · sem scanline por padrão (scanline sobre sprite de 32px come metade
 *    do desenho). "Por padrão" = sem overlay PERMANENTE de listras, e isso
 *    continua valendo. A varredura de 400ms da sintonia (`.sm-visor-scan`,
 *    `index.css`) é outra coisa: passa UMA vez quando o sprite troca e sai do
 *    DOM — transição, não estado do visor. Quem sobrepõe algo aqui dentro
 *    copia o contrato do `.sm2-viewport-glass`: absoluto e `pointer-events:
 *    none`, para não roubar o gesto de esfregar o pet.
 *
 * **Escala INTEIRA, sempre.** `scale` só aceita 2 ou 3. Escala fracionária
 * é a causa nº 1 de pixel art borrada, e `image-rendering: pixelated` não
 * salva meio pixel: ele só troca o borrão por linhas de espessura desigual.
 * Por isso o tamanho da tela é derivado (`width * scale`), nunca recebido
 * em CSS relativo.
 */

export interface ViewportProps {
  /** Conteúdo do visor — sprite, HUD, o que for. Renderiza em pixel. */
  children?: ReactNode;
  /** Largura LÓGICA do canvas de pixel (antes da escala). */
  width: number;
  /** Altura LÓGICA do canvas de pixel (antes da escala). */
  height: number;
  /** Fator de ampliação. **Só inteiro**: 2 ou 3. Padrão 3. */
  scale?: 2 | 3;
  /** Respiração do anel. Padrão `true`; `prefers-reduced-motion` vence. */
  breathing?: boolean;
  /**
   * Nome acessível do visor. Ausente = decorativo (`aria-hidden`), o que é
   * o certo quando o estado do pet já está escrito em texto ao lado.
   * Textos nascem em inglês; quem chama passa o par PT/EN.
   */
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Estilo do retângulo interno (a "tela"), não do bisel. */
  screenStyle?: CSSProperties;
  /**
   * Classe do retângulo interno. Existe para o **ciclo diurno**: o céu do
   * visor é uma classe (`.sm2-sky-*`), não uma cor inline, porque a mistura
   * é feita em cima do token de tema (`--sm2-viewport-bg`) e um literal aqui
   * congelaria o interior num dos temas.
   */
  screenClassName?: string;
}

/**
 * A respiração também é cortada em JS, e não só pelo `@media` do CSS: o
 * bloco global de `prefers-reduced-motion` deste projeto usa
 * `animation-duration: 0.01ms` em `*`, o que num loop `infinite` ainda
 * dispara milhares de recálculos por segundo. Aqui a animação simplesmente
 * não é aplicada.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // `addEventListener` não existe em MediaQueryList de WebView antigo
    // (Android < 6); `addListener` está deprecado mas é o que responde lá.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else if (mq.removeListener) mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}

export function Viewport({
  children,
  width,
  height,
  scale = 3,
  breathing = true,
  label,
  className,
  style,
  screenStyle,
  screenClassName,
}: ViewportProps) {
  const reduced = usePrefersReducedMotion();
  // Guard de escala inteira: se alguém passar 2.5 por `as any` num JSX, o
  // arredondamento aqui é a diferença entre um sprite nítido e um borrado.
  const s = Math.max(1, Math.round(scale));
  const anima = breathing && !reduced;

  const classes = ['sm2-viewport', anima ? '' : 'sm2-viewport-still', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      // Layout crítico por inline, não por classe: footgun 1 — não existe
      // geração de utilitário neste projeto, `w-[288px]` não aplicaria nada.
      style={style}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <div
        className={['sm2-viewport-screen', screenClassName].filter(Boolean).join(' ')}
        /* A ORDEM AQUI É O CONTRATO, não estilo de código.
           Enquanto o spread vinha DEPOIS, qualquer chamador que passasse
           `width`/`height` em `screenStyle` anulava a regra de escala inteira
           em silêncio — foi exatamente o bug do `CompanionHUD` (um
           `width:'100%'` + `height:var(--sm-petstage-h)` que apagavam
           `width*scale`). Agora o `screenStyle` decora (fundo, sombra) e a
           MEDIDA é do componente, sempre. Há teste travando isto:
           `Viewport.contract.test.tsx`. */
        style={{ ...screenStyle, width: width * s, height: height * s }}
      >
        {children}
        <div className="sm2-viewport-glass" aria-hidden="true" />
      </div>
    </div>
  );
}

export default Viewport;
