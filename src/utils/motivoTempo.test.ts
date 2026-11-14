/**
 * Tempo: OU ampulheta OU relógio, nunca os dois, no máximo UM motivo pequeno (dono, 13/11/2026, REGISTRO §324).
 * Mede o prompt FINAL de sprite (o que vai para o gerador), para TODO elemento de tempo (o próprio e os combinados de 2, 3 e 4).
 */
import { describe, it, expect } from 'vitest';
import { umMotivoDeTempo, motivosNoTexto, semClausulaTempo, CLAUSULA_TEMPO_INICIO, motivoTempoPorSemente } from './motivoTempo';
import { stagesComElemento, ehElementoDeTempo, motivoTempoDoElemento } from './elementoCombinado';
import { ESSENCE_ELEMENT_IDS } from './elementDex';
import { generateOracle } from '../test/oracleSync';

const NUNCA_OS_DOIS = 'never both an hourglass and a clock on the same creature';
const FUNDO = 'Tamagotchi-style v-pet sprite, 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe:';
/** Três prompts crus: sem motivo, com ampulheta, e o caso do dono (os dois juntos, como o Oráculo antigo entregava). */
const CRUS = {
  neutro: `Generate this RPG creature. ${FUNDO} lizard-owl, Sky Cleric. Flat dark violet and ash-gray colors.`,
  ampulheta: `Generate this RPG creature. ${FUNDO} lizard-owl, Sky Cleric, with an hourglass. Flat dark violet and ash-gray colors.`,
  osDois: `Generate this RPG creature. ${FUNDO} lizard-owl, Sky Cleric, hourglass and clockwork motifs, with clock-hand blades. Flat dark violet and ash-gray colors.`,
};
const TEMPO = ESSENCE_ELEMENT_IDS.filter(ehElementoDeTempo);
type P = { imagePrompt: string; imagePromptFallback: string };
const gerar = (cru: string, elemento: string): P =>
  stagesComElemento([{ stage: 'rookie', imagePrompt: cru, imagePromptFallback: cru }] as never, undefined, { rookie: elemento }, 'sombra')![0] as P;

describe('todo elemento de tempo: no máximo UM dos dois motivos, e a instrução de nunca os dois', () => {
  it('a lista cobre o tempo e os combinados dele (cronomancia, entropia, eon, ruína, ocaso, instante, aceleração, contratempo, florescer, frenesi…)', () => {
    for (const id of ['tempo', 'cronomancia', 'entropia', 'eon', 'ruina', 'ocaso', 'instante', 'aceleracao', 'contratempo', 'florescer', 'frenesi', 'relojoaria', 'duelista_temporal'])
      expect(TEMPO, id).toContain(id);
    expect(TEMPO.length).toBeGreaterThan(30);
  });
  for (const [nome, cru] of Object.entries(CRUS)) {
    it(`prompt cru ${nome}: ${TEMPO.length} elementos, cada um com <= 1 família e a cláusula uma vez só`, () => {
      const ruins: string[] = [];
      for (const id of TEMPO) for (const p of [gerar(cru, id).imagePrompt, gerar(cru, id).imagePromptFallback]) {
        const fam = motivosNoTexto(semClausulaTempo(p));
        const clausulas = p.split(CLAUSULA_TEMPO_INICIO).length - 1;
        if (fam.length > 1 || clausulas !== 1 || !p.includes(NUNCA_OS_DOIS)) ruins.push(`${id}: ${fam.join('+')} x${clausulas}`);
      }
      expect(ruins).toEqual([]);
    });
  }
  it('a variante do elemento manda: ruína/ocaso/erosão → ampulheta; instante/aceleração/relojoaria/contratempo → relógio; tempo puro → a criatura', () => {
    for (const id of ['ruina', 'ocaso', 'erosao', 'florescer']) expect(motivoTempoDoElemento(id), id).toBe('ampulheta');
    for (const id of ['instante', 'aceleracao', 'relojoaria', 'contratempo', 'duelista_temporal']) expect(motivoTempoDoElemento(id), id).toBe('relogio');
    expect(motivoTempoDoElemento('tempo')).toBeUndefined();
    expect(motivoTempoDoElemento('fogo')).toBeUndefined();
    // Instante (relógio) troca a ampulheta do prompt cru; Ocaso (ampulheta) troca os ponteiros.
    expect(motivosNoTexto(gerar(CRUS.osDois, 'instante').imagePrompt)).toEqual(['relogio']);
    expect(motivosNoTexto(gerar(CRUS.osDois, 'ocaso').imagePrompt)).toEqual(['ampulheta']);
  });
  it('tempo puro: o motivo que a criatura já tem fica (ampulheta do Oráculo não vira relógio por causa do relógio de sol do descritor)', () => {
    expect(motivosNoTexto(gerar(CRUS.ampulheta, 'tempo').imagePrompt)).toEqual(['ampulheta']);
  });
  it('estável e idempotente: mesma criatura, mesmo lado; rodar de novo não muda nada', () => {
    const a = gerar(CRUS.neutro, 'tempo').imagePrompt;
    expect(gerar(CRUS.neutro, 'tempo').imagePrompt).toBe(a);
    expect(umMotivoDeTempo(a, { semente: 'x' })).toBe(a);
    expect(motivoTempoPorSemente('abc')).toBe(motivoTempoPorSemente('abc'));
    const lados = new Set(Array.from({ length: 40 }, (_, i) => motivoTempoPorSemente(`criatura-${i}`)));
    expect(lados).toEqual(new Set(['ampulheta', 'relogio']));
  });
  it('elemento sem tempo e prompt sem motivo: nada muda', () => {
    expect(umMotivoDeTempo(CRUS.neutro, { semente: 's' })).toBe(CRUS.neutro);
    expect(gerar(CRUS.neutro, 'fogo').imagePrompt).not.toContain(CLAUSULA_TEMPO_INICIO);
  });
});

describe('Oráculo: nenhuma forma sai com ampulheta E relógio', () => {
  it('80 criaturas x todas as formas: <= 1 família fora da cláusula; quem cita motivo leva a cláusula', () => {
    const ruins: string[] = [];
    let comMotivo = 0;
    for (let i = 0; i < 80; i++) {
      const r = generateOracle({ fullName: `Pessoa ${i} Tempo`, birthDate: `19${50 + (i % 49)}-0${1 + (i % 9)}-1${i % 10}`, birthTime: '12:00', birthPlace: 'Recife, Brasil' }, i);
      const formas = [...r.creature.stages, ...(r.creature.bbPrompts ? [r.creature.bbPrompts] : [])];
      for (const f of formas) for (const p of [f.imagePrompt, f.imagePromptFallback]) {
        const fam = motivosNoTexto(p);
        if (fam.length) comMotivo++;
        if (fam.length > 1 || (fam.length === 1 && !p.includes(NUNCA_OS_DOIS))) ruins.push(`${i}: ${fam.join('+')}`);
      }
    }
    expect(ruins).toEqual([]);
    expect(comMotivo).toBeGreaterThan(0); // a régua mediu algo (luz/industrial puxam o tema de tempo)
  });
});
