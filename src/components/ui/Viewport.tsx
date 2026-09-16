import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { HUD_ART } from '../../utils/hudArt';

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
  /**
   * Moldura 9-slice pixel (`hudArt.frame`, cano + trepadeira, 96² com cantos
   * de 24) como OVERLAY dentro do vidro — `position: absolute; inset: 0`,
   * sob o reflexo, `pointer-events: none` (X2 do canvas Sistema, SIS-05). O
   * anel de cobre continua sendo a fronteira externa; a moldura nunca sai do
   * retângulo `--sm2-viewport-bg`. Opcional (Masmorra/Torneio); **nunca na
   * Home**, nunca em volta de card ou botão. Desenhada a 1× (24 CSS px de
   * cano), como no artboard.
   */
  frame?: boolean;
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

/**
 * Os 400 ms da varredura, em JS. Gemeo declarado do token `--sm2-dur-scan` no
 * `index.css` — o CSS anima, este numero so decide QUANDO o elemento sai do
 * DOM. Se um dos dois mudar, o outro tem de mudar junto; ha trava nos dois
 * lados (`styles/tokens.contrast.test.ts` no token, e os testes de render da
 * varredura no `EvolutionPath` e no `CompanionHUD` no desmonte).
 */
export const DUR_VARREDURA_MS = 400;

/**
 * A VARREDURA DA SINTONIA — verdadeira só enquanto a faixa está passando.
 *
 * **Por que mora AQUI, e não no componente que a usa.** Ela nasceu dentro do
 * `EvolutionPath`, com um call-site só. A spec (§2.1 e §2.3.1) sempre pediu
 * dois: a sintonia acontece "na página de Evolução e depois no visor" — e o
 * visor da Home (`CompanionHUD`) é onde o jogador de fato vê o bicho. Duas
 * cópias de um hook cujo número tem gêmeo no CSS é exatamente a forma de os
 * dois lados divergirem em silêncio; o dono da varredura é o dono do visor,
 * que é este arquivo.
 *
 * Três decisões moram aqui, e nenhuma delas cabe no CSS:
 *
 * 1. **Só na TROCA, nunca na montagem.** Abrir a Home ou a página de Evolução
 *    não é sintonizar. Uma animação que dispara em todo mount vira tique
 *    ambiental, e aí ela sim começa a competir com o sprite pela atenção — que
 *    é o medo legítimo por trás do "sem scanline por padrão" acima. Por isso o
 *    `useRef` guarda o sprite anterior: sem valor anterior, não houve troca.
 * 2. **UMA vez, e sai do DOM.** O `both` do CSS deixaria a faixa parada no fim
 *    do percurso para sempre; tirar o elemento é o que garante que isto é
 *    transição e não overlay permanente.
 * 3. **Movimento reduzido corta em JS, não em CSS.** O bloco global deste
 *    projeto encolhe animação para `0.01ms`, o que não é "desligado" — a mesma
 *    armadilha que fez a respiração do anel ser cortada em JS logo acima. Aqui
 *    o elemento simplesmente não nasce.
 */
export function useVarreduraDeSintonia(sprite: string, reduzido: boolean): boolean {
  const anterior = useRef<string | null>(null);
  const [varrendo, setVarrendo] = useState(false);
  useEffect(() => {
    const antes = anterior.current;
    anterior.current = sprite;
    if (antes === null || antes === sprite) return;
    if (reduzido) return;
    setVarrendo(true);
    const t = setTimeout(() => setVarrendo(false), DUR_VARREDURA_MS);
    return () => clearTimeout(t);
  }, [sprite, reduzido]);
  return varrendo;
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
  frame = false,
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
        {/* A moldura vem DEPOIS do conteúdo e ANTES do reflexo: cobre o
            sprite nas bordas (é uma moldura) e o vidro cobre a moldura (é um
            vidro). Mesmo contrato do `.sm2-viewport-glass`: absoluto e sem
            eventos, para não roubar o gesto de esfregar o pet. */}
        {frame && (
          <div
            className="sm2-viewport-frame"
            aria-hidden="true"
            data-viewport-frame
            style={{
              borderWidth: HUD_ART.frameSlice,
              borderImageSource: `url(${HUD_ART.frame})`,
              borderImageSlice: HUD_ART.frameSlice,
              borderImageWidth: HUD_ART.frameSlice,
            }}
          />
        )}
        <div className="sm2-viewport-glass" aria-hidden="true" />
      </div>
    </div>
  );
}

export default Viewport;
