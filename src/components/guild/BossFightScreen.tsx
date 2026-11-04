/**
 * A LUTA CONTRA O CHEFE DA FEIRA (`docs/PLANO-FEIRA-CHEFE.md` §3, F-08/F-09).
 *
 * Puramente APRESENTAÇÃO: recebe o replay que o servidor validou (a lista de eventos do mesmo formato que `fightSteps`
 * produz) e o toca na `BattleStage` em modo `boss`; ao fim mostra o `ResultScreen` na variante `kind: 'boss'`.
 * Nenhuma regra de jogo aqui: o dano, o pool e as recompensas chegam prontos do servidor.
 *
 * Só AGREGADO: a barra é a do pool do clã (`poolPct*`) e a única cifra é o dano do PRÓPRIO jogador (`myDamage`).
 * Nenhum dado por membro entra por estas props (LV-G1). Tom: o chefe "recua / foge", nunca "você falhou".
 *
 * Torcida (cheer, 30/10/2026): acontece ANTES do golpe, em `BossCheerPrelude`; os toques vão na requisição e o SERVIDOR os põe
 * na simulação. Este replay só toca o que ele devolveu (nenhum toque aqui muda nada).
 * Mudo: nenhum som novo (a `BattleStage` só toca os efeitos que já tinha).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { lotIconName } from '../../utils/lotIcons';
import { BattleStage, BATTLE_LAYER_STYLE, type StageAction, type StageFighter, type StageHit } from '../games/BattleStage';
import { ResultScreen, type ResultLedgerRow } from '../games/ResultScreen';
import type { FightEvent } from '../../utils/combate/fight';
import { impactMs, introMs, prefersReducedMotion, specialLeadMs, specialTailMs, type StageActionKind } from '../../utils/combatFx';
import { avancar as avancarPortao, bloqueiaAplicar, bloqueiaComecar, fechar as fecharPortao, type ConfigDoPortao, type Portao } from '../../utils/specialGate';
import { FEIRA_SCENE } from '../../utils/dungeonScenes';
import { ENERGY_TRIGGER } from '../../utils/combate/specials';
import { BOSS_ROSTER, bossArt, bossText } from '../../data/bossRoster';
import type { Language } from '../../utils/i18n';

export interface BossFightMe {
  sprite: string;
  name: string;
  /** Id de elemento (sem arte cai no neutro). */
  element: string;
  /** Porte do bicho (`utils/spriteScale.ts`). */
  scale?: number;
  /** HP de exibição do SEU Soulmon (o replay só traz a fração). Padrão 100. */
  maxHp?: number;
}

export interface BossFightScreenProps {
  language: Language;
  /** Slug do chefe em `BOSS_ROSTER` (ex.: `arauto-do-fim`). */
  bossId: string;
  level: number;
  /** Pool do clã (agregado) em % antes e depois deste golpe. */
  poolPctBefore: number;
  poolPctAfter: number;
  /** Dano do PRÓPRIO jogador neste golpe. */
  myDamage: number;
  /** O replay do servidor: lado 0 = o jogador, lado 1 = o chefe. */
  events: readonly FightEvent[];
  me: BossFightMe;
  /** Forma do golpe básico do jogador (padrão à distância). */
  meStrike?: 'melee' | 'ranged';
  /** Recompensa quando dada (só no abate): seiva da Casa e Emblemas. */
  rewards?: { sap?: number; emblems?: number };
  /** Botão final da tela de resultado. */
  onDone: () => void;
  /** Teste/inspeção: pula o replay e abre o resultado. */
  skipReplay?: boolean;
}

/** O replay nunca passa disto em tempo de parede (s): lutas mais longas são aceleradas. */
const MAX_REPLAY_S = 18;
const TICK_MS = 50;
/** Respiro entre o último golpe e a tela de resultado. */
const END_BEAT_MS = 1100;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export function BossFightScreen(p: BossFightScreenProps) {
  const isPt = p.language === 'pt-BR';
  const entry = useMemo(() => BOSS_ROSTER.find(b => b.id === p.bossId), [p.bossId]);
  const text = entry ? bossText(entry, isPt) : { name: p.bossId, papel: '', elements: [], lore: '' };
  // O Arauto tem corpo inteiro próprio; os demais usam a única arte (a criatura inteira, 512×512).
  const art = bossArt(p.bossId, 'corpo-inteiro') ?? bossArt(p.bossId) ?? '';
  const bossElement = entry?.elements[0]?.id ?? 'neutro';
  const meMax = p.me.maxHp ?? 100;

  const events = useMemo(() => [...p.events].sort((a, b) => a.t - b.t), [p.events]);
  /** O `attack` no mesmo instante do `cast` do mesmo lado é o GOLPE do especial (não abre ação própria). */
  const specialHit = useMemo(() => {
    const set = new Set<FightEvent>();
    const castAt = new Map<number, number>();
    for (const e of events) {
      if (e.kind === 'cast') castAt.set(e.side, e.t);
      else if (e.kind === 'attack' && castAt.get(e.side) === e.t) set.add(e);
    }
    return set;
  }, [events]);
  /** Soma da fração que o JOGADOR tirou do chefe: reparte o dano e o pool entre os golpes. */
  const myTotal = useMemo(() => events.reduce((a, e) => a + ((e.kind === 'attack' || e.kind === 'tick') && e.side === 0 ? e.frac : 0), 0), [events]);

  const [phase, setPhase] = useState<'fight' | 'result'>(p.skipReplay || events.length === 0 ? 'result' : 'fight');
  const [action, setAction] = useState<StageAction | null>(null);
  const [hits, setHits] = useState<StageHit[]>([]);
  const [meHp, setMeHp] = useState(1);
  const [energy, setEnergy] = useState<{ me: number; foe: number }>({ me: 0, foe: 0 });
  const [pool, setPool] = useState(clampPct(p.poolPctBefore));
  const seq = useRef(0);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (phase !== 'fight') return undefined;
    const rd = reduced.current;
    const lastT = events.length ? events[events.length - 1].t : 0;
    const speed = Math.max(1, lastT / MAX_REPLAY_S);
    const leadS = (k: StageActionKind) => (impactMs(k, rd) + introMs(k)) / 1000;
    const kindOf = (e: FightEvent): StageActionKind | null => {
      if (e.kind === 'cast') return 'special';
      if (e.kind === 'attack' && !specialHit.has(e)) return e.side === 0 ? p.meStrike ?? 'ranged' : 'ranged';
      return null;
    };
    let started = 0;
    let applied = 0;
    let mine = 0;
    let meNow = 1; // VIDA INTEIRA (30/10/2026): o número do golpe = o que a barra mostrada perdeu
    let finished = false;
    let endId: number | undefined;
    /* O PROJÉTIL DO ESPECIAL SUMIA (bug, 04/11/2026): a cena tem UM `action`, e o replay acelerado (`speed`) disparava o
       golpe seguinte — às vezes no MESMO tick — por cima do especial, que nunca chegava a aparecer. Agora é o mesmo
       portão do Duelo (`utils/specialGate.ts`): no `cast` o relógio PARA pela cena + trajeto + cauda, e só depois o
       próximo golpe começa. O tempo do portão é de PAREDE (não acelera). Só encenação: o replay do servidor é o mesmo. */
    const cfgPortao: ConfigDoPortao = { leadMs: specialLeadMs(rd), tailMs: specialTailMs(rd), respiroS: (impactMs('ranged', rd) / 1000) * speed };
    let portao: Portao | null = null;
    let clock = 0;
    let last = performance.now();
    const fire = (e: FightEvent, k: StageActionKind) => {
      const mineSide = e.side === 0;
      setAction({ id: ++seq.current, actor: mineSide ? 'me' : 'foe', foe: 0, kind: k, strike: k === 'special' ? 'ranged' : undefined, element: mineSide ? p.me.element : bossElement });
    };
    const id = window.setInterval(() => {
      if (finished) return;
      const now = performance.now();
      const dt = Math.max(0, now - last);
      last = now;
      if (portao) {
        const passo = avancarPortao(portao, dt, clock, cfgPortao);
        portao = passo.portao;
        clock = passo.relogioS;
      } else {
        clock += (dt / 1000) * speed;
      }
      while (!bloqueiaComecar(portao) && started < events.length) {
        const e = events[started];
        const k = kindOf(e);
        if (k === 'special') {
          if (e.t > clock) break;
          fire(e, k);
          const f = fecharPortao(started, e.t, clock, cfgPortao);
          portao = f.portao;
          clock = f.relogioS;
          started++;
          break;
        }
        if (e.t - (k ? leadS(k) * speed : 0) > clock) break;
        if (k) fire(e, k);
        started++;
      }
      while (
        applied < events.length && events[applied].t <= clock && !bloqueiaAplicar(portao, applied)
        && !(events[applied].kind === 'cast' && applied >= started)
      ) {
        const e = events[applied];
        applied++;
        if (applied > started) started = applied;
        const meBefore = meNow;
        meNow = clamp01(e.hp[0]);
        setMeHp(meNow);
        setEnergy({ me: Math.max(0, e.energy[0]), foe: Math.max(0, e.energy[1]) });
        if ((e.kind === 'attack' || e.kind === 'tick') && e.frac > 1e-9) {
          const toBoss = e.side === 0;
          const mineBefore = mine;
          if (toBoss) {
            mine += e.frac;
            const share = myTotal > 0 ? mine / myTotal : 1;
            setPool(clampPct(p.poolPctBefore + (p.poolPctAfter - p.poolPctBefore) * share));
          }
          // cumulativo: os números do chefe somam exatamente `myDamage`; os do pet = a queda inteira da barra dele
          const value = toBoss
            ? Math.max(1, myTotal > 0 ? Math.round((p.myDamage * mine) / myTotal) - Math.round((p.myDamage * mineBefore) / myTotal) : 0)
            : Math.max(1, Math.round(meBefore * meMax) - Math.round(meNow * meMax));
          setHits([{ id: ++seq.current, side: toBoss ? 'foe' : 'me', foe: 0, value, big: specialHit.has(e) }]);
        }
      }
      if (applied >= events.length && !portao) {
        finished = true;
        setPool(clampPct(p.poolPctAfter));
        endId = window.setTimeout(() => setPhase('result'), rd ? 300 : END_BEAT_MS);
      }
    }, TICK_MS);
    return () => { window.clearInterval(id); if (endId !== undefined) window.clearTimeout(endId); };
    // O replay nasce uma vez por montagem: as props são dados já fechados do servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'result') {
    const defeated = p.poolPctAfter <= 0;
    const ledger: ResultLedgerRow[] = [];
    if (p.rewards?.sap && p.rewards.sap > 0) {
      ledger.push({ key: 'sap', kind: 'node', label: isPt ? 'Seiva da Casa' : 'House sap', node: <span className="sm2-num" data-result-sap style={{ fontWeight: 600 }}>+{p.rewards.sap}</span> });
    }
    if (p.rewards?.emblems && p.rewards.emblems > 0) ledger.push({ key: 'emblems', kind: 'honor', value: p.rewards.emblems });
    return (
      <ResultScreen
        playAgainIcon={lotIconName('hall', 'feira')}
        language={p.language}
        kind="boss"
        outcome={defeated ? 'win' : 'calm'}
        gameName={text.name}
        title={defeated ? (isPt ? 'O caminho abriu' : 'The way is open') : (isPt ? `${text.name} fugiu por ora` : `${text.name} fled, for now`)}
        line={isPt ? `Você causou ${p.myDamage} de dano.` : `You dealt ${p.myDamage} damage.`}
        pool={{ label: isPt ? 'Força do chefe' : 'Boss strength', before: p.poolPctBefore, after: p.poolPctAfter }}
        petSrc={p.me.sprite}
        opponentSrc={art || undefined}
        ledger={ledger}
        homeLabel={isPt ? 'Continuar' : 'Continue'}
        onHome={p.onDone}
        testId="boss-result"
      />
    );
  }

  const foe: StageFighter = { key: `boss-${p.bossId}`, sprite: art, name: text.name, hp: pool, maxHp: 100, element: bossElement };
  const meFighter: StageFighter = { key: 'me', sprite: p.me.sprite, scale: p.me.scale, name: p.me.name, hp: meHp * meMax, maxHp: meMax, element: p.me.element, energy: energy.me / ENERGY_TRIGGER };
  return (
    <div style={BATTLE_LAYER_STYLE} data-boss-fight data-boss-id={p.bossId}>
      <BattleStage
        scene={FEIRA_SCENE.bg}
        me={meFighter}
        foes={[foe]}
        action={action}
        hit={hits}
        title={isPt ? 'Chefe da Feira' : 'Fair boss'}
        closeLabel={isPt ? 'Pular para o resultado' : 'Skip to the result'}
        onClose={() => setPhase('result')}
        fast={reduced.current}
        isPt={isPt}
        boss={{ poolPct: pool, name: text.name, levelLabel: isPt ? `Nv ${p.level}` : `Lv ${p.level}` }}
      />
    </div>
  );
}
