import { describe, it, expect, afterEach } from 'vitest';
import { isIntroNarrativa, posCriacao, setIntroTester } from '../components/onboarding/sequencia/flagIntro';
import { isOnboardingVelado, setOnboardingVelado, setVeladoTester } from './bbStage';

afterEach(() => { setIntroTester(false); setOnboardingVelado(false); setVeladoTester(false); });

describe('interruptor INTRO_NARRATIVA', () => {
  it('desligado por padrão', () => { expect(isIntroNarrativa()).toBe(false); });

  it('o teste por pessoa liga só com `true` estrito', () => {
    setIntroTester('true'); expect(isIntroNarrativa()).toBe(false);
    setIntroTester(1); expect(isIntroNarrativa()).toBe(false);
    setIntroTester(true); expect(isIntroNarrativa()).toBe(true);
  });

  it('é independente do ONBOARDING_VELADO, nos dois sentidos', () => {
    setOnboardingVelado(true);
    expect(isOnboardingVelado()).toBe(true);
    expect(isIntroNarrativa()).toBe(false);
    setOnboardingVelado(false);
    setIntroTester(true);
    expect(isIntroNarrativa()).toBe(true);
    expect(isOnboardingVelado()).toBe(false);
  });
});

describe('tabela: o que vem depois da criação (VELADO x INTRO)', () => {
  const base = { introVista: false, tutorialFeito: false, demo: false };
  // [velado, intro, esperado]: o velado NÃO entra na conta (posCriacao nem o recebe)
  const casos: Array<[boolean, boolean, string]> = [
    [false, false, 'tutorial'],
    [true, false, 'tutorial'],
    [false, true, 'intro'],
    [true, true, 'intro'],
  ];
  for (const [velado, intro, esperado] of casos) {
    it(`velado=${velado} intro=${intro} => ${esperado}`, () => {
      setOnboardingVelado(velado);
      expect(posCriacao({ ...base, introLigada: intro })).toBe(esperado);
    });
  }
  it('desligado = nada muda: tutorial pendente cai no tutorial, pronto cai na Home', () => {
    expect(posCriacao({ ...base, introLigada: false })).toBe('tutorial');
    expect(posCriacao({ ...base, introLigada: false, tutorialFeito: true })).toBe('home');
  });
  it('intro já vista, demo ou jogador antigo nunca a veem de novo', () => {
    expect(posCriacao({ ...base, introLigada: true, introVista: true, tutorialFeito: true })).toBe('home');
    expect(posCriacao({ ...base, introLigada: true, demo: true })).toBe('tutorial');
  });
});
