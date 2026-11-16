/**
 * A FEIRA DE VERDADE (pedido do dono, 10/11/2026): na volta da Missão, com uma chance rara, o Soulmon encontra uma feira.
 * Um vendedor (um dos NPCs `FEIRA_LOJA_VENDORS`, cada um com a sua prateleira) vende 4 a 6 itens com 10% a 50% de desconto,
 * só em Bits e sem ingredientes. É a MESMA prateleira das lojinhas do Mercado (`ShopShelf`) e a mesma conversa de compra
 * (confirmar, saldo antes/depois); muda o vendedor e o preço.
 *
 * O servidor decide a oferta e o limite de 1 por item; o cliente só mostra. Item do Mercado: o servidor confere e devolve o preço,
 * o cliente debita pelo caminho de sempre (`onBuyShop` → `applyShopBuy`). Item da Hexsmith: a posse é do servidor, ele cobra e
 * entrega (`cloudHexFair`). Tom calmo, sem urgência. Mudo (nenhum som novo).
 */
import { useRef, useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { Bits, CurrencyBalance, PurchaseConfirmSheet, PurchaseQuestion, ShopShelf, ShopStatus, useShopFlash, type ShopOwnership } from '../mercado/ShopShelf';
import npcMercado from '../../assets/avatares/ativo-mercado.webp';
import npcAranha from '../../assets/avatares/extra-aranha-fiandeira-b.webp';
import npcColheita from '../../assets/soulmon/npcs/npc-n-colheita.png';
import npcHexsmith from '../../assets/soulmon/npcs/npc-forja-hexsmith.png';
import npcMorcego from '../../assets/avatares/cavernas-morcego-sabio-eco.webp';
import npcSalamandra from '../../assets/avatares/fogo-salamandra-cozinheira.webp';
import npcVitra from '../../assets/dominios/industrial/npcs/npc-industrial-espirito-forno-vidraceiro.png';
import npcSerpente from '../../assets/soulmon/npcs/npc-n-serpentePlumadaForma.png';
import { MATERIALS } from '../../utils/buildingQuestsCopy';
import { dishById } from '../../utils/restaurant';
import { POTION_SPECIAL_ITEMS, potionKey } from '../../utils/elementPotion';
import { feiraText, type FeiraKey } from '../../utils/feiraCopy';
import { PratoFeito } from '../PratoFeito';
import { dishKey } from '../../utils/dishItems';
import { FEIRA_LOJA_VENDOR_NAMES, applyFeiraLojaBuy, feiraLojaRef, shopItemOnOffer, type FeiraLoja, type FeiraLojaItem } from '../../utils/feiraLoja';
import { buyGuildFeiraLoja, dia, GuildError } from '../../utils/community';
import { cloudHexFair, type HexFairOutcome } from '../../utils/cloudSave';
import { HEX_SLOT_COPY, tx } from '../../utils/hexsmithCopy';
import { parseHexItem } from '../../utils/hexsmith';
import { hexValueName } from '../hex/HexsmithSheet';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { Language } from '../../utils/i18n';

export interface FeiraLojaApi {
  buy: (id: string, itemId: string, tz?: PlayerDayAnchor) => Promise<{ price: number } | null>;
  hexFair: (id: string, state: unknown, itemId: string, dayKey: string) => Promise<HexFairOutcome>;
}

const VENDOR_ART = { mercado: npcMercado, colheita: npcColheita, aranha: npcAranha, hexsmith: npcHexsmith, morcego: npcMorcego, salamandra: npcSalamandra, vitra: npcVitra, serpente: npcSerpente } as const;

const DEFAULT_API: FeiraLojaApi = { buy: buyGuildFeiraLoja, hexFair: cloudHexFair };

export interface FeiraLojaSheetProps {
  language: Language;
  saveId: string;
  tz?: PlayerDayAnchor;
  loja: FeiraLoja;
  /** Saldo de Bits agora. */
  points: number;
  ownership: ShopOwnership;
  /** O estado do save AGORA (a compra da Hexsmith sobe o estado antes de comprar, como a forja). */
  getState: () => unknown;
  /** Debita um item do Mercado ao preço da oferta (o servidor já aprovou). Devolve se passou. */
  onBuyShop: (offer: FeiraLojaItem) => boolean;
  /** O servidor entregou o item da Hexsmith: aplica no save (`paid` = ele debitou). */
  onHexBought: (itemId: string, price: number, paid: boolean) => void;
  onClose: () => void;
  api?: Partial<FeiraLojaApi>;
}

export function FeiraLojaSheet({ language, saveId, tz, loja: lojaIn, points, ownership, getState, onBuyShop, onHexBought, onClose, api: apiIn }: FeiraLojaSheetProps) {
  const api = { ...DEFAULT_API, ...apiIn };
  const isPt = language === 'pt-BR';
  const t = (k: FeiraKey, v?: Record<string, string | number>) => feiraText(language, k, v);
  const [loja, setLoja] = useState<FeiraLoja>(lojaIn);
  const { flash, say } = useShopFlash();
  const [confirmHex, setConfirmHex] = useState<FeiraLojaItem | null>(null);
  const [busyHex, setBusyHex] = useState(false);
  const [boughtDish, setBoughtDish] = useState<{ dishId: string; made: number } | null>(null);
  /** Trava de clique duplo da compra em Bits (Mercado/material/poção/prato): a 2ª chamada voltaria 409 logo depois do sucesso. */
  const busyBuy = useRef(false);
  /**
   * Confere ANTES de tocar no servidor se o app aceitaria a compra (saldo ganho, teto de material, posse). O servidor marca o item
   * como comprado na hora; recusar DEPOIS apagava a oferta sem cobrar/entregar (QA 2026-11-11, médio 1). Só passa quem o app aceita.
   */
  const appRecusa = (offer: FeiraLojaItem, price: number): FeiraKey | null => {
    const r = applyFeiraLojaBuy(getState() as Parameters<typeof applyFeiraLojaBuy>[0], { ...offer, price });
    return r.refused ? (r.refused === 'cap' ? 'loja.cap' : 'loja.noFunds') : null;
  };

  const vn = FEIRA_LOJA_VENDOR_NAMES[loja.vendor];
  const voice = { name: isPt ? vn.pt : vn.en, line: isPt ? vn.linePt : vn.lineEn };
  const markBought = (id: string) => setLoja(l => ({ ...l, items: l.items.map(i => (i.id === id ? { ...i, bought: true } : i)) }));

  const shopOffers = loja.items.filter(i => i.type === 'shop' && !i.bought);
  const shopItems = shopOffers.flatMap(o => { const it = shopItemOnOffer(o); return it ? [it] : []; });
  const discounts = Object.fromEntries(shopOffers.map(o => [o.id, { was: o.was, pct: o.pct }]));
  const hexOffers = loja.items.filter(i => i.type === 'hex');
  /** Materiais, poções e pratos prontos: linhas próprias (não são `ShopItem`). */
  const otherOffers = loja.items.filter(i => i.type === 'material' || i.type === 'potion' || i.type === 'dish');
  const allYours = loja.items.every(i => i.bought);

  const errorKey = (e: unknown): FeiraKey => {
    if (e instanceof GuildError) {
      if (e.kind === 'unavailable') return 'loja.offline';
      if (e.status === 404) return 'loja.gone';
      if (e.status === 409) return 'loja.taken';
    }
    return 'loja.error';
  };

  /** Item do Mercado: o servidor confere (oferta de hoje, 1 por item) e devolve o preço; só então o cliente debita. */
  const buyShop = async (itemId: string): Promise<boolean> => {
    const offer = loja.items.find(i => i.id === itemId && i.type === 'shop' && !i.bought);
    if (!offer) return false;
    if (busyBuy.current) return false;
    if (points < offer.price) { say(itemId, false, t('loja.noFunds')); return false; }
    const antes = appRecusa(offer, offer.price);
    if (antes) { say(itemId, false, t(antes)); return false; }
    busyBuy.current = true;
    try {
      const r = await api.buy(saveId, itemId, tz);
      if (!r) { say(itemId, false, t('loja.gone')); return false; }
      const ok = onBuyShop({ ...offer, price: r.price });
      if (ok) markBought(itemId);
      return ok;
    } catch (e) {
      say(itemId, false, t(errorKey(e)));
      return false;
    } finally {
      busyBuy.current = false;
    }
  };

  /** Item da Hexsmith: o servidor cobra só os Bits da oferta (sem poção nem fragmento) e entrega. */
  const buyHex = async (offer: FeiraLojaItem) => {
    if (busyHex) return;
    setConfirmHex(null);
    setBusyHex(true);
    const r = await api.hexFair(saveId, getState(), offer.id, dia(tz));
    setBusyHex(false);
    if (!r.ok) {
      say(offer.id, false, t(r.kind === 'offline' ? 'loja.offline' : r.kind === 'saldo' ? 'loja.noFunds' : r.kind === 'gone' ? 'loja.gone' : r.kind === 'conflict' ? 'loja.taken' : 'loja.error'));
      return;
    }
    onHexBought(offer.id, r.price || offer.price, !r.already);
    markBought(offer.id);
    say(offer.id, true, t('loja.ok', { name: hexLabel(offer) }));
  };

  const hexLabel = (o: FeiraLojaItem): string => {
    if (o.type === 'material') { const m = MATERIALS.find(x => x.id === feiraLojaRef(o.id)); return m ? `${m.icon} ${isPt ? m.namePt : m.nameEn}` : o.id; }
    if (o.type === 'dish') { const d = dishById(feiraLojaRef(o.id)); return d ? `${d.icon} ${isPt ? d.namePt : d.nameEn}` : o.id; }
    if (o.type === 'potion') { const it = POTION_SPECIAL_ITEMS[potionKey(feiraLojaRef(o.id))]; return it ? (isPt ? it.namePt : it.nameEn) : o.id; }
    const p = parseHexItem(o.id);
    return p ? `${tx(HEX_SLOT_COPY[p.slot].name, isPt)} · ${hexValueName(p.slot, p.value, isPt)}` : o.id;
  };

  /** Material, poção ou prato: o servidor confere (oferta de hoje, 1 por item) e devolve o preço; só então o cliente debita. */
  const buyOther = async (offer: FeiraLojaItem) => {
    setConfirmHex(null);
    if (busyBuy.current) return;
    const antes = appRecusa(offer, offer.price);
    if (antes) { say(offer.id, false, t(antes)); return; }
    busyBuy.current = true;
    try {
      const r = await api.buy(saveId, offer.id, tz);
      if (!r) { say(offer.id, false, t('loja.gone')); return; }
      if (!onBuyShop({ ...offer, price: r.price })) { say(offer.id, false, t('loja.noFunds')); return; }
      markBought(offer.id);
      say(offer.id, true, t('loja.ok', { name: hexLabel(offer) }));
      // Prato pronto da Feira vai para Files (16/11/2026): o mesmo modal "Prato feito", variante "Comprado!".
      if (offer.type === 'dish') setBoughtDish({ dishId: feiraLojaRef(offer.id), made: 1 });
    } catch (e) {
      say(offer.id, false, t(errorKey(e)));
    } finally {
      busyBuy.current = false;
    }
  };

  const footer = <button type="button" onClick={onClose} style={{ ...sm2Button('outline'), width: '100%' }} data-feira-loja-fechar>{isPt ? 'Fechar' : 'Close'}</button>;

  return (
    <>
    <ModalSheet open placement="center" onClose={onClose} language={language} title={t('loja.title')} maxWidth={420} footer={footer}>
      <div data-feira-loja={loja.vendor} data-feira-loja-dia={loja.day} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={VENDOR_ART[loja.vendor]} alt="" width={72} height={72} style={{ width: 72, height: 72, objectFit: 'contain', imageRendering: 'pixelated', flex: 'none' }} data-feira-loja-npc={loja.vendor} />
          <div style={{ minWidth: 0 }}>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 600 }} data-feira-loja-nome>{voice.name}</p>
            <p style={{ ...sm2Hint, margin: '2px 0 0' }}>{voice.line}</p>
          </div>
        </div>
        <p style={{ ...sm2Text, margin: 0 }}>{t('loja.line')}</p>
        <p style={{ ...sm2Hint, margin: 0 }}>{t('loja.prices')} {t('loja.keep')}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}><ShopStatus flash={flash} idle="" language={language} /></div>
          <CurrencyBalance currency="bits" value={points} language={language} />
        </div>

        {shopItems.length > 0 && (
          <ShopShelf
            language={language}
            items={shopItems}
            currency="bits"
            balance={points}
            ownership={ownership}
            actions={{ onBuy: buyShop, onEquip: () => undefined, onEquipFurniture: () => undefined }}
            say={say}
            flash={flash}
            hideDecorRule
            discounts={discounts}
          />
        )}

        {otherOffers.length > 0 && (
          <section data-feira-loja-outros style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherOffers.map(o => (
              <div key={o.id} data-feira-loja-item={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '8px 12px', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-lg)', backgroundColor: 'var(--sm2-surface)' }}>
                <span style={{ ...sm2Text, flex: 1, minWidth: 0, fontWeight: 500 }}>{hexLabel(o)}</span>
                <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={sm2Hint}>{t('loja.off', { pct: o.pct })}</span>
                  <Bits value={o.price} dim={points < o.price} />
                  <s className="sm2-num" style={sm2Hint}>{o.was}</s>
                </span>
                {o.bought
                  ? <span style={{ ...sm2Hint, flex: 'none' }}>{t('loja.bought')}</span>
                  : <button type="button" onClick={() => (points < o.price ? say(o.id, false, t('loja.noFunds')) : setConfirmHex(o))} style={{ ...sm2Button('primary'), flex: 'none' }} data-feira-loja-buy={o.id}>{t('loja.buy')}</button>}
              </div>
            ))}
          </section>
        )}

        {hexOffers.length > 0 && (
          <section data-feira-loja-hex aria-label={t('loja.hex')} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 className="sm2-title" style={{ margin: 0, fontSize: 'var(--sm2-text-md)' }}>{t('loja.hex')}</h3>
            <p style={{ ...sm2Hint, margin: 0 }}>{t('loja.hexNote')}</p>
            {hexOffers.map(o => (
              <div key={o.id} data-feira-loja-hex-item={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '8px 12px', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-lg)', backgroundColor: 'var(--sm2-surface)' }}>
                <span style={{ ...sm2Text, flex: 1, minWidth: 0, fontWeight: 500 }}>{hexLabel(o)}</span>
                <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={sm2Hint}>{t('loja.off', { pct: o.pct })}</span>
                  <Bits value={o.price} dim={points < o.price} />
                  <s className="sm2-num" style={sm2Hint}>{o.was}</s>
                </span>
                {o.bought
                  ? <span style={{ ...sm2Hint, flex: 'none' }}>{t('loja.bought')}</span>
                  : <button type="button" disabled={busyHex} aria-disabled={busyHex || undefined} onClick={() => (points < o.price ? say(o.id, false, t('loja.noFunds')) : setConfirmHex(o))} style={{ ...sm2Button('primary', busyHex), flex: 'none' }} data-feira-loja-hex-buy={o.id}>{t('loja.buy')}</button>}
              </div>
            ))}
          </section>
        )}

        {allYours && <p style={{ ...sm2Hint, textAlign: 'center', margin: 0 }} data-feira-loja-tudo>{t('loja.allYours')}</p>}
      </div>
      <PurchaseConfirmSheet
        open={!!confirmHex}
        language={language}
        question={confirmHex ? <PurchaseQuestion name={hexLabel(confirmHex)} price={confirmHex.price} currency="bits" isPt={isPt} /> : null}
        balance={points}
        cost={confirmHex?.price ?? 0}
        currency="bits"
        onCancel={() => setConfirmHex(null)}
        onConfirm={() => { if (confirmHex) void (confirmHex.type === 'hex' ? buyHex(confirmHex) : buyOther(confirmHex)); }}
      />
    </ModalSheet>
    {boughtDish && (
      <PratoFeito variant="bought" language={language} dishId={boughtDish.dishId} made={boughtDish.made} inFolder={Math.max(1, (getState() as { foodInventory?: Record<string, number> }).foodInventory?.[dishKey(boughtDish.dishId)] ?? 0)} onClose={() => setBoughtDish(null)} />
    )}
    </>
  );
}

export default FeiraLojaSheet;
