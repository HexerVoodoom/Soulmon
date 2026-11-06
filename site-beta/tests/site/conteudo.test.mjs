// Régua do feedback §18: manifesto íntegro e copy dentro das regras do dono.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import assets from '../../src/content/assets.json';
import midia from '../../src/content/midia.json';
import { TEXTOS } from '../../src/i18n/textos';

const ESTADOS = ['final', 'aguarda-revisao', 'provisorio', 'provisorio-css'];
const pecas = Object.entries(assets).filter(([k]) => !k.startsWith('_'));
const landing = readFileSync('src/components/Landing.astro', 'utf8');

describe('manifesto de assets', () => {
  it.each(pecas)('%s tem estado válido e arquivo existente', (_k, p) => {
    expect(ESTADOS).toContain(p.estado);
    if (p.estado === 'provisorio-css') expect(p.src).toBeNull();
    else expect(existsSync(`public${p.src}`)).toBe(true);
  });
  it('peça gerada sem revisão humana nunca é final por script', () => {
    for (const [, p] of pecas) if (p.src?.startsWith('/site/')) expect(['aguarda-revisao', 'final']).toContain(p.estado);
  });
});

describe('copy do site', () => {
  const copia = JSON.stringify(TEXTOS);
  it.each(['cabo', 'cable', 'Crato', 'Brooka', 'Zefi', 'Oaken', 'Bolid', 'novidades', 'tamer', 'domador'])('não fala de %s', (t) => {
    expect(copia.toLowerCase()).not.toContain(t.toLowerCase());
  });
  it('elenco: nada de fogo com chama na cauda; hero mantém fogo-ultimate', () => {
    expect(landing).not.toMatch(/fogo-(rookie|champion|mega|ultra)\b/);
    expect(landing).toMatch(/<Cria s="fogo-ultimate"[^>]*\bprot\b/);
  });
  it('prova real: loop e prints de gameplay nos dois idiomas', () => {
    for (const l of ['pt', 'en']) {
      expect(midia.videos[l].filter((v) => v.gameplay === true && existsSync(`public${v.src}`) && existsSync(`public${v.poster}`))).toHaveLength(1);
      expect(midia.prints[l].filter((p) => p.gameplay === true && existsSync(`public${p.src}`))).toHaveLength(3);
    }
    expect(midia.abertura.gameplay).toBe(false);
    for (const l of ['pt', 'en']) { expect(midia.trailer[l].gameplay).toBe(false); expect(existsSync(`public${midia.trailer[l].src}`)).toBe(true); }
  });
  it('landing não usa arte vetada', () => {
    for (const t of ['starters/', 'mapas-recriados', 'bg-mapa', 'mapa/mercado', 'mapa/forja', 'mapa-mundi', 'type="checkbox"']) expect(landing).not.toContain(t);
  });
  it('textos exatos do dono', () => {
    expect(TEXTOS.pt.form.okH + ' ' + TEXTOS.pt.form.ok).toBe('Parabéns, você se inscreveu no beta! Seu e-mail foi cadastrado com sucesso. Em até 24 horas você receberá o link para fazer o download.');
    expect(TEXTOS.pt.form.esperaH + ' ' + TEXTOS.pt.form.espera).toBe('As vagas desta rodada foram preenchidas. Teremos uma nova rodada e seu e-mail já está na fila. Obrigado por se interessar no Soulmon!');
    expect(TEXTOS.en.form.esperaH + ' ' + TEXTOS.en.form.espera).toBe('This round is full. Another round is coming and your email is already in line. Thanks for your interest in Soulmon!');
    expect(TEXTOS.pt.form.enviar).toBe('Entrar no beta');
    expect(TEXTOS.en.form.enviar).toBe('Join the beta');
  });
  it('antes de cadastrar, nunca diz que o e-mail já está na fila', () => {
    expect(TEXTOS.pt.form.esperaPre).not.toContain('já está');
    expect(TEXTOS.en.form.esperaPre).not.toContain('already');
  });
  it('títulos de seção com até 6 palavras e 34 caracteres (DESIGN-SYSTEM §3.3)', () => {
    for (const l of [TEXTOS.pt, TEXTOS.en]) {
      for (const h of [l.jogo.h2, l.ciclo.h2, l.soul.h2, l.universo.h2, l.recursos.h2, l.video.h2, l.entrar.h2, l.faq.h2, l.form.h2]) {
        expect(h.split(' ').length, h).toBeLessThanOrEqual(6);
        expect(h.length, h).toBeLessThanOrEqual(34);
      }
    }
  });
  it('PT e EN têm a mesma estrutura', () => {
    expect(TEXTOS.en.universo.abas.length).toBe(TEXTOS.pt.universo.abas.length);
    expect(Object.keys(TEXTOS.en.universo.els)).toEqual(Object.keys(TEXTOS.pt.universo.els));
    expect(Object.keys(TEXTOS.pt.universo.els)).toHaveLength(20);
  });
});
