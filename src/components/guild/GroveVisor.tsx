/**
 * O PANORAMA DO BOSQUE (D-29/D-31/D-33, 18/10/2026): tela cheia (a altura é a tela útil), uma pintura única de
 * ~3 telas de largura que se navega para os lados. Nada de `image-rendering: pixelated` — é pintura, não pixel.
 *
 * Ao longo da pintura moram 4 lugares, um por estação do hemisfério sul (outono, inverno, primavera, verão); cada
 * um mostra a árvore no nível atual (`niveis[estacao]`, 1..5) ou um lugar vazio (0). Quem decide o nível é
 * `utils/bosqueArvores.ts`; aqui só se desenha.
 *
 * Navegação: rolagem/deslize nativos (com snap suave), arrastar com o mouse, setas ← → do teclado movendo UMA tela
 * e dois botões nas bordas. Movimento reduzido: o salto é instantâneo (`behavior: 'auto'`).
 * Carregado sob demanda: só `GroveFolha` (import dinâmico) o puxa, com o panorama e as árvores.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ARVORE_SRC, PANORAMA_SRC } from '../../assets/bosque';
import { ESTACOES_BOSQUE, ESPECIE_DA_ESTACAO, type EstacaoBosque } from '../../utils/bosqueArvores';
import { guildText, type GuildKey } from '../../utils/guildCopy';
import { GroveWalkers } from './GroveWalkers';
import type { GuildView } from '../../utils/community';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';

/**
 * GEOMETRIA DOS 4 CAMPOS. O campo é a CLAREIRA de terra batida que se vê no panorama v2 (1700×1129): `CLAREIRAS` guarda
 * a caixa MEDIDA dela (px da imagem; o teste a remede na imagem). A árvore é centrada na clareira, com a base no chão
 * dela. A completa (nível 4) mede `OCUPACAO_COMPLETA` da LARGURA da clareira: a árvore é alta e nasce do chão para cima,
 * então a largura é o que a clareira limita; a altura só precisa caber na cena (conferido no teste). Os níveis 1–3 e o 5
 * seguem a escala relativa da arte (o 5 chega a ~1,1–1,2× a largura da completa, sem sair da clareira).
 */
export const CENA_W = 1700;
export const CENA_H = 1129;
export const CLAREIRAS: Record<EstacaoBosque, { x0: number; x1: number; y0: number; y1: number }> = {
  outono: { x0: 109, x1: 380, y0: 644, y1: 835 },
  inverno: { x0: 493, x1: 771, y0: 637, y1: 839 },
  primavera: { x0: 892, x1: 1159, y0: 649, y1: 852 },
  verao: { x0: 1282, x1: 1561, y0: 642, y1: 852 },
};
/** Centro (% da largura da cena) e chão (% da altura): a base da árvore pisa a 78 % da altura da clareira. */
export const SLOTS_X = Object.fromEntries(ESTACOES_BOSQUE.map(e => [e, ((CLAREIRAS[e].x0 + CLAREIRAS[e].x1) / 2 / CENA_W) * 100])) as Record<EstacaoBosque, number>;
export const chaoY = (e: EstacaoBosque): number => ((CLAREIRAS[e].y0 + 0.78 * (CLAREIRAS[e].y1 - CLAREIRAS[e].y0)) / CENA_H) * 100;
/** A cena ocupa a altura útil inteira (panorama de ~3,3 telas em 390×844). */
export const ESCALA_CENA = 1;
export const OCUPACAO_COMPLETA = 0.9;
/** Medidas do export de cada árvore (px do sprite): caixa `H` de altura e largura/altura dos níveis 4 e 5. */
export const SPRITES: Record<EstacaoBosque, { H: number; w4: number; w5: number; h4: number; h5: number }> = {
  outono: { H: 449, w4: 275, w5: 293, h4: 353, h5: 437 },
  inverno: { H: 581, w4: 319, w5: 366, h4: 494, h5: 569 },
  primavera: { H: 563, w4: 270, w5: 303, h4: 490, h5: 551 },
  verao: { H: 678, w4: 283, w5: 327, h4: 575, h5: 666 },
};
/** px da imagem da cena por px do sprite: faz o nível 4 medir `OCUPACAO_COMPLETA` da largura da clareira. */
export const kSprite = (e: EstacaoBosque): number => (OCUPACAO_COMPLETA * (CLAREIRAS[e].x1 - CLAREIRAS[e].x0)) / SPRITES[e].w4;
/** Altura da CAIXA do sprite em % da altura útil. */
export const alturaCaixa = (e: EstacaoBosque): number => ((SPRITES[e].H * kSprite(e)) / CENA_H) * ESCALA_CENA * 100;
/** Onde as criaturas pisam (% da altura): no primeiro plano, ABAIXO do chão de qualquer clareira. */
export const CRIATURA_Y = 86;

/** D-51: os sprites andam por TODO o panorama (até 12). Escala inteira de 256²: a sua em 96, as dos outros em 64. */
export const SPRITE_PANORAMA = { own: 96, other: 64 } as const;
/** Cada uma das 3 faixas de profundidade desce isto (em % da altura): a mais funda pisa em `CRIATURA_Y`. */
export const FAIXA_Y = 2.5;

export interface GroveVisorProps {
  language: Language;
  /** Quem anda no cenário (`utils/groveWalkers.ts`: todos os membros, até 12; a sua sempre). */
  guild: Pick<GuildView, 'size' | 'members' | 'bosque'>;
  /** A criatura de quem olha (o App sabe o estágio dela). */
  mySprite: string;
  /** Nível por estação: 0 = lugar vazio, 1..5 = broto .. aperfeiçoada. */
  niveis: Record<EstacaoBosque, number>;
  reducedMotion: boolean;
  /** Nome acessível da região rolável (`guild.bosque.panorama.aria`). */
  label: string;
}

export function GroveVisor({ language, guild, mySprite, niveis, reducedMotion, label }: GroveVisorProps) {
  const t = (k: GuildKey, v?: Record<string, string | number>) => guildText(language, k, v);
  const ref = useRef<HTMLDivElement>(null);
  const arraste = useRef<{ x: number; left: number } | null>(null);
  const [borda, setBorda] = useState<{ ini: boolean; fim: boolean }>({ ini: true, fim: false });

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setBorda({ ini: el.scrollLeft <= 4, fim: el.scrollLeft >= el.scrollWidth - el.clientWidth - 4 });
  }, []);
  useEffect(() => { medir(); }, [medir]);

  /** Alvo do último salto: toques seguidos na seta somam (o rolar suave ainda não chegou) em vez de recomeçar do meio. */
  const alvo = useRef<{ left: number; ate: number } | null>(null);
  const mover = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const base = alvo.current && Date.now() < alvo.current.ate ? alvo.current.left : el.scrollLeft;
    const left = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, base + dir * el.clientWidth));
    alvo.current = { left, ate: Date.now() + (reducedMotion ? 0 : 700) };
    el.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
  };
  // Mouse: arrastar. Toque já rola sozinho (e o snap cuida do resto).
  const aoPressionar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return;
    // Tocar numa criatura é o toque dela (D-53), não o início de um arraste.
    if ((e.target as HTMLElement).closest('[data-grove-walker]')) return;
    arraste.current = { x: e.clientX, left: ref.current.scrollLeft };
    ref.current.setPointerCapture(e.pointerId);
    ref.current.dataset.dragging = 'true';
  };
  const aoArrastar = (e: PointerEvent<HTMLDivElement>) => {
    if (arraste.current && ref.current) ref.current.scrollLeft = arraste.current.left - (e.clientX - arraste.current.x);
  };
  const aoSoltar = (e: PointerEvent<HTMLDivElement>) => {
    if (!arraste.current || !ref.current) return;
    arraste.current = null;
    delete ref.current.dataset.dragging;
    if (ref.current.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="sm2-grove-pan-wrap" data-grove-panorama data-reduced-motion={reducedMotion ? 'true' : undefined}>
      <div
        ref={ref}
        className="sm2-grove-pan"
        role="region"
        aria-label={label}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onScroll={medir}
        onPointerDown={aoPressionar}
        onPointerMove={aoArrastar}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        style={{ scrollBehavior: reducedMotion ? 'auto' : 'smooth' }}
      >
        <div className="sm2-grove-pan-cena">
          <img src={PANORAMA_SRC} alt="" draggable={false} decoding="async" className="sm2-grove-pan-img" data-grove-panorama-img />
          {ESTACOES_BOSQUE.map(e => {
            const nv = niveis[e] ?? 0;
            const especie = t(`guild.plantio.especie.${ESPECIE_DA_ESTACAO[e]}` as GuildKey);
            const estacao = t(`guild.plantio.estacao.${e}` as GuildKey);
            const nome = nv > 0 ? t(`guild.bosque.nivel.${nv}` as GuildKey) : t('guild.bosque.arvore.vazia');
            const rotulo = t(`guild.bosque.nivel.${nv}` as GuildKey);
            return (
              <figure
                key={e}
                className="sm2-grove-slot"
                data-grove-slot={e}
                data-nivel={nv}
                aria-label={`${especie}, ${estacao}: ${nome}`}
                style={{ left: `${SLOTS_X[e]}%`, top: `${chaoY(e).toFixed(2)}%` }}
              >
                {nv > 0 ? (
                  <img
                    src={ARVORE_SRC[e][Math.min(5, nv)]}
                    alt=""
                    draggable={false}
                    decoding="async"
                    className={`sm2-grove-arvore${nv === 5 ? ' sm2-grove-arvore-5' : ''}`}
                    style={{ height: `${alturaCaixa(e).toFixed(2)}cqh` }}
                  />
                ) : (
                  <span className="sm2-grove-vazio" aria-hidden="true" />
                )}
                <figcaption className="sm2-grove-slot-nome" aria-hidden="true">
                  <span>{estacao}</span>
                  <b>{rotulo}</b>
                </figcaption>
              </figure>
            );
          })}
          <GroveWalkers language={language} guild={guild} mySprite={mySprite} reducedMotion={reducedMotion} sizes={SPRITE_PANORAMA} baseY={CRIATURA_Y} faixa={FAIXA_Y} mode="stand" />
        </div>
      </div>
      {!borda.ini && (
        <button type="button" className="sm2-grove-seta sm2-grove-seta-e" aria-label={t('guild.bosque.panorama.anterior')} onClick={() => mover(-1)}>
          <Icon name="chevron_left" size={32} />
        </button>
      )}
      {!borda.fim && (
        <button type="button" className="sm2-grove-seta sm2-grove-seta-d" aria-label={t('guild.bosque.panorama.proximo')} onClick={() => mover(1)}>
          <Icon name="chevron_right" size={32} />
        </button>
      )}
    </div>
  );
}
