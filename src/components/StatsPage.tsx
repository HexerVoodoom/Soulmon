/**
 * ESTATÍSTICAS — a tela que deixou de ser uma parede de números.
 * ==============================================================
 *
 * A lição do Pokémon Sleep aplicada literalmente: ele não mostra o hipnograma,
 * mostra TRÊS PALAVRAS. Esta tela fazia o contrário — 13 números simultâneos
 * (XP, Bits, 3 atributos, 5 contadores de jornada, e depois três tabelas de
 * contagem), e a pergunta "o usuário DECIDE alguma coisa com este número?"
 * respondia "não" em quase todos.
 *
 * O que ficou, e por quê:
 *
 *  · **Vínculo** (`utils/bond.ts`; nunca "nível", NARRATIVA §12) é a ÚNICA leitura grande. Ele é o
 *    dono legítimo do `totalXP`, que antes aparecia cru aqui e não governava
 *    nada (a evolução é por `perfectDays`). Um número solto sem dono é ruído;
 *    ligado ao Vínculo ele vira uma PALAVRA — o título ("Companheiro") — com
 *    um medidor embaixo. Só a LEITURA foi ligada: nenhuma regra nova, nenhum
 *    campo novo no save, e nada disto entra na home (a home tem orçamento
 *    próprio de leituras — PLANO-DESIGN §5.1).
 *  · **Traço de nascimento e ritmo de cuidado**: já eram palavras. Ficaram,
 *    com um ícone Material 24 pelado por traço/ritmo (canvas §27, D-S2).
 *  · **Dias completos**: o único contador que governa alguma coisa (evolução).
 *    Fica, com `tabular-nums`, e é o ÚNICO número grande da tela.
 *  · **A jornada** (kills, runs, recorde do Dino, itens raros): virou FRASE.
 *    Ninguém decide nada com "Runs concluídas: 3" numa grade de cinco caixas;
 *    dentro de uma sentença os mesmos fatos leem como memória, que é o que
 *    eles são.
 *  · **Atributos (Poder/Harmonia/Benevolência)**: SAÍRAM. A casa deles é a
 *    página de Evolução, onde a pessoa está justamente decidindo o galho.
 *  · **As três tabelas de contagem** viraram DUAS listas: o que você mais
 *    repete (top 5) e as últimas conclusões. Atividade e tarefa eram duas
 *    tabelas com o mesmo desenho, uma embaixo da outra.
 *
 * Canvas Estatísticas (§27, identidade): cards SIS-03 (`.sm2-stats-card`) com
 * cabeçalho ícone 24 `muted` + Cinzel 16 (D-S3); o vínculo é a PALAVRA em
 * Cinzel 24 com "Bond N" 12 `muted` e o `.meter` SIS-07 (D-S1); o cartão de
 * nascimento é o visor do reveal (D-S4); encontros e álbum em mini-visores 64²
 * com silhueta por `mask-image` (D-S5/6/7); a estação é calendário, com as
 * medalhas em `gold-ink` (D-S8); o emoji das listas é conteúdo, 20px pelado
 * (D-S9); nenhuma Silkscreen (D-S10); só o dígito no "0" (D-S11).
 *
 * **`hideMetrics` (Janela de Descanso)** chega aqui e esconde os NÚMEROS —
 * "12", "N days together", "Bond N", o `progressbar`, "7 of 36", "2/11", as
 * frações da estação, "done N×", a frase dos feitos — e **preserva as
 * recompensas**: a palavra do vínculo, o cartão de nascimento, as artes
 * vistas e vividas, as medalhas e as listas sem contagem.
 */
import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { ActivityCategory } from '../types/attributes';
import { useTranslation, Language } from '../utils/i18n';
import { getPassive } from '../utils/passives';
import { PixelIcon } from './ui/PixelIcon';
import { PASSIVE_ICON_ART } from '../assets/soulmon/icones-ui/interacao';
import { BirthCard } from './BirthCard';
import type { CarePattern } from '../utils/carePattern';
import {
  seasonProgress, seasonLabel, seasonMedalStatus,
  type SeasonProgressState, type SeasonCounters,
} from '../utils/seasons';
import type { RestState } from '../utils/restWindow';
import { bondProgress, bondTitle } from '../utils/bond';
import { Icon } from './ui/Icon';
/* Combate v3 / PR7: a árvore de talentos (e a arte dela) só carrega quando a Estatística monta. */
const TalentTreeCard = lazy(() => import('./TalentTreeCard'));
import { InfoTip, InfoTipSection } from './ui/InfoTip';

interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
}

interface ActivityStats {
  [key: string]: {
    name: string;
    emoji: string;
    category: ActivityCategory;
    completionCount: number;
  };
}

export interface StatsPageProps {
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  language?: Language;
  /** Bits. Mora na Loja, onde é acionável — não é leitura desta tela. */
  gamePoints?: number;
  /** Combustível do **Nível de Vínculo** (`utils/bond.ts`). Nunca exibido cru. */
  totalXP?: number;
  streakDays?: number;
  /** "Lv N" do Soulmon (combate v3, `utils/soulXP.ts`). Derivado e já em texto neutro; nunca persistido. */
  soulLevelText?: string;
  /** Insumo do galho de evolução: a casa deles é a página de Evolução. */
  powerPoints?: number;
  harmonyPoints?: number;
  benevolencePoints?: number;
  /** Traço de nascimento do pet (utils/passives.ts). */
  petPassive?: string;
  /** Ritmo de cuidado lido do histórico (utils/carePattern.ts). */
  carePattern?: CarePattern | null;
  /** Vitrine da jornada: o que este Soulmon já viveu. */
  journey?: {
    unlockedEvolutions?: string[];
    soulmonStages?: Array<{ name: string; stage: string; branch?: string }>;
    totalPerfectDays?: number;
    dungeonKills?: number;
    dungeonRunsCompleted?: number;
    dinoBest?: number;
    droppedItems?: string[];
    soulGoal?: string;
  };
  /** Dias desde o nascimento da criatura (`utils/anniversary.ts`). `null` em
   *  save sem `bornAt` — e aí a linha simplesmente não aparece. */
  daysTogether?: number | null;
  /** WP1.6 — o cartão de nascimento. Ausente para save antigo (sem `bornAt`
   *  nem sprite próprio) — e aí a seção simplesmente não existe. */
  birth?: {
    spriteUrl?: string | null;
    name: string;
    epithet?: string | null;
    soulGoal?: string | null;
    bornAt?: string | null;
  } | null;
  /** Estado da estação (`utils/seasons.ts`) + contadores para os três caminhos. */
  season?: {
    state?: SeasonProgressState;
    counters: SeasonCounters;
    rest?: RestState;
  };
  /** Janela de Descanso (`rest.hideMetrics`): esconde números, preserva recompensas. */
  hideMetrics?: boolean;
}

/**
 * Emoji marcando SEÇÃO é ícone de sistema disfarçado (PLANO-DESIGN §4.11).
 * O traço e o ritmo são conceitos do app, não escolha da pessoa — viram glifo
 * da Material Symbols. Mapa D-S2 do canvas (X2: Sortudo é `star`, nunca
 * `casino` — que é a aba "Games" na nav da mesma tela). Todo nome abaixo está
 * no inventário de `tokens.md`; nome fora dele renderiza VAZIO e não dá erro.
 */
const PASSIVE_ICON: Record<string, string> = {
  guloso: 'restaurant',
  carinhoso: 'volunteer_activism',
  teimoso: 'pan_tool',
  sortudo: 'star',
  madrugador: 'wb_sunny',
};
/** `event_repeat` também abre "What you repeat most" — dois papéis na mesma
 *  tela, de propósito: os dois dizem "repetição" (R3 da crítica). */
const PATTERN_ICON: Record<string, string> = {
  constante: 'event_repeat',
  explosivo: 'bolt',
  equilibrado: 'spa',
};

/** Cabeçalho de card (D-S3): ícone 24 `muted` pelado + Cinzel 16 — a mesma
 *  peça do painel de rituais da Home. */
function CardHead({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="sm2-stats-ch">
      <Icon name={icon} size={24} tone="muted" />
      <h3 className="sm2-stats-h3">{children}</h3>
    </div>
  );
}

export function StatsPage({
  completedTasks,
  activityStats,
  language = 'en-US',
  totalXP = 0,
  streakDays = 0,
  soulLevelText,
  petPassive,
  carePattern,
  journey,
  daysTogether,
  birth,
  season,
  hideMetrics = false,
}: StatsPageProps) {
  const passive = getPassive(petPassive);
  const t = useTranslation(language);
  const isPt = language === 'pt-BR';

  /**
   * O antigo "top de atividades" e "top de tarefas" eram a MESMA tabela
   * desenhada duas vezes; a distinção `activity-`/`task-` é um detalhe de
   * chave interna, e ninguém age sobre ela. Uma lista só, os 5 mais repetidos.
   */
  const topRepeated = useMemo(
    () => Object.entries(activityStats)
      .filter(([, s]) => s.completionCount > 0)
      .sort((a, b) => b[1].completionCount - a[1].completionCount)
      .slice(0, 5),
    [activityStats],
  );

  const recent = useMemo(
    () => completedTasks.slice(-10).reverse(),
    [completedTasks],
  );

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.evolution.just_now;
    if (diffMins < 60) return `${diffMins}${t.evolution.mins_ago}`;
    if (diffHours < 24) return `${diffHours}${t.evolution.hours_ago}`;
    if (diffDays === 1) return t.evolution.yesterday;
    if (diffDays < 7) return `${diffDays}${t.evolution.days_ago}`;
    return date.toLocaleDateString(language, { day: '2-digit', month: 'short' });
  };

  // ── Vínculo: a única leitura grande da tela. Derivado, nunca persistido. ──
  const bond = bondProgress(totalXP);
  const title = bondTitle(bond.level, language);
  const pct = Math.round(bond.ratio * 100);

  // ── A jornada em FRASE. Só entra o que realmente aconteceu: uma sentença
  //    que enumera zeros é uma sentença que cobra. ──
  const feitos: string[] = [];
  if ((journey?.dungeonRunsCompleted ?? 0) > 0) {
    const n = journey!.dungeonRunsCompleted!;
    feitos.push(isPt ? `limparam ${n} run(s) da masmorra` : `cleared ${n} dungeon run(s)`);
  }
  if ((journey?.dungeonKills ?? 0) > 0) {
    const n = journey!.dungeonKills!;
    feitos.push(isPt ? `enfrentaram ${n} inimigos` : `faced ${n} enemies`);
  }
  if ((journey?.droppedItems?.length ?? 0) > 0) {
    const n = journey!.droppedItems!.length;
    feitos.push(isPt ? `acharam ${n} item(ns) raro(s)` : `found ${n} rare item(s)`);
  }
  if ((journey?.dinoBest ?? 0) > 0) {
    const n = journey!.dinoBest!;
    feitos.push(isPt ? `e marcaram ${n} na Corrida` : `and scored ${n} on the Obstacle Run`);
  }

  /** Traço/ritmo (D-S2): ícone Material 24 pelado em `primary-ink` + nome 14/500 + frase 14. */
  /* 04/10/2026 (decisão do dono): a passiva com arte própria (`PASSIVE_ICON_ART`, pixel) usa a arte;
     o glifo Material fica para o ritmo e para passiva sem arte. */
  const traitRow = (iconName: string, name: string, desc: string, art?: string) => (
    <p key={name} className="sm2-stats-trait">
      {art ? <PixelIcon src={art} size={24} /> : <Icon name={iconName} size={24} tone="primary" />}
      <span className="sm2-stats-t" style={{ minWidth: 0 }}>
        <b style={{ fontWeight: 500 }}>{name}</b>
        {' — '}
        {desc}
      </span>
    </p>
  );

  return (
    <div className="sm2-stats" data-hide-metrics={hideMetrics ? 'true' : undefined}>

      {/* ─────────────── A leitura dominante: o Vínculo ─────────────── */}
      <section className="sm2-stats-card" style={{ gap: 4 }} aria-labelledby="sm2-bond-title">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p className="sm2-stats-lab">{isPt ? 'Vínculo' : 'Bond'}</p>
          {/* I13 (02/10/2026): a frase de regra do vínculo mora atrás do "?". */}
          <InfoTip language={language} label={isPt ? 'Como funcionam as estatísticas' : 'How the stats work'} align="right" style={{ minHeight: 24 }}>
            <InfoTipSection title={isPt ? 'Vínculo' : 'Bond'}>
              {isPt
                ? 'Ele só sobe. Cuidar de você é o que aproxima vocês dois — nada aqui desce, nunca.'
                : 'It only goes up. Caring for yourself is what brings you two closer — nothing here ever drops.'}
            </InfoTipSection>
            <InfoTipSection title={isPt ? 'Estação' : 'Season'} last>
              {isPt
                ? 'Um caminho basta — nunca os três.'
                : 'One path is enough — never all three.'}
            </InfoTipSection>
          </InfoTip>
        </div>
        {/* A PALAVRA vem primeiro (Cinzel 24); o número é a legenda dela. */}
        <h2 id="sm2-bond-title" className="sm2-stats-word">
          {title ?? (isPt ? 'Recém-chegados' : 'Just met')}
        </h2>
        {!hideMetrics && (
          <p className="sm2-stats-s sm2-num">
            {isPt ? `Vínculo ${bond.level}` : `Bond ${bond.level}`}
          </p>
        )}

        {/* O medidor SIS-07 do PRÓXIMO nível (no vazio fica a 0 %: é medidor,
            não coleção). Com o descanso ligado ele SOME — o `aria-valuenow`
            é número. */}
        {!hideMetrics && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={isPt ? 'Progresso até o próximo nível de vínculo' : 'Progress to the next bond level'}
            className="sm2-kit-meter"
            style={{ marginTop: 8 }}
          >
            <div className="sm2-kit-meter-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </section>

      {/* ─────────────── Talentos do Vínculo (PR7) ─────────────── */}
      {!hideMetrics && (
        <Suspense fallback={null}>
          <TalentTreeCard language={language} />
        </Suspense>
      )}

      {/* Equipamento (PR8b): mudou para o Soulsmith, no Mercado (07/10/2026) — `AreaView`, lote `ferreiro`. */}

      {/* ─────────────── Quem ele é ─────────────── */}
      {(passive || carePattern) && (
        <section className="sm2-stats-card">
          <CardHead icon="psychology">{isPt ? 'Quem é o seu Soulmon' : 'Who they are'}</CardHead>
          {passive && traitRow(
            PASSIVE_ICON[passive.id] ?? 'auto_awesome',
            isPt ? passive.namePt : passive.nameEn,
            isPt ? passive.descPt : passive.descEn,
            PASSIVE_ICON_ART[passive.id],
          )}
          {carePattern && traitRow(
            PATTERN_ICON[carePattern.id] ?? 'auto_awesome',
            `${isPt ? 'Ritmo: ' : 'Rhythm: '}${isPt ? carePattern.namePt : carePattern.nameEn}`,
            isPt ? carePattern.descPt : carePattern.descEn,
          )}
        </section>
      )}

      {/* ─────────────── A jornada: UM cartão contínuo ─────────────── */}
      <section className="sm2-stats-card">
        <CardHead icon="auto_awesome">{isPt ? 'A jornada' : 'The journey'}</CardHead>

        {/* O ÚNICO contador que governa alguma coisa: dias completos alimentam
            a evolução (`perfectDays`). Por isso ele é número, e sozinho —
            só o dígito, mesmo no "0" (D-S11). Some com o descanso. */}
        {!hideMetrics && (
          <div className="sm2-stats-count">
            <span className="sm2-stats-word sm2-num">{streakDays}</span>
            <span className="sm2-stats-s">{isPt ? 'dias completos até aqui' : 'complete days so far'}</span>
          </div>
        )}

        {/* Combate v3 — o Lv do Soulmon. Sobe e desce com os dias completos (derivado);
            o texto quando desce já vem neutro de `soulLevelLine`. Obedece `hideMetrics`. */}
        {!hideMetrics && soulLevelText && (
          <p className="sm2-stats-s sm2-num" data-testid="soul-level">{soulLevelText}</p>
        )}

        {/* WP2.11 — "dias juntos". Admissível como número exibido porque só
            CRESCE (C.3 #2); é o número que responde "estou com ele há quanto
            tempo?". Obedece `hideMetrics`. */}
        {!hideMetrics && typeof daysTogether === 'number' && (
          <p className="sm2-stats-s sm2-num">
            {isPt ? `${daysTogether} dias juntos` : `${daysTogether} days together`}
          </p>
        )}

        {/* WP1.6 — o CARTÃO DE NASCIMENTO, a mesma peça do reveal (D-S4).
            Sem número por dentro — a contagem de dias fica na linha acima. */}
        {birth && (
          <BirthCard
            spriteUrl={birth.spriteUrl}
            name={birth.name}
            epithet={birth.epithet}
            soulGoal={birth.soulGoal}
            bornAt={birth.bornAt}
            language={language}
            bare
          />
        )}

        {/* ⚰️ 07/10/2026 (dono): "Encounters" (bestiário) e "Forms lived" (álbum) saíram do
            Santuário do Vínculo. `bestiary`/`formReachedAt` seguem no save (masmorra e
            cerimônia de evolução); `BestiaryCard`/`FormAlbum` foram apagados. */}

        {!hideMetrics && feitos.length > 0 && (
          <p className="sm2-stats-s sm2-num">
            {isPt ? 'Vocês também ' : 'You two also '}{feitos.join(', ')}.
          </p>
        )}

        {journey?.soulGoal && (
          <p className="sm2-stats-s" style={{ fontStyle: 'italic' }}>
            {isPt ? 'Começou por: ' : 'Started for: '}“{journey.soulGoal}”
          </p>
        )}
      </section>

      {/* ─────────────── A estação ───────────────

          WP4.16 — `seasons.ts` estava escrito, testado e SEM CONSUMIDOR. A
          estação é um CALENDÁRIO ("tem mais coisa agora"), nunca um prazo
          ("corre"): nada de "faltam N dias", nada de contagem regressiva
          (regra 1 do cabeçalho de `seasons.ts`). Caminho com progresso ZERO
          não vira `0/20`: um placar de zeros é a fatura que este produto não
          emite. As medalhas são posse guardada — `military_tech` em `gold-ink`
          (D-S8), a única cor de acento além do ciano nesta tela. */}
      {season && (() => {
        const win = seasonProgress();
        const status = seasonMedalStatus(season.state, season.counters, season.rest);
        const andados = status.paths.filter(p => p.current >= 1);
        const medalhas = (season.state?.earnedMedals?.length ?? 0) + (status.earned && !season.state?.medalEarned ? 1 : 0);
        const temMedalha = status.earned || (status.season && (season.state?.earnedMedals?.length ?? 0) > 0);
        return (
          <section className="sm2-stats-card">
            <CardHead icon="calendar_month">{isPt ? 'A estação' : 'The season'}</CardHead>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p className="sm2-stats-t">{seasonLabel(win, isPt ? 'pt-BR' : 'en-US')}</p>
            </div>

            {!hideMetrics && andados.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {andados.map(p => (
                  <p key={p.id} className="sm2-stats-s sm2-stats-path sm2-num">
                    <span>{isPt ? p.labelPt : p.labelEn}</span>
                    <b>{Math.min(p.current, p.target)}/{p.target}</b>
                  </p>
                ))}
              </div>
            )}

            {temMedalha && (
              <p className="sm2-stats-t sm2-stats-medals sm2-num">
                <Icon name="military_tech" size={20} fill={1} tone="gold" />
                <span>
                  {isPt ? 'Medalhas guardadas: ' : 'Medals kept: '}
                  {medalhas}
                  {isPt ? ' — para sempre.' : ' — forever.'}
                </span>
              </p>
            )}
          </section>
        );
      })()}

      {/* ─────────────── O que você mais repete ─────────────── */}
      <section className="sm2-stats-card">
        <CardHead icon="event_repeat">{isPt ? 'O que você mais repete' : 'What you repeat most'}</CardHead>
        {topRepeated.length === 0 ? (
          <p className="sm2-stats-s">
            {isPt
              ? 'Nada concluído ainda. A primeira vez já aparece aqui.'
              : 'Nothing finished yet. The very first one shows up here.'}
          </p>
        ) : (
          <ul className="sm2-stats-lst">
            {topRepeated.map(([key, stat]) => (
              <li key={key}>
                {/* O emoji da atividade é CONTEÚDO — escolha da pessoa, não
                    ícone de sistema: 20px pelado numa coluna de 24, nunca em
                    caixa (D-S9). */}
                <span className="em" aria-hidden="true">{stat.emoji}</span>
                <span className="t" title={stat.name}>{stat.name}</span>
                {!hideMetrics && (
                  <span className="s sm2-num">
                    {isPt ? `${stat.completionCount}× feita` : `done ${stat.completionCount}×`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─────────────── Últimas conclusões ─────────────── */}
      <section className="sm2-stats-card">
        <CardHead icon="task_alt">{isPt ? 'Últimas conclusões' : 'Latest completions'}</CardHead>
        {recent.length === 0 ? (
          <p className="sm2-stats-s">
            {isPt ? 'O histórico começa na sua próxima conclusão.' : 'History starts at your next completion.'}
          </p>
        ) : (
          <ul className="sm2-stats-lst">
            {recent.map(task => (
              <li key={task.id}>
                <span className="em" aria-hidden="true">{task.emoji}</span>
                <span className="t" title={task.name}>{task.name}</span>
                <span className="s sm2-num">{formatDate(task.completedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
