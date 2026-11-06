import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  applyGrants, deletableRead, hasNewMail, markClaimed, sortMail, unclaimedInSave,
  type MailGrant, type MailItem, type MailState,
} from '../utils/mensageiro';

const api = () => import('../utils/community');

/**
 * A CAIXA DE CARTAS (§245). A lista e as decisões moram no servidor (`functions/api/_mensageiro.js`); aqui só o espelho local, o crédito no save
 * (idempotente por `mailClaimed`) e a releitura (ao abrir, ao voltar à aba e a cada 5 min). Nada é creditado sem o servidor ter entregue o prêmio.
 */
export function useMailbox<S extends MailState>({ saveId, demo, getState, setState }: {
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
    canClaimAll: mail.some(m => (m.bits > 0 || m.emblems > 0) && !m.claimedAt),
    /** Há algo que "Excluir todas lidas" apagaria. */
    canDeleteRead: deletableRead(mail).length > 0,
    refresh, openLetter, claim, claimAll, remove, removeRead,
  };
}
