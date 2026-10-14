import { describe, it, expect } from 'vitest';
import {
  PRESENTATION_IDLE, PRESENTATION_ORDER, isPresentationId, pickPresentation, presentationBacklog, presentationRank,
  runGuarded, withFailed, type PresentationId, type PresentationReady,
} from './presentationQueue';

const all = (ids: PresentationId[]): PresentationReady => Object.fromEntries(ids.map(i => [i, true]));

describe('a ORDEM da fila é explícita e única', () => {
  it('sem repetidos, o ocioso é o último e todo id é reconhecido', () => {
    expect(new Set(PRESENTATION_ORDER).size).toBe(PRESENTATION_ORDER.length);
    expect(PRESENTATION_ORDER[PRESENTATION_ORDER.length - 1]).toBe(PRESENTATION_IDLE);
    for (const id of PRESENTATION_ORDER) expect(isPresentationId(id)).toBe(true);
    expect(isPresentationId('nope')).toBe(false);
  });

  it('prioridade do dono: level-up > resumo do dia > intro de NPC/mapa > metas/compromisso > avisos leves', () => {
    const r = presentationRank;
    expect(r('levelUp')).toBeLessThan(r('dailyReport'));
    expect(r('dailyReport')).toBeLessThan(r('buildingIntro'));
    expect(r('buildingIntro')).toBeLessThan(r('catalogOnboarding'));
    expect(r('buildingIntro')).toBeLessThan(r('checkIn'));
    for (const leve of ['groveMilestone', 'dream', 'nightmare', 'catalogLevelInvite', 'restSetup'] as const) {
      expect(r('checkIn')).toBeLessThan(r(leve));
    }
  });
});

describe('pickPresentation: UM por vez', () => {
  it('ninguém pronto = ocioso', () => {
    expect(pickPresentation({})).toBe(PRESENTATION_IDLE);
  });

  it('com vários prontos entra o mais prioritário; o resto espera', () => {
    const ready = all(['checkIn', 'buildingIntro', 'dailyReport', 'levelUp']);
    expect(pickPresentation(ready)).toBe('levelUp');
    expect(presentationBacklog(ready)).toEqual(['levelUp', 'dailyReport', 'buildingIntro', 'checkIn']);
  });

  it('quando o atual fecha, entra o próximo mais prioritário (a sequência inteira, sem pular nem repetir)', () => {
    const ready: PresentationReady = all(['checkIn', 'buildingIntro', 'dailyReport', 'levelUp', 'catalogOnboarding']);
    const vistos: PresentationId[] = [];
    let atual: PresentationId | null = null;
    for (let i = 0; i < 10; i++) {
      atual = pickPresentation(ready, atual);
      if (atual === PRESENTATION_IDLE) break;
      vistos.push(atual);
      ready[atual] = false; // fechou
    }
    expect(vistos).toEqual(['levelUp', 'dailyReport', 'buildingIntro', 'catalogOnboarding', 'checkIn']);
  });

  it('NÃO expulsa quem está na tela: um mais prioritário que fica pronto depois espera', () => {
    const ready: PresentationReady = all(['checkIn']);
    let atual = pickPresentation(ready, null);
    expect(atual).toBe('checkIn');
    ready.levelUp = true;
    ready.dailyReport = true;
    atual = pickPresentation(ready, atual);
    expect(atual).toBe('checkIn'); // o atual fica
    ready.checkIn = false; // fechou
    expect(pickPresentation(ready, atual)).toBe('levelUp');
  });

  it('o ocioso nunca é sticky: qualquer pronto o substitui', () => {
    expect(pickPresentation(all(['dream']), PRESENTATION_IDLE)).toBe('dream');
  });

  it('item que deixou de estar pronto sai da tela mesmo sem fechar (ex.: o evento sumiu)', () => {
    expect(pickPresentation(all(['dream']), 'checkIn')).toBe('dream');
  });
});

describe('item que falha NÃO trava a fila', () => {
  it('um id em `failed` é pulado e o próximo entra', () => {
    const ready = all(['levelUp', 'dailyReport']);
    let failed: ReadonlySet<PresentationId> = new Set();
    expect(pickPresentation(ready, null, failed)).toBe('levelUp');
    failed = withFailed(failed, 'levelUp');
    expect(pickPresentation(ready, 'levelUp', failed)).toBe('dailyReport');
    expect(presentationBacklog(ready, 'levelUp', failed)).toEqual(['dailyReport']);
  });

  it('`withFailed` é imutável e idempotente', () => {
    const a: ReadonlySet<PresentationId> = new Set();
    const b = withFailed(a, 'dream');
    expect(a.size).toBe(0);
    expect(b.has('dream')).toBe(true);
    expect(withFailed(b, 'dream')).toBe(b);
  });

  it('`runGuarded` engole o erro e diz que falhou', () => {
    expect(runGuarded(() => { throw new Error('boom'); })).toBe(false);
    expect(runGuarded(() => {})).toBe(true);
    expect(runGuarded(undefined)).toBe(true);
  });
});
