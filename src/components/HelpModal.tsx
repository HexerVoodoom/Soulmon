import iconClose from '../assets/soulmon/icons/icon-close.png';
import { PixelButton } from './pixel/PixelKit';
import { Language } from '../utils/i18n';

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
        descEn: 'Each day you complete the required number of activities earns a Perfect Day. When the bar is full, an Evolve button appears over your pet — evolution only happens when you press it.',
        descPt: 'Cada dia em que você completa as atividades necessárias conta como Dia Perfeito. Com a barra cheia, um botão Evoluir aparece sobre o pet — a evolução só acontece quando você aperta.',
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
        descEn: 'Your inventory. Food refills energy + attribute points (up to 5/hour). Shop items also live here: chips give ONLY attribute points (no energy), and Little Hearts heal 1 HP — neither counts against the food limit.',
        descPt: 'Seu inventário. Comida enche energia + atributos (até 5/hora). Itens da loja também ficam aqui: chips dão SÓ atributo (sem energia) e Coraçõezinhos curam 1 HP — nenhum conta no limite de comida.',
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
