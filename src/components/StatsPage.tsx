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
 *  · **Nível de Vínculo** (`utils/bond.ts`) é a ÚNICA leitura grande. Ele é o
 *    dono legítimo do `totalXP`, que antes aparecia cru aqui e não governava
 *    nada (a evolução é por `perfectDays`). Um número solto sem dono é ruído;
 *    ligado ao Vínculo ele vira uma PALAVRA — o título ("Companheiro") — com
 *    uma barra embaixo. Só a LEITURA foi ligada: nenhuma regra nova, nenhum
 *    campo novo no save, e nada disto entra na home (a home tem orçamento
 *    próprio de leituras — PLANO-DESIGN §5.1).
 *  · **Traço de nascimento e ritmo de cuidado**: já eram palavras. Ficaram, e
 *    os emojis-de-sistema viraram `<Icon>`.
 *  · **Dias perfeitos**: o único contador que governa alguma coisa (evolução).
 *    Fica, com `tabular-nums`.
 *  · **A jornada** (kills, runs, recorde do Dino, itens raros): virou FRASE.
 *    Ninguém decide nada com "Runs concluídas: 3" numa grade de cinco caixas;
 *    dentro de uma sentença os mesmos fatos leem como memória, que é o que
 *    eles são.
 *  · **Atributos (Poder/Harmonia/Benevolência)**: SAÍRAM. A casa deles é a
 *    página de Evolução, onde a pessoa está justamente decidindo o galho.
 *  · **As três tabelas de contagem** viraram DUAS listas: o que você mais
 *    repete (top 5) e as últimas conclusões. Atividade e tarefa eram duas
 *    tabelas com o mesmo desenho, uma embaixo da outra.
 */
import { useMemo } from 'react';
import { ActivityCategory } from '../types/attributes';
import { useTranslation, Language } from '../utils/i18n';
import { getPassive } from '../utils/passives';
import type { CarePattern } from '../utils/carePattern';
import { bondProgress, bondTitle } from '../utils/bond';
import { Icon } from './ui/Icon';
import { sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';

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

interface StatsPageProps {
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  language?: Language;
  /** Bits. Mora na Loja, onde é acionável — não é leitura desta tela. */
  gamePoints?: number;
  /** Combustível do **Nível de Vínculo** (`utils/bond.ts`). Nunca exibido cru. */
  totalXP?: number;
  streakDays?: number;
  /** Insumo do galho de evolução: a casa deles é a página de Evolução. */
  virusPoints?: number;
  dataPoints?: number;
  vaccinePoints?: number;
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
}

/**
 * Emoji marcando SEÇÃO é ícone de sistema disfarçado (PLANO-DESIGN §4.11).
 * O traço e o ritmo são conceitos do app, não escolha da pessoa — viram glifo
 * da Material Symbols. Todo nome abaixo está no inventário de `tokens.md`;
 * nome fora dele renderiza VAZIO e não dá erro nenhum.
 */
const PASSIVE_ICON: Record<string, string> = {
  guloso: 'restaurant',
  carinhoso: 'favorite',
  teimoso: 'pan_tool',
  sortudo: 'casino',
  madrugador: 'wb_sunny',
};
const PATTERN_ICON: Record<string, string> = {
  constante: 'eco',
  explosivo: 'local_fire_department',
  equilibrado: 'tune',
};

/** A superfície do sistema: sem chanfro, sem cobre, sem 9-slice. */
const card: React.CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
  padding: 16,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--sm2-font-display)',
  fontSize: 'var(--sm2-text-md)',
  fontWeight: 600,
  lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
  margin: '0 0 12px',
};

export function StatsPage({
  completedTasks,
  activityStats,
  language = 'en-US',
  totalXP = 0,
  streakDays = 0,
  petPassive,
  carePattern,
  journey,
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
    feitos.push(isPt ? `e marcaram ${n} no Dino` : `and scored ${n} on the Dino`);
  }

  const formNames = (journey?.unlockedEvolutions ?? []).map(id => {
    const form = journey?.soulmonStages?.find(
      st => (st.branch ? `${st.stage}-${st.branch}` : st.stage) === id,
    );
    return form?.name ?? id;
  });

  const traitRow = (iconName: string, name: string, desc: string) => (
    <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {/* Ícone PELADO — sem moldura, sem fundo, sem chanfro (regra do dono). */}
      <Icon name={iconName} size={28} fill={1} tone="primary" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{name}</p>
        <p style={{ ...sm2Hint, marginTop: 2 }}>{desc}</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>

      {/* ─────────────── A leitura dominante: o Vínculo ─────────────── */}
      <section style={{ ...card, padding: 20 }} aria-labelledby="sm2-bond-title">
        <p style={{ ...sm2Hint, letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {isPt ? 'Nível de vínculo' : 'Bond level'}
        </p>
        <h2
          id="sm2-bond-title"
          style={{
            fontFamily: 'var(--sm2-font-display)',
            fontSize: 'var(--sm2-text-2xl)',
            fontWeight: 600,
            lineHeight: 'var(--sm2-leading-title)',
            color: 'var(--sm2-ink)',
            margin: '2px 0 0',
          }}
        >
          {/* A PALAVRA vem primeiro; o número é a legenda dela. */}
          {title ?? (isPt ? 'Recém-chegados' : 'Just met')}
        </h2>
        <p className="sm2-num" style={{ ...sm2Hint, marginTop: 2 }}>
          {isPt ? `Nível ${bond.level}` : `Level ${bond.level}`}
        </p>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={isPt ? 'Progresso até o próximo nível de vínculo' : 'Progress to the next bond level'}
          style={{
            marginTop: 14, height: 8, borderRadius: 999,
            backgroundColor: 'var(--sm2-surface-2)', overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`, height: '100%',
              backgroundColor: 'var(--sm2-primary-fill)',
              transition: 'width var(--sm2-dur-enter) var(--sm2-ease)',
            }}
          />
        </div>
        <p style={{ ...sm2Hint, marginTop: 8 }}>
          {isPt
            ? 'Ele só sobe. Cuidar de você é o que aproxima vocês dois — nada aqui desce, nunca.'
            : 'It only goes up. Caring for yourself is what brings you two closer — nothing here ever drops.'}
        </p>
      </section>

      {/* ─────────────── Quem ele é ─────────────── */}
      {(passive || carePattern) && (
        <section style={card}>
          <h3 style={sectionTitle}>{isPt ? 'Quem ele é' : 'Who they are'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {passive && traitRow(
              PASSIVE_ICON[passive.id] ?? 'auto_awesome',
              isPt ? passive.namePt : passive.nameEn,
              isPt ? passive.descPt : passive.descEn,
            )}
            {carePattern && traitRow(
              PATTERN_ICON[carePattern.id] ?? 'auto_awesome',
              `${isPt ? 'Ritmo: ' : 'Rhythm: '}${isPt ? carePattern.namePt : carePattern.nameEn}`,
              isPt ? carePattern.descPt : carePattern.descEn,
            )}
          </div>
        </section>
      )}

      {/* ─────────────── A jornada ─────────────── */}
      <section style={card}>
        <h3 style={sectionTitle}>{isPt ? 'A jornada' : 'The journey'}</h3>

        {/* O ÚNICO contador que governa alguma coisa: dias perfeitos alimentam
            a evolução (`perfectDays`). Por isso ele é número, e sozinho. */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            className="sm2-num"
            style={{
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-xl)',
              fontWeight: 600,
              color: 'var(--sm2-ink)',
            }}
          >
            {streakDays}
          </span>
          <span style={sm2Hint}>{isPt ? 'dias perfeitos até aqui' : 'perfect days so far'}</span>
        </div>

        {formNames.length > 0 && (
          <p style={{ ...sm2Text, marginTop: 12 }}>
            {isPt ? 'Formas já alcançadas: ' : 'Forms reached so far: '}
            <span style={{ color: 'var(--sm2-primary-ink)' }}>{formNames.join(' · ')}</span>
          </p>
        )}

        {feitos.length > 0 && (
          <p className="sm2-num" style={{ ...sm2Hint, marginTop: 8 }}>
            {isPt ? 'Vocês também ' : 'You two also '}{feitos.join(', ')}.
          </p>
        )}

        {journey?.soulGoal && (
          <p style={{ ...sm2Hint, marginTop: 14, fontStyle: 'italic' }}>
            {isPt ? 'Começou por: ' : 'Started for: '}“{journey.soulGoal}”
          </p>
        )}
      </section>

      {/* ─────────────── O que você mais repete ─────────────── */}
      <section style={card}>
        <h3 style={sectionTitle}>{isPt ? 'O que você mais repete' : 'What you repeat most'}</h3>
        {topRepeated.length === 0 ? (
          <p style={sm2Hint}>
            {isPt
              ? 'Nada concluído ainda. A primeira vez já aparece aqui.'
              : 'Nothing finished yet. The very first one shows up here.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
            {topRepeated.map(([key, stat]) => (
              <li key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* O emoji da atividade é CONTEÚDO — escolha da pessoa, não
                    ícone de sistema. Fica (PLANO-DESIGN §4.11). */}
                <span aria-hidden="true" style={{ fontSize: 'var(--sm2-text-lg)', width: 26, textAlign: 'center' }}>
                  {stat.emoji}
                </span>
                <span
                  title={stat.name}
                  style={{ ...sm2Text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {stat.name}
                </span>
                <span className="sm2-num" style={sm2Hint}>
                  {isPt ? `${stat.completionCount}× feita` : `done ${stat.completionCount}×`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─────────────── Últimas conclusões ─────────────── */}
      <section style={card}>
        <h3 style={sectionTitle}>{isPt ? 'Últimas conclusões' : 'Latest completions'}</h3>
        {recent.length === 0 ? (
          <p style={sm2Hint}>
            {isPt ? 'O histórico começa na sua próxima conclusão.' : 'History starts at your next completion.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
            {recent.map(task => (
              <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span aria-hidden="true" style={{ fontSize: 'var(--sm2-text-md)', width: 26, textAlign: 'center' }}>
                  {task.emoji}
                </span>
                <span
                  title={task.name}
                  style={{ ...sm2Text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {task.name}
                </span>
                <span className="sm2-num" style={{ ...sm2Hint, whiteSpace: 'nowrap' }}>
                  {formatDate(task.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
