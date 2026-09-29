import { useState, type CSSProperties } from 'react';
import { PixelTabs } from '../pixel/PixelKit';
import { Icon } from '../ui/Icon';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { UnlockNudge } from '../UnlockAccountModal';
import { STALL_CURRENCIES, stallItems, type MercadoStall } from '../../utils/mercadoCatalog';
import { MISSIONS, MISSION_CATEGORIES, isMissionComplete, type MissionCategory } from '../../utils/missions';
import { SHOP_ITEMS } from '../../utils/shop';
import type { CurrencyId } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';
import { GuildOwnedShelf } from './GuildOwnedShelf';
import {
  CreditExchange, CurrencyBalance, ShopShelf, ShopStatus, useShopFlash,
  type ShopActions, type ShopOwnership,
} from './ShopShelf';

/**
 * O CONTEÚDO DAS LOJINHAS DO MERCADO (minimal-ui F5) — o que entra dentro do
 * `AreaSheet` quando se toca num lote do Mercado. Mock aprovado:
 * `product/squad-minimal-ui/propostas/loja/mock.html` (4 modais, abas por
 * moeda; Conquistas filtra por categoria).
 *
 * Não reimplementa regra: a vitrine vem de `utils/mercadoCatalog.ts`, a
 * compra de `onBuy` (→ `handleShopBuy`), a troca de `onExchangeCredits`.
 */

/** Cabeçalho fixo da folha (abas + saldo) — não rola junto da prateleira. */
const stickyHead: CSSProperties = {
  position: 'sticky', top: 0, zIndex: 1,
  display: 'flex', flexDirection: 'column', gap: 8,
  paddingBottom: 8,
  backgroundColor: 'var(--sm2-surface)',
};

function currencyLabel(c: CurrencyId, isPt: boolean): string {
  if (c === 'emblems') return isPt ? 'Emblemas' : 'Emblems';
  if (c === 'credits') return isPt ? 'Créditos' : 'Credits';
  return 'Bits';
}

/** Linha de apoio da região viva quando nada aconteceu ainda. */
function idleLine(c: CurrencyId, isPt: boolean): string {
  if (c === 'emblems') return isPt ? 'Emblemas só vêm do Torneio — e só compram cosmético.' : 'Emblems only come from the Tournament — and only buy cosmetics.';
  if (c === 'credits') return isPt ? 'Créditos viram Bits aqui. O contrário não existe.' : "Credits turn into Bits here. There's no way back.";
  return isPt ? 'Ganhe Bits nos minijogos.' : 'Earn Bits in the minigames.';
}

export interface MercadoStallProps extends ShopOwnership, ShopActions {
  stall: MercadoStall;
  language: Language;
  points: number;
  emblems: number;
  credits: number;
  onExchangeCredits: (credits: number) => Promise<boolean>;
  /** WP5.1 — o canal PASSIVO. `demo` vê o convite permanente na aba de Créditos. */
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
}

/** Uma lojinha de compra (Itens, Decoração ou Background), com abas por moeda. */
export function MercadoStallSheet(props: MercadoStallProps) {
  const { stall, language, points, emblems, credits, onExchangeCredits, accountTier, onUnlock } = props;
  const isPt = language === 'pt-BR';
  const tabs = STALL_CURRENCIES[stall];
  const [cur, setCur] = useState<CurrencyId>(tabs[0]);
  const { flash, say } = useShopFlash();
  const balance = cur === 'emblems' ? emblems : cur === 'credits' ? credits : points;

  return (
    <div data-mercado-stall={stall} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={stickyHead}>
        {tabs.length > 1 && (
          <PixelTabs
            items={tabs.map(c => ({ key: c, label: currencyLabel(c, isPt) }))}
            value={cur}
            onChange={setCur}
            ariaLabel={isPt ? 'Moeda da lojinha' : 'Stall currency'}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ShopStatus flash={flash} idle={idleLine(cur, isPt)} />
          </div>
          <CurrencyBalance currency={cur} value={balance} language={language} />
        </div>
      </div>

      {cur === 'credits' ? (
        <>
          <CreditExchange language={language} credits={credits} onExchangeCredits={onExchangeCredits} say={say} />
          {/* ─── O CONVITE PERMANENTE (WP5.1, canal PASSIVO) ───────────────
              A pessoa ENCONTRA: fora do cap semanal, não some com
              `offerDismissed`, sem ×. Mora na aba de Créditos (a do dinheiro
              real), DEPOIS do que a pessoa veio ver — nunca na de Emblemas,
              que são cosméticos por regra. */}
          {cur === 'credits' && accountTier === 'demo' && onUnlock && (
            <section data-unlock-passive style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <p style={{ ...sm2Hint, margin: 0 }}>
                {isPt
                  ? 'Sem pressa: isto fica aqui sempre que você quiser olhar.'
                  : 'No rush — this stays here whenever you want to look.'}
              </p>
              <div style={{ maxWidth: 280 }}>
                <UnlockNudge language={language} reason="shop" onOpen={onUnlock} />
              </div>
            </section>
          )}
        </>
      ) : (
        <ShopShelf
          language={language}
          items={stallItems(stall, cur)}
          currency={cur}
          balance={balance}
          ownership={props}
          actions={props}
          say={say}
          flash={flash}
        />
      )}
      {/* O que a roda deu (cenários do Bosque, Concha da Maré): só EQUIPA, sem preço.
          Vazio é silêncio — a seção nem desenha o título. */}
      {cur !== 'credits' && (stall === 'background' || stall === 'decoracao') && (
        <GuildOwnedShelf
          language={language}
          kind={stall === 'background' ? 'bg' : 'furniture'}
          ownership={props}
          actions={props}
        />
      )}
    </div>
  );
}

function categoryLabel(c: MissionCategory, isPt: boolean): string {
  switch (c) {
    case 'evolution': return isPt ? 'Evolução' : 'Evolution';
    case 'dungeon': return isPt ? 'Masmorra' : 'Dungeon';
    case 'games': return isPt ? 'Jogos' : 'Games';
    case 'constancy': return isPt ? 'Constância' : 'Consistency';
  }
}

/**
 * CONQUISTAS — as missões permanentes (`utils/missions.ts`), filtradas por
 * CATEGORIA em vez de moeda. Cada uma libera a compra de um cenário exclusivo,
 * que é comprado na lojinha de Background (aqui só se lê — não há preço nesta
 * folha, e por isso não há moeda nenhuma nela).
 *
 * WP4.12 (achado E4) vale aqui: sem progresso, NENHUM "0/N" — uma coluna de
 * zeros lê como boletim. A condição em palavras aparece sempre.
 */
export function ConquistasSheet({ language, missionProgress }: {
  language: Language;
  missionProgress: Record<string, number>;
}) {
  const isPt = language === 'pt-BR';
  const [cat, setCat] = useState<MissionCategory>(MISSION_CATEGORIES[0]);
  const list = MISSIONS.filter(m => m.category === cat);

  return (
    <div data-conquistas style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={stickyHead}>
        <PixelTabs
          items={MISSION_CATEGORIES.map(c => ({ key: c, label: categoryLabel(c, isPt) }))}
          value={cat}
          onChange={setCat}
          ariaLabel={isPt ? 'Categoria das conquistas' : 'Achievement category'}
        />
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
        {list.map(m => {
          const done = isMissionComplete(m.id, missionProgress);
          const cur = Math.min(missionProgress[m.id] ?? 0, m.target);
          const reward = SHOP_ITEMS.find(i => i.id === m.bgReward);
          const rewardName = reward ? (isPt ? reward.namePt : reward.nameEn) : null;
          return (
            <li
              key={m.id}
              data-mission={m.id}
              data-done={done || undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '8px 12px',
                boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-lg)',
                // Concluída = anel `primary-ink`; em aberto = tracejado `muted`
                // (estado por FORMA, nunca por opacidade — D-L8).
                border: done ? '1px solid var(--sm2-primary-ink)' : '1px dashed var(--sm2-muted)',
                backgroundColor: done ? 'var(--sm2-surface)' : 'transparent',
              }}
            >
              {/* Ícone PELADO (regra do dono), 24 da escala viva. */}
              <Icon name={m.iconName} size={24} fill={done ? 1 : 0} tone={done ? 'primary' : 'muted'} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ ...sm2Text, fontWeight: 500, color: done ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{isPt ? m.namePt : m.nameEn}</span>
                <span style={sm2Hint}>{isPt ? m.descPt : m.descEn}</span>
                {rewardName && (
                  <span style={sm2Hint}>
                    {done
                      ? (isPt ? `Liberou ${rewardName} — na lojinha de Background.` : `Unlocked ${rewardName} — in the Background stall.`)
                      : (isPt ? `Libera ${rewardName}.` : `Unlocks ${rewardName}.`)}
                  </span>
                )}
              </span>
              {done ? (
                <Icon name="check_circle" size={24} fill={1} tone="primary" label={isPt ? 'concluída' : 'done'} />
              ) : m.target > 1 && cur > 0 ? (
                <span className="sm2-num" style={{ ...sm2Hint, flex: 'none', whiteSpace: 'nowrap' }}>{cur}/{m.target}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
