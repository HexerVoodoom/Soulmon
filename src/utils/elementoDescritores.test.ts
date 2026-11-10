/**
 * O elemento EFETIVO influencia TODO prompt de sprite (dono, 10/11/2026): tema (poção/combinado natural) + pistas visuais de forma e paleta
 * DO elemento (derivadas dos prompts dos assets) + fundo chroma coerente (verde por padrão; magenta quando há verde; verde de novo quando só
 * há magenta). Só gerações futuras usam isto — nada de sprite/save existente muda.
 */
import { describe, it, expect } from 'vitest';
import { stagesComElemento, pistasVisuaisDoElemento, escolherChroma, aplicarChroma, chromaDoPrompt } from './elementoCombinado';
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
    expect(chromaDoPrompt(s)).toBe('magenta'); // a paleta do Sabá tem verde: fundo magenta
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
  it('verde e magenta juntos: o fundo é a chave da cor que NÃO domina (a 1ª citada domina)', () => {
    expect(escolherChroma(`${RAW} Visual cues of this element: hot-pink glitter, green leaves palette.`)).toBe('green');
    expect(escolherChroma(`${RAW} Visual cues of this element: green leaves, hot-pink glitter palette.`)).toBe('magenta');
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
  it('em todo o catálogo, o fundo pedido combina com as cores: verde nas pistas ⇒ magenta; sem verde ⇒ verde', () => {
    const VERDE = /green|lime|mint|emerald|jade|olive|fern|moss|sage|clover|forest|verde/i;
    for (const id of ESSENCE_ELEMENT_IDS) {
      const p = gen(id, 'sombra');
      for (const txt of [p.imagePrompt, p.imagePromptFallback]) {
        const cues = txt.split('Visual cues of this element:')[1] ?? '';
        const key = chromaDoPrompt(txt);
        const MAG = /(?<!dark |deep |dim )magenta|hot[- ]pink|fuchsia|neon pink/i;
        const g = cues.search(VERDE); const m = cues.search(MAG);
        const esperado = g >= 0 && m < 0 ? 'magenta' : m >= 0 && g < 0 ? 'green' : g >= 0 && m >= 0 ? (g < m ? 'magenta' : 'green') : 'green';
        expect(key, id).toBe(esperado);
      }
    }
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
