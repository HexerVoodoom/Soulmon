// @vitest-environment jsdom
/**
 * O PERFIL DO SOULMON (beta-2, 11) — a folha: PT e EN, só valores qualitativos, linhas que somem quando o dado não existe,
 * ícones próprios (imagens) em todas as linhas e alvos de leitura >= 44.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { SoulmonPerfil } from './SoulmonPerfil';

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
    expect(rows(container)).toEqual(['personalidade', 'atributo', 'equipamento', 'elemento', 'ataque', 'especial', 'efeito', 'elemento-especial']);
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
    expect(rows(container)).toEqual(['atributo', 'equipamento', 'elemento', 'ataque']);
    expect(container.querySelector('[data-perfil-row="equipamento"]')!.textContent).toContain('Nenhuma peça');
  });

  it('o elemento do especial some quando é o mesmo do principal (não repete)', () => {
    const sk = { rookie: { ...(skills as { rookie: object }).rookie, especial: golpe('especial', 'fogo') } } as never;
    const { container } = render(<SoulmonPerfil language="pt-BR" input={{ ...full, skills: sk }} />);
    expect(rows(container)).not.toContain('elemento-especial');
  });

  it('sem pontuação: o único dígito da folha é o nível do equipamento', () => {
    const { container } = render(<SoulmonPerfil language="pt-BR" input={full} />);
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
