import { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, LogOut, Gem } from 'lucide-react';
import type { Language } from '../utils/i18n';
import { fetchEntitlement, type Entitlement } from '../utils/entitlements';
import { isBillingAvailable, restorePurchases } from '../utils/playBilling';
import { isAuthConfigured, getCurrentEmail, signOut } from '../utils/auth';

/**
 * Conta & compras — nas Configurações.
 *
 * "Restaurar compras" NÃO é opcional: a Play exige que apps com compras não
 * consumíveis ofereçam restauração, e sem isso quem reinstala o app perde o
 * desbloqueio que pagou. A restauração relê as compras da conta Google e
 * reenvia ao servidor para reconstruir o direito.
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

  const cardStyle: React.CSSProperties = { background: 'var(--sm-surface)', border: '1px solid var(--sm-line)', borderRadius: 'var(--sm-radius)', padding: 16 };

  const rowBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
    padding: '11px 12px', borderRadius: 12, cursor: 'pointer', marginTop: 8,
    border: '1px solid var(--sm-line)',
    background: 'var(--sm-bg)',
    color: 'var(--sm-ink)',
    fontSize: 13.5, fontWeight: 600,
  };

  const tierLabel = ent?.tier === 'paid'
    ? (isPt ? 'Completa' : 'Full')
    : (isPt ? 'Demo' : 'Demo');

  return (
    <div style={cardStyle}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px', fontWeight: 700, fontSize: '0.95rem' }}>
        <ShieldCheck size={18} strokeWidth={2.2} color="var(--sm-primary)" />
        {isPt ? 'Conta e compras' : 'Account & purchases'}
      </h3>

      {/* Estado atual */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, opacity: 0.85 }}>
          {isPt ? 'Tipo de conta' : 'Account type'}
        </span>
        <strong style={{ fontSize: 12.5 }}>{tierLabel}</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 12.5, opacity: 0.85 }}>{isPt ? 'Créditos' : 'Credits'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700 }}>
          <Gem size={13} strokeWidth={2.4} color="#a855f7" />{ent?.credits ?? 0}
        </span>
      </div>
      {authEmail && (
        <p style={{ fontSize: 11.5, opacity: 0.7, margin: '8px 0 0' }}>
          {isPt ? `Autenticado como ${authEmail}` : `Signed in as ${authEmail}`}
        </p>
      )}

      <button onClick={handleRestore} disabled={restoring} style={{ ...rowBtn, opacity: restoring ? 0.6 : 1 }}>
        <RotateCcw size={16} strokeWidth={2.2} />
        {restoring
          ? (isPt ? 'Restaurando…' : 'Restoring…')
          : (isPt ? 'Restaurar compras' : 'Restore purchases')}
      </button>
      <p style={{ fontSize: 11, opacity: 0.7, margin: '6px 0 0', lineHeight: 1.5 }}>
        {isPt
          ? 'Use após reinstalar o app ou trocar de aparelho para recuperar o que você já comprou.'
          : 'Use after reinstalling or switching devices to recover what you already bought.'}
      </p>

      {isAuthConfigured() && authEmail && (
        <button onClick={handleSignOut} style={{ ...rowBtn, color: '#e0483e' }}>
          <LogOut size={16} strokeWidth={2.2} />
          {isPt ? 'Sair da conta' : 'Sign out'}
        </button>
      )}

      {message && (
        <p style={{
          fontSize: 12, fontWeight: 600, marginTop: 10, padding: '8px 10px', borderRadius: 10,
          background: 'var(--sm-primary-soft)',
          color: 'var(--sm-primary)',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
