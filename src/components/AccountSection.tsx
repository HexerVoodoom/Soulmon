import { useState, useEffect } from 'react';
import { sm2Button, sm2Hint } from './form/FormKit';
import { Icon } from './ui/Icon';
import { CREDIT_COLOR } from '../utils/currencies';
import type { Language } from '../utils/i18n';
import { fetchEntitlement, type Entitlement } from '../utils/entitlements';
import { isBillingAvailable, restorePurchases } from '../utils/playBilling';
import { isAuthConfigured, getCurrentEmail, signOut } from '../utils/auth';

/**
 * Conta & compras. Vive DENTRO do grupo "Sua conta" da `SettingsPage`, então
 * não repete título nenhum (régua nº 4: rótulo que repete o que já está dito
 * acima é rótulo a menos).
 *
 * Saíram: `.sm-px-card`, `.sm-px-row-btn`, `.sm-px-section-title`, os 4 PNGs
 * de ícone e o vermelho cravado `#e0483e` — cor de alerta escrita à mão numa
 * ação que não é destrutiva. "Sair da conta" é uma ação comum.
 *
 * "Restaurar compras" NÃO é opcional: a Play exige restauração para compras
 * não consumíveis, e sem isso quem reinstala perde o que pagou.
 */
interface AccountSectionProps {
  language: Language;
  /** Chamado quando a restauração muda tier/saldo, para a UI principal atualizar. */
  onEntitlementChange?: (ent: Entitlement) => void;
}

export function AccountSection({ language, onEntitlementChange }: AccountSectionProps) {
  const isPt = language === 'pt-BR';

  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  /* A resposta da região viva: a boa em `ink` 500, as outras em `muted` 12 —
     nenhuma em vermelho (canvas Conta D-K7). */
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEntitlement().then(e => { if (!cancelled) setEnt(e); });
    getCurrentEmail().then(e => { if (!cancelled) setAuthEmail(e); });
    return () => { cancelled = true; };
  }, []);

  const flash = (text: string, ok = false) => { setMessage({ text, ok }); setTimeout(() => setMessage(null), 4000); };

  const handleRestore = async () => {
    if (!isBillingAvailable()) {
      flash(isPt
        ? 'Restauração disponível no app Android (Google Play).'
        : 'Restore is available in the Android app (Google Play).');
      return;
    }
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.ok) {
      setEnt(result.ent);
      onEntitlementChange?.(result.ent);
      flash(isPt ? 'Compras restauradas!' : 'Purchases restored!', true);
      return;
    }
    if (result.reason === 'order-in-use') {
      // Uma compra pertence a uma conta Soulmon só. Sem explicar isso, o
      // usuário legítimo que trocou de e-mail acharia que perdeu o que pagou.
      flash(isPt
        ? 'Esta compra já está vinculada a outra conta Soulmon. Entre com o e-mail usado na compra, ou fale com o suporte.'
        : 'This purchase is already linked to another Soulmon account. Sign in with the email used at purchase, or contact support.');
      return;
    }
    flash(isPt
      ? 'Nenhuma compra encontrada nesta conta Google.'
      : 'No purchases found on this Google account.');
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthEmail(null);
    flash(isPt ? 'Você saiu da conta.' : 'Signed out.');
  };

  // Rótulo NOMEADO, não número nem sigla (régua nº 2).
  const tierLabel = ent === null
    ? '—'
    : ent.tier === 'paid' ? (isPt ? 'Completa' : 'Full') : (isPt ? 'Demo' : 'Demo');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Chave: valor (D-K3/D-K4) — a palavra ("Full"/"Demo") em Rubik 500; os
          Créditos = `diamond` 20 FILL em `credit-ink` + o número em `ink` mono
          `tabular-nums`: a única moeda com ícone, porque é dinheiro real. */}
      <div className="sm2-conta-kv" aria-busy={ent === null}>
        <span>{isPt ? 'Seu plano' : 'Your plan'}</span>
        <span className="sm2-conta-kv-v">{tierLabel}</span>
      </div>
      <div className="sm2-conta-kv">
        <span>{isPt ? 'Créditos' : 'Credits'}</span>
        <span className="sm2-conta-kv-v sm2-conta-mono">
          <Icon name="diamond" size={20} fill={1} tone="inherit" style={{ color: CREDIT_COLOR }} label={isPt ? 'Créditos' : 'Credits'} />
          {ent?.credits ?? 0}
        </span>
      </div>
      {authEmail && (
        <p style={sm2Hint}>
          {isPt ? `Autenticado como ${authEmail}` : `Signed in as ${authEmail}`}
        </p>
      )}

      {/* "Restore purchases" `outline` 48 de largura inteira; "Sign out" é
          `quiet` — sair é quieto, nunca vermelho. */}
      <button type="button" onClick={handleRestore} disabled={restoring} style={{ ...sm2Button('outline', restoring), width: '100%' }}>
        {restoring
          ? (isPt ? 'Restaurando…' : 'Restoring…')
          : (isPt ? 'Restaurar compras' : 'Restore purchases')}
      </button>
      {isAuthConfigured() && authEmail && (
        <button type="button" onClick={handleSignOut} style={{ ...sm2Button('quiet'), width: '100%' }}>
          {isPt ? 'Sair da conta' : 'Sign out'}
        </button>
      )}

      {/* Região viva SEMPRE montada (18px de piso): leitor de tela não anuncia
          região que nasce junto com o texto. */}
      <p aria-live="polite" className={message?.ok ? 'sm2-conta-live is-ok' : 'sm2-conta-live'}>
        {message?.text}
      </p>
    </div>
  );
}
