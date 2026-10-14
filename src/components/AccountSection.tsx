import { useState, useEffect } from 'react';
import { AlertLine, sm2Button, sm2Hint } from './form/FormKit';
import { InfoTip } from './ui/InfoTip';
import { Icon } from './ui/Icon';
import { CREDIT_COLOR } from '../utils/currencies';
import type { Language } from '../utils/i18n';
import { fetchEntitlement, type Entitlement } from '../utils/entitlements';
import { isBillingAvailable, restorePurchases } from '../utils/playBilling';
import { isAuthConfigured, getCurrentEmail, entrarComGoogle } from '../utils/auth';
import {
  sincronizarAntesDeSair, encerrarSessao, baixarBackupLocal, guardarCopiaDeSeguranca,
} from '../utils/sessionReset';

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
  /**
   * G4 (01/10/2026): o campo de e-mail das Configurações saiu — o login é o
   * Google do portão. Para quem chegou SEM conta (build sem Firebase no
   * portão, ou sessão que caiu), o único caminho de entrar daqui é o botão
   * "Entrar com Google", e ele devolve o e-mail verificado para o dono do
   * save (`onLoginWithEmail` do App) amarrar o progresso. Ausente = sem botão.
   */
  onSignedIn?: (email: string) => Promise<unknown>;
}

export function AccountSection({ language, onEntitlementChange, onSignedIn }: AccountSectionProps) {
  const isPt = language === 'pt-BR';

  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  /** Só depois de perguntar ao Firebase se há sessão o botão de entrar pode
   *  aparecer — senão ele piscaria para quem já está logado. */
  const [authChecked, setAuthChecked] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [restoring, setRestoring] = useState(false);
  /* A resposta da região viva: a boa em `ink` 500, as outras em `muted` 12 —
     nenhuma em vermelho (canvas Conta D-K7). */
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEntitlement().then(e => { if (!cancelled) setEnt(e); });
    getCurrentEmail().then(e => { if (!cancelled) { setAuthEmail(e); setAuthChecked(true); } });
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

  /* Sair da conta (`utils/sessionReset.ts`): primeiro tenta mandar o que ainda não
     chegou à nuvem; se não der, AVISA e oferece o backup — nunca apaga em silêncio.
     Dá certo = apaga o estado local da conta, encerra a sessão e recarrega na entrada. */
  const [saida, setSaida] = useState<'idle' | 'sincronizando' | 'falhou' | 'saindo'>('idle');
  const [saidaOffline, setSaidaOffline] = useState(false);

  const sairDeVez = async (semSync: boolean) => {
    setSaida('saindo');
    // Sem sync = a cópia no aparelho é a única rede de segurança: guarda com o motivo certo.
    if (semSync) guardarCopiaDeSeguranca('logout-sem-sync');
    await encerrarSessao({ motivo: 'logout', copiaDeSeguranca: !semSync });
  };

  const handleSignOut = async () => {
    if (saida === 'sincronizando' || saida === 'saindo') return;
    setSaida('sincronizando');
    const r = await sincronizarAntesDeSair();
    if (r.estado === 'falhou') {
      setSaidaOffline(r.offline);
      setSaida('falhou');
      return;
    }
    await sairDeVez(false);
  };

  const handleExportBackup = () => {
    const ok = baixarBackupLocal();
    flash(ok
      ? (isPt ? 'Backup baixado. Guarde o arquivo em um lugar seguro.' : 'Backup downloaded. Keep the file somewhere safe.')
      : (isPt ? 'Não deu para baixar o backup aqui.' : "Couldn't download the backup here."), ok);
  };

  const handleGoogle = async () => {
    if (signingIn || !onSignedIn) return;
    setSigningIn(true);
    const r = await entrarComGoogle();
    if (r.ok && r.email) {
      setAuthEmail(r.email);
      try { await onSignedIn(r.email); } catch {
        flash(isPt ? 'Entrou, mas não deu para sincronizar agora.' : 'Signed in, but syncing failed for now.');
      }
    } else if (!r.ok) {
      flash(isPt ? 'Não deu para entrar agora.' : 'Could not sign in right now.');
    }
    setSigningIn(false);
  };

  /* G3 (01/10/2026): "Your plan: Full" virou SELO de conta. O desbloqueio é
     COMPRA ÚNICA (`FULL_UNLOCK_SKU` = `soulmon.unlock.full`, `utils/monetization.ts`), não plano nem
     assinatura — a assinatura de IA está decidida e não construída
     (`utils/monetization.ts`), e chamar isto de "plano" prometia uma coisa
     que não existe. Quem não comprou não ganha selo nenhum (Demo não é
     conquista); o convite de compra mora nos seis pontos do `UnlockNudge`. */
  const isFull = ent?.tier === 'paid';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Chave: valor (D-K3/D-K4) — a palavra ("Full"/"Demo") em Rubik 500; os
          Créditos = `diamond` 20 FILL em `credit-ink` + o número em `ink` mono
          `tabular-nums`: a única moeda com ícone, porque é dinheiro real. */}
      {isFull && (
        <span className="sm2-kit-tag sm2-kit-tag-on" data-full-badge style={{ alignSelf: 'flex-start' }}>
          <Icon name="check_circle" size={20} fill={1} tone="inherit" />
          {isPt ? 'Conta Full' : 'Full account'}
        </span>
      )}
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
      {/* G4: sem sessão (e com login configurado), a única porta de entrada
          daqui é o Google — o mesmo do portão do onboarding. */}
      {onSignedIn && isAuthConfigured() && authChecked && !authEmail && (
        <button
          type="button"
          onClick={handleGoogle}
          disabled={signingIn}
          data-google-signin
          style={{ ...sm2Button('primary', signingIn), width: '100%' }}
        >
          {signingIn
            ? (isPt ? 'Entrando…' : 'Signing in…')
            : (isPt ? 'Entrar com Google' : 'Sign in with Google')}
        </button>
      )}

      {/* "Restore purchases" `outline` 48 de largura inteira; "Sign out" é
          `quiet` — sair é quieto, nunca vermelho. */}
      {/* G9 → I13: o que o botão faz (devolve o que já foi pago na conta da
          loja; não cobra nada) mora atrás do "?" ao lado dele. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button type="button" onClick={handleRestore} disabled={restoring} style={{ ...sm2Button('outline', restoring), flex: 1, minWidth: 0 }}>
          {restoring
            ? (isPt ? 'Restaurando…' : 'Restoring…')
            : (isPt ? 'Restaurar compras' : 'Restore purchases')}
        </button>
        <InfoTip language={language} label={isPt ? 'O que "Restaurar compras" faz' : 'What "Restore purchases" does'} align="right">
          {isPt
            ? 'Só restaura o que esta conta já comprou (o desbloqueio, a assinatura). Não cobra nada e não devolve Créditos ou itens já gastos.'
            : 'Only restores what this account already bought (the unlock, the subscription). Nothing is charged and spent Credits or items are not returned.'}
        </InfoTip>
      </div>
      {isAuthConfigured() && authEmail && saida !== 'falhou' && (
        <button type="button" onClick={handleSignOut} disabled={saida !== 'idle'} style={{ ...sm2Button('quiet', saida !== 'idle'), width: '100%' }}>
          {saida === 'sincronizando'
            ? (isPt ? 'Salvando na nuvem…' : 'Saving to the cloud…')
            : saida === 'saindo'
              ? (isPt ? 'Saindo…' : 'Signing out…')
              : (isPt ? 'Sair da conta' : 'Sign out')}
        </button>
      )}
      {saida === 'falhou' && (
        <div data-signout-sync-failed style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AlertLine>
            {isPt
              ? `${saidaOffline ? 'Parece que a internet não está ajudando agora. ' : ''}Seu progresso mais recente ainda não chegou à nuvem. Se você sair, o que está só neste aparelho será apagado daqui.`
              : `${saidaOffline ? "Looks like the connection isn't cooperating right now. " : ''}Your latest progress hasn't reached the cloud yet. If you sign out, what's only on this device will be erased from it.`}
          </AlertLine>
          <button type="button" onClick={handleExportBackup} data-signout-export style={{ ...sm2Button('primary'), width: '100%' }}>
            {isPt ? 'Exportar backup' : 'Export backup'}
          </button>
          <button type="button" onClick={handleSignOut} style={{ ...sm2Button('outline'), width: '100%' }}>
            {isPt ? 'Tentar enviar de novo' : 'Try sending again'}
          </button>
          <button
            type="button"
            data-signout-anyway
            onClick={() => { void sairDeVez(true); }}
            style={{ ...sm2Button('quiet'), width: '100%' }}
          >
            {isPt ? 'Sair e apagar daqui' : 'Sign out and erase here'}
          </button>
          <button type="button" onClick={() => setSaida('idle')} style={{ ...sm2Button('quiet'), width: '100%' }}>
            {isPt ? 'Ficar na conta' : 'Stay signed in'}
          </button>
        </div>
      )}

      {/* Região viva SEMPRE montada (18px de piso): leitor de tela não anuncia
          região que nasce junto com o texto. */}
      <p aria-live="polite" className={message?.ok ? 'sm2-conta-live is-ok' : 'sm2-conta-live'}>
        {message?.text}
      </p>
    </div>
  );
}
