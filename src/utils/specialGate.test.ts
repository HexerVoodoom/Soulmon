/**
 * O PORTÃO DO ESPECIAL (11/10/2026): "enquanto rola um especial, PARE os ataques dos dois e retome depois; especiais
 * são usados UM DE CADA VEZ". Pura, sem React: ordem e pausa medidas passo a passo, e a garantia de que é só
 * ENCENAÇÃO (nada do núcleo é tocado).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { avancar, bloqueiaAplicar, bloqueiaComecar, fechar, serializarEspeciais, type ConfigDoPortao, type Portao } from './specialGate';
import { simulatePvp, type DuelSide } from './combate/duel';
import { duelSide } from '../../functions/api/_duel.js';
import { impactMs, specialLeadMs, specialTailMs, SPECIAL_INTRO_MS, totalMs } from './combatFx';

const cfg: ConfigDoPortao = { leadMs: specialLeadMs(false), tailMs: specialTailMs(false), respiroS: impactMs('ranged', false) / 1000 };

describe('a janela do especial vem dos tempos da cena (um lugar só)', () => {
  it('lead = cena do nome + trajeto até a batida; tail = o resto do efeito', () => {
    expect(specialLeadMs(false)).toBe(SPECIAL_INTRO_MS + impactMs('special', false));
    expect(specialLeadMs(false) + specialTailMs(false)).toBe(SPECIAL_INTRO_MS + totalMs('special', false));
    expect(specialTailMs(true)).toBeGreaterThan(0); // movimento reduzido reduz o movimento, nunca a pausa
  });
});

describe('o relógio PARA durante a cena e a cauda, e RETOMA depois', () => {
  it('fechar não deixa o relógio passar do instante do `cast`', () => {
    const f = fechar(5, 10, 10.12, cfg);
    expect(f.relogioS).toBe(10);
    expect(f.portao).toMatchObject({ fase: 'lead', idx: 5, t: 10 });
  });

  it('nada começa nem se aplica a partir do `cast` na cena; a batida acontece UMA vez, no fim do `lead`; a cauda segura; depois solta', () => {
    let { portao, relogioS } = fechar(5, 10, 10, cfg) as { portao: Portao | null; relogioS: number };
    const eventos: string[] = [];
    let ms = 0;
    for (let i = 0; i < 400 && portao; i++) {
      const antes = portao;
      expect(bloqueiaComecar(portao)).toBe(true);
      if (portao.fase === 'lead') expect(bloqueiaAplicar(portao, 5)).toBe(true);
      else expect(bloqueiaAplicar(portao, 5)).toBe(false); // na cauda o golpe do especial já foi aplicado
      expect(bloqueiaAplicar(portao, 4)).toBe(false);       // o que veio ANTES do cast nunca fica preso
      const p = avancar(portao, 50, relogioS, cfg);
      ms += 50;
      if (p.bateu) eventos.push(`bateu@${ms}`);
      if (p.soltou) eventos.push(`soltou@${ms}`);
      if (p.portao) expect(p.relogioS).toBe(relogioS); // parado enquanto o portão existe
      portao = p.portao; relogioS = p.relogioS;
      void antes;
    }
    expect(eventos.length).toBe(2);
    const [bateu, soltou] = eventos.map(e => Number(e.split('@')[1]));
    expect(bateu).toBeGreaterThanOrEqual(cfg.leadMs);
    expect(bateu).toBeLessThan(cfg.leadMs + 100);
    expect(soltou - bateu).toBeGreaterThanOrEqual(cfg.tailMs);
    expect(soltou - bateu).toBeLessThan(cfg.tailMs + 100);
    // retomou RECUADO: o primeiro golpe depois tem a animação inteira, em vez de ser cortado
    expect(relogioS).toBeCloseTo(10 - cfg.respiroS, 9);
  });
});

describe('especiais no MESMO instante (o espelho) saem um de cada vez: cast A, golpe A, cast B, golpe B', () => {
  const lado = (): DuelSide => duelSide({ evolutionStage: 'rookie', perfectDays: 3 }) as unknown as DuelSide;
  /** Uma semente em que os dois casts caem no mesmo instante (o núcleo os emite juntos, antes dos golpes). */
  const semente = (): number => {
    for (let s = 1; s < 3000; s++) {
      const ev = simulatePvp({ me: lado(), opp: lado(), seed: s, taps: [] }).events;
      const i = ev.findIndex(e => e.kind === 'cast');
      if (i >= 0 && ev[i + 1]?.kind === 'cast' && ev[i + 1].t === ev[i].t) return s;
    }
    throw new Error('sem semente com casts simultâneos');
  };

  it('reordena a exibição, mantém o conjunto de eventos e o retrato final, e a vida nunca SOBE no meio', () => {
    const r = simulatePvp({ me: lado(), opp: lado(), seed: semente(), taps: [] });
    const v = serializarEspeciais(r.events, r.fx);
    const i = r.events.findIndex(e => e.kind === 'cast');
    expect(r.events.slice(i, i + 4).map(e => e.kind)).toEqual(['cast', 'cast', 'attack', 'attack']);
    expect(v.events.slice(i, i + 4).map(e => `${e.kind}${e.side}`)).toEqual(['cast0', 'attack0', 'cast1', 'attack1']);
    // mesmo conjunto, mesmo tamanho; os de fora do trecho são os MESMOS objetos
    expect(v.events.length).toBe(r.events.length);
    expect(v.events.slice(i + 4)).toEqual(r.events.slice(i + 4));
    // o retrato ao fim do trecho é o original (a soma dos deltas fecha)
    for (const lado of [0, 1] as const) {
      expect(v.events[i + 3].hp[lado]).toBeCloseTo(r.events[i + 3].hp[lado], 9);
      expect(v.events[i + 3].energy[lado]).toBeCloseTo(r.events[i + 3].energy[lado], 9);
    }
    // nada regride no meio: sem cura envolvida, o HP de cada lado só desce
    for (let k = i + 1; k < i + 4; k++) {
      expect(v.events[k].hp[0]).toBeLessThanOrEqual(v.events[k - 1].hp[0] + 1e-9);
      expect(v.events[k].hp[1]).toBeLessThanOrEqual(v.events[k - 1].hp[1] + 1e-9);
    }
    // o `fx` acompanha a permutação (um par por evento)
    expect(v.fx.length).toBe(r.fx.length);
  });

  it('sem casts simultâneos devolve a MESMA ordem (a função é a identidade fora do espelho)', () => {
    const ev = [
      { kind: 'attack', t: 1, side: 0 as const, hp: [1, 0.9] as const, energy: [0, 0] as const },
      { kind: 'cast', t: 2, side: 1 as const, hp: [1, 0.9] as const, energy: [0, 0] as const },
      { kind: 'attack', t: 2, side: 1 as const, hp: [0.8, 0.9] as const, energy: [0, 0] as const },
      { kind: 'cast', t: 2.4, side: 0 as const, hp: [0.8, 0.9] as const, energy: [0, 0] as const },
    ];
    const v = serializarEspeciais(ev, ev.map((_, i) => i));
    expect(v.events).toEqual(ev);
    expect(v.fx).toEqual([0, 1, 2, 3]);
  });
});

describe('é só encenação — o núcleo e o servidor não são tocados', () => {
  it('o portão não importa nada do motor de combate nem do servidor', () => {
    const fonte = readFileSync(join(__dirname, 'specialGate.ts'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(fonte).not.toMatch(/from\s+['"]\.\/combate/);
    expect(fonte).not.toMatch(/functions\/api/);
    expect(fonte).not.toMatch(/Math\.random/);
  });
});
