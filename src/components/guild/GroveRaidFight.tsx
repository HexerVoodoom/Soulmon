/**
 * A LUTA DO BOSQUE (30/10/2026, REGISTRO §204): o ataque ao Plantio virou combate em grupo na `BattleStage`, com torcida,
 * anel do especial e esquiva — o mesmo kit do Calabouço (`RogueFight`). O núcleo decide tudo pela semente (`groveRaidRound`);
 * esta tela só mostra. `onResult(won)` é chamado UMA vez, depois de "Continuar" (sair = derrota, que não custa nada).
 * Nasce MUDA (R-NOVA): nenhum som novo além dos que a `BattleStage` já toca.
 */
import { useHexOverrides } from '../../hooks/useHexOverrides';
import { hexFamily, hexIdentity } from '../../utils/hexsmith';
import { useCallback, useMemo, useRef, useState } from 'react';
import { BattleStage, BATTLE_LAYER_STYLE } from '../games/BattleStage';
import { TorcidaLayer } from '../games/TorcidaKit';
import { useGroupBattle, type GroupRound, type GroupScene } from '../games/useGroupBattle';
import { useBattleSpeed, BattleSpeedButton } from '../games/BattleSpeed';
import { RING_TAG, DODGE_TAG, PERSONAL_TAG } from '../games/pveTags';
import { sm2Button } from '../form/FormKit';
import { fxElementId, prefersReducedMotion, elementStrikeForm, specialLabel } from '../../utils/combatFx';
import { meleeImpactOf, chaveDaIdentidade } from '../../utils/combate/golpeImpacto';
import { fighterIdentity } from '../../utils/fighterIdentity';
import { dungeonFamily, dungeonPlayerSide } from '../../utils/dungeonFight';
import { stageSkillsFor, type FichaSkills } from '../../utils/soulProfile/ficha/stageSkillsFor';
import { getSpriteForStage } from '../../utils/sprites';
import { usePetScale } from '../../hooks/usePetScale';
import { ENERGY_TRIGGER } from '../../utils/combate/specials';
import { hpPoints } from '../../utils/combate/fight';
import type { Combatant } from '../../utils/combate/curve';
import type { GroupResult } from '../../utils/combate/group';
import { groveRaidLineup, groveRaidRound } from '../../utils/groveRaid';
import { temaSpriteOf } from '../../utils/temaInimigosArt';
import { PANORAMA_SRC, ARVORE_SRC } from '../../assets/bosque';
import { ESTACOES_BOSQUE, type EstacaoBosque } from '../../utils/bosqueArvores';

/**
 * O fundo da luta: o PANORAMA do Plantio (dono, 01/11/2026), o mesmo cenário do `PlantioVisor`/`GroveVisor`/`GroveCena` onde
 * aparecem as plantas plantadas, com o MESMO enquadramento do visor do Plantio (o terreno da clareira). CSS `background`
 * de verdade (`url(...)`), nunca a URL crua.
 */
export const GROVE_RAID_SCENE = `url(${PANORAMA_SRC}) 40% 88% / auto 230% no-repeat #1d3a2a`;

export interface GroveRaidFightProps {
  isPt: boolean;
  seed: number;
  combatant: Combatant;
  skills?: FichaSkills;
  petElement?: string;
  evolutionStage?: string;
  demoCharacterId?: string;
  /** O sprite ATUAL do jogador (a forma evoluída escolhida — a mesma fonte da Home e do Calabouço); sem ele, o do estágio. */
  mySprite?: string | null;
  /** Nível (1..5) de cada planta do Bosque; 0/ausente = nada. Só VISUAL (atrás dos lutadores): não toca em regra, dano nem resultado. */
  niveis?: Partial<Record<EstacaoBosque, number>>;
  onResult: (won: boolean) => void;
}

export function GroveRaidFight({ isPt, seed, combatant, skills, petElement, evolutionStage = 'rookie', demoCharacterId, mySprite, niveis, onResult }: GroveRaidFightProps) {
  const lang = isPt ? 'pt' : 'en';
  const par = stageSkillsFor(skills, evolutionStage);
  const hx = useHexOverrides(); // 🔣 Hexsmith: o que os itens equipados reescrevem
  const ident = useMemo(() => hexIdentity(fighterIdentity(par, petElement), hx), [par, petElement, hx]);
  const family = hexFamily(dungeonFamily(par?.especial), hx);
  const lineup = useMemo(() => groveRaidLineup(seed), [seed]);
  const cfg = useMemo(() => ({ combatant, family }), [combatant, family]);
  const proto = useMemo(() => groveRaidRound(cfg, seed), [cfg, seed]);
  const petSprite = mySprite || getSpriteForStage(evolutionStage, demoCharacterId, 256);
  const petScale = usePetScale(evolutionStage, petSprite);
  const hpMax = hpPoints(dungeonPlayerSide(cfg).combatant.hp);
  const foeMax = proto.foes.map(f => hpPoints(f.combatant.hp));
  const foeEl = lineup.map(e => fxElementId(e.element));

  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState<GroupResult | null>(null);
  const reported = useRef(false);
  const reduced = useRef(prefersReducedMotion());
  const report = useCallback((won: boolean) => {
    if (reported.current) return;
    reported.current = true;
    onResult(won);
  }, [onResult]);

  const round = useCallback((): GroupRound => {
    const r = groveRaidRound(cfg, seed);
    return { player: r.player, foes: r.foes, seed: r.seed, startHp: 1, startEnergy: 0, hitScale: r.hitScale, castScale: ({ who, ring, dodge }) => r.castScale({ who, ring, dodge }) };
  }, [cfg, seed]);

  const scene = useCallback((): GroupScene => ({
    playerMaxHp: hpMax,
    foeMaxHp: foeMax,
    playerElement: sp => fxElementId(sp ? ident.especial.elemento : ident.basico.elemento),
    foeElement: f => foeEl[f] ?? foeEl[0],
    playerKind: sp => (sp ? ident.especial.forma : ident.basico.forma),
    playerImpact: sp => meleeImpactOf({ element: sp ? ident.especial.elemento : ident.basico.elemento, key: chaveDaIdentidade(ident) }),
    foeImpact: f => meleeImpactOf({ element: foeEl[f] ?? foeEl[0], key: `${f}|${foeEl[f] ?? foeEl[0]}` }),
    foeKind: (f, sp) => elementStrikeForm(foeEl[f] ?? foeEl[0], sp ? 'especial' : 'basica'),
    labels: { blocked: isPt ? 'Defendeu!' : 'Defended!', ring: RING_TAG[lang], dodge: DODGE_TAG[lang] },
    personalTag: PERSONAL_TAG[lang][family],
    playerSpecialEscola: ident.especial.escola,
    playerSpecialElemento: ident.especial.elemento,
  }), [hpMax, foeMax, ident, foeEl, isPt, lang, family]);

  const { speed, cycle: cycleSpeed } = useBattleSpeed();
  const battle = useGroupBattle({ running: !end, paused, reduced: reduced.current, runKey: 1, seed, round, scene, onEnd: setEnd, torcida: true, speed });
  const pronto = battle.stateKey === 1;
  const won = end?.winner === 'player';

  return (
    <TorcidaLayer onTap={battle.cheer} active={!end && !paused && battle.phase === 'idle'} isPt={isPt} style={BATTLE_LAYER_STYLE} mascot swipeActive={battle.phase === 'dodge'} onSwipe={battle.swipe}>
      <div data-grove-raid style={{ display: 'contents' }} />
      <BattleStage
        specialLabel={specialLabel(isPt, par?.especial)}
        foeSpecialLabel={f => { const e = lineup.find(x => fxElementId(x.element) === f.element); return e ? (isPt ? e.especial.pt : e.especial.en) : f.name; }}
        isPt={isPt}
        scene={GROVE_RAID_SCENE}
        me={{
          key: 'me', sprite: petSprite, scale: petScale, name: isPt ? 'Você' : 'You', hp: Math.round(Math.max(0, pronto ? battle.hp : 1) * hpMax), maxHp: hpMax,
          element: fxElementId(ident.basico.elemento), energy: (pronto ? battle.petEnergy : 0) / ENERGY_TRIGGER, status: pronto ? battle.status.me : undefined,
        }}
        foes={lineup.map((e, i) => {
          const hp = pronto ? (battle.foesHp[i] ?? 1) : 1;
          return {
            key: `grove-${e.id}-${i}`, sprite: temaSpriteOf(e) ?? '', stage: e.stage, name: e.name, hp: Math.round(Math.max(0, hp) * foeMax[i]), maxHp: foeMax[i],
            element: foeEl[i], down: hp <= 1e-9,
            energy: proto.foes[i].special && pronto ? (battle.foeEnergy[i] ?? 0) / ENERGY_TRIGGER : undefined,
            status: pronto ? battle.status.foes[i] : undefined,
          };
        })}
        target={pronto ? battle.target : 0}
        picked={pronto ? battle.picked : null}
        onPickFoe={battle.pickTarget}
        action={pronto ? battle.action : null}
        hit={pronto ? battle.hits : []}
        charging={pronto && battle.charging}
        ring={pronto ? battle.ring : null}
        onRingGrade={battle.resolveRing}
        dodge={pronto ? battle.dodge : null}
        onDodge={battle.swipe}
        petDodge={pronto ? battle.petDodge : null}
        fast={speed > 1}
        mechLabels={{ strike: isPt ? 'Golpear' : 'Strike', dodgeLeft: isPt ? 'Esquivar para a esquerda' : 'Dodge left', dodgeRight: isPt ? 'Esquivar para a direita' : 'Dodge right' }}
        title={isPt ? 'Bosque · ataque' : 'Grove · raid'}
        closeLabel={isPt ? 'Sair da luta (não custa nada)' : 'Leave the fight (costs nothing)'}
        onClose={() => report(false)}
        exitConfirm={end ? undefined : {
          title: isPt ? 'Sair da luta? A planta não fica protegida hoje, mas você pode tentar de novo.' : "Leave the fight? The plant won't be protected yet, but you can try again.",
          stay: isPt ? 'Continuar lutando' : 'Keep fighting',
          leave: isPt ? 'Sair' : 'Leave',
        }}
        onPauseChange={setPaused}
      >
        {ESTACOES_BOSQUE.some(e => (niveis?.[e] ?? 0) > 0) && (
          <div aria-hidden="true" data-grove-raid-plantas style={{ position: 'absolute', left: 0, right: 0, bottom: '30%', height: '26%', zIndex: 1, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
            {ESTACOES_BOSQUE.filter(e => (niveis?.[e] ?? 0) > 0).map(e => {
              const nv = Math.min(5, niveis?.[e] ?? 0);
              return <img key={e} src={ARVORE_SRC[e][nv]} alt="" draggable={false} data-grove-raid-planta={e} data-nivel={nv} style={{ height: '100%', width: 'auto', maxWidth: '24%', objectFit: 'contain', objectPosition: 'bottom' }} />;
            })}
          </div>
        )}
        {!end && <BattleSpeedButton speed={speed} onCycle={cycleSpeed} isPt={isPt} corner />}
        {end && (
          <div role="status" data-grove-raid-end={won ? 'won' : 'lost'} style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 6, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 'var(--sm2-radius-md, 8px)', background: 'var(--sm2-viewport-bg)', border: '1px solid var(--sm2-viewport-ring)', color: 'var(--sm2-viewport-ink)', fontFamily: 'var(--sm2-font-text)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 'var(--sm2-text-md, 16px)', fontWeight: 700 }}>
              {won ? (isPt ? 'As pragas recuaram. A planta está protegida hoje.' : 'The pests fell back. The plant is safe today.') : (isPt ? 'As pragas resistiram. Nada se perdeu: tente de novo.' : 'The pests held on. Nothing was lost: try again.')}
            </p>
            <button type="button" data-grove-raid-continue onClick={() => report(won)} style={{ ...sm2Button('primary'), minHeight: 44 }}>{isPt ? 'Continuar' : 'Continue'}</button>
          </div>
        )}
      </BattleStage>
    </TorcidaLayer>
  );
}
