import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  WAKE_ALL_ACTIONS, WAKE_BLOCKED_ACTIONS, WAKE_BLOCKED_GAMES, WAKE_BLOCKED_PET, WAKE_NEVER_BLOCKED,
  dayWakePending, didCompleteToday, isBlockedUntilWake, wakeWarning, wakesByCompletion,
} from './dayWake';
import { applyPoopDrain } from './poopDrain';

const app = readFileSync('src/App.tsx', 'utf8');
const areaView = readFileSync('src/components/nav/AreaView.tsx', 'utf8');

/** O corpo de uma função/`useCallback` do App, do início da declaração até o fim do bloco (por contagem de chaves). */
function corpo(src: string, assinatura: string): string {
  const i = src.indexOf(assinatura);
  expect(i, `não achei: ${assinatura}`).toBeGreaterThan(-1);
  let abre = src.indexOf('{', src.indexOf('=>', i));
  let depth = 0;
  for (let k = abre; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error('bloco não fechou');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// D-66/D-67 (REGISTRO 110): acordar o Soulmon é estado de APRESENTAÇÃO; só pet e jogos param; tarefa/hábito nunca.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
describe('dayWakePending — dormindo para acordar, 1ª abertura de CADA dia, para todos (R1)', () => {
  const base = { active: true, today: '2026-10-19', wokeDay: '2026-10-18', bornToday: false };

  it('dia novo sem a marca de hoje: dormindo; com a marca de hoje: acordado', () => {
    expect(dayWakePending(base)).toBe(true);
    expect(dayWakePending({ ...base, wokeDay: null })).toBe(true);
    expect(dayWakePending({ ...base, wokeDay: '2026-10-19' })).toBe(false);
  });

  it('vale para TODOS (não depende de janela de descanso): a única entrada é o dia', () => {
    // a função não recebe nenhum dado de sono/descanso — quem não usa a janela também dorme na 1ª abertura do dia
    expect(Object.keys(base).sort()).toEqual(['active', 'bornToday', 'today', 'wokeDay']);
    expect(dayWakePending({ ...base, wokeDay: '2026-10-01' })).toBe(true);
  });

  it('virou o dia: acordado ontem não vale hoje', () => {
    expect(dayWakePending({ ...base, today: '2026-10-20', wokeDay: '2026-10-19' })).toBe(true);
  });

  it('antes do onboarding/tutorial e no dia do nascimento não há o que acordar', () => {
    expect(dayWakePending({ ...base, active: false })).toBe(false);
    expect(dayWakePending({ ...base, bornToday: true })).toBe(false);
  });
});

describe('D-67 — a lista EXATA do que o aviso "acorde o Soulmon" segura', () => {
  it('pet (alimentar, banho, carinho, brincar) + jogos (Masmorra e minijogos do Salão/Ateliê da Mente): nada além disso', () => {
    expect([...WAKE_BLOCKED_PET]).toEqual(['feed', 'shower', 'pet', 'play']);
    expect([...WAKE_BLOCKED_GAMES]).toEqual(['masmorra', 'dino', 'ppt', 'match3', 'eco', 'bolhas', 'troca', 'picross', 'revisao', 'zip', 'patches']);
    expect([...WAKE_BLOCKED_ACTIONS]).toEqual([...WAKE_BLOCKED_PET, ...WAKE_BLOCKED_GAMES]);
    expect([...WAKE_ALL_ACTIONS]).toEqual([...WAKE_BLOCKED_ACTIONS]);
  });

  it('com o Soulmon dormindo, cada ação da lista para; acordado, nenhuma para', () => {
    for (const a of WAKE_BLOCKED_ACTIONS) {
      expect(isBlockedUntilWake(a, true), a).toBe(true);
      expect(isBlockedUntilWake(a, false), a).toBe(false);
    }
  });

  it('concluir tarefa/hábito NUNCA para (G-01), dormindo ou não; navegar, criar, editar e o Refúgio também não', () => {
    for (const a of WAKE_NEVER_BLOCKED) {
      expect(isBlockedUntilWake(a, true), a).toBe(false);
      expect(isBlockedUntilWake(a, false), a).toBe(false);
      expect((WAKE_BLOCKED_ACTIONS as readonly string[]).includes(a), a).toBe(false);
    }
    for (const a of ['completeTask', 'completeHabit', 'toggleTaskStep']) expect((WAKE_NEVER_BLOCKED as readonly string[]).includes(a)).toBe(true);
    // o Refúgio (respiração, bolhas calmas) não paga nem pontua: fica de fora da lista
    expect(isBlockedUntilWake('respiracao', true)).toBe(false);
    expect(isBlockedUntilWake('bolhas-calmas', true)).toBe(false);
    // id desconhecido nunca para (a lista é fechada: parar algo novo é decisão do dono)
    expect(isBlockedUntilWake('qualquer-outra-coisa', true)).toBe(false);
  });

  it('o aviso é curto, uma frase, com atalho "Acordar", e NÃO usa palavra de culpa/medo/cobrança (PT e EN)', () => {
    const PROIBIDAS_PT = ['deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu', 'finalmente', 'até que enfim', 'preguiç', 'desculpa', 'culpa', 'perdeu', 'medo', 'cobr', 'pena', 'urgente'];
    const PROIBIDAS_EN = [/should/, /late/, /failed/, /failure/, /you forgot/, /finally/, /at last/, /lazy/, /excuse/, /guilt/, /lost/, /fear/, /afraid/, /penalt/, /punish/, /urgent/, /hurry/];
    for (const isPt of [true, false]) {
      const w = wakeWarning(isPt);
      expect(w.text.split(/\s+/).length).toBeLessThanOrEqual(6);
      expect(w.text.endsWith('.')).toBe(true);
      expect(w.text.match(/[.!?]/g)).toHaveLength(1);
      expect(w.action).toBe(isPt ? 'Acordar' : 'Wake');
      const low = w.text.toLowerCase();
      if (isPt) for (const p of PROIBIDAS_PT) expect(low, p).not.toContain(p);
      else for (const p of PROIBIDAS_EN) expect(low, String(p)).not.toMatch(p);
      expect(w.text).not.toMatch(/\d/); // nunca custo, perda ou contagem
    }
  });
});

describe('D-67 — tarefa/hábito nunca bloqueados, nos 3 caminhos (app, widget Android, overlay desktop)', () => {
  it('APP: as 3 funções de conclusão não consultam o bloqueio; o guard só aparece nos 4 handlers de pet e no `start` dos jogos', () => {
    for (const assinatura of ['const handleToggleActivityCompletion = (', 'const handleToggleTask = (', 'const handleToggleTaskStep = (']) {
      const c = corpo(app, assinatura);
      expect(c, assinatura).not.toMatch(/guardWake|isBlockedUntilWake|dayWakePending|wakeGuard/);
    }
    // o guard (`guardWake(`) é chamado SÓ pelos handlers do pet (feed, shower, play, pet)
    const chamadas = [...app.matchAll(/guardWake\('([a-z0-9-]+)'\)/g)].map(m => m[1]).sort();
    expect(chamadas).toEqual(['feed', 'pet', 'play', 'shower']);
    // e os jogos, por `wakeGuard` (prop) no `start` do AreaView — nunca na navegação
    expect(areaView).toContain('const start = (g: PlayGame) => { if (props.wakeGuard?.(g)) return; setSheet(null); setGame(g); };');
    expect((areaView.match(/wakeGuard/g) ?? []).length).toBe(2); // declaração da prop + o uso no `start`
    expect(app).toContain('wakeGuard={guardWake}');
  });

  it('APP: concluir acorda sozinho, lido do SAVE (vale também para o que o widget e o desktop concluíram sem abrir a Home)', () => {
    expect(app).toMatch(/wakesByCompletion\(dayWakePending && !rolloverPending, concluiuHoje\)\) \{\s*setCompletionWokeAt\(Date\.now\(\)\);\s*markDayAwake\(\);/);
    expect(app).toContain('const concluiuHoje = useMemo(() => didCompleteToday(gameState, new Date()), [gameState]);');
  });

  it('WIDGET ANDROID e OVERLAY DESKTOP: nenhum deles importa ou consulta o gate (concluir é sempre livre ali)', () => {
    const arquivos: string[] = [];
    const varre = (dir: string, exts: string[]) => {
      for (const nome of readdirSync(dir)) {
        if (nome === 'node_modules' || nome === 'build' || nome === 'dist') continue;
        const p = join(dir, nome);
        const st = statSync(p);
        if (st.isDirectory()) varre(p, exts);
        else if (exts.some(e => nome.endsWith(e))) arquivos.push(p);
      }
    };
    varre('desktop/renderer/src', ['.ts']);
    varre('desktop/electron', ['.js']);
    varre('android/app/src/main/java', ['.kt']);
    arquivos.push('src/plugins/SoulmonWidgetPlugin.ts');
    expect(arquivos.length).toBeGreaterThan(10);
    for (const f of arquivos) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/dayWake|wakeGuard|guardWake|isBlockedUntilWake|soulmon-day-woke|DAY_WOKE/);
    }
  });

  it('o sinal de "concluiu hoje" é lido do save: tarefa marcada, tarefa já arquivada hoje, hábito feito, hábito em etapas completo', () => {
    const agora = new Date('2026-10-19T09:00:00');
    const ontem = new Date('2026-10-18T20:00:00').toISOString();
    expect(didCompleteToday({}, agora)).toBe(false);
    expect(didCompleteToday({ completedTasks: [{ completedAt: ontem }] }, agora)).toBe(false); // ontem não acorda hoje
    expect(didCompleteToday({ tasks: [{ completed: true }] }, agora)).toBe(true);
    expect(didCompleteToday({ completedTasks: [{ completedAt: agora.toISOString() }] }, agora)).toBe(true);
    expect(didCompleteToday({ activities: [{ completedToday: true, lastCompletedDate: agora.toDateString() }] }, agora)).toBe(true);
    expect(didCompleteToday({ activities: [{ completedToday: true, lastCompletedDate: 'Sun Oct 18 2026' }] }, agora)).toBe(false);
    expect(didCompleteToday({ activities: [{ steps: [{ completed: true }, { completed: true }] }] }, agora)).toBe(true);
    expect(didCompleteToday({ activities: [{ steps: [{ completed: true }, { completed: false }] }] }, agora)).toBe(false);
  });

  it('acordar por tarefa só acontece com o Soulmon dormindo e a virada do dia já resolvida', () => {
    expect(wakesByCompletion(true, true)).toBe(true);
    expect(wakesByCompletion(true, false)).toBe(false);
    expect(wakesByCompletion(false, true)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// K-20 — um despertar diário NÃO pode virar punição nem mexer no dreno, no cocô nem na janela de descanso.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
describe('K-20 — o despertar diário é só apresentação: dreno, cocô e janela de descanso seguem lendo o sono REAL', () => {
  it('o dreno do cocô recebe o `isSleeping` REAL, nunca o estado de acordar', () => {
    expect(app).toContain('setGameState(prev => applyPoopDrain(prev, { now, isSleeping }));');
    expect(app).toMatch(/useCareSystem\(\{[^}]*isSleeping,[^}]*\}\)/s);
    expect(app).not.toMatch(/applyPoopDrain\([^)]*dayWake/);
  });

  it('`dayWakePending` só aparece onde deve: HUD (desenho), fila (holdDayStart), guard, gesto, auto-acordar por tarefa — nunca em dreno, cocô, noite ou janela', () => {
    const linhas = app.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(x => /dayWakePending/.test(x.l));
    expect(linhas.length).toBeGreaterThan(5);
    for (const { l, n } of linhas) {
      expect(l, `App.tsx:${n}`).not.toMatch(/applyPoopDrain|useCareSystem|recordNight|createRestState|isWithinWindow|poopEvents|careEvent|healthPoints|setGameState|awardBondXP/);
    }
    // o que NÃO muda: o sono real alimenta o resto
    expect(app).toContain('isSleeping={isSleeping || dayWakePending}');
    expect((app.match(/isSleeping=\{isSleeping\}/g) ?? []).length).toBe(1); // NotificationManager continua no sono REAL
  });

  it('o gesto de acordar só grava a marca LOCAL do dia: não deita o pet, não grava noite, não paga nada, não toca o save', () => {
    const marca = corpo(app, 'const markDayAwake = useCallback(');
    expect(marca).toContain('writeLocal(STORAGE_KEYS.DAY_WOKE, hoje, { silent: true });');
    expect(marca).toContain('setDayWokeDay(hoje);');
    expect(marca).not.toMatch(/setGameState|setIsSleeping|recordNight|awardBondXP|IS_SLEEPING|SLEEP_STARTED_AT/);
    // no `handleSleep`: com o pet acordado de verdade, o gesto retorna ANTES de qualquer `setIsSleeping`
    const gesto = corpo(app, 'const handleSleep = useCallback(');
    const ate = gesto.slice(0, gesto.indexOf('setIsSleeping(prev =>'));
    expect(ate).toContain('markDayAwake();');
    expect(ate).toContain("if (!isSleeping) { falar('wake'); return; }");
    expect(ate).not.toMatch(/playSleep|recordNight|setGameState/);
  });

  it('o despertar e o gesto são MUDOS (superfície nova nasce muda): nenhum som no caminho de acordar', () => {
    const gesto = corpo(app, 'const handleSleep = useCallback(');
    const pendente = gesto.slice(gesto.indexOf('const acordandoDoDia'), gesto.indexOf('setIsSleeping(prev =>'));
    expect(pendente).not.toMatch(/play[A-Z]\w*\(/);
    const guard = corpo(app, 'const guardWake = useCallback(');
    expect(guard).not.toMatch(/play[A-Z]\w*\(/);
    const mod = readFileSync('src/utils/dayWake.ts', 'utf8');
    expect(mod).not.toMatch(/from '.*(audio|sound|trilha|musica|som)/i);
  });

  it('a noite sem registro continua NEUTRA: acordar não grava noite; o registro da noite segue preso à mudança do sono real (`isSleeping`)', () => {
    // o efeito que grava a noite lê `isSleeping` (o sono REAL) e nenhum outro estado
    const i = app.indexOf('const sleepStateRef = useRef<boolean | null>(null);');
    const efeito = app.slice(i, app.indexOf('}, [isSleeping, setGameState]);', i));
    expect(efeito).not.toMatch(/dayWake|dayWokeDay|markDayAwake/);
    expect(efeito).toContain('recordNight');
  });

  it('o dreno do cocô é o mesmo com o Soulmon "dormindo para acordar" ou não: o estado de acordar nem é entrada dele', () => {
    // `applyPoopDrain` só conhece `{ now, isSleeping }`; um estado sem cocô e o relógio parado devolvem a MESMA referência
    const estado = { poopEventsShown: [], poopEventsCompleted: [], poopPenaltyClockAt: 0, healthPoints: 3, maxHealthPoints: 3 } as never;
    const agora = Date.now();
    const a = applyPoopDrain(estado, { now: agora, isSleeping: false });
    const b = applyPoopDrain(estado, { now: agora, isSleeping: false });
    expect(a).toBe(b);
    expect(a).toBe(estado);
    expect(applyPoopDrain.length).toBe(2);
  });

  it('a fila de apresentação é a ÚNICA a ler o estado de acordar para segurar o início de dia (`holdDayStart`), e o pesadelo entra logo depois', () => {
    expect(app).toMatch(/holdDayStart: dayWakePending,/);
    expect((app.match(/holdDayStart/g) ?? []).length).toBe(1);
  });
});
