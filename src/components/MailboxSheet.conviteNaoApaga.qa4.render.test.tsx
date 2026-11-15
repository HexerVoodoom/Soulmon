// @vitest-environment jsdom
/**
 * QA r4 C2 · D (REGISTRO §389, decisão do dono 14/11/2026): "Excluir todas lidas" NÃO apaga convite de amizade/clã ainda não
 * respondido (abrir a carta já a marca como lida); e o cartão de convite esconde "Deletar" enquanto houver "Recusar".
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MailboxSheet } from './MailboxSheet';
import { deletableRead, type MailItem } from '../utils/mensageiro';

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const noop = async () => [];
const base = { open: true, language: 'en-US' as const, onClose: () => {}, onOpenLetter: () => {}, onClaim: noop, onClaimAll: noop, onDelete: async () => 'removed' as const, onDeleteRead: async () => 0 };
const amizade: MailItem = { mid: 'invite:pidx00000000000000000001:a', kind: 'friend-invite', fromPid: 'pidx00000000000000000001', titlePt: 'Convite', titleEn: 'Friend invite', bodyPt: 'b', bodyEn: 'b', bits: 0, emblems: 0, at: 1, read: true };
const cla: MailItem = { mid: 'ginv:gidx:2026-11-13', kind: 'guild-invite', guildCode: 'ABCD2345', titlePt: 'Clã', titleEn: 'Clan invite', bodyPt: 'b', bodyEn: 'b', bits: 0, emblems: 0, at: 2, read: true };
const claAntigo: MailItem = { mid: 'ginv:gidy:2026-11-01', titlePt: 'Clã', titleEn: 'Clan invite', bodyPt: 'b', bodyEn: 'b', bits: 0, emblems: 0, at: 3, read: true };
const lida: MailItem = { mid: 'news:1', titlePt: 'N', titleEn: 'News', bodyPt: 'b', bodyEn: 'b', bits: 0, emblems: 0, at: 4, read: true };

describe('D · convite não respondido sobrevive ao "Excluir todas lidas"', () => {
  it('deletableRead deixa de fora todo convite (amizade, clã e o formato antigo de clã)', () => {
    expect(deletableRead([amizade, cla, claAntigo, lida]).map(m => m.mid)).toEqual(['news:1']);
  });

  it('só convites lidos na caixa: "Delete all read" fica desligado', () => {
    const { container } = render(<MailboxSheet {...base} mail={[amizade, cla]} onAnswerInvite={async () => 'declined'} onJoinGuild={async () => 'joined'} />);
    expect((container.querySelector('[data-mail-delete-read]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('cartão de convite com "Decline" não mostra "Delete"; carta comum segue com "Delete"', () => {
    const { container } = render(<MailboxSheet {...base} mail={[amizade, cla, lida]} onAnswerInvite={async () => 'declined'} onJoinGuild={async () => 'joined'} />);
    for (const mid of [amizade.mid, cla.mid]) {
      fireEvent.click(container.querySelector(`[data-mail-letter="${mid}"] button`)!);
      const carta = container.querySelector(`[data-mail-letter="${mid}"]`)!;
      expect(carta.querySelector('[data-mail-invite-decline], [data-mail-guild-decline]')).not.toBeNull();
      expect(carta.querySelector('[data-mail-delete]')).toBeNull();
    }
    fireEvent.click(container.querySelector(`[data-mail-letter="${lida.mid}"] button`)!);
    expect(container.querySelector(`[data-mail-letter="${lida.mid}"] [data-mail-delete]`)).not.toBeNull();
  });
});
