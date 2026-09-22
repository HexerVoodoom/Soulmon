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

  it('a INCUBAÇÃO entra na fila, uma vez, logo depois do HP (D-G8c, parecer R-O)', () => {
    // Posição declarada: HP é a única coisa que cobra e mantém precedência; a
    // incubação é rara (uma vez por evolução) e descritiva, então vence tudo o
    // que aparece todo dia. A condição aparece UMA vez — duas seriam duas
    // superfícies falando da mesma coisa, que é como se empilha aviso.
    expect(app.indexOf("key: 'hp',")).toBeLessThan(app.indexOf("key: 'incubacao',"));
    expect(app.indexOf("key: 'incubacao',")).toBeLessThan(app.indexOf("key: 'semanal',"));
    expect(app.match(/if \(incubandoAgora\) avisos\.push\(/g) ?? []).toHaveLength(1);
  });

  it('o pet NÃO fala da incubação: ela vive na fila, e só (parecer R-O)', () => {
    // Um aviso que o pet repete em idle vira cobrança por repetição — é o
    // mesmo motivo por que a tarefa assombrada é gesto e não frase.
    const falas = app.slice(app.indexOf('const petSpeech'), app.indexOf('const petSpeech') + 4000);
    expect(falas).not.toMatch(/incuba/i);
  });

  it('o relatório semanal vem ANTES da triagem', () => {
    // `triageQueue` quase nunca está vazia para quem tem histórico, e o slot
    // renderiza só o primeiro — com a ordem antiga, num domingo típico a única
    // superfície reflexiva da semana já nascia colapsada atrás do "+N".
    expect(app.indexOf("key: 'semanal',")).toBeLessThan(app.indexOf("key: 'triagem',"));
  });

  it("'termos' é o ÚLTIMO da fila (decisão #24: é o único aviso que não fala do dia da pessoa)", () => {
    // Skeptic #3 / design A7 (21/09/2026): a ordem estava só em comentário.
    const chaves = [...app.matchAll(/key: '([a-zA-Z]+)',/g)].map(m => m[1]);
    expect(chaves).toContain('termos');
    expect(chaves[chaves.length - 1]).toBe('termos');
    expect(chaves.filter(k => k === 'termos')).toHaveLength(1);
  });

  it("…EXCETO na primeira exibição da versão, quando vai para a posição 1 (A3, QA rodada 2)", () => {
    // Ajuste do contrato, com justificativa: "último da fila" + "+N recolhido"
    // + triagem que aparece todo dia = o banner nunca era visto na primeira
    // vez. A decisão #24 (informativo, sem re-aceite) continua; o que muda é
    // que a PRIMEIRA abertura o mostra na frente, e as seguintes voltam ao
    // último lugar. A marca de "já exibido" fica no aparelho
    // (`TERMS_NOTICE_SHOWN`), separada do "Ok" (`TERMS_NOTICE_SEEN`).
    expect(app).toContain("if (termsNoticePrimeiraVez) avisos.unshift(termos); else avisos.push(termos);");
    expect(app).toContain('STORAGE_KEYS.TERMS_NOTICE_SHOWN');
    // O `unshift` é o ÚNICO na fila: nenhum outro aviso fura a ordem.
    expect((app.match(/avisos\.unshift\(/g) ?? []).length).toBe(1);
  });

  it('o banner de termos recebe `changed` de `qualDocMudou` (não afirma mudança nos dois quando só um mudou)', () => {
    expect(app).toMatch(/<TermsUpdateBanner[^>]*changed=\{qualDocMudou\(/);
  });
});
