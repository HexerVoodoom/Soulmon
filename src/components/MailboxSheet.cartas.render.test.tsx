// @vitest-environment jsdom
/** §288: convite de amizade com Aceitar/Recusar, e carta global com o mini-tutorial do widget (2 quadros, com fallback em código). */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MailboxSheet } from './MailboxSheet';
import type { MailItem } from '../utils/mensageiro';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const noop = async () => [];
const base = { open: true, language: 'pt-BR' as const, onClose: () => {}, onOpenLetter: () => {}, onClaim: noop, onClaimAll: noop, onDelete: async () => 'removed' as const, onDeleteRead: async () => 0 };
const convite: MailItem = { mid: 'invite:pidx00000000000000000001:a', kind: 'friend-invite', fromPid: 'pidx00000000000000000001', titlePt: 'Convite de amizade', titleEn: 'Friend invite', bodyPt: 'Ana convidou você para ser amigo. Aceitar?', bodyEn: 'Ana invited you.', bits: 0, emblems: 0, at: 1 };
const global: MailItem = { mid: 'global:widget', kind: 'global', tutorial: 'widget', titlePt: 'Novidade', titleEn: 'New', bodyPt: 'corpo', bodyEn: 'body', bits: 0, emblems: 0, at: 1 };

describe('MailboxSheet › cartas especiais', () => {
  it('convite: Aceitar e Recusar chamam onAnswerInvite com decline certo; sem Resgatar', async () => {
    const onAnswerInvite = vi.fn(async () => 'accepted' as const);
    const { container } = render(<MailboxSheet {...base} mail={[convite]} onAnswerInvite={onAnswerInvite} />);
    fireEvent.click(container.querySelector('[data-mail-letter] button')!);
    expect(container.querySelector('[data-mail-claim]')).toBeNull();
    fireEvent.click(container.querySelector('[data-mail-invite-accept]')!);
    await waitFor(() => expect(onAnswerInvite).toHaveBeenCalledWith(convite, false));
    fireEvent.click(container.querySelector('[data-mail-letter] button')!);
    fireEvent.click(container.querySelector('[data-mail-invite-decline]')!);
    await waitFor(() => expect(onAnswerInvite).toHaveBeenLastCalledWith(convite, true));
  });

  it('convite sem o handler não mostra botões de aceite', () => {
    const { container } = render(<MailboxSheet {...base} mail={[convite]} />);
    fireEvent.click(container.querySelector('[data-mail-letter] button')!);
    expect(container.querySelector('[data-mail-invite]')).toBeNull();
  });

  it('carta global do widget: NPC remetente grande + imagem do widget, sem exigir print e sem Resgatar', () => {
    const { container } = render(<MailboxSheet {...base} mail={[{ ...global, npc: 'mensageiro' }]} />);
    fireEvent.click(container.querySelector('[data-mail-letter] button')!);
    const npc = container.querySelector('[data-mail-npc="mensageiro"]') as HTMLImageElement;
    expect(npc).not.toBeNull();
    expect(Number(npc.getAttribute('width'))).toBeGreaterThanOrEqual(96);
    expect(container.querySelector('[data-carta-widget-img]')).not.toBeNull();
    expect(container.querySelector('[data-mail-claim]')).toBeNull();
  });

  it('remetente jogador (presente/convite) não mostra imagem de NPC', () => {
    const { container } = render(<MailboxSheet {...base} mail={[convite]} onAnswerInvite={async () => 'accepted'} />);
    fireEvent.click(container.querySelector('[data-mail-letter] button')!);
    expect(container.querySelector('[data-mail-npc]')).toBeNull();
  });

  it('carta da Hexsmith mostra a imagem dela', () => {
    const { container } = render(<MailboxSheet {...base} mail={[{ ...global, tutorial: undefined, npc: 'hexsmith' }]} />);
    fireEvent.click(container.querySelector('[data-mail-letter] button')!);
    expect(container.querySelector('[data-mail-npc="hexsmith"]')).not.toBeNull();
    expect(container.querySelector('[data-carta-widget-img]')).toBeNull();
  });
});
