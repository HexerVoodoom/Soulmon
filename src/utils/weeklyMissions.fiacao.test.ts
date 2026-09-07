import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { weeklyMissionPool } from './weeklyMissions';

// ---------------------------------------------------------------------------
// O MÓDULO NÃO PODE VOLTAR A FICAR MUDO.
//
// A auditoria de 06/09/2026 achou `weeklyMissions.ts` completo, testado e com
// **zero consumidores** — a terceira repetição do padrão que o WP4.15
// consertou no Vínculo (`bondRewardsClaimed` nunca escrito) e o WP4.16 nas
// estações. Quanto mais completo o módulo, menos óbvio que ele está desligado:
// os testes de unidade passam todos, e nada na tela existe.
//
// Este guard é de FIAÇÃO. Ele não testa a regra (isso é `weeklyMissions.test.ts`),
// testa que a regra está PLUGADA — que é a coisa que os outros testes, por
// construção, não conseguem ver.
// ---------------------------------------------------------------------------
const app = readFileSync('src/App.tsx', 'utf8');
const shop = readFileSync('src/components/ShopModal.tsx', 'utf8');

describe('as missões semanais estão plugadas', () => {
  it('existe UM ponto de contagem, e ele vira a semana no mesmo updater', () => {
    // Um ponto só, e não um `bumpWeekly` espalhado por doze handlers: a virada
    // de semana (`forWeek`) tem de acontecer no MESMO updater que soma, senão
    // um contador da semana passada recebe +1 antes de ser zerado.
    expect(app).toContain('const contarMissao');
    const i = app.indexOf('const contarMissao');
    const corpo = app.slice(i, i + 900);
    expect(corpo).toContain('forWeek(');
    expect(corpo).toContain('bumpWeekly(');
    expect((app.match(/bumpWeekly\(/g) ?? []).length).toBe(1);
  });

  it('TODA missão do pool tem um gatilho no app', () => {
    // É este o teste que teria pego o módulo mudo — e ele também pega a
    // missão nova que alguém acrescenta ao pool sem ligar em lugar nenhum.
    const semGatilho = weeklyMissionPool()
      .map(m => m.id)
      .filter(id => !app.includes(`contarMissao('${id}')`));
    expect(semGatilho).toEqual([]);
  });

  it('o resgate paga por `claimWeekly`, que é idempotente', () => {
    expect(app).toContain('claimWeekly(');
    const i = app.indexOf('const resgatarMissao');
    expect(i).toBeGreaterThan(-1);
    // Pagar duas vezes é bug de economia: o guard exige a saída antecipada
    // quando `claimWeekly` devolve zero.
    expect(app.slice(i, i + 800)).toContain('if (emblems === 0) return prev;');
  });

  it('a lista chega à tela', () => {
    expect(app).toContain('weeklyMissions={missoesDaSemana}');
    expect(app).toContain('onClaimWeekly={resgatarMissao}');
    // No segmento do Torneio: é onde os Emblemas são gastos, e a missão é de
    // onde eles vêm — a torneira e o ralo na mesma tela.
    expect(shop).toMatch(/seg === 'tournament' && \(weeklyMissions\?\.length/);
  });
});
