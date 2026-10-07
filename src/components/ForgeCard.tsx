/**
 * O Ferreiro (Mallo): as peças de equipamento, o nível de cada uma e o aprimoramento com MATERIAIS dos prédios (carregado `lazy`,
 * com a arte sob demanda). Decisão do dono (07/10/2026): o nível 1 vem da missão do prédio de origem; os níveis 2–5 se aprimoram aqui,
 * e a cada um a pessoa ESCOLHE entre duas opções (A = atributo do slot, B = o vizinho). A escolha é refazível com Bits GANHOS (ou
 * fragmentos). Todas as regras vêm de `utils/forge.ts` e `utils/forgeActions.ts`; a tela só mostra e chama os puros, e o mesmo
 * motivo que desabilita o botão é o que aparece em texto. Sem sorteio, sem cobrança, sem contagem que apressa.
 *
 * O bônus mostrado é HONESTO: o que as peças dão por atributo e o que vale em luta depois do teto único de 5% somado ao talento.
 */
import { useEffect, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { sanitizeTalentPicks, talentAttrBonus } from '../utils/talents';
import {
  EQUIP_SLOTS, sanitizeEquipment, equipAttrBonus, applyEquip, applyUnequip, backpackCapacity, backpackUsed, backpackHasRoom, type EquipSlot,
} from '../utils/equipment';
import { combinedAttrBonus, COMBAT_BONUS_CAP } from '../utils/combate/bonus';
import { earnedBits } from '../utils/bitsOrigin';
import { isoWeekKey } from '../utils/offerMoment';
import { playerDayKey } from '../utils/playerDay';
import { loadEquipArt } from '../utils/equipArt';
import { ATTR_COPY, SLOT_COPY, itemName } from '../utils/equipmentCopy';
import {
  ALT_ATTR, FORGE_MAX_LEVEL, FORGE_PIECES, LEVEL_PCT, PRIMARY_ATTR, REDO_FRAGMENTS, pieceBonus, pieceChoices, type ForgeChoice, type ForgePiece,
} from '../utils/forge';
import { applyRedo, applyUpgrade, levelNow, redoBitsPrice, redoRefusal, upgradeCost, upgradeRefusal, type ForgeGameState } from '../utils/forgeActions';
import { forgeRefusalText } from '../utils/forgeCopy';
import { stockOf } from '../utils/buildingQuests';
import { MATERIALS } from '../utils/buildingQuestsCopy';
import { nameOf } from './nav/BuildingQuestList';
import type { Language } from '../utils/i18n';

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
const matOf = (id: string) => MATERIALS.find((m) => m.id === id)!;

/** O que a pessoa está decidindo agora: aprimorar a peça (próximo nível) ou refazer a escolha de um nível. */
type Dialog = { mode: 'upgrade'; id: string } | { mode: 'redo'; id: string; level: number };

export default function ForgeCard({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [aviso, setAviso] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [escolha, setEscolha] = useState<ForgeChoice>('a');
  if (!ctx) return null; // sem save (demo, testes): não há o que forjar
  const isPt = language === 'pt-BR';
  const lang = language as Language;
  const { gameState, setGameState } = ctx;
  const bond = bondLevelFor(gameState.totalXP ?? 0);
  const picks = sanitizeTalentPicks(gameState.talentPicks, bond);
  const eq = sanitizeEquipment(gameState.equipment);
  const weekKey = isoWeekKey(playerDayKey(new Date(), gameState.playerDayTz));
  const view: ForgeGameState = { gamePoints: gameState.gamePoints, bitsOrigin: gameState.bitsOrigin, equipment: eq, forge: gameState.forge, buildingQuests: gameState.buildingQuests, totalXP: gameState.totalXP, talentPicks: picks, weekKey };
  const attrName = (a: 'atk' | 'def' | 'spd') => (isPt ? ATTR_COPY[a].pt : ATTR_COPY[a].en);
  const bonus = equipAttrBonus(eq, gameState.forge);
  const emLuta = combinedAttrBonus({ talent: talentAttrBonus(picks, bond), equipment: bonus });
  const somaLuta = emLuta.atk + emLuta.def + emLuta.spd;
  const linhaBonus = (['atk', 'def', 'spd'] as const).map((a) => `${attrName(a)} +${pct(bonus[a], isPt)}`).join(' · ');
  const mochilaUsada = backpackUsed(eq);
  const mochilaCap = backpackCapacity(picks);
  const vazio = eq.owned.length === 0;

  // O `prev` do updater é quem decide (footgun 6): a tela só LÊ o `view` para mostrar o motivo.
  const prevView = (prev: typeof gameState): ForgeGameState => {
    const b = bondLevelFor(prev.totalXP ?? 0);
    return { ...prev, talentPicks: sanitizeTalentPicks(prev.talentPicks, b), weekKey: isoWeekKey(playerDayKey(new Date(), prev.playerDayTz)) } as ForgeGameState;
  };
  const merge = (prev: typeof gameState, next: ForgeGameState): typeof gameState => {
    const { weekKey: _w, talentPicks: _t, ...resto } = next;
    return { ...prev, ...resto } as typeof gameState;
  };

  const abrir = (d: Dialog) => {
    setAviso(null);
    if (d.mode === 'upgrade') setEscolha('a');
    else setEscolha(pieceChoices(d.id, levelNow(view, d.id), gameState.forge)[d.level - 2] === 'a' ? 'b' : 'a');
    setDialog(d);
  };

  const confirmar = (pay?: 'bits' | 'fragments') => {
    if (!dialog) return;
    const d = dialog;
    const choice = escolha;
    setDialog(null);
    setAviso(null);
    setGameState((prev) => {
      const v = prevView(prev);
      if (d.mode === 'upgrade') {
        const r = applyUpgrade(v, d.id, choice);
        return r.ok ? merge(prev, r.state) : prev;
      }
      const r = applyRedo(v, d.id, d.level, choice, pay ?? 'bits');
      return r.ok ? merge(prev, r.state) : prev;
    });
  };

  const equipar = (id: string) => { setAviso(null); setGameState((prev) => applyEquip(prev, id)); };
  const tirar = (slot: EquipSlot) => {
    setAviso(null);
    setGameState((prev) => {
      const r = applyUnequip({ equipment: prev.equipment, talentPicks: sanitizeTalentPicks(prev.talentPicks, bondLevelFor(prev.totalXP ?? 0)) }, slot);
      return r.equipment === prev.equipment ? prev : { ...prev, equipment: r.equipment };
    });
    if (!backpackHasRoom(eq, picks)) setAviso(isPt ? 'A mochila está cheia. Equipar uma peça no lugar de outra não ocupa espaço novo.' : 'The pack is full. Equipping a piece in place of another takes no new room.');
  };

  const custoTexto = (piece: ForgePiece, to: number) => upgradeCost(piece, to).map((c) => ({ m: matOf(c.material), n: c.n, have: stockOf(gameState.buildingQuests, c.material) }));

  const linha = (piece: ForgePiece) => {
    const level = levelNow(view, piece.id);
    const possui = level > 0;
    const equipado = eq.equipped[piece.slot] === piece.id;
    const nome = itemName(piece.slot, piece.tier, isPt);
    const escolhas = pieceChoices(piece.id, level, gameState.forge);
    const b = pieceBonus(piece.id, level, escolhas);
    const recusa = possui ? upgradeRefusal(view, piece.id) : undefined;
    const to = level + 1;
    const origem = nameOf(piece.building, lang);
    return (
      <li key={piece.id} data-forge-piece={piece.id} data-level={level} data-owned={possui || undefined} data-equipped={equipado || undefined}
        style={{ display: 'grid', gap: 6, paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Art nome={piece.id} size={40} />
          <span style={{ flex: 1, minWidth: 120 }}>
            <b style={{ fontWeight: 500 }}>{nome}</b>
            {possui && <span className="sm2-num" data-forge-level> · {isPt ? `nível ${level}/${FORGE_MAX_LEVEL}` : `level ${level}/${FORGE_MAX_LEVEL}`}</span>}
            {equipado && <span className="sm2-stats-s"> · {isPt ? 'equipado' : 'equipped'}</span>}
            <span className="sm2-stats-s" style={{ display: 'block' }}>
              {possui
                ? (['atk', 'def', 'spd'] as const).filter((a) => b[a] > 0).map((a) => `${attrName(a)} +${pct(b[a], isPt)}`).join(' · ')
                : (isPt ? `Vem da missão de ${origem}.` : `Comes from the ${origem} mission.`)}
            </span>
          </span>
          {possui && !equipado && (
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" onClick={() => equipar(piece.id)}
              aria-label={isPt ? `Equipar ${nome}` : `Equip ${nome}`}>{isPt ? 'Equipar' : 'Equip'}</button>
          )}
        </div>
        {possui && level < FORGE_MAX_LEVEL && (
          <div data-forge-upgrade={piece.id} style={{ display: 'grid', gap: 4 }}>
            <span className="sm2-stats-s" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{isPt ? `Para o nível ${to}:` : `To level ${to}:`}</span>
              {custoTexto(piece, to).map(({ m, n, have }) => (
                <span key={m.id} data-forge-cost={m.id} data-enough={have >= n || undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span aria-hidden="true">{m.icon}</span>{isPt ? m.namePt : m.nameEn} {have}/{n}
                </span>
              ))}
            </span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" disabled={!!recusa} data-forge-upgrade-btn={piece.id}
                onClick={() => abrir({ mode: 'upgrade', id: piece.id })}
                aria-label={isPt ? `Aprimorar ${nome} para o nível ${to}` : `Upgrade ${nome} to level ${to}`}>
                {isPt ? 'Aprimorar' : 'Upgrade'}
              </button>
              {recusa && <span className="sm2-stats-s" data-forge-why>{forgeRefusalText(recusa, isPt, level)}</span>}
            </span>
          </div>
        )}
        {possui && level >= FORGE_MAX_LEVEL && <span className="sm2-stats-s">{isPt ? 'No nível máximo.' : 'At the top level.'}</span>}
        {possui && level >= 2 && (
          <details data-forge-choices={piece.id}>
            <summary className="sm2-stats-s" style={{ cursor: 'pointer' }}>{isPt ? 'Escolhas feitas' : 'Choices made'}</summary>
            <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'grid', gap: 6 }}>
              {escolhas.map((c, i) => {
                const lv = i + 2;
                const attr = c === 'b' ? ALT_ATTR[piece.slot] : PRIMARY_ATTR[piece.slot];
                return (
                  <li key={lv} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="sm2-stats-s" style={{ flex: 1 }}>{isPt ? `Nível ${lv}` : `Level ${lv}`}: {attrName(attr)} +{pct(LEVEL_PCT[lv - 1], isPt)}</span>
                    <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-quiet" data-forge-redo={`${piece.id}:${lv}`}
                      onClick={() => abrir({ mode: 'redo', id: piece.id, level: lv })}
                      aria-label={isPt ? `Refazer a escolha do nível ${lv} de ${nome}` : `Redo the level ${lv} choice of ${nome}`}>
                      {isPt ? 'Refazer escolha' : 'Redo choice'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </li>
    );
  };

  const modal = () => {
    if (!dialog) return null;
    const piece = FORGE_PIECES.find((p) => p.id === dialog.id)!;
    const nome = itemName(piece.slot, piece.tier, isPt);
    const alvo = dialog.mode === 'upgrade' ? levelNow(view, piece.id) + 1 : dialog.level;
    const opcoes: { c: ForgeChoice; attr: 'atk' | 'def' | 'spd' }[] = [{ c: 'a', attr: PRIMARY_ATTR[piece.slot] }, { c: 'b', attr: ALT_ATTR[piece.slot] }];
    const atual = dialog.mode === 'redo' ? pieceChoices(piece.id, levelNow(view, piece.id), gameState.forge)[dialog.level - 2] : undefined;
    const refUp = dialog.mode === 'upgrade' ? upgradeRefusal(view, piece.id) : undefined;
    const refBits = dialog.mode === 'redo' ? redoRefusal(view, piece.id, dialog.level, escolha, 'bits') : undefined;
    const refFrag = dialog.mode === 'redo' ? redoRefusal(view, piece.id, dialog.level, escolha, 'fragments') : undefined;
    const precoBits = redoBitsPrice(piece.id, picks, weekKey);
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="sm2-forge-dlg" data-forge-dialog={dialog.mode}
        style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.55)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
        <div className="sm2-stats-card" style={{ width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', margin: 0, padding: 16, display: 'grid', gap: 10 }}>
          <h3 id="sm2-forge-dlg" style={{ margin: 0, fontWeight: 500 }}>
            {dialog.mode === 'upgrade'
              ? (isPt ? `${nome}: nível ${alvo}` : `${nome}: level ${alvo}`)
              : (isPt ? `Refazer a escolha do nível ${alvo}` : `Redo the level ${alvo} choice`)}
          </h3>
          <p className="sm2-stats-s" style={{ margin: 0 }}>
            {isPt ? 'Escolha um dos dois ganhos. Os dois valem o mesmo; muda onde a peça ajuda.' : 'Pick one of two gains. Both are worth the same; it changes where the piece helps.'}
          </p>
          <div role="radiogroup" style={{ display: 'grid', gap: 8 }}>
            {opcoes.map(({ c, attr }) => (
              <label key={c} data-forge-option={c} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', border: '1px solid currentColor', borderRadius: 8, opacity: escolha === c ? 1 : 0.8 }}>
                <input type="radio" name="forge-choice" checked={escolha === c} onChange={() => setEscolha(c)} />
                <span>
                  <b style={{ fontWeight: 500 }}>{c === 'a' ? 'A' : 'B'} · {attrName(attr)} +{pct(LEVEL_PCT[alvo - 1], isPt)}</b>
                  <span className="sm2-stats-s" style={{ display: 'block' }}>
                    {c === 'a' ? (isPt ? 'O atributo do próprio slot.' : 'The slot’s own attribute.') : (isPt ? 'O atributo vizinho.' : 'The neighbouring attribute.')}
                    {atual === c ? (isPt ? ' Escolha atual.' : ' Current choice.') : ''}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="sm2-stats-s" style={{ margin: 0 }}>
            {isPt ? `Em luta, talento e equipamento juntos param em ${Math.round(COMBAT_BONUS_CAP * 100)}%.` : `In a fight, talent and equipment together stop at ${Math.round(COMBAT_BONUS_CAP * 100)}%.`}
          </p>
          {dialog.mode === 'upgrade' && (
            <>
              <span className="sm2-stats-s" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {custoTexto(piece, alvo).map(({ m, n, have }) => <span key={m.id}><span aria-hidden="true">{m.icon}</span> {isPt ? m.namePt : m.nameEn} {have}/{n}</span>)}
              </span>
              {refUp && <span className="sm2-stats-s" data-forge-why>{forgeRefusalText(refUp, isPt, alvo - 1)}</span>}
            </>
          )}
          {dialog.mode === 'redo' && (
            <p className="sm2-stats-s" style={{ margin: 0 }} data-forge-redo-note>
              {isPt ? `Refazer custa ${precoBits} Bits ganhos jogando (ou ${REDO_FRAGMENTS} fragmentos). Os materiais gastos não voltam.` : `Redoing costs ${precoBits} Bits earned by playing (or ${REDO_FRAGMENTS} fragments). The spent materials do not come back.`}
              {' '}{isPt ? `Bits ganhos: ${earnedBits(view)}. Fragmentos: ${eq.fragments}.` : `Earned Bits: ${earnedBits(view)}. Fragments: ${eq.fragments}.`}
              {(refBits && refFrag) ? ` ${forgeRefusalText(refBits, isPt)}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-quiet" data-forge-cancel onClick={() => setDialog(null)}>{isPt ? 'Cancelar' : 'Cancel'}</button>
            {dialog.mode === 'upgrade' ? (
              <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" data-forge-confirm disabled={!!refUp} onClick={() => confirmar()}>{isPt ? 'Confirmar' : 'Confirm'}</button>
            ) : (
              <>
                <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" data-forge-confirm-fragments disabled={!!refFrag} onClick={() => confirmar('fragments')}
                  aria-label={isPt ? `Refazer por ${REDO_FRAGMENTS} fragmentos` : `Redo for ${REDO_FRAGMENTS} fragments`}>
                  <Art nome="fragmento" size={16} /> {REDO_FRAGMENTS}
                </button>
                <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" data-forge-confirm disabled={!!refBits} onClick={() => confirmar('bits')}>
                  {isPt ? `Confirmar · ${precoBits} Bits` : `Confirm · ${precoBits} Bits`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const comEstoque = MATERIALS.filter((m) => stockOf(gameState.buildingQuests, m.id) > 0);

  return (
    <section className="sm2-stats-card" aria-labelledby="sm2-equip-title" data-equipment-card data-forge-card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Art nome="fragmento" size={24} />
        <p id="sm2-equip-title" className="sm2-stats-lab" style={{ margin: 0 }}>{isPt ? 'Ferreiro' : 'Blacksmith'}</p>
      </div>
      <p className="sm2-stats-s">
        {isPt
          ? 'Cada peça chega como nível 1 pela missão de um prédio. Aqui você a aprimora com os materiais que as missões dão, e a cada nível escolhe entre dois ganhos. Sem sorteio, e nada disto se compra com dinheiro.'
          : 'Each piece arrives at level 1 through a building’s mission. Here you upgrade it with the materials missions give, and at each level you choose between two gains. No draws, and none of it can be bought with money.'}
      </p>
      <p className="sm2-stats-s" data-equip-state aria-live="polite">
        {vazio
          ? (isPt ? 'Nenhuma peça ainda. A primeira vem da missão de um prédio, sem pressa.' : 'No pieces yet. The first comes from a building’s mission, no rush.')
          : (isPt ? `Bônus das peças equipadas: ${linhaBonus}.` : `Equipped pieces: ${linhaBonus}.`)}
        {!vazio && (isPt
          ? ` Em luta, com talento, vale ${pct(somaLuta, true)} no total (teto de ${Math.round(COMBAT_BONUS_CAP * 100)}%).`
          : ` In a fight, with talent, it adds up to ${pct(somaLuta, false)} in total (cap ${Math.round(COMBAT_BONUS_CAP * 100)}%).`)}
      </p>
      <div data-forge-stock>
        <p className="sm2-stats-lab" style={{ margin: '8px 0 4px' }}>{isPt ? 'Materiais' : 'Materials'}</p>
        {comEstoque.length === 0
          ? <p className="sm2-stats-s">{isPt ? 'Nenhum material ainda. Cada prédio dá um por dia, na missão dele.' : 'No materials yet. Each building gives one a day through its mission.'}</p>
          : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {comEstoque.map((m) => (
                <li key={m.id} data-material={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{m.icon}</span>
                  <span className="sm2-stats-s">{isPt ? m.namePt : m.nameEn} {stockOf(gameState.buildingQuests, m.id)}</span>
                </li>
              ))}
            </ul>
          )}
      </div>
      <p className="sm2-stats-s" data-equip-backpack>
        {isPt ? `Mochila (peças guardadas fora dos slots): ${mochilaUsada} de ${mochilaCap}.` : `Pack (pieces kept outside the slots): ${mochilaUsada} of ${mochilaCap}.`}
      </p>
      {EQUIP_SLOTS.map((slot) => {
        const eqId = eq.equipped[slot];
        const equipado = eqId ? FORGE_PIECES.find((p) => p.id === eqId) : undefined;
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
              {FORGE_PIECES.filter((p) => p.slot === slot).map(linha)}
            </ul>
          </div>
        );
      })}
      {aviso && <p className="sm2-stats-s" role="status" data-equip-aviso style={{ marginTop: 10 }}>{aviso}</p>}
      {modal()}
    </section>
  );
}
