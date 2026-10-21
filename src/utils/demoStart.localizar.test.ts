import { describe, expect, it } from 'vitest';
import { DEMO_ACTIVITIES, localizeDemoActivities } from './demoStart';

/** QA L05-08: hábitos semente da demo ficavam no idioma da criação quando o idioma mudava depois. */
describe('localizeDemoActivities', () => {
  const en = DEMO_ACTIVITIES.map(d => ({ id: d.name.en, name: d.name.en }));
  const pt = DEMO_ACTIVITIES.map(d => ({ id: d.name.en, name: d.name.pt }));

  it('demo criada em EN e UI em PT: os 3 hábitos viram português', () => {
    expect(localizeDemoActivities(en, true).map(a => a.name)).toEqual(DEMO_ACTIVITIES.map(d => d.name.pt));
  });
  it('e de volta para o inglês', () => {
    expect(localizeDemoActivities(pt, false).map(a => a.name)).toEqual(DEMO_ACTIVITIES.map(d => d.name.en));
  });
  it('já no idioma certo: devolve o MESMO array (nenhum re-render)', () => {
    expect(localizeDemoActivities(pt, true)).toBe(pt);
  });
  it('hábito renomeado ou criado pela pessoa nunca é tocado', () => {
    const meus = [{ id: 'x', name: 'Beber café' }, { id: 'y', name: 'Drink a glass of water!' }];
    expect(localizeDemoActivities(meus, true)).toBe(meus);
    expect(localizeDemoActivities(meus, false)).toBe(meus);
  });
});
