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
 * A ÚNICA diferença permitida é a origem da precisão: lá vem de `sampleAcc()`,
 * aqui vem da `TimingBar`.
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
import { Icon } from './ui/Icon';
import { sm2Button, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, VisorFx, HpBars, FxPopup, StatTag, phaseTitle, phaseLine } from './games/GameKit';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import { getDungeonEnemySprite, getSpriteForStage } from '../utils/sprites';
import {
  ARENA_ROUNDS,
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

  const par = skills?.[stage];
  const basica = par?.basica;
  const especial = par?.especial;
  const atributos = attrs ?? DEFAULT_ARENA_ATTRIBUTES;
  const efeito = SPECIAL_EFFECTS[especial?.escolaId ?? 'combate_fisico'];
  const stats = useMemo(
    () => getArenaPlayerStats(stage, basica?.escolaId ?? 'combate_fisico'),
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
    const novos = buildArenaRound(n, 1, Math.random, poolAtual);
    setInimigos(novos);
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

    // 2) Especial quando carregado, básica quando não.
    const usouEspecial = carga >= SPECIAL_CHARGE_TURNS;
    if (usouEspecial) {
      const alvosDoEspecial = efeito.targets === 'all'
        ? vivosDe()
        : vivosDe().slice(0, efeito.targets);
      for (const t of alvosDoEspecial) {
        t.hp -= playerHitDamage(
          stats.dmg, acc,
          elementMultiplier(especial?.elementoId ?? 'vigor', t.elements),
          efeito.mult,
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
        detail: isPt ? 'A habilidade especial disparou' : 'Special skill unleashed',
      });
    } else {
      const t = vivosDe()[0];
      if (t) {
        t.hp -= playerHitDamage(
          stats.dmg, acc,
          elementMultiplier(basica?.elementoId ?? 'vigor', t.elements),
        );
      }
      setCarga(c => c + 1);
      if (acc >= PERFECT_ACC) {
        mostrarPopup({
          icon: '💥', title: isPt ? 'Crítico!' : 'Critical!',
          detail: isPt ? 'Bem no centro' : 'Dead center',
        }, 800);
      }
    }

    setInimigos(copia);
    if (!copia.some(e => e.hp > 0)) { limparRodada(); return; }
    abrirDefesa(copia);
  }, [alvo, inimigos, eco, carga, efeito, stats, especial, basica, isPt,
      mostrarPopup, limparRodada, abrirDefesa]);

  /** PASSO 3: um inimigo revida. Defesa perfeita esquiva limpo. */
  const defender = useCallback((defAcc: number) => {
    const e = inimigos[defensor];
    if (!e) return;
    let hpDepois = hp;
    if (defAcc >= PERFECT_ACC) {
      mostrarPopup({
        icon: '🛡️', title: isPt ? 'Esquiva!' : 'Dodge!',
        detail: isPt ? 'Sem dano nenhum' : 'No damage at all',
      }, 800);
    } else {
      const dano = enemyHitDamage(e.atk, defAcc, e.elements[0], atributos, enfraquecidos > 0);
      hpDepois = hp - dano;
      setHp(hpDepois);
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
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId);

  /* A luta no VIDRO (D-J3/D-J4): o pet a 128 embaixo à esquerda; os inimigos
     da rodada (1–3) a 64 (0,25×) empilhados à direita, espelhados de frente
     para o pet; o que caiu vira `fx-defeat` a 64 na própria caixa — a derrota
     é do outro, e é pixel no vidro. O golpe é `fx-hit` sobre quem apanhou. */
  const caixaInimigo = (i: number, n: number): React.CSSProperties => {
    const passo = n <= 1 ? 0 : n === 2 ? 72 : 48;
    const topo = n <= 1 ? 48 : n === 2 ? 12 : 8;
    return { right: 16, top: topo + i * passo };
  };

  return (
    <GameRoot>
      <GameHeader
        run={emLuta}
        title={isPt ? 'Arena' : 'Arena'}
        sub={emLuta ? `${isPt ? 'Rodada' : 'Round'} ${rodada}/${ARENA_ROUNDS}` : undefined}
        closeLabel={sair}
        onClose={onExit}
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
          <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), width: '100%', maxWidth: 200, alignSelf: 'center' }}>
            {isPt ? 'Voltar' : 'Go back'}
          </button>
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
          <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), width: '100%', maxWidth: 200 }}>
            {isPt ? 'Voltar' : 'Go back'}
          </button>
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
                {' · '}{isPt
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
            {fase === 'atacar' && alvo && (
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
            {fase === 'defender' && inimigos[defensor] && (
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
    </GameRoot>
  );
}
