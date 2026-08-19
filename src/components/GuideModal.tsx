import { FOOD_LIMIT_PER_HOUR } from '../utils/careRules';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import type { Language } from '../utils/i18n';
import { FORM_REQUIREMENTS } from '../types/progression';
import { ATTR_INK } from '../types/attributes';
import { MAX_HEARTS_LOST_PER_DAY, ABSENCE_FORGIVENESS_DAYS, WEEKLY_RELIEF_HEARTS } from '../utils/dailyReset';
import {
  HABIT_WEIGHT,
  HABIT_MILESTONES,
  HABIT_TIER_BONUS,
  HABIT_TIER_ICONS,
  CONSTANCY_WINDOW_DAYS,
  REST_SHIELD_MAX,
  REST_SHIELD_EARN_EVERY_DAYS,
  MISS_INTERVENTION_AT,
  MAX_DAILY_FOCUS,
  OVERCOMMIT_EFFORT,
  POSTPONE_NUDGE_AT,
  HAUNTED_AFTER_DAYS,
  DEFAULT_REST_WINDOW,
  REST_WINDOW_GRACE_MIN,
  REST_WINDOW_DAYS,
} from '../types/taskModel';
import { GOOD_CONSTANCY_RATIO } from '../utils/habitRhythm';
import { DREAM_CATALOG } from '../utils/restWindow';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

/**
 * Guia do jogo. Bilíngue PT/EN como todo texto de UI (convenção do CLAUDE.md) —
 * antes era só em inglês, o que deixava o guia inteiro ilegível para o público
 * principal do app.
 *
 * Os números vêm das CONSTANTES, não de texto escrito à mão: era assim que o
 * guia tinha ficado prometendo estágios de ovo/bebê e requisitos que não
 * existiam mais.
 */
export function GuideModal({ isOpen, onClose, language = 'en-US' }: GuideModalProps) {
  const isPt = language === 'pt-BR';
  /** Escolhe o texto do idioma atual. */
  const L = (pt: string, en: string) => (isPt ? pt : en);

  if (!isOpen) return null;

  const R = FORM_REQUIREMENTS;

  // Números DERIVADOS das constantes — nunca escritos à mão (regra do
  // CLAUDE.md). Se a constante mudar, o guia muda junto.
  const [M1, M2, M3] = HABIT_MILESTONES;
  /** O "5" de "5 das últimas 7": vem da razão, não de um literal. */
  const GOOD_DAYS = Math.round(GOOD_CONSTANCY_RATIO * CONSTANCY_WINDOW_DAYS);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const DREAM_COUNT = DREAM_CATALOG.length;

  const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <section>
      <h3 className="font-bold mb-2" style={{ color: 'var(--sm-ink)' }}>{n}. {title}</h3>
      {children}
    </section>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto sm-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl" style={{ color: 'var(--sm-ink)' }}>
            📖 {L('Guia do Soulmon', 'Soulmon Guide')}
          </h2>
          <button
            onClick={onClose}
            aria-label={L('Fechar', 'Close')}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--sm-bg)', color: 'var(--sm-muted)' }}
          >
            <img src={iconClose} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </button>
        </div>

        <div className="space-y-4"
          style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--sm-muted)' }}>

          <Section n={1} title={L('Como seu Soulmon evolui', 'How your Soulmon evolves')}>
            <p className="mb-2">
              {L(
                'Ele evolui com dias perfeitos. Um dia é perfeito quando você cumpre a meta do dia — tudo o que você cadastrou, até o requisito do estágio — E a energia dele está cheia no fim do dia (é só alimentar).',
                'It evolves through perfect days. A day is perfect when you meet your daily goal — everything you registered, up to the stage requirement — AND its energy is full at the end of the day (just feed it).',
              )}
            </p>
            <p className="mb-2">
              {L(
                'A meta do dia é medida por esforço, não por quantidade: uma tarefa "Projeto" vale por três "Rápidas". Encarar a difícil rende o mesmo que cadastrar três coisinhas — e é isso que a gente queria. Detalhes na seção 11.',
                'The daily goal is measured in effort, not item count: one "Project" task is worth three "Quick" ones. Facing the hard thing pays the same as ticking three small ones — which is the whole point. Details in section 11.',
              )}
            </p>
            <p className="mb-2">
              {L(
                'Dias perfeitos só acumulam: um dia ruim nunca tira os que você já conquistou.',
                'Perfect days only accumulate: a bad day never takes away the ones you already earned.',
              )}
            </p>
            <p>
              {L('A evolução é sua: toque no seu Soulmon na página de Evolução para ', 'Evolution is yours to trigger: tap your Soulmon on the Evolution page to ')}
              <strong>{L('travar ou destravar o cadeado 🔒', 'toggle the 🔒 padlock')}</strong>
              {L('. Travado ele nunca evolui (os dias seguem acumulando). Um item raro também ajuda: o ', '. While locked it never evolves (perfect days keep piling up). One rare item also helps: the ')}
              <strong>🌀 Glitchtama</strong>
              {L(' (concluir os 5 andares da masmorra) vale um dia perfeito.', ' (clear all 5 dungeon floors) grants a perfect day.')}
            </p>
          </Section>

          <Section n={2} title={L('O que cada ação faz', 'What each action does')}>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>❤️ {L('Corações (HP)', 'Hearts (HP)')}</strong>
                {L(
                  ' — Perdidos em proporção ao que ficou por fazer, medido contra o requisito do estágio: cumpriu o requisito (ou tudo o que cadastrou) e está seguro. Detalhes na seção 6.',
                  ' — Lost in proportion to what you leave undone, measured against your stage requirement: meet it (or finish everything you registered) and you are safe. Details in section 6.',
                )}
              </li>
              <li>
                <strong>⚡ {L('Energia', 'Energy')}</strong>
                {L(
                  ` — O número de barras é igual ao requisito de tarefas do estágio (Rookie precisa de ${R.rookie.required} tarefas → ${R.rookie.required} barras). Enche só comendo e zera todo dia. Precisa estar cheia no fim do dia para o dia contar como perfeito.`,
                  ` — The number of bars equals your stage's task requirement (Rookie needs ${R.rookie.required} tasks → ${R.rookie.required} bars). Fills only by feeding and resets daily. It must be full at day's end for the day to count as perfect.`,
                )}
              </li>
              <li>
                <strong>🍎 {L('Comida', 'Food')}</strong>
                {/* O número sai da CONSTANTE, não de texto à mão — a regra do
                    CLAUDE.md ("os números saem das constantes"). Estas duas
                    frases diziam "5 por hora" enquanto o teto virava 6, e o
                    guia passou a mentir em uma unidade no exato dia em que o
                    limite foi corrigido. */}
                {L(
                  ` — Enche energia e dá pontos de atributo (que definem o galho da evolução). NÃO cura corações. Dá para alimentar até ${FOOD_LIMIT_PER_HOUR} vezes por hora; cheio, ele avisa que está satisfeito. Cada tarefa concluída rende uma comida da categoria dela.`,
                  ` — Refills energy and grants attribute points (which steer your evolution branch). It does NOT heal hearts. You can feed up to ${FOOD_LIMIT_PER_HOUR} times per hour; once full, it just says so. Every completed task yields one food of its category.`,
                )}
              </li>
              <li>
                <strong>🚿 {L('Banho', 'Bath')}</strong>
                {L(' — Limpa o cocô e lava seu Soulmon. Sempre disponível.', ' — Cleans up poop and washes your Soulmon. Always available.')}
              </li>
              <li>
                <strong>🫶 {L('Carinho', 'Affection')}</strong>
                {L(
                  ' — Segure e esfregue sobre ele para soltar coraçõezinhos. É o único jeito de curar HP: cada ~2 segundos devolve meio coração, até 1 coração por dia.',
                  ' — Press and drag over it to make little hearts pop. This is the only way to heal HP: every ~2 seconds restores half a heart, up to 1 heart a day.',
                )}
              </li>
              <li>
                <strong>💤 {L('Dormir', 'Sleep')}</strong>
                {L(
                  ' — Ele descansa. Não faz cocô dormindo, então dormir a noite toda o protege.',
                  " — It rests. It won't poop while asleep, so sleeping through the night protects it.",
                )}
              </li>
            </ul>
          </Section>

          <Section n={3} title={L('Requisitos por forma', 'Requirements per form')}>
            <p className="mb-2">
              {L(
                'Seu Soulmon nasce Rookie — não existem estágios de ovo ou bebê. Cada forma pede dias perfeitos para evoluir, e um número de tarefas por dia para o dia contar:',
                'Your Soulmon is born a Rookie — there are no egg or baby stages. Each form needs perfect days to evolve, and a number of tasks per day for a day to count:',
              )}
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Rookie → Champion: <strong>{R.rookie.daysToEvolve}</strong> {L('dias perfeitos', 'perfect days')} · {R.rookie.required} {L('tarefas/dia', 'tasks/day')}</li>
              <li>Champion → Ultimate: <strong>{R.champion.daysToEvolve}</strong> {L('dias perfeitos', 'perfect days')} · {R.champion.required} {L('tarefas/dia', 'tasks/day')}</li>
              <li>Ultimate → Mega: <strong>{R.ultimate.daysToEvolve}</strong> {L('dias perfeitos', 'perfect days')} · {R.ultimate.required} {L('tarefas/dia', 'tasks/day')}</li>
              <li>Mega → Ultra: <strong>{R.mega.daysToEvolve}</strong> {L('dias perfeitos', 'perfect days')} · {R.mega.required} {L('tarefas/dia', 'tasks/day')} {L('(exige desbloquear os 3 Megas)', '(requires unlocking all 3 Megas)')}</li>
              <li>Ultra: {L('o topo da árvore', 'the top of the tree')} · {R.ultra.required} {L('tarefas/dia', 'tasks/day')}</li>
            </ul>
            <p className="mt-2">
              {L(
                'Repare que a carga diária achata perto do topo enquanto os dias perfeitos continuam subindo. O fim do jogo pede consistência ao longo de semanas, não mais tarefas espremidas num dia só.',
                'Notice the daily load flattens near the top while perfect days keep growing. The late game asks for consistency across weeks, not more tasks crammed into one day.',
              )}
            </p>
          </Section>

          <Section n={4} title={L('Limite de atividades', 'Activity cap')}>
            <p>
              {L(
                `Cada forma limita quantas atividades você mantém cadastradas: ${R.rookie.cap} no Rookie, subindo até ${R.ultra.cap} no Ultra.`,
                `Each form caps how many activities you keep registered: ${R.rookie.cap} at Rookie, rising to ${R.ultra.cap} at Ultra.`,
              )}
            </p>
            <p className="mt-2">
              {L(
                'O limite fica sempre acima do requisito diário de propósito — dá para cadastrar mais do que você precisa fazer, e o excedente nunca conta contra você.',
                'The cap always sits above the daily requirement on purpose — you can register more than you need to do, and the extra never counts against you.',
              )}
            </p>
          </Section>

          <Section n={5} title={L('Dias da semana', 'Weekday selection')}>
            <p>
              {L(
                'Você escolhe em quais dias cada atividade fica disponível, em qualquer estágio. Por padrão todos vêm marcados — e uma atividade que não é de hoje nunca conta contra a meta do dia.',
                "You choose which days each activity is available, at every stage. All days come checked by default — and an activity that isn't scheduled for today never counts against your daily goal.",
              )}
            </p>
          </Section>

          <Section n={6} title={L('Corações, em detalhe', 'Hearts, in detail')}>
            <p className="mb-2">
              {L(
                `Na virada do dia você perde corações em proporção ao que ficou por fazer, contra a meta do dia — o esforço que você cadastrou para hoje, até o requisito do estágio — e nunca mais que ${MAX_HEARTS_LOST_PER_DAY} coração por dia. Um dia ruim é um empurrãozinho, nunca um apagão.`,
                `At the day turn you lose hearts in proportion to what you left undone, against your daily goal — the effort you registered for today, capped at the stage requirement — and never more than ${MAX_HEARTS_LOST_PER_DAY} heart a day. A bad day is a nudge, never a wipe.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                `Sumiu por ${ABSENCE_FORGIVENESS_DAYS} dias ou mais? Voltar não custa nada — ele só estava com saudade. E toda segunda ele recupera ${WEEKLY_RELIEF_HEARTS} coração, então uma semana ruim nunca vaza para a seguinte.`,
                `Away for ${ABSENCE_FORGIVENESS_DAYS} days or more? Coming back costs nothing — it just missed you. And every Monday it recovers ${WEEKLY_RELIEF_HEARTS} of a heart, so one rough week never bleeds into the next.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                'Esqueceu de marcar algo que você fez? O relatório do dia tem um botão que devolve os corações cobrados. O dia perfeito não volta — esse já passou.',
                "Forgot to log something you actually did? The daily report has a button that gives the hearts back. The perfect day doesn't return — that one's gone.",
              )}
            </p>
            <p className="mb-2">
              {L(
                'Cocô não limpo drena 1 coração a cada 6 horas até você dar banho. Se o HP zerar, seu Soulmon regride uma forma — e volta com metade dos dias perfeitos já adiantados.',
                'Uncleaned poop drains 1 heart every 6 hours until you give a bath. If HP hits 0, your Soulmon degenerates one form — and comes back with half the perfect days already banked.',
              )}
            </p>
            <p>{L('HP máximo por forma:', 'Maximum HP per form:')}</p>
            <ul className="space-y-1 ml-4 list-disc mt-2">
              <li>Rookie, Champion, Ultimate: 3 {L('corações', 'hearts')}</li>
              <li>Mega: 4 {L('corações', 'hearts')}</li>
              <li>Ultra: 5 {L('corações', 'hearts')}</li>
            </ul>
          </Section>

          <Section n={7} title={L('Galhos e o seu ritmo', 'Branches and your rhythm')}>
            <p className="mb-2">{L('A partir do Rookie existem 3 galhos:', 'From Rookie onwards there are 3 branches:')}</p>
            <ul className="space-y-1 ml-4 list-disc">
              {/* Cor de atributo como TEXTO usa `ATTR_INK` — medido: as cores
                  cruas davam 2,41–3,11:1 no claro e 3,97–4,06:1 no escuro. */}
              <li><span style={{ color: ATTR_INK.virus }}>{L('Vírus', 'Virus')}</span> ({L('verde', 'green')})</li>
              <li><span style={{ color: ATTR_INK.data }}>{L('Dado', 'Data')}</span> ({L('azul', 'blue')})</li>
              <li><span style={{ color: ATTR_INK.vaccine }}>{L('Vacina', 'Vaccine')}</span> ({L('amarelo', 'yellow')})</li>
            </ul>
            <p className="mt-2 mb-2">
              {L(
                'O galho vem dos pontos de atributo, que vêm da categoria das tarefas que você cumpre (a tarefa vira comida da mesma categoria, e a comida dá os pontos).',
                'The branch comes from attribute points, which come from the category of the tasks you complete (a task yields food of the same category, and food grants the points).',
              )}
              <strong> {L('Os requisitos são iguais em todos os galhos.', 'Requirements are identical across all branches.')}</strong>
            </p>
            <p>
              {L(
                'No empate, quem decide é o seu ritmo de cuidado — Constante, Explosivo ou Equilibrado, lido do seu histórico e visível em Estatísticas. Nenhum ritmo é melhor que outro: cada um simplesmente puxa para um lado.',
                'On a tie, your care rhythm decides — Steady, Burst or Balanced, read from your history and shown in Stats. No rhythm is better than another: each simply pulls a different way.',
              )}
            </p>
          </Section>

          <Section n={8} title={L('Traço de nascimento', 'Birth trait')}>
            <p>
              {L(
                'Todo Soulmon nasce com um traço — Guloso, Carinhoso, Teimoso, Sortudo ou Madrugador — visível em Estatísticas. Ele muda um detalhe pequeno do dia a dia, e todo traço é positivo: nenhum é desvantagem.',
                'Every Soulmon is born with one trait — Foodie, Cuddly, Stubborn, Lucky or Early Bird — shown in Stats. It nudges one small everyday detail, and every trait is an upside: none is a handicap.',
              )}
            </p>
          </Section>

          <Section n={9} title={L('Masmorra e Torneio', 'Dungeon and Tournament')}>
            <p className="mb-2">
              {L(
                'Nenhum dos dois cobra dos seus corações. Na masmorra, perder custa a run — os bônus de andar, o Glitchtama e o placar — e a entrada nunca é bloqueada.',
                'Neither costs you hearts. In the dungeon, losing costs you the run — floor bonuses, the Glitchtama and the score — and entry is never blocked.',
              )}
            </p>
            <p>
              {L(
                'O Torneio tem uma rodada toda semana, de sexta a domingo. É só um convite: fora dela dá para lutar do mesmo jeito. Sua faixa (Semente → Broto → Guardião → Ancião → Lendário) mede você contra você mesmo e nunca desce porque outra pessoa jogou mais.',
                'The Tournament has a weekly round, Friday through Sunday. It is only an invitation: you can still battle outside it. Your tier (Seedling → Sprout → Guardian → Elder → Legend) measures you against yourself and never drops because someone else played more.',
              )}
            </p>
          </Section>

          <Section n={10} title={L('Como você está', 'How you are')}>
            <p>
              {L(
                'O relatório diário pergunta como foi o seu dia, com cinco carinhas. É opcional, não vale ponto nenhum e não entra em nada do jogo — é só para você acompanhar, e para o app devolver uma leitura dos últimos dias.',
                "The daily report asks how your day went, with five faces. It is optional, worth no points, and feeds nothing in the game — it's just for you to follow along, and for the app to reflect the last few days back to you.",
              )}
            </p>
          </Section>

          <Section n={11} title={L('Esforço e a meta do dia', 'Effort and the daily goal')}>
            <p className="mb-2">
              {L(
                'Toda tarefa tem um esforço: Rápida (1), Média (2) ou Projeto (3). A meta do dia soma esse peso em vez de contar itens — um Projeto vale por três Rápidas, e cada hábito pesa ' + HABIT_WEIGHT + '.',
                `Every task has an effort: Quick (1), Medium (2) or Project (3). The daily goal adds up that weight instead of counting items — a Project is worth three Quick ones, and each habit weighs ${HABIT_WEIGHT}.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                'A razão é simples: enquanto tudo valia 1, valia mais a pena cadastrar cinco coisinhas do que encarar a que realmente mudaria o seu dia. Agora o jogo premia o esforço de verdade.',
                'The reason is simple: while everything counted as 1, it paid better to register five trivial things than to face the one that would actually change your day. Now the game rewards real effort.',
              )}
            </p>
            <p>
              {L(
                `Se o dia planejado passar de ${OVERCOMMIT_EFFORT} pontos de esforço, seu Soulmon comenta com carinho que é bastante coisa e sugere deixar uma para amanhã. É só um aviso — ele nunca impede nada.`,
                `If the day you planned goes past ${OVERCOMMIT_EFFORT} effort points, your Soulmon gently mentions that it's a lot and offers to leave one for tomorrow. It's only a heads-up — it never blocks anything.`,
              )}
            </p>
          </Section>

          <Section n={12} title={L('Como um hábito se repete', 'How a habit repeats')}>
            <p className="mb-2">{L('Três modos, e você escolhe o que combina com a sua vida:', 'Three modes, and you pick the one that fits your life:')}</p>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>{L('Dias da semana', 'Days of the week')}</strong>
                {L(' — o de sempre: segunda, quarta, sexta…', ' — the classic one: Monday, Wednesday, Friday…')}
              </li>
              <li>
                <strong>{L('X vezes por semana', 'X times a week')}</strong>
                {L(
                  ' — "3x por semana", e VOCÊ escolhe quais dias. Já vem com perdão embutido: um dia ruim não é falha, é remarcação.',
                  ' — "3 times a week", and YOU pick which days. Forgiveness is built in: a bad day isn\'t a miss, it\'s a reschedule.',
                )}
              </li>
              <li>
                <strong>{L('A cada N dias', 'Every N days')}</strong>
                {L(
                  ' — e aqui tem uma opção importante: "contando de quando eu fizer". Com ela, o próximo dia é calculado a partir da sua conclusão, não da data prevista. Sumir por um mês devolve UMA ocorrência para hoje, nunca trinta atrasadas.',
                  ' — and here comes the important option: "counting from when I do it". With it, the next day is measured from your completion, not from the planned date. Disappearing for a month gives you back ONE occurrence today, never thirty overdue ones.',
                )}
              </li>
            </ul>
          </Section>

          <Section n={13} title={L('Constância, escudos e maturidade', 'Consistency, shields and maturity')}>
            <p className="mb-2">
              {L(
                `Seu hábito não tem sequência que zera. O que aparece é a constância: "${GOOD_DAYS} das últimas ${CONSTANCY_WINDOW_DAYS}". Um dia perdido custa uma fatia pequena — nunca tudo. Nada aqui volta para o começo.`,
                `Your habits have no streak that resets. What you see is consistency: "${GOOD_DAYS} of the last ${CONSTANCY_WINDOW_DAYS}". A missed day costs a small slice — never everything. Nothing here goes back to zero.`,
              )}
            </p>
            <p className="mb-2">
              <strong>🛡️ {L('Escudos de descanso', 'Rest shields')}</strong>
              {L(
                ` — a cada ${REST_SHIELD_EARN_EVERY_DAYS} dias de boa constância você ganha um escudo (até ${REST_SHIELD_MAX} guardados). Ele é usado SOZINHO no dia em que você falta: você não precisa lembrar de ativar nada, e o dia protegido conta como feito.`,
                ` — every ${REST_SHIELD_EARN_EVERY_DAYS} days of good consistency you earn a shield (up to ${REST_SHIELD_MAX} stored). It is spent AUTOMATICALLY on a day you miss: you never have to remember to switch anything on, and a shielded day counts as done.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                `Faltou um dia? O app não diz nada — um dia não é sinal de nada. Só quando chegam ${MISS_INTERVENTION_AT} faltas seguidas seu Soulmon aparece propondo uma versão bem menor do hábito ("hoje, só 5 minutos?"). Aceitar já conta como feito.`,
                `Missed one day? The app says nothing — one day means nothing. Only when ${MISS_INTERVENTION_AT} misses pile up in a row does your Soulmon show up offering a much smaller version of the habit ("just 5 minutes today?"). Accepting already counts as done.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                'Marcos de maturidade (o ícone do hábito cresce, igual ao seu Soulmon evoluindo):',
                'Maturity milestones (the habit icon grows, just like your Soulmon evolving):',
              )}
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>{HABIT_TIER_ICONS.seed} {L('Semente', 'Seed')} — {L('o começo', 'the start')}</li>
              <li>{HABIT_TIER_ICONS.sprout} {L('Broto', 'Sprout')} — {M1} {L('dias feitos', 'days done')} · +{pct(HABIT_TIER_BONUS.sprout)} {L('de atributo', 'attribute yield')}</li>
              <li>{HABIT_TIER_ICONS.sapling} {L('Muda', 'Sapling')} — {M2} {L('dias feitos', 'days done')} · +{pct(HABIT_TIER_BONUS.sapling)}</li>
              <li>{HABIT_TIER_ICONS.tree} {L('Árvore', 'Tree')} — {M3} {L('dias feitos', 'days done')} · +{pct(HABIT_TIER_BONUS.tree)}</li>
            </ul>
            <p className="mt-2">
              {L(
                `Os ${M3} dias não são um número inventado: é a mediana real medida em pesquisa para um hábito virar automático (o famoso "21 dias" nunca teve a ver com hábito). E o rendimento só sobe: um hábito antigo vale MAIS, nunca menos.`,
                `Those ${M3} days aren't a made-up number: it's the real median measured in research for a habit to become automatic (the famous "21 days" never had anything to do with habits). And the yield only rises: an old habit is worth MORE, never less.`,
              )}
            </p>
          </Section>

          <Section n={14} title={L('Suas tarefas têm saída', 'Your tasks have a way out')}>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>🎯 {L('Foco do dia', 'Today\'s focus')}</strong>
                {L(
                  ` — escolha até ${MAX_DAILY_FOCUS} tarefas no check-in da manhã. Completar as ${MAX_DAILY_FOCUS} rende o selo do dia. Escolher poucas é o ponto: o alívio vem de decidir, não de fazer tudo.`,
                  ` — pick up to ${MAX_DAILY_FOCUS} tasks at the morning check-in. Completing all ${MAX_DAILY_FOCUS} earns the day's seal. Picking few is the point: relief comes from deciding, not from doing everything.`,
                )}
              </li>
              <li>
                <strong>{L('Quando × Prazo', 'When vs. Deadline')}</strong>
                {L(
                  ' — "quando" é o dia em que você pretende começar; "prazo" é quando vence. Só o "quando" traz a tarefa para a tela de hoje: um prazo lá na frente não polui o seu dia.',
                  ' — "when" is the day you mean to start; "deadline" is when it is due. Only "when" pulls a task into today\'s screen: a far-off deadline never clutters your day.',
                )}
              </li>
              <li>
                <strong>{L('Adiada X vezes', 'Postponed X times')}</strong>
                {L(
                  ` — o app conta, e não julga. Ao chegar em ${POSTPONE_NUDGE_AT} adiamentos, seu Soulmon aparece com três opções: dividir em passos, encolher (vira menor) ou deixar pra lá.`,
                  ` — the app counts, and does not judge. Once it reaches ${POSTPONE_NUDGE_AT} postponements, your Soulmon shows up with three options: break it into steps, shrink it (make it smaller) or let it go.`,
                )}
              </li>
              <li>
                <strong>👻 {L('Assombrada', 'Haunted')}</strong>
                {L(
                  ` — tarefa vencida ou parada há ${HAUNTED_AFTER_DAYS} dias fica assombrada: esmaece e ganha uma partícula escura, e seu Soulmon olha para ela de vez em quando. Não é bronca — é o contrário: concluir uma assombrada dá bônus de alívio, com uma comemoração maior. A pilha velha vira conteúdo do jogo.`,
                  ` — a task that is overdue or untouched for ${HAUNTED_AFTER_DAYS} days becomes haunted: it fades, gains a dark little particle, and your Soulmon glances at it now and then. It isn't a scolding — quite the opposite: clearing a haunted task grants a relief bonus, with a bigger celebration. The old pile becomes game content.`,
                )}
              </li>
              <li>
                <strong>💤 {L('Algum dia', 'Someday')}</strong>
                {L(
                  ' — uma lista deliberadamente parada. Não conta na meta, não envelhece, não assombra e não cobra nada. É permissão formal para não fazer agora.',
                  ' — a deliberately inert list. It doesn\'t count toward the goal, doesn\'t age, doesn\'t haunt and never nags. It is formal permission not to do it now.',
                )}
              </li>
              <li>
                <strong>🌙 {L('Deixar pra lá', 'Let it go')}</strong>
                {L(
                  ' — não é apagar (apagar perde o contexto) nem marcar como feita (isso seria mentira). É uma saída honesta, com lista própria e volta atrás quando você quiser.',
                  ' — not deleting (deleting loses the context) and not ticking it done (that would be a lie). It is an honest exit, with its own list and an undo whenever you want.',
                )}
              </li>
              <li>
                <strong>🧹 {L('Arrumar a pilha', 'Tidy the pile')}</strong>
                {L(
                  ' — pega tudo que está atrasado e apresenta uma carta por vez, com quatro botões grandes: hoje / esta semana / algum dia / deixar pra lá. Terminar a fila é trabalho de planejamento de verdade, e rende recompensa.',
                  ' — takes everything overdue and deals it one card at a time, with four big buttons: today / this week / someday / let it go. Finishing the queue is real planning work, and it pays.',
                )}
              </li>
            </ul>
          </Section>

          <Section n={15} title={L('Janela de Descanso e Sonhos', 'Rest Window and Dreams')}>
            <p className="mb-2">
              {L(
                `Você escolhe a SUA janela de sono (o padrão é ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}). Nada de "8 horas" recomendadas. Colocar seu Soulmon para dormir dentro dessa janela é o que conta — com ${REST_WINDOW_GRACE_MIN} minutos de tolerância, porque isto não é um app de pontualidade.`,
                `You choose YOUR own sleep window (the default is ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}). No recommended "8 hours". Putting your Soulmon to bed inside that window is what counts — with ${REST_WINDOW_GRACE_MIN} minutes of grace, because this is not a punctuality app.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                `O jogo premia o gesto de deitar no horário, nunca a qualidade do seu sono — ninguém comanda o próprio sono às 3h da manhã. Não existe nota de sono, não existe castigo por noite ruim, e noite sem registro é neutra: sai da conta, nunca vira falha. A leitura é a mesma dos hábitos: quantas das últimas ${REST_WINDOW_DAYS} noites entraram na janela.`,
                `The game rewards the act of going to bed on time, never how well you slept — nobody commands their own sleep at 3am. There is no sleep score, no penalty for a rough night, and an unlogged night is neutral: it leaves the maths, it never becomes a miss. The reading works like habits do: how many of the last ${REST_WINDOW_DAYS} nights landed inside the window.`,
              )}
            </p>
            <p className="mb-2">
              {L(
                `🌙 E aí vem a parte boa: cada noite dentro da janela, seu Soulmon SONHA — e o sonho é uma cena colecionável dele mesmo (dormindo numa lua, num campo de flores, no trem noturno). São ${DREAM_COUNT} sonhos para descobrir, e a coleção só cresce: ela nunca perde nada.`,
                `🌙 And here's the good part: every night inside the window your Soulmon DREAMS — and the dream is a collectible scene of itself (asleep on the moon, in a flower field, on the night train). There are ${DREAM_COUNT} dreams to discover, and the collection only grows: it never loses anything.`,
              )}
            </p>
            <p>
              {L(
                'Sonhos mais raros vêm da REGULARIDADE, nunca de dormir mais. E se você preferir não ver número nenhum, existe um botão que esconde as métricas e mantém todas as recompensas iguais.',
                'Rarer dreams come from REGULARITY, never from sleeping longer. And if you\'d rather see no numbers at all, there is a switch that hides the metrics and keeps every reward exactly the same.',
              )}
            </p>
          </Section>

          <Section n={16} title={L('Os rituais do dia e da semana', 'Daily and weekly rituals')}>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>☀️ {L('Check-in da manhã', 'Morning check-in')}</strong>
                {L(
                  ` — vinte segundos: os hábitos de hoje, até ${MAX_DAILY_FOCUS} focos e como você está. O que ficou pendente de ontem aparece primeiro, para não sumir de vista. Chegou à noite e não fez o check-in? Ele continua disponível — "matinal" é um convite, não um horário.`,
                  ` — twenty seconds: today's habits, up to ${MAX_DAILY_FOCUS} focus tasks and how you're doing. Anything left over from yesterday shows up first, so it never quietly disappears. Only opened the app at night? The check-in is still there — "morning" is an invitation, not a deadline.`,
                )}
              </li>
              <li>
                <strong>🌆 {L('Relatório da noite', 'Evening report')}</strong>
                {L(
                  ' — o resumo do dia, mais o que seu Soulmon trouxe da aventura dele. O que ele traz depende do seu dia; qual ele traz é surpresa.',
                  " — the day's summary, plus whatever your Soulmon brought back from its adventure. What it brings depends on your day; which one it brings is a surprise.",
                )}
              </li>
              <li>
                <strong>📅 {L('Domingo', 'Sunday')}</strong>
                {L(
                  ' — a leitura da semana: constância de cada hábito, o que foi melhor, a categoria dominante, o esforço concluído e os sonhos coletados. Às vezes vem uma sugestão do tipo "você quase nunca falha em Estudo às terças; que tal fazer Exercício logo depois?". É descrição, nunca cobrança.',
                  ' — the week in review: consistency per habit, what went best, your dominant category, effort completed and dreams collected. Sometimes a suggestion appears, like "you almost never miss Study on Tuesdays; how about doing Exercise right after?". It describes, it never demands.',
                )}
              </li>
              <li>
                <strong>🌱 {L('Recomeço', 'Fresh start')}</strong>
                {L(
                  ' — toda segunda e todo dia 1, seu Soulmon oferece um recomeço limpo: as cobranças pendentes zeram. Sua evolução, seus marcos de hábito e sua coleção de sonhos continuam inteiros — recomeço aqui nunca apaga nada do que você conquistou.',
                  " — every Monday and every 1st of the month, your Soulmon offers a clean restart: pending nagging is cleared. Your evolution, habit milestones and dream collection stay whole — a fresh start here never erases anything you earned.",
                )}
              </li>
            </ul>
          </Section>

          <section className="border-t pt-4 mt-4" style={{ borderColor: '#e5e6e7' }}>
            <p className="text-center italic">
              {L(
                'Seu Soulmon cresce junto com você. Nos dias em que não der, ele continua aqui. 💜',
                'Your Soulmon grows alongside you. On the days you can\'t, it stays right here. 💜',
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
