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
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelButton } from './pixel/PixelKit';
import { TimingBar } from './pixel/TimingBar';
import { Icon } from './ui/Icon';
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

interface Popup { icon: string; title: string; detail: string; color: string }

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
        color: '#facc15',
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
          detail: isPt ? 'Bem no centro' : 'Dead center', color: '#4ade80',
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
        icon: '🌀', title: isPt ? 'Esquiva!' : 'Dodge!',
        detail: isPt ? 'Sem dano nenhum' : 'No damage at all', color: '#60a5fa',
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

  return (
    /* ⚠️ `sm-px-arcade-root` NÃO é decoração: é `position: fixed; inset: 0` mais
       o respiro da barra de baixo, e é o que faz um minijogo TOMAR a tela. A
       primeira versão desta tela era inline, e o resultado (medido em 320×640)
       foi a Arena montar em `top: 705` — abaixo da dobra de 640. Quem tocasse
       no cartão via a lista de cartões e nada mais: o jogo existia 700px
       abaixo, sem nada rolar até ele. Masmorra, Dino e Pedra-Papel-Tesoura já
       usavam esta classe; só a Arena não, porque eu escrevi o contêiner do
       zero em vez de olhar as irmãs.

       `sm-px-dark-ctx` vem no mesmo par e pelo mesmo motivo que está escrito no
       `DungeonGame`: esta é peça escura nos dois temas, então ela declara o
       contexto — senão os tokens de estado leem o tema da PÁGINA e o texto
       some no tema claro. */
    <div
      className="sm-px-dark-ctx sm-px-arcade-root"
      style={{ background: '#07090f', color: '#e8eefc', position: 'fixed' }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <span className="sm-px-arcade-label">
          {isPt ? 'Arena' : 'Arena'}
          {emLuta && ` · ${isPt ? 'Rodada' : 'Round'} ${rodada}/${ARENA_ROUNDS}`}
        </span>
        <PixelButton size="sm" variant="default" onClick={onExit}>
          {isPt ? 'Sair' : 'Leave'}
        </PixelButton>
      </header>

      {popup && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div className="sm-px-card" role="status" style={{ textAlign: 'center', backgroundColor: '#0e1522', borderColor: popup.color, ['--sm-cham-line' as string]: popup.color, padding: '16px 26px' }}>
            <div style={{ fontSize: '1.7rem', lineHeight: 1.2 }} aria-hidden="true">{popup.icon}</div>
            <p className="sm-px-arcade-value" style={{ fontSize: '1rem', color: popup.color, margin: '4px 0 2px' }}>{popup.title}</p>
            <p style={{ fontSize: '0.82rem', color: '#c6d4f2' }}>{popup.detail}</p>
          </div>
        </div>
      )}

      {fase === 'carregando' && (
        <p style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#9fb2d8', fontSize: '0.85rem' }}>
          {isPt ? 'Chamando os desafiantes…' : 'Calling the challengers…'}
        </p>
      )}

      {/* ESTADO DE ERRO, e não tela branca. O pool do bestiário é um import
          dinâmico; falhar nele é plausível (rede, cache frio) e o jogador
          precisa saber que não foi ele. */}
      {fase === 'sem-motor' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <Icon name="military_tech" size={32} />
          <p style={{ fontSize: '0.85rem', color: '#c6d4f2', maxWidth: 320 }}>
            {isPt
              ? 'Não consegui carregar os desafiantes agora. Isso costuma ser conexão — tente de novo daqui a pouco.'
              : "I could not load the challengers right now. This is usually the connection — try again in a bit."}
          </p>
          <span style={{ width: '100%', maxWidth: 300 }}>
            <PixelButton size="lg" variant="primary" onClick={onExit}>
              {isPt ? 'Voltar' : 'Go back'}
            </PixelButton>
          </span>
        </div>
      )}

      {fase === 'intro' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <Icon name="military_tech" size={32} />
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="sm-px-arcade-label">
              {isPt ? 'Vida' : 'HP'} <b className="sm-px-arcade-value" style={{ color: '#4ade80' }}>{stats.hp}</b>
            </span>
            <span className="sm-px-arcade-label">
              {isPt ? 'Dano' : 'DMG'} <b className="sm-px-arcade-value" style={{ color: '#facc15' }}>{stats.dmg}</b>
            </span>
            <span className="sm-px-arcade-label">
              {isPt ? 'Essência' : 'Essence'}{' '}
              <b className="sm-px-arcade-value" style={{ color: 'var(--sm-px-cyan)' }}>
                {elementLabel(atributos.principal, isPt)}
              </b>
            </span>
          </div>

          {/* A ficha do jogador é o que torna a Arena DELE. Sem ela, o texto
              diz o porquê em vez de mostrar um par genérico sem explicação. */}
          {basica && especial ? (
            <div className="sm-px-card" style={{ padding: '10px 14px', maxWidth: 340, textAlign: 'left' }}>
              <p style={{ fontSize: '0.78rem', color: '#c6d4f2', margin: 0 }}>
                <b style={{ color: '#4ade80' }}>{isPt ? basica.nome.pt : basica.nome.en}</b>
                {' · '}{isPt ? 'a cada turno' : 'every turn'}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#c6d4f2', margin: '6px 0 0' }}>
                <b style={{ color: '#facc15' }}>{isPt ? especial.nome.pt : especial.nome.en}</b>
                {' · '}{isPt
                  ? `carrega em ${SPECIAL_CHARGE_TURNS} turnos`
                  : `charges in ${SPECIAL_CHARGE_TURNS} turns`}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#9fb2d8', maxWidth: 330 }}>
              {isPt
                ? 'Sua ficha ainda não está neste aparelho, então você entra com um par genérico. Abra a página do seu Soulmon uma vez para lutar com as habilidades dele.'
                : "Your sheet is not on this device yet, so you go in with a generic pair. Open your Soulmon's page once to fight with its own skills."}
            </p>
          )}

          <p style={{ fontSize: '0.8rem', color: '#9fb2d8', maxWidth: 330 }}>
            {isPt
              ? `${ARENA_ROUNDS} rodadas seguidas, cada uma mais dura. Seu elemento decide quem você machuca mais e quem te machuca. Entre as rodadas você recupera um pouco. Perder custa a run — nunca os seus corações.`
              : `${ARENA_ROUNDS} rounds back to back, each harder. Your element decides who you hurt more and who hurts you. You recover a little between rounds. Losing costs you the run — never your hearts.`}
          </p>
          <span style={{ width: '100%', maxWidth: 320 }}>
            <PixelButton size="lg" variant="primary" onClick={comecar}>
              {isPt ? 'Entrar na Arena' : 'Enter the Arena'}
            </PixelButton>
          </span>
        </div>
      )}

      {emLuta && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', padding: '4px 12px' }}>
            {inimigos.map((e, i) => (
              <div
                key={i}
                style={{ opacity: e.hp > 0 ? 1 : 0.28, textAlign: 'center', minWidth: 86 }}
              >
                <img
                  src={sprites[i]}
                  alt=""
                  width={56}
                  height={56}
                  style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
                />
                <p className="sm-px-arcade-label" style={{ fontSize: '0.62rem', margin: '2px 0 0' }}>
                  {nomeDe(e)}
                </p>
                <p style={{ fontSize: '0.66rem', color: e.hp > 0 ? '#4ade80' : '#7c8db3', margin: 0 }}>
                  {Math.max(0, e.hp)}/{e.maxHp}
                  {i === defensor && fase === 'defender' && ' ⚔'}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '6px 12px' }}>
            <img
              src={getSpriteForStage(evolutionStage, demoCharacterId)}
              alt=""
              width={56}
              height={56}
              style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
            />
            <div>
              <p className="sm-px-arcade-label" style={{ margin: 0 }}>
                {isPt ? 'Você' : 'You'}{' '}
                <b className="sm-px-arcade-value" style={{ color: hp > stats.hp * 0.3 ? '#4ade80' : '#f87171' }}>
                  {Math.max(0, hp)}/{stats.hp}
                </b>
              </p>
              <p className="sm-px-arcade-label" style={{ margin: '2px 0 0', fontSize: '0.68rem' }}>
                {carga >= SPECIAL_CHARGE_TURNS
                  ? (isPt ? '✨ Especial pronto' : '✨ Special ready')
                  : `${isPt ? 'Carga' : 'Charge'} ${carga}/${SPECIAL_CHARGE_TURNS}`}
                {enfraquecidos > 0 && (isPt ? ' · inimigos enfraquecidos' : ' · enemies weakened')}
                {eco > 0 && (isPt ? ' · eco ativo' : ' · echo active')}
              </p>
            </div>
          </div>

          <div style={{ padding: 16, minHeight: 150 }}>
            {fase === 'atacar' && alvo && (
              <div>
                <p className="sm-px-arcade-label" style={{ textAlign: 'center', marginBottom: 6 }}>
                  {carga >= SPECIAL_CHARGE_TURNS
                    ? (isPt ? 'Especial carregado — mire no centro!' : 'Special charged — aim for the center!')
                    : (isPt ? 'Seu turno — mire no centro!' : 'Your turn — aim for the center!')}
                </p>
                <TimingBar
                  key={`atk-${rodada}-${vivos.length}-${hp}-${carga}`}
                  speed={alvo.speed}
                  color={carga >= SPECIAL_CHARGE_TURNS ? '#facc15' : '#4ade80'}
                  label={isPt ? 'Atacar!' : 'Attack!'}
                  ariaLabel={isPt
                    ? `Atacar ${nomeDe(alvo)}. Pare a barra no centro para acertar melhor.`
                    : `Attack ${nomeDe(alvo)}. Stop the bar in the center to hit harder.`}
                  onStop={atacar}
                />
              </div>
            )}
            {fase === 'defender' && inimigos[defensor] && (
              <div>
                <p className="sm-px-arcade-label" style={{ textAlign: 'center', marginBottom: 6 }}>
                  {isPt
                    ? `${nomeDe(inimigos[defensor])} ataca — desvie!`
                    : `${nomeDe(inimigos[defensor])} attacks — dodge!`}
                </p>
                <TimingBar
                  key={`def-${rodada}-${defensor}-${hp}`}
                  speed={inimigos[defensor].speed * 1.2}
                  color="#60a5fa"
                  label={isPt ? 'Desviar!' : 'Dodge!'}
                  ariaLabel={isPt
                    ? 'Desviar. Parar no centro esquiva sem tomar dano nenhum.'
                    : 'Dodge. Stopping in the center avoids all damage.'}
                  onStop={defender}
                />
              </div>
            )}
          </div>
        </>
      )}

      {fase === 'rodada-limpa' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <p className="sm-px-arcade-value" style={{ fontSize: '1.1rem', color: '#4ade80' }}>
            {isPt ? `Rodada ${rodada} vencida` : `Round ${rodada} cleared`}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#9fb2d8' }}>
            {isPt
              ? `Você recuperou um pouco de vida. Total: ${pontos} Bits.`
              : `You recovered some health. Total: ${pontos} Bits.`}
          </p>
          <span style={{ width: '100%', maxWidth: 320 }}>
            <PixelButton size="lg" variant="primary" onClick={proximaRodada}>
              {rodada >= ARENA_ROUNDS
                ? (isPt ? 'Terminar' : 'Finish')
                : (isPt ? 'Próxima rodada' : 'Next round')}
            </PixelButton>
          </span>
        </div>
      )}

      {(fase === 'venceu' || fase === 'perdeu') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <p className="sm-px-arcade-value" style={{ fontSize: '1.2rem', color: fase === 'venceu' ? '#facc15' : '#f87171' }}>
            {fase === 'venceu'
              ? (isPt ? 'Arena vencida!' : 'Arena cleared!')
              : (isPt ? 'Você caiu' : 'You went down')}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#c6d4f2', maxWidth: 320 }}>
            {fase === 'venceu'
              ? (isPt ? `As ${ARENA_ROUNDS} rodadas, na sequência. ${pontos} Bits.` : `All ${ARENA_ROUNDS} rounds, back to back. ${pontos} Bits.`)
              : (isPt
                ? `Chegou até a rodada ${rodada}. Não custou nenhum coração — só a run.`
                : `You got to round ${rodada}. It cost no hearts — only the run.`)}
          </p>
          <span style={{ width: '100%', maxWidth: 320 }}>
            <PixelButton size="lg" variant="primary" onClick={comecar}>
              {isPt ? 'Tentar de novo' : 'Try again'}
            </PixelButton>
          </span>
          <span style={{ width: '100%', maxWidth: 320 }}>
            <PixelButton size="md" variant="default" onClick={onExit}>
              {isPt ? 'Sair' : 'Leave'}
            </PixelButton>
          </span>
        </div>
      )}
    </div>
  );
}
