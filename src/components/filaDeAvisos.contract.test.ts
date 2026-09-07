import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// AS DUAS FILAS, E O QUE ESTAVA FORA DELAS.
//
// O app tem duas filas com prioridade explícita — os intersticiais (um por
// vez, `const interstitial`) e o slot de avisos da Home (só o primeiro
// renderiza, o resto vira "+N"). A arquitetura está certa; a auditoria de
// 06/09/2026 achou QUATRO superfícies fora delas, e era ali que empilhava:
//
//  · `ProtectProgressModal` montava em z-120 sob os intersticiais (z-200) e
//    ficava inalcançável, com um `setTimeout(15s)` no lugar de um gate — e o
//    check-in é, por design declarado, um ritual de ~20s;
//  · a cerimônia de marco vivia em z-60, sob o check-in;
//  · evoluir abria a cerimônia (z-500) e o `EvolveTaskModal` por baixo, que
//    reaparecia cobrando "crie mais atividades" quando ela fechava;
//  · `FirstDayCard` e o priming de push eram dois `&&` soltos — logo acima do
//    comentário que manda entrar na fila.
//
// Guard de fonte, porque o que se protege é ESTRUTURA de render, e montar o
// App inteiro em jsdom para provar uma ordem custa mais do que vale.
// ---------------------------------------------------------------------------
const app = readFileSync('src/App.tsx', 'utf8');

describe('nada monta por cima da fila de intersticiais', () => {
  it('o pedido de proteger o save espera a fila esvaziar', () => {
    expect(app).toContain("{protectPrompt && interstitial === 'welcome' && (");
  });

  it('o modal de evolução espera a cerimônia terminar', () => {
    expect(app).toContain('isOpen={evolveModalStage !== null && evolutionCeremony === null}');
  });
});

describe('o slot de avisos não tem cartão solto', () => {
  it('o cartão do primeiro dia e o priming entram pela fila', () => {
    expect(app).toContain("key: 'firstDay',");
    expect(app).toContain("key: 'priming',");
    // Nenhum dos dois pode voltar a renderizar fora do `avisos.push`: o teste
    // exige que a condição apareça UMA vez, dentro do `if` da fila.
    expect((app.match(/shouldShowFirstDay\(/g) ?? []).length).toBe(1);
    expect((app.match(/if \(mostrarPrimingDePush\) avisos\.push/g) ?? []).length).toBe(1);
  });

  it('o relatório semanal vem ANTES da triagem', () => {
    // `triageQueue` quase nunca está vazia para quem tem histórico, e o slot
    // renderiza só o primeiro — com a ordem antiga, num domingo típico a única
    // superfície reflexiva da semana já nascia colapsada atrás do "+N".
    expect(app.indexOf("key: 'semanal',")).toBeLessThan(app.indexOf("key: 'triagem',"));
  });
});
