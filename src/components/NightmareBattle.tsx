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
 * POR QUE O `DungeonGame` NÃO FOI REUTILIZADO (para quem for refatorar)
 * ───────────────────────────────────────────────────────────────────────────
 * A intenção era compor `DungeonGame` em vez de reimplementar combate. Não deu,
 * e os impedimentos são todos ARQUITETURAIS — nenhum se resolve por props, e
 * eu não podia editar `DungeonGame.tsx`:
 *
 *  1. **Ele não aceita uma onda pronta.** A única entrada de inimigos é interna
 *     (`buildDungeonWave(res.level, evolutionStage)` dentro de `startRun`); a
 *     prop `onEnter` devolve um `level`, não uma `DungeonEnemy[]`. O pesadelo
 *     precisa exatamente do contrário: a onda vem de `buildNightmareWave`, que
 *     é quem aplica `NIGHTMARE_WAVE_SIZE` e o teto de tier por estágio.
 *  2. **Ele é uma RUN de 5 andares, não uma luta.** Andar, cenário por andar,
 *     `MAX_FLOORS`, bônus de andar, Glitchtama e "próximo andar" são estado
 *     interno. O pesadelo é UMA luta curta, de manhã, antes do café.
 *  3. **Ele escreve no localStorage direto** (`getDungeonDifficulty`,
 *     `recordDungeonScore`, `setDungeonDifficultyAtLeast`). Uma luta de
 *     pesadelo alimentando o recorde e a dificuldade semanal da Masmorra
 *     misturaria duas economias que a regra mantém separadas.
 *  4. ~~**`TimingBar` e `PLAYER_STATS` não são exportados**~~ — ✅ PAGO em
 *     09/09/2026, quando a Arena precisou da mesma barra e faria a TERCEIRA
 *     cópia. `TimingBar` virou `components/pixel/TimingBar.tsx` e
 *     `PLAYER_STATS` virou `utils/dungeon.ts` (que já era dono das stats de
 *     inimigo). As duas cópias marcadas `⚠️ DUPLICADO` foram apagadas; este
 *     arquivo e o `DungeonGame` importam o mesmo dono.
 *
 * O que CONTINUA valendo dos itens 1–3: o miolo de combate ainda não é um
 * componente que receba `enemies: DungeonEnemy[]` e devolva `onWin/onLose`.
 * Enquanto não for, cada jogo desenha o próprio laço — o que é aceitável
 * porque as REGRAS de cada um são de fato diferentes (a Arena tem elementos,
 * carga de especial e 5 rodadas; a Masmorra tem andares; o Pesadelo é uma luta
 * só). O que não podia continuar duplicado era a MECÂNICA, e essa agora tem
 * dono.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { GameVisor, VisorSprite, VisorFx, HpBars, FxPopup, DIALOG_VISOR_W, phaseTitle } from './games/GameKit';
import { NIGHTMARE_SCENE } from '../utils/dungeonScenes';
import { getSpriteForStage, DUNGEON_SPIRIT_SPRITE } from '../utils/sprites';
import { playerStatsFor } from '../utils/dungeon';
import { TimingBar } from './pixel/TimingBar';
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
  language: Language;
  /** Venceu: as recompensas de `nightmareRewards(rarity, true)`. */
  onWin: (rewards: NightmareRewards) => void;
  /** Perdeu. **Não custa nada** — o callback existe só para marcar a noite. */
  onLose: () => void;
  onClose: () => void;
}


const PERFECT = 0.92;
const DEFEND_TIME = 3.0;
const POPUP_MS = 1200;

/**
 * `prefers-reduced-motion` lido do sistema, com guard.
 *
 * Guard e não `window.matchMedia(...)` direto por dois motivos, os dois já
 * pagos: o jsdom dos testes NÃO implementa `matchMedia` (a chamada crua joga
 * `TypeError` e derruba o render inteiro), e o renderer do desktop pode montar
 * este arquivo fora de um documento. Falso é o padrão seguro: mantém o jogo
 * como sempre foi.
 */
function prefersReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

type Phase = 'intro' | 'attack' | 'defend' | 'result' | 'won' | 'lost';
interface Popup { icon: string; title: string; detail: string }


export function NightmareBattle({
  open, wave, rarity, petStage, demoCharacterId, language, onWin, onLose, onClose,
}: NightmareBattleProps) {
  const isPt = language === 'pt-BR';
  const stats = playerStatsFor(petStage);

  /**
   * G5 — WCAG 2.2.1 (Timing Adjustable, nível A).
   *
   * A defesa tinha 3,0 s FIXOS, sem jeito de desligar, estender ou ajustar:
   * é exatamente o que o 2.2.1 proíbe. A saída mais simples que passa é a
   * primeira opção do próprio critério — **desligar o limite** — e ela vem
   * atrelada ao sinal que o sistema operacional já dá: quem pediu movimento
   * reduzido pediu, na prática, uma tela que não corre atrás dele. Sem
   * preferência declarada, o combate continua idêntico ao que sempre foi.
   *
   * Lido UMA vez por montagem (`useState` com inicializador): o limite não pode
   * mudar no meio de uma esquiva.
   *
   * O que NÃO muda: a `TimingBar` continua andando. Ela é a mecânica essencial
   * do minijogo (2.3.3 isenta movimento essencial), e sem ela não existe
   * acerto nem contra-ataque — o que sai é a AMEAÇA de perder o turno por
   * demora, não a habilidade.
   */
  const [relaxedTiming] = useState(prefersReducedMotion);
  const defendTime = relaxedTiming ? 0 : DEFEND_TIME;

  /* Trap + Escape + devolução de foco vêm do `RitualDialog` (SIS-06, canvas
     Rituais): o × 44 pelado é o primeiro focável, Escape fecha. */

  const [idx, setIdx] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(stats.hp);
  const [phase, setPhase] = useState<Phase>('intro');
  const [popup, setPopup] = useState<Popup | null>(null);
  const [hitFx, setHitFx] = useState<'enemy' | 'player' | null>(null);
  const [defendLeft, setDefendLeft] = useState(defendTime);
  const [rewards, setRewards] = useState<NightmareRewards | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fxRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defendResolved = useRef(false);
  /* Declarado AQUI, antes do `return null` de `!open`: um `useRef` depois de um
     retorno condicional quebra a ordem dos hooks. Recebe o handler mais abaixo. */
  const defendRef = useRef<(acc: number, timedOut?: boolean) => void>(() => {});

  const after = useCallback((ms: number, fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fxRef.current) clearTimeout(fxRef.current);
  }, []);

  // Reabrir com outra noite recomeça limpo (o modal fica montado no App).
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setEnemyHp(0);
    setPlayerHp(stats.hp);
    setPhase('intro');
    setPopup(null);
    setDefendLeft(defendTime);
    setRewards(null);
    defendResolved.current = false;
  }, [open, wave, stats.hp]);

  const flash = (who: 'enemy' | 'player') => {
    setHitFx(who);
    if (fxRef.current) clearTimeout(fxRef.current);
    fxRef.current = setTimeout(() => setHitFx(null), 420);
  };

  if (!open) return null;

  const enemy = wave[idx];
  const petSprite = getSpriteForStage(petStage, demoCharacterId, 256);
  const title = nightmareName(rarity, language);
  const flavor = nightmareFlavor(rarity, language);
  const preview = nightmareRewards(rarity, true);

  const start = () => {
    if (wave.length === 0) return;
    setIdx(0);
    setEnemyHp(wave[0].hp);
    setPlayerHp(stats.hp);
    setPopup(null);
    setPhase('attack');
  };

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

  const nextEnemy = () => {
    if (idx + 1 >= wave.length) { win(); return; }
    const n = idx + 1;
    setIdx(n);
    setEnemyHp(wave[n].hp);
    setPhase('attack');
  };

  const handleAttack = (acc: number) => {
    if (!enemy) return;
    const crit = acc >= PERFECT;
    const raw = stats.dmg * (0.25 + 0.75 * acc * acc) * (crit ? 1.5 : 1);
    const dmg = Math.max(1, Math.round(raw * (1 - enemy.dmgReduction)));
    const next = Math.max(0, enemyHp - dmg);
    setEnemyHp(next);
    flash('enemy');
    // A vibração NÃO passa por CSS nenhum, então `prefers-reduced-motion` só a
    // alcança por guard em JS. E ela não é essencial: é tempero do acerto.
    if (!relaxedTiming) {
      try { navigator.vibrate?.(crit ? 40 : 15); } catch { /* noop */ }
    }

    const head = crit ? (isPt ? 'PERFEITO!' : 'PERFECT!')
      : acc >= 0.6 ? (isPt ? 'Bom golpe!' : 'Good hit!')
      : (isPt ? 'Raspão...' : 'Graze...');
    setPopup({
      icon: '✨', title: head,
      detail: isPt ? `${dmg} de dano em ${enemy.name}` : `${dmg} damage to ${enemy.name}`,
    });
    setPhase('result');

    if (next <= 0) {
      // C-1 (run `som-01`): morte de inimigo nao usa o som de conclusao — o
      // popup de dano + `setPhase('result')` ja carregam o resultado (R-36).
      after(POPUP_MS, () => { setPopup(null); nextEnemy(); });
      return;
    }
    after(POPUP_MS, () => {
      setPopup(null);
      defendResolved.current = false;
      setDefendLeft(defendTime);
      setPhase('defend');
    });
  };

  const handleDefend = (acc: number, timedOut = false) => {
    if (defendResolved.current || !enemy) return;
    defendResolved.current = true;

    if (!timedOut && acc >= PERFECT) {
      const counter = Math.max(1, Math.round(2 * (1 - enemy.dmgReduction)));
      const next = Math.max(0, enemyHp - counter);
      setEnemyHp(next);
      flash('enemy');
      setPopup({
        icon: '🛡️', title: isPt ? 'DESVIO PERFEITO!' : 'PERFECT DODGE!',
        detail: isPt ? `Contra-ataque: ${counter} de dano!` : `Counter-attack: ${counter} damage!`,
      });
      setPhase('result');
      if (next <= 0) {
        // C-1: idem no contra-ataque do desvio perfeito.
        after(POPUP_MS, () => { setPopup(null); nextEnemy(); });
        return;
      }
      after(POPUP_MS, () => { setPopup(null); setPhase('attack'); });
      return;
    }

    const eff = timedOut ? 0 : acc;
    const taken = Math.max(1, Math.ceil(enemy.atk * (1 - eff)));
    const next = Math.max(0, playerHp - taken);
    setPlayerHp(next);
    flash('player');

    setPopup({
      icon: '💫',
      title: timedOut ? (isPt ? 'Muito lento!' : 'Too slow!')
        : eff >= 0.6 ? (isPt ? 'Desvio parcial!' : 'Partial dodge!')
        : (isPt ? 'Levou de cheio!' : 'Direct hit!'),
      detail: isPt ? `Seu Soulmon segurou ${taken}` : `Your Soulmon took ${taken}`,
    });
    setPhase('result');

    if (next <= 0) {
      after(POPUP_MS, () => { setPopup(null); lose(); });
      return;
    }
    after(POPUP_MS, () => { setPopup(null); setPhase('attack'); });
  };
  defendRef.current = handleDefend;

  const inBattle = !!enemy && ['attack', 'defend', 'result'].includes(phase);
  const goodMorning = isPt ? 'Bom dia!' : 'Good morning!';
  /* O VISOR do diálogo (288 = 144×2): o pet a 128 embaixo à esquerda; na caixa
     do outro (alto à direita) o espírito 128² a 1× na proposta, o pesadelo da
     vez na luta, a faísca na vitória — nunca sobre o pet (X1); na derrota
     nada: o pet inteiro, porque nada caiu (JOGO-25). */
  const otherBox: CSSProperties = { right: 8, top: 12 };
  const visor = (height: 80 | 72, other: React.ReactNode) => (
    <GameVisor width={DIALOG_VISOR_W} height={height} scene={NIGHTMARE_SCENE.bg}>
      {other}
      <VisorSprite src={petSprite} alt="" style={{ left: 8, bottom: 8 }} data-visor-pet />
      {hitFx === 'player' && <VisorFx icon="💥" style={{ left: 8, bottom: 8 }} data-visor-fx="hit" />}
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
      style={{ alignItems: 'center', textAlign: 'center', gap: 10, paddingTop: 44 }}
    >
      {/* ── Convite ─────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <>
          {visor(80, <VisorSprite src={DUNGEON_SPIRIT_SPRITE} alt="" idle={false} style={otherBox} data-visor-enemy />)}
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

      {/* ── A luta: o visor persiste (R6), as barras fora dele ───────── */}
      {inBattle && enemy && (
        <>
          {visor(80, (
            <>
              <VisorSprite src={enemy.sprite} alt={enemy.name} flip style={otherBox} data-visor-enemy />
              {hitFx === 'enemy' && <VisorFx icon="💥" style={otherBox} data-visor-fx="hit" />}
            </>
          ))}
          <div style={{ alignSelf: 'stretch' }}>
            <HpBars
              bars={[
                { label: isPt ? 'Vida do pesadelo' : 'Nightmare health', cur: enemyHp, max: enemy.hp, tone: 'gold' },
                { label: isPt ? 'Fôlego do seu Soulmon' : "Your Soulmon's stamina", cur: playerHp, max: stats.hp, tone: 'cyan' },
              ]}
            />
          </div>
          {/* A instrução da barra (J3) — não existia no código. */}
          <p style={sm2Hint}>{isPt ? 'Toque quando o marcador cruzar o meio.' : 'Tap when the marker crosses the middle.'}</p>

          <div aria-live="polite" style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 92 }}>
            {phase === 'attack' && (
              <>
                <p style={phaseTitle}>{isPt ? 'Sua vez — pare no centro!' : 'Your turn — stop in the center!'}</p>
                <TimingBar
                  key={`atk-${idx}-${enemyHp}-${playerHp}`}
                  speed={enemy.speed}
                  label={isPt ? 'Avançar!' : 'Push!'}
                  onStop={handleAttack}
                />
              </>
            )}
            {phase === 'defend' && (
              <>
                {/* Sem limite de tempo, o relógio não aparece: um contador
                    parado seria pressão sem função. O relógio é leitura, na
                    tinta do texto (D-J8). */}
                <p style={phaseTitle}>
                  {isPt ? `${enemy.name} vindo — desvie!` : `${enemy.name} incoming — dodge!`}
                  {defendTime > 0
                    ? <> <span className="sm2-num">{defendLeft.toFixed(1)}s</span></>
                    : (isPt ? ' (sem pressa)' : ' (no time limit)')}
                </p>
                <TimingBar
                  key={`def-${idx}-${enemyHp}-${playerHp}`}
                  speed={enemy.speed * 1.2}
                  label={isPt ? 'Desviar!' : 'Dodge!'}
                  onStop={(a) => handleDefend(a)}
                />
              </>
            )}
            {phase === 'result' && popup && (
              <FxPopup icon={popup.icon} title={popup.title} detail={popup.detail} />
            )}
          </div>
          <DefendClock
            running={phase === 'defend' && defendTime > 0}
            left={defendLeft}
            setLeft={setDefendLeft}
            onTimeout={() => defendRef.current(0, true)}
          />
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

/**
 * Relógio da defesa. Componente separado só para o `setInterval` ter um ciclo
 * de vida próprio — dentro do corpo do modal ele conviveria com o `return null`
 * do `!open`, e hook depois de retorno condicional é erro de regra dos hooks.
 */
function DefendClock({ running, left, setLeft, onTimeout }: {
  running: boolean;
  left: number;
  setLeft: (fn: (t: number) => number) => void;
  onTimeout: () => void;
}) {
  const firedRef = useRef(false);
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;

  useEffect(() => {
    if (!running) { firedRef.current = false; return; }
    const id = setInterval(() => {
      setLeft((t) => {
        const nt = Math.max(0, +(t - 0.1).toFixed(1));
        if (nt <= 0 && !firedRef.current) {
          firedRef.current = true;
          timeoutRef.current();
        }
        return nt;
      });
    }, 100);
    return () => clearInterval(id);
  }, [running, setLeft]);

  // Só o tempo restante já é anunciado no texto da fase — nada a renderizar.
  void left;
  return null;
}

export default NightmareBattle;
