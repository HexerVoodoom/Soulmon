/**
 * Contrato da intro narrativa (docs/PLANO-INTRO-NARRATIVA.md §9 e §11): sem GameTutorialFlow dentro da intro,
 * copy bilíngue sem emoji nem promessa de saúde, lugar = a Malha, tokens do DS, interruptor próprio.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARIA, FALANTE, INTRO, UI, type Bilingue } from './sequencia/copy';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const SRC = join(AQUI, '..', '..');
const ler = (rel: string) => readFileSync(join(AQUI, rel), 'utf8');
const novos = [
  'sequencia/IntroNarrativa.tsx', 'sequencia/TunelCanvas.tsx', 'sequencia/ArteIntro.tsx', 'sequencia/introCenas.ts', 'sequencia/introMaquina.ts',
  'etapas/EtapaTarefa.tsx', 'etapas/EtapaCorda.tsx', 'etapas/EtapaDuelo.tsx', 'etapas/EtapaAlimentar.tsx',
];

const todasAsFalas = (): Bilingue[] => [...Object.values(INTRO), ...Object.values(ARIA), ...Object.values(FALANTE), ...Object.values(UI)];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const SAUDE = /\b(cura|curar|curado|tratamento|terapia|saúde|saude|healing|heal|therapy|treatment|cure|ansiedade|depressão|depression|anxiety)\b/i;

describe('intro narrativa: contrato', () => {
  it('nenhuma etapa nem a intro monta o GameTutorialFlow (cartão real da Home, sem wizard)', () => {
    for (const f of novos) expect(ler(f), f).not.toMatch(/GameTutorialFlow/);
  });

  it('toda fala existe em EN e PT, não vazia, e PT difere de EN', () => {
    for (const b of todasAsFalas()) {
      expect(b.en.trim().length).toBeGreaterThan(0);
      expect(b.pt.trim().length).toBeGreaterThan(0);
    }
    for (const b of Object.values(INTRO)) expect(b.pt).not.toBe(b.en);
  });

  it('sem emoji em fala nem em narração', () => {
    for (const b of todasAsFalas()) { expect(b.en).not.toMatch(EMOJI); expect(b.pt).not.toMatch(EMOJI); }
  });

  it('sem promessa de saúde, cura ou tratamento', () => {
    for (const b of todasAsFalas()) { expect(b.en).not.toMatch(SAUDE); expect(b.pt).not.toMatch(SAUDE); }
  });

  it('lugar = a Malha: nenhuma fala fala em "outro mundo", "novo mundo" ou "mundo digital"', () => {
    for (const b of todasAsFalas()) {
      expect(b.pt).not.toMatch(/outro mundo|novo mundo|mundo digital|antigo mundo/i);
      expect(b.en).not.toMatch(/other world|new world|digital world|old world/i);
    }
    expect(INTRO.bemVindo2.pt).toContain('Malha');
    expect(INTRO.bemVindo2.en).toContain('Mesh');
  });

  it('a ameaça do Desfeito não culpa a pessoa (L3): a fala não tem a pessoa como causa', () => {
    expect(INTRO.desfeito.pt).not.toMatch(/\b(por sua culpa|você causou|você fez|culpa)\b/i);
    expect(INTRO.desfeito.en).not.toMatch(/\b(your fault|you caused|you did|blame)\b/i);
  });

  it('o código novo não tem fonte numérica nem engrenagem (tokens do DS)', () => {
    for (const f of novos.filter(x => x.endsWith('.tsx') && !x.includes('Alimentar'))) {
      expect(ler(f), f).not.toMatch(/fontSize:\s*\d/);
      expect(ler(f), f).not.toMatch(/gear|engrenagem|cog\b/i);
    }
  });

  it('interruptor próprio: a intro lê INTRO_NARRATIVA, nunca ONBOARDING_VELADO', () => {
    const flag = ler('sequencia/flagIntro.ts');
    expect(flag).toMatch(/VITE_INTRO_NARRATIVA/);
    for (const f of ['sequencia/IntroNarrativa.tsx', 'sequencia/flagIntro.ts']) expect(ler(f), f).not.toMatch(/onboardingVeladoLigado|isOnboardingVelado|VITE_ONBOARDING_VELADO/);
  });

  it('o App liga a intro pela decisão única posCriacao (intro e tutorial nunca juntos)', () => {
    const app = readFileSync(join(SRC, 'App.tsx'), 'utf8');
    expect(app).toMatch(/posCriacao\(/);
    expect(app).toMatch(/depoisDaCriacao === 'intro'/);
    expect(app).toMatch(/depoisDaCriacao === 'tutorial'/);
    expect(app).not.toMatch(/sequencia\/SequenciaReal|SequenciaRevisao|ONBOARDING_VELADO_VISTO/);
  });

  it('removeu o puzzle, a bifurcação e o resgate da lanterna', () => {
    const arquivos = [...readdirSync(join(AQUI, 'etapas')), ...readdirSync(join(AQUI, 'sequencia'))].join(' ');
    expect(arquivos).not.toMatch(/Puzzle|SequenciaPlayer|slotsReais/);
    const copy = ler('sequencia/copy.ts');
    expect(copy).not.toMatch(/BIFURCACAO|lanterna|Lantern/i);
  });
});
