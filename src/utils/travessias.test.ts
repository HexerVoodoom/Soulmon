/**
 * TRAVESSIAS e PASSEIO — a lógica pura (`utils/travessias.ts`).
 * Decisão do dono de 30/09/2026 (`REGISTRO-DE-DECISOES.md` §5.6).
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeCrossings, REGION_IDS, regionById, openRegions, mistRegions, offerFor, pickCrossing,
  dropCrossing, markDone, doneToday, crossingYield, settleNight, setDestination, setHidden, passeioFindOfDay, findAnyById,
  activeChallenge, crossingsTouchMap,
} from './travessias';
import { REGIONS } from '../data/travessiasCatalog';
import { ADVENTURE_CATALOG, adventureOfDay, adventureOfNight, collectAdventure } from './adventure';
import { CROSSINGS_EMPTY, HOME_REGION, REGIONS_OPENED_PER_DAY, type CrossingsState, type RegionId } from '../types/travessias';

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

  it('F5: uma vez por DIA — vira o dia, vale de novo; a região só entra uma vez', () => {
    let s = markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id), '2026-10-02');
    // Trocar de Travessia no mesmo dia não libera um segundo "Fiz".
    const trocada = pickCrossing(s, R2.id, R2.challenges[0].id);
    expect(markDone(trocada, '2026-10-02')).toBe(trocada);
    // No dia seguinte (virada pelo dayKey do jogador), vale de novo.
    s = markDone(s, '2026-10-03');
    expect(s.doneDay).toBe('2026-10-03');
    expect(s.pending).toEqual([R1.id]); // nada acumula por repetir
    // Depois que a região abre, repetir não muda o mapa.
    const noite = settleNight(s, '2026-10-03').state;
    const outro = markDone(noite, '2026-10-04');
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
  const doisFeitos = markDone(pickCrossing(markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id), '2026-09-29'), R2.id, R2.challenges[0].id), '2026-09-30');

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
