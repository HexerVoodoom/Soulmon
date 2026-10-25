// RÉGUA M14 (25/10/2026): "Soulmon monocromático amarelo" não pode voltar.
//
// Diagnóstico: o prompt de cor nascia de UMA paleta do elemento dominante + o acento do
// alinhamento (benevolência = 'gold', ultra fixo 'red, cyan and gold'); 8 das 24 paletas
// eram amarelas, Luz repetia dourado em 3 lugares e o elemento secundário nunca entrava na
// cor. Medido (N=3000, todas as formas): ~59% dos prompts com amarelo/dourado.
//
// Decisão do dono: benevolência = rosado com dourado só como DETALHE; monocromático proibido.
import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from '../soulProfile/profile';
import { CITIES } from '../soulProfile/cities';
import { nomeSintetico, nascimentoSintetico } from '../soulProfile/perfisSinteticos';
import { ORACLE_QUESTIONS, ELEMENT_ORDER, mulberry32 } from '../oracle';
import {
  generateOracleWithFamilies, ELEMENT_PALETTES, ALIGNMENT_ACCENT, ELEMENT_SECONDARY_HUE, VPET_TEMPLATE,
  accentFor, chromaFor,
} from './motor';
import * as familias from './familias';

const N = 600;
const YEL = /yellow|gold|amber|sunflower|brass|ochre|cream/i;
const COR = /Flat (.*?) colors with (.*?) accents/;

type Forma = { stage: string; cor: string; acento: string; prompt: string };
const perfis: Array<{ formas: Forma[]; dom: string; sec: string | null }> = [];

describe('paleta do prompt de sprite — sem monocromático amarelo', () => {
  const rng = mulberry32(20261025);
  for (let i = 0; i < N; i++) {
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    const nome = nomeSintetico(rng); const nasc = nascimentoSintetico(rng);
    const answers: Record<string, string> = {};
    for (const q of ORACLE_QUESTIONS) answers[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
    const soulProfile = buildSoulProfile({ fullName: nome, ...nasc, timeUnknown: false, placeLabel: c.name,
      latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone }, {} as never);
    const r: any = generateOracleWithFamilies({ fullName: nome, birthDate: nasc.birthDate, birthTime: nasc.birthTime,
      birthPlace: c.name, soulProfile, answers } as never, familias as never, 300 + i);
    const formas: Forma[] = r.creature.stages.map((s: any) => {
      const m = String(s.imagePrompt).match(COR);
      return { stage: s.stage, cor: m?.[1] ?? '', acento: m?.[2] ?? '', prompt: String(s.imagePrompt) };
    });
    perfis.push({ formas, dom: r.dominantElement, sec: r.secondaryElement ?? null });
  }

  it('o trecho de cor tem amarelo em no máximo 25% das formas e < 40% em qualquer estágio', () => {
    let tot = 0, amarelo = 0; const porEstagio: Record<string, [number, number]> = {};
    for (const p of perfis) for (const f of p.formas) {
      tot++; const y = YEL.test(f.cor) || YEL.test(f.acento); if (y) amarelo++;
      (porEstagio[f.stage] ??= [0, 0])[1]++; if (y) porEstagio[f.stage][0]++;
    }
    expect(amarelo / tot).toBeLessThanOrEqual(0.25);
    for (const [k, [y, t]] of Object.entries(porEstagio)) expect(y / t, k).toBeLessThan(0.4);
  });

  it('só UMA paleta amarela por elemento (Luz: no máximo 1 de 3)', () => {
    for (const el of ELEMENT_ORDER) {
      const amarelas = ELEMENT_PALETTES[el].filter(p => YEL.test(p));
      expect(amarelas.length, el).toBeLessThanOrEqual(1);
    }
    expect(ELEMENT_PALETTES.luz.filter(p => YEL.test(p)).length).toBeLessThanOrEqual(1);
  });

  it('acento de benevolência nunca é "gold" sozinho, e com Luz/paleta amarela perde o dourado', () => {
    expect(ALIGNMENT_ACCENT.benevolencia).not.toBe('gold');
    expect(ALIGNMENT_ACCENT.benevolencia).toMatch(/rose-pink/);
    expect(accentFor('benevolencia', 'pearl-white', 'luz', true)).not.toMatch(/gold/);
    expect(accentFor('benevolencia', 'earthy brown and ochre', 'terra', true)).not.toMatch(/gold/);
    expect(accentFor('benevolencia', 'cool blue and teal', 'agua', false)).not.toMatch(/gold/);
    expect(accentFor('benevolencia', 'cool blue and teal', 'agua', true)).toMatch(/small gold trim/);
    for (const p of perfis) for (const f of p.formas) {
      expect(f.acento.trim()).not.toBe('gold');
      if (p.dom === 'luz') expect(f.acento, `${f.stage}`).not.toMatch(/gold/i);
    }
  });

  it('todo perfil com secundário leva a cor do elemento secundário na cor do prompt', () => {
    let comSec = 0;
    for (const p of perfis) {
      if (!p.sec) continue;
      comSec++;
      for (const f of p.formas) expect(f.cor, `${p.dom}+${p.sec} ${f.stage}`).toContain(ELEMENT_SECONDARY_HUE[p.sec as keyof typeof ELEMENT_SECONDARY_HUE]);
    }
    expect(comSec / N).toBeGreaterThan(0.8);
  });

  it('hueGuard ligado: todo prompt veta o tingimento de matiz única', () => {
    expect(VPET_TEMPLATE.hueGuard).toBe(true);
    for (const p of perfis) for (const f of p.formas) {
      expect(f.prompt).toContain('Do not tint the whole creature in a single hue');
    }
  });

  it('Luz não repete dourado no corpo (gilded, golden shimmer, warm cream coat)', () => {
    for (const p of perfis) if (p.dom === 'luz') for (const f of p.formas) {
      const corpo = f.prompt.slice(0, f.prompt.indexOf('Flat '));
      expect(corpo).not.toMatch(/gilded|golden shimmer|warm cream coat/i);
    }
  });

  it('fundo: magenta quando a criatura tem verde, verde no resto, e o prompt traz a cor certa', () => {
    expect(chromaFor('cool blue and teal', 'red', ['agua'])).toBe('green');
    expect(chromaFor('leafy green and lime', 'red', ['planta'])).toBe('magenta');
    expect(chromaFor('earthy brown and ochre', 'cyan', ['terra', 'planta'])).toBe('magenta');
    for (const p of perfis) for (const f of p.formas) {
      const verde = p.dom === 'planta' || p.sec === 'planta' || /green|fern|moss|sage|lime|leaf|emerald|jade|olive|clover|forest|mint|sprout/i.test(`${f.cor} ${f.acento}`);
      if (verde) { expect(f.prompt).toContain('#FF00FF'); expect(f.prompt).not.toContain('#00FF00'); }
      else { expect(f.prompt).toContain('#00FF00'); expect(f.prompt).not.toContain('#FF00FF'); }
      expect(f.prompt).toContain('Do not copy any existing franchise character');
    }
  });
}, 120000);
