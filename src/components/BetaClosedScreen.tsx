/**
 * Tela "beta fechado" — carregada sob demanda pelo `BetaClosedGate` (fora do
 * chunk de entrada: quase ninguém a vê).
 *
 * Tela "beta fechado" (release/beta-1). Quando o servidor diz `403 beta-closed`
 * (`utils/betaClosed.ts`), o app inteiro dá lugar a esta tela com a identidade
 * do Soulmon — sem save, IA nem compra. Voz: acolhe, não cobra. PT e EN.
 *
 * Gate adversarial C1: a causa mais comum é o testador entrar com OUTRO e-mail
 * (outro Gmail, digitado diferente). Por isso a tela MOSTRA o e-mail da sessão,
 * diz o que fazer ("peça ao Mateus para incluir este e-mail") e oferece
 * "Trocar de conta". O idioma vem da preferência gravada; sem ela, PT-BR.
 */
import { useState } from 'react';
import logoUrl from '../assets/brand/final/logo-wordmark.png';
import mascoteUrl from '../assets/brand/final/mascote.png';

export const BETA_CLOSED_COPY = {
  pt: {
    title: 'O Soulmon está em teste fechado',
    as: 'Você entrou como',
    noEmail: 'Não conseguimos ver com qual e-mail você entrou.',
    body: 'Este e-mail ainda não está na lista de testes. Se foi convidado, peça ao Mateus para incluir este e-mail — ou troque para a conta do convite.',
    soon: 'Quando abrir para todo mundo, seu Soulmon vai estar esperando.',
    switch: 'Trocar de conta',
  },
  en: {
    title: 'Soulmon is in a closed test',
    as: 'You signed in as',
    noEmail: "We couldn't see which e-mail you signed in with.",
    body: 'This e-mail is not on the testers list yet. If you were invited, ask Mateus to add this e-mail — or switch to the account the invite was sent to.',
    soon: 'When it opens to everyone, your Soulmon will be waiting.',
    switch: 'Switch account',
  },
} as const;

export function BetaClosedScreen({ language, email, onSwitch }: { language: 'pt' | 'en'; email: string | null; onSwitch: () => void }) {
  const c = BETA_CLOSED_COPY[language];
  const [saindo, setSaindo] = useState(false);
  return (
    <main
      data-beta-closed
      role="main"
      aria-labelledby="beta-fechado-titulo"
      style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 24, textAlign: 'center', background: 'var(--sm2-bg, #08191a)', color: 'var(--sm2-ink, #e9f5f2)',
      }}
    >
      <img src={logoUrl} alt="Soulmon" style={{ width: 180, height: 'auto' }} />
      <img src={mascoteUrl} alt="" aria-hidden="true" style={{ width: 96, height: 96, imageRendering: 'pixelated' }} />
      <h1 id="beta-fechado-titulo" style={{ fontSize: 20, margin: 0 }}>{c.title}</h1>
      <p data-beta-email style={{ maxWidth: 360, margin: 0 }}>
        {email ? <>{c.as} <strong style={{ wordBreak: 'break-all' }}>{email}</strong></> : c.noEmail}
      </p>
      <p style={{ maxWidth: 360, margin: 0, color: 'var(--sm2-muted, #9dbcb4)' }}>{c.body}</p>
      <button
        type="button"
        data-beta-switch
        disabled={saindo}
        onClick={() => { setSaindo(true); onSwitch(); }}
        style={{
          minHeight: 44, padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer',
          background: 'var(--sm2-primary-fill, #5ff3e0)', color: 'var(--sm2-on-primary, #04211f)',
        }}
      >
        {c.switch}
      </button>
      <p style={{ maxWidth: 360, margin: 0, color: 'var(--sm2-muted, #9dbcb4)' }}>{c.soon}</p>
    </main>
  );
}

