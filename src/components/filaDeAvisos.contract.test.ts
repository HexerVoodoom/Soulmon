import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PRESENTATION_ORDER } from '../utils/presentationQueue';

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
    // 14/10/2026: o modal entra na fila central; "pronto" = evolução pendente E cerimônia fechada, "na tela" = a vez dele.
    expect(app).toContain('evolveTask: evolveModalStage !== null && evolutionCeremony === null,');
    expect(app).toContain("isOpen={interstitial === 'evolveTask'}");
  });
});

describe('o slot de avisos não tem cartão solto', () => {
  it('o cartão do primeiro dia SAIU da fila (é missão: vive no menu de Missões); o priming segue nela', () => {
    // 07/10/2026 (dono): "missão é só na área de missões". O primeiro dia é uma missão de
    // três gestos — `MissionsSheet`, seção "Primeiro dia", com a marca "!" do ícone da Home.
    expect(app).not.toContain("key: 'firstDay',");
    expect(app).not.toContain('<FirstDayCard');
    expect((app.match(/shouldShowFirstDay\(/g) ?? []).length).toBe(1);
    expect(app).toContain('firstDay={primeiroDiaAtivo ? gameState.firstDay : null}');
    const sheet = readFileSync('src/components/nav/MissionsSheet.tsx', 'utf8');
    expect(sheet).toContain('<FirstDayCard');
    expect(sheet).toContain('id="first-day"');
    expect(app).toContain("key: 'priming',");
    expect((app.match(/if \(mostrarPrimingDePush\) avisos\.push/g) ?? []).length).toBe(1);
  });

  it('o CONVITE AO REFÚGIO entra na fila, uma vez, depois do primeiro dia e ANTES do HP (parecer do psicólogo, 30/09/2026)', () => {
    // Num dia difícil o primeiro cartão não pode ser coração perdido.
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
  // 14/10/2026: a cadeia ternária `interstitial` virou a fila central (`PRESENTATION_ORDER`); a posição agora é lida dela.
  const ordem = PRESENTATION_ORDER as readonly string[];

  it('a ordem declarada é (19/10/2026, D-64): TOUR → triagem → PESADELO → sonho → resumo do dia → PRÉDIO NOVO → metas → "HOJE" (reafirmar + check-in) → LEVEL UP → modal de evolução → MARCO → convite de nível → sono → ocioso', () => {
    expect(ordem).toEqual(['welcomeTour', 'triage', 'nightmare', 'dream', 'dailyReport', 'buildingIntro', 'mapTutorial', 'catalogOnboarding', 'dayGoals', 'checkIn', 'levelUp', 'evolveTask', 'groveMilestone', 'catalogLevelInvite', 'restSetup', 'unlockToast', 'noticeToast', 'welcome']);
  });

  it('o marco vem DEPOIS do relatório e do check-in (celebração depois do início de dia) e ANTES dos convites (posições, não só presença)', () => {
    const i = (k: string) => ordem.indexOf(k);
    expect(i('groveMilestone')).toBeGreaterThan(i('dailyReport'));
    expect(i('groveMilestone')).toBeGreaterThan(i('checkIn'));
    expect(i('groveMilestone')).toBeLessThan(i('catalogLevelInvite'));
  });

  it('só fica PRONTO quando há marco pendente REAL (`grovePendente`), e a cerimônia monta só por essa fila', () => {
    expect(app).toContain('groveMilestone: Boolean(grovePendente),');
    expect(app).toContain('const interstitial = presentation.current;');
    expect(app.match(/<GroveMilestoneCeremony/g) ?? []).toHaveLength(1);
    expect(app).toContain("{interstitial === 'groveMilestone' && grovePendente && grove?.pending && (");
  });

  it('a cadeia ternária antiga NÃO existe mais (uma fila só, sem sistema paralelo)', () => {
    expect(app).not.toContain('const interstitial:');
    expect(app).not.toMatch(/\? 'groveMilestone'/);
    expect((app.match(/usePresentationQueue\(/g) ?? [])).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// O TOUR DO CORVO (07/10/2026): intersticial NOVO, PRIMEIRO da fila — o cartão de boas-vindas vem
// antes do check-in e do priming. Montagem única, uma vez por aparelho, replay sem marca nova.
// ---------------------------------------------------------------------------
describe('o tour do corvo tem POSIÇÃO na fila e monta UMA vez', () => {
  it('é o primeiro intersticial, montado num único ponto', () => {
    expect(app).toContain('welcomeTour: welcomeTourOpen,');
    expect((app.match(/interstitial === 'welcomeTour'/g) ?? [])).toHaveLength(1);
    expect((app.match(/<WelcomeTour /g) ?? [])).toHaveLength(1);
  });
  it('visto OU pulado grava a mesma flag; o replay não grava nada', () => {
    expect((app.match(/writeFlag\(STORAGE_KEYS\.WELCOME_TOUR_SHOWN/g) ?? [])).toHaveLength(1);
    expect(app).toContain('if (!welcomeTourReplay) {');
  });
  it('não toca em som nem em XP', () => {
    const src = readFileSync('src/components/WelcomeTour.tsx', 'utf8');
    expect(src).not.toMatch(/sounds|audioBus|play[A-Z]\w+\(|gamePoints|totalXP/);
  });
});

// ---------------------------------------------------------------------------
// A APRESENTAÇÃO DO PRÉDIO NOVO (08/10/2026; refeita em 14/10/2026 como `NpcSequence` em tela cheia). Vem DEPOIS do
// level-up e do resumo do dia; é marcada como VISTA ao ser MOSTRADA (não ao fechar) — o bug "abri de novo e vieram dois
// modais do mapa".
// ---------------------------------------------------------------------------
describe('a apresentação do prédio novo tem POSIÇÃO na fila e monta UMA vez', () => {
  it('montada num único ponto, só com a sequência já capturada (`introShown`)', () => {
    expect((app.match(/interstitial === 'buildingIntro'/g) ?? [])).toHaveLength(1);
    expect((app.match(/<BuildingIntro /g) ?? [])).toHaveLength(1);
    expect(app).toContain("{interstitial === 'buildingIntro' && introShown.length > 0 && (");
    expect(app).toContain('buildingIntro: introShown.length > 0,');
  });
  it('fechar/pular esvazia a sequência', () => {
    expect(app).toContain('<BuildingIntro ids={introShown} language={language} onFinish={() => setIntroShown([])} />');
  });
  it('14/10/2026: dispara SÓ na primeira entrada no prédio (`visitarPredio`), marcando visto na hora; o level-up NÃO a dispara', () => {
    expect((app.match(/markBuildingIntroSeen\(/g) ?? [])).toHaveLength(1);
    expect(app).toMatch(/!vistos\.includes\(id\)\)\s*\{\s*setIntroShown\(\[id\]\);/);
    expect(app).not.toContain('pendingBuildingIntros');
    expect(app).not.toContain('buildingIntroReady');
  });
  it('desbloqueio de prédio vira BALÃO (`unlockToast`), com os prédios do mesmo level-up juntos, gravado ao mostrar o level-up', () => {
    expect(app).toContain('buildingsUnlockedBetween(levelUpEvent.from, levelUpEvent.to)');
    expect(app).toContain('unlockToast: unlockToastIds.length > 0,');
    expect((app.match(/<UnlockToast /g) ?? [])).toHaveLength(1);
  });
  it('save sem o campo não dispara nada (undefined → sem pendente)', () => {
    expect(app).toContain('vistos !== undefined');
  });
});

// ---------------------------------------------------------------------------
// O LEVEL UP (11/10/2026): intersticial NOVO, entre o marco do Bosque e o sonho. Monta UMA vez, só quando é a
// vez dele, lazy; a saída é o toque (nada de timer) e z 300 fica acima da fila (200).
// ---------------------------------------------------------------------------
describe('o level up tem POSIÇÃO na fila e monta UMA vez', () => {
  it('é intersticial e CELEBRAÇÃO: vem DEPOIS do início de dia (resumo e "Hoje"), antes dos convites (D-64, REGISTRO §111)', () => {
    const o = PRESENTATION_ORDER as readonly string[];
    expect(o.indexOf('levelUp')).toBeGreaterThan(o.indexOf('dailyReport'));
    expect(o.indexOf('levelUp')).toBeGreaterThan(o.indexOf('checkIn'));
    expect(o.indexOf('levelUp')).toBeLessThan(o.indexOf('catalogLevelInvite'));
    expect((app.match(/interstitial === 'levelUp'/g) ?? [])).toHaveLength(1);
    expect((app.match(/<LevelUpOverlay /g) ?? [])).toHaveLength(1);
    expect(app).toContain("const LevelUpOverlay = lazy(");
  });
  it('o evento é DERIVADO (levelUpPending); o nível é gravado AO MOSTRAR (instantâneo `levelUpShown` segura o overlay)', () => {
    expect(app).toContain('levelUpPending(gameState.totalXP, gameState.lastCelebratedLevel, levelUpDemo)');
    // REGISTRO §31: a gravação é a função pura `applyLevelUpCelebrated` (que também restaura energia/HP), UMA vez, em `handleLevelUpDone`.
    expect((app.match(/applyLevelUpCelebrated\(prev, celebrated\)/g) ?? [])).toHaveLength(1);
    expect(app).not.toMatch(/lastCelebratedLevel: Math\.max\(/);
    expect(app).toMatch(/setLevelUpShown\(levelUpEvent\);\s*handleLevelUpDone\(levelUpEvent\.to\);/);
    expect(app).toContain('onDone={() => setLevelUpShown(null)}');
  });
  it('o overlay fica ACIMA da fila, sem timer de saída', () => {
    const src = readFileSync('src/components/LevelUpOverlay.tsx', 'utf8');
    expect(src).toContain('zIndex: 300');
    expect(src).not.toMatch(/setTimeout\([^)]*(finish|onDone)|setInterval\([^)]*(finish|onDone)/);
  });
});

describe('check-ins ocultos (§40.4-b) e compromisso da manhã com flag própria (§53)', () => {
  it('o item `checkIn` (compromisso) da fila depende SÓ de MORNING_COMMITMENT_ENABLED, gravando o visto ao mostrar', () => {
    const efeito = app.slice(app.indexOf('const checkInPromptedRef'), app.indexOf('/** Fecha o check-in gravando os focos escolhidos'));
    expect(efeito).toContain('if (!MORNING_COMMITMENT_ENABLED) return;');
    expect(efeito).not.toContain('CHECKINS_ENABLED');
    expect(efeito.indexOf('if (!MORNING_COMMITMENT_ENABLED) return;')).toBeLessThan(efeito.indexOf("track('checkin_shown')"));
    expect(app).toMatch(/else if \(id === 'checkIn'\) \{[^}]*lastCheckInDate: dia/);
    // os 3 check-ins de janela seguem atrás do interruptor antigo
    expect(app).toContain('{CHECKINS_ENABLED && checkInsAbertos && ');
    const ck = readFileSync('src/utils/checkIns.ts', 'utf8');
    expect(ck).toContain('export const CHECKINS_ENABLED = false;');
    expect(ck).toContain('export const MORNING_COMMITMENT_ENABLED = false;');
  });
});
