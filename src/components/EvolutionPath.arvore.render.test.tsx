// @vitest-environment jsdom
/** Centro de Evolução como ÁRVORE (09/11/2026, dono): rookie no topo, 3 caminhos com rótulo no INÍCIO, convergem no ultra; ícone de estágio nos nós. */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fangmon',
  description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over,
} as CreatureStage);
const NOMES = { champion: 'Champion', perfeito: 'Ultimate', mega: 'Mega' } as const;
const ramos = [['poder', 'Pw'], ['harmonia', 'Hm'], ['benevolencia', 'Bn']] as const;
const stages: CreatureStage[] = [
  stage({}),
  ...ramos.flatMap(([b, n]) => (['champion', 'perfeito', 'mega'] as const).map(st => stage({ stage: st, branch: b, name: `${n}-${st}`, stageName: { pt: NOMES[st], en: NOMES[st] } }))),
  stage({ stage: 'ultra', name: 'Zenite', stageName: { pt: 'Ultra', en: 'Ultra' } }),
];
const props = {
  currentStageId: 'ultimate-harmony', currentBranch: 'harmony' as const,
  powerPoints: 3, harmonyPoints: 30, benevolencePoints: 1, evolutionPoints: 2, gaugeGoal: 30, stages,
  unlockedEvolutions: ['rookie', 'champion-harmony', 'ultimate-harmony', 'champion-power'],
  language: 'pt-BR' as const,
};
const botao = (id: string) => screen.getByTestId(`sm-no-${id}`).querySelector('button[data-soul-node]') as HTMLElement;

describe('árvore do Centro de Evolução', () => {
  it('rótulos Poder / Harmonia / Benevolência no INÍCIO de cada caminho, antes dos nós', () => {
    renderWithCss(<EvolutionPath {...props} />);
    const ordem = [['power', 'Poder'], ['harmony', 'Harmonia'], ['benevolence', 'Benevolência']] as const;
    for (const [attr, nome] of ordem) {
      const col = screen.getByTestId(`sm-caminho-${attr}`);
      const rotulo = within(col).getByTestId(`sm-caminho-rotulo-${attr}`);
      expect(rotulo.textContent).toContain(nome);
      expect(rotulo.querySelector('svg')).toBeTruthy();
      const primeiroNo = col.querySelector('[data-estagio]')!;
      expect(rotulo.compareDocumentPosition(primeiroNo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(col.querySelectorAll('[data-estagio]')).toHaveLength(3);
    }
    const ids = [...screen.getByTestId('sm-arvore').querySelectorAll('[data-estagio]')].map(e => e.getAttribute('data-testid'));
    expect(ids[0]).toBe('sm-no-rookie');
    expect(ids[ids.length - 1]).toBe('sm-no-ultra');
    expect(ids).toHaveLength(11);
    expect(screen.getByTestId('sm-arvore-ligacao-split')).toBeTruthy();
    expect(screen.getByTestId('sm-arvore-ligacao-join')).toBeTruthy();
    // pontas: fio de cobre curvo (1 aceso = ramo atual, ou nenhum se o atual for o do meio; o resto apagado); meio: linha procedural
    const split = screen.getByTestId('sm-arvore-ligacao-split');
    expect(split.querySelectorAll('img[data-conector]').length).toBe(2);
    expect(split.querySelectorAll('svg[data-conector="procedural"] path').length).toBe(1);
    expect(split.querySelector('img')?.getAttribute('src')).toMatch(/curva-(esq|dir)/);
    expect(screen.getByTestId('sm-arvore-ligacao-join').className).toContain('sm2-evo-ligacao--join');
  });
  it('em inglês: Power / Harmony / Benevolence', () => {
    renderWithCss(<EvolutionPath {...props} language="en-US" />);
    expect(screen.getByTestId('sm-caminho-rotulo-power').textContent).toContain('Power');
    expect(screen.getByTestId('sm-caminho-rotulo-benevolence').textContent).toContain('Benevolence');
  });
  it('cada nó de estágio carrega o ícone do estágio; o rookie e o ultra também', () => {
    renderWithCss(<EvolutionPath {...props} />);
    expect(screen.getByTestId('sm-no-champion-power').querySelector('[data-estagio-icone="champion-power"]')).toBeTruthy();
    expect(screen.getByTestId('sm-no-mega-harmony').querySelector('[data-estagio-icone="mega-harmony"]')).toBeTruthy();
    // nenhuma palavra de estágio nem BLOQUEADA/PREVISTA escrita no nó
    const t = screen.getByTestId('sm-no-champion-power').textContent ?? '';
    expect(t).not.toMatch(/Champion|Rookie|BLOQUEADA|LOCKED|FORECAST|PREVISTA/);
    expect(screen.getByTestId('sm-no-rookie').querySelector('[data-estagio-icone="rookie"]')).toBeTruthy();
    expect(screen.getByTestId('sm-no-ultra').querySelector('[data-estagio-icone="ultra"]')).toBeTruthy();
  });
  it('forma trancada mostra "?" e não abre modal', () => {
    renderWithCss(<EvolutionPath {...props} />);
    expect(screen.getByTestId('sm-no-mega-benevolence-interrogacao').textContent).toBe('?');
    expect(screen.getByTestId('sm-no-mega-benevolence').querySelector('button[data-soul-node]')).toBeNull();
    expect(screen.queryByTestId('sm-formas-alt')).toBeNull();
  });
  it('mesmo nível, outro galho: lista para equipar (não degenera)', () => {
    renderWithCss(<EvolutionPath {...props} currentStageId="champion-harmony" onEquipFormaAlt={() => {}} />);
    fireEvent.click(botao('champion-power'));
    expect(screen.getByTestId('sm-formas-alt').textContent).toContain('Formas alternativas');
    expect(screen.getByTestId('sm-formas-alt').textContent).not.toContain('Degenerar para…');
  });
  it('troca de galho no mesmo nível: o botão diz Trocar forma e a troca leva o elemento escolhido junto', () => {
    const chamadas: string[] = [];
    renderWithCss(<EvolutionPath {...props} currentStageId="champion-harmony" formasAlt={{ 'champion-power': ['fogo', 'agua'] }}
      onSwitchForm={(id, el) => chamadas.push(`troca:${id}:${el}`)} onEquipFormaAlt={(id, el) => chamadas.push(`eq:${id}:${el}`)} />);
    fireEvent.click(botao('champion-power'));
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-agua')).getByRole('button', { name: 'Trocar forma' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(chamadas).toEqual(['troca:champion-power:agua']);
  });
  it('forma liberada de nível ACIMA do atual: só leitura, sem degenerar nem botões', () => {
    renderWithCss(<EvolutionPath {...props} currentStageId="champion-harmony" />);
    fireEvent.click(botao('ultimate-harmony'));
    expect(screen.getByTestId('sm-formas-alt')).toBeTruthy();
    expect(screen.queryByText('Degenerar para…')).toBeNull();
    expect(within(screen.getByTestId('sm-formas-alt')).queryAllByRole('button', { name: /Equipar|Degenerar/ })).toHaveLength(0);
  });
});
