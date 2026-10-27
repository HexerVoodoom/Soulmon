/**
 * LUTA DO CALABOUÇO (beta3 N7) — o combate do `RogueDungeon` deixou de ser um número escondido e virou uma LUTA VISÍVEL na mesma
 * `BattleStage` (tela cheia) que a Masmorra, o Duelo e a Arena usam. O núcleo v3 decide tudo (`groupFightSteps` pela semente de
 * `rogueFightSetup`); o relógio da cena é o `useGroupBattle`, com o especial AUTOMÁTICO (sem anel nem esquiva) como na Fenda.
 *
 * Contrato com o `RogueDungeon`: `onResult(won)` é chamado UMA vez, só depois do jogador tocar em "Continuar" (ou sair da luta, o
 * que conta como derrota). A superfície NASCE MUDA: nenhum som novo aqui (os golpes tocam os sons que a `BattleStage` já tem).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { BattleStage, BATTLE_LAYER_STYLE } from './games/BattleStage';
import { useGroupBattle, type GroupRound, type GroupScene } from './games/useGroupBattle';
import { RING_TAG, DODGE_TAG, PERSONAL_TAG } from './games/pveTags';
import { sm2Button } from './form/FormKit';
import { fxElementId, dungeonEnemyElement, dungeonFoeSpecialLabel, prefersReducedMotion, elementStrikeForm, specialLabel } from '../utils/combatFx';
import { fighterIdentity } from '../utils/fighterIdentity';
import { dungeonFamily, dungeonFight, dungeonPlayerSide, autoDodgeGrade, autoRingGrade } from '../utils/dungeonFight';
import { dungeonWaveOf } from '../utils/dungeonAway';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { getSpriteForStage } from '../utils/sprites';
import { usePetScale } from '../hooks/usePetScale';
import { DUNGEON_SCENES } from '../utils/dungeonScenes';
import { ENERGY_TRIGGER } from '../utils/combate/specials';
import type { Combatant } from '../utils/combate/curve';
import type { GroupResult } from '../utils/combate/group';
import type { Language } from '../utils/i18n';
import { wildFoeLabel } from '../utils/wildFoeLabel';
import { rogueFightSetup, type RogueRun } from '../utils/rogueDungeon';

export interface RogueFightProps {
  language: Language;
  run: RogueRun;
  step: number;
  /** `soulCombatant(estado)` do pet (sem os bônus da incursão: `rogueFightSetup` os soma). */
  combatant: Combatant;
  skills?: FichaSkills;
  petElement?: string;
  evolutionStage?: string;
  demoCharacterId?: string;
  /** Andar atual (1..3): escolhe o cenário. */
  floor: number;
  /** Chamado UMA vez, depois de "Continuar" (ou de sair da luta = derrota). */
  onResult: (won: boolean, foeName: string, hpLeft: number) => void;
}

export function RogueFight({ language, run, step, combatant, skills, petElement, evolutionStage = 'rookie', demoCharacterId, floor, onResult }: RogueFightProps) {
  const isPt = language === 'pt-BR';
  const lang = isPt ? 'pt' : 'en';
  const setup = useMemo(() => rogueFightSetup(run, step, combatant), [run, step, combatant]);
  const par = stageSkillsFor(skills, evolutionStage);
  const ident = useMemo(() => fighterIdentity(par, petElement), [par, petElement]);
  const family = dungeonFamily(par?.especial);
  const enemy = useMemo(() => {
    const wave = dungeonWaveOf(setup.seed, setup.ref.floor, combatant.level, evolutionStage);
    return wave[Math.min(wave.length - 1, setup.ref.slot)];
  }, [setup, combatant.level, evolutionStage]);
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId, 256);
  const petScale = usePetScale(evolutionStage, petSprite);
  const petEl = fxElementId(ident.basico.elemento);
  const foeEl = fxElementId(dungeonEnemyElement(enemy));
  const hpMax = Math.max(1, Math.round(dungeonPlayerSide({ combatant: setup.combatant, family }).combatant.hp));
  const foeMax = Math.max(1, Math.round(setup.foe.combatant.hp));
  const bg = DUNGEON_SCENES[(floor - 1) % DUNGEON_SCENES.length].bg;

  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 3>(1);
  const [end, setEnd] = useState<GroupResult | null>(null);
  const reportedRef = useRef(false);
  const reduced = useRef(prefersReducedMotion());

  const report = useCallback((won: boolean, hpLeft?: number) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    onResult(won, wildFoeLabel(enemy.stage, isPt), hpLeft ?? 0);
  }, [onResult, enemy.stage, isPt]);

  const round = useCallback((): GroupRound => {
    const f = dungeonFight({ combatant: setup.combatant, family, startShield: setup.startShield }, setup.foe, setup.seed, true);
    return {
      player: f.player, foes: f.foes, seed: f.seed, startHp: setup.startHp, startEnergy: 0,
      hitScale: f.hitScale,
      castScale: ({ who, ring, dodge }) => f.castScale({ who, ring, dodge }),
    };
  }, [setup, family]);

  const scene = useCallback((): GroupScene => ({
    playerMaxHp: hpMax,
    foeMaxHp: [foeMax],
    playerElement: sp => fxElementId(sp ? ident.especial.elemento : ident.basico.elemento),
    foeElement: () => foeEl,
    playerKind: sp => (sp ? ident.especial.forma : ident.basico.forma),
    foeKind: (_f, sp) => elementStrikeForm(foeEl, sp ? 'especial' : 'basica'),
    labels: { blocked: isPt ? 'Defendeu!' : 'Defended!', ring: RING_TAG[lang], dodge: DODGE_TAG[lang] },
    personalTag: PERSONAL_TAG[lang][family],
    playerSpecialEscola: ident.especial.escola,
  }), [hpMax, foeMax, ident, foeEl, isPt, lang, family]);

  const autoSpecial = useMemo(() => ({
    ring: (n: number) => autoRingGrade(setup.seed, n),
    dodge: (n: number) => autoDodgeGrade(setup.seed, n),
  }), [setup.seed]);

  const battle = useGroupBattle({
    running: !end, paused, reduced: reduced.current, runKey: 1, seed: setup.seed,
    round, scene, onEnd: setEnd, torcida: false, speed, autoSpecial,
  });

  const won = end?.winner === 'player';
  const pronto = battle.stateKey === 1;
  const foeHp = pronto ? (battle.foesHp[0] ?? 1) : 1;
  const meHp = pronto ? battle.hp : setup.startHp;

  return (
    <div data-rogue-fight style={BATTLE_LAYER_STYLE}>
      <BattleStage
        specialLabel={specialLabel(isPt, par?.especial)}
        foeSpecialLabel={(f) => dungeonFoeSpecialLabel(isPt, enemy, f.element, f.name)}
        isPt={isPt}
        scene={bg}
        me={{
          key: 'me', sprite: petSprite, scale: petScale, name: isPt ? 'Você' : 'You', hp: Math.round(Math.max(0, meHp) * hpMax), maxHp: hpMax,
          element: petEl, energy: (pronto ? battle.petEnergy : 0) / ENERGY_TRIGGER, status: pronto ? battle.status.me : undefined,
        }}
        foes={[{
          key: `rogue-${step}`, sprite: enemy.sprite, name: wildFoeLabel(enemy.stage, isPt), hp: Math.round(Math.max(0, foeHp) * foeMax), maxHp: foeMax,
          element: foeEl, down: foeHp <= 1e-9,
          energy: setup.foe.special && pronto ? (battle.foeEnergy[0] ?? 0) / ENERGY_TRIGGER : undefined,
          status: pronto ? battle.status.foes[0] : undefined,
        }]}
        action={pronto ? battle.action : null}
        hit={pronto ? battle.hits : []}
        charging={pronto && battle.charging}
        ring={pronto ? battle.ring : null}
        onRingGrade={battle.resolveRing}
        dodge={pronto ? battle.dodge : null}
        onDodge={battle.swipe}
        petDodge={pronto ? battle.petDodge : null}
        mechLabels={{ strike: isPt ? 'Golpear' : 'Strike', dodgeLeft: isPt ? 'Esquivar para a esquerda' : 'Dodge left', dodgeRight: isPt ? 'Esquivar para a direita' : 'Dodge right' }}
        title={isPt ? `Andar ${floor} · luta` : `Floor ${floor} · fight`}
        fast={speed > 1}
        closeLabel={isPt ? 'Sair da luta (conta como derrota)' : 'Leave the fight (counts as a defeat)'}
        onClose={() => report(false)}
        exitConfirm={end ? undefined : {
          title: isPt ? 'Sair da luta? Ela conta como derrota e o dia no Calabouço acaba.' : 'Leave the fight? It counts as a defeat and ends your dungeon day.',
          stay: isPt ? 'Continuar lutando' : 'Keep fighting',
          leave: isPt ? 'Sair' : 'Leave',
        }}
        onPauseChange={setPaused}
      >
        {!end && (
          <button
            type="button" data-rogue-speed={speed} onClick={() => setSpeed(s => (s === 1 ? 3 : 1))}
            aria-label={isPt ? `Avanço rápido: ${speed}×. Toque para mudar para ${speed === 1 ? 3 : 1}×.` : `Fast forward: ${speed}×. Tap to change to ${speed === 1 ? 3 : 1}×.`}
            className="sm2-num"
            style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5, pointerEvents: 'auto', background: 'none', border: 'none', boxShadow: 'none', padding: 0, minWidth: 44, minHeight: 44, cursor: 'pointer', color: 'var(--sm2-viewport-ink)', fontSize: 16, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,.9)' }}
          >
            {speed}×
          </button>
        )}
        {end && (
          <div
            role="status" data-rogue-fight-end={won ? 'won' : 'lost'}
            style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 6, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 'var(--sm2-radius-md, 8px)', background: 'var(--sm2-viewport-bg)', border: '1px solid var(--sm2-viewport-ring)', color: 'var(--sm2-viewport-ink)', fontFamily: 'var(--sm2-font-text)', textAlign: 'center' }}
          >
            <p style={{ margin: 0, fontSize: 'var(--sm2-text-md, 16px)', fontWeight: 700 }}>
              {won ? (isPt ? `Você venceu ${wildFoeLabel(enemy.stage, true)}!` : `You defeated ${wildFoeLabel(enemy.stage, false)}!`) : (isPt ? `${wildFoeLabel(enemy.stage, true)} venceu.` : `${wildFoeLabel(enemy.stage, false)} won.`)}
            </p>
            {!won && <p style={{ margin: 0, fontSize: 'var(--sm2-text-sm, 14px)' }}>{isPt ? 'O dia no Calabouço acaba — volte amanhã.' : 'Your dungeon day ends — come back tomorrow.'}</p>}
            <button type="button" data-rogue-fight-continue onClick={() => report(won, end.hpLeft)} style={{ ...sm2Button('primary'), minHeight: 44 }}>
              {isPt ? 'Continuar' : 'Continue'}
            </button>
          </div>
        )}
      </BattleStage>
    </div>
  );
}
