import iconClose from '../assets/soulmon/icons/icon-close.png';
import type { Language } from '../utils/i18n';
import { FORM_REQUIREMENTS } from '../types/progression';
import { ATTR_INK } from '../types/attributes';
import { MAX_HEARTS_LOST_PER_DAY, ABSENCE_FORGIVENESS_DAYS, WEEKLY_RELIEF_HEARTS } from '../utils/dailyReset';

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
                {L(
                  ' — Enche energia e dá pontos de atributo (que definem o galho da evolução). NÃO cura corações. Dá para alimentar até 5 vezes por hora; cheio, ele avisa que está satisfeito. Cada tarefa concluída rende uma comida da categoria dela.',
                  ' — Refills energy and grants attribute points (which steer your evolution branch). It does NOT heal hearts. You can feed up to 5 times per hour; once full, it just says so. Every completed task yields one food of its category.',
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
                `Na virada do dia você perde corações em proporção ao que ficou por fazer, contra min(cadastradas, requisito do estágio) — e nunca mais que ${MAX_HEARTS_LOST_PER_DAY} coração por dia. Um dia ruim é um empurrãozinho, nunca um apagão.`,
                `At the day turn you lose hearts in proportion to what you left undone, against min(registered, stage requirement) — and never more than ${MAX_HEARTS_LOST_PER_DAY} heart a day. A bad day is a nudge, never a wipe.`,
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
