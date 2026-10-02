import type { ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import type { AreaId } from '../../navigation';
import { lotArtBounds } from '../../utils/areaLotGeometry';

/**
 * O MOLDE DE UMA ÁREA (minimal-ui F4) — reusado pelas 6 áreas do Mapa.
 *
 * Espelha `.cena-area`/`.lote` dos mocks aprovados
 * (`product/squad-minimal-ui/propostas/<area>/mock.html`): a área é uma cena
 * cheia (a `AreaTopBar` já entra pelo `App.tsx`, então aqui só o corpo); os
 * "lotes" são construções clicáveis posicionadas em % sobre o fundo.
 *
 * ⚠️ **Decisão do dono, 28/09/2026**: não existe mais NPC anfitrião fixo no
 * rodapé da cena. Cada sub-loja (lote) tem o NPC dela própria, mostrado só
 * dentro da folha que abre ao tocar o lote (`AreaSheet`) — ver
 * `assets/soulmon/npcs/index.ts` › `lotNpcArt`. A fala continua vindo de
 * `areaNpcVoice` (dono único da copy), lida agora pelo `AreaSheet`.
 *
 * `AreaScene` NÃO decide o conteúdo de cada `AreaSheet` — isso é F5. Aqui só
 * o molde: fundo + lotes + o encaixe do `AreaSheet` quando aberto.
 */
export interface AreaLot {
  id: string;
  /** Rótulo curto sobre o lote (ex.: "ITENS", "TORNEIO"). */
  label: string;
  /** Posição do CENTRO da base do lote, em % da cena. */
  left: string;
  top: string;
  /** O que o leitor de tela anuncia ao focar o botão. */
  ariaLabel: string;
  onOpen: () => void;
  /** Arte isométrica do lote (alfa real). Sem ela, o bloco neutro do molde F4. */
  art?: string;
  /** Largura do lote em % da cena (01/10/2026, H16 — o Observatório é maior que
   *  os vizinhos). Sem ela, o padrão do molde, `LOT_WIDTH_DEFAULT`. */
  width?: string;
}

/** Largura padrão de um lote, em % da cena (o molde F4). */
export const LOT_WIDTH_DEFAULT = '38%';

export function AreaScene({ areaId, language, lots, background, children }: {
  areaId: AreaId;
  language: Language;
  lots: AreaLot[];
  /** Fundo pintado da área (9:16, `cover` centrado na TELA inteira — minimal-ui F5). Sem ele,
   *  o degradê de tokens do molde F4. */
  background?: string;
  /** O `AreaSheet` aberto, se houver — filho para ficar no mesmo empilhamento da cena. */
  children?: ReactNode;
}) {
  const isPt = language === 'pt-BR';
  return (
    <div
      data-area-scene={areaId}
      style={{
        /* FUNDO FULL SCREEN (pedido do dono, 29/09/2026): a cena é `fixed` a `inset: 0` — cobre a tela
           INTEIRA, por trás do topo (safe-area + `AreaTopBar`) e do rodapé, de borda a borda. O `<main>`
           tem z-index e fica acima do fundo do app, e `fixed` não é cortado pelo `overflow` dele. Como a
           cena agora É a viewport, os lotes (`left`/`top` em %) e o `cover` centrado do fundo usam a MESMA
           caixa, então a correspondência lote↔clareira se mantém em qualquer proporção de tela. O topo
           da área (`AreaTopBar overScene`) sobe para z-2 e fica sobre a arte; a folha (z-20) cobre a cena
           inteira. Nada rola: o `<main>` só carrega a barra do topo. */
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        // Sem arte de fundo própria ainda (F5/backlog de créditos, ver
        // `docs/design/minimal-ui/BACKLOG-CREDITOS.md`): um degradê dos
        // tokens da própria área faz as vezes de cena até a arte chegar —
        // nunca uma cor inventada fora de `--sm2-*`.
        background: background
          ? `url(${background}) center / cover no-repeat, var(--sm2-bg)`
          : 'radial-gradient(circle at 50% 20%, var(--sm2-surface-2), var(--sm2-bg) 75%)',
      }}
    >
      {/* Os "lotes" — construções clicáveis, uma delas prova o molde (F4); o
          conteúdo completo por área é F5. */}
      {lots.map(lot => (
        <button
          key={lot.id}
          type="button"
          data-area-lot={lot.id}
          onClick={lot.onOpen}
          aria-label={lot.ariaLabel}
          style={{
            position: 'absolute',
            left: lot.left, top: lot.top,
            transform: 'translate(-50%, -80%)',
            width: lot.width ?? LOT_WIDTH_DEFAULT,
            minWidth: 120,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            // H11 (02/10/2026): a caixa do botão (quadrado inteiro, com alfa) NÃO recebe toque —
            // só o que é opaco no sprite (`data-area-lot-hit`) e o rótulo. Sem isso, o alfa de um
            // prédio grande roubava o toque do vizinho (Observatório × Árvore da Evolução).
            pointerEvents: 'none',
          }}
        >
          {lot.art ? (
            <span style={{ position: 'relative', width: '100%', display: 'block' }}>
              <img
                src={lot.art}
                alt=""
                aria-hidden="true"
                data-area-lot-art
                style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.55))' }}
              />
              {(() => {
                const b = lotArtBounds(areaId, lot.id) ?? [0, 0, 1, 1];
                return (
                  <span
                    aria-hidden="true"
                    data-area-lot-hit
                    style={{
                      position: 'absolute', pointerEvents: 'auto', cursor: 'pointer',
                      left: `${b[0] * 100}%`, top: `${b[1] * 100}%`,
                      width: `${(b[2] - b[0]) * 100}%`, height: `${(b[3] - b[1]) * 100}%`,
                    }}
                  />
                );
              })()}
            </span>
          ) : <span
            aria-hidden="true"
            style={{
              width: '100%', aspectRatio: '1 / 1', pointerEvents: 'auto',
              borderRadius: 'var(--sm2-radius-md)',
              border: '2px solid var(--sm2-line)',
              background: 'var(--sm2-surface)',
              boxShadow: '0 6px 6px rgba(0,0,0,.35)',
            }}
          />}
          <span
            data-area-lot-label
            style={{
              marginTop: -4, pointerEvents: 'auto',
              padding: '2px 9px',
              borderRadius: 999,
              background: 'rgba(8,25,26,.85)',
              border: '1px solid rgba(95,243,224,.35)',
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-xs)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#E9F5F2',
              textAlign: 'center',
            }}
          >
            {lot.label}
          </span>
        </button>
      ))}

      {lots.length === 0 && (
        <p
          style={{
            position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
            width: '80%', textAlign: 'center',
            color: 'var(--sm2-muted, var(--sm2-ink))', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
          }}
        >
          {isPt ? 'Em breve, mais coisas por aqui.' : 'More things coming here soon.'}
        </p>
      )}

      {children}
    </div>
  );
}
