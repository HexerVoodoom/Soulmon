import { describe, it, expect } from 'vitest';
import {
  CELEBRATION_IDS, DAY_START_IDS, INVITE_IDS, PRESENTATION_IDLE, PRESENTATION_ORDER, START_OF_DAY_MODAL_CAP,
  countedModals, isDayStartActive, isPresentationId, pickPresentation, presentationBacklog, presentationDeferred,
  presentationRank, presentationSlotOf, runGuarded, withFailed, type PresentationContext, type PresentationId,
  type PresentationReady,
} from './presentationQueue';

const all = (ids: PresentationId[]): PresentationReady => Object.fromEntries(ids.map(i => [i, true]));

/**
 * Simula UMA abertura do app: a cada passo entra o que a fila escolhe, é "mostrado" (entra em `shown`) e fecha (deixa de estar
 * pronto). Devolve a sequência de telas. É o que o hook faz, sem o React.
 */
function sessao(ready0: PresentationReady, ctx0: PresentationContext = {}): PresentationId[] {
  const ready: PresentationReady = { ...ready0 };
  const shown = new Set<PresentationId>(ctx0.shown ?? []);
  const vistos: PresentationId[] = [];
  let atual: PresentationId | null = null;
  for (let i = 0; i < 30; i++) {
    atual = pickPresentation(ready, atual, undefined, { ...ctx0, shown });
    if (atual === PRESENTATION_IDLE) break;
    vistos.push(atual);
    shown.add(atual);
    ready[atual] = false; // fechou
  }
  return vistos;
}

describe('a ORDEM da fila é explícita e única', () => {
  it('sem repetidos, o ocioso é o último e todo id é reconhecido', () => {
    expect(new Set(PRESENTATION_ORDER).size).toBe(PRESENTATION_ORDER.length);
    expect(PRESENTATION_ORDER[PRESENTATION_ORDER.length - 1]).toBe(PRESENTATION_IDLE);
    for (const id of PRESENTATION_ORDER) expect(isPresentationId(id)).toBe(true);
    expect(isPresentationId('nope')).toBe(false);
  });

  it('prioridade do dono (D-64): pesadelo/sonho > resumo > intro de NPC/mapa > "Hoje" > celebrações > convites/config > balões', () => {
    const r = presentationRank;
    expect(r('triage')).toBeLessThan(r('nightmare'));
    expect(r('nightmare')).toBeLessThan(r('dream'));
    expect(r('dream')).toBeLessThan(r('dailyReport'));
    expect(r('dailyReport')).toBeLessThan(r('buildingIntro'));
    expect(r('buildingIntro')).toBeLessThan(r('catalogOnboarding'));
    expect(r('catalogOnboarding')).toBeLessThan(r('dayGoals'));
    expect(r('dayGoals')).toBeLessThan(r('checkIn'));
    for (const cel of CELEBRATION_IDS) expect(r('checkIn')).toBeLessThan(r(cel));
    for (const conv of INVITE_IDS) for (const cel of CELEBRATION_IDS) expect(r(cel)).toBeLessThan(r(conv));
    expect(r('restSetup')).toBeLessThan(r('unlockToast'));
  });
});

describe('pickPresentation: UM por vez', () => {
  it('ninguém pronto = ocioso', () => {
    expect(pickPresentation({})).toBe(PRESENTATION_IDLE);
  });

  it('com vários prontos entra o mais prioritário; o resto espera', () => {
    const ready = all(['checkIn', 'buildingIntro', 'dailyReport', 'levelUp']);
    expect(pickPresentation(ready)).toBe('dailyReport');
    expect(presentationBacklog(ready)).toEqual(['dailyReport', 'buildingIntro', 'checkIn', 'levelUp']);
  });

  it('quando o atual fecha, entra o próximo mais prioritário (a sequência inteira, sem pular nem repetir)', () => {
    const ready: PresentationReady = all(['checkIn', 'buildingIntro', 'dailyReport', 'levelUp', 'catalogOnboarding']);
    expect(sessao(ready)).toEqual(['dailyReport', 'buildingIntro', 'catalogOnboarding', 'checkIn', 'levelUp']);
  });

  it('NÃO expulsa quem está na tela: um mais prioritário que fica pronto depois espera', () => {
    const ready: PresentationReady = all(['checkIn']);
    let atual = pickPresentation(ready, null);
    expect(atual).toBe('checkIn');
    ready.dailyReport = true;
    ready.nightmare = true;
    atual = pickPresentation(ready, atual);
    expect(atual).toBe('checkIn'); // o atual fica
    ready.checkIn = false; // fechou
    expect(pickPresentation(ready, atual)).toBe('nightmare');
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
    const ready = all(['nightmare', 'dailyReport']);
    let failed: ReadonlySet<PresentationId> = new Set();
    expect(pickPresentation(ready, null, failed)).toBe('nightmare');
    failed = withFailed(failed, 'nightmare');
    expect(pickPresentation(ready, 'nightmare', failed)).toBe('dailyReport');
    expect(presentationBacklog(ready, 'nightmare', failed)).toEqual(['dailyReport']);
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

describe('D-64 — o INÍCIO DE DIA (REGISTRO §111): ordem e TETO de 3 modais', () => {
  /** A manhã com TUDO pronto ao mesmo tempo (o cenário do dono: "aparece muito modal e confuso"). */
  const TUDO: PresentationReady = all([
    'nightmare', 'dream', 'dailyReport', 'dayGoals', 'checkIn',
    'levelUp', 'evolveTask', 'groveMilestone', 'catalogLevelInvite', 'restSetup',
  ]);

  it('o teto é 3 e o início de dia tem 3 TELAS (sono, resumo, "Hoje")', () => {
    expect(START_OF_DAY_MODAL_CAP).toBe(3);
    expect(new Set(DAY_START_IDS.map(presentationSlotOf))).toEqual(new Set(['sono', 'dailyReport', 'hoje']));
  });

  it('manhã com tudo pronto: NO MÁXIMO 3 modais, na ordem pesadelo -> resumo -> "Hoje"; o resto fica para a próxima abertura', () => {
    const vistos = sessao(TUDO);
    expect(vistos).toEqual(['nightmare', 'dailyReport', 'dayGoals']);
    expect(vistos.length).toBeLessThanOrEqual(START_OF_DAY_MODAL_CAP);
    expect(countedModals(new Set(vistos))).toBe(3);
    // o que ficou de fora: o sonho (no lugar do pesadelo), celebrações (teto) e convites/config (fora do início de dia) — nada some, só espera
    const sobra: PresentationReady = { ...TUDO, nightmare: false, dailyReport: false, dayGoals: false, checkIn: false };
    expect(presentationDeferred(sobra, undefined, { shown: new Set(vistos) }).sort())
      .toEqual(['catalogLevelInvite', 'dream', 'evolveTask', 'groveMilestone', 'levelUp', 'restSetup'].sort());
  });

  it('pesadelo OU sonho, nunca os dois: com pesadelo o sonho não entra; sem pesadelo, o sonho entra no lugar', () => {
    expect(sessao(all(['nightmare', 'dream']))).toEqual(['nightmare']);
    expect(sessao(all(['dream']))).toEqual(['dream']);
    // mesmo que o sonho já tenha sido mostrado, o pesadelo não vem depois dele no mesmo despertar
    expect(sessao(all(['nightmare']), { shown: new Set<PresentationId>(['dream']) })).toEqual([]);
  });

  it('sem pesadelo: sonho -> resumo -> "Hoje" (3 telas) e as celebrações esperam', () => {
    expect(sessao(all(['dream', 'dailyReport', 'dayGoals', 'levelUp']))).toEqual(['dream', 'dailyReport', 'dayGoals']);
  });

  it('"Hoje" é UM modal: com `dayGoals` pronto OU já visto, o `checkIn` sozinho não entra (dayGoals + checkIn fundidos)', () => {
    expect(sessao(all(['dayGoals', 'checkIn']))).toEqual(['dayGoals']);
    expect(sessao(all(['checkIn']), { shown: new Set<PresentationId>(['dayGoals']) })).toEqual([]);
    // sem `dayGoals` (plano do dia já confirmado), o compromisso entra sozinho — ainda UMA tela
    expect(sessao(all(['checkIn']))).toEqual(['checkIn']);
  });

  it('sobrou vaga no teto (só 2 modais do início de dia): UMA celebração entra, as outras esperam', () => {
    expect(sessao(all(['dailyReport', 'dayGoals', 'levelUp', 'evolveTask', 'groveMilestone']))).toEqual(['dailyReport', 'dayGoals', 'levelUp']);
    // dia comum, só uma celebração pronta: ela vem DEPOIS do início de dia
    expect(sessao(all(['levelUp', 'dailyReport']))).toEqual(['dailyReport', 'levelUp']);
  });

  it('abertura SEM início de dia (já visto de manhã): as celebrações entram (teto de 3) e os convites esperam por elas', () => {
    expect(sessao(all(['levelUp', 'evolveTask', 'groveMilestone', 'catalogLevelInvite', 'restSetup']))).toEqual(['levelUp', 'evolveTask', 'groveMilestone']);
  });

  it('convites e configuração SAEM do início de dia: só aparecem numa abertura em que nada do início de dia/celebração foi mostrado nem está pronto', () => {
    expect(sessao(all(['catalogLevelInvite', 'restSetup']))).toEqual(['catalogLevelInvite', 'restSetup']);
    expect(sessao(all(['catalogLevelInvite', 'restSetup', 'dailyReport']))).toEqual(['dailyReport']);
    // mesmo depois que o resumo foi mostrado e fechado, nesta abertura os convites seguem de fora
    expect(sessao(all(['catalogLevelInvite', 'restSetup']), { shown: new Set<PresentationId>(['dailyReport']) })).toEqual([]);
  });

  it('o convite que já está na tela NÃO é expulso quando algo do início de dia fica pronto depois (regra 3 vale)', () => {
    const ready: PresentationReady = all(['restSetup']);
    const shown = new Set<PresentationId>(['restSetup']);
    expect(pickPresentation(ready, 'restSetup', undefined, { shown })).toBe('restSetup');
    ready.dailyReport = true;
    expect(pickPresentation(ready, 'restSetup', undefined, { shown })).toBe('restSetup');
  });

  it('Soulmon dormindo à espera de ser acordado (`holdDayStart`): NADA do início de dia, celebração ou convite entra; o que nasce de gesto, sim', () => {
    const ctx: PresentationContext = { holdDayStart: true };
    expect(sessao(TUDO, ctx)).toEqual([]);
    expect(pickPresentation(all(['triage', 'dailyReport']), null, undefined, ctx)).toBe('triage');
    expect(pickPresentation(all(['buildingIntro', 'nightmare']), null, undefined, ctx)).toBe('buildingIntro');
    expect(pickPresentation(all(['mapTutorial']), null, undefined, ctx)).toBe('mapTutorial');
    expect(pickPresentation(all(['catalogOnboarding']), null, undefined, ctx)).toBe('catalogOnboarding');
    // acordou: a mesma fila libera o pesadelo logo em seguida (D-68)
    expect(pickPresentation(TUDO, null, undefined, { holdDayStart: false })).toBe('nightmare');
  });

  it('`isDayStartActive`: o priming de push e o `welcome` ocioso esperam enquanto houver início de dia', () => {
    expect(isDayStartActive({})).toBe(false);
    expect(isDayStartActive({}, { holdDayStart: true })).toBe(true);
    expect(isDayStartActive(all(['dailyReport']))).toBe(true);
    expect(isDayStartActive(all(['levelUp']))).toBe(true);
    expect(isDayStartActive({}, { shown: new Set<PresentationId>(['dayGoals']) })).toBe(true);
    // convite/balão não são início de dia
    expect(isDayStartActive(all(['restSetup', 'unlockToast', 'noticeToast']))).toBe(false);
  });

  it('sem `ctx` nada muda: a fila continua a de sempre (sem teto, sem espera)', () => {
    const ready = all(['levelUp', 'evolveTask', 'groveMilestone', 'dailyReport']);
    expect(presentationBacklog(ready)).toEqual(['dailyReport', 'levelUp', 'evolveTask', 'groveMilestone']);
  });
});

describe('feiraEvento (a volta da Missão encontra o Chefe/Desafio)', () => {
  it('entra na ordem logo depois do retorno da masmorra e antes do início de dia; aviso de gesto, fora do teto', () => {
    expect(presentationRank('feiraEvento')).toBe(presentationRank('dungeonReturn') + 1);
    expect(presentationRank('feiraEvento')).toBeLessThan(presentationRank('nightmare'));
    expect(DAY_START_IDS).not.toContain('feiraEvento');
    expect(CELEBRATION_IDS).not.toContain('feiraEvento');
    expect(INVITE_IDS).not.toContain('feiraEvento');
  });
  it('UM por vez: quem está na tela não é expulso; o resto espera a vez', () => {
    expect(pickPresentation(all(['feiraEvento', 'levelUp']))).toBe('feiraEvento');
    expect(pickPresentation(all(['feiraEvento', 'dungeonReturn']), 'feiraEvento')).toBe('feiraEvento');
    expect(sessao(all(['levelUp', 'feiraEvento', 'dungeonReturn']))).toEqual(['dungeonReturn', 'feiraEvento', 'levelUp']);
  });
  it('INERTE: sem `ready.feiraEvento` (Feira desligada) a fila é a de sempre', () => {
    expect(sessao(all(['dungeonReturn', 'levelUp']))).toEqual(['dungeonReturn', 'levelUp']);
    expect(pickPresentation({})).toBe(PRESENTATION_IDLE);
  });
});

describe('evoRecap (REGISTRO §190)', () => {
  it('vem logo depois do resumo e não gasta vaga no teto', async () => {
    const q = await import('./presentationQueue');
    expect(q.presentationRank('evoRecap')).toBe(q.presentationRank('dailyReport') + 1);
    expect(q.presentationSlotOf('evoRecap')).toBe('dailyReport');
    expect(q.countedModals(new Set(['dailyReport', 'evoRecap'] as const))).toBe(1);
    expect(q.pickPresentation({ dailyReport: true, evoRecap: true } as any)).toBe('dailyReport');
    expect(q.pickPresentation({ evoRecap: true } as any)).toBe('evoRecap');
  });
});
