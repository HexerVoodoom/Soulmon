/**
 * O Soulsmith (Vitra): as peças de equipamento, o nível de cada uma e o aprimoramento com MATERIAIS dos prédios (carregado `lazy`,
 * com a arte sob demanda). Decisão do dono (07/10/2026): o nível 1 vem da missão do prédio de origem; os níveis 2–5 se aprimoram aqui,
 * e a cada um a pessoa ESCOLHE entre duas opções (A = atributo do slot, B = o vizinho). A escolha é refazível com Bits GANHOS (ou
 * fragmentos). Todas as regras vêm de `utils/forge.ts` e `utils/forgeActions.ts`; a tela só mostra e chama os puros, e o mesmo
 * motivo que desabilita o botão é o que aparece em texto. Sem sorteio, sem cobrança, sem contagem que apressa.
 *
 * O bônus mostrado é HONESTO: o que as peças dão por atributo e o que vale em luta depois do teto único de 5% somado ao talento.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { sanitizeTalentPicks } from '../utils/talents';
import {
  sanitizeEquipment, applyEquip, applyUnequip, backpackHasRoom, type EquipSlot,
} from '../utils/equipment';
import { COMBAT_BONUS_CAP } from '../utils/combate/bonus';
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

/** O movimento reduzido liga o modo sem faíscas nem varredura; o selo textual fica (reduzir movimento nunca corta a pausa). */
function prefersReducedMotion(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

const SPARKS = Array.from({ length: 10 }, (_, i) => ({ dx: `${(i - 4.5) * 14}px`, dy: `${-50 - ((i * 37) % 40)}px`, delay: `${(i % 5) * 60}ms` }));

/** O que a pessoa está decidindo agora: aprimorar a peça (próximo nível) ou refazer a escolha de um nível. */
type Dialog = { mode: 'upgrade'; id: string } | { mode: 'redo'; id: string; level: number };

export default function ForgeCard({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [aviso, setAviso] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [escolha, setEscolha] = useState<ForgeChoice>('a');
  const [celebra, setCelebra] = useState<{ id: string; to: number; key: number } | null>(null);
  const pend = useRef<{ id: string; from: number } | null>(null);
  const forgeNow = ctx?.gameState.forge;
  const equipNow = ctx?.gameState.equipment;
  // A celebração só nasce quando o nível SUBIU de fato no save (upgrade confirmado), nunca ao abrir nem numa recusa.
  useEffect(() => {
    const p = pend.current;
    if (!p) return;
    const to = levelNow({ forge: forgeNow, equipment: equipNow }, p.id);
    if (to > p.from) { pend.current = null; setCelebra((c) => ({ id: p.id, to, key: (c?.key ?? 0) + 1 })); }
  }, [forgeNow, equipNow]);
  useEffect(() => {
    if (!celebra) return;
    const t = setTimeout(() => setCelebra(null), 3200);
    return () => clearTimeout(t);
  }, [celebra]);
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
    pend.current = null;
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
    if (d.mode === 'upgrade') pend.current = { id: d.id, from: levelNow(view, d.id) };
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
    const max = possui && level >= FORGE_MAX_LEVEL;
    const origem = nameOf(piece.building, lang);
    const bonusAgora = (['atk', 'def', 'spd'] as const).filter((a) => b[a] > 0).map((a) => `${attrName(a)} +${pct(b[a], isPt)}`).join(' · ');
    const custos = possui && !max ? custoTexto(piece, to) : [];
    const festa = celebra && celebra.id === piece.id ? celebra : null;
    const reduzido = festa ? prefersReducedMotion() : false;
    return (
      <li key={piece.id} className="sm2-stats-card" data-forge-celebration={festa ? '' : undefined} data-motion={festa ? (reduzido ? 'reduced' : 'full') : undefined} data-forge-piece={piece.id} data-level={level} data-owned={possui || undefined} data-equipped={equipado || undefined}
        style={{ display: 'grid', gap: 8, margin: 0, padding: 12 }}>
        {festa && !reduzido && (
          <>
            <span className="sm-forge-sweep" aria-hidden="true" data-forge-fx="sweep" />
            {SPARKS.map((sp, i) => <span key={i} className="sm-forge-spark" aria-hidden="true" data-forge-fx="spark" style={{ ['--dx' as string]: sp.dx, ['--dy' as string]: sp.dy, animationDelay: sp.delay }} />)}
          </>
        )}
        {festa && (
          <span role="status" className="sm-forge-seal sm2-num" data-forge-seal style={{ fontWeight: 500, color: 'var(--sm2-primary-ink)' }}>
            ✦ {isPt ? 'Aprimorado!' : 'Upgraded!'} <span key={festa.key} className="sm-forge-pulse" data-forge-level-pulse>{isPt ? `Nv ${festa.to}` : `Lv ${festa.to}`}</span>
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Art nome={piece.id} size={40} />
          <span style={{ flex: 1, minWidth: 120 }}>
            <b style={{ fontWeight: 500 }}>{nome}</b>
            <span className="sm2-stats-s" style={{ display: 'block' }}>{isPt ? SLOT_COPY[piece.slot].pt : SLOT_COPY[piece.slot].en}</span>
          </span>
          {equipado && (
            <span className="sm2-stats-s" data-equipped-badge style={{ fontWeight: 500, color: 'var(--sm2-primary-ink)' }}>
              <span aria-hidden="true">✓ </span>{isPt ? 'Equipado' : 'Equipped'}
            </span>
          )}
          {possui && !equipado && (
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" data-equip-btn={piece.id} onClick={() => equipar(piece.id)}
              aria-label={isPt ? `Equipar ${nome}` : `Equip ${nome}`}>{isPt ? 'Equipar' : 'Equip'}</button>
          )}
          {equipado && (
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" data-equip-unequip={piece.slot} onClick={() => tirar(piece.slot)}
              aria-label={isPt ? `Tirar ${nome} do slot` : `Take ${nome} off the slot`}>{isPt ? 'Tirar' : 'Unequip'}</button>
          )}
        </div>
        {!possui && <span className="sm2-stats-s">{isPt ? `Vem da missão de ${origem}.` : `Comes from the ${origem} mission.`}</span>}
        {possui && (
          <div data-forge-levels>
            <span className="sm2-num" data-forge-level style={{ fontWeight: 500 }}>
              {max ? `Lv ${level} · Max` : `Lv ${level} → Lv ${to}`}
            </span>
            <span className="sm2-stats-s" style={{ display: 'block' }} data-forge-bonus>
              {isPt ? 'Agora' : 'Now'}: {bonusAgora}
              {!max && <> {' · '}{isPt ? 'Próximo' : 'Next'}: +{pct(LEVEL_PCT[to - 1], isPt)} {isPt ? 'no atributo que você escolher' : 'in the attribute you pick'}</>}
            </span>
          </div>
        )}
        {possui && !max && (
          <div data-forge-upgrade={piece.id} style={{ display: 'grid', gap: 6 }}>
            <span className="sm2-stats-s" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {custos.map(({ m, n, have }) => (
                <span key={m.id} data-forge-cost={m.id} data-enough={have >= n || undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span aria-hidden="true">{m.icon}</span>{isPt ? m.namePt : m.nameEn} {have}/{n}
                </span>
              ))}
            </span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" disabled={!!recusa} data-forge-upgrade-btn={piece.id}
                onClick={() => abrir({ mode: 'upgrade', id: piece.id })}
                aria-label={isPt ? `Upgrade de ${nome} para o nível ${to}` : `Upgrade ${nome} to level ${to}`}>
                Upgrade
              </button>
              {recusa && <span className="sm2-stats-s" data-forge-why>{forgeRefusalText(recusa, isPt, level)}</span>}
            </span>
          </div>
        )}
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

  return (
    <section aria-labelledby="sm2-equip-title" data-equipment-card data-forge-card>
      <p id="sm2-equip-title" className="sm2-stats-lab" style={{ margin: '0 0 8px' }}>Soulsmith</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {FORGE_PIECES.map(linha)}
      </ul>
      {aviso && <p className="sm2-stats-s" role="status" data-equip-aviso style={{ marginTop: 10 }}>{aviso}</p>}
      {modal()}
    </section>
  );
}
