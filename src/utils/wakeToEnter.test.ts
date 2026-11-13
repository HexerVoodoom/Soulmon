import { describe, it, expect } from 'vitest';
import {
  SLEEP_ACTION_LOTS, SLEEP_BLOCKED_ACTIONS, SLEEP_BLOCKED_GAMES, SLEEP_BLOCKED_LOTS, SLEEP_NEVER_BLOCKED,
  entryNeedsSoulmon, isAsleep, lotEntryAsks, needsWakeToEnter, sleepBlocksLot, wakePromptCopy,
} from './wakeToEnter';
import { WAKE_BLOCKED_GAMES } from './dayWake';
import { BUILDING_GATES } from './gates';

const DORMINDO = { isSleeping: true, dayWakePending: false };
const DIA = { isSleeping: false, dayWakePending: true };
const ACORDADO = { isSleeping: false, dayWakePending: false };

describe('§329 — Soulmon dormindo pergunta antes de entrar numa atividade', () => {
  it('dormindo = sono real OU à espera do "Acordar" do dia; acordado = nenhum', () => {
    expect(isAsleep(DORMINDO)).toBe(true);
    expect(isAsleep(DIA)).toBe(true);
    expect(isAsleep(ACORDADO)).toBe(false);
  });

  it('cada tipo de entrada pergunta dormindo e segue acordado', () => {
    const entradas = [...SLEEP_BLOCKED_LOTS, ...SLEEP_ACTION_LOTS, ...SLEEP_BLOCKED_GAMES, ...SLEEP_BLOCKED_ACTIONS];
    expect(entradas).toEqual(expect.arrayContaining([
      'arena.duelo', 'arena.torneio', 'arena.guerra', 'exploracao.fenda', 'exploracao.dungeon', 'exploracao.passeio',
      'forja.oficina', 'hall.feira', 'hall.grove', 'masmorra', 'dino', 'match3', 'eco', 'treino', 'missao',
    ]));
    for (const e of entradas) {
      expect(needsWakeToEnter(e, DORMINDO), e).toBe(true);
      expect(needsWakeToEnter(e, DIA), e).toBe(true);
      expect(needsWakeToEnter(e, ACORDADO), e).toBe(false);
    }
  });

  it('emenda do dono (13/11): Torneio, Guerra, Feira e Grove (e as outras folhas com leitura) entram livres; só o Calabouço pergunta na porta', () => {
    expect([...SLEEP_BLOCKED_LOTS]).toEqual(['exploracao.dungeon']);
    for (const e of ['arena.torneio', 'arena.guerra', 'hall.feira', 'hall.grove', 'arena.duelo', 'exploracao.fenda', 'exploracao.passeio', 'forja.oficina']) {
      expect(SLEEP_ACTION_LOTS, e).toContain(e);
      expect(lotEntryAsks(e), e).toBe(false); // a porta é livre
      expect(needsWakeToEnter(e, DORMINDO), e).toBe(true); // o botão de lutar/agir pergunta
    }
    const [area, lote] = 'arena.torneio'.split('.');
    expect(sleepBlocksLot(area, lote, DORMINDO)).toBe(false);
    expect(sleepBlocksLot('exploracao', 'dungeon', DORMINDO)).toBe(true);
    expect(sleepBlocksLot('exploracao', 'dungeon', ACORDADO)).toBe(false);
  });

  it('a Vesca (Laboratório) e a Hexsmith seguem livres', () => {
    for (const e of ['laboratorio.evolucao', 'laboratorio.pet', 'laboratorio.stats', 'laboratorio.perfil', 'laboratorio.biblioteca', 'forja.hexsmith']) {
      expect(SLEEP_NEVER_BLOCKED, e).toContain(e);
      expect(needsWakeToEnter(e, DORMINDO), e).toBe(false);
    }
  });

  it('Home, Mapa, lojas, Biblioteca, Laboratório, Forja de equipar, Refúgio e tarefa NUNCA perguntam', () => {
    for (const e of SLEEP_NEVER_BLOCKED) {
      expect(needsWakeToEnter(e, DORMINDO), e).toBe(false);
      expect(needsWakeToEnter(e, DIA), e).toBe(false);
    }
    expect(sleepBlocksLot('mercado', 'itens', DORMINDO)).toBe(false);
    expect(sleepBlocksLot('laboratorio', 'biblioteca', DORMINDO)).toBe(false);
    expect(sleepBlocksLot('arena', 'duelo', DORMINDO)).toBe(false); // a folha entra; LUTAR pergunta
    expect(sleepBlocksLot('arena', null, DORMINDO)).toBe(false);
  });

  it('todo prédio do Mapa está em EXATAMENTE uma lista: porta, ação ou livre (decidido, não esquecido)', () => {
    for (const id of Object.keys(BUILDING_GATES)) {
      const em = [SLEEP_BLOCKED_LOTS, SLEEP_ACTION_LOTS, SLEEP_NEVER_BLOCKED].filter(l => l.includes(id)).length;
      expect(em, id).toBe(1);
    }
    for (const l of [SLEEP_BLOCKED_LOTS, SLEEP_ACTION_LOTS]) for (const e of l) expect(Object.keys(BUILDING_GATES), e).toContain(e);
    expect(entryNeedsSoulmon('qualquer-coisa')).toBe(false); // entrada desconhecida segue livre
  });

  it('os jogos são a MESMA lista do §112 (sem cópia), e o Refúgio fica de fora', () => {
    expect(SLEEP_BLOCKED_GAMES).toBe(WAKE_BLOCKED_GAMES);
    for (const g of ['respiracao', 'bolhas-calmas', 'chama']) expect(needsWakeToEnter(g, DORMINDO), g).toBe(false);
  });

  it('o texto: a pergunta do dono; o efeito só no sono real; sem culpa, sem veredito, sem número', () => {
    const pt = wakePromptCopy(true, true);
    expect(pt.question).toBe('Seu Soulmon está dormindo. Quer acordá-lo?');
    expect(pt.wake).toBe('Acordar');
    expect(pt.later).toBe('Agora não');
    expect(pt.effect).toMatch(/energia/);
    expect(wakePromptCopy(true, false).effect).toBeNull(); // acordar do início de dia não muda nada: não diz nada
    expect(wakePromptCopy(false, false).effect).toBeNull();
    const en = wakePromptCopy(false, true);
    expect(en.question).toBe('Your Soulmon is sleeping. Want to wake it up?');
    expect(en.wake).toBe('Wake up');
    expect(en.later).toBe('Not now');
    const PROIBIDAS_PT = ['deveria', 'devia', 'atrasou', 'falhou', 'falha', 'esqueceu', 'finalmente', 'preguiç', 'culpa', 'perdeu', 'perde', 'medo', 'cobr', 'pena', 'urgente', 'castigo', 'puni'];
    const PROIBIDAS_EN = [/should/, /late/, /fail/, /forgot/, /finally/, /lazy/, /guilt/, /lost/, /lose/, /fear/, /penalt/, /punish/, /urgent/, /hurry/];
    for (const realSleep of [true, false]) {
      const p = wakePromptCopy(true, realSleep);
      const e = wakePromptCopy(false, realSleep);
      const tp = [p.title, p.question, p.effect ?? '', p.wake, p.later].join(' ').toLowerCase();
      const te = [e.title, e.question, e.effect ?? '', e.wake, e.later].join(' ').toLowerCase();
      for (const w of PROIBIDAS_PT) expect(tp, w).not.toContain(w);
      for (const r of PROIBIDAS_EN) expect(te, String(r)).not.toMatch(r);
      expect(tp + te).not.toMatch(/\d/);
    }
  });
});
