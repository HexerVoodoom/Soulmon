import { useState, useEffect, type CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
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

const rowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 12, minHeight: 44,
};

export function AccountSection({ language, onEntitlementChange }: AccountSectionProps) {
  const isPt = language === 'pt-BR';

  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEntitlement().then(e => { if (!cancelled) setEnt(e); });
    getCurrentEmail().then(e => { if (!cancelled) setAuthEmail(e); });
    return () => { cancelled = true; };
  }, []);

  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 4000); };

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
      flash(isPt ? 'Compras restauradas!' : 'Purchases restored!');
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
    <div>
      <div style={rowStyle} aria-busy={ent === null}>
        <span style={sm2Text}>{isPt ? 'Seu plano' : 'Your plan'}</span>
        <span style={{ ...sm2Text, fontWeight: 500 }}>{tierLabel}</span>
      </div>
      <div style={rowStyle}>
        <span style={sm2Text}>{isPt ? 'Créditos' : 'Credits'}</span>
        <span className="sm2-num" style={{ ...sm2Text, fontWeight: 500 }}>{ent?.credits ?? 0}</span>
      </div>
      {authEmail && (
        <p style={{ ...sm2Hint, marginTop: 4 }}>
          {isPt ? `Autenticado como ${authEmail}` : `Signed in as ${authEmail}`}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={handleRestore} disabled={restoring} style={sm2Button('outline', restoring)}>
          {restoring
            ? (isPt ? 'Restaurando…' : 'Restoring…')
            : (isPt ? 'Restaurar compras' : 'Restore purchases')}
        </button>
        {isAuthConfigured() && authEmail && (
          <button type="button" onClick={handleSignOut} style={sm2Button('quiet')}>
            {isPt ? 'Sair da conta' : 'Sign out'}
          </button>
        )}
      </div>

      {/* Região viva SEMPRE montada: leitor de tela não anuncia região que
          nasce junto com o texto. */}
      <div aria-live="polite">
        {message && <p style={{ ...sm2Hint, color: 'var(--sm2-primary-ink)', marginTop: 8 }}>{message}</p>}
      </div>
    </div>
  );
}
