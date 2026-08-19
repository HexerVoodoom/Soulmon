import { FOOD_LIMIT_PER_HOUR } from '../utils/careRules';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { PixelButton } from './pixel/PixelKit';
import { Language } from '../utils/i18n';
import {
  HABIT_MILESTONES,
  CONSTANCY_WINDOW_DAYS,
  REST_SHIELD_MAX,
  REST_SHIELD_EARN_EVERY_DAYS,
  MAX_DAILY_FOCUS,
  OVERCOMMIT_EFFORT,
  HAUNTED_AFTER_DAYS,
  DEFAULT_REST_WINDOW,
  REST_WINDOW_DAYS,
  REST_WINDOW_GRACE_MIN,
} from '../types/taskModel';
import { GOOD_CONSTANCY_RATIO } from '../utils/habitRhythm';
import { DREAM_CATALOG } from '../utils/restWindow';

// Números DERIVADOS das constantes — o glossário nunca escreve um número à mão
// (regra do CLAUDE.md), senão ele passa a mentir no dia em que a regra muda.
const [MS_1, MS_2, MS_3] = HABIT_MILESTONES;
/** O "5" de "5 das últimas 7" sai da razão que concede escudo, não de um literal. */
const GOOD_DAYS = Math.round(GOOD_CONSTANCY_RATIO * CONSTANCY_WINDOW_DAYS);
const DREAM_COUNT = DREAM_CATALOG.length;

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const SECTIONS = [
  {
    titleEn: 'Your Soulmon',
    titlePt: 'Seu Soulmon',
    items: [
      {
        icon: '❤️',
        labelEn: 'HP (Hearts)',
        labelPt: 'HP (Corações)',
        descEn: 'Your Soulmon\'s health. At day\'s end you lose hearts for what you left undone vs. the stage requirement — never more than 1 heart per day, so one bad day can\'t undo it. Away two days or more? Coming back costs nothing. Every Monday it recovers half a heart. Uncleaned poop drains 1 heart every 6h. Healed mainly by rubbing (max 1 heart/day), or by using a Little Heart item (shop / dungeon drop). Reaches 0 → degeneration (you keep a head start of half the perfect days to climb back; doesn\'t stack).',
        descPt: 'A saúde do seu Soulmon. Na virada do dia você perde corações pelo que faltou em relação ao requisito do estágio — nunca mais que 1 coração por dia, então um dia ruim não desfaz o seu bichinho. Ficou dois dias ou mais sem aparecer? Voltar não custa nada. Toda segunda ele recupera meio coração. Cocô não limpo tira 1 coração a cada 6h. Recupera principalmente esfregando (máx. 1 coração/dia), ou usando um Coraçãozinho (loja / drop da masmorra). Chega a 0 → degeneração (você mantém metade dos dias perfeitos de vantagem para voltar; não acumula).',
      },
      {
        icon: '⚡',
        labelEn: 'Energy (right bar)',
        labelPt: 'Energia (barra lateral)',
        descEn: 'The number of bars equals your stage\'s task requirement (Rookie: 4 tasks → 4 bars). Fills only by feeding from the Items menu and resets each day. Perfect day = complete your daily goal + FULL energy at day\'s end.',
        descPt: 'A quantidade de barras é igual ao requisito de tarefas do estágio (Rookie: 4 tarefas → 4 barras). Sobe apenas alimentando pelo menu Itens e zera todo dia. Dia perfeito = cumprir a meta diária + energia CHEIA no fim do dia.',
      },
    ],
  },
  {
    titleEn: 'Evolution',
    titlePt: 'Evolução',
    items: [
      {
        icon: '📊',
        labelEn: 'Perfect Days bar',
        labelPt: 'Barra de Dias Perfeitos',
        descEn: 'Each day you meet your daily goal — measured in effort, not in item count — earns a Perfect Day. When the bar is full, an Evolve button appears over your pet — evolution only happens when you press it.',
        descPt: 'Cada dia em que você cumpre a meta do dia — medida em esforço, não em quantidade de itens — conta como Dia Perfeito. Com a barra cheia, um botão Evoluir aparece sobre o pet — a evolução só acontece quando você aperta.',
      },
      {
        icon: '🦠',
        labelEn: 'Virus / 💾 Data / 💉 Vaccine',
        labelPt: 'Vírus / 💾 Dado / 💉 Vacina',
        descEn: 'Attribute points earned through feeding. The dominant attribute shapes which form your Soulmon evolves into.',
        descPt: 'Pontos de atributo ganhos alimentando. O atributo dominante define para qual forma seu Soulmon irá evoluir.',
      },
      {
        icon: '🔒',
        labelEn: 'Evolution padlock',
        labelPt: 'Cadeado de evolução',
        descEn: 'On the Evolution page, tap your CURRENT Soulmon to lock/unlock evolution. While locked it never evolves (perfect days still accumulate); unlock it and you can trigger the evolution yourself when the days are enough.',
        descPt: 'Na página de Evolução, toque no seu Soulmon ATUAL para travar/destravar a evolução. Travado, ele nunca evolui (os dias perfeitos continuam contando); destrave e você mesmo dispara a evolução quando os dias bastarem.',
      },
      {
        icon: '✨',
        labelEn: 'Birth trait',
        labelPt: 'Traço de nascimento',
        descEn: 'Every Soulmon is born with one trait (see it in Stats). It tweaks a small everyday detail — meals, cuddles, a rough day, dungeon luck or poop timing. Every trait is an upside: none of them is a handicap.',
        descPt: 'Todo Soulmon nasce com um traço (veja em Estatísticas). Ele muda um detalhe pequeno do dia a dia — refeições, carinho, um dia ruim, sorte na masmorra ou a hora do cocô. Todo traço é positivo: nenhum é desvantagem.',
      },
      {
        icon: '🌀',
        labelEn: 'Glitchtama',
        labelPt: 'Glitchtama',
        descEn: 'Rare item earned by clearing all 5 dungeon floors. Using it from the Items folder grants 1 perfect day (an evolution point).',
        descPt: 'Item raro ganho ao concluir os 5 andares da masmorra. Usar na pastinha de itens concede 1 dia perfeito (um ponto de evolução).',
      },
      {
        icon: '🏅',
        labelEn: 'Missions & locked items',
        labelPt: 'Missões e itens bloqueados',
        descEn: 'The Shop has tabs, and some items show darkened with a 🔒: tap one to see how to unlock its purchase. Missions (evolve to a level, defeat dungeon enemies, high scores…) unlock exclusive backdrops.',
        descPt: 'A Loja tem abas, e alguns itens aparecem escurecidos com 🔒: toque para ver como liberar a compra. Missões (evoluir até um nível, derrotar inimigos na masmorra, recordes…) liberam cenários exclusivos.',
      },
    ],
  },
  {
    titleEn: 'Daily Actions',
    titlePt: 'Ações do Dia',
    items: [
      {
        icon: '📁',
        labelEn: 'Items',
        labelPt: 'Itens',
        // Número da CONSTANTE, não à mão: dizia "5/hora" enquanto o teto virava 6.
        descEn: `Your inventory. Food refills energy + attribute points (up to ${FOOD_LIMIT_PER_HOUR}/hour). Shop items also live here: chips give ONLY attribute points (no energy), and Little Hearts heal 1 HP — neither counts against the food limit.`,
        descPt: `Seu inventário. Comida enche energia + atributos (até ${FOOD_LIMIT_PER_HOUR}/hora). Itens da loja também ficam aqui: chips dão SÓ atributo (sem energia) e Coraçõezinhos curam 1 HP — nenhum conta no limite de comida.`,
      },
      {
        icon: '🚿',
        labelEn: 'Bath',
        labelPt: 'Banho',
        descEn: 'Give your Soulmon a shower anytime. Cleans up active poop events (stopping the heart drain).',
        descPt: 'Dê banho no seu Soulmon a qualquer hora. Limpa o cocô ativo (e para o dreno de coração).',
      },
      {
        icon: '🫶',
        labelEn: 'Affection (Rub)',
        labelPt: 'Carinho (esfregar)',
        descEn: 'Rub your Soulmon (press and drag over it) to pop little hearts. The only way to heal HP: ~2s of rubbing = half a heart, up to 1 heart per day.',
        descPt: 'Esfregue seu Soulmon (segure e arraste sobre ele) para soltar coraçõezinhos. Principal jeito de curar HP: ~2s esfregando = meio coração, máx. 1 coração por dia.',
      },
      {
        icon: '💤',
        labelEn: 'Sleep',
        labelPt: 'Dormir',
        descEn: 'Let your Soulmon rest. It won\'t poop while asleep, so sleeping overnight protects it from penalties.',
        descPt: 'Deixe seu Soulmon descansar. Ele não faz cocô dormindo, então dormir à noite o protege de penalidades.',
      },
      {
        icon: '🚽',
        labelEn: 'Poop indicator',
        labelPt: 'Indicador de cocô',
        descEn: 'Shows when a poop event is approaching. Clean it via the Bath button.',
        descPt: 'Mostra quando um evento de cocô está chegando. Limpe pelo botão Banho.',
      },
    ],
  },
  {
    titleEn: 'Care Events',
    titlePt: 'Eventos de Cuidado',
    items: [
      {
        icon: '💩',
        labelEn: 'Poop event',
        labelPt: 'Evento de cocô',
        descEn: 'Appears up to twice a day (never while asleep). Give a bath to clean it. While left uncleaned it drains 1 heart every 6 hours.',
        descPt: 'Aparece até duas vezes por dia (nunca dormindo). Dê banho para limpar. Enquanto não limpo, tira 1 coração a cada 6 horas.',
      },
    ],
  },
  {
    titleEn: 'Habits',
    titlePt: 'Hábitos',
    items: [
      {
        icon: '📈',
        labelEn: 'Consistency',
        labelPt: 'Constância',
        descEn: `Replaces the streak. It reads "${GOOD_DAYS} of the last ${CONSTANCY_WINDOW_DAYS}" — only days the habit was actually due count. A missed day costs a small slice, never everything: nothing here resets to zero. Shielded days count as done.`,
        descPt: `Substitui a sequência. Aparece como "${GOOD_DAYS} das últimas ${CONSTANCY_WINDOW_DAYS}" — só contam os dias em que o hábito era devido. Uma falta custa uma fatia pequena, nunca tudo: nada aqui volta para zero. Dia protegido por escudo conta como feito.`,
      },
      {
        icon: '🛡️',
        labelEn: 'Rest shield',
        labelPt: 'Escudo de descanso',
        descEn: `Earned every ${REST_SHIELD_EARN_EVERY_DAYS} days of good consistency, up to ${REST_SHIELD_MAX} stored. It is spent AUTOMATICALLY on a day you miss — you never have to remember to activate it — and the protected day counts as done.`,
        descPt: `Ganho a cada ${REST_SHIELD_EARN_EVERY_DAYS} dias de boa constância, até ${REST_SHIELD_MAX} guardados. É gasto SOZINHO no dia em que você falta — você nunca precisa lembrar de ativar — e o dia protegido conta como feito.`,
      },
      {
        icon: '🌳',
        labelEn: 'Habit maturity',
        labelPt: 'Maturidade do hábito',
        descEn: `Milestones at ${MS_1} / ${MS_2} / ${MS_3} days done: Seed → Sprout → Sapling → Tree. The habit icon grows at each one and the habit starts yielding more attribute points — old effort is worth MORE, never less. The ${MS_3} is the median measured in research for a habit to turn automatic.`,
        descPt: `Marcos em ${MS_1} / ${MS_2} / ${MS_3} dias feitos: Semente → Broto → Muda → Árvore. O ícone do hábito cresce em cada um e ele passa a render mais atributo — o esforço antigo vale MAIS, nunca menos. Os ${MS_3} são a mediana medida em pesquisa para um hábito virar automático.`,
      },
      {
        icon: '🔁',
        labelEn: 'Count from completion',
        labelPt: 'Contar da conclusão',
        descEn: 'A repeat option for "every N days": the next date is measured from when you actually did it, not from the planned date. Disappearing for a month gives you ONE occurrence today, never thirty overdue ones.',
        descPt: 'Opção da recorrência "a cada N dias": a próxima data é contada de quando você fez de verdade, não da data prevista. Sumir por um mês devolve UMA ocorrência hoje, nunca trinta atrasadas.',
      },
    ],
  },
  {
    titleEn: 'Tasks',
    titlePt: 'Tarefas',
    items: [
      {
        icon: '🏋️',
        labelEn: 'Effort',
        labelPt: 'Esforço',
        descEn: `Quick (1), Medium (2) or Project (3). The daily goal adds up effort instead of counting items — one Project is worth three Quick ones, and each habit weighs 1. Past ${OVERCOMMIT_EFFORT} points planned for a day, your Soulmon gently says it's a lot. It's a heads-up, never a block.`,
        descPt: `Rápida (1), Média (2) ou Projeto (3). A meta do dia soma esforço em vez de contar itens — um Projeto vale por três Rápidas, e cada hábito pesa 1. Passando de ${OVERCOMMIT_EFFORT} pontos planejados para o dia, seu Soulmon comenta com carinho que é bastante coisa. É aviso, nunca bloqueio.`,
      },
      {
        icon: '🎯',
        labelEn: 'Today\'s focus',
        labelPt: 'Foco do dia',
        descEn: `Up to ${MAX_DAILY_FOCUS} tasks chosen at the morning check-in. Completing all ${MAX_DAILY_FOCUS} earns the day's seal. Choosing few is the point — the relief comes from deciding, not from doing everything.`,
        descPt: `Até ${MAX_DAILY_FOCUS} tarefas escolhidas no check-in da manhã. Completar as ${MAX_DAILY_FOCUS} rende o selo do dia. Escolher poucas é o ponto — o alívio vem de decidir, não de fazer tudo.`,
      },
      {
        icon: '👻',
        labelEn: 'Haunted',
        labelPt: 'Assombrada',
        descEn: `A task that is overdue or untouched for ${HAUNTED_AFTER_DAYS} days: it fades and gains a dark particle, and your Soulmon glances at it now and then. It is not a scolding — clearing a haunted task grants a relief bonus, with a bigger celebration.`,
        descPt: `Tarefa vencida ou parada há ${HAUNTED_AFTER_DAYS} dias: esmaece, ganha uma partícula escura e seu Soulmon olha para ela de vez em quando. Não é bronca — concluir uma assombrada dá bônus de alívio, com comemoração maior.`,
      },
      {
        icon: '💤',
        labelEn: 'Someday',
        labelPt: 'Algum dia',
        descEn: 'A deliberately inert list: it does not count toward the daily goal, does not age, does not haunt and never nags. Formal permission not to do it now — and it comes back whenever you want.',
        descPt: 'Uma lista deliberadamente parada: não conta na meta do dia, não envelhece, não assombra e não cobra. Permissão formal para não fazer agora — e volta quando você quiser.',
      },
      {
        icon: '🌙',
        labelEn: 'Let it go',
        labelPt: 'Deixar pra lá',
        descEn: 'An honest ending for a task that will not happen. It is not deleting (that loses the context) and not ticking it done (that would be a lie). It has its own list and an undo button.',
        descPt: 'Um fim honesto para a tarefa que não vai acontecer. Não é apagar (perde o contexto) nem marcar como feita (seria mentira). Tem lista própria e botão de voltar atrás.',
      },
    ],
  },
  {
    titleEn: 'Rest & rituals',
    titlePt: 'Descanso e rituais',
    items: [
      {
        icon: '🛏️',
        labelEn: 'Rest Window',
        labelPt: 'Janela de Descanso',
        descEn: `Your own chosen sleep window (default ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}), with ${REST_WINDOW_GRACE_MIN} min of grace. What counts is putting your Soulmon to bed inside it — never how well you slept. No sleep score, no penalty for a rough night, and an unlogged night is neutral. The reading is "how many of the last ${REST_WINDOW_DAYS} nights". A switch hides the numbers and keeps every reward.`,
        descPt: `A janela de sono que VOCÊ escolhe (padrão ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}), com ${REST_WINDOW_GRACE_MIN} min de tolerância. O que conta é colocar seu Soulmon para dormir dentro dela — nunca a qualidade do seu sono. Sem nota de sono, sem castigo por noite ruim, e noite sem registro é neutra. A leitura é "quantas das últimas ${REST_WINDOW_DAYS} noites". Um botão esconde os números e mantém todas as recompensas.`,
      },
      {
        icon: '🌠',
        labelEn: 'Dream',
        labelPt: 'Sonho',
        descEn: `Every night inside the window your Soulmon dreams, and the dream is a collectible scene of itself. ${DREAM_COUNT} to discover; rarity comes from REGULARITY, never from sleeping longer. The collection only grows — it never loses anything.`,
        descPt: `Cada noite dentro da janela seu Soulmon sonha, e o sonho é uma cena colecionável dele mesmo. São ${DREAM_COUNT} para descobrir; a raridade vem da REGULARIDADE, nunca de dormir mais. A coleção só cresce — nunca perde nada.`,
      },
      {
        icon: '☀️',
        labelEn: 'Check-in',
        labelPt: 'Check-in',
        descEn: `The twenty-second morning ritual: today's habits, up to ${MAX_DAILY_FOCUS} focus tasks and how you're doing. Anything left over from yesterday appears first. Opened the app only at night? It's still available — "morning" is an invitation, not a deadline.`,
        descPt: `O ritual de vinte segundos da manhã: os hábitos de hoje, até ${MAX_DAILY_FOCUS} focos e como você está. O que ficou pendente de ontem aparece primeiro. Só abriu o app à noite? Continua disponível — "matinal" é convite, não horário.`,
      },
      {
        icon: '🌱',
        labelEn: 'Fresh start',
        labelPt: 'Recomeço',
        descEn: 'Offered every Monday and every 1st of the month: pending nagging is cleared. Your evolution, habit milestones and dream collection stay exactly as they are — a fresh start never erases anything you earned.',
        descPt: 'Oferecido toda segunda e todo dia 1: as cobranças pendentes zeram. Sua evolução, seus marcos de hábito e sua coleção de sonhos continuam iguais — recomeço nunca apaga nada do que você conquistou.',
      },
    ],
  },
];

export function HelpModal({ isOpen, onClose, language }: HelpModalProps) {
  if (!isOpen) return null;

  const isPt = language === 'pt-BR';

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-0">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Este modal era o único da tela desenhado em cor CRUA (`#1a2230`,
          cinza-ardósia fora da paleta) com texto branco fixo: no tema claro
          ele virava uma lâmina escura, e `text-white/60` sobre esse fundo era
          o pior contraste do app. Agora ele usa os tokens do tema, como o
          resto do kit. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isPt ? 'Ajuda' : 'Help'}
        className="relative w-full max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200"
        style={{ background: 'var(--sm-surface)', color: 'var(--sm-ink)', borderTop: '3px solid var(--sm-px-copper)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderBottom: '2px solid var(--sm-line)' }}>
          <span className="sm-px-font" style={{ fontSize: '0.8rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'ℹ️ AJUDA' : 'ℹ️ HELP'}
          </span>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar ajuda' : 'Close help'}
            title={isPt ? 'Fechar' : 'Close'}
            className="sm-px-help-x"
          >
            <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {SECTIONS.map(section => (
            <div key={section.titleEn}>
              <p
                className="sm-px-font text-xs mb-2 uppercase tracking-wider"
                style={{ color: 'var(--sm-help-accent)' }}
              >
                {isPt ? section.titlePt : section.titleEn}
              </p>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div key={item.labelEn} className="flex gap-3 p-2 sm-px-help-item">
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                    <div>
                      <p className="font-bold text-xs" style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--sm-ink)' }}>
                        {isPt ? item.labelPt : item.labelEn}
                      </p>
                      {/* Texto corrido (e em PT-BR com acento): monoespaçada de
                          leitura, nunca a bitmap — mesma decisão da rodada 2. */}
                      <p className="text-xs mt-0.5 leading-snug" style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--sm-muted)' }}>
                        {isPt ? item.descPt : item.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer close button */}
        <div className="shrink-0 p-3" style={{ borderTop: '2px solid var(--sm-line)' }}>
          <PixelButton size="sm" onClick={onClose} style={{ width: '100%' }}>
            {isPt ? 'Fechar' : 'Close'}
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
