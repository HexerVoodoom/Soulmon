/**
 * DREAM DEX — a coleção de Sonhos.
 *
 * O Sleep Style Dex do Soulmon: uma barra de COMPLETUDE que converte um
 * comportamento passivo e invisível (deitar no horário) numa coleta com cara
 * de Dex. Apresentação pura de `DREAM_CATALOG` — sem GameState, sem storage.
 *
 * Regra de desenho, herdada de restWindow.ts: **o Dex só cresce**. Sonho ainda
 * não coletado aparece como SILHUETA — nunca como "faltando", nunca em
 * vermelho, nunca com um contador de falta. A ausência aqui é convite, não
 * dívida: é o que faz dar vontade de voltar amanhã de manhã para ver qual
 * cena o pet trouxe.
 *
 * CANVAS PET (identidade, `docs/design/wireframes/pet/identidade/`, DECISÕES
 * §8 P1/P2 e §22 D-P7), 20/09/2026:
 *  · **Célula = slot SIS-07**: um mini-visor 64² SEM anel (`MiniGlass`,
 *    `viewport-bg`, raio-sm) com a cena 96² a 48 (0,5×) DENTRO; nome e
 *    "#NN · data" fora, em vetor. Nem mini-vidro com anel por célula (oito
 *    visores em vez de uma coleção), nem PNG solto (Home D-H6).
 *  · **Silhueta = `mask-image` do PNG** preenchida com
 *    `color-mix(viewport-bg 58%, viewport-ink)` — 3,76/3,69 sobre o vidro, sem
 *    alpha, forma limpa, o mesmo cinza nos dois temas (o vidro é sempre
 *    escuro). Era `grayscale + brightness(.35) + opacity(.6)` — alpha no
 *    aparelho (Home F1).
 *  · **Vazio (P1)**: enquanto as TRÊS raridades estão em zero, sem barra em
 *    0% e sem as frações "0 of 12 / 0 of 10 / 0 of 8"; o dígito "0 of 30 ·
 *    dreams discovered" FICA, como texto quieto (13.7/A6: posse pode mostrar
 *    zero — o que não pode é cadeado + vermelho + banner).
 *  · **"#NN · data" (P2)** na célula obtida: `#NN` = índice GLOBAL no
 *    `DREAM_CATALOG` (1–30), a data = `rest.dreamDates[id]` via
 *    `collectedAt` — `null` em save antigo → célula só com o nome (nunca
 *    data inventada). Alinhado à base da célula em toda a linha
 *    (`height:100%` + `margin-top:auto`, X6).
 *  · Contagem de COLEÇÃO: "N of 30", nunca "%", nunca "faltam N".
 *
 * ONDA 7 — a Dex saiu do fliperama (`PixelPanel` + `PixelMeter` + `PixelTag`)
 * para a superfície `--sm2-*`, com cada texto declarando a própria família.
 * As 30 cenas são sprites nossos (`utils/dreamArt.ts`); o `emoji` continua
 * no `DREAM_CATALOG` porque é o único glifo que cabe num push.
 */
import {
  DREAM_CATALOG,
  DREAMS_BY_RARITY,
  dexProgress,
  type RestState,
  type Dream,
  type DreamRarity,
} from '../utils/restWindow';
import type { Language } from '../utils/i18n';
import type { CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { MiniGlass } from './ui/MiniGlass';
import { SM2_SHADOW_CARD, sm2Hint, sm2Text } from './form/FormKit';
import { DREAM_ART } from '../utils/dreamArt';
import { collectedAt } from '../utils/collectionDates';
import { dayKeyLabel } from '../utils/dayKeyLabel';

export interface DreamDexProps {
  rest: RestState;
  language: Language;
}

const RARITY_ORDER: DreamRarity[] = ['common', 'rare', 'legendary'];

/**
 * Tinta da etiqueta de raridade — TODOS tokens `*-ink`, porque aqui a cor é
 * TEXTO (4,5:1). Nenhum `*-fill` entra: fill não é tinta.
 */
const RARITY_INK: Record<DreamRarity, string> = {
  common: 'var(--sm2-muted)',
  rare: 'var(--sm2-primary-ink)',
  legendary: 'var(--sm2-gold-ink)',
};

const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
  padding: 16,
};

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--sm2-font-display)',
  fontSize: 'var(--sm2-text-md)',
  fontWeight: 600,
  lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
  margin: 0,
};

/** A tinta da silhueta — derivada do vidro, sem alpha (D-P7). */
export const SILHOUETTE_INK = 'color-mix(in srgb, var(--sm2-viewport-bg) 58%, var(--sm2-viewport-ink))';

const cellText: CSSProperties = {
  fontFamily: 'var(--sm2-font-text)',
  /* Piso absoluto do sistema: 12px. É o NOME da cena — a única forma de
     saber o que foi coletado. */
  fontSize: 'var(--sm2-text-xs)',
  lineHeight: 1.3,
  textAlign: 'center',
  overflowWrap: 'anywhere',
};

function rarityTitle(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendários' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raros' : 'Rare';
  return isPt ? 'Comuns' : 'Common';
}

/** "#NN" — índice GLOBAL no catálogo, 1–30, sempre com dois dígitos. */
function catalogNumber(dream: Dream): string {
  return `#${String(DREAM_CATALOG.indexOf(dream) + 1).padStart(2, '0')}`;
}

function DreamCell({ dream, owned, date, isPt }: { dream: Dream; owned: boolean; date: string | null; isPt: boolean }) {
  const label = isPt ? dream.labelPt : dream.labelEn;
  const hiddenLabel = isPt ? 'Sonho ainda não descoberto' : 'Dream not discovered yet';
  const art = DREAM_ART[dream.id];
  return (
    <li
      title={owned ? label : hiddenLabel}
      aria-label={owned ? label : hiddenLabel}
      data-dream={dream.id}
      data-owned={owned ? 'true' : 'false'}
      style={{
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
        height: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      {/* A CENA num slot: mini-visor 64² sem anel, a arte 96² a 48 dentro. */}
      <MiniGlass size={64}>
        {art
          ? (owned
            ? <img src={art} alt="" width={48} height={48} style={{ display: 'block', imageRendering: 'pixelated' }} />
            : (
              /* SILHUETA, não falta: a cena existe e o pet ainda não a trouxe.
                 Máscara do próprio PNG, preenchida com uma tinta derivada do
                 vidro — a forma se lê, o objeto não. Sem alpha. */
              <span
                data-silhouette
                style={{
                  width: 48,
                  height: 48,
                  display: 'block',
                  backgroundColor: SILHOUETTE_INK,
                  WebkitMaskImage: `url(${art})`,
                  maskImage: `url(${art})`,
                  WebkitMaskSize: '48px 48px',
                  maskSize: '48px 48px',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                }}
              />
            ))
          : (owned ? <span style={{ fontSize: 22, lineHeight: 1 }}>{dream.emoji}</span> : null)}
      </MiniGlass>
      <span style={{ ...cellText, color: owned ? 'var(--sm2-ink)' : 'var(--sm2-muted)', fontWeight: owned ? 500 : 400 }}>
        {owned ? label : '???'}
      </span>
      {/* "#NN · data" só no obtido; save antigo sem data mostra só o "#NN". `nowrap`:
          medido em 390 a célula tem 71px e "#01 · Sep 12" quebrava em duas linhas.
          `margin-top: auto` alinha a linha à base da célula em toda a fileira. */}
      {owned && (
        <span className="sm2-num" data-dream-date style={{ ...cellText, color: 'var(--sm2-muted)', marginTop: 'auto', whiteSpace: 'nowrap' }}>
          {date ? `${catalogNumber(dream)} · ${dayKeyLabel(date, isPt)}` : catalogNumber(dream)}
        </span>
      )}
    </li>
  );
}

export function DreamDex({ rest, language }: DreamDexProps) {
  const isPt = language === 'pt-BR';
  const owned = new Set(rest.dreams);
  const { collected, total } = dexProgress(rest);
  const vazio = collected === 0;

  const ratio = total > 0 ? collected / total : 0;
  const counter = isPt ? `${collected} de ${total}` : `${collected} of ${total}`;
  const discovered = isPt ? 'sonhos descobertos' : 'dreams discovered';

  return (
    <section style={card} aria-labelledby="sm2-dex-title">
      <h2 id="sm2-dex-title" style={{ ...sectionTitle, marginBottom: 14 }}>
        {isPt ? 'Coleção de sonhos' : 'Dream collection'}
      </h2>

      <div style={{ marginBottom: 14 }}>
        {vazio ? (
          /* P1: no zero, o dígito como texto QUIETO — sem barra em 0%. */
          <p className="sm2-num" data-dex-count style={sm2Hint}>{`${counter} · ${discovered}`}</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              {/* `.sm2-num`: o contador MUDA, e sem tabular-nums "9 de 30" e
                  "10 de 30" têm larguras diferentes — a linha treme a cada coleta. */}
              <span
                className="sm2-num"
                data-dex-count
                style={{ ...sm2Text, fontSize: 'var(--sm2-text-md)', fontWeight: 500 }}
              >
                {counter}
              </span>
              <span style={sm2Hint}>{discovered}</span>
            </div>
            {/* O `.meter` SIS-07: 12px, trilho `surface-2` com fronteira `muted`
                (≥3:1), preenchimento `primary-fill` — objeto gráfico, nunca `*-ink`. */}
            <div
              role="progressbar"
              aria-valuenow={collected}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={isPt ? 'Completude da coleção de sonhos' : 'Dream collection completeness'}
              style={{
                height: 12,
                borderRadius: 'var(--sm2-radius-sm)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                backgroundColor: 'var(--sm2-surface-2)',
                border: '1px solid var(--sm2-muted)',
              }}
            >
              <div
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: 'var(--sm2-primary-fill)',
                  transition: 'width var(--sm2-dur-enter) var(--sm2-ease)',
                }}
              />
            </div>
          </>
        )}
        <p style={{ ...sm2Hint, margin: '8px 0 0' }}>
          {vazio
            ? (isPt
              ? 'Toda manhã depois de uma noite na sua janela, seu Soulmon volta com uma cena. A primeira está a caminho.'
              : 'Every morning after a night inside your window, your Soulmon comes back with a scene. The first one is on its way.')
            : collected === total
              ? (isPt
                ? 'Coleção completa. Seu Soulmon já sonhou com tudo que existe — e continua sonhando.'
                : 'Collection complete. Your Soulmon has dreamed everything there is — and keeps dreaming.')
              : (isPt
                ? 'As silhuetas são cenas que seu Soulmon ainda não sonhou. Elas esperam o tempo que precisarem.'
                : 'The silhouettes are scenes your Soulmon hasn’t dreamed yet. They wait as long as they need to.')}
        </p>
      </div>

      {/* Agrupado por raridade. Ordem fixa: comum → raro → lendário. */}
      {RARITY_ORDER.map((rarity) => {
        const group = DREAMS_BY_RARITY[rarity] ?? [];
        if (group.length === 0) return null;
        const got = group.filter((d) => owned.has(d.id)).length;
        return (
          <section key={rarity} data-rarity={rarity} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              {/* Um `<h3>` de verdade — a grade abaixo é uma lista, e sem heading
                  não há como pular de "Comuns" para "Lendários" com leitor de tela. */}
              <h3
                style={{
                  fontFamily: 'var(--sm2-font-display)',
                  fontSize: 'var(--sm2-text-md)',
                  fontWeight: 600,
                  lineHeight: 'var(--sm2-leading-title)',
                  color: RARITY_INK[rarity],
                  margin: 0,
                }}
              >
                {rarityTitle(rarity, isPt)}
              </h3>
              {/* As frações somem só enquanto as TRÊS raridades estão em zero
                  (guarda 1c): "Legendary 0 of 8" fica no parcial. */}
              {!vazio && (
                <span className="sm2-num" data-rarity-count style={sm2Hint}>
                  {isPt ? `${got} de ${group.length}` : `${got} of ${group.length}`}
                </span>
              )}
            </div>
            <ul
              style={{
                display: 'grid',
                /* 4 colunas fixas em 390 (achado 11): a célula é o slot 64 +
                   nome 12, e o nome quebra por `overflow-wrap: anywhere`. */
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 8,
                margin: 0,
                padding: 0,
              }}
            >
              {group.map((dream) => (
                <DreamCell
                  key={dream.id}
                  dream={dream}
                  owned={owned.has(dream.id)}
                  date={collectedAt(rest.dreamDates, dream.id)}
                  isPt={isPt}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <p style={{ ...sm2Hint, display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }}>
        <Icon name="info" size={20} tone="muted" />
        <span>
          {isPt
            ? `${DREAM_CATALOG.length} cenas no total. A coleção só cresce — nada aqui volta atrás.`
            : `${DREAM_CATALOG.length} scenes in total. The collection only grows — nothing here ever goes back.`}
        </span>
      </p>
    </section>
  );
}

export default DreamDex;
