/**
 * COMBATE DO PESADELO — o Soulmon defendendo o descanso do dono.
 *
 * Camada de APRESENTAÇÃO de `utils/nightmares.ts`. Recebe a onda já montada
 * (`buildNightmareWave`) e a raridade por props: não lê GameState, não toca
 * localStorage, não chama `Date.now()` para regra nenhuma. Quem persiste
 * (`markFought`) e quem credita (`nightmareRewards`) é o App, pelos callbacks.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * TOM — regra, não enfeite
 * ───────────────────────────────────────────────────────────────────────────
 * O pesadelo NÃO é uma ameaça ao jogador: é o Soulmon ficando na frente de
 * alguma coisa boba enquanto o dono dorme. Nada de horror, nada de susto, nada
 * de vermelho de perigo — os nomes e as descrições vêm de `nightmareName` /
 * `nightmareFlavor`, que são fofos de propósito. Um app que assusta perto da
 * hora de dormir é o oposto exato do que a Janela de Descanso existe para ser.
 *
 * E **PERDER NÃO CUSTA NADA** (nightmares.ts, seção 4 — mesma regra da
 * Masmorra). A tela de derrota diz isso com todas as letras, em EN e PT-BR:
 * "o sonho passou, você acorda bem". Nenhum número diminui aqui.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * A LUTA (04/10/2026, REGISTRO §20.10)
 * ───────────────────────────────────────────────────────────────────────────
 * O convite, a vitória e a derrota são o diálogo de sempre; a LUTA é a tela cheia da
 * `BattleStage` (a mesma do Duelo e da Masmorra): o Soulmon grande, HP e ENERGIA em cima de cada
 * um. SEM torcida (contexto §2.19: o Soulmon vai sozinho). Combate v3 (PR4, contexto §2.18): o MOTOR é o
 * núcleo (`groupFightSteps` com 1 inimigo por vez, HP e energia carregados), com as regras da Masmorra
 * (`utils/dungeonFight.ts`), e o relógio da cena é `games/useGroupBattle.ts`. A onda é SEMPRE do andar 1
 * (`buildNightmareWave`). A `TimingBar` de esquiva saiu daqui (`TIMING_DODGE_ENABLED = false`).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * POR QUE O `DungeonGame` NÃO FOI REUTILIZADO (para quem for refatorar)
 * ───────────────────────────────────────────────────────────────────────────
 * Ele não aceita uma onda pronta (a entrada de inimigos é interna), é uma RUN de 5 andares (andar,
 * bônus, Glitchtama) e escreve no localStorage direto (recorde e dificuldade semanal da Masmorra) —
 * misturaria duas economias que a regra mantém separadas. O que não podia continuar duplicado era a
 * MECÂNICA, e essa agora tem dono: `utils/dungeonFight.ts` + `useGroupBattle` + `BattleStage`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { GameVisor, VisorSprite, VisorFx, DIALOG_VISOR_W, phaseTitle } from './games/GameKit';
import { NIGHTMARE_SCENE } from '../utils/dungeonScenes';
import { getSpriteForStage, DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { TorcidaLayer } from './games/TorcidaKit';
import { BattleStage, BATTLE_LAYER_STYLE } from './games/BattleStage';
import { useGroupBattle, type GroupRound, type GroupScene } from './games/useGroupBattle';
import { RING_TAG, DODGE_TAG, PERSONAL_TAG } from './games/pveTags';
import { newDefenseSeed } from '../utils/autoDefesa';
import { ENERGY_TRIGGER } from '../utils/combate/specials';
import type { GroupResult } from '../utils/combate/group';
import { dungeonFamily, dungeonFight, dungeonFightSeed, dungeonPlayerSide, type DungeonPlayerCfg } from '../utils/dungeonFight';
import { jeitoDaProfissao } from '../utils/profissaoMasmorra';
import { soulCombatant, type SoulXPState } from '../utils/soulXP';
import { useTalentBonus } from '../contexts/useTalentBonus';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { fighterIdentity } from '../utils/fighterIdentity';
import { fxElementId, visualElementFor, prefersReducedMotion, elementStrikeForm, specialLabel, foeSpecialLabel } from '../utils/combatFx';
import { playVictory } from '../utils/sounds';
import {
  nightmareFlavor,
  nightmareName,
  nightmareRewards,
  type NightmareRewards,
} from '../utils/nightmares';
import type { DungeonEnemy } from '../utils/dungeon';
import type { DreamRarity } from '../utils/restWindow';
import type { Language } from '../utils/i18n';

export interface NightmareBattleProps {
  open: boolean;
  /** A onda pronta de `buildNightmareWave`. Vazia = não há o que enfrentar. */
  wave: DungeonEnemy[];
  /** Raridade da noite (`nightmaresFor().rarity`) — decide nome, texto e prêmio. */
  rarity: DreamRarity;
  /** Estágio do pet, para o sprite e o sorteio de skills (as stats vêm de `soul`). */
  petStage: string;
  /** Personagem de demo, quando houver (mesma prop do DungeonGame). */
  demoCharacterId?: string;
  /** Elemento dominante do Soulmon: a arte dos golpes dele. Sem ele, o neutro. */
  petElement?: string;
  /** As skills da ficha (o mesmo `skills` da Arena). Com elas, a escola decide o golpe e o selo leva o nome do especial (PR1b B2/N1); sem elas, o elemento. */
  skills?: FichaSkills;
  /** O estado do save que o level lê (`soulCombatant`): level e ramo do Soulmon. Sem ele, cai no estágio do pet. */
  soul?: SoulXPState;
  /** O ofício da ficha (`manifestacao.profissao`): o jeito dele vale aqui como na Masmorra (`jeitoParaPve`). */
  profissao?: string | null;
  language: Language;
  /** Venceu: as recompensas de `nightmareRewards(rarity, true)`. */
  onWin: (rewards: NightmareRewards) => void;
  /** Perdeu. **Não custa nada** — o callback existe só para marcar a noite. */
  onLose: () => void;
  onClose: () => void;
}

/* C1 (02/10/2026): o convite do pesadelo mostrava `dungeon-spirit.png` (bolha
   roxa com brilhos, uma bolinha roxa solta e franja clara). Agora é uma
   criatura que já existe no repo, com alfa limpo (binário, sem borda clara). */
/** Sem torcida no Pesadelo (contexto §2.19): o toque na cena não faz nada. */
const noTap = (): void => {};

const INTRO_CREATURE = DUNGEON_LINE_SPRITES.ignar.champion;

type Phase = 'intro' | 'fight' | 'won' | 'lost';

export function NightmareBattle({
  open, wave, rarity, petStage, demoCharacterId, petElement, skills, soul, profissao, language, onWin, onLose, onClose,
}: NightmareBattleProps) {
  const isPt = language === 'pt-BR';
  const lang = isPt ? 'pt' : 'en';
  const par = stageSkillsFor(skills, petStage);

  /* O jogador do núcleo (PR4): `soulCombatant` do estado (level e ramo) e o jeito do OFÍCIO, o MESMO da
     Masmorra (`jeitoParaPve`). Antes o Pesadelo usava o `base.dmg` cru e ignorava o jeito: era uma divergência
     entre as duas telas, resolvida aqui — o Pesadelo aplica o jeito. Sem estado (testes), cai no estágio. */
  const estado = useMemo<SoulXPState>(() => soul ?? { evolutionStage: petStage }, [soul, petStage]);
  const bonusTalento = useTalentBonus('pve'); // canal único de bônus (teto 5%), PR7
  const jogador = useMemo<DungeonPlayerCfg>(() => ({
    combatant: soulCombatant(estado, bonusTalento),
    family: dungeonFamily(par?.especial),
    jeito: jeitoDaProfissao(profissao),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [estado, bonusTalento, par?.especial?.escolaId, par?.especial?.familia, profissao]);
  const jogadorRef = useRef(jogador);
  jogadorRef.current = jogador;
  const hpMax = Math.max(1, Math.round(dungeonPlayerSide(jogador).combatant.hp));

  /* Trap + Escape + devolução de foco vêm do `RitualDialog` (SIS-06, canvas
     Rituais): o × 44 pelado é o primeiro focável, Escape fecha. */

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [rewards, setRewards] = useState<NightmareRewards | null>(null);
  /** A SEMENTE da luta: a defesa automática, o anel e a esquiva (determinísticos dentro da noite). */
  const runSeedRef = useRef(newDefenseSeed());
  const [seedLuta, setSeedLuta] = useState(() => runSeedRef.current);
  /** Muda a cada inimigo: reinicia o relógio da cena. */
  const [fightKey, setFightKey] = useState(0);
  /** O que passa de um inimigo para o outro: HP (fração) e energia do pet. */
  const hpCarryRef = useRef(1);
  const energyCarryRef = useRef(0);
  const [hpFrac, setHpFrac] = useState(1);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausado, setPausado] = useState(false);
  const reduced = useRef(prefersReducedMotion());
  const idxRef = useRef(0);
  const waveRef = useRef(wave);
  waveRef.current = wave;

  const enemy = wave[idx];
  // A identidade de combate (dono único): o mesmo golpe básico/especial da Arena, do Torneio e do PvP.
  const ident = useMemo(() => fighterIdentity(par, petElement), [par, petElement]);
  const petEl = fxElementId(ident.basico.elemento);
  const enemyEl = fxElementId(visualElementFor(enemy?.stage ?? 'x'));
  const foeMax = enemy ? Math.max(1, Math.round(enemy.foe.combatant.hp)) : 1;

  const novaSemente = () => {
    runSeedRef.current = newDefenseSeed();
    setSeedLuta(runSeedRef.current);
  };

  // Reabrir com outra noite recomeça limpo (o modal fica montado no App).
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    idxRef.current = 0;
    hpCarryRef.current = 1;
    energyCarryRef.current = 0;
    setHpFrac(1);
    setPhase('intro');
    setRewards(null);
    novaSemente();
    setFightKey(k => k + 1);
  }, [open, wave]);

  const win = () => {
    playVictory(); // PR18: vitória (era `playFeed`, o som de COMER — R-CAT: o evento decide)
    const got = nightmareRewards(rarity, true);
    setRewards(got);
    setPhase('won');
    onWin(got);
  };

  const lose = () => {
    // Sem som de degeneração de propósito: perder aqui não é uma perda.
    setHpFrac(0);
    setPhase('lost');
    onLose();
  };

  /* A luta é o núcleo v3 (`groupFightSteps` com 1 inimigo por vez; HP e energia passam de um para o outro) e
     o relógio da cena é o `useGroupBattle`. As regras de cada luta são as da Masmorra (`dungeonFight`): defesa
     perfeita = sem dano + contra-ataque do ofício, e o especial do pesadelo (do slot mega) pode ser esquivado. */
  const rodadaDoNucleo = useCallback((): GroupRound => {
    const e = waveRef.current[idxRef.current];
    const f = dungeonFight(jogadorRef.current, e.foe, dungeonFightSeed(runSeedRef.current, e.floor, e.slot));
    return {
      player: f.player, foes: f.foes, seed: f.seed,
      startHp: hpCarryRef.current, startEnergy: energyCarryRef.current,
      hitScale: f.hitScale,
      castScale: ({ who, ring, dodge }) => f.castScale({ who, ring, dodge }),
    };
  }, []);

  const cena = useCallback((): GroupScene => {
    const e = waveRef.current[idxRef.current];
    const p = jogadorRef.current;
    const foeEl = fxElementId(visualElementFor(e?.stage ?? 'x'));
    return {
      playerMaxHp: Math.max(1, Math.round(dungeonPlayerSide(p).combatant.hp)),
      foeMaxHp: [Math.max(1, Math.round(e?.foe.combatant.hp ?? 1))],
      playerElement: sp => fxElementId(sp ? ident.especial.elemento : ident.basico.elemento),
      foeElement: () => foeEl,
      playerKind: sp => (sp ? ident.especial.forma : ident.basico.forma),
      foeKind: (_f, sp) => elementStrikeForm(foeEl, sp ? 'especial' : 'basica'),
      labels: { blocked: isPt ? 'Defendeu!' : 'Defended!', ring: RING_TAG[lang], dodge: DODGE_TAG[lang] },
      personalTag: PERSONAL_TAG[lang][p.family],
    };
  }, [ident, par, isPt, lang]);

  const aoFimDaLuta = useCallback((res: GroupResult) => {
    if (res.winner !== 'player') { lose(); return; } // derrota ou empate: não custa nada
    // C-1 (run `som-01`): morte de inimigo nao usa o som de conclusao.
    hpCarryRef.current = res.hpLeft;
    energyCarryRef.current = res.energyLeft;
    setHpFrac(res.hpLeft);
    const n = idxRef.current + 1;
    if (n >= waveRef.current.length) { win(); return; }
    idxRef.current = n;
    setIdx(n);
    setFightKey(k => k + 1); // a energia segue para o próximo
  // O relógio chama sempre a versão mais nova (`optsRef` do hook); `win`/`lose` só leem props e refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rarity, onWin, onLose]);

  const battle = useGroupBattle({
    running: open && phase === 'fight' && !!enemy,
    paused: pausado, reduced: reduced.current, runKey: fightKey, seed: seedLuta,
    round: rodadaDoNucleo, scene: cena, onEnd: aoFimDaLuta, torcida: false,
  });

  if (!open) return null;

  const petSprite = getSpriteForStage(petStage, demoCharacterId, 256);
  const title = nightmareName(rarity, language);
  const flavor = nightmareFlavor(rarity, language);
  const preview = nightmareRewards(rarity, true);

  const start = () => {
    if (wave.length === 0) return;
    setIdx(0);
    idxRef.current = 0;
    hpCarryRef.current = 1;
    energyCarryRef.current = 0;
    setHpFrac(1);
    novaSemente();
    setFightKey(k => k + 1);
    setPhase('fight');
  };

  const goodMorning = isPt ? 'Bom dia!' : 'Good morning!';

  /* A LUTA: a tela cheia (a mesma cena do Duelo e da Masmorra). */
  if (phase === 'fight' && enemy) {
    // Entre o começo da luta nova e o 1º passo do relógio, o estado do hook ainda é o do inimigo anterior: a cena pinta o novo cheio.
    const pronto = battle.stateKey === fightKey;
    const foeHpFrac = pronto ? (battle.foesHp[0] ?? 1) : 1;
    const meHpFrac = pronto ? battle.hp : hpFrac;
    return (
      <TorcidaLayer
        onTap={noTap}
        active={false} /* sem torcida no Pesadelo (contexto §2.19): a camada só leva o gesto da esquiva */
        isPt={isPt}
        style={{ ...BATTLE_LAYER_STYLE, zIndex: 220 }}
        swipeActive={battle.phase === 'dodge'}
        onSwipe={battle.swipe}
      >
        <BattleStage
          specialLabel={specialLabel(isPt, par?.especial)}
          foeSpecialLabel={(f) => foeSpecialLabel(isPt, f.element, f.name)}
          isPt={isPt}
          scene={NIGHTMARE_SCENE.bg}
          me={{
            key: 'me', sprite: petSprite, name: isPt ? 'Seu Soulmon' : 'Your Soulmon', hp: Math.round(Math.max(0, meHpFrac) * hpMax), maxHp: hpMax,
            element: petEl, energy: (pronto ? battle.petEnergy : energyCarryRef.current) / ENERGY_TRIGGER,
            status: pronto ? battle.status.me : undefined,
          }}
          foes={[{
            key: idx, sprite: enemy.sprite, name: isPt ? 'Pesadelo' : 'Nightmare', hp: Math.round(Math.max(0, foeHpFrac) * foeMax), maxHp: foeMax,
            element: enemyEl, down: foeHpFrac <= 1e-9,
            // só quem tem especial (o slot mega) mostra a barra de energia
            energy: enemy.foe.special && pronto ? (battle.foeEnergy[0] ?? 0) / ENERGY_TRIGGER : undefined,
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
          mechLabels={{
            strike: isPt ? 'Golpear' : 'Strike',
            dodgeLeft: isPt ? 'Esquivar para a esquerda' : 'Dodge left',
            dodgeRight: isPt ? 'Esquivar para a direita' : 'Dodge right',
          }}
          title={title}
          badge={wave.length > 1 ? <span className="sm2-num" style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-viewport-ink)', textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>{idx + 1}/{wave.length}</span> : undefined}
          closeLabel={isPt ? 'Sair do pesadelo' : 'Leave the nightmare'}
          onClose={onClose}
          exitConfirm={{
            title: isPt ? 'Deixar o pesadelo? Nada se perde — ele só passa.' : 'Leave the nightmare? Nothing is lost — it just passes.',
            stay: isPt ? 'Continuar' : 'Keep going',
            leave: isPt ? 'Sair' : 'Leave',
          }}
          onPauseChange={setPausado}
        />
      </TorcidaLayer>
    );
  }

  /* O VISOR do diálogo (288 = 144×2): o pet a 128 embaixo à esquerda; na caixa
     do outro (alto à direita) o espírito 128² a 1× na proposta, a faísca na
     vitória — nunca sobre o pet (X1); na derrota nada: o pet inteiro, porque
     nada caiu (JOGO-25). */
  const otherBox: CSSProperties = { right: 8, top: 12 };
  const visor = (height: 80 | 72, other: React.ReactNode) => (
    <GameVisor width={DIALOG_VISOR_W} height={height} scene={NIGHTMARE_SCENE.bg}>
      {other}
      <VisorSprite src={petSprite} alt="" style={{ left: 8, bottom: 8 }} data-visor-pet />
    </GameVisor>
  );
  const btn = (variant: 'primary' | 'outline'): CSSProperties => ({ ...sm2Button(variant), width: '100%', maxWidth: 260, alignSelf: 'center' });

  return (
    <RitualDialog
      label={title}
      onClose={onClose}
      zIndex={210}
      maxWidth={340}
      closeLabel={isPt ? 'Fechar' : 'Close'}
      closeSide="end"
      style={{ alignItems: 'center', textAlign: 'center', gap: 10, paddingTop: 44 }}
    >
      {/* ── Convite ─────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <>
          {visor(80, <VisorSprite src={INTRO_CREATURE} alt="" flip idle={false} style={otherBox} data-visor-enemy />)}
          <p style={sm2Hint}>{isPt ? 'De manhã, seu Soulmon conta:' : 'In the morning, your Soulmon says:'}</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-lg)', lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)' }}>{title}</h2>
          <p style={{ ...sm2Text, margin: 0 }}>{flavor}</p>

          {wave.length > 0 ? (
            <>
              <p style={{ ...sm2Text, margin: 0 }}>
                {isPt
                  ? `Uma luta curtinha (${wave.length}). Vencer rende ${preview.bits} Bits, +${preview.energy} de energia${preview.hearts > 0 ? ` e +${preview.hearts} de coração` : ''}. Perder não custa nada.`
                  : `A very short fight (${wave.length}). Winning gives ${preview.bits} Bits, +${preview.energy} energy${preview.hearts > 0 ? ` and +${preview.hearts} heart` : ''}. Losing costs nothing.`}
              </p>
              <button type="button" onClick={start} style={btn('primary')}>
                {isPt ? 'Ficar na frente dele' : 'Stand in its way'}
              </button>
              <button type="button" onClick={onClose} style={btn('outline')}>
                {isPt ? 'Agora não' : 'Not now'}
              </button>
            </>
          ) : (
            <>
              {/* Estado VAZIO: noite sem registro. Nada foi perdido. */}
              <p style={{ ...sm2Text, margin: 0 }}>
                {isPt
                  ? 'A noite passou tranquila — nada apareceu para enfrentar. Está tudo certo.'
                  : 'The night went by quietly — nothing showed up to face. All is well.'}
              </p>
              <button type="button" onClick={onClose} style={btn('primary')}>{goodMorning}</button>
            </>
          )}
        </>
      )}

      {/* ── Vitória: a faísca no lugar do pesadelo, nunca sobre o pet ── */}
      {phase === 'won' && rewards && (
        <div aria-live="polite" style={{ display: 'contents' }}>
          {visor(72, <VisorFx icon="✨" style={{ right: 8, top: 8 }} data-visor-fx="sparkle" />)}
          <p style={phaseTitle}>{isPt ? 'Seu Soulmon cuidou da sua noite!' : 'Your Soulmon looked after your night!'}</p>
          <p style={sm2Hint}>{isPt ? `${title} foi embora sem fazer barulho.` : `${title} drifted away without a sound.`}</p>
          <p className="sm2-num" style={{ ...sm2Text, margin: 0 }}>
            {`+${rewards.bits} Bits`}
            {rewards.energy > 0 ? ` · +${rewards.energy} ${isPt ? 'energia' : 'energy'}` : ''}
            {rewards.hearts > 0 ? ` · +${rewards.hearts} ${isPt ? 'coração' : 'heart'}` : ''}
          </p>
          <button type="button" onClick={onClose} style={btn('primary')}>{goodMorning}</button>
        </div>
      )}

      {/* ── Derrota: NÃO custa nada, e a tela diz isso — o pet inteiro ── */}
      {phase === 'lost' && (
        <div aria-live="polite" style={{ display: 'contents' }}>
          {visor(72, null)}
          <p style={phaseTitle}>{isPt ? 'O sonho passou — e você acorda bem.' : 'The dream passed — and you wake up fine.'}</p>
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt
              ? 'Seu Soulmon ficou na frente até o fim e voltou pro seu colo. Nada foi perdido: nenhum coração, nenhum Bit, nenhum progresso.'
              : 'Your Soulmon stood in the way until the end and came right back to you. Nothing was lost: no hearts, no Bits, no progress.'}
          </p>
          <p style={sm2Hint}>{isPt ? 'Amanhã tem outra noite. Sem pressa.' : 'There is another night tomorrow. No rush.'}</p>
          <button type="button" onClick={onClose} style={btn('primary')}>{goodMorning}</button>
        </div>
      )}
    </RitualDialog>
  );
}

export default NightmareBattle;
