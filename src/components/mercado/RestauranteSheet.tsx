/**
 * 🍲 A folha do RESTAURANTE do Mercado (05/11/2026). Lê o estado do contexto e cozinha pela regra PURA (`utils/restaurant.ts ›
 * applyCook`, que reconfere a recusa sobre o `prev`). Nenhuma regra nasce aqui; nenhum efeito colateral dentro do updater.
 */
import { useState } from 'react';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { BitsAmount } from '../ui/BitsAmount';
import { ElementIcon } from '../ElementBaseSlots';
import { PurchaseConfirmSheet, ShopStatus, useShopFlash } from './ShopShelf';
import { RESTAURANT_CHEF_ART } from '../../assets/soulmon/npcs';
import { MATERIALS } from '../../utils/buildingQuestsCopy';
import { essenceName } from '../../utils/essences';
import {
  applyCook, chefsOn, cookRefusal, dishesToday, extraOwned, menuOn, playerWeekday, DISHES_PER_DAY, activeMealBuff, dishById, isCombatEffect,
  type Dish,
} from '../../utils/restaurant';
import { CHEF_VOICE, COMBAT_NOTE, SUNDAY_LINE, effectText, refusalText } from '../../utils/restaurantCopy';
import type { Language } from '../../utils/i18n';

export function RestauranteSheet({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  const ctx = useGameStateOptional();
  const { flash, say } = useShopFlash();
  const [pending, setPending] = useState<Dish | null>(null);
  if (!ctx) return null;
  const { gameState, setGameState } = ctx;
  const now = Date.now();
  const weekday = playerWeekday(new Date(now), gameState.playerDayTz);
  const chefs = chefsOn(weekday);
  const menu = menuOn(weekday);
  const used = dishesToday(gameState, now);
  const buff = activeMealBuff(gameState, now);
  const buffDish = buff ? dishById(buff.dish) : undefined;

  const cook = (d: Dish) => {
    const t = Date.now();
    const refused = cookRefusal(gameState, d.id, t);
    if (refused) { say(d.id, false, refusalText(refused, isPt)); return; }
    setGameState(prev => applyCook(prev, d.id, t).state);
    say(d.id, true, isPt ? `${d.namePt} servido! Fome cheia.` : `${d.nameEn} served! Fully fed.`);
  };

  const extraLabel = (d: Dish) => d.extra.type === 'essence'
    ? essenceName(d.extra.id, isPt)
    : (() => { const m = MATERIALS.find(x => x.id === d.extra.id); return m ? `${m.icon} ${isPt ? m.namePt : m.nameEn}` : d.extra.id; })();

  return (
    <div data-restaurante data-restaurante-weekday={weekday} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section aria-label={isPt ? 'Quem cozinha hoje' : 'Cooking today'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chefs.map(c => (
          <div key={c} data-chef={c} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={RESTAURANT_CHEF_ART[c]} alt="" width={64} height={64} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>{isPt ? CHEF_VOICE[c].namePt : CHEF_VOICE[c].nameEn}</p>
              <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? CHEF_VOICE[c].linePt : CHEF_VOICE[c].lineEn}</p>
            </div>
          </div>
        ))}
        <p style={{ ...sm2Hint, margin: 0 }}>
          {weekday === 0
            ? (isPt ? SUNDAY_LINE.pt : SUNDAY_LINE.en)
            : (isPt
              ? `Snapjaw: ${CHEF_VOICE.snapjaw.daysPt} · Caldo: ${CHEF_VOICE.caldo.daysPt} · domingo os dois.`
              : `Snapjaw: ${CHEF_VOICE.snapjaw.daysEn} · Broth: ${CHEF_VOICE.caldo.daysEn} · Sunday both.`)}
        </p>
      </section>

      <ShopStatus
        flash={flash}
        language={language}
        idle={isPt
          ? `Todo prato enche a fome inteira e dá um reforço. Um reforço por vez; até ${DISHES_PER_DAY} pratos por dia. ${COMBAT_NOTE.pt}`
          : `Every dish fills hunger all the way and gives a boost. One boost at a time; up to ${DISHES_PER_DAY} dishes a day. ${COMBAT_NOTE.en}`}
      />
      <p data-restaurante-status style={{ ...sm2Hint, margin: 0 }}>
        <span className="sm2-num">{used}/{DISHES_PER_DAY}</span> {isPt ? 'pratos hoje' : 'dishes today'}
        {buff && buffDish ? (isPt
          ? ` · ativo: ${buffDish.namePt} (${effectText({ kind: buff.kind, value: buff.value }, true)}, até ${new Date(buff.until).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`
          : ` · active: ${buffDish.nameEn} (${effectText({ kind: buff.kind, value: buff.value }, false)}, until ${new Date(buff.until).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`) : null}
      </p>

      <ul data-restaurante-menu style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {menu.map(d => {
          const refused = cookRefusal(gameState, d.id, now);
          const has = extraOwned(gameState, d.extra);
          return (
            <li key={d.id} data-dish={d.id} data-dish-chef={d.chef} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', ...sm2Text }}>
              <span aria-hidden="true" style={{ lineHeight: '40px', width: 40, textAlign: 'center', flexShrink: 0 }}>{d.icon}</span>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 600 }}>{isPt ? d.namePt : d.nameEn}</span>
                <span data-dish-effect style={{ ...sm2Hint }}>{effectText(d.effect, isPt)}</span>
                <span data-dish-cost style={{ ...sm2Hint, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {Object.entries(d.foods).map(([emoji, n]) => {
                    const own = gameState.foodInventory?.[emoji] ?? 0;
                    return <span key={emoji} style={{ opacity: own >= n ? 1 : 0.55 }}>{emoji}<span className="sm2-num">{own}/{n}</span></span>;
                  })}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, opacity: has >= d.extra.qty ? 1 : 0.55 }}>
                    {d.extra.type === 'essence' && <ElementIcon id={d.extra.id} size={16} />}
                    {extraLabel(d)} <span className="sm2-num">{has}/{d.extra.qty}</span>
                  </span>
                  {isCombatEffect(d.effect) && <span>{isPt ? '· só Bits ganhos' : '· earned Bits only'}</span>}
                </span>
              </div>
              <button
                type="button"
                data-dish-cook={d.id}
                disabled={!!refused}
                title={refused ? refusalText(refused, isPt) : undefined}
                aria-label={isPt ? `Cozinhar ${d.namePt} por ${d.bits} Bits` : `Cook ${d.nameEn} for ${d.bits} Bits`}
                onClick={() => setPending(d)}
                style={{ ...sm2Button('outline', !!refused), flexShrink: 0, padding: '4px 8px', gap: 4 }}
              >
                <span>{isPt ? 'Cozinhar' : 'Cook'}</span>
                <BitsAmount value={d.bits} size={14} />
              </button>
            </li>
          );
        })}
      </ul>

      <PurchaseConfirmSheet
        open={!!pending}
        language={language}
        question={pending ? (isPt ? `Cozinhar ${pending.namePt}? ${effectText(pending.effect, true)}.` : `Cook ${pending.nameEn}? ${effectText(pending.effect, false)}.`) : ''}
        balance={gameState.gamePoints ?? 0}
        cost={pending?.bits ?? 0}
        currency="bits"
        onCancel={() => setPending(null)}
        onConfirm={() => { const d = pending; setPending(null); if (d) cook(d); }}
      />
    </div>
  );
}
