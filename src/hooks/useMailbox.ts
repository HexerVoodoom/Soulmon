import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { PlayerDayAnchor } from '../utils/playerDay';
import {
  applyGrants, deletableRead, hasNewMail, hasPendingReward, isFriendInvite, isGuildInvite, markClaimed, sortMail, unclaimedInSave,
  type MailGrant, type MailItem, type MailState,
} from '../utils/mensageiro';

const api = () => import('../utils/community');

/**
 * A CAIXA DE CARTAS (§246). A lista e as decisões moram no servidor (`functions/api/_mensageiro.js`); aqui só o espelho local, o crédito no save
 * (idempotente por `mailClaimed`) e a releitura (ao abrir, ao voltar à aba e a cada 5 min). Nada é creditado sem o servidor ter entregue o prêmio.
 */
/** O que "Entrar no clã" (carta de convite, §358) deu. `gone` = código não vale mais; `alreadyIn` = já está num clã; `full` = sem vaga. */
export type GuildLetterResult = 'joined' | 'alreadyIn' | 'full' | 'gone' | 'locked' | 'error';

export function useMailbox<S extends MailState & { friends?: string[]; playerDayTz?: PlayerDayAnchor }>({ saveId, demo, getState, setState }: {
  saveId: string;
  demo: boolean;
  /** Lido só quando uma ação roda (nunca no render), então pode apontar para um ref declarado mais abaixo. */
  getState: () => S;
  setState: Dispatch<SetStateAction<S>>;
}) {
  const [mail, setMail] = useState<MailItem[]>([]);
  const stateOf = useRef(getState);
  stateOf.current = getState;

  const refresh = useCallback(async () => {
    if (demo) return;
    try {
      const { mail: raw } = await (await api()).getMail(saveId);
      const list = Array.isArray(raw) ? raw : [];
      setMail(sortMail(list));
      // O app fechou entre o resgate no servidor e o crédito no save: credita agora (`applyMail` deduplica por `mid`).
      const falta = unclaimedInSave(list, stateOf.current().mailClaimed);
      if (falta.length) setState(prev => applyGrants(prev, falta));
    } catch { /* sem rede: a caixa fica como estava */ }
  }, [saveId, demo, setState]);

  useEffect(() => {
    if (demo) return;
    let vivo = true;
    const ler = () => { if (vivo && document.visibilityState !== 'hidden') void refresh(); };
    ler();
    const t = window.setInterval(ler, 5 * 60_000);
    document.addEventListener('visibilitychange', ler);
    return () => { vivo = false; window.clearInterval(t); document.removeEventListener('visibilitychange', ler); };
  }, [refresh, demo]);

  /** Abrir uma carta a marca como lida (otimista; o servidor confirma). */
  const openLetter = useCallback((mid: string) => {
    const m = mail.find(x => x.mid === mid);
    if (!m || m.read === true || m.claimedAt) return;
    setMail(l => l.map(x => (x.mid === mid ? { ...x, read: true } : x)));
    void api().then(a => a.markMailRead(saveId, [mid])).catch(() => { void refresh(); });
  }, [mail, saveId, refresh]);

  const credit = useCallback((granted: readonly MailGrant[]) => {
    if (granted.length) setState(prev => applyGrants(prev, granted));
  }, [setState]);

  /** Resgata UMA carta. Devolve o que o servidor entregou agora (vazio se já tinha sido resgatada). Lança sem rede. */
  const claim = useCallback(async (mid: string): Promise<MailGrant[]> => {
    const { granted } = await (await api()).claimMail(saveId, [mid]);
    credit(granted);
    setMail(l => markClaimed(l, new Set([mid]), Date.now()));
    return granted;
  }, [saveId, credit]);

  /** Resgata tudo: as que tinham item viram lidas e resgatadas. Devolve o que saiu agora. */
  const claimAll = useCallback(async (): Promise<MailGrant[]> => {
    const { granted } = await (await api()).claimMail(saveId, 'all');
    credit(granted);
    setMail(l => markClaimed(l, new Set(granted.map(g => g.mid)), Date.now()));
    return granted;
  }, [saveId, credit]);

  /** Apaga uma carta. `blocked` = o servidor recusou por haver item pendente (peça confirmação e repita com `force`). */
  const remove = useCallback(async (mid: string, force = false): Promise<'removed' | 'blocked'> => {
    // Entregue pelo servidor mas ainda fora do save: credita antes de a carta sumir.
    const m = mail.find(x => x.mid === mid);
    if (m?.claimedAt && !(stateOf.current().mailClaimed ?? []).includes(mid)) credit([m]);
    const r = await (await api()).deleteMail(saveId, [mid], force);
    if (r.removed > 0) setMail(l => l.filter(x => x.mid !== mid));
    return r.blocked.length > 0 ? 'blocked' : 'removed';
  }, [saveId, mail, credit]);

  /**
   * Convite de amizade por carta (§288): Aceitar ou Recusar pelo MESMO fluxo da lista de Amigos (`friendAccept`). O servidor apaga a carta ao responder.
   * `gone` = o convite não existe mais (quem convidou cancelou): a carta sai da caixa. Lança sem rede (a carta fica).
   */
  const answerInvite = useCallback(async (m: MailItem, decline: boolean): Promise<'accepted' | 'declined' | 'gone'> => {
    if (!isFriendInvite(m)) return 'gone';
    try {
      const r = await (await api()).answerFriendInvite(saveId, m.fromPid, decline);
      if (!decline) setState(prev => ({ ...prev, friends: r.friends }));
      setMail(l => l.filter(x => x.mid !== m.mid));
      return decline ? 'declined' : 'accepted';
    } catch (e) {
      if (e instanceof Error && (e.message === 'no invite' || e.message === 'invite expired')) {
        setMail(l => l.filter(x => x.mid !== m.mid));
        void api().then(a => a.deleteMail(saveId, [m.mid], true)).catch(() => {});
        return 'gone';
      }
      throw e;
    }
  }, [saveId, setState]);

  /**
   * Convite de clã por carta (§358): "Entrar no clã" chama o MESMO `guildJoin` do "Entrar com código" do Salão, com o código da carta.
   * Entrou: o servidor tira da caixa todo convite de clã pendente. Já tem clã ou código morto: esta carta sai. Clã cheio: a carta fica.
   * Lança só sem rede (a carta fica).
   */
  const joinGuildFromLetter = useCallback(async (m: MailItem): Promise<GuildLetterResult> => {
    if (!isGuildInvite(m)) return 'gone';
    const c = await api();
    const tirar = () => {
      setMail(l => l.filter(x => x.mid !== m.mid));
      void c.deleteMail(saveId, [m.mid], true).catch(() => {});
    };
    try {
      const g = await c.joinGuild(saveId, m.guildCode, stateOf.current().playerDayTz);
      setMail(l => l.filter(x => x.kind !== 'guild-invite' && !x.mid.startsWith('ginv:')));
      if (g) void import('../utils/telemetry').then(t => t.track('guild_join', { size: Math.min(12, Math.max(2, g.size)) })).catch(() => {});
      return 'joined';
    } catch (e) {
      const kind = e instanceof c.GuildError ? e.kind : 'unavailable';
      if (kind === 'unavailable') throw e;
      if (kind === 'alreadyIn') { tirar(); return 'alreadyIn'; }
      if (kind === 'invalidCode' || kind === 'noGuild') { tirar(); return 'gone'; }
      if (kind === 'full') return 'full';
      if (kind === 'login') return 'locked';
      return 'error';
    }
  }, [saveId]);

  /** "Excluir todas lidas": só as lidas SEM item pendente. */
  const removeRead = useCallback(async (): Promise<number> => {
    const r = await (await api()).deleteMail(saveId, 'read');
    await refresh();
    return r.removed;
  }, [saveId, refresh]);

  return {
    mail,
    unread: hasNewMail(mail),
    /** Há algo que "Resgatar tudo" faria. */
    canClaimAll: mail.some(hasPendingReward),
    /** Há algo que "Excluir todas lidas" apagaria. */
    canDeleteRead: deletableRead(mail).length > 0,
    refresh, openLetter, claim, claimAll, remove, removeRead, answerInvite, joinGuildFromLetter,
  };
}
