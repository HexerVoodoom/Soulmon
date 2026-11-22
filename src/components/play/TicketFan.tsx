import { createContext, useContext, useEffect, useState, type CSSProperties } from 'react';
import type { Language } from '../../utils/i18n';
import { FUN_TICKET_BATCH, FUN_TICKET_COST, FUN_TICKET_MAX, formatHms, type FunTicketStatus } from '../../utils/funTickets';
import { EnergyCost } from '../ui/EnergyCost';
import { BotaoEspecial } from '../ui/BotaoEspecial';
import { sm2Hint } from '../form/FormKit';
import ticketImg from '../../assets/soulmon/hud/ticket-minigame.png';

/**
 * 🎫 Tickets dos minijogos (09/11/2026; regra: `utils/funTickets.ts`).
 * Arte: `hud/ticket-minigame.png` (ChatGPT, UI, aprovado provisório pelo dono em 09/11/2026), 512×308, alfa.
 */
const TICKET_IMG = ticketImg;
const TICKET_RATIO = 308 / 512;

/** Um bilhete (a arte final). Pintado, não pixel-art: renderização suave. */
export function TicketArt({ width = 64, style }: { width?: number; style?: CSSProperties }) {
  const h = Math.round(width * TICKET_RATIO);
  return <img src={TICKET_IMG} alt="" aria-hidden="true" data-ticket-art width={width} height={h} draggable={false} style={{ width, height: h, display: 'block', ...style }} />;
}

/** O ticketzinho com "x1" que mora no botão de jogar / jogar de novo: a quantidade que a partida gasta. O ícone fica INCLINADO a -45° (pedido do dono, 09/11/2026). */
export function TicketCost({ amount = 1, size = 30 }: { amount?: number; size?: number }) {
  const box = Math.round(size * 1.25); // a caixa do ícone girado a 45° ocupa mais que a imagem: sem isso o canto vaza
  return (
    <span aria-hidden="true" data-ticket-cost={amount} className="sm2-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginInlineStart: 6, fontWeight: 700 }}>
      <span data-ticket-cost-icon style={{ display: 'inline-flex', width: box, height: box, alignItems: 'center', justifyContent: 'center', transform: 'rotate(-45deg)', flex: 'none' }}>
        <TicketArt width={size} />
      </span>
      x{amount}
    </span>
  );
}

/** Há ticket a gastar na rodada que começa? Provido pelo AreaView em volta dos jogos do Salão; `ResultScreen` lê para o "x1". */
export const FunTicketCostContext = createContext(false);
export const useFunTicketCost = (): boolean => useContext(FunTicketCostContext);

/**
 * Os tickets em posse, FORA do modal, por cima da cena, na frente do NPC (pedido do dono, 09/11/2026): um leque quase em PÉ, aberto a
 * partir de um ponto (a mão do NPC), um bilhete por ticket. Vai como filho da zona do NPC (`AreaSheet` › `npcOverlay`), entre o NPC e o
 * balão de fala: a caixa tem largura ZERO e fica no fim do NPC, então o leque cobre o braço e não o corpo nem a fala.
 * Tamanhos em `dvh` (a zona do NPC é 1/3 da altura da tela): o leque acompanha a tela, 360×640 ou 412×915. Sem ticket não desenha nada
 * (nenhum vão reservado); ao comprar, os bilhetes abrem com uma animação curta.
 */
export const TICKET_FAN_LONG_DVH = 11; // lado maior do bilhete (a zona do NPC tem ~33 dvh)
export const TICKET_FAN_PIVOT_DVH = 7; // altura da mão, medida do pé da zona
export const TICKET_FAN_STEP_DEG = 10;

/** O que o leque desenha. Padrão = o ticket dos minijogos; o CONVITE de Duelo (16/11/2026, §458) reaproveita o mesmo leque com a arte em pé (`portrait`). */
export interface FanArt {
  src: string;
  /** A arte é vertical (o convite, 96×144): gira 90° dentro da caixa horizontal do leque para ficar em pé como o bilhete. */
  portrait?: boolean;
  /** lado curto ÷ lado longo da caixa horizontal (bilhete 308/512; convite 96/144). */
  ratio: number;
  /** Teto de peças no leque (bilhete 6; convite 7). */
  max: number;
  /** Como o leitor de tela nomeia a peça: [singular, plural]. */
  unit: readonly [string, string];
  /** `data-*` do leque (gancho de testes). */
  attr: string;
}

export function TicketFan({ count, language, art }: { count: number; language: Language; art?: FanArt }) {
  const max = art?.max ?? FUN_TICKET_MAX;
  const ratio = art?.ratio ?? TICKET_RATIO;
  const src = art?.src ?? TICKET_IMG;
  const [um, varios] = art?.unit ?? ['ticket', 'tickets'];
  const n = Math.max(0, Math.min(max, Math.floor(count)));
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (n < 1) { setOpen(false); return; }
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [n > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  if (n < 1) return null;
  const long = TICKET_FAN_LONG_DVH;
  const short = long * ratio;
  const mid = (n - 1) / 2;
  return (
    <div
      {...{ [art?.attr ?? 'data-ticket-fan']: n }} role="img"
      aria-label={`${n} ${n === 1 ? um : varios}`}
      style={{ position: 'relative', flex: 'none', width: 0, height: 0, alignSelf: 'flex-end', zIndex: 0, pointerEvents: 'none' }}
    >
      {Array.from({ length: n }, (_, i) => {
        const spread = (i - mid) * TICKET_FAN_STEP_DEG;
        const angle = open ? -90 + spread : -90;
        return (
          <span
            key={i} data-ticket-in-fan
            style={{
              position: 'absolute', left: `-${long * 0.3}dvh`, top: `-${TICKET_FAN_PIVOT_DVH + short / 2}dvh`,
              width: `${long}dvh`, height: `${short}dvh`, transformOrigin: '0% 50%',
              transform: `rotate(${angle}deg) scale(${open ? 1 : 0.6})`, opacity: open ? 1 : 0,
              transition: `transform 280ms cubic-bezier(.2,.9,.3,1.2) ${i * 30}ms, opacity 200ms ease-out ${i * 30}ms`,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.55))',
            }}
          >
            {art?.portrait
              ? <img src={src} alt="" aria-hidden="true" data-ticket-art draggable={false} style={{ position: 'absolute', left: '50%', top: '50%', width: `${short}dvh`, height: `${long}dvh`, transform: 'translate(-50%, -50%) rotate(90deg)', display: 'block' }} />
              : <img src={src} alt="" aria-hidden="true" data-ticket-art draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />}
          </span>
        );
      })}
    </div>
  );
}

/**
 * O painel do Salão (DENTRO do modal; o leque mora fora, na cena): a contagem, a contagem regressiva do lote que vence primeiro e o botão de comprar
 * (1 energia → 3 tickets). Tentar jogar sem ticket abre o `TicketBuyModal` (15/11/2026), não um aviso aqui.
 */
export function TicketPanel({ language, status, onBuy }: { language: Language; status: (nowMs: number) => FunTicketStatus; onBuy?: () => void }) {
  const isPt = language === 'pt-BR';
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  const st = status(Date.now()); // relógio lido a cada render: um lote recém-comprado nunca fica "no futuro"
  const hint = st.canBuy
    ? null // a linha "1 energia = 3 tickets" saiu a pedido do dono (18/11/2026): o botão já mostra o custo
    : st.buyRefusal === 'has-tickets'
      ? null // a dica "você ainda tem tickets de sobra" saiu a pedido do dono (18/11/2026)
      : (isPt ? 'Sem energia para comprar tickets agora. A energia volta com o tempo; que tal uma tarefa, o Ateliê da Mente ou o Refúgio?' : 'No energy to buy tickets right now. Energy comes back over time; how about a task, the Mind Atelier or the Refuge?');
  return (
    <section data-fun-tickets={st.count} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <p className="sm2-num" data-fun-tickets-count style={{ margin: 0, fontWeight: 600 }}>
        {isPt ? `Tickets: ${st.count}/${FUN_TICKET_MAX}` : `Tickets: ${st.count}/${FUN_TICKET_MAX}`}
        {st.count > 0 && <span data-fun-tickets-expiry style={{ fontWeight: 400, marginInlineStart: 8 }}>{isPt ? `vence em ${formatHms(st.msLeft)}` : `expires in ${formatHms(st.msLeft)}`}</span>}
      </p>
      {onBuy && (
        <BotaoEspecial data-fun-tickets-buy disabled={!st.canBuy} onClick={onBuy}>
          {isPt ? `Comprar ${FUN_TICKET_BATCH} tickets` : `Buy ${FUN_TICKET_BATCH} tickets`}
          <EnergyCost amount={FUN_TICKET_COST} />
        </BotaoEspecial>
      )}
      {hint && <p data-fun-tickets-hint style={{ ...sm2Hint, margin: 0, opacity: 0.8, textAlign: 'center' }}>{hint}</p>}
    </section>
  );
}
