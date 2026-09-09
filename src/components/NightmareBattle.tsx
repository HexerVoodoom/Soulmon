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
import { PixelButton } from './pixel/PixelKit';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { getSpriteForStage } from '../utils/sprites';
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
import { Icon } from './ui/Icon';
import { FX_ART } from '../utils/fxArt';

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
interface Popup { icon: string; title: string; detail: string; color: string }


function hpBar(cur: number, max: number, color: string, label: string) {
  const pct = max > 0 ? Math.min(1, Math.max(0, cur / max)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: 104, height: 10, background: '#1c2636', border: '1px solid color-mix(in srgb, var(--sm-px-copper) 55%, transparent)', overflow: 'hidden' }}
    >
      <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  );
}

const sceneLabel: CSSProperties = { textShadow: '0 1px 3px rgba(0,0,0,0.9)' };

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

  /* Trap + Escape + devolução de foco. O handler de Escape daqui existia, mas
     nada recebia foco na abertura: o `keydown` nascia no `<body>`, fora da
     árvore do diálogo, e nunca chegava na div do véu. Escape morto desde o
     primeiro frame. */
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);

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
  const petSprite = getSpriteForStage(petStage, demoCharacterId);
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
      icon: '✨', title: head, color: '#4ade80',
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
        icon: '🛡️', title: isPt ? 'DESVIO PERFEITO!' : 'PERFECT DODGE!', color: '#60a5fa',
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
      color: '#f0abfc',
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(6, 12, 26, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sm-px-card sm-px-dark-ctx"
        style={{
          width: '100%', maxWidth: 360, position: 'relative',
          background: '#0c1120', color: '#e8eefc', padding: '22px 16px 16px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isPt ? 'Fechar' : 'Close'}
          /* Alvo de 44px com o ícone PELADO dentro — ícone nunca dentro de box. */
          style={{
            position: 'absolute', top: 0, right: 0, width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          {/* CHROME: o fechar é interface, não conteúdo da cena. Tinta fixa
              porque o cartão tem contexto escuro próprio (#0c1120) — 8,9:1. */}
          <Icon name="close" size={24} style={{ color: '#9fb2d8' }} />
        </button>

        {/* ── Convite ─────────────────────────────────────────────────── */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#9fb2d8', margin: '0 0 8px' }}>
              {isPt ? 'De manhã, seu Soulmon conta:' : 'In the morning, your Soulmon says:'}
            </p>
            <div aria-hidden="true" style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 6 }}>🌙</div>
            <p className="sm-display" style={{ fontSize: '1rem', margin: '0 0 6px' }}>{title}</p>
            <p style={{ fontSize: '0.82rem', color: '#c6d4f2', lineHeight: 1.5, margin: '0 0 10px' }}>{flavor}</p>

            {wave.length > 0 ? (
              <>
                <p style={{ fontSize: '0.76rem', color: '#9fb2d8', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {isPt
                    ? `Uma luta curtinha (${wave.length}). Vencer rende ${preview.bits} Bits, +${preview.energy} de energia${preview.hearts > 0 ? ` e +${preview.hearts} de coração` : ''}. Perder não custa nada.`
                    : `A very short fight (${wave.length}). Winning gives ${preview.bits} Bits, +${preview.energy} energy${preview.hearts > 0 ? ` and +${preview.hearts} heart` : ''}. Losing costs nothing.`}
                </p>
                <PixelButton size="lg" variant="primary" onClick={start}>
                  {isPt ? 'Ficar na frente dele' : 'Stand in its way'}
                </PixelButton>
                <span style={{ display: 'block', marginTop: 8 }}>
                  <PixelButton size="lg" onClick={onClose}>
                    {isPt ? 'Agora não' : 'Not now'}
                  </PixelButton>
                </span>
              </>
            ) : (
              <>
                {/* Estado VAZIO: noite sem registro. Nada foi perdido. */}
                <p style={{ fontSize: '0.78rem', color: '#9fb2d8', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {isPt
                    ? 'A noite passou tranquila — nada apareceu para enfrentar. Está tudo certo.'
                    : 'The night went by quietly — nothing showed up to face. All is well.'}
                </p>
                <PixelButton size="lg" variant="primary" onClick={onClose}>
                  {isPt ? 'Bom dia!' : 'Good morning!'}
                </PixelButton>
              </>
            )}
          </div>
        )}

        {/* ── Campo de batalha ────────────────────────────────────────── */}
        {inBattle && enemy && (
          <>
            <div
              style={{
                position: 'relative', height: 200, marginBottom: 12, overflow: 'hidden',
                background: 'linear-gradient(180deg, #131b33 0%, #1b2444 60%, #223056 100%)',
                border: '1px solid color-mix(in srgb, var(--sm-px-cyan) 40%, transparent)',
              }}
            >
              <div style={{ position: 'absolute', top: 10, right: 12, textAlign: 'right' }}>
                <p style={{ ...sceneLabel, fontSize: '0.76rem', fontWeight: 700, margin: '0 0 4px' }}>{enemy.name}</p>
                {hpBar(enemyHp, enemy.hp, '#c084fc', isPt ? 'Vida do pesadelo' : 'Nightmare health')}
              </div>
              {/* O idle era `style={{animation}}` inline nos DOIS sprites, e
                  animação inline só perde para `animation: none !important` —
                  `prefers-reduced-motion` não alcançava nenhum dos dois. Virou
                  classe, com a duração por custom property (que é onde os dois
                  diferem). Ver o bloco de movimento reduzido no index.css. */}
              <img
                src={enemy.sprite}
                alt={enemy.name}
                className="sm-battle-idle"
                style={{
                  position: 'absolute', top: '20%', right: '8%', width: 84, height: 84,
                  objectFit: 'contain', imageRendering: 'pixelated',
                  filter: hitFx === 'enemy' ? 'brightness(3) drop-shadow(0 0 10px #c084fc)' : 'drop-shadow(0 0 8px rgba(192,132,252,0.35))',
                  transition: 'filter 0.15s',
                  ['--sm-idle-dur' as string]: '1.6s',
                } as CSSProperties}
              />
              <div style={{ position: 'absolute', bottom: 96, left: 12 }}>
                <p style={{ ...sceneLabel, fontSize: '0.76rem', fontWeight: 700, margin: '0 0 4px' }}>
                  {isPt ? 'Seu Soulmon' : 'Your Soulmon'}
                </p>
                {hpBar(playerHp, stats.hp, '#4ade80', isPt ? 'Fôlego do seu Soulmon' : "Your Soulmon's stamina")}
              </div>
              <img
                src={petSprite}
                alt=""
                className="sm-battle-idle"
                style={{
                  position: 'absolute', bottom: '6%', left: '8%', width: 76, height: 76,
                  objectFit: 'contain', imageRendering: 'pixelated',
                  filter: hitFx === 'player' ? 'brightness(3) drop-shadow(0 0 10px #f0abfc)' : 'drop-shadow(0 0 8px rgba(74,222,128,0.35))',
                  transition: 'filter 0.15s',
                  ['--sm-idle-dur' as string]: '1.3s',
                } as CSSProperties}
              />
              {popup && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,9,15,0.45)' }}>
                  <div className="sm-px-card" style={{ textAlign: 'center', backgroundColor: '#0e1522', borderColor: popup.color, ['--sm-cham-line' as string]: popup.color, padding: '12px 20px' } as CSSProperties}>
                    <div aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1.2 }}>{FX_ART[popup.icon]
                      ? <img src={FX_ART[popup.icon]} alt="" width={40} height={40}
                             style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'inline-block' }} />
                      : popup.icon}</div>
                    <p className="sm-px-arcade-value" style={{ fontSize: '0.94rem', color: popup.color, margin: '4px 0 2px' }}>{popup.title}</p>
                    <p style={{ fontSize: '0.8rem', color: '#c6d4f2', margin: 0 }}>{popup.detail}</p>
                  </div>
                </div>
              )}
            </div>

            <div aria-live="polite" style={{ minHeight: 92 }}>
              {phase === 'attack' && (
                <>
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9fb2d8', margin: '0 0 6px' }}>
                    {isPt ? 'Sua vez — pare no centro!' : 'Your turn — stop in the center!'}
                  </p>
                  <TimingBar
                    key={`atk-${idx}-${enemyHp}-${playerHp}`}
                    speed={enemy.speed}
                    color="#4ade80"
                    label={isPt ? 'Avançar!' : 'Push!'}
                    onStop={handleAttack}
                  />
                </>
              )}
              {phase === 'defend' && (
                <>
                  {/* Sem limite de tempo, o relógio não aparece: um contador
                      parado seria pressão sem função. */}
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, color: defendTime > 0 && defendLeft <= 1 ? '#f0abfc' : '#facc15', margin: '0 0 6px' }}>
                    {isPt ? `${enemy.name} vindo — desvie!` : `${enemy.name} incoming — dodge!`}
                    {defendTime > 0
                      ? ` ${defendLeft.toFixed(1)}s`
                      : (isPt ? ' (sem pressa)' : ' (no time limit)')}
                  </p>
                  <TimingBar
                    key={`def-${idx}-${enemyHp}-${playerHp}`}
                    speed={enemy.speed * 1.2}
                    color="#60a5fa"
                    label={isPt ? 'Desviar!' : 'Dodge!'}
                    onStop={(a) => handleDefend(a)}
                  />
                </>
              )}
              {phase === 'result' && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#5d729c', paddingTop: 22 }}>…</p>
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

        {/* ── Vitória ─────────────────────────────────────────────────── */}
        {phase === 'won' && rewards && (
          <div style={{ textAlign: 'center' }} aria-live="polite">
            <div aria-hidden="true" style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 6 }}>🌤️</div>
            <p className="sm-display" style={{ fontSize: '1rem', margin: '0 0 6px', color: '#4ade80' }}>
              {isPt ? 'Seu Soulmon cuidou da sua noite!' : 'Your Soulmon looked after your night!'}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#c6d4f2', lineHeight: 1.5, margin: '0 0 10px' }}>
              {isPt
                ? `${title} foi embora sem fazer barulho.`
                : `${title} drifted away without a sound.`}
            </p>
            <p style={{ fontSize: '0.84rem', color: '#facc15', margin: '0 0 12px' }}>
              {`+${rewards.bits} Bits`}
              {rewards.energy > 0 ? ` · +${rewards.energy} ${isPt ? 'energia' : 'energy'}` : ''}
              {rewards.hearts > 0 ? ` · +${rewards.hearts} ${isPt ? 'coração' : 'heart'}` : ''}
            </p>
            <PixelButton size="lg" variant="primary" onClick={onClose}>
              {isPt ? 'Bom dia!' : 'Good morning!'}
            </PixelButton>
          </div>
        )}

        {/* ── Derrota: NÃO custa nada, e a tela diz isso ──────────────── */}
        {phase === 'lost' && (
          <div style={{ textAlign: 'center' }} aria-live="polite">
            <div aria-hidden="true" style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 6 }}>🌅</div>
            <p className="sm-display" style={{ fontSize: '1rem', margin: '0 0 6px' }}>
              {isPt ? 'O sonho passou — e você acorda bem.' : 'The dream passed — and you wake up fine.'}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#c6d4f2', lineHeight: 1.5, margin: '0 0 6px' }}>
              {isPt
                ? 'Seu Soulmon ficou na frente até o fim e voltou pro seu colo. Nada foi perdido: nenhum coração, nenhum Bit, nenhum progresso.'
                : 'Your Soulmon stood in the way until the end and came right back to you. Nothing was lost: no hearts, no Bits, no progress.'}
            </p>
            <p style={{ fontSize: '0.76rem', color: '#9fb2d8', lineHeight: 1.45, margin: '0 0 12px' }}>
              {isPt ? 'Amanhã tem outra noite. Sem pressa.' : 'There is another night tomorrow. No rush.'}
            </p>
            <PixelButton size="lg" variant="primary" onClick={onClose}>
              {isPt ? 'Bom dia!' : 'Good morning!'}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
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
