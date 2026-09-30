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

  it('o CONVITE AO REFÚGIO entra na fila, uma vez, depois do primeiro dia e ANTES do HP (parecer do psicólogo, 30/09/2026)', () => {
    // Num dia difícil o primeiro cartão não pode ser coração perdido.
    expect(app.indexOf("key: 'firstDay',")).toBeLessThan(app.indexOf("key: 'refugio',"));
    expect(app.indexOf("key: 'refugio',")).toBeLessThan(app.indexOf("key: 'hp',"));
    expect(app.match(/if \(shouldInviteRefuge\(/g) ?? []).toHaveLength(1);
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

describe('o MARCO DO BOSQUE entra nas duas filas, com posição declarada (Guilda, B1)', () => {
  const interstitial = app.slice(app.indexOf('const interstitial:'), app.indexOf('const interstitial:') + 1400);

  it("'groveMilestone' é intersticial: DEPOIS de relatório e check-in, ANTES do sonho e do pesadelo", () => {
    const ordem = ["'triage'", "'dailyReport'", "'checkIn'", "'groveMilestone'", "'dream'", "'nightmare'", "'catalogOnboarding'", "'catalogLevelInvite'", "'welcome'"];
    // na UNIÃO de tipos (uma vez, na ordem declarada)
    const uniao = interstitial.slice(0, interstitial.search(/=\r?\n/));
    const posUniao = ordem.map(o => uniao.indexOf(o));
    expect(posUniao.every(p => p >= 0)).toBe(true);
    expect([...posUniao].sort((a, b) => a - b)).toEqual(posUniao);
    // e na cadeia de decisão (a ordem que de fato manda)
    const cadeia = interstitial.slice(interstitial.search(/=\r?\n/));
    const posCadeia = ordem.map(o => cadeia.indexOf(o));
    expect(posCadeia.every(p => p >= 0)).toBe(true);
    expect([...posCadeia].sort((a, b) => a - b)).toEqual(posCadeia);
    expect((app.match(/\? 'groveMilestone'/g) ?? [])).toHaveLength(1);
  });

  it('a cerimônia monta UMA vez, só quando é a vez dela, e a saída é o gesto (nada de timer)', () => {
    expect((app.match(/interstitial === 'groveMilestone'/g) ?? [])).toHaveLength(1);
    expect((app.match(/<GroveMilestoneCeremony/g) ?? [])).toHaveLength(1);
    expect(app).toContain('onDone={acknowledgeGroveMilestone}');
    const cer = readFileSync('src/components/guild/GroveMilestoneCeremony.tsx', 'utf8');
    expect(cer).toContain('zIndex={300}');
    expect(cer).not.toMatch(/setTimeout|setInterval/);
  });

  it('a cerimônia fica ACIMA da fila (z 300 > 200) e nenhum modal do Bosque nasce fora dela', () => {
    expect(readFileSync('src/components/guild/GroveMilestoneCeremony.tsx', 'utf8')).toMatch(/RitualDialog/);
    // o único ponto de montagem é o da fila; a folha da Guilda não monta cerimônia por conta própria
    for (const f of ['GuildSheet.tsx', 'GroveVisor.tsx']) {
      expect(readFileSync(`src/components/guild/${f}`, 'utf8'), f).not.toMatch(/GroveMilestoneCeremony|RitualDialog/);
    }
  });

  it("o aviso 'marcoBosque' entra no slot da Home UMA vez, atrás de recomeço e de carga, antes de 'termos'", () => {
    const chaves = [...app.matchAll(/key: '([a-zA-Z]+)',/g)].map(m => m[1]);
    expect(chaves.filter(k => k === 'marcoBosque')).toHaveLength(1);
    const i = (k: string) => chaves.indexOf(k);
    expect(i('marcoBosque')).toBeGreaterThan(i('recomeco'));
    expect(i('marcoBosque')).toBeGreaterThan(i('carga'));
    expect(i('marcoBosque')).toBeLessThan(i('termos'));
    // 'termos' segue o último (o teste acima) e o aviso não usa unshift (não fura a ordem)
    expect((app.match(/avisos\.unshift\(/g) ?? [])).toHaveLength(1);
  });

  it('o aviso só nasce NO DIA do marco (a régua é `groveAvisoFor`, comparada ao dia do jogador)', () => {
    expect(app).toContain('groveAvisoFor(grove, playerDayKey(new Date(), gameState.playerDayTz))');
    const aviso = app.slice(app.indexOf("key: 'marcoBosque'") - 200, app.indexOf("key: 'marcoBosque'") + 900);
    expect(aviso).toContain("'guild.marco.aviso'");
    expect(aviso).not.toMatch(/onClick|button/); // informativo: sem cobrança, sem "abrir agora"
  });

  it('o fio da Guilda vale a meta de CORAÇÃO (`heartGoalFor`), e o App a passa por props — a folha não decide meta', () => {
    expect(app).toContain('heartGoalFor(gameState, new Date().getDay(), new Date().toDateString())');
    expect(app).toContain('metaDoDiaCumprida: fioMetaCumprida');
    // ...e a definição dela é `done ≥ heart`, nunca a meta inteira (`dailyTotal`)
    expect(app).toContain('const fioMetaCumprida = dailyTotal > 0 && dailyDone >= heartGoalHoje;');
    expect(app).toContain('const fioGoal = { done: dailyDone, heart: heartGoalHoje, full: dailyTotal };');
    expect(app).toMatch(/guild=\{\{ saveId, metaDoDiaCumprida: fioMetaCumprida, fioGoal, mySprite: minhaCriaturaUrl/);
    const sheet = readFileSync('src/components/guild/GuildSheet.tsx', 'utf8');
    expect(sheet).not.toMatch(/heartGoalFor|dailyGoalFor/);
  });

  it('os cenários do Bosque vão ao save FORA de updater: `grantGroveScenes` só dentro do `setGameState` do efeito do hook', () => {
    expect((app.match(/grantGroveScenes\(/g) ?? [])).toHaveLength(1);
    expect(app).toContain('onScenes: useCallback((ids: string[]) => setGameState(prev => grantGroveScenes(prev, ids)), [setGameState])');
  });
});

// ---------------------------------------------------------------------------
// O MARCO DO BOSQUE NA FILA DE INTERSTICIAIS (QA L3-codigo A2).
//
// `groveMilestone` (a cerimônia z-300 da Guilda) é raro e descritivo: cede a vez ao que a pessoa faz
// todo dia (relatório, check-in) e vem ANTES do sonho. Em 29/09/2026 uma mutação que o tirava da
// expressão `interstitial` (`grovePendente ? 'groveMilestone'` → `false ? …`) deixou os 16 testes
// desta régua verdes: a posição declarada só existia em comentário. Lê a expressão do FONTE.
// ---------------------------------------------------------------------------
describe('o marco do Bosque tem POSIÇÃO na fila (L3 A2)', () => {
  const ini = app.indexOf('const interstitial:');
  const expr = app.slice(ini, app.indexOf("'welcome';", ini) + "'welcome';".length);
  /** Os nomes na ordem em que a cadeia ternária os decide (o último é o `: 'welcome'`). */
  const ordem = [...expr.matchAll(/\?\s*'(\w+)'|:\s*'(welcome)'/g)].map(m => m[1] ?? m[2]);

  it('a expressão existe e a ordem é: triagem → relatório → check-in → MARCO → sonho → pesadelo → catálogo → boas-vindas', () => {
    expect(ini).toBeGreaterThan(0);
    expect(ordem).toEqual(['triage', 'dailyReport', 'checkIn', 'groveMilestone', 'dream', 'nightmare', 'catalogOnboarding', 'catalogLevelInvite', 'welcome']);
  });

  it('o marco vem DEPOIS do relatório e do check-in e ANTES do sonho (posições, não só presença)', () => {
    const i = (k: string) => ordem.indexOf(k);
    expect(i('groveMilestone')).toBeGreaterThan(i('dailyReport'));
    expect(i('groveMilestone')).toBeGreaterThan(i('checkIn'));
    expect(i('groveMilestone')).toBeLessThan(i('dream'));
  });

  it('só decide `groveMilestone` quando há marco pendente REAL (`grovePendente`), e a cerimônia monta só por essa fila', () => {
    expect(expr).toMatch(/grovePendente\s*\?\s*'groveMilestone'/);
    expect(app.match(/<GroveMilestoneCeremony/g) ?? []).toHaveLength(1);
    expect(app).toContain("{interstitial === 'groveMilestone' && grovePendente && grove?.pending && (");
  });

  it('o tipo declarado da fila também lista `groveMilestone` (a expressão e o tipo não divergem)', () => {
    expect(expr.slice(0, expr.indexOf('=')).includes("'groveMilestone'")).toBe(true);
  });
});
