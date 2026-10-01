import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BOSS_ROSTER, BOSS_ART, bossArt, bossText } from './bossRoster';
import { essenceHasEn } from '../utils/soulProfile/essenceLabels';
import { EXTRA_NPC_ART } from '../assets/soulmon/npcs';
import { EXTRA_NPC_VOICE, extraNpcVoice, type ExtraNpcId } from '../utils/areaNpcVoice';

// Mesmas listas de cobrança de `utils/petVoice.test.ts` (texto que o jogador lê).
const PROIBIDAS_PT = [
  'deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu',
  'finalmente', 'até que enfim', 'preguiç', 'desculpa', 'culpa', 'perdeu',
];
const PROIBIDAS_EN = [/should/, /late\b/, /failed/, /failure/, /you forgot/, /finally/, /at last/, /lazy/, /excuse/, /guilt/, /lost/];
const FLERTE = /\b(darling|querid[oa]|honey|sweetie|babe)\b/i;

function semCobranca(pt: string, en: string) {
  for (const p of PROIBIDAS_PT) expect(pt.toLowerCase(), pt).not.toContain(p);
  for (const p of PROIBIDAS_EN) expect(en.toLowerCase(), `${en} ~ ${p}`).not.toMatch(p);
  for (const t of [pt, en]) {
    expect(t, t).not.toMatch(/\d/);
    expect(t, t).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(t, t).not.toMatch(FLERTE);
  }
}

const DIR_BOSSES = path.resolve(__dirname, '../assets/soulmon/bosses');

describe('roster dos chefes (leva poderosos, 01/10/2026)', () => {
  it('24 chefes, ids únicos, 12 guardiões/12 chefes conforme o ROSTER', () => {
    expect(BOSS_ROSTER).toHaveLength(24);
    expect(new Set(BOSS_ROSTER.map(b => b.id)).size).toBe(24);
    expect(BOSS_ROSTER.filter(b => b.tier === 'guardiao')).toHaveLength(12);
    expect(BOSS_ROSTER.filter(b => b.tier === 'chefe')).toHaveLength(12);
  });

  it('todo chefe tem arte, e toda arte da pasta tem chefe (sem órfão)', () => {
    for (const b of BOSS_ROSTER) expect(bossArt(b.id), b.id).toMatch(new RegExp(`boss-${b.id}`));
    const pasta = fs.readdirSync(DIR_BOSSES).filter(f => f.endsWith('.png')).map(f => f.replace(/^boss-|\.png$/g, ''));
    expect(pasta.sort()).toEqual(BOSS_ROSTER.map(b => b.id).sort());
    expect(Object.keys(BOSS_ART)).toHaveLength(24);
    expect(bossArt('inventado')).toBeUndefined();
  });

  it('nenhum nome termina em "-mon"', () => {
    for (const b of BOSS_ROSTER) for (const n of [b.namePt, b.nameEn]) expect(n).not.toMatch(/mon$/i);
  });

  it('todo elemento tem nome EN em essenceLabels (inclui Symphony/Hurricane/Jungle/Core/Last Judgment)', () => {
    for (const b of BOSS_ROSTER) {
      expect(b.elements.length).toBeGreaterThanOrEqual(2);
      for (const e of b.elements) expect(essenceHasEn(e.id), `${b.id}: ${e.id}`).toBe(true);
    }
    const arauto = bossText(BOSS_ROSTER[0], false);
    expect(arauto.name).toBe('Herald of the End');
    expect(arauto.elements[0]).toBe('Last Judgment');
    const cuprex = bossText(BOSS_ROSTER.find(b => b.id === 'cuprex')!, false);
    expect(cuprex.elements).toContain('Core');
  });

  it('lore PT/EN sem cobrança, sem número, sem emoji', () => {
    for (const b of BOSS_ROSTER) {
      semCobranca(b.lorePt, b.loreEn);
      expect(b.papelPt.length * b.papelEn.length).toBeGreaterThan(0);
    }
  });
});

describe('12 NPCs extras (leva npcs-femininas, 01/10/2026)', () => {
  const ids = Object.keys(EXTRA_NPC_VOICE) as ExtraNpcId[];

  it('12 bustos com arte própria (sem colidir com nenhum outro) e voz nos dois idiomas', () => {
    expect(ids).toHaveLength(12);
    expect(new Set(Object.values(EXTRA_NPC_ART)).size).toBe(12);
    for (const id of ids) {
      expect(EXTRA_NPC_ART[id], id).toMatch(new RegExp(`npc-f-${id}`));
      for (const lang of ['pt-BR', 'en-US'] as const) {
        const v = extraNpcVoice(id, lang);
        expect(v.name).not.toMatch(/mon$/i);
        expect(v.line.length).toBeGreaterThan(0);
      }
      semCobranca(EXTRA_NPC_VOICE[id].linePt, EXTRA_NPC_VOICE[id].lineEn);
    }
  });

  it('a fala da Datura não flerta (pedido do dono na instalação)', () => {
    expect(extraNpcVoice('venenos', 'en-US').line).not.toMatch(FLERTE);
    expect(extraNpcVoice('venenos', 'pt-BR').line).not.toMatch(FLERTE);
  });
});
