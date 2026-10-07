/**
 * A ARENA — cinco rodadas contra criaturas do bestiário, em GRUPO (N × 1), com o anel de 17
 * elementos e a habilidade especial da ficha do jogador.
 *
 * ## Combate v3 (PR3b, `docs/squad-alpha-runs/combate-v3-01`, contexto §2.15–§2.17)
 *
 * O MOTOR é o núcleo v3 (`utils/combate/`): o pet é `soulCombatant(estado)` (level e ramo → ATK/DEF/SPD/HP,
 * bônus 0), o especial é `specialOf(família)` com a área da skill (`StageSkill.area`) e os inimigos são
 * RELATIVOS ao level dele (`arenaFoe`) — as 5 rodadas de `ARENA_ROUND_COMP`, todos lutando ao mesmo
 * tempo (`groupFightSteps`). O bestiário só dá o sabor (nome, elemento, sprite), sorteado com a SEMENTE
 * da run — nunca `Math.random`. O jogo decide as regras em `utils/arena.ts`; o relógio da cena é
 * `games/useGroupBattle.ts`, que consome os eventos do gerador no relógio do núcleo.
 *
 * O dono TORCE tocando na tela (a barra de cheer despeja energia no pet); com a energia cheia o
 * núcleo pede o ANEL (o relógio pausa) e a nota volta como multiplicador do especial; quando o
 * inimigo solta o dele, o jogador pode ESQUIVAR deslizando o dedo. A defesa dos golpes normais é
 * AUTOMÁTICA (`utils/autoDefesa.ts`): é o `hitScale` do lado do inimigo.
 *
 * ## O que a Arena NÃO faz
 *
 * Não cobra corações, não toca na barra de cuidado do pet e não tem porta de entrada paga — a mesma
 * regra da Masmorra (`DungeonGame`). Perder (ou empatar) custa a run e mais nada, e não mexe em `hp`
 * nem em corações do save (REGISTRO §20.1). Isto é decisão de produto do `CLAUDE.md` ("encoraja —
 * NUNCA um cobrador"), não detalhe de implementação.
 *
 * ## A superfície (canvas Jogos, DECISÕES §25)
 *
 * A luta é a `BattleStage` em tela cheia; as outras fases (carregando, intro, rodada limpa, fim) são o
 * VISOR 348×160 (`games/GameKit.tsx`). O erro `sem-motor` é `cloud_off` num `role=status` (é rede,
 * não medalha).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TorcidaLayer } from './games/TorcidaKit';
import { playVictory } from '../utils/sounds';
import { useGroupBattle, type GroupRound, type GroupScene } from './games/useGroupBattle';
import { RING_TAG, DODGE_TAG, PERSONAL_TAG } from './games/pveTags';
import { CHEER_TAPS_FULL } from '../utils/energia';
import { BattleStage, BATTLE_LAYER_STYLE } from './games/BattleStage';
import { fxElementId, prefersReducedMotion, elementStrikeForm, specialLabel, foeSpecialLabel } from '../utils/combatFx';
import { fighterIdentity } from '../utils/fighterIdentity';
import { autoDefense, defenseRoll, newDefenseSeed } from '../utils/autoDefesa';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import { sm2Button, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, VisorFx, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import { getDungeonEnemySprite, getSpriteForStage } from '../utils/sprites';
import {
  ARENA_ROUNDS,
  DEFAULT_ARENA_ATTRIBUTES,
  PERFECT_ACC,
  ROUND_CLEAR_HEAL,
  arenaFoeCastScale,
  arenaFoeSides,
  arenaPlayerCastScale,
  arenaPlayerHitScale,
  arenaPlayerSide,
  arenaRoundSeed,
  arenaSpecialElementScale,
  autoDefenseHitScale,
  buildArenaRound,
  elementLabel,
  familyOfSkill,
  loadBestiaryPool,
  type ArenaEnemy,
  type ArenaPlayerCfg,
  type BestiaryCreature,
} from '../utils/arena';
import { mulberry32 } from '../utils/combate/rng';
import { CHEER, ENERGY_TRIGGER } from '../utils/combate/specials';
import type { GroupResult } from '../utils/combate/group';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { soulCombatant, type SoulXPState } from '../utils/soulXP';
import { useTalentBonus, useRiftTalents, riftBitsWith } from '../contexts/useTalentBonus';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import { fichaStageOf } from '../utils/soulProfile/ficha/stageSkillsFor';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import type { Language } from '../utils/i18n';

type Fase =
  | 'carregando' | 'sem-motor' | 'intro'
  | 'luta' | 'rodada-limpa' | 'venceu' | 'perdeu' | 'empatou';

export interface ArenaGameProps {
  evolutionStage: string;
  demoCharacterId?: string;
  language: Language;
  /** As skills da ficha, quando o save as tem. Sem elas a Arena abre com o par
   *  genérico de `buildDefaultArenaSkills` — o perfil do oráculo vive só no
   *  localStorage e não sobe para a nuvem, então um aparelho novo chega aqui
   *  sem ficha e não pode encontrar uma porta fechada. */
  skills?: Partial<Record<FichaStage, StageSkills>>;
  /** Elemento dominante do oráculo: só o FALLBACK da identidade quando o save não tem ficha (igual nas outras telas). */
  petElement?: string;
  /** Atributos de arena (`getArenaAttributes(ficha)`), quando conhecidos. */
  attrs?: { principal: string; secundario: string };
  onEarnPoints?: (points: number) => void;
  onExit: () => void;
}

export function ArenaGame({
  evolutionStage, demoCharacterId, language, skills, petElement, attrs, onEarnPoints, onExit,
}: ArenaGameProps) {
  const isPt = language === 'pt-BR';
  const lang = isPt ? 'pt' : 'en';
  const stage = fichaStageOf(evolutionStage);

  const [pool, setPool] = useState<BestiaryCreature[] | null>(null);
  const [fase, setFase] = useState<Fase>('carregando');
  const [rodada, setRodada] = useState(1);
  const [inimigos, setInimigos] = useState<ArenaEnemy[]>([]);
  const [pontos, setPontos] = useState(0);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausado, setPausado] = useState(false);
  const reduzido = useRef(prefersReducedMotion());

  /** A SEMENTE da run: o sabor das rodadas, o sorteio da defesa, do anel e da esquiva. Nunca `Math.random`. */
  const runSeedRef = useRef(newDefenseSeed());
  const [seedLuta, setSeedLuta] = useState(() => runSeedRef.current);
  /** Muda a cada rodada: reinicia o relógio da cena. */
  const [fightKey, setFightKey] = useState(0);
  /** O que passa de uma rodada para a outra: HP (fração) e energia do pet. */
  const hpCarryRef = useRef(1);
  const energyCarryRef = useRef(0);
  const rodadaRef = useRef(1);
  const inimigosRef = useRef<ArenaEnemy[]>([]);

  const par = skills?.[stage];
  const basica = par?.basica;
  const especial = par?.especial;
  // A identidade de combate (dono único): o MESMO golpe básico/especial da Masmorra, do Pesadelo, do Torneio e do PvP.
  const ident = useMemo(() => fighterIdentity(par, petElement), [par, petElement]);
  const atributos = attrs ?? DEFAULT_ARENA_ATTRIBUTES;

  // O level e o ramo vêm do estado do save (`soulCombatant`); sem provider (demo, testes) cai no estágio.
  const ctx = useGameStateOptional();
  const gs = ctx?.gameState;
  const estado = useMemo<SoulXPState>(
    () => (gs
      ? { evolutionStage: gs.evolutionStage, perfectDays: gs.perfectDays, powerPoints: gs.powerPoints, harmonyPoints: gs.harmonyPoints, benevolencePoints: gs.benevolencePoints, degeneratedByHP: gs.degeneratedByHP }
      : { evolutionStage }),
    [gs, evolutionStage],
  );
  const bonusTalento = useTalentBonus('pve'); // canal único de bônus (teto 5%), PR7
  const rift = useRiftTalents(); // Tarefa B: escudo de largada e Bits (fora do canal de 5%)
  const riftRef = useRef(rift);
  riftRef.current = rift;
  const jogador = useMemo<ArenaPlayerCfg>(() => ({
    combatant: soulCombatant(estado, bonusTalento),
    family: familyOfSkill(especial),
    area: especial?.area?.tipo === 'circulo' ? 'area' : 'single',
    escolaBasica: basica?.escolaId ?? 'combate_fisico',
    // MECÂNICA da vantagem elemental (arena.ts, tabela só das 17 bases): segue como estava, na base da ficha (`basica.elementoId`); o que se VÊ é a identidade.
    elements: { basica: basica?.elementoId ?? ident.basico.elemento, especial: especial?.elementoId ?? ident.especial.elemento, attrs: atributos },
  }), [estado, bonusTalento, especial?.familia, especial?.escolaId, especial?.area?.tipo, basica?.escolaId, basica?.elementoId, especial?.elementoId, ident, atributos]);
  const jogadorRef = useRef(jogador);
  jogadorRef.current = jogador;
  const lado = useMemo(() => arenaPlayerSide(jogador), [jogador]);
  const hpMax = Math.max(1, Math.round(lado.combatant.hp));

  /** Sprite por inimigo, sorteado UMA vez por rodada — sortear na pintura trocaria o bicho a cada re-render. */
  const [sprites, setSprites] = useState<string[]>([]);

  useEffect(() => {
    let vivo = true;
    loadBestiaryPool()
      .then(p => { if (vivo) { setPool(p); setFase('intro'); } })
      // O pool é um import dinâmico de ~104 KB. Falhar nele (rede, cache
      // frio, bloqueio) não pode virar tela branca: a Arena diz o que houve e
      // oferece a saída, em vez de ficar girando para sempre.
      .catch(() => { if (vivo) setFase('sem-motor'); });
    return () => { vivo = false; };
  }, []);

  const montarRodada = useCallback((n: number, poolAtual: BestiaryCreature[]) => {
    // O sabor da rodada vem da semente da run (determinístico: a mesma run, os mesmos bichos).
    const rng = mulberry32((runSeedRef.current ^ Math.imul(n, 0x9e3779b1)) | 0);
    const novos = buildArenaRound(n, 1, rng, poolAtual);
    inimigosRef.current = novos;
    rodadaRef.current = n;
    setInimigos(novos);
    setSprites(novos.map(e => getDungeonEnemySprite(e.tier).sprite));
    setFightKey(k => k + 1);
    setFase('luta');
  }, []);

  const comecar = useCallback(() => {
    if (!pool) return;
    runSeedRef.current = newDefenseSeed();
    setSeedLuta(runSeedRef.current);
    hpCarryRef.current = 1;
    energyCarryRef.current = 0;
    setPontos(0);
    setRodada(1);
    montarRodada(1, pool);
  }, [pool, montarRodada]);

  /** A rodada que o núcleo vai lutar: lê as refs no começo da luta (sempre o estado mais novo). */
  const rodadaDoNucleo = useCallback((): GroupRound => {
    const p = jogadorRef.current;
    const r = rodadaRef.current - 1;
    const seed = runSeedRef.current;
    const els = inimigosRef.current.map(e => e.elements);
    return {
      player: { ...arenaPlayerSide(p), startShield: r === 0 ? riftRef.current.startShield : 0 }, // só na 1ª rodada
      foes: arenaFoeSides(p, r, els),
      seed: arenaRoundSeed(seed, r),
      startHp: hpCarryRef.current,
      startEnergy: energyCarryRef.current,
      hitScale: (who, n) => (who === 0
        ? arenaPlayerHitScale(p)
        // a defesa AUTOMÁTICA: o sorteio sai da semente da run e do nº do golpe sofrido (nunca de Math.random)
        : autoDefenseHitScale(autoDefense(defenseRoll(seed, 100000 + who * 1000 + n), { perfect: PERFECT_ACC }).acc)),
      castScale: ({ who, ring, dodge, foesHp }) => (who === 0
        ? arenaPlayerCastScale(p, ring ?? 'ruim', arenaSpecialElementScale(p, els, foesHp))
        : arenaFoeCastScale(dodge ?? 'nada')),
    };
  }, []);

  const cena = useCallback((): GroupScene => {
    const p = jogadorRef.current;
    const foes = arenaFoeSides(p, rodadaRef.current - 1, inimigosRef.current.map(e => e.elements));
    return {
      playerMaxHp: Math.max(1, Math.round(arenaPlayerSide(p).combatant.hp)),
      foeMaxHp: foes.map(f => Math.max(1, Math.round(f.combatant.hp))),
      playerElement: (sp: boolean) => fxElementId(sp ? ident.especial.elemento : ident.basico.elemento),
      foeElement: (i: number) => fxElementId(inimigosRef.current[i]?.elements[0]),
      // A FORMA do golpe vem da skill da FICHA (escola; sem ficha, do elemento) — nunca de índice ou sorteio.
      playerKind: (sp: boolean) => (sp ? ident.especial.forma : ident.basico.forma),
      foeKind: (foe: number, sp: boolean) => elementStrikeForm(inimigosRef.current[foe]?.elements[0], sp ? 'especial' : 'basica'),
      labels: { blocked: isPt ? 'Defendeu!' : 'Blocked!', ring: RING_TAG[lang], dodge: DODGE_TAG[lang] },
      personalTag: PERSONAL_TAG[lang][p.family],
      playerSpecialEscola: ident.especial.escola,
    };
  }, [ident, isPt, lang]);

  const aoFimDaRodada = useCallback((res: GroupResult) => {
    if (res.winner === 'player') {
      // Fôlego entre rodadas — a regra da simulação (`ROUND_CLEAR_HEAL`), e é ela que faz a run inteira ser possível.
      hpCarryRef.current = Math.min(1, res.hpLeft + ROUND_CLEAR_HEAL);
      energyCarryRef.current = res.energyLeft;
      // C-1 (run `som-01`): a rodada limpa NÃO toca `playTaskComplete`. PR18 (pedido do dono, 06/10/2026): ganhou o som
      // PRÓPRIO de vitória de combate (`playVictory`, categoria `arcade`) — o corte C-1 continua valendo para o resto.
      playVictory();
      setPontos(p => p + inimigosRef.current.reduce((s, e) => s + e.points, 0));
      setFase('rodada-limpa');
    } else {
      // Derrota ou empate: encerra a run, sem custo (não mexe em `hp` nem em corações do save — REGISTRO §20.1).
      setFase(res.winner === 'draw' ? 'empatou' : 'perdeu');
    }
  }, []);

  const batalha = useGroupBattle({
    // A luta só para quando `aoFimDaRodada` leva a fase embora: o último golpe zera os inimigos e o relógio
    // ainda precisa do `END_BEAT` para o fim aparecer (A3, rodada 7: não desligar por `vivos.length`).
    running: fase === 'luta',
    paused: pausado, reduced: reduzido.current, runKey: fightKey, seed: seedLuta,
    round: rodadaDoNucleo, scene: cena, onEnd: aoFimDaRodada,
  });

  const proximaRodada = useCallback(() => {
    if (!pool) return;
    if (rodada >= ARENA_ROUNDS) {
      onEarnPoints?.(riftBitsWith(pontos, rift.riftBits));
      setFase('venceu');
      return;
    }
    const n = rodada + 1;
    setRodada(n);
    montarRodada(n, pool);
  }, [pool, rodada, pontos, onEarnPoints, montarRodada, rift.riftBits]);

  const nomeDe = (e: ArenaEnemy) => (isPt ? e.namePt : e.nameEn);
  const sair = isPt ? 'Sair' : 'Leave';
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId, 256);

  /* A LUTA: tela cheia, profundidade de Game Boy, barra de HP e de energia nos pés, golpes com a arte do
     elemento. Enquanto o estado do relógio ainda é o da rodada anterior (`stateKey`), a cena pinta a rodada
     nova cheia — sem piscar os inimigos caídos da anterior. */
  if (fase === 'luta') {
    const pronto = batalha.stateKey === fightKey;
    const foesLado = arenaFoeSides(jogador, rodada - 1, inimigos.map(e => e.elements));
    const hpFrac = pronto ? batalha.hp : hpCarryRef.current;
    const foesHp = (i: number) => (pronto ? (batalha.foesHp[i] ?? 1) : 1);
    const alvoIdx = Math.max(0, inimigos.findIndex((_, i) => foesHp(i) > 1e-9));
    return (
      <TorcidaLayer
        onTap={batalha.cheer}
        active={!pausado && batalha.phase === 'idle'}
        isPt={isPt}
        style={BATTLE_LAYER_STYLE}
        mascot
        cheerRatio={pronto ? batalha.meter / CHEER_TAPS_FULL : 0}
        swipeActive={batalha.phase === 'dodge'}
        onSwipe={batalha.swipe}
      >
        <BattleStage
          scene={ARENA_SCENE.bg}
          sceneElement={inimigos[0] ? fxElementId(inimigos[0].elements[0]) : null}
          specialLabel={specialLabel(isPt, especial)}
          foeSpecialLabel={(f) => foeSpecialLabel(isPt, f.element, f.name)}
          isPt={isPt}
          me={{
            key: 'me', sprite: petSprite, name: isPt ? 'Você' : 'You', hp: Math.round(Math.max(0, hpFrac) * hpMax), maxHp: hpMax,
            element: fxElementId(basica?.elementoId ?? atributos.principal),
            energy: (pronto ? batalha.petEnergy : energyCarryRef.current) / ENERGY_TRIGGER,
            status: pronto ? batalha.status.me : undefined,
            // PR18: o trecho da barra de especial que a torcida em andamento já encheu (só UI; o motor soma na descarga).
            cheerPending: pronto ? (batalha.meter / CHEER_TAPS_FULL) * (CHEER.energyPerDischarge / ENERGY_TRIGGER) : 0,
          }}
          foes={inimigos.map((e, i) => {
            const max = Math.max(1, Math.round(foesLado[i].combatant.hp));
            return {
              key: i, sprite: sprites[i], name: nomeDe(e), hp: Math.round(Math.max(0, foesHp(i)) * max), maxHp: max,
              element: fxElementId(e.elements[0]), down: foesHp(i) <= 1e-9,
              // só quem tem especial (o chefe) mostra a barra de energia
              energy: foesLado[i].special && pronto ? (batalha.foeEnergy[i] ?? 0) / ENERGY_TRIGGER : undefined,
              status: pronto ? batalha.status.foes[i] : undefined,
            };
          })}
          target={alvoIdx}
          action={pronto ? batalha.action : null}
          hit={pronto ? batalha.hits : []}
          charging={pronto && batalha.charging}
          ring={pronto ? batalha.ring : null}
          onRingGrade={batalha.resolveRing}
          dodge={pronto ? batalha.dodge : null}
          onDodge={batalha.swipe}
          petDodge={pronto ? batalha.petDodge : null}
          mechLabels={{
            strike: isPt ? 'Golpear' : 'Strike',
            dodgeLeft: isPt ? 'Esquivar para a esquerda' : 'Dodge left',
            dodgeRight: isPt ? 'Esquivar para a direita' : 'Dodge right',
          }}
          title={`${isPt ? 'Arena' : 'Arena'} · ${rodada}/${ARENA_ROUNDS}`}
          closeLabel={sair}
          onClose={onExit}
          exitConfirm={{
            title: isPt ? 'Sair da Arena? Esta corrida se perde.' : 'Leave the Arena? This run will be lost.',
            stay: isPt ? 'Continuar' : 'Keep going',
            leave: sair,
          }}
          onPauseChange={setPausado}
        >
          {/* Gancho de estado (sem texto): em que passo a luta está. */}
          <span hidden data-arena-fase={fase} />
        </BattleStage>
      </TorcidaLayer>
    );
  }

  return (
    <GameRoot>
      <TorcidaLayer onTap={batalha.cheer} active={false} isPt={isPt} style={{ flex: '1 0 auto' }}>
      <GameHeader
        run={false}
        title={isPt ? 'Arena' : 'Arena'}
        closeLabel={sair}
        onClose={onExit}
        onPauseChange={setPausado}
      />

      {fase === 'carregando' && (
        <>
          <GameVisor height={80} scene={ARENA_SCENE.bg}>
            <VisorSprite src={petSprite} alt="" style={{ left: '50%', marginLeft: -64, bottom: 8 }} data-visor-pet />
          </GameVisor>
          <p style={{ ...phaseLine, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0' }}>
            <Icon name="sync" size={24} tone="primary" className="animate-spin" />
            {isPt ? 'Chamando os desafiantes…' : 'Calling the challengers…'}
          </p>
        </>
      )}

      {/* ESTADO DE ERRO, e não tela branca. O pool do bestiário é um import
          dinâmico; falhar nele é plausível (rede, cache frio) e o jogador
          precisa saber que não foi ele — é rede, não medalha: `cloud_off` 48
          `muted` num card `role=status` + "Go back" `outline` (D-J11). */}
      {fase === 'sem-motor' && (
        <div
          role="status"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8,
            padding: 12, backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)',
            borderRadius: 'var(--sm2-radius-md)', boxShadow: SM2_SHADOW_CARD,
          }}
        >
          <Icon name="cloud_off" size={48} tone="muted" />
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt
              ? 'Não consegui carregar os desafiantes agora. Isso costuma ser conexão — tente de novo daqui a pouco.'
              : "I could not load the challengers right now. This is usually the connection — try again in a bit."}
          </p>
        </div>
      )}

      {fase === 'intro' && (
        <>
          <GameVisor height={80} scene={ARENA_SCENE.bg}>
            <VisorSprite src={petSprite} alt="" style={{ left: '50%', marginLeft: -64, bottom: 8 }} data-visor-pet />
          </GameVisor>
          {/* A ficha em `.chip.tag` (D-J11): HP/Power/Essence, valor em `ink`. */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <StatTag label={isPt ? 'Vida' : 'HP'} value={hpMax} />
            <StatTag label={isPt ? 'Poder' : 'Power'} value={jogador.combatant.atk} />
            <StatTag label={isPt ? 'Essência' : 'Essence'} value={elementLabel(atributos.principal, isPt)} />
          </div>

          {/* A ficha do jogador é o que torna a Arena DELE. Sem ela, o texto
              diz o porquê em vez de mostrar um par genérico sem explicação. */}
          {basica && especial ? (
            <>
              <p style={phaseLine}>
                <b style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{isPt ? basica.nome.pt : basica.nome.en}</b>
                {' · '}{isPt ? 'a cada golpe' : 'every strike'}
              </p>
              <p style={phaseLine}>
                <b style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{isPt ? especial.nome.pt : especial.nome.en}</b>
                {' · '}{isPt ? 'com a energia cheia' : 'with full energy'}
              </p>
            </>
          ) : (
            <p style={phaseLine}>
              {isPt
                ? 'Sua ficha ainda não está neste aparelho, então você entra com um par genérico. Abra a página do seu Soulmon uma vez para lutar com as habilidades dele.'
                : "Your sheet is not on this device yet, so you go in with a generic pair. Open your Soulmon's page once to fight with its own skills."}
            </p>
          )}

          {/* A explicação mora atrás do "?" (InfoTip) — nenhum texto explicativo solto (04/10/2026). */}
          <div style={{ display: 'flex', justifyContent: 'center' }} data-arena-torcida-legenda>
            <InfoTip language={isPt ? 'pt-BR' : 'en-US'} label={isPt ? 'Como funciona o Duelo' : 'How the Duel works'}>
              {isPt
                ? 'Seu Soulmon luta e se defende sozinho, contra todos os inimigos ao mesmo tempo. Toque na tela (ou no mascote) para torcer: a barra de cheer enche devagar e despeja energia nele. Com a energia cheia, ele solta o especial — toque no anel na hora certa para render mais. Quando o inimigo soltar o dele, deslize o dedo para o lado para esquivar.'
                : 'Your Soulmon fights and defends on its own, against all the enemies at once. Tap the screen (or the mascot) to cheer: the cheer bar fills slowly and pours energy into it. With full energy it unleashes its special — tap the ring at the right moment to hit harder. When the enemy unleashes its own, swipe sideways to dodge.'}
            </InfoTip>
          </div>
          <p style={phaseLine}>
            {isPt
              ? `${ARENA_ROUNDS} rodadas seguidas, cada uma mais dura. Seu elemento decide quem você machuca mais e quem te machuca. Entre as rodadas você recupera um pouco. Perder custa a run — nunca os seus corações.`
              : `${ARENA_ROUNDS} rounds back to back, each harder. Your element decides who you hurt more and who hurts you. You recover a little between rounds. Losing costs you the run — never your hearts.`}
          </p>
          <button type="button" onClick={comecar} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 320, alignSelf: 'center' }}>
            {isPt ? 'Entrar na Arena' : 'Enter the Arena'}
          </button>
        </>
      )}

      {fase === 'rodada-limpa' && (
        <>
          <GameVisor height={80} scene={ARENA_SCENE.bg}>
            <VisorSprite src={petSprite} alt="" style={{ left: 16, bottom: 8 }} data-visor-pet />
            <VisorFx icon="🏳️" style={{ right: 16, top: 8 }} data-visor-fx="defeat" />
          </GameVisor>
          <p style={phaseTitle}>{isPt ? `Rodada ${rodada} vencida` : `Round ${rodada} cleared`}</p>
          <p className="sm2-num" style={phaseLine}>
            {isPt
              ? `Você recuperou um pouco de vida. Total: ${pontos} Bits.`
              : `You recovered some health. Total: ${pontos} Bits.`}
          </p>
          <button type="button" onClick={proximaRodada} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 320, alignSelf: 'center' }}>
            {rodada >= ARENA_ROUNDS
              ? (isPt ? 'Terminar' : 'Finish')
              : (isPt ? 'Próxima rodada' : 'Next round')}
          </button>
        </>
      )}

      {(fase === 'venceu' || fase === 'perdeu' || fase === 'empatou') && (
        <>
          {/* Vitória: a faísca no lugar do último inimigo; derrota e empate: o pet
              inteiro — na MESMA tinta (D-J8). */}
          <GameVisor height={80} scene={ARENA_SCENE.bg}>
            <VisorSprite src={petSprite} alt="" style={{ left: 16, bottom: 8 }} data-visor-pet />
            {fase === 'venceu' && <VisorFx icon="✨" style={{ right: 16, top: 8 }} data-visor-fx="sparkle" />}
          </GameVisor>
          <p style={phaseTitle}>
            {fase === 'venceu'
              ? (isPt ? 'Arena vencida!' : 'Arena cleared!')
              : fase === 'empatou'
                ? (isPt ? 'Empate' : 'A draw')
                : (isPt ? 'Você caiu' : 'You went down')}
          </p>
          <p className="sm2-num" style={phaseLine}>
            {fase === 'venceu'
              ? (isPt ? `As ${ARENA_ROUNDS} rodadas, na sequência. ${pontos} Bits.` : `All ${ARENA_ROUNDS} rounds, back to back. ${pontos} Bits.`)
              : fase === 'empatou'
                ? (isPt
                  ? `Vocês caíram juntos na rodada ${rodada}. Não custou nenhum coração — só a run.`
                  : `You went down together in round ${rodada}. It cost no hearts — only the run.`)
                : (isPt
                  ? `Chegou até a rodada ${rodada}. Não custou nenhum coração — só a run.`
                  : `You got to round ${rodada}. It cost no hearts — only the run.`)}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={comecar} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Tentar de novo' : 'Try again'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {sair}
            </button>
          </div>
        </>
      )}
      </TorcidaLayer>
    </GameRoot>
  );
}
