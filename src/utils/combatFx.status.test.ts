/**
 * FX de STATUS do combate (PR11, run `combate-v3-01`): a tabela `família → efeito → arte`, o quadro de efeitos
 * (aplicar / gastar / expirar) e os guards de fronteira (R-NOVA, arte só a que já existe, sem lista paralela).
 * Função pura: nada aqui desenha.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FAMILY_STATUS, MAX_STATUS_CHIPS, STATUS_FX, STATUS_FX_KINDS, UNREACHABLE_STATUS_FX,
  castStatus, clearHolders, emptyStatusBoard, stageStatusOf, statusAriaLabel, statusFxOfFamily, statusGlyphId, statusLabel,
  statusShort, statusTurnsFor, tickStatus,
} from './combatFx';
import { COMBAT_V3_ART_IDS } from './combatV3Art';
import { AREA_FAMILIES, SPECIAL_FAMILIES } from './combate/specials';

describe('STATUS_FX — a tabela cobre todos os efeitos', () => {
  it('uma linha por kind, e cada linha traz glifo, forma, nome e texto curto EN + PT', () => {
    expect(Object.keys(STATUS_FX).sort()).toEqual([...STATUS_FX_KINDS].sort());
    for (const k of STATUS_FX_KINDS) {
      const d = STATUS_FX[k];
      expect(d.mark.length, `${k} sem forma`).toBeGreaterThan(0);
      expect(d.glyph._, `${k} sem glifo`).toBeTruthy();
      for (const dict of [d.label, d.short]) {
        expect(dict._.en.length).toBeGreaterThan(0);
        expect(dict._.pt.length).toBeGreaterThan(0);
        for (const v of Object.values(dict)) { expect(v.en).toBeTruthy(); expect(v.pt).toBeTruthy(); }
      }
    }
  });

  it('os kinds diferem dois a dois em FORMA (seta/sinal) e em glifo — não só em cor', () => {
    const marks = STATUS_FX_KINDS.map(k => STATUS_FX[k].mark);
    expect(new Set(marks).size).toBe(marks.length);
    const glyphs = STATUS_FX_KINDS.flatMap(k => Object.values(STATUS_FX[k].glyph));
    // o buff de ATK e o de SPD podem ser a mesma peça no padrão (`_`), mas cada variante nomeada é uma peça
    const nomeadas = STATUS_FX_KINDS.flatMap(k => Object.entries(STATUS_FX[k].glyph).filter(([v]) => v !== '_').map(([, g]) => g));
    expect(new Set(nomeadas).size).toBe(nomeadas.length);
    expect(new Set(STATUS_FX_KINDS.map(k => STATUS_FX[k].glyph._)).size).toBe(STATUS_FX_KINDS.length);
    expect(glyphs.length).toBeGreaterThan(STATUS_FX_KINDS.length - 1);
    // e o texto curto também distingue (EN e PT)
    for (const lang of ['en', 'pt'] as const) {
      const shorts = STATUS_FX_KINDS.map(k => STATUS_FX[k].short._[lang]);
      expect(new Set(shorts).size, `texto curto repetido em ${lang}`).toBe(shorts.length);
    }
  });

  it('a arte citada na tabela é a que JÁ está instalada (nenhuma peça nova, nenhum id solto)', () => {
    const ids = new Set(COMBAT_V3_ART_IDS);
    for (const k of STATUS_FX_KINDS) {
      const d = STATUS_FX[k];
      for (const g of Object.values(d.glyph)) expect(ids.has(g), `glifo ${g}`).toBe(true);
      if (d.loop) expect(ids.has(d.loop), `loop ${d.loop}`).toBe(true);
      if (d.still) expect(ids.has(d.still), `peça ${d.still}`).toBe(true);
    }
    expect(ids.has('fx-cast-circle')).toBe(true);
  });

  it('a distinção do buff: ATK e SPD têm glifo e texto próprios', () => {
    expect(statusGlyphId('buff', 'atk')).not.toBe(statusGlyphId('buff', 'spd'));
    expect(statusShort('buff', true, 'atk')).not.toBe(statusShort('buff', true, 'spd'));
    expect(statusLabel('buff', false, 'atk')).toBe('Attack up');
    expect(statusLabel('buff', true, 'spd')).toBe('Velocidade em alta');
    expect(statusLabel('debuff', false, 'def')).toBe('Defense down');
  });
});

describe('FAMILY_STATUS — toda família do núcleo (PR1) mapeia, lida do módulo', () => {
  it('cada `SpecialFamily` tem linha (família nova sem mapeamento REPROVA aqui, e não compila)', () => {
    for (const f of SPECIAL_FAMILIES) expect(f in FAMILY_STATUS, `família ${f} sem mapeamento`).toBe(true);
    expect(Object.keys(FAMILY_STATUS).sort()).toEqual([...SPECIAL_FAMILIES].sort());
  });

  it('o dano direto não deixa estado; todas as outras deixam um kind da tabela', () => {
    expect(FAMILY_STATUS.direct).toBeNull();
    for (const f of SPECIAL_FAMILIES.filter(x => x !== 'direct')) {
      const m = statusFxOfFamily(f);
      expect(m, f).not.toBeNull();
      expect(STATUS_FX_KINDS).toContain(m!.kind);
    }
    expect(statusFxOfFamily(undefined)).toBeNull();
  });

  it('os efeitos têm o alvo certo: buff/cura/escudo em quem conjura; debuff e DoT no alvo', () => {
    expect(FAMILY_STATUS.atkBuff).toMatchObject({ kind: 'buff', variant: 'atk', target: 'self' });
    expect(FAMILY_STATUS.spdBuff).toMatchObject({ kind: 'buff', variant: 'spd', target: 'self' });
    expect(FAMILY_STATUS.heal).toMatchObject({ kind: 'cura', target: 'self' });
    expect(FAMILY_STATUS.shield).toMatchObject({ kind: 'escudo', target: 'self' });
    expect(FAMILY_STATUS.defDebuff).toMatchObject({ kind: 'debuff', variant: 'def', target: 'foe' });
    expect(FAMILY_STATUS.dot).toMatchObject({ kind: 'dot', target: 'foe' });
  });

  it('Q-FX1 (decisão §2.13, PR16): HoT segue PRONTO e INALCANÇÁVEL; a maldição só chega pela ESCOLA (nenhuma família sozinha)', () => {
    expect([...UNREACHABLE_STATUS_FX]).toEqual(['hot']);
    expect(STATUS_FX.maldicao.loop).toBeTruthy(); // prontos de verdade (a arte existe)
    expect(STATUS_FX.hot.glyph._).toBeTruthy();
    for (const f of SPECIAL_FAMILIES) expect(['hot', 'maldicao']).not.toContain(FAMILY_STATUS[f]?.kind);
  });
});

describe('o quadro de efeitos: aplicar, gastar, expirar', () => {
  const nFoes = 2;
  const cast = (b: ReturnType<typeof emptyStatusBoard>, over: Partial<Parameters<typeof castStatus>[1]> = {}) =>
    castStatus(b, { caster: 0, family: 'atkBuff', power: 1.01, area: false, targets: [1], ...over });

  it('sem status: o quadro é vazio (a camada some)', () => {
    const b = emptyStatusBoard(nFoes);
    expect(b).toHaveLength(nFoes + 1);
    expect(stageStatusOf(b[0])).toEqual([]);
    expect(cast(b, { family: 'direct' })).toBe(b);
  });

  it('o buff fica em quem conjura e dura o orçamento do especial; cada golpe DELE gasta um turno; no zero some', () => {
    let b = cast(emptyStatusBoard(nFoes));
    const turns = statusTurnsFor('atkBuff', 1.01);
    expect(turns).toBe(3);
    expect(stageStatusOf(b[0])).toEqual([{ kind: 'buff', variant: 'atk', turns }]);
    b = tickStatus(b, { kind: 'attack', who: 1 }); // golpe do OUTRO lado: não gasta
    expect(b[0][0].turns).toBe(turns);
    for (let i = turns; i > 1; i--) b = tickStatus(b, { kind: 'attack', who: 0 });
    expect(b[0][0].turns).toBe(1); // último turno (o selo marca "acabando")
    b = tickStatus(b, { kind: 'attack', who: 0 });
    expect(b[0]).toHaveLength(0); // expirou
  });

  it('o debuff cai no alvo único; na área (família que responde à área) cai em todos os vivos', () => {
    const um = cast(emptyStatusBoard(nFoes), { family: 'defDebuff', targets: [2] });
    expect(um[0]).toHaveLength(0);
    expect(um[1]).toHaveLength(0);
    expect(stageStatusOf(um[2])).toEqual([{ kind: 'debuff', variant: 'def', turns: 3 }]);
    const area = cast(emptyStatusBoard(nFoes), { family: 'defDebuff', area: true, targets: [1, 2] });
    expect(area[1]).toHaveLength(1);
    expect(area[2]).toHaveLength(1);
    // cura é pessoal: a área não a espalha
    expect(AREA_FAMILIES).not.toContain('heal');
    const cura = cast(emptyStatusBoard(nFoes), { family: 'heal', area: true, targets: [1, 2] });
    expect(cura[0]).toHaveLength(1);
    expect(cura[1]).toHaveLength(0);
  });

  it('o DoT conta os TICKS de quem o pôs (3); o golpe comum não o gasta', () => {
    let b = cast(emptyStatusBoard(nFoes), { family: 'dot', power: 0.95, targets: [1] });
    expect(b[1][0]).toMatchObject({ kind: 'dot', turns: 3 });
    b = tickStatus(b, { kind: 'attack', who: 0 });
    expect(b[1][0].turns).toBe(3);
    b = tickStatus(tickStatus(tickStatus(b, { kind: 'tick', who: 0 }), { kind: 'tick', who: 0 }), { kind: 'tick', who: 0 });
    expect(b[1]).toHaveLength(0);
  });

  it('o escudo gasta com os golpes que ele recebe (do lado oposto), não com os do dono', () => {
    let b = cast(emptyStatusBoard(nFoes), { family: 'shield', power: 1 });
    expect(b[0][0]).toMatchObject({ kind: 'escudo', turns: 3 });
    b = tickStatus(b, { kind: 'attack', who: 0 });
    expect(b[0][0].turns).toBe(3);
    b = tickStatus(b, { kind: 'attack', who: 2 });
    expect(b[0][0].turns).toBe(2);
  });

  it('recastar o mesmo efeito RENOVA (não empilha igual); efeitos diferentes empilham', () => {
    let b = cast(emptyStatusBoard(nFoes));
    b = tickStatus(b, { kind: 'attack', who: 0 });
    b = cast(b); // renova
    expect(b[0]).toHaveLength(1);
    expect(b[0][0].turns).toBe(3);
    b = cast(b, { family: 'spdBuff', power: 1.82 });
    b = cast(b, { family: 'shield', power: 1 });
    expect(b[0].map(e => e.kind)).toEqual(['buff', 'buff', 'escudo']);
    expect(b[0].length).toBeGreaterThan(MAX_STATUS_CHIPS - 1); // o excedente da cena vira "+k"
  });

  it('alvo derrubado leva os efeitos embora; o que dependia dos golpes de quem caiu acaba junto', () => {
    let b = cast(emptyStatusBoard(nFoes), { family: 'defDebuff', area: true, targets: [1, 2] });
    b = cast(b, { family: 'heal', power: 1.25 });
    b = clearHolders(b, [1]);
    expect(b[1]).toHaveLength(0);
    expect(b[2]).toHaveLength(1);
    b = clearHolders(b, [0]); // o pet caiu: o debuff que ele pôs no inimigo 2 não tem mais quem o gaste
    expect(b[0]).toHaveLength(0);
    expect(b[2]).toHaveLength(0);
  });

  it('o aria-label leva o efeito e os turnos, EN e PT, com singular', () => {
    expect(statusAriaLabel('buff', 2, false, 'atk')).toBe('Attack up, 2 turns left');
    expect(statusAriaLabel('buff', 1, false, 'atk')).toBe('Attack up, 1 turn left');
    expect(statusAriaLabel('dot', 3, true)).toBe('Dano contínuo, 3 turnos');
    expect(statusAriaLabel('escudo', 1, true)).toBe('Escudo, 1 turno');
  });
});

describe('R-NOVA — a superfície de status nasce MUDA (`docs/SOM.md`)', () => {
  // `BattleStage.tsx` saiu da lista no PR18 (pedido do dono, 06/10/2026): a cena passou a tocar o golpe e o especial
  // (`playAttack`/`playSpecial`, `docs/SOM.md` §3.1) — travado por `cortes.contract.test.ts` (A-3). A camada de STATUS segue muda.
  const fontes = ['utils/combatFx.ts', 'utils/combatV3Art.ts', 'components/games/useCombatV3Art.ts'];
  it('nenhum import do módulo de som entra nas peças desta story', () => {
    for (const f of fontes) {
      const src = readFileSync(resolve(process.cwd(), 'src', f), 'utf8');
      const imports = src.split('\n').filter(l => /^\s*(import|export)\b.*\bfrom\b/.test(l)).join('\n');
      expect(imports, f).not.toMatch(/sounds|audioBus|loudness|\bAudio\b/);
      expect(src, f).not.toMatch(/new Audio\(|\.play\(\)/);
    }
  });
});
