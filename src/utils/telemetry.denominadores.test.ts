// @vitest-environment jsdom
/**
 * WP0.13 (`haunted_done`) e WP0.14 (`checkin_shown`) — os dois numeradores/
 * denominadores que faltavam.
 *
 * O estudo da medição achou 31 metas declaradas no guia e só 9 calculáveis. Boa
 * parte do resto não precisava de coorte nem de decisão do dono: faltava o
 * OUTRO LADO da fração. `checkin_commit` existe desde o WP2.3 e não tinha
 * denominador — "80% assumem a meta" não é calculável sem saber a quantas
 * pessoas o ritual foi oferecido, e uma taxa sem denominador decide errado com
 * toda a confiança do mundo. `haunted_done` é o numerador da pergunta que dá
 * nome à peça mais Soulmon do plano: a pilha de culpa virou loop de jogo?
 *
 * Nenhum dos dois carrega propriedade nenhuma — nem nome de tarefa, nem tier.
 * O fato é o dado.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  track, pendingTelemetry, resetTelemetryForTest, EVENT_SCHEMA, TELEMETRY_EVENTS,
} from './telemetry';

const app = () => readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
const only = (e: string) => pendingTelemetry().filter(r => r.e === e);

/** Mesmo molde do `telemetry.test.ts`: a fila mora no localStorage. */
function installMemoryStorage() {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
      setItem: (k: string, v: string) => { map.set(k, String(v)); },
      removeItem: (k: string) => { map.delete(k); },
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() { return map.size; },
    },
  });
}

describe('haunted_done / checkin_shown — forma (WP0.13, WP0.14)', () => {
  beforeEach(() => { installMemoryStorage(); resetTelemetryForTest(); });

  it('os dois estão declarados e não carregam propriedade nenhuma', () => {
    for (const e of ['haunted_done', 'checkin_shown'] as const) {
      expect(TELEMETRY_EVENTS).toContain(e);
      expect(EVENT_SCHEMA[e], `${e} não pode ter props`).toBeNull();
    }
  });

  it('propriedade num evento sem schema RECUSA o evento inteiro, não o limpa', () => {
    // `sanitizeEvent` é estrito de propósito: prop onde não devia haver prop é
    // erro de fiação (ou alguém anexando dado), e ignorar em silêncio deixaria
    // o defeito vivo. Aqui isso é contrato, não detalhe.
    track('haunted_done', { tier: 1 } as never);
    expect(only('haunted_done')).toHaveLength(0);
    // Sem prop nenhuma, o mesmo evento passa.
    track('haunted_done');
    const [rec] = only('haunted_done');
    expect(rec).toBeTruthy();
    expect(rec.p).toBeUndefined();
  });

  it('o dedupe de fila vale para TODO membro de ONCE_PER_DAY, não só `day_active`', () => {
    // A trava desta generalização: a lista e o comportamento não podem divergir.
    const fonte = readFileSync(resolve(process.cwd(), 'src/utils/telemetry.ts'), 'utf-8');
    expect(fonte).toMatch(/ONCE_PER_DAY\.includes\(record\.e\)/);
    expect(fonte, 'voltou a checar um evento literal').not.toMatch(/record\.e === 'day_active'\) \{/);
  });

  it('`checkin_shown` conta UMA vez por dia, mesmo chamado várias vezes', () => {
    track('checkin_shown');
    track('checkin_shown');
    track('checkin_shown');
    expect(only('checkin_shown')).toHaveLength(1);
  });

  it('`haunted_done` NÃO é deduplicado — várias no mesmo dia é o dado', () => {
    track('haunted_done');
    track('haunted_done');
    expect(only('haunted_done')).toHaveLength(2);
  });

  it('dias diferentes contam separado para o denominador do check-in', () => {
    track('checkin_shown', undefined, '2026-09-06');
    track('checkin_shown', undefined, '2026-09-07');
    expect(only('checkin_shown')).toHaveLength(2);
  });
});

describe('haunted_done / checkin_shown — fiação (WP0.13, WP0.14)', () => {
  it('`haunted_done` só sai quando a tarefa estava assombrada, e fora do updater', () => {
    const src = app();
    const emissoes = src.match(/track\('haunted_done'/g) ?? [];
    expect(emissoes, 'um emissor, não vários').toHaveLength(1);
    const i = src.indexOf("track('haunted_done'");
    // A linha imediatamente anterior é o gate; o `relief` é calculado acima dela.
    const antes = src.slice(src.lastIndexOf('const relief', i), i);
    expect(antes).toMatch(/isHaunted\(task/);
    expect(src.slice(i - 40, i)).toMatch(/if \(relief\)/);
    // E não pode estar dentro de `setGameState(prev => …)` (footgun 6).
    const updaterAntes = src.lastIndexOf('setGameState(prev', i);
    const fechaUpdater = src.indexOf('}));', updaterAntes);
    expect(fechaUpdater, 'o emissor caiu dentro de um updater').toBeLessThan(i);
  });

  it('`checkin_shown` sai DEPOIS de todos os gates do ritual, uma vez só', () => {
    const src = app();
    const emissoes = src.match(/track\('checkin_shown'/g) ?? [];
    expect(emissoes).toHaveLength(1);
    const i = src.indexOf("track('checkin_shown'");
    const efeito = src.slice(src.lastIndexOf('const checkInPromptedRef', i), i);
    // Os três gates que decidem se a oferta chega à tela ficam ANTES dele.
    expect(efeito).toMatch(/if \(!needsCheckIn\(gameState, now\)\) return;/);
    expect(efeito).toMatch(/hasCompletedOnboarding/);
    expect(efeito).toMatch(/plan\.habitsToday\.length === 0/);
    // E o modal abre DEPOIS: contar a oferta que não apareceu infla o denominador.
    expect(src.slice(i, i + 260)).toMatch(/setCheckInPlanData\(plan\)/);
  });

  it('nenhum dos dois é emitido de dentro do confirm do check-in', () => {
    const src = app();
    const ini = src.indexOf('const handleCheckInConfirm');
    const fim = src.indexOf('const handleCheckInSkip');
    const corpo = src.slice(ini, fim);
    expect(corpo).not.toMatch(/checkin_shown|haunted_done/);
  });
});
