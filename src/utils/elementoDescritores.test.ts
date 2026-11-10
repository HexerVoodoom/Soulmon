/**
 * O elemento EFETIVO influencia TODO prompt de sprite (dono, 10/11/2026): tema (poção/combinado natural) + pistas visuais de forma e paleta
 * DO elemento (derivadas dos prompts dos assets) + fundo chroma coerente (verde por padrão; magenta quando há verde; verde de novo quando só
 * há magenta). Só gerações futuras usam isto — nada de sprite/save existente muda.
 */
import { describe, it, expect } from 'vitest';
import { escolherChaveDeMatiz, hueDist, KEY_HUE } from '../../functions/api/_chromaHue.js';
import { stagesComElemento, pistasVisuaisDoElemento, escolherChroma, aplicarChroma, chromaDoPrompt, semChromaSeguro } from './elementoCombinado';
import { DESCRITORES_ELEMENTO } from './elementoDescritores.data';
import { ESSENCE_ELEMENT_IDS, BASE_ELEMENT_IDS } from './elementDex';

const FUNDO_VERDE = 'Tamagotchi-style v-pet sprite, 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe: macaw, Blood Reaver. Flat dark violet and ash-gray colors.';
const RAW = `Generate this RPG creature. ${FUNDO_VERDE}`;
const st = [{ stage: 'perfeito', branch: 'poder', imagePrompt: RAW, imagePromptFallback: RAW + ' (fb)' }] as never;
type P = { imagePrompt: string; imagePromptFallback: string };
const gen = (id?: string, base?: string): P => stagesComElemento(st, undefined, id ? { ultimate: id } : undefined, base)![0] as P;

describe('elemento efetivo em TODO prompt', () => {
  it('sem nenhuma informação de elemento (sem poção, sem registro, sem base): o prompt não muda', () => {
    expect(gen().imagePrompt).toBe(RAW);
    expect(stagesComElemento(st, undefined, undefined, undefined)).toBe(st);
  });
  it('prompt NATURAL (sem poção; elemento = base do Soulmon): leva as pistas do base, sem tema extra', () => {
    const p = gen(undefined, 'sombra').imagePrompt;
    expect(p.startsWith(RAW)).toBe(true);
    expect(p).toContain('Visual cues of this element: curling black smoke, ink black and cold grey-blue palette.');
    expect(p).not.toContain('Elemental theme');
    expect(chromaDoPrompt(p)).toBe('green');
  });
  it('poção simples COM prompt-fonte (Marcial, Morte): tema + pistas de forma e paleta', () => {
    const m = gen('marcial', 'sombra').imagePrompt;
    expect(m).toContain('Elemental theme of this form: Martial.');
    expect(m).toContain('Visual cues of this element: crossed blades and cord, steel grey and deep red palette.');
    const d = gen('morte', 'sombra').imagePrompt;
    expect(d).toContain('Elemental theme of this form: Death.');
    expect(d).toContain('bleached branches and pale moths');
  });
  it('combinado: esquema do PRÓPRIO elemento (kit) + um traço dos componentes (70/30); Sabá = arcano+sombra+vileza', () => {
    expect(gen('armaria', 'sombra').imagePrompt).toContain('forged blades and anvil sparks');
    const s = gen('sabbat', 'sombra').imagePrompt;
    expect(s).toContain('Elemental theme of this form: Sabbath, with arcano as its main element.');
    expect(s).toContain('ring of candles around rune, with hints of orbiting violet glyphs, curling black smoke, barbed thorns');
    expect(s).toContain('royal violet, ink black, sickly green accents');
    expect(chromaDoPrompt(s)).not.toBe('magenta'); // violeta fica entre azul e magenta: fundo magenta/azul comeria o corpo (#749)
  });
  it('elemento simples (base): só o próprio, sem traço de componentes', () => {
    for (const b of BASE_ELEMENT_IDS) expect(`${DESCRITORES_ELEMENTO[b].forma} ${DESCRITORES_ELEMENTO[b].paleta}`, b).not.toMatch(/hints of|accents/);
  });
  it('a forma original (elemento = base) leva as pistas do base, também em forma de poção do mesmo elemento', () => {
    expect(gen('sombra', 'sombra').imagePrompt).toContain('Visual cues of this element: curling black smoke');
  });
});

describe('fundo chroma coerente com as cores do elemento', () => {
  it('elemento com verde (planta, vileza) → fundo MAGENTA #FF00FF e a cláusula "no magenta"', () => {
    for (const id of ['planta', 'vileza']) {
      const p = gen(id, 'sombra').imagePrompt;
      expect(p, id).toContain('#FF00FF chroma-magenta');
      expect(p, id).toContain('contains no magenta, no hot pink and no magenta fringe');
      expect(p, id).not.toContain('#00FF00');
      expect(chromaDoPrompt(p)).toBe('magenta');
    }
  });
  it('elemento sem verde mantém o fundo VERDE #00FF00', () => {
    for (const id of ['marcial', 'morte', 'sombra', 'fogo']) {
      const p = gen(id, 'sombra').imagePrompt;
      expect(p, id).toContain('#00FF00 chroma-green');
      expect(p, id).not.toContain('#FF00FF');
    }
  });
  it('verde e magenta juntos: o fundo é AZUL #0000FF (3ª chave), sem azul forte na paleta', () => {
    expect(escolherChroma(`${RAW} Visual cues of this element: hot-pink glitter, green leaves palette.`)).toBe('blue');
    expect(escolherChroma(`${RAW} Visual cues of this element: green leaves, hot-pink glitter, cyan and navy palette.`)).toBe('blue');
  });
  it('verde, magenta E azul forte: sem cor segura -> regra antiga (a que não domina) e semChromaSeguro marca', () => {
    const t = `${RAW} Visual cues of this element: green leaves, hot-pink glitter, royal blue palette.`;
    expect(semChromaSeguro(t)).toBe(true);
    expect(escolherChroma(t)).toBe('blue'); // por matiz: a 3ª cor citada (azul) é a menos dominante e a sacrificada
  });
  it('elementos com verde E magenta nas pistas: o fundo é o de maior distância de matiz (nunca a cor dominante da criatura)', () => {
    for (const id of ['tormento', 'praga', 'devorador', 'cyber', 'bencao_feerica']) {
      const p = gen(id, 'sombra').imagePrompt;
      const corpo = p.replace(/on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/, '');
      const r = escolherChaveDeMatiz(corpo);
      expect(chromaDoPrompt(p), id).toBe(r.key);
      expect(r.cores[0] && Math.min(...[r.cores[0]].map(c => hueDist(c.hue, KEY_HUE[r.key]))) >= 30, id).toBe(true); // a cor dominante nunca fica a <30 graus da chave
    }
  });
  it('criatura ROXA (entre azul e magenta) pede fundo VERDE, não magenta nem azul', () => {
    for (const t of ['purple dragon with violet wings', 'dragão roxo com asas violeta', 'lilac fox, amethyst eyes']) {
      expect(escolherChroma(`${RAW} ${t}`), t).toBe('green');
    }
  });
  it('portal e glitter (magenta, sem verde nas pistas) ficam no verde; elementos normais não mudam', () => {
    for (const id of ['portal', 'glitter']) expect(chromaDoPrompt(gen(id, 'sombra').imagePrompt), id).toBe('green');
    expect(chromaDoPrompt(gen('planta', 'sombra').imagePrompt)).toBe('magenta');
    expect(chromaDoPrompt(gen('fogo', 'sombra').imagePrompt)).toBe('green');
  });
  it('aplicarChroma troca entre as 3 chaves e volta ao original', () => {
    for (const k of ['green', 'magenta', 'blue'] as const) {
      const x = aplicarChroma(RAW, k);
      expect(chromaDoPrompt(x)).toBe(k);
      expect(aplicarChroma(x, 'green')).toBe(RAW);
    }
  });
  it('só magenta/rosa-choque (sem verde em lugar nenhum) → volta ao fundo VERDE', () => {
    const mag = aplicarChroma(RAW, 'magenta');
    const t = `${mag} Visual cues of this element: hot-pink glitter sparks, yellow palette.`;
    expect(escolherChroma(t)).toBe('green');
    expect(aplicarChroma(t, 'green')).toContain('#00FF00 chroma-green');
  });
  it('aplicarChroma é reversível e idempotente', () => {
    expect(aplicarChroma(aplicarChroma(RAW, 'magenta'), 'green')).toBe(RAW);
    expect(aplicarChroma(RAW, 'green')).toBe(RAW);
  });
  it('em todo o catálogo, o fundo pedido é o de maior pontuação de matiz, e a cor dominante nunca colide', () => {
    for (const id of ESSENCE_ELEMENT_IDS) {
      const p = gen(id, 'sombra');
      for (const txt of [p.imagePrompt, p.imagePromptFallback]) {
        const corpo = txt.replace(/on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/, '');
        const r = escolherChaveDeMatiz(corpo);
        expect(chromaDoPrompt(txt), id).toBe(r.key);
        if (r.cores[0]) expect(hueDist(r.cores[0].hue, KEY_HUE[r.key]), id).toBeGreaterThanOrEqual(Math.min(30, r.ranking[0].score));
      }
    }
  });
  it('catálogo com o círculo cheio (sem chave segura) é um conjunto pequeno e conhecido: listar para o dono', () => {
    expect(ESSENCE_ELEMENT_IDS.filter(id => semChromaSeguro(gen(id, 'sombra').imagePrompt))).toEqual(['requiem']);
  });
  it('a troca de texto é a MESMA do Oráculo (motor.ts › withChroma)', () => {
    const doMotor = FUNDO_VERDE.replace('#00FF00 chroma-green', '#FF00FF chroma-magenta').replace('contains no green and no green fringe', 'contains no magenta, no hot pink and no magenta fringe');
    expect(aplicarChroma(FUNDO_VERDE, 'magenta')).toBe(doMotor);
  });
});

describe('tabela de descritores', () => {
  it('todos os 20 elementos base têm prompt-fonte e só existem ids do catálogo', () => {
    for (const b of BASE_ELEMENT_IDS) expect(DESCRITORES_ELEMENTO[b]?.forma || DESCRITORES_ELEMENTO[b]?.paleta, b).toBeTruthy();
    for (const id of Object.keys(DESCRITORES_ELEMENTO)) expect(ESSENCE_ELEMENT_IDS, id).toContain(id);
  });
  it('TODO elemento do catálogo tem descritor (sem exceções: cada um tem kit próprio de ícone + FX)', () => {
    for (const id of ESSENCE_ELEMENT_IDS) expect(pistasVisuaisDoElemento(id), id).toBeTruthy();
  });
  it('sem identidade Soulmon (cristal da alma) nos descritores; engrenagem só onde o elemento pede (tempo/relojoaria)', () => {
    for (const [id, d] of Object.entries(DESCRITORES_ELEMENTO)) expect(`${d.forma ?? ''} ${d.paleta ?? ''}`, id).not.toMatch(/soul-?crystal|steampunk/i);
  });
});
