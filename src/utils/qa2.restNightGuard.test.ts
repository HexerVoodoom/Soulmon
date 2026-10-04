/**
 * QA2 (04/10/2026) — o guard "esta noite já foi registrada?" do App comparava
 * `rest.nights[].date` com o dia de HOJE do jogador (`playerDayKey`), mas
 * `recordNight` nomeia a noite pela MANHÃ em que ela acaba (`morningKey`): a de
 * hoje à noite é "amanhã". Resultado: a manhã de ontem (registrada com a data de
 * hoje) fazia `jaRegistrada` dar `true` e o XP `restNight` + a missão
 * `rest-nights` só pagavam na PRIMEIRA noite da vida do save.
 */
import { describe, it, expect } from 'vitest';
import { createRestState, recordNight, nightAlreadyRecorded } from './restWindow';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m);

describe('nightAlreadyRecorded — pela manhã da noite, não pelo dia de hoje', () => {
  it('a 2ª noite seguida NÃO é "já registrada" (a manhã de ontem tem a data de hoje)', () => {
    let rest = createRestState();
    rest = recordNight(rest, at(4, 23));                   // noite 1: manhã = 5/10
    expect(nightAlreadyRecorded(rest, at(5, 23))).toBe(false); // noite 2: manhã = 6/10
  });

  it('deitar de novo na MESMA noite é "já registrada" (antes e depois da meia-noite)', () => {
    let rest = createRestState();
    rest = recordNight(rest, at(4, 23));
    expect(nightAlreadyRecorded(rest, at(4, 23, 40))).toBe(true);
    expect(nightAlreadyRecorded(rest, at(5, 1))).toBe(true);    // madrugada: mesma manhã (5/10)
  });

  it('sem registro nenhum não há "já registrada"', () => {
    expect(nightAlreadyRecorded(createRestState(), at(4, 23))).toBe(false);
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('App usa o guard pela manhã da noite', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  it('XP de descanso e missão rest-nights perguntam a nightAlreadyRecorded', () => {
    expect(app).toMatch(/const jaRegistrada = nightAlreadyRecorded\(rest, now\)/);
    expect(app).toMatch(/!nightAlreadyRecorded\(restAntes, now\)\) contarMissao\('rest-nights'\)/);
    expect(app).not.toMatch(/rest\.nights\.some\(n => n\.date === chaveDaNoite\)/);
  });
});
