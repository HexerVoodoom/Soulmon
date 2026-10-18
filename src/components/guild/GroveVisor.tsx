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
import { groveCreatures } from '../../utils/groveStage';
import type { GuildView } from '../../utils/community';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';

/** Onde cada lugar fica no panorama: centro em % da largura, e a base (o chão) em % da altura. */
export const SLOTS_X: Record<EstacaoBosque, number> = { outono: 14, inverno: 38, primavera: 62, verao: 86 };
const CHAO_Y = 78;
/**
 * Onde as criaturas do clã pisam: nos VÃOS entre os lugares das árvores (14/38/62/86 %), nunca embaixo de uma copa.
 * Da esquerda para a direita, na ordem de chegada da roda (`groveCreatures`); sozinha, a sua fica no centro.
 * A de 64 px da ponta esquerda cabe antes da árvore do outono (que ocupa ~6–22 %).
 */
const PALCO_X: Record<number, number[]> = { 1: [50], 2: [26, 74], 3: [26, 50, 74], 4: [3.5, 26, 50, 74] };
const ARVORE_H = 40;

export interface GroveVisorProps {
  language: Language;
  /** Quem aparece no palco (`utils/groveStage.ts`: até 4 da roda, ou só a sua). */
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
  const criaturas = groveCreatures(guild);
  const xs = PALCO_X[Math.min(4, criaturas.length)] ?? [50];
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
                style={{ left: `${SLOTS_X[e]}%`, top: `${CHAO_Y}%` }}
              >
                {nv > 0 ? (
                  <img
                    src={ARVORE_SRC[e][Math.min(5, nv)]}
                    alt=""
                    draggable={false}
                    decoding="async"
                    className={`sm2-grove-arvore${nv === 5 ? ' sm2-grove-arvore-5' : ''}`}
                    style={{ height: `${ARVORE_H}cqh` }}
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
          {criaturas.map((c, i) => (
            <img
              key={c.key}
              src={c.own ? mySprite : (c.sprite ?? undefined)}
              alt=""
              width={c.size}
              height={c.size}
              draggable={false}
              data-grove-creature={c.own ? 'own' : 'other'}
              className={reducedMotion ? 'sm2-grove-creature' : 'sm2-grove-creature sm2-grove-bob'}
              style={{
                left: `${xs[i] ?? c.x}%`,
                top: `${CHAO_Y}%`,
                width: c.size,
                height: c.size,
                // Os pés do sprite caem ~6% acima da borda inferior da caixa.
                marginTop: -Math.round(c.size * 0.94),
                marginLeft: -Math.round(c.size / 2),
                animationDelay: reducedMotion ? undefined : `${(i % 3) * 0.4}s`,
              }}
            />
          ))}
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
