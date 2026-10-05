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
 * um, o mascote da torcida no canto, a barra de cheer no pé. O relógio, a energia e as mecânicas
 * ativas (o ANEL do especial e a ESQUIVA do especial do pesadelo) são do `games/usePveBattle.ts`;
 * as regras de dano, de `utils/energia.ts`. Vida do pet e dos inimigos × `PVE_HP_SCALE` (~20–30 s
 * por inimigo). A `TimingBar` de esquiva saiu daqui (`TIMING_DODGE_ENABLED = false`).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * POR QUE O `DungeonGame` NÃO FOI REUTILIZADO (para quem for refatorar)
 * ───────────────────────────────────────────────────────────────────────────
 * Ele não aceita uma onda pronta (a entrada de inimigos é interna), é uma RUN de 5 andares (andar,
 * bônus, Glitchtama) e escreve no localStorage direto (recorde e dificuldade semanal da Masmorra) —
 * misturaria duas economias que a regra mantém separadas. O que não podia continuar duplicado era a
 * MECÂNICA, e essa agora tem dono: `usePveBattle` + `utils/energia.ts` + `BattleStage`.
 */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { GameVisor, VisorSprite, VisorFx, DIALOG_VISOR_W, phaseTitle } from './games/GameKit';
import { NIGHTMARE_SCENE } from '../utils/dungeonScenes';
import { getSpriteForStage, DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { TorcidaLayer, TorcidaGauge } from './games/TorcidaKit';
import { BattleStage, BATTLE_LAYER_STYLE } from './games/BattleStage';
import { usePveBattle, type PveRules } from './games/usePveBattle';
import { playerStatsFor } from '../utils/dungeon';
import { newDefenseSeed } from '../utils/autoDefesa';
import {
  CHEER_TAPS_FULL, ENERGY_MAX, PVE_HP_SCALE, pveFoeHp, pveFoeHitDamage, pveStrikeDamage, type RingGrade,
} from '../utils/energia';
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { fxElementId, visualElementFor, prefersReducedMotion, elementStrikeForm, fighterStrikeForm, specialLabel } from '../utils/combatFx';
import { playFeed } from '../utils/sounds';
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
  /** Estágio do pet, só para o sprite e as stats do jogador. */
  petStage: string;
  /** Personagem de demo, quando houver (mesma prop do DungeonGame). */
  demoCharacterId?: string;
  /** Elemento dominante do Soulmon: a arte dos golpes dele. Sem ele, o neutro. */
  petElement?: string;
  /** As skills da ficha (o mesmo `skills` da Arena). Com elas, a escola decide o golpe e o selo leva o nome do especial (PR1b B2/N1); sem elas, o elemento. */
  skills?: FichaSkills;
  language: Language;
  /** Venceu: as recompensas de `nightmareRewards(rarity, true)`. */
  onWin: (rewards: NightmareRewards) => void;
  /** Perdeu. **Não custa nada** — o callback existe só para marcar a noite. */
  onLose: () => void;
  onClose: () => void;
}

/** A defesa perfeita do pesadelo (limiar da defesa automática). */
const PERFECT = 0.92;
/* C1 (02/10/2026): o convite do pesadelo mostrava `dungeon-spirit.png` (bolha
   roxa com brilhos, uma bolinha roxa solta e franja clara). Agora é uma
   criatura que já existe no repo, com alfa limpo (binário, sem borda clara). */
const INTRO_CREATURE = DUNGEON_LINE_SPRITES.ignar.champion;

type Phase = 'intro' | 'fight' | 'won' | 'lost';

export function NightmareBattle({
  open, wave, rarity, petStage, demoCharacterId, petElement, skills, language, onWin, onLose, onClose,
}: NightmareBattleProps) {
  const isPt = language === 'pt-BR';
  const base = playerStatsFor(petStage);
  // Vida do pet × PVE_HP_SCALE: a luta ficou mais longa (04/10/2026); o dano por golpe não muda.
  const stats = { hp: Math.round(base.hp * PVE_HP_SCALE), dmg: base.dmg };

  /* Trap + Escape + devolução de foco vêm do `RitualDialog` (SIS-06, canvas
     Rituais): o × 44 pelado é o primeiro focável, Escape fecha. */

  const [idx, setIdx] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(stats.hp);
  const [phase, setPhase] = useState<Phase>('intro');
  const [rewards, setRewards] = useState<NightmareRewards | null>(null);
  /** A semente da luta: o sorteio da defesa automática, do anel e da esquiva. */
  const [seedLuta, setSeedLuta] = useState(() => newDefenseSeed());
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausado, setPausado] = useState(false);
  const reduced = useRef(prefersReducedMotion());
  const enemyHpRef = useRef(0);
  const playerHpRef = useRef(stats.hp);
  const idxRef = useRef(0);
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const battleRef = useRef<{ reset: (o: { foes: number; keepPet?: boolean }) => void } | null>(null);

  const enemy = wave[idx];
  const petEl = fxElementId(petElement);
  const par = stageSkillsFor(skills, petStage);
  const enemyEl = fxElementId(visualElementFor(enemy?.stage ?? 'x'));

  // Reabrir com outra noite recomeça limpo (o modal fica montado no App).
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    idxRef.current = 0;
    setEnemyHp(0);
    enemyHpRef.current = 0;
    setPlayerHp(stats.hp);
    playerHpRef.current = stats.hp;
    setPhase('intro');
    setRewards(null);
    setSeedLuta(newDefenseSeed());
    battleRef.current?.reset({ foes: 1, keepPet: false });
  }, [open, wave, stats.hp]);

  const win = () => {
    playFeed();
    const got = nightmareRewards(rarity, true);
    setRewards(got);
    setPhase('won');
    onWin(got);
  };

  const lose = () => {
    // Sem som de degeneração de propósito: perder aqui não é uma perda.
    setPhase('lost');
    onLose();
  };

  const ringTag = (r: RingGrade) => (isPt ? { otimo: 'ÓTIMO!', bom: 'BOM', ruim: 'FRACO' } : { otimo: 'GREAT!', bom: 'GOOD', ruim: 'WEAK' })[r];

  /* As regras da luta (o relógio é o `usePveBattle`): golpe-base = 0,5 × dmg, especial = 3× × a nota do anel,
     defesa perfeita = sem dano + contra-ataque, e o especial do pesadelo (2×) pode ser esquivado. */
  const regras: PveRules = {
    perfect: PERFECT,
    target: () => 0,
    foes: () => (enemyHpRef.current > 0 ? [0] : []),
    playerElement: () => petEl,
    foeElement: () => enemyEl,
    playerKind: sp => fighterStrikeForm({ skill: sp ? par?.especial : par?.basica, element: petEl }, sp ? 'especial' : 'basica'),
    foeKind: (_f, sp) => elementStrikeForm(enemyEl, sp ? 'especial' : 'basica'),
    playerStrike: ({ special, ring }) => {
      const e = waveRef.current[idxRef.current];
      const dmg = pveStrikeDamage({ dmg: stats.dmg, guard: e?.dmgReduction ?? 0, special, ring });
      enemyHpRef.current = Math.max(0, enemyHpRef.current - dmg);
      setEnemyHp(enemyHpRef.current);
      // A vibração NÃO passa por CSS nenhum, então `prefers-reduced-motion` só a
      // alcança por guard em JS. E ela não é essencial: é tempero do acerto.
      if (!reduced.current) {
        try { navigator.vibrate?.(special ? 40 : 15); } catch { /* noop */ }
      }
      return { hits: [{ foe: 0, value: dmg }], tag: special ? ringTag(ring) : undefined, victory: enemyHpRef.current <= 0 };
    },
    foeStrike: ({ special, dodge, acc }) => {
      const e = waveRef.current[idxRef.current];
      if (!e) return { value: 0, blocked: false, defeat: false };
      const r = pveFoeHitDamage({ atk: e.atk, acc, perfect: PERFECT, special, dodge });
      if (r.blocked) {
        const counter = Math.max(1, Math.round(2 * (1 - e.dmgReduction)));
        enemyHpRef.current = Math.max(0, enemyHpRef.current - counter);
        setEnemyHp(enemyHpRef.current);
        return {
          value: 0, blocked: true, counter: { foe: 0, value: counter }, tag: isPt ? 'Defendeu!' : 'Defended!',
          defeat: false, victory: enemyHpRef.current <= 0,
        };
      }
      playerHpRef.current -= r.dmg;
      setPlayerHp(playerHpRef.current);
      const tag = special
        ? (dodge === 'otimo' ? (isPt ? 'Esquivou!' : 'Dodged!') : dodge === 'bom' ? (isPt ? 'Quase!' : 'Close!') : undefined)
        : undefined;
      return { value: r.dmg, blocked: false, tag, defeat: playerHpRef.current <= 0 };
    },
    onVictory: () => {
      // C-1 (run `som-01`): morte de inimigo nao usa o som de conclusao.
      const n = idxRef.current + 1;
      if (n >= waveRef.current.length) { win(); return; }
      idxRef.current = n;
      setIdx(n);
      const hp = pveFoeHp(waveRef.current[n].hp);
      enemyHpRef.current = hp;
      setEnemyHp(hp);
      battleRef.current?.reset({ foes: 1, keepPet: true }); // a energia e a barra de cheer seguem para o próximo
    },
    onDefeat: () => lose(),
  };
  const battle = usePveBattle({
    running: open && phase === 'fight' && !!enemy,
    paused: pausado, seed: seedLuta, reduced: reduced.current, rules: regras, runKey: idx,
  });
  battleRef.current = battle;

  if (!open) return null;

  const petSprite = getSpriteForStage(petStage, demoCharacterId, 256);
  const title = nightmareName(rarity, language);
  const flavor = nightmareFlavor(rarity, language);
  const preview = nightmareRewards(rarity, true);

  const start = () => {
    if (wave.length === 0) return;
    setIdx(0);
    idxRef.current = 0;
    const hp = pveFoeHp(wave[0].hp);
    enemyHpRef.current = hp;
    setEnemyHp(hp);
    setPlayerHp(stats.hp);
    playerHpRef.current = stats.hp;
    setSeedLuta(newDefenseSeed());
    battleRef.current?.reset({ foes: 1, keepPet: false });
    setPhase('fight');
  };

  const goodMorning = isPt ? 'Bom dia!' : 'Good morning!';

  /* A LUTA: a tela cheia (a mesma cena do Duelo e da Masmorra). */
  if (phase === 'fight' && enemy) {
    return (
      <TorcidaLayer
        onTap={battle.cheer}
        active={!pausado && battle.phase === 'idle'}
        isPt={isPt}
        style={{ ...BATTLE_LAYER_STYLE, zIndex: 220 }}
        mascot
        swipeActive={battle.phase === 'dodge'}
        onSwipe={battle.swipe}
      >
        <BattleStage
          specialLabel={specialLabel(isPt, par?.especial)}
          scene={NIGHTMARE_SCENE.bg}
          me={{
            key: 'me', sprite: petSprite, name: isPt ? 'Seu Soulmon' : 'Your Soulmon', hp: Math.max(0, playerHp), maxHp: stats.hp,
            element: petEl, energy: battle.petEnergy / ENERGY_MAX,
          }}
          foes={[{
            key: idx, sprite: enemy.sprite, name: isPt ? 'Pesadelo' : 'Nightmare', hp: Math.max(0, enemyHp), maxHp: pveFoeHp(enemy.hp),
            element: enemyEl, down: enemyHp <= 0, energy: (battle.foeEnergy[0] ?? 0) / ENERGY_MAX,
          }]}
          action={battle.action}
          hit={battle.hits}
          charging={battle.charging}
          ring={battle.ring}
          onRingGrade={battle.resolveRing}
          dodge={battle.dodge}
          onDodge={battle.swipe}
          petDodge={battle.petDodge}
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
          hud={<TorcidaGauge taps={battle.meter} onCheer={battle.cheer} isPt={isPt} full={CHEER_TAPS_FULL} bare />}
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
