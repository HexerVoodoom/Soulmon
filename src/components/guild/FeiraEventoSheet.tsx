/**
 * A FOLHA DO EVENTO DA FEIRA (F-09/F-10, `docs/PLANO-FEIRA-CHEFE.md`): o que o clã encontra quando o Soulmon VOLTA da Missão.
 *
 *  · Chefe (`boss`)   — "Atacar" (1×/dia): o servidor re-simula e devolve o registro; a `BossFightScreen` o toca.
 *  · Desafio (`trail`) — o servidor entrega a instância, o cliente a desenha (`FeiraTrailPlay`), espera o piso de tempo e
 *    envia a solução. A porta travada (`gate`) é INFORMATIVA: nunca bloqueia a Missão.
 *  · Descanso (`rest`) — dia calmo; com `claimable`, "Colher" o agradecimento do abate (Emblemas/Bits UMA vez por recibo).
 *
 * Só AGREGADO do clã (barra do chefe, marcas) e o que é da própria pessoa. Tom caloroso, sem cobrança. Mudo.
 * Chamada e crédito são injetáveis (`api`, `onCredit`) para teste; o crédito passa por `creditFeiraOnce` (idempotente por recibo).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardPreview } from '../ui/RewardPreview';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { BossFightScreen, type BossFightMe } from './BossFightScreen';
import { FeiraTrailPlay } from './FeiraTrailPlay';
import { BossCheerPrelude } from './BossCheerPrelude';
import { ResultScreen, type ResultLedgerRow } from '../games/ResultScreen';
import { BOSS_ROSTER, bossArt, bossText } from '../../data/bossRoster';
import {
  attackGuildFeira, claimGuildFeira, doneGuildFeiraTrail, getGuildFeira, startGuildFeiraTrail, GuildError,
} from '../../utils/community';
import { FEIRA_TRAIL_MIN_MS, mapFeiraLog, type FeiraAttack, type FeiraClaim, type FeiraEvento, type FeiraSolution, type FeiraTrail, type FeiraTrailDone } from '../../utils/feira';
import { feiraText, type FeiraKey } from '../../utils/feiraCopy';
import { creditFeiraOnce, type FeiraCredit } from '../../utils/feiraCredit';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { Language } from '../../utils/i18n';

export interface FeiraApi {
  get: (id: string, tz?: PlayerDayAnchor) => Promise<FeiraEvento | null>;
  attack: (id: string, tz?: PlayerDayAnchor, taps?: number[]) => Promise<FeiraAttack | null>;
  claim: (id: string, k?: number, tz?: PlayerDayAnchor) => Promise<FeiraClaim | null>;
  start: (id: string, tz?: PlayerDayAnchor) => Promise<FeiraTrail | null>;
  done: (id: string, s: FeiraSolution, tz?: PlayerDayAnchor) => Promise<FeiraTrailDone | null>;
  sleep: (ms: number) => Promise<void>;
}

const DEFAULT_API: FeiraApi = {
  get: getGuildFeira, attack: attackGuildFeira, claim: claimGuildFeira, start: startGuildFeiraTrail, done: doneGuildFeiraTrail,
  sleep: ms => new Promise(r => setTimeout(r, ms)),
};

export interface FeiraEventoSheetProps {
  language: Language;
  saveId: string;
  tz?: PlayerDayAnchor;
  evento: FeiraEvento;
  /** O Soulmon de quem luta (a luta mostra o SEU bicho). */
  me: BossFightMe;
  onClose: () => void;
  /** Emblemas/Bits do servidor, UMA vez por recibo (o App credita pelos caminhos de sempre, fora de updater). */
  onCredit: (c: FeiraCredit) => void;
  /** O evento mudou (ataque feito, desafio cumprido, resgate colhido): a sala reflete sem reler. */
  onEvento?: (e: FeiraEvento) => void;
  api?: Partial<FeiraApi>;
  /** Teste: abre a luta direto no resultado. */
  skipReplay?: boolean;
}

type Phase = 'home' | 'cheer' | 'fight' | 'trail' | 'trailDone';
const SAFETY_MS = 250;

export function FeiraEventoSheet({ language, saveId, tz, evento: eventoIn, me, onClose, onCredit, onEvento, api: apiIn, skipReplay }: FeiraEventoSheetProps) {
  const api = { ...DEFAULT_API, ...apiIn };
  const t = (k: FeiraKey, v?: Record<string, string | number>) => feiraText(language, k, v);
  const isPt = language === 'pt-BR';
  const [evento, setEventoState] = useState<FeiraEvento>(eventoIn);
  const [phase, setPhase] = useState<Phase>('home');
  const [note, setNote] = useState<FeiraKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [attack, setAttack] = useState<FeiraAttack | null>(null);
  const [before, setBefore] = useState(100);
  const [trail, setTrail] = useState<FeiraTrail | null>(null);
  const [doneRow, setDoneRow] = useState<{ emblems: number; sap: number } | null>(null);
  const [collected, setCollected] = useState<FeiraClaim['reward'] | null>(null);
  const startedAt = useRef(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const setEvento = useCallback((e: FeiraEvento) => { setEventoState(e); onEvento?.(e); }, [onEvento]);
  const credit = useCallback((c: FeiraCredit) => creditFeiraOnce(c, onCredit), [onCredit]);

  /** Erro de rede/servidor → a frase calma (nunca culpa). */
  const bossNote = (e: unknown): FeiraKey => {
    if (e instanceof GuildError) {
      if (e.kind === 'unavailable') return 'boss.offline';
      if (e.kind === 'dailyLimit') return 'boss.today';
      if (e.status === 409) return 'boss.gone';
    }
    return 'boss.error';
  };

  /** Atacar abre a TORCIDA antes do golpe (a tela de teste, com `skipReplay`, pula); o golpe sai de `doAttack(taps)`. */
  const openCheer = () => {
    if (busy || evento.kind !== 'boss') return;
    if (skipReplay) { void doAttack(); return; }
    setNote(null); setPhase('cheer');
  };

  const doAttack = async (taps?: number[]) => {
    if (busy || evento.kind !== 'boss') return;
    setBusy(true); setNote(null);
    try {
      const a = taps && taps.some(n => n > 0) ? await api.attack(saveId, tz, taps) : await api.attack(saveId, tz);
      if (!alive.current) return;
      if (!a) { setPhase('home'); setNote('boss.gone'); return; }
      setBefore(evento.bossHpPct);
      setAttack(a);
      setEvento(a.evento ?? { ...evento, bossHpPct: a.boss.bossHpPct, canAttack: false });
      setPhase('fight');
    } catch (e) {
      if (!alive.current) return;
      setPhase('home');
      if (e instanceof GuildError && e.kind === 'dailyLimit') setEvento({ ...evento, canAttack: false });
      setNote(bossNote(e));
    } finally { if (alive.current) setBusy(false); }
  };

  const afterFight = async () => {
    const dead = attack?.boss.dead === true;
    setPhase('home');
    setAttack(null);
    if (!dead) return;
    // O chefe caiu: relê para saber se há agradecimento a colher (falha em silêncio — a sala conta o resto).
    try { const e = await api.get(saveId, tz); if (e && alive.current) setEvento(e); } catch { /* silêncio */ }
  };

  const doClaim = async () => {
    if (busy || evento.kind !== 'rest') return;
    setBusy(true); setNote(null);
    try {
      const c = await api.claim(saveId, evento.claimK ?? undefined, tz);
      if (!alive.current) return;
      if (!c) { setNote('rest.nothing'); setEvento({ ...evento, claimable: false, claimK: null }); return; }
      credit({ receipt: c.receipt, emblems: c.reward.emblems, bits: c.reward.bits, trophyId: c.reward.trophyId, essences: c.reward.essences });
      setCollected(c.reward);
      setEvento({ ...evento, claimable: false, claimK: null });
    } catch (e) {
      if (alive.current) setNote(e instanceof GuildError && e.kind === 'unavailable' ? 'boss.offline' : 'boss.error');
    } finally { if (alive.current) setBusy(false); }
  };

  const doStart = async () => {
    if (busy || evento.kind !== 'trail') return;
    setBusy(true); setNote(null);
    try {
      const tr = await api.start(saveId, tz);
      if (!alive.current) return;
      if (!tr) { setNote('boss.gone'); return; }
      startedAt.current = Date.now();
      setTrail(tr);
      setPhase('trail');
    } catch (e) {
      if (!alive.current) return;
      if (e instanceof GuildError && e.kind === 'unavailable') setNote('boss.offline');
      else if (e instanceof GuildError && e.status === 409) { setNote('trail.already'); setEvento({ ...evento, trail: { ...evento.trail, pending: false, cleared: true } }); }
      else setNote('boss.error');
    } finally { if (alive.current) setBusy(false); }
  };

  const doSubmit = async (solution: FeiraSolution) => {
    if (busy || !trail) return;
    setBusy(true); setNote(null);
    try {
      // O servidor recusa resposta mais rápida que o piso do jogo: o cliente ESPERA o que falta antes de enviar.
      const restante = FEIRA_TRAIL_MIN_MS[trail.game] - (Date.now() - startedAt.current) + SAFETY_MS;
      if (restante > 0) await api.sleep(restante);
      if (!alive.current) return;
      const r = await api.done(saveId, solution, tz);
      if (!alive.current) return;
      if (!r) { setNote('boss.gone'); return; }
      credit({ receipt: r.receipt || `feira-trilha:${trail.k}:${new Date().toISOString().slice(0, 10)}`, emblems: r.reward.emblems, bits: 0, trophyId: null });
      setDoneRow(r.reward);
      if (r.evento) setEvento(r.evento);
      else if (evento.kind === 'trail') setEvento({ ...evento, trail: { ...evento.trail, pending: false, cleared: true }, gate: null });
      setPhase('trailDone');
    } catch (e) {
      if (!alive.current) return;
      const raw = e instanceof GuildError ? (e.raw as { error?: unknown } | undefined)?.error : undefined;
      if (e instanceof GuildError && e.kind === 'unavailable') setNote('boss.offline');
      else if (e instanceof GuildError && e.kind === 'dailyLimit') setNote('trail.limit');
      else if (e instanceof GuildError && e.status === 400) setNote(raw === 'too fast' ? 'trail.slow' : 'trail.wrong');
      else if (e instanceof GuildError && e.status === 409) {
        setNote(raw === 'not started' ? 'trail.slow' : 'trail.already');
        if (raw === 'not started') { setTrail(null); setPhase('home'); }
        else if (evento.kind === 'trail') setEvento({ ...evento, trail: { ...evento.trail, pending: false, cleared: true }, gate: null });
      } else setNote('boss.error');
    } finally { if (alive.current) setBusy(false); }
  };

  // ── a torcida, antes do golpe ──
  if (phase === 'cheer' && evento.kind === 'boss') {
    return <BossCheerPrelude language={language} bossId={evento.bossId} level={evento.level} poolPct={evento.bossHpPct} me={me} busy={busy} onGo={taps => void doAttack(taps)} />;
  }

  // ── a luta ──
  if (phase === 'fight' && attack && evento.kind !== 'trail') {
    return (
      <BossFightScreen
        language={language}
        bossId={attack.boss.bossId}
        level={attack.boss.level}
        poolPctBefore={before}
        poolPctAfter={attack.boss.bossHpPct}
        myDamage={attack.dmg}
        events={mapFeiraLog(attack.log)}
        me={me}
        onDone={() => void afterFight()}
        skipReplay={skipReplay}
      />
    );
  }

  // ── o Desafio cumprido: o livro "Ganhou" ──
  if (phase === 'trailDone' && doneRow) {
    const ledger: ResultLedgerRow[] = [];
    if (doneRow.emblems > 0) ledger.push({ key: 'emblems', kind: 'honor', value: doneRow.emblems });
    if (doneRow.sap > 0) ledger.push({ key: 'sap', kind: 'node', label: t('rest.sap'), node: <span className="sm2-num" data-result-sap style={{ fontWeight: 600 }}>+{doneRow.sap}</span> });
    return (
      <ResultScreen
        language={language}
        outcome="win"
        gameName={t('trail.gameName')}
        title={t('trail.done')}
        line={t('trail.doneLine')}
        ledger={ledger}
        homeLabel={t('trail.keepGoing')}
        onHome={onClose}
        testId="feira-trail-result"
      />
    );
  }

  const entry = evento.kind === 'boss' ? BOSS_ROSTER.find(b => b.id === evento.bossId) : undefined;
  const bossName = entry ? bossText(entry, isPt).name : evento.kind === 'boss' ? evento.bossId : '';
  const title = evento.kind === 'boss' ? t('boss.title') : evento.kind === 'trail' ? t('trail.title') : t('rest.title');

  let footer: React.ReactNode = null;
  if (phase === 'home') {
    if (evento.kind === 'boss' && evento.canAttack) {
      footer = <button type="button" disabled={busy} aria-disabled={busy ? true : undefined} aria-busy={busy ? true : undefined} onClick={openCheer} style={{ ...sm2Button('primary', busy), width: '100%' }} data-feira-atacar>{busy ? t('boss.busy') : t('boss.attack')}</button>;
    } else if (evento.kind === 'trail' && evento.trail.pending && !evento.trail.cleared) {
      footer = <><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><RewardPreview mode="before" language={language} items={[{ kind: 'honor' }, { kind: 'xp' }]} /></div><button type="button" disabled={busy} aria-disabled={busy ? true : undefined} onClick={() => void doStart()} style={{ ...sm2Button('primary', busy), width: '100%' }} data-feira-comecar>{t('trail.start')}</button></>;
    } else if (evento.kind === 'rest' && evento.claimable) {
      footer = <button type="button" disabled={busy} aria-disabled={busy ? true : undefined} onClick={() => void doClaim()} style={{ ...sm2Button('primary', busy), width: '100%' }} data-feira-colher>{t('rest.claim')}</button>;
    } else {
      footer = <button type="button" onClick={onClose} style={{ ...sm2Button('outline'), width: '100%' }} data-feira-fechar>{t('sheet.close')}</button>;
    }
  }

  return (
    <ModalSheet open placement="center" onClose={onClose} language={language} title={title} maxWidth={400} footer={footer}>
      <div data-feira-evento={evento.kind} data-feira-k={evento.k}>
        {phase === 'home' && evento.kind === 'boss' && (
          <div style={{ textAlign: 'center' }}>
            {entry && <img src={bossArt(evento.bossId) ?? ''} alt="" width={96} height={96} style={{ imageRendering: 'pixelated', display: 'block', margin: '0 auto 8px' }} data-feira-chefe-arte />}
            <p style={{ ...sm2Text, margin: '0 0 4px' }} data-feira-linha>{t('boss.line', { name: bossName })}</p>
            <p style={{ ...sm2Hint, margin: '0 0 8px' }}>{t('boss.level', { level: evento.level })}</p>
            <div
              role="meter" aria-label={t('boss.pool')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(evento.bossHpPct)}
              style={{ height: 10, borderRadius: 6, background: 'var(--sm2-surface-2)', overflow: 'hidden', margin: '0 auto 8px', maxWidth: 260 }} data-feira-pool={Math.round(evento.bossHpPct)}
            >
              <div style={{ width: `${Math.round(evento.bossHpPct)}%`, height: '100%', background: 'var(--sm2-primary-fill)' }} />
            </div>
            <p style={{ ...sm2Hint, margin: 0 }}>{evento.canAttack ? t('boss.shared') : t('boss.today')}</p>
          </div>
        )}
        {phase === 'home' && evento.kind === 'trail' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...sm2Text, margin: '0 0 8px' }}>{evento.trail.pending && !evento.trail.cleared ? t('trail.line') : t('trail.already')}</p>
            {evento.gate === 'locked' && <p style={{ ...sm2Hint, margin: '0 0 8px' }} data-feira-porta>{t('trail.gate')}</p>}
            <div role="img" aria-label={t('trail.marks')} data-feira-marcas={evento.trail.marks} style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: Math.min(evento.trail.marks, 12) }, (_, i) => <span key={i} aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sm2-primary-fill)' }} />)}
            </div>
          </div>
        )}
        {phase === 'home' && evento.kind === 'rest' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...sm2Text, margin: '0 0 8px' }}>{collected ? t('rest.claimed') : evento.claimable ? t('rest.claimable') : t('rest.line')}</p>
            {collected && (
              <ul style={{ ...sm2Text, listStyle: 'none', padding: 0, margin: 0 }} data-feira-colhido>
                {collected.emblems > 0 && <li>{t('rest.emblems')} +{collected.emblems}</li>}
                {collected.bits > 0 && <li>{t('rest.bits')} +{collected.bits}</li>}
                {collected.sap > 0 && <li>{t('rest.sap')} +{collected.sap}</li>}
              </ul>
            )}
          </div>
        )}
        {phase === 'trail' && trail && <FeiraTrailPlay language={language} trail={trail} onSubmit={s => void doSubmit(s)} busy={busy} />}
        {note && <p role="status" style={{ ...sm2Hint, textAlign: 'center', margin: '10px 0 0' }} data-feira-nota={note}>{t(note)}</p>}
      </div>
    </ModalSheet>
  );
}

export default FeiraEventoSheet;
