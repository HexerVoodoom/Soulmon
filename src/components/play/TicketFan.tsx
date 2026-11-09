import { createContext, useContext, useEffect, useState, type CSSProperties } from 'react';
import type { Language } from '../../utils/i18n';
import { FUN_TICKET_BATCH, FUN_TICKET_COST, FUN_TICKET_MAX, formatHms, type FunTicketStatus } from '../../utils/funTickets';
import { EnergyCost } from '../ui/EnergyCost';
import { sm2Button, sm2Hint } from '../form/FormKit';
import ticketImg from '../../assets/soulmon/hud/ticket-minigame.png';

/**
 * 🎫 Tickets dos minijogos (09/11/2026; regra: `utils/funTickets.ts`).
 * Arte final: ticket amarelo com controle de videogame (ChatGPT, UI, aprovado pelo dono em 09/11/2026), 512×308, alfa real.
 */
const TICKET_IMG = ticketImg;
const TICKET_RATIO = 308 / 512;

/** Um bilhete (a arte final). Pintado, não pixel-art: renderização suave. */
export function TicketArt({ width = 64, style }: { width?: number; style?: CSSProperties }) {
  const h = Math.round(width * TICKET_RATIO);
  return <img src={TICKET_IMG} alt="" aria-hidden="true" data-ticket-art width={width} height={h} draggable={false} style={{ width, height: h, display: 'block', ...style }} />;
}

/** O ticketzinho com "x1" que mora no botão de jogar / jogar de novo: a quantidade que a partida gasta. */
export function TicketCost({ amount = 1, size = 28 }: { amount?: number; size?: number }) {
  return (
    <span aria-hidden="true" data-ticket-cost={amount} className="sm2-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineStart: 8, fontWeight: 600 }}>
      <TicketArt width={size} />
      x{amount}
    </span>
  );
}

/** Há ticket a gastar na rodada que começa? Provido pelo AreaView em volta dos jogos do Salão; `ResultScreen` lê para o "x1". */
export const FunTicketCostContext = createContext(false);
export const useFunTicketCost = (): boolean => useContext(FunTicketCostContext);

/** Os tickets em posse, GRANDES e abertos em leque (um por ticket). */
export function TicketFan({ count, language, width = 84 }: { count: number; language: Language; width?: number }) {
  const n = Math.max(0, Math.min(FUN_TICKET_MAX, Math.floor(count)));
  const isPt = language === 'pt-BR';
  const spread = 14; // graus entre bilhetes
  return (
    <div
      data-ticket-fan={n} role="img"
      aria-label={isPt ? `${n} ${n === 1 ? 'ticket' : 'tickets'}` : `${n} ${n === 1 ? 'ticket' : 'tickets'}`}
      style={{ position: 'relative', height: Math.round(width * TICKET_RATIO) + 28, width: width + 4 * 22, maxWidth: '100%', margin: '0 auto', opacity: n ? 1 : 0.35 }}
    >
      {Array.from({ length: n }, (_, i) => {
        const mid = (n - 1) / 2;
        const rot = (i - mid) * spread;
        const left = `calc(50% - ${width / 2}px + ${(i - mid) * 22}px)`;
        return (
          <span key={i} data-ticket-in-fan style={{ position: 'absolute', left, bottom: 4, transform: `rotate(${rot}deg)`, transformOrigin: '50% 140%', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.45))' }}>
            <TicketArt width={width} />
          </span>
        );
      })}
    </div>
  );
}

/**
 * O painel do Salão: o leque, a contagem, a contagem regressiva do lote que vence primeiro e o botão de comprar
 * (1 energia → 3 tickets). `nudge` > 0 = o jogador tentou jogar sem ticket: o aviso ganha destaque.
 */
export function TicketPanel({ language, status, onBuy, nudge = 0 }: { language: Language; status: (nowMs: number) => FunTicketStatus; onBuy?: () => void; nudge?: number }) {
  const isPt = language === 'pt-BR';
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  const st = status(Date.now()); // relógio lido a cada render: um lote recém-comprado nunca fica "no futuro"
  const hint = st.canBuy
    ? (isPt ? `${FUN_TICKET_COST} energia = ${FUN_TICKET_BATCH} tickets (valem 24 h)` : `${FUN_TICKET_COST} energy = ${FUN_TICKET_BATCH} tickets (good for 24 h)`)
    : st.buyRefusal === 'has-tickets'
      ? (isPt ? 'Você ainda tem tickets de sobra: compre mais quando restarem 2 ou menos.' : 'You still have plenty of tickets: buy more when 2 or fewer are left.')
      : (isPt ? 'Sem energia para comprar tickets agora. A energia volta com o tempo; que tal uma tarefa, o Ateliê da Mente ou o Refúgio?' : 'No energy to buy tickets right now. Energy comes back over time; how about a task, the Mind Atelier or the Refuge?');
  return (
    <section data-fun-tickets={st.count} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <TicketFan count={st.count} language={language} />
      <p className="sm2-num" data-fun-tickets-count style={{ margin: 0, fontWeight: 600 }}>
        {isPt ? `Tickets: ${st.count}/${FUN_TICKET_MAX}` : `Tickets: ${st.count}/${FUN_TICKET_MAX}`}
        {st.count > 0 && <span data-fun-tickets-expiry style={{ fontWeight: 400, marginInlineStart: 8 }}>{isPt ? `vence em ${formatHms(st.msLeft)}` : `expires in ${formatHms(st.msLeft)}`}</span>}
      </p>
      {st.count === 0 && nudge > 0 && (
        <p key={nudge} role="alert" data-fun-tickets-nudged style={{ margin: 0, padding: 8, borderRadius: 8, outline: '2px solid currentColor', textAlign: 'center' }}>
          {isPt ? 'Sem tickets. Compre um lote para jogar.' : 'No tickets. Buy a batch to play.'}
        </p>
      )}
      {onBuy && (
        <button type="button" data-fun-tickets-buy disabled={!st.canBuy} aria-disabled={!st.canBuy} onClick={onBuy} style={{ ...sm2Button('primary', !st.canBuy), minHeight: 44 }}>
          {isPt ? `Comprar ${FUN_TICKET_BATCH} tickets` : `Buy ${FUN_TICKET_BATCH} tickets`}
          <EnergyCost amount={FUN_TICKET_COST} />
        </button>
      )}
      <p data-fun-tickets-hint style={{ ...sm2Hint, margin: 0, opacity: 0.8, textAlign: 'center' }}>{hint}</p>
    </section>
  );
}
