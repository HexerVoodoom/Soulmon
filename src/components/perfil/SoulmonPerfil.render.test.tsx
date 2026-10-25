// @vitest-environment jsdom
/**
 * O PERFIL DO SOULMON (beta-2, 11) — a folha: PT e EN, só valores qualitativos, linhas que somem quando o dado não existe,
 * ícones próprios (imagens) em todas as linhas e alvos de leitura >= 44.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { SoulmonPerfil } from './SoulmonPerfil';
import { petElementOf } from '../../utils/starterElements';
import { elementIcon } from '../../utils/elementIconArt';
import { elementoNomeDe } from '../../utils/soulProfile/ficha/elementoNome';

installDomGlobals();
afterEach(cleanup);

const golpe = (tipo: 'basica' | 'especial', id: string) => ({
  tipo, nome: { pt: tipo === 'basica' ? 'Garra' : 'Fúria de Fogo', en: tipo === 'basica' ? 'Claw' : 'Fire Fury' }, descricao: { pt: '', en: '' },
  elementoId: id, elementoNome: { pt: id, en: id }, escolaId: 'combate_fisico', recursoId: 'mana', area: { tipo: 'unico' }, custo: 'baixo',
});
const skills = {
  rookie: { basica: golpe('basica', 'fogo'), especial: golpe('especial', 'agua'), elementoDominante: { id: 'fogo', nome: { pt: 'Fogo', en: 'Fire' } } },
} as never;

const full = { evolutionStage: 'rookie', petPassive: 'guloso', skills, petElement: 'fogo', equipment: { owned: ['eq-nucleo-t1'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 }, forge: { v: 2, levels: { 'eq-nucleo-t1': 6 }, picks: {} } };
const rows = (c: HTMLElement) => [...c.querySelectorAll('[data-perfil-row]')].map(r => r.getAttribute('data-perfil-row'));

describe('SoulmonPerfil', () => {
  it('completo (PT): personalidade, atributo, equipamento, elemento, ataque, especial, efeito e elemento do especial', () => {
    const { container } = render(<SoulmonPerfil language="pt-BR" input={full} />);
    expect(rows(container)).toEqual(['personalidade', 'atributo', 'equipamento', 'elemento', 'especial']);
    const txt = container.textContent!;
    expect(txt).toContain('Guloso');
    expect(txt).toContain('Nv 6');
    expect(txt).toContain('Fúria de Fogo');
    expect(txt).toMatch(/Força|Resistência|Agilidade/);
    expect(txt).toMatch(/Corpo a corpo|À distância/);
  });

  it('EN: rótulos em inglês', () => {
    const { container } = render(<SoulmonPerfil language="en-US" input={full} />);
    const txt = container.textContent!;
    expect(txt).toContain('Foodie');
    expect(txt).toContain('Lv 6');
    expect(txt).toContain('Fire Fury');
    expect(txt).toMatch(/Strength|Resilience|Agility/);
    expect(txt).toMatch(/Melee|Ranged/);
    expect(txt).not.toMatch(/Força|Personalidade|Nenhuma/);
  });

  it('sem ficha, sem traço e sem peça: some o que o app não tem (nada inventado) e o equipamento diz "Nenhuma peça"', () => {
    const { container } = render(<SoulmonPerfil language="pt-BR" input={{ evolutionStage: 'rookie', petElement: 'agua' }} />);
    expect(rows(container)).toEqual(['atributo', 'equipamento', 'elemento']);
    expect(container.querySelector('[data-perfil-row="equipamento"]')!.textContent).toContain('Nenhuma peça');
  });

  it('elemento do especial igual ao do básico: o especial continua na linha 2, com nome, ícone do elemento e efeito', () => {
    const sk = { rookie: { ...(skills as { rookie: object }).rookie, especial: golpe('especial', 'fogo') } } as never;
    const { container } = render(<SoulmonPerfil language="en-US" input={{ ...full, skills: sk }} />);
    expect(rows(container)).toEqual(['personalidade', 'atributo', 'equipamento', 'elemento', 'especial']);
    const esp = container.querySelector('[data-perfil-row="especial"]')!;
    expect(esp.textContent).toContain('Fire Fury');
    expect(esp.textContent).toMatch(/Damage|Healing|Shield|Support|Weakens/);
    expect(esp.querySelector('img')!.getAttribute('src')).toBe(elementIcon('fogo'));
    const bas = container.querySelector('[data-perfil-row="elemento"]')!;
    expect(bas.textContent).toContain('Claw');
    expect(bas.querySelector('img')!.getAttribute('src')).toBe(elementIcon('fogo'));
  });

  it('cada campo explica o impacto no jogo (PT e EN)', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const { container } = render(<SoulmonPerfil language={lang} input={full} />);
      for (const id of ['personalidade', 'atributo', 'equipamento', 'elemento', 'especial']) {
        const hint = container.querySelector(`[data-perfil-row="${id}"] [data-perfil-hint]`);
        expect(hint?.textContent?.length, `${lang}:${id}`).toBeGreaterThan(10);
      }
      cleanup();
    }
  });

  it('sem pontuação: o único dígito da folha é o nível do equipamento', () => {
    const { container } = render(<SoulmonPerfil language="pt-BR" input={full} />);
    container.querySelectorAll('[data-perfil-hint]').forEach(h => h.remove()); // o subtítulo de impacto é prosa (a descrição do traço cita número de regra)
    const sem = container.textContent!.replace('Nv 6', '');
    expect(sem).not.toMatch(/\d/);
  });

  it('toda linha tem ícone próprio (imagem) e altura de leitura >= 44', () => {
    const { container } = render(<SoulmonPerfil language="pt-BR" input={full} />);
    for (const r of container.querySelectorAll<HTMLElement>('[data-perfil-row]')) {
      expect(r.querySelector('img'), r.getAttribute('data-perfil-row')!).not.toBeNull();
      expect(parseInt(r.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('SoulmonPerfil: elemento do oráculo normalizado (dono, 20/10/2026, REGISTRO §150)', () => {
  const linha = (lang: 'pt-BR' | 'en-US', petElement: string | undefined) => {
    const { container } = render(<SoulmonPerfil language={lang} input={{ evolutionStage: 'rookie', petElement }} />);
    const row = container.querySelector('[data-perfil-row="elemento"]')!;
    return { txt: row.textContent!, src: row.querySelector('img')?.getAttribute('src') };
  };
  const dom = (id: string) => petElementOf({ soulmonMeta: { dominantElement: id } });
  const CASOS: Array<[string, string, string, string]> = [['planta', 'vida', 'Vida', 'Life'], ['industrial', 'aco', 'Aço', 'Steel']];
  for (const [cru, classe, pt, en] of CASOS) {
    it(`${cru} → ${classe}: nome nas duas línguas, ícone certo, sem id cru`, () => {
      const a = linha('pt-BR', dom(cru));
      expect(a.txt).toContain(pt);
      expect(a.txt).not.toContain(cru);
      expect(a.src).toBe(elementIcon(classe));
      cleanup();
      const b = linha('en-US', dom(cru));
      expect(b.txt).toContain(en);
      expect(b.txt).not.toContain(cru);
      expect(b.src).toBe(elementIcon(classe));
    });
  }
  for (const id of ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz']) {
    it(`${id} (já base) fica inalterado`, () => {
      const a = linha('pt-BR', dom(id));
      expect(a.txt).toContain(elementoNomeDe(id).pt);
      expect(a.src).toBe(elementIcon(id));
      cleanup();
      expect(linha('en-US', dom(id)).txt).toContain(elementoNomeDe(id).en);
    });
  }
});
