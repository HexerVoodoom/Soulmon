import { useCallback, useId, useMemo, useState, type ReactNode } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { elementIcon } from '../utils/elementIconArt';
import { dexElementName } from './ElementDex';
import { ENEMY_ROSTER, ENEMY_ROSTER_KEYS, ENEMY_STAGES } from '../utils/enemyRoster';
import { rosterSpriteOf } from '../utils/novosSoulmon';
import { wildFoeLabel } from '../utils/wildFoeLabel';
import { STAGE_NAMES } from '../utils/oracle/base';
import { NewBadge } from './LibraryNewBadge';
import { BOSS_ROSTER, bossArt, bossText } from '../data/bossRoster';
import type { StrayPlayerSeen } from '../utils/strayPlayers';
import { elementMatchesBases, selectedBases } from '../utils/elementPotion';

/**
 * BESTIÁRIO — coleção de inimigos já vistos (M10), na aba Selvagens da Biblioteca. Uma célula por
 * (criatura × estágio): vista = arte e nome; não vista = SILHUETA sem nome. 09/11/2026 (dono, §254): UMA lista só, rookie → champion → ultimate → mega,
 * com subtítulo por estágio; o rótulo "Desgarrado" segue valendo no combate (`wildFoeLabel`, dono único em `utils/wildFoeLabel.ts`),
 * só não divide mais a lista. O número é de COLEÇÃO ("N de M"), nunca percentual nem "faltam N". Chaves
 * antigas fora do roster (baby-i, linhas aposentadas) não contam.
 */
// Nome do estágio = o do jogo (STAGE_NAMES), nunca Rookie/Champion/Ultimate/Mega (decisão do dono, 09/11/2026).
const STAGE_LABEL_KEY: Record<string, keyof typeof STAGE_NAMES> = { rookie: 'rookie', champion: 'champion', ultimate: 'perfeito', mega: 'mega', ultra: 'ultra' };

/** Estado recolhido por nível (Drive em accordion, 18/11/2026): lista dos níveis FECHADOS; sem storage, tudo aberto. */
const ACC_KEY = 'sm2.drive.fechados.v1';
function lerFechados(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(ACC_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

function Chevron() {
  return (
    <svg className="sm2-acc-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

/** Seção recolhível: cabeçalho-botão (setinha + nome + "vistos/total", sempre visível) e o corpo em `hidden` quando fechada. */
function Acordeao({ id, titulo, contagem, aberto, onToggle, children }: { id: string; titulo: string; contagem: string; aberto: boolean; onToggle: () => void; children: ReactNode }) {
  const corpo = `${useId()}-corpo`;
  return (
    <div data-bestiary-stage={id}>
      <h3 className="sm2-acc-h">
        <button type="button" className="sm2-acc-btn" aria-expanded={aberto} aria-controls={corpo} data-acc-toggle={id} onClick={onToggle}>
          <Chevron />
          <span className="sm2-acc-nome">{titulo}</span>
          <span className="sm2-acc-cont sm2-num" data-acc-count={id}>{contagem}</span>
        </button>
      </h3>
      <div id={corpo} hidden={!aberto}>{children}</div>
    </div>
  );
}

/** Bosses ainda não têm registro de "visto" no save (REGISTRO §475): `bossesSeen` vazio = todos em silhueta. */
export function BestiaryCollection({ seen, language = 'en-US', isNew, players, playersNew, bases, bossesSeen }: { seen: readonly string[] | undefined; language?: string; isNew?: ReadonlySet<string>; players?: readonly StrayPlayerSeen[]; playersNew?: ReadonlySet<string>; bases?: readonly (string | null)[]; bossesSeen?: readonly string[] }) {
  const isPt = language === 'pt-BR';
  const seenSet = useMemo(() => new Set((seen ?? []).filter(k => ENEMY_ROSTER_KEYS.has(k))), [seen]);
  // Ordem por estágio (sort estável: dentro do estágio vale a ordem do roster); a posição na lista é o número `#N`.
  const entries = useMemo(() => [...ENEMY_ROSTER].sort((a, b) => ENEMY_STAGES.indexOf(a.stage) - ENEMY_STAGES.indexOf(b.stage)), []);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [fechados, setFechados] = useState<string[]>(lerFechados);
  const alternar = useCallback((id: string) => setFechados(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    try { localStorage.setItem(ACC_KEY, JSON.stringify(next)); } catch { /* sem storage: vale só nesta visita */ }
    return next;
  }), []);
  const bossSet = useMemo(() => new Set(bossesSeen ?? []), [bossesSeen]);
  const bossVistos = BOSS_ROSTER.filter(b => bossSet.has(b.id)).length;
  const openEntry = openKey ? entries.find(e => e.key === openKey) : undefined;
  // 01/11/2026 (dono): desgarrado do roster e desgarrado de jogador (§213) são a MESMA coleção, sem distinção — os de
  // jogador entram no fim da mesma grade e somam na mesma contagem.
  const extra = players ?? [];
  const count = entries.filter(e => seenSet.has(e.key)).length + extra.length;
  // Filtro por bases do elemento : só os JÁ VISTOS que casam (silhueta não vaza elemento).
  const filtering = selectedBases(bases ?? []).length > 0;
  const shownEntries = entries.map((e, i) => ({ e, i })).filter(({ e }) => !filtering || (seenSet.has(e.key) && elementMatchesBases(e.element, bases ?? [])));
  const shownExtra = extra.map((s, i) => ({ s, i })).filter(({ s }) => !filtering || elementMatchesBases(s.element, bases ?? []));
  // Desgarrados de jogador (§213) entram no fim do último estágio (mega), como antes entravam no fim da seção Desgarrado.
  const stageGroups = ENEMY_STAGES.map((stage, k, all) => ({ stage, last: k === all.length - 1, cells: shownEntries.filter(({ e }) => e.stage === stage) }))
    .filter(g => g.cells.length > 0 || (g.last && shownExtra.length > 0));
  return (
    <section data-bestiary="all" aria-label={isPt ? 'Selvagens' : 'Wild'}>
      <p className="sm2-lib-s" style={{ margin: '0 0 8px' }}>
        <span className="sm2-num" data-bestiary-count>{count} / {entries.length + extra.length}</span>
      </p>
      {filtering && shownEntries.length + shownExtra.length === 0 && (
        <p className="sm2-lib-s" data-filter-empty style={{ textAlign: 'center', padding: '16px 0', margin: 0 }}>{isPt ? 'Nenhum Soulmon com essas bases.' : 'No Soulmon with these bases.'}</p>
      )}
      {stageGroups.map(({ stage, cells, last }) => (
        <Acordeao key={stage} id={stage} titulo={STAGE_LABEL_KEY[stage] ? STAGE_NAMES[STAGE_LABEL_KEY[stage]][isPt ? 'pt' : 'en'] : stage}
          contagem={`${entries.filter(e => e.stage === stage && seenSet.has(e.key)).length + (last ? extra.length : 0)} / ${entries.filter(e => e.stage === stage).length + (last ? extra.length : 0)}`}
          aberto={!fechados.includes(stage)} onToggle={() => alternar(stage)}>
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {cells.map(({ e, i }) => {
          const vista = seenSet.has(e.key);
          const src = rosterSpriteOf(e);
          return (
            <li key={e.key} data-bestiary-cell={e.key} data-seen={vista ? '1' : '0'} aria-label={vista ? undefined : (isPt ? 'Ainda não encontrado' : 'Not met yet')}
              style={{ display: 'flex' }}>
              {(() => {
                const inner = (
                  <>
                    {vista && isNew?.has(e.key) && <NewBadge overlay />}
                    {src && (
                      <img src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} width={48} height={48}
                        style={{ width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain', filter: vista ? undefined : 'brightness(0) opacity(0.45)' }} />
                    )}
                    <span style={{ fontSize: 10, textAlign: 'center' }}>{vista ? `#${i + 1}` : '???'}</span>
                  </>
                );
                const st = { position: 'relative' as const, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 };
                return vista ? (
                  <button type="button" data-bestiary-open={e.key} aria-label={`${e.name} (${wildFoeLabel(e.stage, isPt)} #${i + 1})`} onClick={() => setOpenKey(e.key)}
                    style={{ ...st, minHeight: 56, padding: 0, background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}>{inner}</button>
                ) : <div style={st}>{inner}</div>;
              })()}
            </li>
          );
        })}
        {last && shownExtra.map(({ s, i }) => <StrayPlayerCell key={s.sid} s={s} n={entries.length + i + 1} isPt={isPt} isNew={playersNew?.has(s.sid)} />)}
      </ul>
        </Acordeao>
      ))}
      {!filtering && (
        <Acordeao id="boss" titulo="Boss" contagem={`${bossVistos} / ${BOSS_ROSTER.length}`} aberto={!fechados.includes('boss')} onToggle={() => alternar('boss')}>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
            {BOSS_ROSTER.map(b => {
              const vista = bossSet.has(b.id);
              const src = bossArt(b.id);
              const nome = bossText(b, isPt).name;
              return (
                <li key={b.id} data-boss-cell={b.id} data-seen={vista ? '1' : '0'} aria-label={vista ? nome : (isPt ? 'Ainda não encontrado' : 'Not met yet')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {src && <img src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} width={48} height={48} style={{ width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain', filter: vista ? undefined : 'brightness(0) opacity(0.45)' }} />}
                  <span style={{ fontSize: 10, textAlign: 'center' }}>{vista ? nome : '???'}</span>
                </li>
              );
            })}
          </ul>
        </Acordeao>
      )}
      {openEntry && (
        <RitualDialog onClose={() => setOpenKey(null)} labelledBy="sm2-bestiary-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320} closeOnBackdrop>
          <h2 id="sm2-bestiary-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>{openEntry.name}</h2>
          <div data-bestiary-detail={openEntry.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {rosterSpriteOf(openEntry) && (
              <img src={rosterSpriteOf(openEntry)} alt="" aria-hidden="true" draggable={false} width={160} height={160}
                style={{ width: 160, height: 160, imageRendering: 'pixelated', objectFit: 'contain' }} />
            )}
            <p className="sm2-lib-s" data-bestiary-element={openEntry.element} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--sm2-ink)' }}>
              {elementIcon(openEntry.element) && <img src={elementIcon(openEntry.element)} alt="" aria-hidden="true" width={24} height={24} draggable={false} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
              <span>{isPt ? 'Elemento' : 'Element'}: {dexElementName(openEntry.element, isPt)}</span>
            </p>
          </div>
        </RitualDialog>
      )}
    </section>
  );
}

/**
 * Célula de um desgarrado de jogador (§213) dentro da grade de desgarrados: só os já vistos, sem nome do dono nem do bicho.
 */
function StrayPlayerCell({ s, n, isPt, isNew }: { s: StrayPlayerSeen; n: number; isPt: boolean; isNew?: boolean }) {
  return (
    <li data-stray-player-cell={s.sid} data-seen="1" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
      aria-label={`${wildFoeLabel('mega', isPt)} #${n}`}>
      {isNew && <NewBadge overlay />}
      {s.spriteUrl
        ? <img src={s.spriteUrl} alt="" aria-hidden="true" loading="lazy" draggable={false} width={48} height={48} style={{ width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain' }} />
        : (s.element && elementIcon(s.element) ? <img src={elementIcon(s.element)} alt="" aria-hidden="true" width={48} height={48} draggable={false} style={{ width: 48, height: 48, imageRendering: 'pixelated' }} /> : <span aria-hidden="true" style={{ width: 48, height: 48 }} />)}
      <span style={{ fontSize: 10, textAlign: 'center' }}>#{n}</span>
    </li>
  );
}
