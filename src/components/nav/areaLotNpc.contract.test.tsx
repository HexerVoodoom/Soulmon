// @vitest-environment jsdom
/**
 * H11 (02/10/2026) — O NPC de um lote é FIXO: exatamente um por lote, o mesmo em
 * qualquer abertura, em todas as áreas.
 *
 * O bug do dono: "Laboratório › Árvore da Evolução às vezes mostra o Quill, às
 * vezes a Vesca". Não havia sorteio: a caixa quadrada (com alfa) do Observatório
 * cobria o pé da Árvore da Evolução, e o toque ali abria o OUTRO lote
 * (`areaLotGeometry.contract.test.ts` trava a geometria). Este arquivo trava o
 * resto da promessa: a tabela lote → NPC é única, completa, sem queda para o
 * anfitrião da área, e nada nela sorteia nem depende de estado ou hora.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { AreaSheet } from './AreaSheet';
import { LOT_NPC_ART, lotNpcArt } from '../../assets/soulmon/npcs';
import { LOT_NPC_VOICE, lotNpcVoice } from '../../utils/areaNpcVoice';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import type { AreaId } from '../../navigation';

const LOTS: Array<[AreaId, string[]]> = [
  ['mercado', mercadoLots('pt-BR').map(l => l.id)],
  ['arena', arenaLots('pt-BR').map(l => l.id)],
  ['exploracao', exploracaoLots('pt-BR').map(l => l.id)],
  ['jogos', jogosLots('pt-BR').map(l => l.id)],
  ['laboratorio', laboratorioLots('pt-BR').map(l => l.id)],
  ['hall', hallLots('pt-BR').map(l => l.id)],
];
const ALL_KEYS = LOTS.flatMap(([a, ids]) => ids.map(id => `${a}:${id}`));

const src = (rel: string) => readFileSync(resolve(__dirname, rel), 'utf8');

afterEach(() => vi.restoreAllMocks());

describe('H11 — a tabela lote → NPC é única e completa', () => {
  it('as duas tabelas (arte e voz) cobrem EXATAMENTE os lotes que existem — sem lote órfão, sem lote caindo no anfitrião da área', () => {
    expect(ALL_KEYS.length).toBe(20);
    expect(Object.keys(LOT_NPC_ART).sort()).toEqual([...ALL_KEYS].sort());
    expect(Object.keys(LOT_NPC_VOICE).sort()).toEqual([...ALL_KEYS].sort());
  });

  it('cada lote tem um NPC com nome próprio, distinto dos demais lotes, nos dois idiomas', () => {
    const nomes = (lang: 'pt-BR' | 'en-US') =>
      ALL_KEYS.map(k => { const [a, l] = k.split(':'); return lotNpcVoice(a as AreaId, l, lang).name; });
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const n = nomes(lang);
      expect(new Set(n).size, `nomes repetidos em ${lang}: ${n.join(' | ')}`).toBe(ALL_KEYS.length);
    }
  });

  it('o rótulo do NPC de um lote nunca é o de outro lote da MESMA área (Quill ≠ Vesca ≠ Bento)', () => {
    const lab = ['evolucao', 'pet', 'stats'].map(l => lotNpcVoice('laboratorio', l, 'pt-BR').name);
    expect(lab.map(n => n.split(',')[0])).toEqual(['Vesca', 'Bento', 'Quill']);
  });
});

describe('H11 — escolha determinística: N aberturas, sempre o mesmo NPC', () => {
  it('arte e voz de cada lote são idênticas em 50 chamadas, com Math.random proibido e relógio mexendo', () => {
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Math.random proibido na escolha do NPC'); });
    vi.useFakeTimers();
    try {
      for (const k of ALL_KEYS) {
        const [a, l] = k.split(':') as [AreaId, string];
        const art0 = lotNpcArt(a, l);
        const v0 = { pt: lotNpcVoice(a, l, 'pt-BR'), en: lotNpcVoice(a, l, 'en-US') };
        for (let i = 0; i < 50; i++) {
          vi.setSystemTime(new Date(2026, 9, 2, i % 24, i));
          expect(lotNpcArt(a, l)).toBe(art0);
          expect(lotNpcVoice(a, l, 'pt-BR')).toEqual(v0.pt);
          expect(lotNpcVoice(a, l, 'en-US')).toEqual(v0.en);
        }
      }
    } finally {
      vi.useRealTimers();
    }
    expect(rnd).not.toHaveBeenCalled();
  });

  it('a folha (AreaSheet) aberta 20 vezes por lote mostra sempre o mesmo busto e o mesmo nome', () => {
    for (const k of ALL_KEYS) {
      const [a, l] = k.split(':') as [AreaId, string];
      const seen = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const r = renderWithCss(
          <AreaSheet areaId={a} lotId={l} language="pt-BR" title="t" closeLabel="x" open onClose={() => {}}><p>x</p></AreaSheet>,
        );
        const img = r.container.querySelector('[data-area-sheet-npc]') as HTMLImageElement;
        const name = r.container.querySelector('[data-area-sheet-npc-line]')?.textContent ?? '';
        seen.add(`${img.getAttribute('src')}|${name}`);
        r.unmount();
      }
      expect(seen.size, `${k} mostrou mais de um NPC`).toBe(1);
      expect([...seen][0]).toContain(lotNpcArt(a, l));
      expect([...seen][0]).toContain(lotNpcVoice(a, l, 'pt-BR').name);
    }
  });

  it('o fonte da escolha não sorteia nem lê estado/hora (Math.random, Date, performance, localStorage)', () => {
    const proibido = /Math\.random|new Date|Date\.now|performance\.now|localStorage|sessionStorage|useState|useEffect/;
    for (const f of ['../../assets/soulmon/npcs/index.ts', '../../utils/areaNpcVoice.ts', './AreaSheet.tsx']) {
      const limpo = src(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      if (f.endsWith('AreaSheet.tsx')) {
        // A folha usa hooks de foco/voltar, mas a escolha do NPC (as duas linhas) é função pura do lote.
        expect(limpo).toMatch(/lotNpcArt\(areaId, lotId\)/);
        expect(limpo).toMatch(/lotNpcVoice\(areaId, lotId, language\)/);
        expect(limpo).not.toMatch(/Math\.random/);
      } else {
        expect(limpo, f).not.toMatch(proibido);
      }
    }
  });

  it('o AreaView entrega o id do lote ABERTO (e só ele) à folha, em todas as áreas', () => {
    const view = src('./AreaView.tsx');
    const usos = view.match(/<AreaSheet[\s\S]*?lotId=\{([^}]+)\}/g) ?? [];
    expect(usos.length).toBeGreaterThanOrEqual(5);
    for (const u of usos) expect(u).toContain('lotId={open?.id}');
  });
});
