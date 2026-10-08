/**
 * TRAVESSIAS e PASSEIO — a lógica pura (`utils/travessias.ts`).
 * Decisão do dono de 30/09/2026 (`REGISTRO-DE-DECISOES.md` §5.6).
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeCrossings, REGION_IDS, regionById, openRegions, mistRegions, offerFor, pickCrossing,
  dropCrossing, markDone, doneToday, crossingYield, settleNight, setDestination, setHidden, passeioFindOfDay, findAnyById,
  activeChallenge, crossingsTouchMap, dailyOffer, pickMission, missionMark, marcosAbertos,
} from './travessias';
import { MARCO_POSTAIS, VIAGENS } from '../data/travessiasViagens';
import { REGIONS } from '../data/travessiasCatalog';
import { ADVENTURE_CATALOG, adventureOfDay, adventureOfNight, collectAdventure } from './adventure';
import { CROSSINGS_EMPTY, HOME_REGION, LOG_MAX, MARCO_THRESHOLDS, MISSIONS_OFFERED_PER_DAY, REGIONS_OPENED_PER_DAY, type CrossingsState, type RegionId } from '../types/travessias';

const FORA = REGIONS.filter(r => r.id !== HOME_REGION);
const R1 = FORA[0];
const R2 = FORA[1];
const dias = (n: number) => Array.from({ length: n }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 1) + i * 86_400_000);
  return d.toISOString().slice(0, 10);
});

const comAberta = (id: RegionId, day = '2026-09-01'): CrossingsState =>
  ({ ...CROSSINGS_EMPTY, opened: [{ region: id, day }] });

describe('normalizeCrossings', () => {
  it('ausência e lixo viram o estado vazio, sem lançar', () => {
    for (const raw of [undefined, null, 42, 'x', [], { opened: 'no' }]) {
      expect(normalizeCrossings(raw)).toEqual(CROSSINGS_EMPTY);
    }
  });

  it('filtra RegionId inválido, casa, dia malformado e repetição; pending sem repetir nem abrir de novo', () => {
    const n = normalizeCrossings({
      opened: [
        { region: R1.id, day: '2026-09-01' }, { region: R1.id, day: '2026-09-02' },
        { region: 'akasha', day: '2026-09-01' }, { region: HOME_REGION, day: '2026-09-01' },
        { region: R2.id, day: 'ontem' },
      ],
      pending: [R1.id, R2.id, R2.id, 'nada'],
      active: { region: R2.id, challenge: R2.challenges[0].id },
      destination: 'akasha',
      hidden: 'sim',
    });
    expect(n.opened).toEqual([{ region: R1.id, day: '2026-09-01' }]);
    expect(n.pending).toEqual([R2.id]);
    // F5 (02/10/2026): a ativa pode estar numa região já guardada/aberta (repete-se todo dia).
    expect(n.active).toEqual({ region: R2.id, challenge: R2.challenges[0].id });
    expect(n.doneDay).toBeNull();
    expect(n.destination).toBeNull();
    expect(n.hidden).toBe(false);
  });

  it('destino só se a região estiver aberta; texto livre nunca entra no save', () => {
    expect(normalizeCrossings({ opened: [{ region: R1.id, day: '2026-09-01' }], destination: R1.id }).destination).toBe(R1.id);
    expect(normalizeCrossings({ destination: R1.id }).destination).toBeNull();
    const n = normalizeCrossings({ active: { region: R1.id, challenge: 'Fui ao parque com a Ana às 22h!' } });
    expect(n.active).toBeNull();
    // A casa não tem desafio; `doneDay` só aceita o formato de dia.
    expect(normalizeCrossings({ active: { region: HOME_REGION, challenge: 'trv-c-x' } }).active).toBeNull();
    expect(normalizeCrossings({ doneDay: '2026-10-02' }).doneDay).toBe('2026-10-02');
    expect(normalizeCrossings({ doneDay: 'ontem às 22h' }).doneDay).toBeNull();
  });

  it('REGION_IDS (do save, fora do chunk do catálogo) bate um a um com o catálogo', () => {
    expect([...REGION_IDS].sort()).toEqual(REGIONS.map(r => r.id).sort());
  });
});

describe('regiões abertas, névoa e oferta', () => {
  it('casa sempre aberta e primeiro; abertas na ordem em que abriram', () => {
    expect(openRegions(CROSSINGS_EMPTY).map(r => r.id)).toEqual([HOME_REGION]);
    const s: CrossingsState = { ...CROSSINGS_EMPTY, opened: [{ region: R2.id, day: '2026-09-01' }, { region: R1.id, day: '2026-09-02' }] };
    expect(openRegions(s).map(r => r.id)).toEqual([HOME_REGION, R2.id, R1.id]);
    expect(mistRegions(s).map(r => r.id)).not.toContain(R1.id);
    expect(mistRegions(s).map(r => r.id)).not.toContain(HOME_REGION);
  });

  it('a oferta é determinística: sempre os mesmos 3 do catálogo', () => {
    expect(offerFor(R1)).toBe(R1.challenges);
    expect(offerFor(regionById(R1.id)!).map(c => c.id)).toEqual(offerFor(R1).map(c => c.id));
    expect(offerFor(R1)).toHaveLength(3);
  });
});

describe('pick / drop / markDone / trocar', () => {
  it('pick só entre os desafios da região (qualquer uma fora a casa — a Travessia se repete)', () => {
    const s = pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id);
    expect(s.active).toEqual({ region: R1.id, challenge: R1.challenges[0].id });
    expect(activeChallenge(s)?.challenge.id).toBe(R1.challenges[0].id);
    // Desafio de OUTRA região: recusado, mesma referência.
    expect(pickCrossing(CROSSINGS_EMPTY, R1.id, R2.challenges[0].id)).toBe(CROSSINGS_EMPTY);
    // Casa não tem Travessia.
    expect(pickCrossing(CROSSINGS_EMPTY, HOME_REGION, 'x')).toBe(CROSSINGS_EMPTY);
    // F5 (02/10/2026): região aberta ou guardada também pode ser escolhida (repetir o ato todo dia).
    const aberta = comAberta(R1.id);
    expect(pickCrossing(aberta, R1.id, R1.challenges[0].id).active?.region).toBe(R1.id);
    const pend: CrossingsState = { ...CROSSINGS_EMPTY, pending: [R1.id] };
    expect(pickCrossing(pend, R1.id, R1.challenges[0].id).active?.region).toBe(R1.id);
  });

  it('trocar escolhe entre os MESMOS 3 e substitui a ativa (nunca re-sorteia)', () => {
    let s = pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id);
    s = pickCrossing(s, R1.id, R1.challenges[2].id);
    expect(s.active).toEqual({ region: R1.id, challenge: R1.challenges[2].id });
    expect(offerFor(regionById(R1.id)!).map(c => c.id)).toEqual(R1.challenges.map(c => c.id));
    // Escolher de novo a mesma: nada muda.
    expect(pickCrossing(s, R1.id, R1.challenges[2].id)).toBe(s);
    // Trocar de região também substitui (uma ativa por vez).
    s = pickCrossing(s, R2.id, R2.challenges[1].id);
    expect(s.active?.region).toBe(R2.id);
  });

  it('recuar: sem custo, volta a null e não mexe em região nem no dia do "Fiz"', () => {
    const s = pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id);
    const d = dropCrossing(s);
    expect(d.active).toBeNull();
    expect(d.pending).toEqual([]);
    expect(d.opened).toEqual([]);
    expect(dropCrossing(d)).toBe(d);
    // Recuar depois do "Fiz" não apaga o que o "Fiz" deixou (nem libera um segundo "Fiz" no dia).
    const feito = markDone(s, '2026-10-02');
    const r = dropCrossing(feito);
    expect(r.active).toBeNull();
    expect(r.pending).toEqual([R1.id]);
    expect(r.doneDay).toBe('2026-10-02');
  });

  it('Fiz: região vai para pending (sem data) e NÃO abre nada na hora; a ativa fica; idempotente no dia', () => {
    const s = pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[1].id);
    const f = markDone(s, '2026-10-02');
    expect(f.active).toEqual(s.active);
    expect(f.pending).toEqual([R1.id]);
    expect(f.opened).toEqual([]);
    expect(f.doneDay).toBe('2026-10-02');
    expect(doneToday(f, '2026-10-02')).toBe(true);
    expect(markDone(f, '2026-10-02')).toBe(f);
    expect(crossingsTouchMap(f)).toBe(true);
    expect(markDone(CROSSINGS_EMPTY, '2026-10-02')).toBe(CROSSINGS_EMPTY);
  });

  it('F5: uma vez por DIA — vira o dia, escolhe-se de novo e vale de novo; a região só entra uma vez', () => {
    let s = markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id, '2026-10-02'), '2026-10-02');
    // Trocar de Travessia no mesmo dia não libera um segundo "Fiz".
    const trocada = pickCrossing(s, R2.id, R2.challenges[0].id, '2026-10-02');
    expect(markDone(trocada, '2026-10-02')).toBe(trocada);
    // 04/10/2026 (missões diárias): a escolhida de ontem NÃO vale hoje — escolhe-se de novo.
    expect(markDone(s, '2026-10-03')).toBe(s);
    expect(activeChallenge(s, '2026-10-03')).toBeNull();
    // No dia seguinte (virada pelo dayKey do jogador), escolhida de novo, vale de novo.
    s = markDone(pickCrossing(s, R1.id, R1.challenges[0].id, '2026-10-03'), '2026-10-03');
    expect(s.doneDay).toBe('2026-10-03');
    expect(s.pending).toEqual([R1.id]); // nada acumula por repetir
    // Depois que a região abre, repetir não muda o mapa.
    const noite = settleNight(s, '2026-10-03').state;
    const outro = markDone(pickCrossing(noite, R1.id, R1.challenges[0].id, '2026-10-04'), '2026-10-04');
    expect(outro.doneDay).toBe('2026-10-04');
    expect(outro.opened).toEqual(noite.opened);
    expect(outro.pending).toEqual([]);
  });

  it('crossingYield conta a verdade do mapa: abre / guardada / aberta', () => {
    expect(crossingYield(CROSSINGS_EMPTY, R1.id)).toBe('abre');
    expect(crossingYield({ ...CROSSINGS_EMPTY, pending: [R1.id] }, R1.id)).toBe('guardada');
    expect(crossingYield(comAberta(R1.id), R1.id)).toBe('aberta');
  });
});

describe('settleNight', () => {
  const doisFeitos = markDone(pickCrossing(markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id, '2026-09-29'), '2026-09-29'), R2.id, R2.challenges[0].id, '2026-09-30'), '2026-09-30');

  it(`abre no máximo ${REGIONS_OPENED_PER_DAY} por noite, o mais antigo primeiro`, () => {
    expect(doisFeitos.pending).toEqual([R1.id, R2.id]);
    const n1 = settleNight(doisFeitos, '2026-10-01');
    expect(n1.arrived).toBe(R1.id);
    expect(n1.state.opened).toEqual([{ region: R1.id, day: '2026-10-01' }]);
    expect(n1.state.pending).toEqual([R2.id]);
    const n2 = settleNight(n1.state, '2026-10-02');
    expect(n2.arrived).toBe(R2.id);
    expect(n2.state.pending).toEqual([]);
  });

  it('idempotente: a 2ª chamada no mesmo dia devolve o MESMO objeto (footgun 6)', () => {
    const n1 = settleNight(doisFeitos, '2026-10-01');
    const again = settleNight(n1.state, '2026-10-01');
    expect(again.state).toBe(n1.state);
    expect(again.arrived).toBe(R1.id);
    expect(settleNight(CROSSINGS_EMPTY, '2026-10-01').state).toBe(CROSSINGS_EMPTY);
    expect(settleNight(CROSSINGS_EMPTY, '2026-10-01').arrived).toBeNull();
  });

  it('pending nunca expira: noites e noites depois ele ainda abre', () => {
    // O "Fiz" guardado não carrega data — o tempo que passa não o apaga.
    const f = markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id), '2026-10-01');
    const n = settleNight(f, '2027-12-31');
    expect(n.arrived).toBe(R1.id);
    expect(JSON.stringify(f.pending)).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('destino e interruptor', () => {
  it('destino só para região aberta; casa guarda null', () => {
    expect(setDestination(CROSSINGS_EMPTY, R1.id)).toBe(CROSSINGS_EMPTY);
    const a = comAberta(R1.id);
    const d = setDestination(a, R1.id);
    expect(d.destination).toBe(R1.id);
    expect(setDestination(d, R1.id)).toBe(d);
    expect(setDestination(d, HOME_REGION).destination).toBeNull();
    expect(setDestination(d, null).destination).toBeNull();
  });

  it('esconder não mexe no resto; mesmo valor devolve a mesma referência', () => {
    const s = pickCrossing(comAberta(R1.id), R2.id, R2.challenges[0].id);
    const h = setHidden(s, true);
    expect(h.hidden).toBe(true);
    expect({ ...h, hidden: false }).toEqual(s);
    expect(setHidden(h, true)).toBe(h);
  });
});

describe('passeioFindOfDay — o achado fundido', () => {
  const base = { entries: [] as { id: string; day: string }[], feito: 2, meta: 4 };

  it('destino casa ⇒ EXATAMENTE adventureOfDay (e adventureOfNight)', () => {
    for (const dayKey of dias(40)) {
      const esperado = adventureOfDay([], 2, 4, dayKey);
      expect(passeioFindOfDay({ ...base, crossings: CROSSINGS_EMPTY, dayKey })).toBe(esperado);
      expect(passeioFindOfDay({ ...base, crossings: comAberta(R1.id), dayKey })).toBe(esperado);
      expect(adventureOfNight([], 2, 4, dayKey)).toBe(esperado);
    }
  });

  it('determinístico por dayKey: a mesma entrada devolve o mesmo achado', () => {
    const c = setDestination(comAberta(R1.id), R1.id);
    for (const dayKey of dias(20)) {
      const a = passeioFindOfDay({ ...base, crossings: c, dayKey });
      const b = passeioFindOfDay({ ...base, crossings: c, dayKey });
      expect(a).toBe(b);
    }
  });

  it('nunca volta vazio, e destino aberto mistura achados da região com a Aventura comum', () => {
    const c = setDestination(comAberta(R1.id), R1.id);
    const ids = dias(60).map(dayKey => passeioFindOfDay({ ...base, crossings: c, dayKey }).id);
    expect(ids.every(id => !!findAnyById(id))).toBe(true);
    expect(ids.some(id => R1.finds.some(f => f.id === id))).toBe(true);
    expect(ids.some(id => ADVENTURE_CATALOG.some(a => a.id === id))).toBe(true);
  });

  it('achado de região prefere o não coletado; esgotados, volta a Aventura comum', () => {
    const c = setDestination(comAberta(R1.id), R1.id);
    const todos = R1.finds.map(f => ({ id: f.id, day: '2026-01-01' }));
    for (const dayKey of dias(30)) {
      const f = passeioFindOfDay({ ...base, entries: todos, crossings: c, dayKey });
      expect(R1.finds.some(x => x.id === f.id), dayKey).toBe(false);
    }
  });

  it('a noite em que a região ABRE traz a cena de chegada dela', () => {
    const f = markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id), '2026-10-04');
    const { state } = settleNight(f, '2026-10-05');
    expect(passeioFindOfDay({ ...base, crossings: state, dayKey: '2026-10-05' })).toBe(R1.arrival);
    // Na noite seguinte, não é mais chegada.
    expect(passeioFindOfDay({ ...base, crossings: state, dayKey: '2026-10-06' }).id).not.toBe(R1.arrival.id);
  });

  it('já guardado nesta noite ⇒ é ele (reabrir o relatório não re-sorteia nem cascateia)', () => {
    const c = setDestination(comAberta(R1.id), R1.id);
    for (const dayKey of dias(15)) {
      const primeiro = passeioFindOfDay({ ...base, crossings: c, dayKey });
      const diario = collectAdventure([], primeiro.id, dayKey);
      expect(passeioFindOfDay({ ...base, entries: diario, crossings: c, dayKey }).id).toBe(primeiro.id);
      // Mudar o destino depois de guardado não troca o achado daquela noite.
      expect(passeioFindOfDay({ ...base, entries: diario, crossings: CROSSINGS_EMPTY, dayKey }).id).toBe(primeiro.id);
    }
    // O mesmo vale para a Aventura comum (o bug de cascata: guardar trocava o achado).
    for (const dayKey of dias(15)) {
      const a = adventureOfNight([], 1, 1, dayKey);
      expect(adventureOfNight(collectAdventure([], a.id, dayKey), 1, 1, dayKey).id).toBe(a.id);
    }
  });

  it('R-33: todo achado comum é alcançável SEM nenhuma Travessia (casa, diário crescendo)', () => {
    let diario: { id: string; day: string }[] = [];
    // Metas variadas cobrem as três faixas de raridade.
    const metas: Array<[number, number]> = [[0, 4], [2, 4], [4, 4]];
    dias(3000).forEach((dayKey, i) => {
      const [feito, meta] = metas[i % metas.length];
      const f = passeioFindOfDay({ crossings: CROSSINGS_EMPTY, entries: diario, feito, meta, dayKey });
      diario = collectAdventure(diario, f.id, dayKey);
    });
    const tem = new Set(diario.map(e => e.id));
    for (const a of ADVENTURE_CATALOG) expect(tem.has(a.id), a.id).toBe(true);
    expect([...tem].some(id => id.startsWith('trv-'))).toBe(false);
  });

  it('findAnyById resolve comum, chegada e achados de região; id órfão → undefined', () => {
    expect(findAnyById(ADVENTURE_CATALOG[0].id)).toBe(ADVENTURE_CATALOG[0]);
    expect(findAnyById(R1.arrival.id)).toBe(R1.arrival);
    expect(findAnyById(R1.finds[0].id)).toBe(R1.finds[0]);
    expect(findAnyById('trv-nao-existe')).toBeUndefined();
  });
});


describe('missões diárias: 3 propostas, escolhe 1 (04/10/2026)', () => {
  const D = dias(60);

  it('dailyOffer: 3 propostas, de regiões DIFERENTES, todas do catálogo, sem repetir', () => {
    for (const dia of D) {
      const o = dailyOffer(dia, 'save-a');
      expect(o).toHaveLength(MISSIONS_OFFERED_PER_DAY);
      expect(new Set(o.map(m => m.region.id)).size).toBe(3);
      expect(new Set(o.map(m => m.challenge.id)).size).toBe(3);
      for (const m of o) {
        expect(m.region.id).not.toBe(HOME_REGION);
        expect(m.region.challenges.map(c => c.id)).toContain(m.challenge.id);
      }
    }
  });

  it('é determinística pelo dia + save (reabrir nunca re-sorteia) e muda com o dia e com o save', () => {
    const ids = (dia: string, seed: string) => dailyOffer(dia, seed).map(m => m.challenge.id).join('|');
    for (const dia of D) expect(ids(dia, 'x')).toBe(ids(dia, 'x'));
    expect(new Set(D.map(d => ids(d, 'x'))).size).toBeGreaterThan(30);
    expect(D.filter(d => ids(d, 'x') !== ids(d, 'y')).length).toBeGreaterThan(30);
  });

  it('com o tempo, as 21 propostas aparecem (nenhuma fica inalcançável) e as 7 regiões são cenário', () => {
    const vistas = new Set<string>();
    for (const dia of dias(400)) dailyOffer(dia, 's').forEach(m => vistas.add(m.challenge.id));
    expect(vistas.size).toBe(21);
  });

  it('pickMission só aceita uma das três do dia; escolhida NÃO se troca (M4); depois do "Fiz", não', () => {
    const dia = '2026-10-04';
    const [a, b] = dailyOffer(dia, 's');
    const fora = FORA.flatMap(r => r.challenges.map(c => ({ r, c })))
      .find(x => !dailyOffer(dia, 's').some(m => m.challenge.id === x.c.id))!;
    expect(pickMission(CROSSINGS_EMPTY, dia, 's', fora.r.id, fora.c.id)).toBe(CROSSINGS_EMPTY);
    let s = pickMission(CROSSINGS_EMPTY, dia, 's', a.region.id, a.challenge.id);
    expect(activeChallenge(s, dia)?.challenge.id).toBe(a.challenge.id);
    expect(s.pickDay).toBe(dia);
    // Rodada 7 (M4): escolheu, não troca.
    expect(pickMission(s, dia, 's', b.region.id, b.challenge.id)).toBe(s);
    expect(activeChallenge(s, dia)?.challenge.id).toBe(a.challenge.id);
    const feito = markDone(s, dia);
    expect(pickMission(feito, dia, 's', a.region.id, a.challenge.id)).toBe(feito);
    // Outro dia: a de ontem some, a oferta é nova.
    expect(activeChallenge(feito, '2026-10-05')).toBeNull();
  });

  it('recuar solta a escolha e o dia dela; as três voltam', () => {
    const dia = '2026-10-04';
    const m = dailyOffer(dia, 's')[0];
    const s = dropCrossing(pickMission(CROSSINGS_EMPTY, dia, 's', m.region.id, m.challenge.id));
    expect(s.active).toBeNull();
    expect(s.pickDay).toBeNull();
    expect(missionMark(s, dia)).toBe('available');
  });
});

describe('a janela de 24 h da missão (rodada 7, M4)', () => {
  const dia = '2026-10-04';
  const T0 = Date.UTC(2026, 9, 4, 20, 0, 0);
  const H = 3_600_000;
  const [a, b] = dailyOffer(dia, 's');
  const escolhida = pickMission(CROSSINGS_EMPTY, dia, 's', a.region.id, a.challenge.id, T0);

  it('guarda o instante da escolha; dentro das 24 h vale, mesmo virando o dia, e não se troca', () => {
    expect(escolhida.pickAt).toBe(T0);
    const amanha = '2026-10-05';
    expect(activeChallenge(escolhida, amanha, T0 + 10 * H)?.challenge.id).toBe(a.challenge.id);
    expect(missionMark(escolhida, amanha, T0 + 10 * H)).toBe('progress');
    const ofertaDeAmanha = dailyOffer(amanha, 's')[0];
    expect(pickMission(escolhida, amanha, 's', ofertaDeAmanha.region.id, ofertaDeAmanha.challenge.id, T0 + 10 * H)).toBe(escolhida);
    expect(pickMission(escolhida, dia, 's', b.region.id, b.challenge.id, T0 + 1 * H)).toBe(escolhida);
  });

  it('passadas as 24 h ela se solta sozinha, sem custo: saem outras e se escolhe de novo', () => {
    const amanha = '2026-10-05';
    const depois = T0 + 24 * H;
    expect(activeChallenge(escolhida, amanha, depois)).toBeNull();
    expect(missionMark(escolhida, amanha, depois)).toBe('available');
    const nova = dailyOffer(amanha, 's')[1];
    const s = pickMission(escolhida, amanha, 's', nova.region.id, nova.challenge.id, depois);
    expect(s.active?.challenge).toBe(nova.challenge.id);
    expect(s.pickAt).toBe(depois);
    expect(s.score).toBe(0); // perder não custa nada e não soma nada
    // O "Fiz" depois das 24 h não vale para a que já se foi.
    expect(markDone(escolhida, amanha, depois)).toBe(escolhida);
  });

  it('"Fiz" dentro das 24 h, já no dia seguinte, vale: conclui, registra e para o relógio', () => {
    const amanha = '2026-10-05';
    const feito = markDone(escolhida, amanha, T0 + 10 * H);
    expect(feito.doneDay).toBe(amanha);
    expect(feito.pickAt).toBeNull();
    expect(feito.log).toEqual([{ day: amanha, region: a.region.id, challenge: a.challenge.id }]);
    expect(missionMark(feito, amanha, T0 + 11 * H)).toBeNull();
  });
});

describe('o registro das missões feitas (rodada 7, M6)', () => {
  it('cada "Fiz" entra uma vez, só dia + região + id; fica só o fim do registro', () => {
    let s: CrossingsState = CROSSINGS_EMPTY;
    for (let d = 1; d <= 70; d++) {
      const m = dailyOffer(`x${d}`, 's')[0];
      s = markDone(pickCrossing(s, m.region.id, m.challenge.id, `x${d}`), `x${d}`);
    }
    expect(s.log.length).toBe(LOG_MAX);
    expect(Object.keys(s.log[0]).sort()).toEqual(['challenge', 'day', 'region']);
    expect(s.log[LOG_MAX - 1].day).toBe('x70');
  });

  it('normalizeCrossings: pickAt e log tolerantes; lixo some', () => {
    const n = normalizeCrossings({
      active: { region: 'floresta', challenge: 'trv-c-floresta-1' }, pickDay: '2026-10-04', pickAt: 1_700_000_000_000,
      log: [{ day: '2026-10-01', region: 'floresta', challenge: 'trv-c-floresta-1' }, { day: 'lixo', region: 'floresta', challenge: 'x' }, { day: '2026-10-02', region: 'campina', challenge: 'a' }, null, 7],
    });
    expect(n.pickAt).toBe(1_700_000_000_000);
    expect(n.log).toEqual([{ day: '2026-10-01', region: 'floresta', challenge: 'trv-c-floresta-1' }]);
    expect(normalizeCrossings({ pickAt: 5, log: 'x' }).pickAt).toBeNull(); // sem ativa, sem relógio
    expect(normalizeCrossings({ pickAt: 5, log: 'x' }).log).toEqual([]);
  });
});

describe('o marcador "!" / "?" (04/10/2026)', () => {
  const dia = '2026-10-04';
  const m = dailyOffer(dia, 's')[0];
  it('"!" com missões para escolher, "?" com uma escolhida, nada depois do "Fiz" ou com a camada escondida', () => {
    expect(missionMark(CROSSINGS_EMPTY, dia)).toBe('available');
    const escolhida = pickMission(CROSSINGS_EMPTY, dia, 's', m.region.id, m.challenge.id);
    expect(missionMark(escolhida, dia)).toBe('progress');
    expect(missionMark(markDone(escolhida, dia), dia)).toBeNull();
    // Rodada 7 (M7): a camada não se esconde mais; `hidden` de save antigo é ignorado.
    expect(missionMark({ ...CROSSINGS_EMPTY, hidden: true }, dia)).toBe('available');
    // No dia seguinte a de ontem não conta: "!" de novo (sem culpa, sem marca de atraso).
    expect(missionMark(markDone(escolhida, dia), '2026-10-05')).toBe('available');
    expect(missionMark(escolhida, '2026-10-05')).toBe('available');
  });
});

describe('Marcos de Aventura: 1 por missão, 1 por dia, cosmético (04/10/2026)', () => {
  it('"Fiz" soma 1 e o mesmo dia não soma de novo; recuar e trocar não mexem no total', () => {
    const dia = '2026-10-04';
    const m = dailyOffer(dia, 's')[0];
    const f = markDone(pickMission(CROSSINGS_EMPTY, dia, 's', m.region.id, m.challenge.id), dia);
    expect(f.score).toBe(1);
    expect(markDone(f, dia)).toBe(f);
    expect(dropCrossing(f).score).toBe(1);
    expect(pickMission(f, dia, 's', m.region.id, m.challenge.id)).toBe(f);
  });

  it('o total NUNCA cai (dias sem fazer não custam nada) e anda no máximo 1 por dia', () => {
    let s = CROSSINGS_EMPTY;
    let anterior = 0;
    dias(30).forEach((dia, i) => {
      if (i % 3 === 0) return; // dias sem fazer
      const m = dailyOffer(dia, 's')[0];
      s = markDone(pickMission(s, dia, 's', m.region.id, m.challenge.id), dia);
      expect(s.score - anterior).toBeLessThanOrEqual(1);
      expect(s.score).toBeGreaterThanOrEqual(anterior);
      anterior = s.score;
    });
    expect(s.score).toBe(20);
    expect(marcosAbertos(s)).toBe(MARCO_THRESHOLDS.length);
  });

  it('o "Fiz" guarda a viagem da noite (dia + região da missão)', () => {
    const dia = '2026-10-04';
    const m = dailyOffer(dia, 's')[0];
    const f = markDone(pickMission(CROSSINGS_EMPTY, dia, 's', m.region.id, m.challenge.id), dia);
    expect(f.trip).toEqual({ day: dia, region: m.region.id });
  });

  it('normalizeCrossings: pickDay/score/trip tolerantes; lixo vira o vazio; save antigo segue válido', () => {
    const n = normalizeCrossings({
      active: { region: R1.id, challenge: R1.challenges[0].id }, pickDay: '2026-10-04',
      score: 7.9, trip: { day: '2026-10-04', region: R2.id },
    });
    expect(n.pickDay).toBe('2026-10-04');
    expect(n.score).toBe(7);
    expect(n.trip).toEqual({ day: '2026-10-04', region: R2.id });
    const lixo = normalizeCrossings({ pickDay: 'hoje', score: -3, trip: { day: 'x', region: 'akasha' } });
    expect(lixo.pickDay).toBeNull();
    expect(lixo.score).toBe(0);
    expect(lixo.trip).toBeNull();
    expect(normalizeCrossings({ score: 'muito' }).score).toBe(0);
    expect(normalizeCrossings({ score: 1e12 }).score).toBe(9999);
    // pickDay sem ativa não fica pendurado; trip da casa é recusada.
    expect(normalizeCrossings({ pickDay: '2026-10-04' }).pickDay).toBeNull();
    expect(normalizeCrossings({ trip: { day: '2026-10-04', region: HOME_REGION } }).trip).toBeNull();
    // Save de antes das missões diárias (sem os três campos): ativa vale, mas sem dia (a folha mostra as três).
    const antigo = normalizeCrossings({ active: { region: R1.id, challenge: R1.challenges[0].id }, doneDay: '2026-10-02' });
    expect(antigo.active).not.toBeNull();
    expect(antigo.pickDay).toBeNull();
    expect(antigo.score).toBe(0);
    expect(activeChallenge(antigo, '2026-10-04')).toBeNull();
  });
});

describe('a viagem da noite e os postais dos Marcos (04/10/2026)', () => {
  const base = { entries: [] as { id: string; day: string }[], feito: 2, meta: 4 };
  const jaAberta = (r: RegionId): CrossingsState => comAberta(r);

  it('as sete regiões com desafio têm 3 historinhas; a casa não; ids únicos e todos resolvem', () => {
    expect(Object.keys(VIAGENS).sort()).toEqual(FORA.map(r => r.id).sort());
    const ids = [...Object.values(VIAGENS).flatMap(v => v!.map(x => x.id)), ...MARCO_POSTAIS.map(m => m.id)];
    expect(ids).toHaveLength(21 + 3);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(findAnyById(id), id).toBeTruthy();
    expect(MARCO_POSTAIS).toHaveLength(MARCO_THRESHOLDS.length);
  });

  it('a noite da missão (região já aberta) traz UMA historinha da região dela, determinística', () => {
    for (const r of FORA) {
      const c: CrossingsState = { ...jaAberta(r.id), trip: { day: '2026-10-04', region: r.id }, score: 1 };
      const f = passeioFindOfDay({ ...base, crossings: c, dayKey: '2026-10-04' });
      expect(VIAGENS[r.id]!.map(v => v.id), r.id).toContain(f.id);
      expect(passeioFindOfDay({ ...base, crossings: c, dayKey: '2026-10-04' })).toBe(f);
    }
  });

  it('a primeira noite da região traz a chegada; a viagem só depois; noite sem missão não viaja', () => {
    const c: CrossingsState = { ...CROSSINGS_EMPTY, opened: [{ region: R1.id, day: '2026-10-04' }], trip: { day: '2026-10-04', region: R1.id }, score: 1 };
    expect(passeioFindOfDay({ ...base, crossings: c, dayKey: '2026-10-04' })).toBe(R1.arrival);
    const semMissao: CrossingsState = { ...jaAberta(R1.id), trip: { day: '2026-10-03', region: R1.id } };
    const f = passeioFindOfDay({ ...base, crossings: semMissao, dayKey: '2026-10-04' });
    expect(VIAGENS[R1.id]!.some(v => v.id === f.id)).toBe(false);
  });

  it('prefere a historinha ainda não coletada; esgotadas, repete sem ficar vazio', () => {
    const c: CrossingsState = { ...jaAberta(R1.id), trip: { day: '2026-10-04', region: R1.id }, score: 1 };
    const vistas = VIAGENS[R1.id]!.slice(0, 2).map(v => ({ id: v.id, day: '2026-09-01' }));
    expect(passeioFindOfDay({ ...base, entries: vistas, crossings: c, dayKey: '2026-10-04' }).id).toBe(VIAGENS[R1.id]![2].id);
    const todas = VIAGENS[R1.id]!.map(v => ({ id: v.id, day: '2026-09-01' }));
    expect(findAnyById(passeioFindOfDay({ ...base, entries: todas, crossings: c, dayKey: '2026-10-04' }).id)).toBeTruthy();
  });

  it('o postal do Marco vem na primeira noite livre depois do total, uma única vez, e some do sorteio depois de coletado', () => {
    const c: CrossingsState = { ...jaAberta(R1.id), score: 5 };
    const f = passeioFindOfDay({ ...base, crossings: c, dayKey: '2026-10-04' });
    expect(f).toBe(MARCO_POSTAIS[0]);
    const diario = collectAdventure([], f.id, '2026-10-04');
    // Reabrir a mesma noite devolve o mesmo; na seguinte, já não é o postal.
    expect(passeioFindOfDay({ ...base, entries: diario, crossings: c, dayKey: '2026-10-04' }).id).toBe(f.id);
    expect(passeioFindOfDay({ ...base, entries: diario, crossings: c, dayKey: '2026-10-05' }).id).not.toBe(f.id);
    // Abaixo do limiar, nunca.
    const poucos: CrossingsState = { ...jaAberta(R1.id), score: 4 };
    for (const dia of dias(20)) expect(MARCO_POSTAIS.map(m => m.id)).not.toContain(passeioFindOfDay({ ...base, crossings: poucos, dayKey: dia }).id);
  });

  it('um total grande abre os três postais, um por noite', () => {
    const c: CrossingsState = { ...jaAberta(R1.id), score: 25 };
    let diario: { id: string; day: string }[] = [];
    const achados: string[] = [];
    dias(3).forEach(dia => {
      const f = passeioFindOfDay({ ...base, entries: diario, crossings: c, dayKey: dia });
      achados.push(f.id);
      diario = collectAdventure(diario, f.id, dia);
    });
    expect(achados).toEqual(MARCO_POSTAIS.map(m => m.id));
  });
});

describe('a linha "Take a stroll" do menu (07/10/2026): o Resgatar é só recibo', () => {
  const D = '2026-10-07';
  const feita: CrossingsState = { ...CROSSINGS_EMPTY, active: { region: 'floresta', challenge: 'x' }, doneDay: D, score: 1 };
  it('point -> ready -> claimed, por dia do jogador', async () => {
    const { strollLineState, claimStroll } = await import('./travessiasSave');
    expect(strollLineState(CROSSINGS_EMPTY, D)).toBe('point');
    expect(strollLineState(feita, D)).toBe('ready');
    expect(strollLineState(feita, '2026-10-08')).toBe('point');
    expect(strollLineState(claimStroll(feita, D), D)).toBe('claimed');
    expect(strollLineState(claimStroll(feita, D), '2026-10-08')).toBe('point');
  });
  it('idempotente e sem pagar de novo: a 2ª chamada devolve o MESMO objeto e nada além do recibo muda', async () => {
    const { claimStroll } = await import('./travessiasSave');
    const c = claimStroll(feita, D);
    expect(claimStroll(c, D)).toBe(c);
    expect(c.score).toBe(feita.score);
    expect(c.pending).toBe(feita.pending);
    expect(c.log).toBe(feita.log);
    expect({ ...c, claimDay: undefined }).toEqual({ ...feita, claimDay: undefined });
  });
  it('sem passeio concluído hoje o Resgatar não faz nada', async () => {
    const { claimStroll } = await import('./travessiasSave');
    expect(claimStroll(CROSSINGS_EMPTY, D)).toBe(CROSSINGS_EMPTY);
  });
  it('o recibo sobrevive à higienização do save', async () => {
    const { normalizeCrossings } = await import('./travessiasSave');
    expect(normalizeCrossings({ ...feita, claimDay: D }).claimDay).toBe(D);
    expect(normalizeCrossings({ ...feita, claimDay: 'lixo' }).claimDay).toBeNull();
  });
});
