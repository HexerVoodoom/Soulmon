/**
 * Tela "beta fechado" (release/beta-1). Quando o servidor diz `403 beta-closed`
 * (`utils/betaClosed.ts`), o app inteiro dá lugar a esta tela com a identidade
 * do Soulmon — sem save, IA nem compra. Voz: acolhe, não cobra. PT e EN.
 * O idioma vem da preferência gravada (`soulmon-language`); sem ela, PT-BR.
 */
import type { ReactNode } from 'react';
import logoUrl from '../assets/brand/final/logo-wordmark.png';
import mascoteUrl from '../assets/brand/final/mascote.png';
import { useBetaClosed } from '../utils/betaClosed';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

export const BETA_CLOSED_COPY = {
  pt: {
    title: 'O Soulmon está em teste fechado',
    body: 'Esta conta ainda não está na lista de quem testa agora. Se você recebeu um convite, saia e entre com o mesmo e-mail do convite.',
    soon: 'Quando abrir para todo mundo, seu Soulmon vai estar esperando.',
  },
  en: {
    title: 'Soulmon is in a closed test',
    body: 'This account is not on the testers list yet. If you got an invite, sign out and sign in with the same e-mail it was sent to.',
    soon: 'When it opens to everyone, your Soulmon will be waiting.',
  },
} as const;

export function BetaClosedScreen({ language }: { language: 'pt' | 'en' }) {
  const c = BETA_CLOSED_COPY[language];
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
      <p style={{ maxWidth: 360, margin: 0, color: 'var(--sm2-muted, #9dbcb4)' }}>{c.body}</p>
      <p style={{ maxWidth: 360, margin: 0, color: 'var(--sm2-muted, #9dbcb4)' }}>{c.soon}</p>
    </main>
  );
}

export function BetaClosedGate({ children }: { children: ReactNode }) {
  const fechado = useBetaClosed();
  if (!fechado) return <>{children}</>;
  const lang = String(readLocal(STORAGE_KEYS.LANGUAGE) ?? '').startsWith('en') ? 'en' : 'pt';
  return <BetaClosedScreen language={lang} />;
}
