import { describe, it, expect } from 'vitest';
import {
  announceLine, applyGrants, applyMail, deletableRead, hasNewMail, hasPendingReward, isUnread, mailTitle, markClaimed, parseAnnounced,
  rewardText, sanitizeMailClaimed, serializeAnnounced, sortMail, sumGrants, toAnnounce, unclaimedInSave, type MailItem,
} from './mensageiro';

const carta: MailItem = { mid: 'season:2026-10', bodyPt: 'A temporada terminou.', bodyEn: 'The season is over.', bits: 10, emblems: 6, titlePt: 'Temporada', titleEn: 'Season', at: 100 };
const aviso: MailItem = { mid: 'aviso', bodyPt: 'Oi.', bodyEn: 'Hi.', bits: 0, emblems: 0, at: 200 };

describe('crédito das cartas (§241)', () => {
  it('credita uma vez só', () => {
    const a = applyMail({ gamePoints: 1, emblems: 2 }, carta);
    expect(a).toMatchObject({ gamePoints: 11, emblems: 8, mailClaimed: [carta.mid] });
    expect(applyMail(a, carta)).toBe(a);
  });
  it('lê lixo sem quebrar', () => {
    expect(sanitizeMailClaimed('x')).toBeUndefined();
    expect(sanitizeMailClaimed(['a', 'a', 3])).toEqual(['a']);
  });
});

describe('caixa de cartas (§245)', () => {
  it('o prêmio entregue pelo servidor credita uma vez, mesmo repetido', () => {
    const g = [{ mid: 'a', bits: 5, emblems: 1 }, { mid: 'b', bits: 0, emblems: 2 }];
    const s = applyGrants({ gamePoints: 0, emblems: 0 }, g);
    expect(s).toMatchObject({ gamePoints: 5, emblems: 3, mailClaimed: ['a', 'b'] });
    expect(applyGrants(s, g)).toEqual(s);
  });
  it('carta nova, pendente e lida', () => {
    expect(isUnread(carta)).toBe(true);
    expect(hasPendingReward(carta)).toBe(true);
    expect(hasPendingReward(aviso)).toBe(false);
    expect(hasNewMail([aviso])).toBe(true);
    expect(hasNewMail([{ ...aviso, read: true }, { ...carta, claimedAt: 5 }])).toBe(false);
  });
  it('resgatar marca como lida e sem pendência', () => {
    const [c] = markClaimed([carta], new Set([carta.mid]), 999);
    expect(c).toMatchObject({ read: true, claimedAt: 999 });
    expect(hasPendingReward(c)).toBe(false);
  });
  it('só as lidas sem item pendente são apagáveis em lote', () => {
    const lidaComItem = { ...carta, read: true };
    const lidaSemItem = { ...aviso, read: true };
    expect(deletableRead([lidaComItem, lidaSemItem, { ...aviso, mid: 'x' }]).map(m => m.mid)).toEqual(['aviso']);
  });
  it('carta entregue mas fora do save é recuperada', () => {
    const entregue = { ...carta, claimedAt: 1 };
    expect(unclaimedInSave([entregue, aviso], [])).toEqual([entregue]);
    expect(unclaimedInSave([entregue], [carta.mid])).toEqual([]);
  });
  it('mais nova primeiro, título e prêmio nos dois idiomas', () => {
    expect(sortMail([carta, aviso]).map(m => m.mid)).toEqual(['aviso', carta.mid]);
    expect(mailTitle(carta, true)).toBe('Temporada');
    expect(mailTitle(aviso, false)).toBe('Letter from Papus');
    expect(rewardText(carta, true)).toBe('6 de Honra e 10 Bits');
    expect(rewardText(carta, false)).toBe('6 Honor and 10 Bits');
    expect(sumGrants([carta, { bits: 1, emblems: 1 }])).toEqual({ bits: 11, emblems: 7 });
  });
  it('o aviso do Papus fala só de carta nova ainda não anunciada', () => {
    expect(toAnnounce([carta, aviso, { ...aviso, mid: 'lida', read: true }], ['aviso']).map(m => m.mid)).toEqual([carta.mid]);
    expect(parseAnnounced(serializeAnnounced(['a', 'b', 'a']))).toEqual(['a', 'b']);
    expect(announceLine(2, true)).toContain('2 cartas');
    expect(announceLine(1, false)).toContain('A letter');
  });
});
