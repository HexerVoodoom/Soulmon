/**
 * A FLAG DE ADMINISTRADOR NO CLIENTE — em memória, e só em memória.
 *
 * Quem decide é o servidor (`functions/api/_admin.js` › `verifiedAdmin`, lido
 * por `GET /api/entitlements`, ver `docs/reviews/admin-corvo/impl-notas-backend.md`).
 * Aqui só se ESPELHA a última resposta, com três regras:
 *  1. só `admin === true` (booleano literal) conta — qualquer outra coisa é false;
 *  2. NUNCA é persistida: nem no save (`GameState`), nem no localStorage. A
 *     fonte é a resposta do servidor a cada abertura; um valor forjado no
 *     aparelho não tem por onde entrar (há teste de fonte travando);
 *  3. falha de rede / sem saveId = não-admin.
 *
 * O que a flag libera é só o painel de GM (`SettingsPage`) e a adoção do
 * corvinho — tudo sobre o save LOCAL, que qualquer um já podia editar. Nenhuma
 * rota de servidor confia nela: comunidade, guilda e torneio tratam o admin
 * como jogador comum.
 */
import { useSyncExternalStore } from 'react';

let admin = false;
const listeners = new Set<() => void>();

/** Sanitização da resposta do servidor: só o booleano literal `true`. */
export function adminFromEntitlement(ent: unknown): boolean {
  return !!ent && typeof ent === 'object' && (ent as { admin?: unknown }).admin === true;
}

export function setAdminFlag(next: boolean): void {
  const v = next === true;
  if (v === admin) return;
  admin = v;
  listeners.forEach(l => l());
}

export function isAdminNow(): boolean {
  return admin;
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** O jogador desta sessão é administrador (segundo o servidor, nesta abertura)? */
export function useAdmin(): boolean {
  return useSyncExternalStore(subscribe, isAdminNow, () => false);
}
