// @vitest-environment jsdom
/**
 * SAVE REAL DO DONO (anonimizado, 10/11/2026): Soulmon de base Sombra, poção Fada em Harmonia (Ultimate), estágio Ultimate registrado como
 * Sabá, snapshots contaminados (`ultimate-power@original` = poção Fada + elemento Sabá). Regra: a forma ORIGINAL é sempre o elemento
 * BASE (Sombra); a Sabá é Sabá; Harmonia é Fada. Teste de TELA: clica "Trocar forma"/"Equipar" no modal e confere o elemento exibido.
 */
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import type { CreatureStage } from '../utils/oracle';
import { equiparFormaAltEstado, trocarFormaEstado, type EstadoDeForma } from '../utils/formaEquip';
import { sanitizeFormaSnapshots } from '../utils/formaSnapshot';
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
const botao = (id: string) => screen.getByTestId(`sm-no-${id}`).querySelector('button[data-soul-node]') as HTMLElement;

const SABBAT = { id: 'sabbat', base: 'sombra' };
type Estado = EstadoDeForma & { unlockedEvolutions: string[] };
const saveDoDono = (): Estado => ({
  evolutionStage: 'ultimate-harmony',
  unlockedEvolutions: ['rookie', 'champion-harmony', 'champion-power', 'ultimate-harmony', 'ultimate-power'],
  potionElement: 'fada',
  elementoJornada: { v: 1, u: 0.5, estagios: { ultimate: SABBAT } },
  soulmonMeta: { dominantElement: 'sombra' },
  formasAlt: { 'ultimate-power': ['original', 'sabbat'], 'ultimate-harmony': ['fada'] },
  formaAltEquipada: { 'ultimate-power': 'sabbat', 'ultimate-harmony': 'fada' },
  formaSnapshots: sanitizeFormaSnapshots({
    'champion-benevolence': { pocao: 'vileza' },
    'ultimate-harmony@fada': { pocao: 'fada', elemento: SABBAT },
    'ultimate-power@sabbat': { pocao: 'fada', elemento: SABBAT },
    'ultimate-power@original': { pocao: 'fada', elemento: SABBAT },
  }),
} as never);

let atual: Estado;
function Harness() {
  const [s, setS] = useState(saveDoDono);
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
const el = () => petElementOf(atual as never);

describe('save real do dono: original = Sombra, Sabá = Sabá, Harmonia = Fada', () => {
  it('Trocar forma original → Equipar Sabá → Equipar original, conferindo o elemento a cada passo', () => {
    renderWithCss(<Harness />);
    expect(el()).toBe('fada');
    // Harmonia → Poder (original)
    fireEvent.click(botao('ultimate-power'));
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-original')).getByRole('button', { name: 'Trocar forma' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(atual.evolutionStage).toBe('ultimate-power');
    expect(atual.formaAltEquipada?.['ultimate-power']).toBe('original');
    expect(el()).toBe('sombra');
    // agora na forma atual: equipar Sabá
    fireEvent.click(botao('ultimate-power'));
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-sabbat')).getByRole('button', { name: 'Equipar' }));
    expect(atual.formaAltEquipada?.['ultimate-power']).toBe('sabbat');
    expect(el()).toBe('sabbat');
    // e de volta à original
    fireEvent.click(botao('ultimate-power'));
    fireEvent.click(within(screen.getByTestId('sm-forma-alt-original')).getByRole('button', { name: 'Equipar' }));
    expect(atual.formaAltEquipada?.['ultimate-power']).toBe('original');
    expect(el()).toBe('sombra');
  });
  it('a migração tira poção e elemento combinado de qualquer foto `forma@original`', () => {
    const f = saveDoDono().formaSnapshots!;
    expect(f['ultimate-power@original']).toEqual({});
    expect(f['ultimate-harmony@fada'].pocao).toBe('fada');
  });
});
