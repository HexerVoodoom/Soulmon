/**
 * Combate v3 / PR8b — o equipamento do Soulmon e a vitrine, na StatsPage (carregado `lazy`, com a arte sob demanda).
 *
 * Todas as regras vêm de `utils/equipment.ts` e `utils/bitsOrigin.ts`: a tela só mostra e chama os puros. Estados: nada comprado, item
 * equipado, Bits insuficientes (neutro), Bits que vieram de Crédito (neutro, explica), fragmentos insuficientes. Local-first: a compra vale
 * na hora e o servidor saneia o campo na sincronia (slot forjado volta vazio). Sem sorteio: o preço é o preço.
 *
 * Copy (`copy.semFomo`): sem cobrança, sem contagem que apressa. "Vínculo", nunca "nível" para a criatura.
 */
import { useEffect, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { sanitizeTalentPicks } from '../utils/talents';
import {
  EQUIP_CATALOG, EQUIP_SLOTS, SLOT_ATTR, sanitizeEquipment, equipAttrBonus, equipBuyRefusal, equipPrice, applyEquipBuy, applyEquip,
  applyUnequip, backpackCapacity, backpackUsed, backpackHasRoom, weeklyDiscountItem, type EquipItem, type EquipSlot, type EquipPay,
} from '../utils/equipment';
import { earnedBits } from '../utils/bitsOrigin';
import { isoWeekKey } from '../utils/offerMoment';
import { playerDayKey } from '../utils/playerDay';
import { loadEquipArt } from '../utils/equipArt';
import { ATTR_COPY, SLOT_COPY, itemName, refusalText } from '../utils/equipmentCopy';

function useArt(nome: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    void loadEquipArt(nome).then((u) => { if (vivo) setUrl(u); });
    return () => { vivo = false; };
  }, [nome]);
  return url;
}

function Art({ nome, size }: { nome: string; size: number }) {
  const url = useArt(nome);
  if (!url) return <span aria-hidden="true" style={{ width: size, height: size, display: 'inline-block' }} />;
  return <img src={url} alt="" aria-hidden="true" draggable={false} width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} />;
}

const pct = (f: number, isPt: boolean) => `${(f * 100).toFixed(1).replace(/\.0$/, '').replace('.', isPt ? ',' : '.')}%`;

export default function EquipmentCard({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [aviso, setAviso] = useState<string | null>(null);
  if (!ctx) return null; // sem save (demo, testes): não há o que equipar
  const isPt = language === 'pt-BR';
  const { gameState, setGameState } = ctx;
  const bond = bondLevelFor(gameState.totalXP ?? 0);
  const picks = sanitizeTalentPicks(gameState.talentPicks, bond);
  const eq = sanitizeEquipment(gameState.equipment);
  const weekKey = isoWeekKey(playerDayKey(new Date(), gameState.playerDayTz));
  const view = { gamePoints: gameState.gamePoints, bitsOrigin: gameState.bitsOrigin, equipment: eq, talentPicks: picks, weekKey };
  const daSemana = picks.includes('tal-com-07') ? weeklyDiscountItem(weekKey) : null;
  const mochilaUsada = backpackUsed(eq);
  const mochilaCap = backpackCapacity(picks);
  const bonus = equipAttrBonus(eq);
  const ganhos = earnedBits(view);

  const comprar = (id: string, pay: EquipPay) => {
    setAviso(null);
    const motivo = equipBuyRefusal(view, id, pay);
    if (motivo) { setAviso(refusalText(motivo, isPt)); return; }
    setGameState((prev) => {
      const b = bondLevelFor(prev.totalXP ?? 0);
      const r = applyEquipBuy({ ...prev, talentPicks: sanitizeTalentPicks(prev.talentPicks, b), weekKey: isoWeekKey(playerDayKey(new Date(), prev.playerDayTz)) }, id, pay);
      if (!r.ok) return prev;
      const { weekKey: _w, ...resto } = r.state as typeof r.state & { weekKey?: unknown };
      return { ...resto, talentPicks: prev.talentPicks };
    });
  };
  const equipar = (id: string) => { setAviso(null); setGameState((prev) => applyEquip(prev, id)); };
  const tirar = (slot: EquipSlot) => {
    setAviso(null);
    setGameState((prev) => {
      const r = applyUnequip({ equipment: prev.equipment, talentPicks: sanitizeTalentPicks(prev.talentPicks, bondLevelFor(prev.totalXP ?? 0)) }, slot);
      return r.equipment === prev.equipment ? prev : { ...prev, equipment: r.equipment };
    });
    if (!backpackHasRoom(eq, picks)) setAviso(refusalText('backpack-full', isPt));
  };

  const linhaBonus = (['atk', 'def', 'spd'] as const).map((a) => `${isPt ? ATTR_COPY[a].pt : ATTR_COPY[a].en} +${pct(bonus[a], isPt)}`).join(' · ');
  const vazio = eq.owned.length === 0;

  const linha = (item: EquipItem) => {
    const possui = eq.owned.includes(item.id);
    const equipado = eq.equipped[item.slot] === item.id;
    const nome = itemName(item.slot, item.tier, isPt);
    const attr = isPt ? ATTR_COPY[SLOT_ATTR[item.slot]].pt : ATTR_COPY[SLOT_ATTR[item.slot]].en;
    const precoBits = equipPrice(item, 'bits', picks, weekKey);
    const dessaSemana = daSemana === item.id;
    const precoFrag = equipPrice(item, 'fragments', picks);
    return (
      <li key={item.id} data-equip-item={item.id} data-owned={possui || undefined} data-equipped={equipado || undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Art nome={item.id} size={40} />
        <span style={{ flex: 1, minWidth: 120 }}>
          <b style={{ fontWeight: 500 }}>{nome}</b>{' '}
          <span className="sm2-num">+{pct(item.pct, isPt)} {attr}</span>
          {equipado && <span className="sm2-stats-s"> · {isPt ? 'equipado' : 'equipped'}</span>}
          {dessaSemana && !possui && <span className="sm2-stats-s" data-equip-weekly> · {isPt ? 'desconto desta semana' : "this week's discount"}</span>}
        </span>
        {possui ? (
          !equipado && (
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" onClick={() => equipar(item.id)}
              aria-label={isPt ? `Equipar ${nome}` : `Equip ${nome}`}>
              {isPt ? 'Equipar' : 'Equip'}
            </button>
          )
        ) : (
          <>
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" onClick={() => comprar(item.id, 'bits')}
              aria-label={isPt ? `Comprar ${nome} por ${precoBits} Bits` : `Buy ${nome} for ${precoBits} Bits`}>
              {precoBits} Bits
            </button>
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-ghost" onClick={() => comprar(item.id, 'fragments')}
              aria-label={isPt ? `Comprar ${nome} por ${precoFrag} fragmentos` : `Buy ${nome} for ${precoFrag} fragments`}>
              <Art nome="fragmento" size={16} /> {precoFrag}
            </button>
          </>
        )}
      </li>
    );
  };

  return (
    <section className="sm2-stats-card" aria-labelledby="sm2-equip-title" data-equipment-card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Art nome="fragmento" size={24} />
        <p id="sm2-equip-title" className="sm2-stats-lab" style={{ margin: 0 }}>{isPt ? 'Equipamento' : 'Equipment'}</p>
      </div>
      <p className="sm2-stats-s" data-equip-state aria-live="polite">
        {vazio
          ? (isPt ? 'Nada equipado ainda. Escolha com calma.' : 'Nothing equipped yet. Take your time.')
          : (isPt ? `Bônus de equipamento: ${linhaBonus}.` : `Equipment bonus: ${linhaBonus}.`)}
        {' '}
        {isPt ? `Fragmentos: ${eq.fragments}. Bits ganhos: ${ganhos}.` : `Fragments: ${eq.fragments}. Earned Bits: ${ganhos}.`}
      </p>
      <p className="sm2-stats-s" data-equip-backpack>
        {isPt ? `Mochila (peças guardadas fora dos slots): ${mochilaUsada} de ${mochilaCap}.` : `Pack (pieces kept outside the slots): ${mochilaUsada} of ${mochilaCap}.`}
      </p>
      <p className="sm2-stats-s">
        {isPt
          ? 'Cada peça vale um percentual do atributo do slot. Compra-se com Bits que você ganhou jogando ou com fragmentos das runs da Masmorra: sem sorteio, e nada disto se compra com dinheiro. Somando talento e equipamento, o bônus de combate para em 5%.'
          : 'Each piece is a percentage of the slot attribute. Buy it with Bits you earned by playing or with fragments from Dungeon runs: no draws, and none of it can be bought with real money. Talent and equipment together cap combat bonus at 5%.'}
      </p>
      {EQUIP_SLOTS.map((slot) => {
        const eqId = eq.equipped[slot];
        const equipado = eqId ? EQUIP_CATALOG.find((i) => i.id === eqId) : undefined;
        return (
          <div key={slot} data-equip-slot={slot} style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Art nome={equipado ? equipado.id : `slot-${slot}`} size={32} />
              <h3 style={{ margin: 0, fontWeight: 500 }}>{isPt ? SLOT_COPY[slot].pt : SLOT_COPY[slot].en}</h3>
              <span className="sm2-stats-s">{isPt ? `(${SLOT_COPY[slot].attrPt})` : `(${SLOT_COPY[slot].attrEn})`}</span>
              {equipado && (
                <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-quiet" data-equip-unequip={slot} onClick={() => tirar(slot)}
                  aria-label={isPt ? `Tirar ${itemName(slot, equipado.tier, true)} do slot` : `Take ${itemName(slot, equipado.tier, false)} off the slot`}>
                  {isPt ? 'Tirar' : 'Take off'}
                </button>
              )}
            </div>
            {!equipado && <p className="sm2-stats-s" style={{ margin: '2px 0 6px' }}>{isPt ? 'Slot vazio.' : 'Empty slot.'}</p>}
            <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 10 }}>
              {EQUIP_CATALOG.filter((i) => i.slot === slot).map(linha)}
            </ul>
          </div>
        );
      })}
      {aviso && <p className="sm2-stats-s" role="status" data-equip-aviso style={{ marginTop: 10 }}>{aviso}</p>}
    </section>
  );
}
