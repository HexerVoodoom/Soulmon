import { describe, it, expect } from 'vitest';
import { arenaLots, hallLots, laboratorioLots, mercadoLots } from '../../utils/areaSheetCopy';
import { BUILDING_GATES } from '../../utils/gates';
import { lotNpcVoice, areaNpcVoice } from '../../utils/areaNpcVoice';
import fs from 'node:fs';
import { LOT_ART_BOUNDS, lotHitRects } from '../../utils/areaLotGeometry';
import path from 'node:path';
import { lotNpcArt, AREA_NPC_ART, FUNCTION_NPC_ART } from '../../assets/soulmon/npcs';
import npcArenaDuelo from '../../assets/soulmon/npcs/npc-extra-arena-duelo.png';
import { functionNpcVoice } from '../../utils/areaNpcVoice';

describe('lotes novos (29/09/2026)', () => {
  it('Arena tem Torneio, Duelo e Guerra; Hall tem Feira, Grove e Salão do Clã; Laboratório tem Biblioteca e Círculo de Amigos (D-50)', () => {
    expect(arenaLots('pt-BR').map(l => l.id)).toEqual(['torneio', 'duelo', 'guerra']);
    expect(hallLots('pt-BR').map(l => l.id)).toEqual(['feira', 'grove', 'guilda']); // D-50 (19/10/2026): Biblioteca e Amigos saíram do Hall
    expect(laboratorioLots('en-US').map(l => l.id)).toEqual(['evolucao', 'pet', 'stats', 'perfil', 'biblioteca', 'amigos']); // beta-2 (11): o Perfil do Soulmon
  });

  it('H15/H16/H17 + W12 (20/10/2026): Torneio e Arena livre dividem UM retângulo do fundo e a Guerra fica no OUTRO; Santuário do Vínculo bem maior; Hall maior', () => {
    const pct = (s?: string) => Number(String(s ?? '38%').replace('%', ''));
    const arena = Object.fromEntries(arenaLots('pt-BR').map(l => [l.id, l]));
    // 20/10/2026 (dono, §145 e §146): vagas P1 (vazia), P2 = Guerra, P3 = Torneio, P4 = Arena livre. Torneio e Arena livre acompanham a DIAGONAL do losango
    // de baixo (o Arena livre fica mais à direita E mais abaixo) e, desde o §146, o PAR fica CENTRADO no piso interno da moldura de tijolos do fundo
    // (`bg-arena.png`, 1269×1700); a Guerra (P2, bloco de cima) não mudou. Arena livre MAIS BAIXO que o Torneio, e a Guerra MAIOR (≥ 1,25× o opaco do Torneio).
    const opaca = (id: 'torneio' | 'duelo' | 'guerra') => { const b = LOT_ART_BOUNDS[`arena:${id}`]; return pct((arena[id] as { width?: string }).width) * (b[2] - b[0]); };
    expect(pct(arena.torneio.left)).toBeLessThan(pct(arena.duelo.left));
    expect(pct(arena.duelo.top) - pct(arena.torneio.top)).toBeGreaterThanOrEqual(8);               // na diagonal, NÃO lado a lado na mesma linha de chão
    expect(Math.abs(opaca('torneio') - opaca('duelo'))).toBeLessThan(0.6);                       // mesmo tamanho
    expect(opaca('torneio')).toBeGreaterThanOrEqual(24);                                           // H12 (sem relaxar)
    expect(opaca('guerra')).toBeGreaterThanOrEqual(opaca('torneio') * 1.25);                      // Clan War MAIOR
    expect(pct(arena.guerra.left)).toBeGreaterThan(pct(arena.duelo.left));                         // P2 fica à direita de P4
    expect([arena.guerra.left, arena.guerra.top, (arena.guerra as { width?: string }).width]).toEqual(['77.4%', '46.7%', '38%']); // a Guerra não mudou (§146)
    const rects = (id: string, w: number, h: number) => lotHitRects('arena', arenaLots('pt-BR').find(l => l.id === id) as never, w, h)[0];
    const centro = (id: string) => { const art = rects(id, 390, 844); return [((art.x0 + art.x1) / 2 / 390) * 100, ((art.y0 + art.y1) / 2 / 844) * 100]; };
    // §147 (W19): o dono marcou na captura 390×844 onde a BASE do Torneio deve ficar: o ponto (70,328) do sprite (a escadaria vermelha, dentro do círculo
    // branco dele) tem de cair no centro do círculo vermelho (95,366): Δ = (+25, +38) px. A Arena livre desceu o MÍNIMO que o H11 deixa (Torneio e Guerra
    // fecham o vão em x): centro visual do Arena livre − o do Torneio ≈ 21,0 / 20,6 pontos (era 27,4 / 10,1 no §146: a diagonal ficou mais vertical).
    expect(centro('duelo')[0] - centro('torneio')[0]).toBeCloseTo(21.0, 0);
    expect(Math.abs(centro('duelo')[1] - centro('torneio')[1] - 20.6)).toBeLessThanOrEqual(0.6);
    const tArt = rects('torneio', 390, 844);
    const ancora = [tArt.x0 + 46.8, tArt.y0 + 80.46]; // ponto da escadaria no sprite, medido na captura do dono (antes em (70,328))
    expect(Math.abs(ancora[0] - 95), 'base do Torneio × alvo do dono, x').toBeLessThanOrEqual(3);
    expect(Math.abs(ancora[1] - 366), 'base do Torneio × alvo do dono, y').toBeLessThanOrEqual(3);
    // a vaga P1 (50,8%/35,1%) segue vazia: nenhum prédio tem o centro por lá
    for (const id of ['torneio', 'duelo', 'guerra']) expect(Math.hypot(centro(id)[0] - 50.8, (centro(id)[1] - 35.1) * 2)).toBeGreaterThan(15);
    const lab = Object.fromEntries(laboratorioLots('pt-BR').map(l => [l.id, l as { width?: string; top: string }]));
    expect(pct(lab.stats.width)).toBeGreaterThanOrEqual(pct(lab.evolucao.width) * 1.4);
    for (const id of ['evolucao', 'pet']) {
      expect(pct(lab[id].width)).toBeGreaterThan(38);
      expect(pct(lab[id].top)).toBeGreaterThan(54);
    }
    for (const l of hallLots('pt-BR')) expect(pct((l as { width?: string }).width)).toBeGreaterThan(38);
  });

  it('o rinoceronte é o NPC do Duelo, com voz própria nos dois idiomas', () => {
    expect(lotNpcArt('arena', 'duelo')).toBe(npcArenaDuelo);
    expect(lotNpcArt('arena', 'duelo')).not.toBe(AREA_NPC_ART.arena);
    expect(lotNpcVoice('arena', 'duelo', 'pt-BR').name).toContain('Naia');
    expect(lotNpcVoice('arena', 'duelo', 'en-US').name).toContain('Naia');
  });

  it('lote sem voz própria cai na voz da área; o Torneio segue com o Vultrak', () => {
    expect(lotNpcVoice('arena', 'torneio', 'pt-BR')).toEqual(areaNpcVoice('arena', 'pt-BR'));
    expect(lotNpcArt('arena', 'torneio')).toBe(AREA_NPC_ART.arena);
  });

  it('os 10 bustos de lote da leva npcs-flare (30/09/2026) são arte PRÓPRIA — nenhum placeholder no bundle', () => {
    const lotes: Array<[Parameters<typeof lotNpcArt>[0], string, string]> = [
      ['arena', 'duelo', 'Naia'], ['hall', 'feira', 'Fanfare'], ['jogos', 'mente', 'Tessela'],
      ['jogos', 'refugio', 'Marim'], ['mercado', 'conquistas', 'Medra'], ['laboratorio', 'amigos', 'Zumi'],
      ['hall', 'guilda', 'Aurea'], ['laboratorio', 'pet', 'Tinta'], ['laboratorio', 'stats', 'Sumi'],
      ['exploracao', 'passeio', 'Lisel'],
    ];
    const artes = lotes.map(([a, l]) => lotNpcArt(a, l));
    expect(new Set(artes).size).toBe(lotes.length);
    for (const [a, l, nome] of lotes) {
      // G3 (02/10/2026): o Salão da Guilda usa o busto da Bastia (`npc-f-guarda`), já aprovado.
      // 07/10/2026: Amigos (Trill), Arquivo (Faro) e Santuário (Oriel) trocaram de busto a pedido do dono.
      const TROCADOS: Record<string, string> = { 'arena:duelo': 'npc-extra-arena-duelo', 'jogos:refugio': 'npc-oceano-jogos-refugio', 'hall:guilda': 'npc-luz-hall-guilda', 'hall:feira': 'npc-arena-feira', // a Feira mudou da Arena para o Hall (11/10/2026); o arquivo mantém o nome da leva
        'laboratorio:amigos': 'npc-extra-filhote-de-mel', 'laboratorio:pet': 'npc-agua-laboratorio-pet', 'laboratorio:stats': 'npc-agua-laboratorio-stats' };
      const arquivo = TROCADOS[`${a}:${l}`] ?? `npc-${a}-${l}`;
      expect(lotNpcArt(a, l)).toMatch(new RegExp(arquivo));
      expect(Object.values(AREA_NPC_ART)).not.toContain(lotNpcArt(a, l));
      for (const lang of ['pt-BR', 'en-US'] as const) expect(lotNpcVoice(a, l, lang).name).toContain(nome);
    }
    const dir = path.resolve(__dirname, '../../assets/soulmon/npcs');
    expect(fs.readdirSync(dir).filter(f => f.includes('placeholder'))).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')).not.toMatch(/PLACEHOLDER_NPC_ART|poring/i);
  });

  it('o nome antigo do NPC do Arquivo (ex-Meu Soulmon) saiu: é Tinta nos dois idiomas', () => {
    expect(lotNpcVoice('laboratorio', 'pet', 'pt-BR').name).toMatch(/^Tinta/);
    expect(lotNpcVoice('laboratorio', 'pet', 'en-US').name).toMatch(/^Tinta/);
  });

  it('os 3 NPCs de função (Faro, Sona e Tobi saíram, 18/10/2026) têm arte própria e voz nos dois idiomas', () => {
    const nomes = { onboarding: 'Ambra', oraculo: 'Iris', cuidados: 'Nuri' } as const;
    expect(new Set(Object.values(FUNCTION_NPC_ART)).size).toBe(3);
    for (const [id, nome] of Object.entries(nomes) as Array<[keyof typeof nomes, string]>) {
      expect(FUNCTION_NPC_ART[id]).toMatch(new RegExp(`npc-${id}`));
      for (const lang of ['pt-BR', 'en-US'] as const) {
        const v = functionNpcVoice(id, lang);
        expect(v.name).toBe(nome);
        expect(v.line.length).toBeGreaterThan(0);
        expect(v.line).not.toMatch(/\d/);
      }
    }
  });
});

describe('as bancas do Mercado têm nome próprio (01/10/2026)', () => {
  it('Itens é a Lamela e Decoração é a Lasca — não herdam mais o Grom', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      expect(lotNpcVoice('mercado', 'itens', lang).name).toMatch(/^Lamela/);
      expect(lotNpcVoice('mercado', 'decoracao', lang).name).toMatch(/^Lasca/);
      for (const l of ['itens', 'decoracao']) {
        const v = lotNpcVoice('mercado', l, lang);
        expect(v.name).not.toContain('Grom');
        expect(v.line).not.toMatch(/\d|Bits|!/);
      }
    }
  });
});

describe('o Ferreiro (07/10/2026): lote do Mercado para os equipamentos', () => {
  it('existe, com rótulo EN/PT, Vínculo 2 e o NPC Vitra', () => {
    expect(mercadoLots('en-US').find(l => l.id === 'ferreiro')?.label).toBe('Soulsmith');
    expect(mercadoLots('pt-BR').find(l => l.id === 'ferreiro')?.label).toBe('Soulsmith');
    expect(BUILDING_GATES['mercado.ferreiro'].minBond).toBe(2);
    expect(lotNpcVoice('mercado', 'ferreiro', 'en-US').name).toContain('Vitra');
    expect(lotNpcVoice('mercado', 'ferreiro', 'pt-BR').name).toContain('Vitra');
  });
  it('a folha do lote abre a ForgeCard, e as Estatísticas não a montam mais', () => {
    const lerSrc = (f: string) => fs.readFileSync(path.resolve(__dirname, f), 'utf8');
    expect(lerSrc('./AreaView.tsx')).toMatch(/open\?\.id === 'ferreiro' && <ForgeCard/);
    expect(lerSrc('../StatsPage.tsx')).not.toMatch(/<ForgeCard/);
  });
});

