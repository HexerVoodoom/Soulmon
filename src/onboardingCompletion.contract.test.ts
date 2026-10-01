/**
 * O FIM DO ONBOARDING no `App.tsx` (`handleCompleteOnboarding`), 01/10/2026.
 *
 * O `App.tsx` é grande demais para montar num teste; a régua aqui é a FONTE
 * do handler, nas duas promessas que um render não pegaria a tempo:
 *
 *  1. **O tutorial antigo não reaparece.** A marca `TUTORIAL_COMPLETE` (quando
 *     o ponto de partida trouxe atividades) é gravada ANTES do primeiro
 *     `await` — antes ela vinha depois das idas à nuvem, e nesse intervalo o
 *     app renderizava "onboarding completo + tutorial pendente": o tutorial
 *     piscava, e ficava se a pessoa fechasse ali ou se a adoção de um save
 *     da nuvem recarregasse a página.
 *  2. **O perfil do onboarding vai para o save nos DOIS caminhos** (demo e
 *     oráculo): `onboardingProfile` = forças + o que atrapalha, em ids do
 *     catálogo, que `derivePersonality` lê. O formato é de
 *     `onboardingProfileFrom` (testado em `utils/catalogOnboarding.test.ts`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fonte = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
const ini = fonte.indexOf('const handleCompleteOnboarding = async');
const fim = fonte.indexOf('const handleCompleteTutorial', ini);
const handler = fonte.slice(ini, fim);

describe('handleCompleteOnboarding — o fim do onboarding', () => {
  it('o handler existe e foi recortado inteiro', () => {
    expect(ini).toBeGreaterThan(0);
    expect(fim).toBeGreaterThan(ini);
  });

  it('a marca do tutorial vem ANTES de qualquer await e antes de dar o onboarding como completo', () => {
    const marca = handler.indexOf('writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE');
    const primeiroAwait = handler.indexOf('await ');
    const completo = handler.indexOf('setHasCompletedOnboarding(true)');
    expect(marca).toBeGreaterThan(0);
    expect(marca).toBeLessThan(primeiroAwait);
    expect(marca).toBeLessThan(completo);
    // e uma marca só — duas cópias divergem
    expect(handler.split('writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE').length - 1).toBe(1);
  });

  it('`onboardingProfile` é gravado nos DOIS caminhos, pelo dono do formato', () => {
    expect(handler).toContain('onboardingProfileFrom(data.catalogChoice)');
    const gravacoes = handler.split('onboardingProfile: onboardingProfile ?? prev.onboardingProfile').length - 1;
    expect(gravacoes).toBe(2);
    // uma em cada `setGameState` (demo antes do `return`, oráculo depois)
    const demo = handler.indexOf("if (data.mode === 'demo')");
    const primeiro = handler.indexOf('onboardingProfile: onboardingProfile');
    const segundo = handler.indexOf('onboardingProfile: onboardingProfile', primeiro + 1);
    expect(primeiro).toBeGreaterThan(demo);
    expect(handler.indexOf('return;', demo)).toBeGreaterThan(primeiro);
    expect(segundo).toBeGreaterThan(handler.indexOf('return;', demo));
  });
});
