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
import { PixelPanel, PixelMeter, PixelTag } from './pixel/PixelKit';

export interface DreamDexProps {
  rest: RestState;
  language: Language;
}

const RARITY_ORDER: DreamRarity[] = ['common', 'rare', 'legendary'];

const RARITY_TONE: Record<DreamRarity, string> = {
  common: 'color-mix(in srgb, var(--sm-px-copper) 50%, transparent)',
  rare: 'var(--sm-px-cyan)',
  legendary: 'var(--sm-px-copper)',
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
        gap: 4,
        padding: '8px 4px',
        boxSizing: 'border-box',
        background: owned ? 'var(--sm-surface)' : 'transparent',
        border: `2px solid ${owned ? RARITY_TONE[dream.rarity] : 'color-mix(in srgb, var(--sm-px-copper) 22%, transparent)'}`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 26,
          lineHeight: 1.1,
          /* Silhueta: a cena existe, o pet ainda não a trouxe. Sem cor de
             alerta — cinza esmaecido, do mesmo jeito que uma carta virada. */
          filter: owned ? 'none' : 'grayscale(1) brightness(0.55) opacity(0.45)',
        }}
      >
        {dream.emoji}
      </span>
      <span
        style={{
          fontSize: '0.62rem',
          lineHeight: 1.25,
          textAlign: 'center',
          color: owned ? 'var(--sm-ink)' : 'var(--sm-muted)',
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

  return (
    <PixelPanel title={isPt ? 'COLEÇÃO DE SONHOS' : 'DREAM COLLECTION'}>
      {/* Barra de completude — nunca barra de desempenho. */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sm-ink)' }}>
            {isPt ? `${collected} de ${total}` : `${collected} of ${total}`}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--sm-muted)' }}>
            {isPt ? 'sonhos descobertos' : 'dreams discovered'}
          </span>
        </div>
        <PixelMeter
          ratio={total > 0 ? collected / total : 0}
          tone="gold"
          label={isPt ? 'Completude da coleção de sonhos' : 'Dream collection completeness'}
        />
        <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', lineHeight: 1.45, margin: '6px 0 0' }}>
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
              <PixelTag style={{ color: rarity === 'common' ? 'var(--sm-muted)' : RARITY_TONE[rarity] }}>
                {rarityTitle(rarity, isPt)}
              </PixelTag>
              <span style={{ fontSize: '0.72rem', color: 'var(--sm-muted)' }}>
                {isPt ? `${got} de ${group.length}` : `${got} of ${group.length}`}
              </span>
            </div>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 6,
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

      <p style={{ fontSize: '0.68rem', color: 'var(--sm-muted)', margin: 0 }}>
        {isPt
          ? `${DREAM_CATALOG.length} cenas no total. A coleção só cresce — nada aqui volta atrás.`
          : `${DREAM_CATALOG.length} scenes in total. The collection only grows — nothing here ever goes back.`}
      </p>
    </PixelPanel>
  );
}

export default DreamDex;
