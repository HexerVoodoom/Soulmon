/**
 * QA3: a linguagem de design do alinhamento Poder tinha "one hot magenta accent". Na ordem do prompt ela vem ANTES das cores,
 * e `escolherChroma` trata a primeira cor citada como a dominante: com um elemento verde (planta) o fundo virava VERDE #00FF00
 * em cima de uma criatura verde (o recorte comia o corpo). Sem magenta no texto da linguagem de design, a regra é a do elemento.
 */
import { describe, it, expect } from 'vitest';
import { generateOracle } from '../test/oracleSync';
import { coresDoTexto } from '../../functions/api/_chromaHue.js';
import { stagesComElemento, chromaDoPrompt } from './elementoCombinado';

const VERDE = /green|lime|mint|emerald|jade|olive|fern|moss|sage|clover|forest/i;
const CLAUSULA = /on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/;

describe('fundo chroma x linguagem de design do alinhamento', () => {
  it('elemento planta (pistas verdes): nunca fundo verde com verde no corpo do prompt, em nenhuma forma', () => {
    const ruins: string[] = [];
    for (let s = 1; s <= 300; s++) {
      const r = generateOracle({ fullName: `P${s}`, birthDate: `19${70 + (s % 30)}-0${1 + (s % 9)}-${10 + (s % 18)}`, birthTime: `${10 + (s % 12)}:30`, birthPlace: 'Lisboa, Portugal' }, s * 104729);
      for (const st of stagesComElemento(r.creature.stages, undefined, undefined, 'planta') ?? []) {
        for (const p of [st.imagePrompt, st.imagePromptFallback]) {
          const cores = coresDoTexto(p.replace(CLAUSULA, ''));
          if (chromaDoPrompt(p) === 'green' && cores[0]?.hue === 120) ruins.push(`${s}/${st.stage}`);
        }
      }
    }
    expect(ruins).toEqual([]);
  });
});
