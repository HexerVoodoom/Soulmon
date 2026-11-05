import { describe, it, expect } from 'vitest';
import { applyMail, mailLine, sanitizeMailClaimed, splitMail, type MailItem } from './mensageiro';

const carta: MailItem = { mid: 'season:2026-10', bodyPt: 'A temporada terminou.', bodyEn: 'The season is over.', bits: 10, emblems: 6 };

describe('crédito das cartas (§241)', () => {
  it('credita uma vez só', () => {
    const a = applyMail({ gamePoints: 1, emblems: 2 }, carta);
    expect(a).toMatchObject({ gamePoints: 11, emblems: 8, mailClaimed: [carta.mid] });
    expect(applyMail(a, carta)).toBe(a);
  });
  it('carta já no save só é confirmada, não é mostrada de novo', () => {
    expect(splitMail([carta], [carta.mid])).toEqual({ fresh: [], toAck: [carta.mid] });
    expect(splitMail([carta], undefined)).toEqual({ fresh: [carta], toAck: [] });
  });
  it('lê lixo sem quebrar', () => {
    expect(sanitizeMailClaimed('x')).toBeUndefined();
    expect(sanitizeMailClaimed(['a', 'a', 3])).toEqual(['a']);
  });
  it('a fala diz o que veio, nos dois idiomas', () => {
    expect(mailLine(carta, true)).toContain('6 de Honra e 10 Bits');
    expect(mailLine(carta, false)).toContain('6 Honor and 10 Bits');
  });
});
