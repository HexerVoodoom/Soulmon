// @vitest-environment jsdom
/**
 * Fix identidade do lutador: o MESMO personagem usa o MESMO golpe básico (elemento PRINCIPAL + forma da escola) e o MESMO
 * especial em Arena, Masmorra, Pesadelo, Duelo e Torneio, e o oponente o vê igual no PvP. O esperado sai da FICHA
 * (`buildStageSkills`) e da tabela da escola, NUNCA do dono único: assim o teste reprova o código antigo (vermelho) e
 * não é circular. Save realista: ficha que comprou o par `vapor` (dominante) e o oráculo diz `fogo` (base).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup, fireEvent } from '@testing-library/react';
import { buildStageSkills, type StageSkills } from '../utils/soulProfile/ficha/skills';
import { SCHOOL_STRIKE_FORM } from '../utils/soulProfile/ficha/strikeForm';
import type { Ficha } from '../utils/soulProfile/ficha/types';
import { ArenaGame } from './ArenaGame';
import { DungeonGame } from './DungeonGame';
import { NightmareBattle } from './NightmareBattle';
import { DuelScreen } from './DuelScreen';
import { duelSide } from '../../functions/api/_duel.js';
import { simulatePvp, type DuelSide } from '../utils/combate/duel';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { dungeonFoe, type DungeonEnemy } from '../utils/dungeon';
import { fxElementId } from '../utils/combatFx';

const regras: Array<{ el(sp: boolean): string; kind(sp: boolean): string }> = [];
const cenas: Array<{ action: { actor: string; kind: string; strike?: string; element?: string } | null }> = [];
vi.mock('./games/useGroupBattle', async (orig) => {
  const m = await orig<typeof import('./games/useGroupBattle')>();
  return {
    ...m,
    useGroupBattle: (o: Parameters<typeof m.useGroupBattle>[0]) => {
      regras.push({ el: (sp: boolean) => o.scene().playerElement(sp), kind: (sp: boolean) => o.scene().playerKind(sp) });
      return m.useGroupBattle(o);
    },
  };
});
vi.mock('./games/BattleStage', async (orig) => {
  const m = await orig<typeof import('./games/BattleStage')>();
  return { ...m, BattleStage: (p: Parameters<typeof m.BattleStage>[0]) => { cenas.push({ action: (p.action ?? null) as never }); return m.BattleStage(p); } };
});
vi.mock('../utils/sounds', () => ({ playFeed: vi.fn(), playTaskComplete: vi.fn() }));
vi.mock('../utils/arena', async (orig) => {
  const m = await orig<typeof import('../utils/arena')>();
  return { ...m, loadBestiaryPool: () => new Promise(() => {}) };
});

afterEach(() => { cleanup(); vi.useRealTimers(); regras.length = 0; cenas.length = 0; });

const ficha = (escolas: Ficha['escolas'], elementos: Ficha['elementos']): Ficha => ({
  nome: 'T', elementos, escolas, recursos: { mana: 2 }, talentos: {}, profissoes: {},
  totals: { elementos: 6, escolas: 0, recursos: 2, talentos: 0, profissoes: 0 },
});
/** Saves realistas: par comprado no topo (dominante combinado) e base no topo (especial = 2º colocado). */
const SAVES = {
  'par vapor no topo, maldição': ficha({ maldicao: 6, combate_fisico: 2 }, { fogo: 2, vapor: 2, agua: 1 }),
  'base no topo, combate físico': ficha({ combate_fisico: 7, conjuracao: 1 }, { fogo: 6, agua: 3 }),
  'base no topo, conjuração': ficha({ conjuracao: 7, benca: 1 }, { terra: 5, vida: 4 }),
};
const ORACULO = 'fogo'; // `soulmonMeta.dominantElement`: um elemento BASE que NÃO é o dominante da ficha em 2 dos 3 saves

function esperado(f: Ficha) {
  const par = buildStageSkills(f, 'rookie', 'seed-contrato');
  const dom = par.elementoDominante!.id;
  return {
    par,
    basico: { el: fxElementId(dom), forma: SCHOOL_STRIKE_FORM[par.basica.escolaId].basica },
    especial: { el: fxElementId(par.especial.elementoId), forma: SCHOOL_STRIKE_FORM[par.especial.escolaId].especial },
  };
}

const onda = (): DungeonEnemy[] => [{ name: 'S', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie, points: 1, slot: 0, floor: 1, foe: dungeonFoe(1, 0, 1) }];
type Skills = Partial<Record<'rookie', StageSkills>>;
const PVE: Record<string, (skills: Skills) => void> = {
  Arena: (skills) => { render(<ArenaGame evolutionStage="rookie" language="pt-BR" skills={skills} petElement={ORACULO} onExit={() => {}} />); },
  Masmorra: (skills) => {
    render(<DungeonGame evolutionStage="rookie" language="pt-BR" petElement={ORACULO} skills={skills} onEnter={() => ({ ok: true, level: 1, best: 0 })}
      onLose={() => {}} onEnemyDefeated={() => {}} onHeartDrop={() => false} onGlitchtama={() => {}} onEarnPoints={() => {}} onExit={() => {}} />);
  },
  Pesadelo: (skills) => {
    render(<NightmareBattle open wave={onda()} rarity="common" petStage="rookie" petElement={ORACULO} skills={skills} language="pt-BR"
      onWin={() => {}} onLose={() => {}} onClose={() => {}} />);
  },
};

/** Semente em que os DOIS lados soltam o especial antes do 1º nocaute. */
function sementeComEspecial(me: DuelSide, opp: DuelSide): number {
  for (let seed = 1; seed < 4000; seed++) {
    const ev = simulatePvp({ me, opp, seed, taps: [] }).events;
    const ko = ev.findIndex(e => e.kind === 'ko');
    const antes = ev.slice(0, ko < 0 ? ev.length : ko);
    if (antes.some(e => e.kind === 'cast' && e.side === 0) && antes.some(e => e.kind === 'cast' && e.side === 1)) return seed;
  }
  throw new Error('nenhuma semente com os dois especiais');
}

/** Corre o DuelScreen e devolve o que cada lado soltou (elemento + forma, básico e especial). */
function duelo(props: { me: DuelSide; opp: DuelSide; skills?: Skills; petElement?: string; oppElement?: string }) {
  vi.useFakeTimers();
  const onDone = vi.fn();
  render(<DuelScreen me={props.me} opp={props.opp} seed={sementeComEspecial(props.me, props.opp)} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt
    petElement={props.petElement} petStage="rookie" skills={props.skills} oppElement={props.oppElement} onDone={onDone} onClose={() => {}} />);
  for (let i = 0; i < 500 && !onDone.mock.calls.length; i++) {
    act(() => { vi.advanceTimersByTime(300); });
    const m = document.querySelector('[data-cheer-mascot]');
    if (m) for (let k = 0; k < 6; k++) fireEvent.click(m);
  }
  const ver = (actor: string) => {
    const a = cenas.map(c => c.action).filter((x): x is NonNullable<typeof x> => !!x && x.actor === actor);
    const basicos = a.filter(x => x.kind !== 'special'), especiais = a.filter(x => x.kind === 'special');
    return {
      basico: { el: new Set(basicos.map(x => x.element)), forma: new Set(basicos.map(x => x.kind)) },
      especial: { el: new Set(especiais.map(x => x.element)), forma: new Set(especiais.map(x => x.strike)) },
    };
  };
  return { me: ver('me'), foe: ver('foe') };
}

for (const [rotulo, f] of Object.entries(SAVES)) {
  describe(`identidade do lutador: ${rotulo}`, () => {
    const ex = esperado(f);
    const skills = { rookie: ex.par };

    for (const [tela, montar] of Object.entries(PVE)) {
      it(`${tela}: básico = elemento principal + forma da escola; especial = o próprio`, () => {
        montar(skills);
        const r = regras.at(-1)!;
        expect(r.el(false)).toBe(ex.basico.el);
        expect(r.kind(false)).toBe(ex.basico.forma);
        expect(r.el(true)).toBe(ex.especial.el);
        expect(r.kind(true)).toBe(ex.especial.forma);
      });
    }

    it('Torneio PvP: o SEU lado (ficha local) e o OPONENTE (fx do servidor) saem com a mesma identidade', () => {
      // o servidor deriva do SAVE (`soulmonSkills` congelado), nunca de campo cru do cliente
      const lado = duelSide({ evolutionStage: 'rookie', perfectDays: 3, soulmonSkills: skills }) as unknown as DuelSide;
      const r = duelo({ me: lado, opp: lado, skills, petElement: ORACULO, oppElement: 'agua' });
      for (const v of [r.me, r.foe]) {
        expect([...v.basico.el]).toEqual([ex.basico.el]);
        expect([...v.basico.forma]).toEqual([ex.basico.forma]);
        expect([...v.especial.el]).toEqual([ex.especial.el]);
        expect([...v.especial.forma]).toEqual([ex.especial.forma]);
      }
    });

    it('treino do Torneio (sem `petElement`): o servidor publica a identidade e a tela a usa', () => {
      const lado = duelSide({ evolutionStage: 'rookie', perfectDays: 3, soulmonSkills: skills }) as unknown as DuelSide;
      const r = duelo({ me: lado, opp: lado, skills });
      expect([...r.me.basico.el]).toEqual([ex.basico.el]);
      expect([...r.me.especial.el]).toEqual([ex.especial.el]);
    });
  });
}
