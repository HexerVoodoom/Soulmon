import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DICA_COOLDOWN_MS, DICA_DESTINO, DICA_PRIORIDADE, DICA_TIPOS, dicaAria, dicaTexto, dicasPresentes, emCooldown, energiaBaixa,
  escolherDica, marcarVista, sanitizeDicaVistas, type DicaEntrada,
} from './balaoDica';
import { bosqueCuidavel } from '../hooks/useGroveAtaque';
import { REGEN_FAIR_PCT, REGEN_FED_PCT, REGEN_STARVING_PCT, SLEEP_ENERGY_REGEN_BONUS, regenPoints, HUNGER_FED_MIN } from './hunger';
import { BUILDINGS_ALWAYS_OPEN, buildingGateFor } from './gates';
import { buildingDestination } from '../navigation';

const base: DicaEntrada = {
  presente: true, energia: 1, energiaMax: 10, fome: 'fed',
  refugioDaEnergia: true, metaDoDia: false, groveAberto: true, bosqueCuidavel: false,
};
const NOW = Date.UTC(2026, 10, 13, 15, 0, 0);
const H = 3_600_000;

describe('§333 condições', () => {
  it('energia baixa = 20% do máximo ou menos (zero incluso; sem máximo, nunca)', () => {
    expect(energiaBaixa(0, 10)).toBe(true);
    expect(energiaBaixa(2, 10)).toBe(true);
    expect(energiaBaixa(3, 10)).toBe(false);
    expect(energiaBaixa(0, 0)).toBe(false);
  });
  it('cansado + o Refúgio dá energia agora → DOURADA (relaxar), e não o cochilo', () => {
    const p = dicasPresentes(base);
    expect(p.relaxar).toBe(true);
    expect(p.cochilo).toBe(false);
    expect(escolherDica(p, {}, NOW, 'dourada')).toBe('relaxar');
    expect(escolherDica(p, {}, NOW, 'comum')).toBeNull();
  });
  it('cansado + o Refúgio NÃO dá energia agora → só a fala COMUM do cochilo, nunca aponta para lá', () => {
    const p = dicasPresentes({ ...base, refugioDaEnergia: false });
    expect(p.relaxar).toBe(false);
    expect(p.cochilo).toBe(true);
    expect(escolherDica(p, {}, NOW, 'dourada')).toBeNull();
    expect(escolherDica(p, {}, NOW, 'comum')).toBe('cochilo');
  });
  it('faminto, o cochilo NÃO aparece (dormir multiplica a regeneração, e faminto ela é 0): quem fala é a fome', () => {
    const p = dicasPresentes({ ...base, refugioDaEnergia: false, fome: 'starving' });
    expect(p.cochilo).toBe(false);
    expect(escolherDica(p, {}, NOW, 'comum')).toBe('fome');
    // e a própria regra confirma: 0% × bônus de sono = 0
    expect(REGEN_STARVING_PCT * SLEEP_ENERGY_REGEN_BONUS).toBe(0);
  });
  it('energia acima de 20%: nem relaxar nem cochilo', () => {
    const p = dicasPresentes({ ...base, energia: 5 });
    expect(p.relaxar || p.cochilo).toBe(false);
  });
  it('fome: abaixo de "bem alimentado", MESMO com a pastinha vazia (dono, 13/11); bem alimentado não fala', () => {
    expect(dicasPresentes({ ...base, energia: 9, fome: 'fair' }).fome).toBe(true);
    expect(dicasPresentes({ ...base, energia: 9, fome: 'starving' }).fome).toBe(true);
    expect(dicasPresentes({ ...base, energia: 9, fome: 'fed' }).fome).toBe(false);
    // a entrada nem conhece o estoque: não há como a pastinha vazia calar a fome
    expect(Object.keys(base)).not.toContain('temComida');
  });
  it('a fala da fome não pede tarefa nem culpa: só a fome e a regra verdadeira (vale de pastinha vazia)', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      expect(dicaTexto('fome', lang)).not.toMatch(/tarefa|task|complet|precisa|need to|você deve|you should|culpa|por favor|please|me (dá|alimenta)|feed me/i);
    }
  });
  it('a dica da fome é VERDADE no motor: bem alimentado regenera mais que mediano, que regenera mais que faminto', () => {
    expect(REGEN_FED_PCT).toBeGreaterThan(REGEN_FAIR_PCT);
    expect(REGEN_FAIR_PCT).toBeGreaterThan(REGEN_STARVING_PCT);
    const umaHora = (v: number) => regenPoints({ v, at: NOW }, NOW, NOW + H);
    expect(umaHora(100)).toBeGreaterThan(umaHora(HUNGER_FED_MIN - 1));
  });
  it('Grove: meta do dia cumprida + prédio aberto + cuidado do dia por fazer → DOURADA (lilia)', () => {
    const ok = { ...base, energia: 9, metaDoDia: true, bosqueCuidavel: true };
    expect(escolherDica(dicasPresentes(ok), {}, NOW, 'dourada')).toBe('lilia');
    expect(dicasPresentes({ ...ok, metaDoDia: false }).lilia).toBe(false);
    expect(dicasPresentes({ ...ok, groveAberto: false }).lilia).toBe(false);
    expect(dicasPresentes({ ...ok, bosqueCuidavel: false }).lilia).toBe(false);
  });
  it('relaxar vence a Lilia (prioridade), e ausente/dormindo nada aparece', () => {
    const p = dicasPresentes({ ...base, metaDoDia: true, bosqueCuidavel: true });
    expect(escolherDica(p, {}, NOW, 'dourada')).toBe('relaxar');
    expect(Object.values(dicasPresentes({ ...base, presente: false, fome: 'starving', metaDoDia: true, bosqueCuidavel: true })).some(Boolean)).toBe(false);
    expect(DICA_PRIORIDADE).toEqual(['relaxar', 'fome', 'cochilo', 'lilia']);
  });
  it('o fato do servidor para o Grove: planta de pé, não madura, ação sorteável ou sorteada', () => {
    const v = (o = {}) => ({ planted: true, mature: false, canDraw: true, task: null as 'water' | 'protect' | null, ...o });
    expect(bosqueCuidavel(v())).toBe(true);
    expect(bosqueCuidavel(v({ canDraw: false, task: 'water' }))).toBe(true);
    expect(bosqueCuidavel(v({ canDraw: false, task: null }))).toBe(false);
    expect(bosqueCuidavel(v({ mature: true }))).toBe(false);
    expect(bosqueCuidavel(v({ planted: false }))).toBe(false);
    expect(bosqueCuidavel(null)).toBe(false);
  });
});

describe('§333 destinos alcançáveis', () => {
  it('o Refúgio está na Forja e é sempre aberto; o Grove é do Hall e (sem limite por level) abre no Vínculo 1', () => {
    expect(DICA_DESTINO).toEqual({ relaxar: 'forja.refugio', lilia: 'hall.grove' });
    expect(BUILDINGS_ALWAYS_OPEN).toContain('forja.refugio');
    expect(buildingDestination('forja.refugio')).toEqual({ kind: 'lot', area: 'forja', lot: 'refugio' });
    expect(buildingDestination('hall.grove')).toEqual({ kind: 'lot', area: 'hall', lot: 'grove' });
    expect(buildingGateFor('hall.grove', 1).open).toBe(true);
  });
});

describe('§333 frequência (cooldown por tipo)', () => {
  it('um tipo não volta antes do seu cooldown; depois volta', () => {
    const p = dicasPresentes({ ...base, refugioDaEnergia: false });
    const vistas = marcarVista({}, 'cochilo', NOW);
    expect(escolherDica(p, vistas, NOW + DICA_COOLDOWN_MS.cochilo - 1, 'comum')).toBeNull();
    expect(escolherDica(p, vistas, NOW + DICA_COOLDOWN_MS.cochilo, 'comum')).toBe('cochilo');
  });
  it('é por TIPO: a fome em cooldown não segura o cochilo', () => {
    const p = dicasPresentes({ ...base, refugioDaEnergia: false, fome: 'fair' });
    expect(escolherDica(p, {}, NOW, 'comum')).toBe('fome');
    expect(escolherDica(p, marcarVista({}, 'fome', NOW), NOW + 1000, 'comum')).toBe('cochilo');
  });
  it('dourada em cooldown cede à próxima dourada', () => {
    const p = dicasPresentes({ ...base, metaDoDia: true, bosqueCuidavel: true });
    expect(escolherDica(p, marcarVista({}, 'relaxar', NOW), NOW + 1000, 'dourada')).toBe('lilia');
  });
  it('cooldowns têm horas, não minutos (sem spam)', () => {
    for (const t of DICA_TIPOS) expect(DICA_COOLDOWN_MS[t]).toBeGreaterThanOrEqual(4 * H);
  });
  it('relógio que voltou não prende a dica para sempre', () => {
    expect(emCooldown({ fome: NOW + 10 * H }, 'fome', NOW)).toBe(false);
  });
  it('leitura tolerante do aparelho: lixo e tipo desconhecido saem', () => {
    expect(sanitizeDicaVistas(null)).toEqual({});
    expect(sanitizeDicaVistas([1])).toEqual({});
    expect(sanitizeDicaVistas({ fome: 5, xx: 9, lilia: 'a', cochilo: NaN })).toEqual({ fome: 5 });
    expect(sanitizeDicaVistas({ __proto__: { fome: 5 } })).toEqual({});
  });
});

describe('§333 falas: voz do Soulmon, sem cobrança, nos dois idiomas', () => {
  const PROIBIDAS = /deveria|devia|atras|falh|esquece|finalmente|até que enfim|preguiç|desculpa|culpa|perdeu|n[ãa]o perca|você precisa|should|late\b|failed|forgot|finally|lazy|guilt|lost|don'?t miss|you must|hurry|\d/i;
  for (const t of DICA_TIPOS) {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      it(`${t}/${lang}`, () => {
        const f = dicaTexto(t, lang);
        expect(f.length).toBeGreaterThan(10);
        expect(f).not.toMatch(PROIBIDAS);
      });
    }
  }
  it('as falas pedidas pelo dono, literais', () => {
    expect(dicaTexto('relaxar', 'pt-BR')).toBe('Estou cansado. Bem que eu poderia usar um relaxamento...');
    expect(dicaTexto('cochilo', 'pt-BR')).toBe('Estou cansado. Bem que eu poderia tirar um cochilo agora para me recuperar mais rápido.');
    expect(dicaTexto('fome', 'pt-BR')).toBe('Nossa, estou com fome. De barriga cheia minha energia recupera mais rápido.');
    expect(dicaTexto('lilia', 'pt-BR')).toBe('A gente poderia visitar a Lilia lá no Grove.');
  });
  it('a Lilia é a NPC do Grove no código', () => {
    const voz = readFileSync(new URL('./areaNpcVoice.ts', import.meta.url), 'utf8');
    expect(voz).toMatch(/'hall:grove': \{\s*namePt: 'Lilia/);
  });
  it('o rótulo dourado anuncia o destino', () => {
    expect(dicaAria('relaxar', 'pt-BR')).toBe('Ir ao Refúgio da Forja');
    expect(dicaAria('lilia', 'en-US')).toBe('Open the Grove');
  });
});
