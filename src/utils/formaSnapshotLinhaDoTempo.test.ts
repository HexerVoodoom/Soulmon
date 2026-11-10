/**
 * LINHA DO TEMPO REAL do dono (10/11/2026), com as funções reais de evoluir/degenerar/trocar:
 * 1) Champion → Ultimate natural na linha Poder (elemento do estágio: Sabá; base Sombra, sem poção);
 * 2) degenera, usa uma poção (marcial) e evolui de novo para Ultimate Poder;
 * 3) degenera, usa poção de FADA e evolui pela Harmonia (ultimate-harmony@fada).
 * Regras dele: cada forma guarda o SEU elemento; trocar de forma assume o elemento DA FORMA; a poção só vale para a evolução em que
 * foi usada (nunca contamina a foto de outra forma).
 */
import { describe, it, expect } from 'vitest';
import { aoDescerDeForma, capturarForma } from './formaSnapshot';
import { applyPotionOnEvolve } from './elementPotion';
import { registrarFormaAoEvoluir, elementoDaForma } from './formasAlternativas';
import { trocarFormaEstado, type EstadoDeForma } from './formaEquip';
import { petElementOf } from './starterElements';

type S = EstadoDeForma & { unlockedEvolutions: string[]; evolutionPotion?: string };
const SABBAT = { id: 'sabbat', base: 'sombra' };

/** Evoluir como o `handleEvolve` do App: fotografa a saída, aplica a poção pendente, registra a forma nova. */
function evoluir(prev: S, destino: string): S {
  const base = applyPotionOnEvolve(capturarForma(prev)) as S;
  const evolved: S = { ...base, evolutionStage: destino, elementoJornada: { v: 1, u: 0.5, estagios: { ...prev.elementoJornada?.estagios, ultimate: SABBAT } } };
  return { ...evolved, ...registrarFormaAoEvoluir(prev.formasAlt, prev.formaAltEquipada, destino, evolved.potionElement ?? elementoDaForma(evolved.elementoJornada, destino)) } as S;
}
/** Degenerar como o `handleDegenerate`: fotografa a que cai e volta ao elemento da de baixo. */
const degenerar = (prev: S, destino: string): S => aoDescerDeForma(prev, { ...prev, evolutionStage: destino }) as S;

function linhaDoTempo() {
  const champion: S = {
    evolutionStage: 'champion-power', unlockedEvolutions: ['rookie', 'champion-power', 'champion-harmony'],
    elementoJornada: { v: 1, u: 0.5, estagios: { rookie: { id: 'sombra', base: 'sombra' }, champion: { id: 'sombra', base: 'sombra' } } },
    soulmonMeta: { dominantElement: 'sombra' },
  } as never;
  const e1 = evoluir(champion, 'ultimate-power');
  const c1 = degenerar(e1, 'champion-power');
  const e2 = evoluir({ ...c1, evolutionPotion: 'marcial' }, 'ultimate-power');
  const c2 = degenerar(e2, 'champion-harmony');
  const e3 = evoluir({ ...c2, evolutionPotion: 'fada' }, 'ultimate-harmony');
  return { e1, e2, e3 };
}
const comUnlocked = (s: S): S => ({ ...s, unlockedEvolutions: ['rookie', 'champion-power', 'champion-harmony', 'ultimate-power', 'ultimate-harmony'] });

describe('linha do tempo real: cada forma guarda o SEU elemento', () => {
  it('passo 1: a evolução natural na linha Poder tem o elemento do estágio (Sabá), sem poção', () => {
    const { e1 } = linhaDoTempo();
    expect(petElementOf(e1 as never)).toBe('sabbat');
    expect(e1.potionElement).toBeUndefined();
  });
  it('passo 3: Harmonia com poção Fada é Fada', () => {
    const { e3 } = linhaDoTempo();
    expect(petElementOf(e3 as never)).toBe('fada');
    expect(e3.formaAltEquipada?.['ultimate-harmony']).toBe('fada');
  });
  it('nenhuma foto de outra forma guarda a poção Fada (só a da Harmonia, ao sair dela)', () => {
    const { e3 } = linhaDoTempo();
    const saindo = capturarForma(e3 as never) as unknown as S;
    const comFada = Object.entries(saindo.formaSnapshots ?? {}).filter(([, f]) => f.pocao === 'fada').map(([k]) => k);
    expect(comFada).toEqual(['ultimate-harmony@fada']);
  });
  it('trocar de forma assume o elemento DA FORMA e voltar restaura', () => {
    const { e3 } = linhaDoTempo();
    const s = comUnlocked(e3);
    const marcial = trocarFormaEstado(s, 'ultimate-power', 'marcial');
    expect(petElementOf(marcial as never)).toBe('marcial');
    const sabba = trocarFormaEstado(marcial, 'ultimate-harmony', 'fada');
    expect(petElementOf(sabba as never)).toBe('fada');
    const poderSabba = trocarFormaEstado(s, 'ultimate-power', 'sabbat');
    expect(petElementOf(poderSabba as never)).toBe('sabbat');
  });
  it('evoluir de novo sem poção volta ao elemento base do estágio (a poção não é permanente)', () => {
    const { e3 } = linhaDoTempo();
    const mega = applyPotionOnEvolve({ ...e3, evolutionStage: 'mega-harmony' });
    expect(mega.potionElement).toBeUndefined();
  });
});
