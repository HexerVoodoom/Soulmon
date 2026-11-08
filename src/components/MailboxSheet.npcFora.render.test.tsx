// @vitest-environment jsdom
/**
 * Pedido do dono (08/11/2026): "O NPC não aparece assim em modal. Ele tem que aparecer grande, em cima, por fora."
 * A caixa de cartas usa o MESMO molde dos prédios (`AreaSheet`): o Papus na zona de cima, FORA da folha; nada de miniatura dentro do conteúdo.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MailboxSheet } from './MailboxSheet';
import { NPC_MENSAGEIRO_ART } from '../assets/soulmon/npcs';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const noop = async () => [];
const props = {
  open: true, mail: [], onClose: () => {}, onOpenLetter: () => {}, onClaim: noop,
  onClaimAll: noop, onDelete: async () => 'removed' as const, onDeleteRead: async () => 0,
};

describe.each(['pt-BR', 'en-US'] as const)('MailboxSheet › NPC grande por fora (%s)', language => {
  it('o Papus mora na zona de cima, fora da folha; o conteúdo não tem imagem de NPC', () => {
    const { container } = render(<MailboxSheet {...props} language={language} />);
    const npc = container.querySelector('[data-area-sheet-npc]') as HTMLImageElement;
    expect(npc).not.toBeNull();
    expect(npc.getAttribute('src')).toBe(NPC_MENSAGEIRO_ART);
    const sheet = container.querySelector('[data-area-sheet]')!;
    expect(sheet.contains(npc)).toBe(false);
    expect(container.querySelector('[data-area-sheet-npc-zone]')!.contains(npc)).toBe(true);
    expect(container.querySelector('[data-mailbox]')!.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-typewriter-sr]')!.textContent).toMatch(/3/);
  });

  it('o rodapé fixo e o fechar à esquerda (voltarFechar) continuam, e fechar chama onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<MailboxSheet {...props} language={language} onClose={onClose} />);
    const footer = container.querySelector('[data-area-sheet-footer]')!;
    expect(footer.querySelector('[data-mail-claim-all]')).not.toBeNull();
    expect(footer.querySelector('[data-mail-delete-read]')).not.toBeNull();
    const close = container.querySelector('[data-area-sheet-close]') as HTMLElement;
    expect(close.style.left).not.toBe('');
    expect(close.style.right).toBe('');
    close.click();
    expect(onClose).toHaveBeenCalled();
  });
});
