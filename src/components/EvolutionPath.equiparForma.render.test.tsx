// @vitest-environment jsdom
/**
 * Bug do dono (10/11/2026, 3ª rodada): no modal de formas, escolher a forma ORIGINAL (a 1ª) equipava a SEGUNDA (Sabá) e o elemento
 * seguia Fada. Teste de TELA: o `EvolutionPath` real, o clique real nos botões e os MESMOS redutores do App (`utils/formaEquip.ts`),
 * com um Soulmon de base Sombra, poção Fada aplicada e duas formas no Ultimate.
 */
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';
import { equiparFormaAltEstado, trocarFormaEstado, type EstadoDeForma } from '../utils/formaEquip';
import { petElementOf } from '../utils/starterElements';

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
const e = (url: string) => ({ url, formId: 'x', provider: 'p', at: 1 });
const botao = (id: string) => screen.getByTestId(`sm-no-${id}`).querySelector('button[data-soul-node]') as HTMLElement;

type Estado = EstadoDeForma & { unlockedEvolutions: string[] };
const salvo = (equipada: string, sprites: Record<string, ReturnType<typeof e>>): Estado => ({
  evolutionStage: 'ultimate-harmony',
  unlockedEvolutions: ['rookie', 'champion-harmony', 'champion-power', 'ultimate-harmony', 'ultimate-power'],
  elementoJornada: { v: 1, u: 0.5, estagios: { rookie: { id: 'sombra', base: 'sombra' }, ultimate: { id: 'sombra', base: 'sombra' } } },
  potionElement: 'fada',
  formasAlt: { 'ultimate-harmony': ['fada', 'sabbat'], 'ultimate-power': ['sabbat'] },
  formaAltEquipada: { 'ultimate-harmony': equipada, 'ultimate-power': 'sabbat' },
  spriteLibrary: { sprites, failures: {}, pendingTune: null, reverted: [] } as never,
});

let atual: Estado;
function Harness({ inicial }: { inicial: Estado }) {
  const [s, setS] = useState(inicial);
  atual = s;
  return (
    <EvolutionPath
      currentStageId={s.evolutionStage} currentBranch="harmony" powerPoints={3} harmonyPoints={30} benevolencePoints={1} evolutionPoints={2} gaugeGoal={30}
      stages={stages} unlockedEvolutions={s.unlockedEvolutions} language="pt-BR"
      formasAlt={s.formasAlt} formaAltEquipada={s.formaAltEquipada}
      onEquipFormaAlt={(id, el) => setS(p => equiparFormaAltEstado(p, id, el))}
      onSwitchForm={(id, el) => setS(p => trocarFormaEstado(p, id, el))}
    />
  );
}

describe('modal de formas: clicar na ORIGINAL equipa a original', () => {
  for (const [rotulo, sprites] of [
    ['arte da original na chave da forma', { 'ultimate-harmony': e('ORIG'), 'ultimate-harmony@sabbat': e('SABBAT') }],
    ['arte da original só em forma@elemento', { 'ultimate-harmony@fada': e('ORIG'), 'ultimate-harmony@sabbat': e('SABBAT') }],
  ] as const) {
    it(`Sabá equipada → clicar na 1ª (Fada) equipa a 1ª — ${rotulo}`, () => {
      renderWithCss(<Harness inicial={salvo('sabbat', sprites as never)} />);
      fireEvent.click(botao('ultimate-harmony'));
      fireEvent.click(within(screen.getByTestId('sm-forma-alt-fada')).getByRole('button', { name: 'Equipar' }));
      expect(atual.formaAltEquipada?.['ultimate-harmony']).toBe('fada');
      expect(petElementOf(atual as never)).toBe('fada');
    });
  }
  it('1ª equipada → clicar na 2ª (Sabá) equipa a 2ª e o elemento vira Sabá', () => {
    renderWithCss(<Harness inicial={salvo('fada', { 'ultimate-harmony': e('ORIG'), 'ultimate-harmony@sabbat': e('SABBAT') })} />);
    fireEvent.click(botao('ultimate-harmony'));
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-sabbat')).getByRole('button', { name: 'Equipar' }));
    expect(atual.formaAltEquipada?.['ultimate-harmony']).toBe('sabbat');
    expect(petElementOf(atual as never)).toBe('sabbat');
  });
  it('de outra linha: "Trocar forma" para a forma Poder (Sabá) leva o elemento Sabá', () => {
    renderWithCss(<Harness inicial={salvo('fada', { 'ultimate-harmony': e('ORIG'), 'ultimate-power@sabbat': e('PODER') })} />);
    fireEvent.click(botao('ultimate-power'));
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-sabbat')).getByRole('button', { name: 'Trocar forma' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(atual.evolutionStage).toBe('ultimate-power');
    expect(petElementOf(atual as never)).toBe('sabbat');
  });
});
