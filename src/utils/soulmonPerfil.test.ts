/**
 * O PERFIL DO SOULMON (beta-2, 11) — a leitura pura. Cada campo vem do dono dele e some (`null`) quando o app não o tem;
 * o elemento e o ataque saíram da Arena livre e moram só aqui (11.3), pela MESMA fonte (`fighterIdentity`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  atributoPrincipal, buildPerfil, fichaStageOf, nivelDoEquipamento, PERFIL_ATRIBUTO, PERFIL_EFEITO, PERFIL_FORMA,
} from './soulmonPerfil';
import { fighterIdentity } from './fighterIdentity';
import { SPECIAL_FAMILIES } from './combate/specials';
import { PET_PASSIVES } from './passives';
import { FORGE_PIECES } from './forge';

const golpe = (tipo: 'basica' | 'especial', id: string, escolaId: string, extra: object = {}) => ({
  tipo, nome: { pt: tipo === 'basica' ? 'Garra' : 'Fúria de Fogo', en: tipo === 'basica' ? 'Claw' : 'Fire Fury' }, descricao: { pt: '', en: '' },
  elementoId: id, elementoNome: { pt: id, en: id }, escolaId, recursoId: 'mana', area: { tipo: 'unico' }, custo: 'baixo', ...extra,
});
const skills = (basEl: string, espEl: string, escEsp = 'conjuracao', familia?: string) => ({
  rookie: {
    basica: golpe('basica', basEl, 'combate_fisico'),
    especial: golpe('especial', espEl, escEsp, familia ? { familia } : {}),
    elementoDominante: { id: basEl, nome: { pt: basEl, en: basEl } },
  },
}) as never;

const base = { evolutionStage: 'rookie' };

describe('atributo principal — qualitativo', () => {
  it('o maior dos três; empate: Força > Resistência > Agilidade', () => {
    expect(atributoPrincipal({ atk: 9, def: 5, spd: 5 })).toBe('forca');
    expect(atributoPrincipal({ atk: 5, def: 9, spd: 5 })).toBe('resistencia');
    expect(atributoPrincipal({ atk: 5, def: 5, spd: 9 })).toBe('agilidade');
    expect(atributoPrincipal({ atk: 7, def: 7, spd: 7 })).toBe('forca');
    expect(atributoPrincipal({ atk: 4, def: 7, spd: 7 })).toBe('resistencia');
  });
  it('sempre devolve um dos três e todos têm rótulo PT e EN', () => {
    for (const b of [base, { evolutionStage: 'mega-power', powerPoints: 900 }, { evolutionStage: 'ultra', benevolencePoints: 400 }, { evolutionStage: 'x' }]) {
      const p = buildPerfil(b);
      expect(['forca', 'resistencia', 'agilidade']).toContain(p.atributo);
      expect(PERFIL_ATRIBUTO[p.atributo].pt.length).toBeGreaterThan(0);
      expect(PERFIL_ATRIBUTO[p.atributo].en.length).toBeGreaterThan(0);
    }
  });
});

describe('não inventa dado', () => {
  it('sem ficha: nada de especial (nome/efeito/elemento) e o elemento cai no dominante do oráculo', () => {
    const p = buildPerfil({ ...base, petElement: 'agua' });
    expect(p.especial).toBeNull();
    expect(p.elementoId).toBe('agua');
    expect(p.personalidade).toBeNull();
    expect(p.equipamentoNivel).toBeNull();
  });
  it('com ficha: o nome do especial é o da ficha e o efeito é a família da identidade de combate', () => {
    const sk = skills('fogo', 'agua');
    const p = buildPerfil({ ...base, skills: sk });
    expect(p.especial!.nome).toEqual({ pt: 'Fúria de Fogo', en: 'Fire Fury' });
    expect(p.especial!.familia).toBe(fighterIdentity((sk as never as { rookie: never }).rookie).especial.familia);
    expect(SPECIAL_FAMILIES).toContain(p.especial!.familia);
    expect(PERFIL_EFEITO[p.especial!.familia].pt.length).toBeGreaterThan(0);
  });
  it('elemento do especial aparece sempre (igual ao principal também; desconhecido cai no principal)', () => {
    expect(buildPerfil({ ...base, skills: skills('fogo', 'agua') }).especial!.elementoId).toBe('agua');
    expect(buildPerfil({ ...base, skills: skills('fogo', 'fogo') }).especial!.elementoId).toBe('fogo');
    expect(buildPerfil({ ...base, skills: skills('fogo', 'elemento-que-nao-existe') }).especial!.elementoId).toBe('fogo');
  });
  it('a personalidade é o traço de nascimento real; id desconhecido ou ausente = sem linha', () => {
    for (const ps of PET_PASSIVES) expect(buildPerfil({ ...base, petPassive: ps.id }).personalidade?.id).toBe(ps.id);
    expect(buildPerfil({ ...base, petPassive: 'inventado' }).personalidade).toBeNull();
    expect(buildPerfil({ ...base, petPassive: undefined }).personalidade).toBeNull();
  });
  it('o tipo de ataque é a forma do golpe básico (corpo a corpo × à distância), a mesma da luta', () => {
    const sk = skills('fogo', 'agua');
    const p = buildPerfil({ ...base, skills: sk });
    expect(p.forma).toBe(fighterIdentity((sk as never as { rookie: never }).rookie).basico.forma);
    expect(PERFIL_FORMA[p.forma].pt.length).toBeGreaterThan(0);
  });
});

describe('equipamento do Soulsmith', () => {
  const piece = FORGE_PIECES[0].id; // eq-nucleo-t1
  it('sem peça equipada: null', () => {
    expect(nivelDoEquipamento(undefined, undefined)).toBeNull();
    expect(nivelDoEquipamento({ owned: [piece], equipped: {}, fragments: 0 }, undefined)).toBeNull();
  });
  it('equipada mas não possuída (save forjado): ignora', () => {
    expect(nivelDoEquipamento({ owned: [], equipped: { nucleo: piece }, fragments: 0 }, undefined)).toBeNull();
  });
  it('o maior nível entre as equipadas, pelo registro do forge', () => {
    const eq = { owned: ['eq-nucleo-t1', 'eq-carapaca-t1'], equipped: { nucleo: 'eq-nucleo-t1', carapaca: 'eq-carapaca-t1' }, fragments: 0 };
    const forge = { v: 2, levels: { 'eq-nucleo-t1': 4, 'eq-carapaca-t1': 9 }, picks: {} };
    expect(nivelDoEquipamento(eq, forge)).toBe(9);
  });
  it('lixo no save não derruba', () => {
    for (const lixo of [null, 7, 'x', [], { owned: 'x', equipped: 5 }, { owned: [1, 2], equipped: { nucleo: 3 } }]) {
      expect(() => nivelDoEquipamento(lixo, lixo)).not.toThrow();
      expect(nivelDoEquipamento(lixo, lixo)).toBeNull();
    }
  });
});

describe('11.3 — uma fonte só', () => {
  const src = (rel: string) => readFileSync(join(__dirname, rel), 'utf-8');
  it('a Arena livre não lê mais elemento nem golpes do Soulmon; o Perfil lê pela identidade de combate', () => {
    const duelo = src('../components/arena/DueloSheet.tsx');
    expect(duelo).not.toMatch(/fighterIdentity|elementoNomeDe|data-duelo-elemento|data-duelo-golpes/);
    expect(src('soulmonPerfil.ts')).toMatch(/fighterIdentity/);
  });
  it('o Perfil não mostra pontuação: o único número da tela é o nível do equipamento', () => {
    const tela = src('../components/perfil/SoulmonPerfil.tsx');
    expect(tela).not.toMatch(/\.atk|\.def\b|\.spd|powerPoints|harmonyPoints|benevolencePoints/);
  });
  it('fichaStageOf cai em rookie com estágio lixo', () => {
    expect(fichaStageOf('qualquer-coisa')).toBe('rookie');
  });
});
