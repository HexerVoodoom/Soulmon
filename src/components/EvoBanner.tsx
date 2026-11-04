/**
 * A FAIXA DE EVOLUÇÕES (04/11/2026, pedido do dono): uma tira logo abaixo da linha do voltar que rola "<jogador> acabou de evoluir <criatura> para o nível
 * <forma> através da <alinhamento>". Feed GLOBAL (`getEvoFeed`, só quem está na lista pública — ver `functions/api/_evoFeed.js`) + o aviso LOCAL da própria
 * evolução (na hora, sem esperar a rede). Vários avisos entram em FILA, um por vez. Não captura toque (`pointer-events: none`). Movimento reduzido:
 * a frase fica parada alguns segundos e passa para a próxima. O que já passou neste aparelho não volta (`EVO_SEEN_AT`), nem aviso com mais de 1 h. Sem aviso na fila, a faixa não ocupa lugar.
 */
import { useEffect, useRef, useState } from 'react';
import { enqueueEvo, evoText, freshEvoEvents, isEvoStep, parseEvoStage, sanitizeEvoEvents, type EvoEvent } from '../utils/evoFeed';
import { readNumber, writeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

const POLL_MS = 3 * 60 * 1000;
const STATIC_MS = 6000;

export interface EvoBannerProps {
  language: string;
  /** Estágio atual (`evolutionStage`): quando SOBE, o aviso local nasce. */
  stage: string | undefined;
  playerName: string;
  petName: string;
  /** Busca o feed global (injetável nos testes). */
  fetchFeed?: () => Promise<unknown>;
  reducedMotion?: boolean;
  now?: () => number;
}

const reduced = () => { try { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const evoKeyOf = (e: EvoEvent) => `${e.name}|${e.pet}|${e.tier}|${e.at}`;

export default function EvoBanner({ language, stage, playerName, petName, fetchFeed, reducedMotion, now = Date.now }: EvoBannerProps) {
  const isPt = language === 'pt-BR';
  const [queue, setQueue] = useState<EvoEvent[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const prevStage = useRef<string | undefined>(stage);
  const still = reducedMotion ?? reduced();

  const push = (evs: EvoEvent[]) => setQueue((q) => { const r = enqueueEvo(q, seen.current, evs); seen.current = r.seen; return r.queue; });

  // aviso local: só quando o estágio SOBE depois do carregamento (a hidratação inicial não conta)
  useEffect(() => {
    const before = prevStage.current;
    prevStage.current = stage;
    if (!before || !stage || before === stage || !isEvoStep(before, stage)) return;
    const s = parseEvoStage(stage);
    if (s && playerName && petName) push([{ name: playerName, pet: petName, tier: s.tier, branch: s.branch, at: now(), local: true }]);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // feed global: ao montar e a cada POLL_MS com a aba visível
  useEffect(() => {
    if (!fetchFeed) return;
    let vivo = true;
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchFeed().then((r) => {
        if (!vivo) return;
        push(freshEvoEvents(sanitizeEvoEvents((r as { events?: unknown } | null)?.events), readNumber(STORAGE_KEYS.EVO_SEEN_AT, 0), now(), playerName));
      }).catch(() => {});
    };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => { vivo = false; clearInterval(t); };
  }, [fetchFeed]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = queue[0];
  const next = () => setQueue((q) => q.slice(1));
  // Entrou na tira = visto. A fila anda do mais velho para o mais novo: fechar no meio deixa só os seguintes para a próxima abertura.
  useEffect(() => {
    if (head && !head.local && head.at > readNumber(STORAGE_KEYS.EVO_SEEN_AT, 0)) writeLocal(STORAGE_KEYS.EVO_SEEN_AT, String(head.at));
  }, [head]);
  useEffect(() => {
    if (!head || !still) return;
    const t = setTimeout(next, STATIC_MS);
    return () => clearTimeout(t);
  }, [head, still]);

  if (!head) return null;
  const text = evoText(head, isPt);
  return (
    <div data-evo-banner data-motion={still ? 'reduced' : 'full'} role="status" aria-live="polite"
      style={{ position: 'relative', overflow: 'hidden', height: 24, margin: '0 0 var(--sm2-space-2)', pointerEvents: 'none', borderRadius: 999,
        background: 'color-mix(in srgb, #06171A 82%, transparent)', border: '1px solid rgba(200, 150, 80, .75)', color: '#E9F5F2',
        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', lineHeight: '22px', whiteSpace: 'nowrap' }}>
      {still
        ? <span data-evo-text style={{ display: 'block', textAlign: 'center', padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
        : <span key={evoKeyOf(head)} data-evo-text className="sm2-evo-run" onAnimationEnd={next}>{text}</span>}
    </div>
  );
}
