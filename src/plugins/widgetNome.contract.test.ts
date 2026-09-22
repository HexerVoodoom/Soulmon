import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { widgetPetName } from './SoulmonWidgetPlugin';

// ---------------------------------------------------------------------------
// O WIDGET CHAMA O PET PELO NOME DA HOME.
//
// QA rodada 1 (21/09/2026, 05-plataforma-r1 §4.4): o `App.tsx` mandava
// `evolutionStage` capitalizado como `petName` — "Rookie" nos widgets A, B e D
// enquanto a Home dizia "Pyraka". Regra copiada (footgun 9): o nome tem dono
// (`utils/petName.ts` › `soulmonDisplayName`). Este guard lê o FONTE porque
// nenhum teste em `node` alcança o RemoteViews.
// ---------------------------------------------------------------------------
describe('widgetPetName', () => {
  it('é o mesmo nome da Home: batizado > baseName > "Soulmon"', () => {
    expect(widgetPetName({ baseName: 'Pyraka', petName: 'Faísca' })).toBe('Faísca');
    expect(widgetPetName({ baseName: 'Pyraka' })).toBe('Pyraka');
    expect(widgetPetName({ baseName: '  ', petName: ' ' })).toBe('Soulmon');
    expect(widgetPetName(undefined)).toBe('Soulmon');
  });

  it('nunca é o estágio', () => {
    for (const nome of [widgetPetName(undefined), widgetPetName({ baseName: 'Zeed' })]) {
      expect(nome).not.toMatch(/^(Rookie|Champion|Ultimate|Mega|Ultra)$/);
    }
  });
});

describe('App.tsx › updateWidgetData', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const inicio = app.indexOf('SoulmonWidget.updateWidgetData({');
  expect(inicio).toBeGreaterThan(-1);
  const bloco = app.slice(inicio, app.indexOf('}).catch', inicio));

  it('o petName do bridge vem do dono do nome', () => {
    expect(bloco).toMatch(/petName:\s*widgetPetName\(gameState\.soulmonMeta\)/);
  });

  it('o "nome = estágio" não volta', () => {
    expect(app).not.toMatch(/evolutionStage\.charAt\(0\)\.toUpperCase\(\)/);
  });
});
