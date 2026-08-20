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
import { SM2_SHADOW_CARD, sm2Hint, sm2Text } from './form/FormKit';

/**
 * ONDA 7 — a Dex sai do fliperama.
 *
 * Era `PixelPanel` (moldura 9-slice de cobre) + `PixelMeter` + `PixelTag`, com
 * SESSENTA E POUCOS `<span>` sem `font-family` própria: a grade inteira
 * computava a fonte do sistema (Segoe UI na medição), lado a lado com o
 * cabeçalho em Fredoka da página do Pet. Agora é a superfície `--sm2-*`, com
 * cada texto declarando a própria família.
 *
 * ⚠️ PENDÊNCIA DE ARTE — DECLARADA, NÃO ESCONDIDA.
 * As 30 cenas continuam representadas por EMOJI DO SISTEMA (`dream.emoji`, do
 * `DREAM_CATALOG`). Isso é um placeholder: emoji é arte de terceiro, muda de
 * desenho por plataforma e não conversa com a pixel art do app. O que esta
 * onda pode fazer sem inventar arte é dar a elas a MOLDURA e a TIPOGRAFIA do
 * sistema novo e tratar o glifo como conteúdo de visor (fundo escuro, escala
 * fixa, `pointer-events: none`). A substituição por 30 sprites próprios de
 * 32×32 é trabalho de ARTE e está reportada como tal — quem for fazer troca
 * `dream.emoji` por um `<img>` aqui e em `utils/restWindow.ts`.
 */

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

function rarityTitle(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendários' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raros' : 'Rare';
  return isPt ? 'Comuns' : 'Common';
}

function DreamCell({ dream, owned, isPt }: { dream: Dream; owned: boolean; isPt: boolean }) {
  const label = isPt ? dream.labelPt : dream.labelEn;
  const hiddenLabel = isPt ? 'Sonho ainda não descoberto' : 'Dream not discovered yet';
  return (
    <li
      title={owned ? label : hiddenLabel}
      aria-label={owned ? label : hiddenLabel}
      style={{
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '8px 4px',
        boxSizing: 'border-box',
        borderRadius: 10,
        backgroundColor: owned ? 'var(--sm2-surface)' : 'var(--sm2-surface-2)',
        /* A borda é objeto GRÁFICO (3:1): coletado ganha a tinta da raridade,
           não-coletado fica na linha neutra. A ausência lê como "ainda não",
           nunca como erro — nada de vermelho, nada de tracejado de falta. */
        border: `1px solid ${owned ? RARITY_INK[dream.rarity] : 'var(--sm2-line)'}`,
      }}
    >
      {/* A CENA. Moldura de visor: interior escuro nos dois temas, como o
          `Viewport`, porque isto é conteúdo de tela do aparelho e não um chip
          de interface. O glifo é PLACEHOLDER — ver a pendência de arte no
          cabeçalho do arquivo. */}
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          boxSizing: 'border-box',
          backgroundColor: 'var(--sm2-viewport-bg)',
          border: '1px solid var(--sm2-line)',
          fontSize: 22,
          lineHeight: 1,
          pointerEvents: 'none',
          /* SILHUETA, não falta: a cena existe e o pet ainda não a trouxe.
             `brightness(0)` + opacidade devolve um recorte cheio (a forma se
             lê), em vez do cinza lavado de antes, que parecia ícone quebrado.
             O `contrast` segura o recorte dos emoji de traço fino. */
          filter: owned ? 'none' : 'grayscale(1) brightness(0.35) contrast(1.4) opacity(0.6)',
        }}
      >
        {dream.emoji}
      </span>
      <span
        style={{
          fontFamily: 'var(--sm2-font-text)',
          /* Piso absoluto do sistema: 12px. É o NOME da cena — a única forma
             de saber o que foi coletado. */
          fontSize: 'var(--sm2-text-xs)',
          lineHeight: 'var(--sm2-leading-body)',
          textAlign: 'center',
          overflowWrap: 'anywhere',
          color: owned ? 'var(--sm2-ink)' : 'var(--sm2-muted)',
        }}
      >
        {owned ? label : '???'}
      </span>
    </li>
  );
}

export function DreamDex({ rest, language }: DreamDexProps) {
  const isPt = language === 'pt-BR';
  const owned = new Set(rest.dreams);
  const { collected, total } = dexProgress(rest);

  const ratio = total > 0 ? collected / total : 0;

  return (
    <section style={card} aria-labelledby="sm2-dex-title">
      <h2 id="sm2-dex-title" style={{ ...sectionTitle, marginBottom: 14 }}>
        {isPt ? 'Coleção de sonhos' : 'Dream collection'}
      </h2>

      {/* Barra de completude — nunca barra de desempenho. */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          {/* `.sm2-num`: o contador MUDA, e sem tabular-nums "9 de 30" e
              "10 de 30" têm larguras diferentes — a linha treme a cada coleta. */}
          <span
            className="sm2-num"
            style={{ ...sm2Text, fontSize: 'var(--sm2-text-lg)', fontWeight: 600 }}
          >
            {isPt ? `${collected} de ${total}` : `${collected} of ${total}`}
          </span>
          <span style={sm2Hint}>
            {isPt ? 'sonhos descobertos' : 'dreams discovered'}
          </span>
        </div>
        {/* Trilho + preenchimento em ouro. `*-fill` no fundo (objeto gráfico,
            3:1), nunca `*-ink`. */}
        <div
          role="progressbar"
          aria-valuenow={collected}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={isPt ? 'Completude da coleção de sonhos' : 'Dream collection completeness'}
          style={{
            height: 8,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: 'var(--sm2-surface-2)',
            border: '1px solid var(--sm2-line)',
          }}
        >
          <div
            style={{
              width: `${Math.round(ratio * 100)}%`,
              height: '100%',
              backgroundColor: 'var(--sm2-gold-fill)',
              transition: 'width var(--sm2-dur-enter) var(--sm2-ease)',
            }}
          />
        </div>
        <p style={{ ...sm2Hint, margin: '6px 0 0' }}>
          {collected === 0
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
          <section key={rarity} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {/* Era `PixelTag` (Silkscreen 10px, chanfro). Agora é um `<h3>`
                  de verdade — a grade abaixo é uma lista, e sem heading não há
                  como pular de "Comuns" para "Lendários" com leitor de tela. */}
              <h3
                style={{
                  fontFamily: 'var(--sm2-font-display)',
                  fontSize: 'var(--sm2-text-sm)',
                  fontWeight: 600,
                  lineHeight: 'var(--sm2-leading-title)',
                  color: RARITY_INK[rarity],
                  margin: 0,
                }}
              >
                {rarityTitle(rarity, isPt)}
              </h3>
              <span className="sm2-num" style={sm2Hint}>
                {isPt ? `${got} de ${group.length}` : `${got} of ${group.length}`}
              </span>
            </div>
            <ul
              style={{
                display: 'grid',
                /* `auto-fill` em vez de 4 fixas: em 412px a célula de 4 colunas
                   ficava com ~88px e o nome da cena quebrava em 4 linhas. */
                gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                gap: 8,
                margin: 0,
                padding: 0,
              }}
            >
              {group.map((dream) => (
                <DreamCell key={dream.id} dream={dream} owned={owned.has(dream.id)} isPt={isPt} />
              ))}
            </ul>
          </section>
        );
      })}

      <p style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
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
