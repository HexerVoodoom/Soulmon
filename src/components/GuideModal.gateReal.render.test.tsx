// @vitest-environment jsdom
/**
 * WP4.17 — o guia diz o GATE REAL.
 *
 * O guia prometia "Rookie→Champion pede 10 dias perfeitos". O número saía de
 * `FORM_REQUIREMENTS[...].daysToEvolve` — um campo que **nenhuma regra do jogo
 * consulta**. Os dois portões de evolução manual (`handleEvolve` e o `canEvolve`
 * do HUD) leem `.required`, que é 4. Ou seja: o botão de evoluir acendia com 4
 * dias perfeitos enquanto o guia dizia que faltavam mais 6.
 *
 * Não é um número de enfeite errado — é a tela que o jogador abre JUSTAMENTE
 * quando não entendeu a regra. E é a mesma família do gate de sprite que o
 * `spriteTrigger.test.ts` já tinha consertado ("com `daysToEvolve` (10) o lote
 * de véspera NUNCA partia") e do rótulo que o `EvolutionPath.estados` já
 * travava ("`required`, nunca `daysToEvolve`"): a terceira vez que o mesmo
 * campo morto engana um consumidor diferente.
 *
 * Por isso o teste é em DOIS níveis: o número renderizado tem de bater com o
 * gate, e o símbolo morto não pode voltar a aparecer na UI.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { GuideModal } from './GuideModal';
import { FORM_REQUIREMENTS } from '../types/progression';

/** Abre o capítulo da evolução e devolve o texto visível dele. */
function textoDoCapitulo(pt: boolean): string {
  renderWithCss(<GuideModal isOpen onClose={() => {}} language={pt ? 'pt-BR' : 'en-US'} />);
  const botao = screen.getByText(pt ? 'Como seu Soulmon evolui' : 'How it evolves');
  fireEvent.click(botao);
  const corpo = document.getElementById('guide-evolve');
  expect(corpo, 'o capítulo da evolução tem de abrir').toBeTruthy();
  return corpo!.textContent ?? '';
}

describe('GuideModal — o guia cita o gate real (WP4.17)', () => {
  it('o número de Rookie→Champion é o MESMO que os portões de evolução leem', () => {
    for (const pt of [true, false]) {
      const texto = textoDoCapitulo(pt);
      const casou = pt
        ? /Rookie→Champion pede (\d+) dias perfeitos/.exec(texto)
        : /Rookie→Champion needs (\d+) perfect days/.exec(texto);
      expect(casou, `frase da escada não encontrada (${pt ? 'PT' : 'EN'}): ${texto}`).toBeTruthy();
      expect(Number(casou![1])).toBe(FORM_REQUIREMENTS.rookie.required);
      document.body.innerHTML = '';
    }
  });

  it('a escada inteira do guia bate com `required`, e nenhum `daysToEvolve` sobra na frase', () => {
    const texto = textoDoCapitulo(true);
    const numeros = (texto.match(/Rookie→Champion pede .*?Mega→Ultra \d+/) ?? [''])[0]
      .match(/\d+/g)?.map(Number) ?? [];
    expect(numeros).toEqual([
      FORM_REQUIREMENTS.rookie.required,
      FORM_REQUIREMENTS.champion.required,
      FORM_REQUIREMENTS.ultimate.required,
      FORM_REQUIREMENTS.mega.required,
    ]);
    // A escada antiga (10/20/30/40) não pode sobreviver em lugar nenhum da frase.
    for (const morto of [
      FORM_REQUIREMENTS.rookie.daysToEvolve,
      FORM_REQUIREMENTS.champion.daysToEvolve,
      FORM_REQUIREMENTS.ultimate.daysToEvolve,
      FORM_REQUIREMENTS.mega.daysToEvolve,
    ]) {
      expect(numeros, `${morto} é \`daysToEvolve\`, não o gate`).not.toContain(morto);
    }
  });

  it('`daysToEvolve` não é lido por NENHUM ponto de UI (o comando de aceite do WP4.17)', () => {
    for (const arquivo of ['src/components/GuideModal.tsx', 'src/App.tsx']) {
      const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
      // Comentário explicando por que ele saiu é permitido; leitura do campo não.
      const leituras = fonte.match(/\.daysToEvolve\b/g) ?? [];
      expect(leituras, `${arquivo} voltou a ler \`daysToEvolve\``).toHaveLength(0);
    }
  });

  it('o HUD não recebe mais as três props mortas do mesmo número', () => {
    const hud = readFileSync(resolve(process.cwd(), 'src/components/CompanionHUD.tsx'), 'utf-8');
    // Fora do bloco de comentário que registra a remoção, os identificadores somem.
    const semComentarios = hud.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const morta of ['digivolutionSegments', 'digivolutionSegmentsNeeded', 'requiredDays']) {
      expect(semComentarios, `${morta} voltou ao HUD sem consumidor`).not.toContain(morta);
    }
  });
});
