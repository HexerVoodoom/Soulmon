/**
 * A ARENA — cinco rodadas contra criaturas do bestiário, com o anel de 17
 * elementos e a habilidade especial da ficha do jogador.
 *
 * ## De onde ela veio
 *
 * O motor (`utils/arena.ts`, 517 linhas) existia INTEIRO e testado desde antes
 * desta sessão — elementos, contra-ataques, stats por estágio e escola,
 * especiais por escola, montagem de rodada a partir do bestiário — e não tinha
 * uma única tela que o usasse. A varredura de código morto da revisão de QA
 * (09/09/2026) o encontrou com ZERO importadores e um arquivo de teste próprio,
 * o que é o pior tipo de código morto: consome tempo de suíte e dá a impressão
 * de estar em uso. O dono decidiu construir a tela em vez de apagar o motor.
 *
 * ## A regra que este arquivo NÃO pode quebrar
 *
 * ⚠️ A ordem de turno aqui é a MESMA de `simulateArenaRun`, passo a passo, e
 * isso não é preferência: os números dos especiais foram CALIBRADOS por uma
 * simulação de 300+ runs por arquétipo (`arena.test.ts`, taxa de vitória
 * 40–80%, dispersão ≤ 20pp) rodando aquele laço. Trocar a ordem aqui — atacar
 * antes do eco, deixar só o inimigo da vez revidar, cobrar a carga do especial
 * de outro jeito — invalida o balanceamento inteiro sem nada ficar vermelho.
 * A ÚNICA diferença permitida é a origem da precisão. DEFESA: lá vem de
 * `sampleAcc()`, aqui da defesa AUTOMÁTICA (`utils/autoDefesa.ts`, TORC-3,
 * 02/10/2026: o dono tirou a esquiva — mesma lei 0,70 ± 0,25 da simulação; a
 * `TimingBar` de defesa fica atrás de `TIMING_DODGE_ENABLED`, sem apagar).
 * ATAQUE (desde 02/10/2026, H14): o pet golpeia SOZINHO com `ARENA_AUTO_ACC`
 * (`simulateArenaRun({ autoAttack: true })`) e o dono TORCE tocando na tela —
 * gauge de 8 toques, golpe de torcida ×`ARENA_TORCIDA_MULT` gasto pelo pet
 * (`arenaTorcidaTurn`, REGISTRO §20). A `TimingBar` de ataque fica atrás de
 * `ARENA_TIMING_ATTACK_ENABLED` (= false), sem apagar.
 *
 * O laço, na ordem exata:
 *   1. eco da evocação (se houver carga de um especial anterior);
 *   2. ação do jogador — especial se carregado, básica se não;
 *   3. TODO inimigo vivo revida, um de cada vez, com defesa perfeita
 *      esquivando limpo;
 *   4. o enfraquecimento da maldição perde um turno.
 *
 * ## O que a Arena NÃO faz
 *
 * Não cobra corações, não toca na barra de cuidado do pet e não tem porta de
 * entrada paga — a mesma regra da Masmorra (`DungeonGame`). Perder custa a run
 * e mais nada. Isto é decisão de produto do `CLAUDE.md` ("encoraja — NUNCA um
 * cobrador"), não detalhe de implementação.
 *
 * ## A superfície (canvas Jogos, DECISÕES §25)
 *
 * A luta é o conteúdo de um VISOR 348×160 (`games/GameKit.tsx`): o pet a 128,
 * os inimigos da rodada a 64 espelhados, o caído vira `fx-defeat` na própria
 * caixa; as barras `.meter` FORA do vidro ("You" ciano, o alvo `gold-fill`);
 * a ficha em `.chip.tag` (D-J11); o erro `sem-motor` é `cloud_off` num
 * `role=status` (é rede, não medalha); "Special ready" leva `auto_awesome`
 * 20 FILL no lugar do ✨ (D-J9/X3).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimingBar } from './pixel/TimingBar';
import { TorcidaLayer, TorcidaGauge } from './games/TorcidaKit';
import { torcidaTap, TORCIDA_TAPS_FULL } from '../utils/torcida';
import { usePveBattle, type PveRules } from './games/usePveBattle';
import {
  CHEER_TAPS_FULL, DODGE_REDUCE, ENERGY_MAX, PVE_FOE_SPECIAL_MULT, RING_MULT, type RingGrade, type DodgeGrade,
} from '../utils/energia';
import { BattleStage, BATTLE_LAYER_STYLE, type StageAction, type StageHit } from './games/BattleStage';
import {
  ARENA_STRIKE_MS, ARENA_DEFEND_MS, STAGE_TIMING, fxElementId, impactMs, prefersReducedMotion,
  strikeKindForSchool, type StageActionKind,
} from '../utils/combatFx';
import { autoDefense, defenseRoll, newDefenseSeed, TIMING_DODGE_ENABLED } from '../utils/autoDefesa';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import { sm2Button, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, VisorFx, HpBars, FxPopup, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import { getDungeonEnemySprite, getSpriteForStage } from '../utils/sprites';
import {
  ARENA_ROUNDS,
  ARENA_AUTO_ACC,
  ARENA_ENERGY_ENABLED,
  ARENA_FOE_HP_EXTRA,
  ARENA_HP_SCALE,
  ARENA_TIMING_ATTACK_ENABLED,
  arenaTorcidaTurn,
  DEFAULT_ARENA_ATTRIBUTES,
  PERFECT_ACC,
  ROUND_CLEAR_HEAL,
  SPECIAL_CHARGE_TURNS,
  SPECIAL_EFFECTS,
  buildArenaRound,
  elementLabel,
  elementMultiplier,
  enemyHitDamage,
  getArenaPlayerStats,
  loadBestiaryPool,
  playerHitDamage,
  type ArenaEnemy,
  type BestiaryCreature,
} from '../utils/arena';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import { getStageLevel } from '../types/progression';
import type { Language } from '../utils/i18n';

/** Estágios que a ficha conhece. `getStageLevel` devolve os do PET, que têm
 *  dois níveis de bebê a mais — os dois caem em `rookie`, que é o piso da
 *  tabela de orçamento do motor. */
function fichaStageOf(evolutionStage: string): FichaStage {
  const nivel = getStageLevel(evolutionStage);
  return (['rookie', 'champion', 'ultimate', 'mega', 'ultra'].includes(nivel)
    ? nivel
    : 'rookie') as FichaStage;
}

type Fase =
  | 'carregando' | 'sem-motor' | 'intro'
  | 'atacar' | 'defender' | 'rodada-limpa' | 'venceu' | 'perdeu';

interface Popup { icon: string; title: string; detail: string }

// O ritmo da luta (`ARENA_STRIKE_MS` = 2400 — era 1500 —, `ARENA_DEFEND_MS` = 1400 — era 800)
// mora em `utils/combatFx.ts`, ao lado do passo do duelo fantasma (rodada 5, I10).

export interface ArenaGameProps {
  evolutionStage: string;
  demoCharacterId?: string;
  language: Language;
  /** As skills da ficha, quando o save as tem. Sem elas a Arena abre com o par
   *  genérico de `buildDefaultArenaSkills` — o perfil do oráculo vive só no
   *  localStorage e não sobe para a nuvem, então um aparelho novo chega aqui
   *  sem ficha e não pode encontrar uma porta fechada. */
  skills?: Partial<Record<FichaStage, StageSkills>>;
  /** Atributos de arena (`getArenaAttributes(ficha)`), quando conhecidos. */
  attrs?: { principal: string; secundario: string };
  onEarnPoints?: (points: number) => void;
  onExit: () => void;
}

export function ArenaGame({
  evolutionStage, demoCharacterId, language, skills, attrs, onEarnPoints, onExit,
}: ArenaGameProps) {
  const isPt = language === 'pt-BR';
  const stage = fichaStageOf(evolutionStage);

  const [pool, setPool] = useState<BestiaryCreature[] | null>(null);
  const [fase, setFase] = useState<Fase>('carregando');
  const [rodada, setRodada] = useState(1);
  const [inimigos, setInimigos] = useState<ArenaEnemy[]>([]);
  const [hp, setHp] = useState(0);
  const [carga, setCarga] = useState(0);
  const [eco, setEco] = useState(0);
  const [enfraquecidos, setEnfraquecidos] = useState(0);
  /** Índice do inimigo que ainda vai revidar neste turno. -1 = ninguém. */
  const [defensor, setDefensor] = useState(-1);
  const [pontos, setPontos] = useState(0);
  const [popup, setPopup] = useState<Popup | null>(null);
  const popupTimer = useRef(0);
  /** O gauge da torcida (0..8). O ref é o que o golpe lê; o state só desenha. */
  const [taps, setTaps] = useState(0);
  const tapsRef = useRef(0);
  /** Defesa automática: sorteio determinístico por (semente da run, nº do revide). */
  const defSeedRef = useRef(newDefenseSeed());
  const defCountRef = useRef(0);
  const [guardFx, setGuardFx] = useState(false);
  /** A cena nova (I10): a ação em curso (investida/projétil/escudo) e o número do dano. */
  const [acao, setAcao] = useState<StageAction | null>(null);
  const [golpe, setGolpe] = useState<StageHit | null>(null);
  const cenaSeq = useRef(0);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausado, setPausado] = useState(false);
  const reduzido = useRef(prefersReducedMotion());
  /** A luta COM ENERGIA (04/10/2026): o relógio é o `usePveBattle`; as regras leem estas refs (sempre o estado mais novo). */
  const battleRef = useRef<{ reset: (o: { foes: number; keepPet?: boolean }) => void } | null>(null);
  const inimigosRef = useRef<ArenaEnemy[]>([]);
  const hpRef = useRef(0);
  const ecoRef = useRef(0);
  const fracoRef = useRef(0);
  const ultimoRef = useRef(-1);
  const [seedLuta, setSeedLuta] = useState(() => defSeedRef.current);
  /** Toque de torcida: sobe o gauge e para no cheio (toque a mais não rende). */
  const torcer = useCallback(() => {
    tapsRef.current = torcidaTap(tapsRef.current, TORCIDA_TAPS_FULL);
    setTaps(tapsRef.current);
  }, []);

  const par = skills?.[stage];
  const basica = par?.basica;
  const especial = par?.especial;
  const atributos = attrs ?? DEFAULT_ARENA_ATTRIBUTES;
  const efeito = SPECIAL_EFFECTS[especial?.escolaId ?? 'combate_fisico'];
  const stats = useMemo(
    () => getArenaPlayerStats(stage, basica?.escolaId ?? 'combate_fisico', ARENA_ENERGY_ENABLED ? ARENA_HP_SCALE : 1),
    [stage, basica?.escolaId],
  );

  /** Sprite por inimigo, sorteado UMA vez por rodada — sortear na pintura
   *  trocaria o bicho a cada re-render. */
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

  useEffect(() => () => clearTimeout(popupTimer.current), []);

  const mostrarPopup = useCallback((p: Popup, ms = 1100) => {
    setPopup(p);
    clearTimeout(popupTimer.current);
    popupTimer.current = window.setTimeout(() => setPopup(null), ms);
  }, []);

  const montarRodada = useCallback((n: number, poolAtual: BestiaryCreature[]) => {
    const novos = buildArenaRound(n, 1, Math.random, poolAtual, ARENA_ENERGY_ENABLED ? ARENA_HP_SCALE * ARENA_FOE_HP_EXTRA : 1);
    inimigosRef.current = novos;
    setInimigos(novos);
    battleRef.current?.reset({ foes: novos.length, keepPet: true });
    setSprites(novos.map(e => getDungeonEnemySprite(e.tier).sprite));
    setDefensor(-1);
    setFase('atacar');
  }, []);

  const comecar = useCallback(() => {
    if (!pool) return;
    setHp(stats.hp);
    setCarga(0);
    setEco(0);
    setEnfraquecidos(0);
    setPontos(0);
    tapsRef.current = 0;
    defSeedRef.current = newDefenseSeed();
    defCountRef.current = 0;
    setSeedLuta(defSeedRef.current);
    hpRef.current = stats.hp;
    ecoRef.current = 0;
    fracoRef.current = 0;
    battleRef.current?.reset({ foes: 1, keepPet: false });
    setTaps(0);
    setRodada(1);
    montarRodada(1, pool);
  }, [pool, stats.hp, montarRodada]);

  const vivos = inimigos.filter(e => e.hp > 0);
  const alvo = vivos[0];

  /** Fim do turno do jogador: enfileira os inimigos vivos para revidarem. */
  const abrirDefesa = useCallback((restantes: ArenaEnemy[]) => {
    const idx = restantes.findIndex(e => e.hp > 0);
    if (idx === -1) return false;
    setDefensor(idx);
    setFase('defender');
    return true;
  }, []);

  const limparRodada = useCallback(() => {
    // C-1 (run `som-01`): a rodada limpa NAO toca `playTaskComplete`. Este
    // arquivo nasceu 21 minutos antes do commit que aplicou os cortes
    // (b55ffa5a -> 2eec1a2a, 09/09/2026) e por isso nao foi varrido: ele nao
    // aparece em nenhuma linha do `inventario-sonoro.md` §1, e os dois `play*`
    // que tinha reintroduziam cortes ja aplicados em todas as outras
    // superficies. Isto NAO e um corte novo — e o corte ja decidido alcancando
    // um arquivo que ele nao tinha visto.
    //
    // Por que o C-1 vale aqui: `playTaskComplete` e o simbolo da CONCLUSAO de
    // tarefa/habito. Pendura-lo em morte de inimigo gasta a celebracao antes do
    // marco — medido na masmorra, ate 30 disparos por run (`MAX_FLOORS` x
    // `LADDER_TIERS`). A Arena tem a mesma forma: N inimigos por rodada, N
    // rodadas por run. Os analogos ja cortados (`DungeonGame.defeatEnemy`,
    // `NightmareBattle`) ficaram sem esse som pelo mesmo motivo.
    //
    // ⚠️ PENDENCIA DE PRODUTO, e ela NAO e do engenheiro: se a Arena deve ter
    // som PROPRIO no lugar do cortado (as saidas em aberto sao "um som de
    // classe Arcade proprio da Arena" ou "nenhum som"), quem decide sao os
    // revisores obrigatorios de corte (`METODO.md` Fase 0: "nunca o autor").
    // Ate essa decisao fechar, fica **nenhum som** — mesmo padrao que a Fatia 1
    // usou no `handlePet` do `App.tsx` para o C-4. O feedback da rodada limpa
    // continua existindo pelo canal visual (`setFase('rodada-limpa')` + o cura
    // de folego), que e o canal real desta tela.
    const ganho = inimigos.reduce((s, e) => s + e.points, 0);
    setPontos(p => p + ganho);
    // Fôlego entre rodadas — a mesma regra da simulação, e é ela que faz a
    // run inteira ser possível sem cura no meio da luta.
    setHp(h => Math.min(stats.hp, h + Math.round(stats.hp * ROUND_CLEAR_HEAL)));
    setFase('rodada-limpa');
  }, [inimigos, stats.hp]);

  /** PASSO 1 e 2 do laço: eco, depois a ação do jogador. */
  const atacar = useCallback((acc: number) => {
    if (!alvo) return;
    const copia = inimigos.map(e => ({ ...e }));
    const vivosDe = () => copia.filter(e => e.hp > 0);

    // 1) Eco da evocação, de um especial anterior. Vem ANTES da ação — é o
    //    que a simulação faz, e mover para depois mudaria quem morre primeiro.
    if (eco > 0) {
      const t = vivosDe()[0];
      if (t) {
        t.hp -= Math.max(1, Math.round(
          stats.dmg * (efeito.echoMult ?? 0)
          * elementMultiplier(especial?.elementoId ?? 'vigor', t.elements)));
      }
      setEco(e => e - 1);
    }

    // 2) Especial quando carregado, básica quando não. A torcida só SOMA: com o
    //    gauge cheio o golpe do turno vale ×ARENA_TORCIDA_MULT e o gauge é gasto;
    //    sem ele (ou com a barra de ataque do caminho antigo) o multiplicador é 1.
    const torcida = arenaTorcidaTurn(ARENA_TIMING_ATTACK_ENABLED ? 0 : tapsRef.current);
    if (!ARENA_TIMING_ATTACK_ENABLED) {
      tapsRef.current = torcida.gaugeLeft;
      setTaps(torcida.gaugeLeft);
    }
    const usouEspecial = carga >= SPECIAL_CHARGE_TURNS;
    if (usouEspecial) {
      const alvosDoEspecial = efeito.targets === 'all'
        ? vivosDe()
        : vivosDe().slice(0, efeito.targets);
      for (const t of alvosDoEspecial) {
        t.hp -= playerHitDamage(
          stats.dmg, acc,
          elementMultiplier(especial?.elementoId ?? 'vigor', t.elements),
          efeito.mult * torcida.mult,
        );
      }
      if (efeito.healFrac) {
        setHp(h => Math.min(stats.hp, h + Math.round(stats.hp * (efeito.healFrac ?? 0))));
      }
      if (efeito.weakenTurns) setEnfraquecidos(efeito.weakenTurns);
      if (efeito.echoTurns) setEco(efeito.echoTurns);
      setCarga(0);
      // C-2/C-3 (run `som-01`): a habilidade especial NAO toca `playFeed`.
      // `playFeed` e o "OK generico" do app — o mesmo som de comer, e por isso
      // ele foi arrancado da compra na loja (C-3) e do carinho (C-4). Pendura-lo
      // tambem no especial da Arena e repetir exatamente o defeito que os cortes
      // fecharam: um simbolo de CUIDADO servindo a um evento de combate.
      //
      // Havia um segundo defeito, e ele e o que a R-EX (P-1) veio matar: quando
      // o especial matava o ULTIMO inimigo da rodada, este `playFeed` e o
      // `playTaskComplete` de `limparRodada` disparavam na MESMA passagem
      // sincrona — dois sons num gesto. O barramento continha a soma de ganho,
      // mas o D-2 so atenua o Arcade em 9 dB; ele nao exclui. A R-EX agora
      // exclui no despacho (`src/utils/audioBus.ts`), e este corte remove a
      // colisao na origem: as duas coisas sao necessarias, nenhuma substitui a
      // outra.
      //
      // ⚠️ PENDENCIA DE PRODUTO (mesma do C-1 acima): som proprio da Arena, se
      // algum, e decisao dos revisores de corte. Ate la, **nenhum som**. O
      // disparo do especial ja tem popup proprio (`mostrarPopup`, logo abaixo).
      mostrarPopup({
        icon: '✨',
        title: (isPt ? especial?.nome.pt : especial?.nome.en) ?? (isPt ? 'Especial!' : 'Special!'),
        detail: torcida.special
          ? (isPt ? 'Com a força da torcida!' : 'With the crowd behind it!')
          : (isPt ? 'A habilidade especial disparou' : 'Special skill unleashed'),
      });
    } else {
      const t = vivosDe()[0];
      if (t) {
        t.hp -= playerHitDamage(
          stats.dmg, acc,
          elementMultiplier(basica?.elementoId ?? 'vigor', t.elements),
          torcida.mult,
        );
      }
      setCarga(c => c + 1);
      if (torcida.special) {
        mostrarPopup({
          icon: '📣', title: isPt ? 'Golpe da torcida!' : 'Cheer strike!',
          detail: isPt ? 'Seu Soulmon ouviu vocês' : 'Your Soulmon heard you',
        });
      }
      if (acc >= PERFECT_ACC) {
        mostrarPopup({
          icon: '💥', title: isPt ? 'Crítico!' : 'Critical!',
          detail: isPt ? 'Bem no centro' : 'Dead center',
        }, 800);
      }
    }

    // O número que sobe do alvo mirado (a cena nova; o caminho antigo não o desenha).
    const idxAlvo = inimigos.indexOf(alvo);
    const dealt = idxAlvo >= 0 ? Math.round(inimigos[idxAlvo].hp - copia[idxAlvo].hp) : 0;
    if (dealt > 0) setGolpe({ id: ++cenaSeq.current, side: 'foe', foe: idxAlvo, value: dealt, big: usouEspecial || torcida.special });

    setInimigos(copia);
    if (!copia.some(e => e.hp > 0)) { limparRodada(); return; }
    abrirDefesa(copia);
  }, [alvo, inimigos, eco, carga, efeito, stats, especial, basica, isPt,
      mostrarPopup, limparRodada, abrirDefesa]);

  /** PASSO 3: um inimigo revida. Defesa perfeita bloqueia limpo. */
  const defender = useCallback((defAcc: number) => {
    const e = inimigos[defensor];
    if (!e) return;
    let hpDepois = hp;
    if (defAcc >= PERFECT_ACC) {
      mostrarPopup({
        icon: '🛡️', title: isPt ? 'Defendeu!' : 'Defended!',
        detail: isPt ? 'Sem dano nenhum' : 'No damage at all',
      }, 800);
      setGuardFx(true);
      setTimeout(() => setGuardFx(false), 450);
    } else {
      const dano = enemyHitDamage(e.atk, defAcc, e.elements[0], atributos, enfraquecidos > 0);
      hpDepois = hp - dano;
      setHp(hpDepois);
      if (defAcc >= 0.6) {
        setGuardFx(true);
        setTimeout(() => setGuardFx(false), 450);
      }
    }

    if (hpDepois <= 0) { setFase('perdeu'); return; }

    // Próximo inimigo vivo da fila; acabando a fila, o turno fecha.
    const proximo = inimigos.findIndex((x, i) => i > defensor && x.hp > 0);
    if (proximo !== -1) { setDefensor(proximo); return; }

    // 4) O enfraquecimento da maldição perde um turno — no FIM do turno, como
    //    na simulação, para que ele valha durante todos os revides deste turno.
    setEnfraquecidos(w => Math.max(0, w - 1));
    setDefensor(-1);
    setFase('atacar');
  }, [inimigos, defensor, hp, atributos, enfraquecidos, isPt, mostrarPopup]);

  /** O pet golpeia SOZINHO: um instante depois de abrir o turno, ele ataca. */
  const atacarRef = useRef(atacar);
  atacarRef.current = atacar;
  useEffect(() => {
    if (ARENA_ENERGY_ENABLED || ARENA_TIMING_ATTACK_ENABLED || fase !== 'atacar' || vivos.length === 0 || pausado) return;
    // A cena (I10): a ação COMEÇA `impactMs` antes de o golpe chegar; o jogo resolve no
    // impacto, e a barra de HP só cai quando o golpe chega no alvo.
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      const pronto = carga >= SPECIAL_CHARGE_TURNS;
      const cheio = tapsRef.current >= TORCIDA_TAPS_FULL;
      const kind: StageActionKind = pronto || cheio ? 'special' : strikeKindForSchool(basica?.escolaId);
      const elemento = pronto ? especial?.elementoId : basica?.elementoId;
      setAcao({
        id: ++cenaSeq.current, actor: 'me', foe: Math.max(0, inimigos.indexOf(alvo as ArenaEnemy)),
        kind, element: fxElementId(elemento ?? 'vigor'),
      });
      t2 = setTimeout(() => atacarRef.current(ARENA_AUTO_ACC), impactMs(kind, reduzido.current));
    }, Math.max(0, ARENA_STRIKE_MS - STAGE_TIMING.special.impact));
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [fase, rodada, vivos.length, hp, carga, pausado]);

  /** O Soulmon se defende SOZINHO: a regra pura decide (determinística pela semente). */
  const defenderRef = useRef(defender);
  defenderRef.current = defender;
  useEffect(() => {
    if (ARENA_ENERGY_ENABLED || TIMING_DODGE_ENABLED || fase !== 'defender' || defensor < 0 || pausado) return;
    const e = inimigos[defensor];
    if (!e) return;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      const roll = defenseRoll(defSeedRef.current, defCountRef.current++);
      const acc = autoDefense(roll, { perfect: PERFECT_ACC }).acc;
      // Quem revida investe (pares) ou atira (ímpares); o escudo é o do ELEMENTO de quem defende.
      const kind: StageActionKind = defensor % 2 === 0 ? 'melee' : 'ranged';
      const perfeita = acc >= PERFECT_ACC;
      setAcao({
        id: ++cenaSeq.current, actor: 'foe', foe: defensor, kind, element: fxElementId(e.elements[0]),
        shield: perfeita ? fxElementId(basica?.elementoId ?? atributos.principal) : null,
      });
      t2 = setTimeout(() => {
        if (!perfeita) {
          const dano = enemyHitDamage(e.atk, acc, e.elements[0], atributos, enfraquecidos > 0);
          if (dano > 0) setGolpe({ id: ++cenaSeq.current, side: 'me', foe: defensor, value: Math.round(dano) });
        }
        defenderRef.current(acc);
      }, impactMs(kind, reduzido.current));
    }, Math.max(0, ARENA_DEFEND_MS - STAGE_TIMING.ranged.impact));
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [fase, defensor, rodada, hp, pausado]);

  /* ── A LUTA COM ENERGIA (04/10/2026, REGISTRO §20.10) ─────────────────────────
     O pet golpeia sozinho; a barra de ENERGIA de cada lutador (dado + sofrido + cheer) dispara o
     ESPECIAL: no pet, o especial da ficha com o ANEL (nota ruim/bom/ótimo no multiplicador); no
     inimigo, um golpe ×${PVE_FOE_SPECIAL_MULT} que o jogador pode ESQUIVAR deslizando o dedo. A ordem do laço é a de
     `simulateArenaRunEnergy` (eco → ação do pet → revide de cada inimigo vivo → enfraquecimento perde um turno). */
  const limparRef = useRef(limparRodada);
  limparRef.current = limparRodada;
  inimigosRef.current = inimigos;
  hpRef.current = hp;
  ecoRef.current = eco;
  fracoRef.current = enfraquecidos;
  const ringTag = (r: RingGrade) => (isPt ? { otimo: 'ÓTIMO!', bom: 'BOM', ruim: 'FRACO' } : { otimo: 'GREAT!', bom: 'GOOD', ruim: 'WEAK' })[r];
  const regras: PveRules = {
    perfect: PERFECT_ACC,
    target: () => Math.max(0, inimigosRef.current.findIndex(e => e.hp > 0)),
    foes: () => {
      const l = inimigosRef.current.map((e, i) => (e.hp > 0 ? i : -1)).filter(i => i >= 0);
      ultimoRef.current = l.length ? l[l.length - 1] : -1;
      return l;
    },
    playerElement: (sp: boolean) => fxElementId((sp ? especial?.elementoId : basica?.elementoId) ?? atributos.principal ?? 'vigor'),
    foeElement: (i: number) => fxElementId(inimigosRef.current[i]?.elements[0]),
    playerKind: () => strikeKindForSchool(basica?.escolaId),
    foeKind: (foe: number) => (foe % 2 === 0 ? 'melee' : 'ranged'),
    playerStrike: ({ special, ring }) => {
      const antes = inimigosRef.current;
      const copia = antes.map(e => ({ ...e }));
      const vivosC = () => copia.filter(e => e.hp > 0);
      if (ecoRef.current > 0) {
        const t = vivosC()[0];
        if (t) {
          t.hp -= Math.max(1, Math.round(stats.dmg * (efeito.echoMult ?? 0) * elementMultiplier(especial?.elementoId ?? 'vigor', t.elements)));
        }
        ecoRef.current -= 1;
        setEco(ecoRef.current);
      }
      if (special) {
        const alvos = efeito.targets === 'all' ? vivosC() : vivosC().slice(0, efeito.targets);
        for (const t of alvos) {
          t.hp -= playerHitDamage(stats.dmg, ARENA_AUTO_ACC, elementMultiplier(especial?.elementoId ?? 'vigor', t.elements), efeito.mult * RING_MULT[ring]);
        }
        if (efeito.healFrac) {
          hpRef.current = Math.min(stats.hp, hpRef.current + Math.round(stats.hp * efeito.healFrac));
          setHp(hpRef.current);
        }
        if (efeito.weakenTurns) { fracoRef.current = efeito.weakenTurns; setEnfraquecidos(fracoRef.current); }
        if (efeito.echoTurns) { ecoRef.current = efeito.echoTurns; setEco(ecoRef.current); }
      } else {
        const t = vivosC()[0];
        if (t) t.hp -= playerHitDamage(stats.dmg, ARENA_AUTO_ACC, elementMultiplier(basica?.elementoId ?? 'vigor', t.elements));
      }
      inimigosRef.current = copia;
      setInimigos(copia);
      const hits = copia
        .map((e, i) => ({ foe: i, value: Math.round(antes[i].hp - e.hp) }))
        .filter(h => h.value > 0);
      return { hits, tag: special ? ringTag(ring) : undefined, victory: !copia.some(e => e.hp > 0) };
    },
    foeStrike: ({ foe, special, dodge, acc }: { foe: number; special: boolean; dodge: DodgeGrade; acc: number }) => {
      const e = inimigosRef.current[foe];
      const ultimo = foe === ultimoRef.current;
      let value = 0;
      let blocked = false;
      let tag: string | undefined;
      if (e) {
        if (!special && acc >= PERFECT_ACC) {
          blocked = true;
          tag = isPt ? 'Defendeu!' : 'Blocked!';
        } else {
          const base = enemyHitDamage(e.atk, special ? Math.min(acc, PERFECT_ACC - 0.01) : acc, e.elements[0], atributos, fracoRef.current > 0);
          value = special ? Math.max(1, Math.round(base * PVE_FOE_SPECIAL_MULT * (1 - DODGE_REDUCE[dodge]))) : base;
          if (special) tag = dodge === 'otimo' ? (isPt ? 'Esquivou!' : 'Dodged!') : dodge === 'bom' ? (isPt ? 'Quase!' : 'Close!') : undefined;
        }
      }
      hpRef.current -= value;
      setHp(hpRef.current);
      if (ultimo && fracoRef.current > 0) { fracoRef.current -= 1; setEnfraquecidos(fracoRef.current); }
      return { value: Math.round(value), blocked, tag, defeat: hpRef.current <= 0 };
    },
    onVictory: () => limparRef.current(),
    onDefeat: () => setFase('perdeu'),
  };
  const battle = usePveBattle({
    running: ARENA_ENERGY_ENABLED && fase === 'atacar' && vivos.length > 0,
    paused: pausado, seed: seedLuta, reduced: reduzido.current, rules: regras,
  });
  battleRef.current = battle;

  const proximaRodada = useCallback(() => {
    if (!pool) return;
    if (rodada >= ARENA_ROUNDS) {
      onEarnPoints?.(pontos);
      setFase('venceu');
      return;
    }
    const n = rodada + 1;
    setRodada(n);
    montarRodada(n, pool);
  }, [pool, rodada, pontos, onEarnPoints, montarRodada]);

  const emLuta = fase === 'atacar' || fase === 'defender';
  const nomeDe = (e: ArenaEnemy) => (isPt ? e.namePt : e.nameEn);
  const sair = isPt ? 'Sair' : 'Leave';
  const especialPronto = carga >= SPECIAL_CHARGE_TURNS;
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId, 256);

  /* A luta no VIDRO (D-J3/D-J4): o pet a 128 embaixo à esquerda; os inimigos
     da rodada (1–3) a 64 (0,25×) empilhados à direita, espelhados de frente
     para o pet; o que caiu vira `fx-defeat` a 64 na própria caixa — a derrota
     é do outro, e é pixel no vidro. O golpe é `fx-hit` sobre quem apanhou. */
  const caixaInimigo = (i: number, n: number): React.CSSProperties => {
    const passo = n <= 1 ? 0 : n === 2 ? 72 : 48;
    const topo = n <= 1 ? 48 : n === 2 ? 12 : 8;
    return { right: 16, top: topo + i * passo };
  };

  /* A LUTA na cena nova (I10, 02/10/2026): tela cheia, profundidade de Game Boy,
     barra de HP nos pés, golpes com a arte do elemento. Os caminhos antigos
     (barra de timing de ataque/esquiva, atrás das flags) seguem no layout de
     baixo, intocados. */
  if (emLuta && !ARENA_TIMING_ATTACK_ENABLED && !TIMING_DODGE_ENABLED) {
    const alvoIdx = fase === 'defender' && defensor >= 0 ? defensor : Math.max(0, inimigos.indexOf(alvo as ArenaEnemy));
    const carregado = carga >= SPECIAL_CHARGE_TURNS;
    const en = ARENA_ENERGY_ENABLED;
    return (
      <TorcidaLayer
        onTap={en ? battle.cheer : torcer}
        active={!pausado && (!en || battle.phase === 'idle')}
        isPt={isPt}
        style={BATTLE_LAYER_STYLE}
        mascot
        swipeActive={en && battle.phase === 'dodge'}
        onSwipe={battle.swipe}
      >
        <BattleStage
          scene={ARENA_SCENE.bg}
          me={{
            key: 'me', sprite: petSprite, name: isPt ? 'Você' : 'You', hp: Math.max(0, hp), maxHp: stats.hp,
            element: fxElementId(basica?.elementoId ?? atributos.principal),
            energy: en ? battle.petEnergy / ENERGY_MAX : undefined,
          }}
          foes={inimigos.map((e, i) => ({
            key: i, sprite: sprites[i], name: nomeDe(e), hp: Math.max(0, e.hp), maxHp: e.maxHp,
            element: fxElementId(e.elements[0]), down: e.hp <= 0,
            energy: en ? (battle.foeEnergy[i] ?? 0) / ENERGY_MAX : undefined,
          }))}
          target={en ? Math.max(0, inimigos.findIndex(e => e.hp > 0)) : alvoIdx}
          action={en ? battle.action : acao}
          hit={en ? battle.hits : golpe}
          charging={en && battle.charging}
          ring={en ? battle.ring : null}
          onRingGrade={battle.resolveRing}
          dodge={en ? battle.dodge : null}
          onDodge={battle.swipe}
          petDodge={en ? battle.petDodge : null}
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
          badge={en ? undefined : (
            <span
              role="img"
              aria-label={`${isPt ? 'Carga' : 'Charge'} ${Math.min(carga, SPECIAL_CHARGE_TURNS)}/${SPECIAL_CHARGE_TURNS}`}
              data-arena-charge={carregado ? 'full' : String(carga)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }}
            >
              {carregado
                ? <Icon name="auto_awesome" size={20} fill={1} tone="primary" />
                : Array.from({ length: SPECIAL_CHARGE_TURNS }, (_, i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', boxSizing: 'border-box', border: '1.5px solid var(--sm2-ink)', backgroundColor: i < carga ? 'var(--sm2-ink)' : 'transparent' }} />
                ))}
            </span>
          )}
          hud={<TorcidaGauge taps={en ? battle.meter : taps} onCheer={en ? battle.cheer : torcer} isPt={isPt} full={en ? CHEER_TAPS_FULL : TORCIDA_TAPS_FULL} bare />}
        >
          {/* Gancho de estado (sem texto): em que passo do turno a luta está. */}
          <span hidden data-arena-fase={fase} />
        </BattleStage>
      </TorcidaLayer>
    );
  }

  return (
    <GameRoot>
      <TorcidaLayer onTap={torcer} active={emLuta && !ARENA_TIMING_ATTACK_ENABLED} isPt={isPt} style={{ flex: '1 0 auto' }}>
      <GameHeader
        run={emLuta}
        title={isPt ? 'Arena' : 'Arena'}
        sub={emLuta ? `${isPt ? 'Rodada' : 'Round'} ${rodada}/${ARENA_ROUNDS}` : undefined}
        closeLabel={sair}
        onClose={onExit}
        exitConfirm={emLuta ? {
          title: isPt ? 'Sair da Arena? Esta corrida se perde.' : 'Leave the Arena? This run will be lost.',
          stay: isPt ? 'Continuar' : 'Keep going',
          leave: sair,
        } : undefined}
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
          {/* A ficha em `.chip.tag` (D-J11): HP/DMG/Essence, valor em `ink`. */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <StatTag label={isPt ? 'Vida' : 'HP'} value={stats.hp} />
            <StatTag label={isPt ? 'Dano' : 'DMG'} value={stats.dmg} />
            <StatTag label={isPt ? 'Essência' : 'Essence'} value={elementLabel(atributos.principal, isPt)} />
          </div>

          {/* A ficha do jogador é o que torna a Arena DELE. Sem ela, o texto
              diz o porquê em vez de mostrar um par genérico sem explicação. */}
          {basica && especial ? (
            <>
              <p style={phaseLine}>
                <b style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{isPt ? basica.nome.pt : basica.nome.en}</b>
                {' · '}{isPt ? 'a cada turno' : 'every turn'}
              </p>
              <p style={phaseLine}>
                <b style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{isPt ? especial.nome.pt : especial.nome.en}</b>
                {' · '}{ARENA_ENERGY_ENABLED
                  ? (isPt ? 'com a energia cheia' : 'with full energy')
                  : isPt
                    ? `carrega em ${SPECIAL_CHARGE_TURNS} turnos`
                    : `charges in ${SPECIAL_CHARGE_TURNS} turns`}
              </p>
            </>
          ) : (
            <p style={phaseLine}>
              {isPt
                ? 'Sua ficha ainda não está neste aparelho, então você entra com um par genérico. Abra a página do seu Soulmon uma vez para lutar com as habilidades dele.'
                : "Your sheet is not on this device yet, so you go in with a generic pair. Open your Soulmon's page once to fight with its own skills."}
            </p>
          )}

          {!ARENA_TIMING_ATTACK_ENABLED && ARENA_ENERGY_ENABLED && (
            /* A explicação mora atrás do "?" (InfoTip) — nenhum texto explicativo solto (04/10/2026). */
            <div style={{ display: 'flex', justifyContent: 'center' }} data-arena-torcida-legenda>
              <InfoTip language={isPt ? 'pt-BR' : 'en-US'} label={isPt ? 'Como funciona o Duelo' : 'How the Duel works'}>
                {isPt
                  ? 'Seu Soulmon luta e se defende sozinho. Toque na tela (ou no mascote) para torcer: a barra de cheer enche devagar e despeja energia nele. Com a energia cheia, ele solta o especial — toque no anel na hora certa para render mais. Quando o inimigo soltar o dele, deslize o dedo para o lado para esquivar.'
                  : 'Your Soulmon fights and defends on its own. Tap the screen (or the mascot) to cheer: the cheer bar fills slowly and pours energy into it. With full energy it unleashes its special — tap the ring at the right moment to hit harder. When the enemy unleashes its own, swipe sideways to dodge.'}
              </InfoTip>
            </div>
          )}
          {!ARENA_TIMING_ATTACK_ENABLED && !ARENA_ENERGY_ENABLED && (
            <p style={phaseLine} data-arena-torcida-legenda>
              {isPt
                ? 'Seu Soulmon luta sozinho. Você torce tocando na tela: o gauge cheio vira um golpe da torcida. Ele também se defende sozinho.'
                : 'Your Soulmon fights on its own. You cheer by tapping the screen: a full gauge becomes a cheer strike. It also defends itself.'}
            </p>
          )}
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

      {emLuta && (
        <>
          <GameVisor height={80} scene={ARENA_SCENE.bg}>
            {inimigos.map((e, i) => {
              const caixa = caixaInimigo(i, inimigos.length);
              return e.hp > 0
                ? (
                  <VisorSprite key={i} src={sprites[i]} alt={nomeDe(e)} size={64} flip style={caixa} data-visor-enemy />
                )
                : <VisorFx key={i} icon="🏳️" size={64} style={caixa} data-visor-fx="defeat" />;
            })}
            <VisorSprite src={petSprite} alt="" style={{ left: 16, bottom: 8 }} data-visor-pet />
            {popup?.icon === '💥' && alvo && (
              <VisorFx icon="💥" size={64} style={caixaInimigo(inimigos.indexOf(alvo), inimigos.length)} data-visor-fx="hit" />
            )}
            {guardFx && <VisorFx icon="🛡️" style={{ left: 16, bottom: 8 }} data-visor-fx="guard" />}
          </GameVisor>

          {/* As barras FORA do vidro (D-J5): "You" ciano; o alvo da vez em
              `gold-fill` — o outro, nunca vermelho. Os demais inimigos vivos
              ficam na lista abaixo, com o HP em número. */}
          <HpBars
            bars={[
              { label: isPt ? 'Você' : 'You', cur: Math.max(0, hp), max: stats.hp, tone: 'cyan' },
              ...(fase === 'defender' && inimigos[defensor]
                ? [{ label: nomeDe(inimigos[defensor]), cur: Math.max(0, inimigos[defensor].hp), max: inimigos[defensor].maxHp, tone: 'gold' as const }]
                : alvo
                  ? [{ label: nomeDe(alvo), cur: Math.max(0, alvo.hp), max: alvo.maxHp, tone: 'gold' as const }]
                  : []),
            ]}
          />
          {inimigos.length > 1 && (
            <p className="sm2-num" style={phaseLine}>
              {inimigos.map((e, i) => (
                <span key={i}>
                  {i > 0 && ' · '}
                  {nomeDe(e)} {Math.max(0, e.hp)}/{e.maxHp}
                </span>
              ))}
            </p>
          )}

          {/* A linha de estado: "You · <auto_awesome> Special ready · enemies
              weakened" (X3/D-J9 — o ✨ da string virou glifo 20 FILL). */}
          <p className="sm2-num" style={{ ...phaseLine, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'center' }}>
            <span>
              <b style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{Math.max(0, hp)}/{stats.hp}</b>
              {' · '}
            </span>
            {especialPronto && <Icon name="auto_awesome" size={20} fill={1} tone="primary" />}
            <span>
              {especialPronto
                ? (isPt ? 'Especial pronto' : 'Special ready')
                : `${isPt ? 'Carga' : 'Charge'} ${carga}/${SPECIAL_CHARGE_TURNS}`}
              {enfraquecidos > 0 && (isPt ? ' · inimigos enfraquecidos' : ' · enemies weakened')}
              {eco > 0 && (isPt ? ' · eco ativo' : ' · echo active')}
            </span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
            {popup && <FxPopup icon={popup.icon} title={popup.title} detail={popup.detail} />}
            {fase === 'atacar' && alvo && !ARENA_TIMING_ATTACK_ENABLED && (
              <p style={phaseTitle} data-arena-auto-attack>
                {especialPronto
                  ? (isPt ? 'Especial carregado — torça por ele!' : 'Special charged — cheer for it!')
                  : (isPt ? 'Seu Soulmon ataca sozinho — torça!' : 'Your Soulmon strikes on its own — cheer!')}
              </p>
            )}
            {fase === 'atacar' && alvo && ARENA_TIMING_ATTACK_ENABLED && (
              <>
                <p style={phaseTitle}>
                  {especialPronto
                    ? (isPt ? 'Especial carregado — mire no centro!' : 'Special charged — aim for the center!')
                    : (isPt ? 'Seu turno — mire no centro!' : 'Your turn — aim for the center!')}
                </p>
                <TimingBar
                  key={`atk-${rodada}-${vivos.length}-${hp}-${carga}`}
                  speed={alvo.speed}
                  label={isPt ? 'Atacar!' : 'Attack!'}
                  ariaLabel={isPt
                    ? `Atacar ${nomeDe(alvo)}. Pare a barra no centro para acertar melhor.`
                    : `Attack ${nomeDe(alvo)}. Stop the bar in the center to hit harder.`}
                  onStop={atacar}
                />
              </>
            )}
            {fase === 'defender' && inimigos[defensor] && !TIMING_DODGE_ENABLED && (
              <p style={phaseTitle} data-auto-defense>
                {isPt
                  ? `${nomeDe(inimigos[defensor])} ataca — seu Soulmon se defende!`
                  : `${nomeDe(inimigos[defensor])} attacks — your Soulmon defends!`}
              </p>
            )}
            {fase === 'defender' && inimigos[defensor] && TIMING_DODGE_ENABLED && (
              <>
                <p style={phaseTitle}>
                  {isPt
                    ? `${nomeDe(inimigos[defensor])} ataca — desvie!`
                    : `${nomeDe(inimigos[defensor])} attacks — dodge!`}
                </p>
                <TimingBar
                  key={`def-${rodada}-${defensor}-${hp}`}
                  speed={inimigos[defensor].speed * 1.2}
                  label={isPt ? 'Desviar!' : 'Dodge!'}
                  ariaLabel={isPt
                    ? 'Desviar. Parar no centro esquiva sem tomar dano nenhum.'
                    : 'Dodge. Stopping in the center avoids all damage.'}
                  onStop={defender}
                />
              </>
            )}
          </div>

          {/* A torcida: toque em qualquer lugar enche o gauge; o botão é o caminho
              para quem não toca na tela (teclado, leitor de tela). */}
          {!ARENA_TIMING_ATTACK_ENABLED && (
            <TorcidaGauge taps={taps} onCheer={torcer} isPt={isPt} full={TORCIDA_TAPS_FULL} />
          )}
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

      {(fase === 'venceu' || fase === 'perdeu') && (
        <>
          {/* Vitória: a faísca no lugar do último inimigo; derrota: o pet
              inteiro — na MESMA tinta (D-J8). */}
          <GameVisor height={80} scene={ARENA_SCENE.bg}>
            <VisorSprite src={petSprite} alt="" style={{ left: 16, bottom: 8 }} data-visor-pet />
            {fase === 'venceu' && <VisorFx icon="✨" style={{ right: 16, top: 8 }} data-visor-fx="sparkle" />}
          </GameVisor>
          <p style={phaseTitle}>
            {fase === 'venceu'
              ? (isPt ? 'Arena vencida!' : 'Arena cleared!')
              : (isPt ? 'Você caiu' : 'You went down')}
          </p>
          <p className="sm2-num" style={phaseLine}>
            {fase === 'venceu'
              ? (isPt ? `As ${ARENA_ROUNDS} rodadas, na sequência. ${pontos} Bits.` : `All ${ARENA_ROUNDS} rounds, back to back. ${pontos} Bits.`)
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
