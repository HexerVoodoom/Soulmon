/** beta12 §G e §J: a fiação do App (lida do fonte, como os demais contratos de fiação) e o sinal do Bosque. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bosqueSobAtaque, bosqueDefendivel } from './hooks/useGroveAtaque';

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
const hud = readFileSync(new URL('./components/CompanionHUD.tsx', import.meta.url), 'utf8');
const ctx = readFileSync(new URL('./contexts/GameStateContext.tsx', import.meta.url), 'utf8');
const hook = readFileSync(new URL('./hooks/useGroveAtaque.ts', import.meta.url), 'utf8');
const tag = readFileSync(new URL('./components/NoticeToast.tsx', import.meta.url), 'utf8');

describe('§G balões dourados: fiação', () => {
  it('o dispensado mora no SAVE da conta (campo opcional, hidratado com leitura tolerante), não só em localStorage', () => {
    expect(ctx).toContain('balaoDourado?: BalaoDispensados;');
    expect(ctx).toContain('balaoDourado: sanitizeBalaoDourado(loadedState.balaoDourado)');
    expect(app).toContain('balaoDourado: reg');
    expect(app).not.toMatch(/localStorage[^\n]*balaoDourado/);
  });
  it('a fila é única: um balão por vez, escolhido por prioridade (Bosque > Fenda > achado)', () => {
    expect(app).toContain('escolherBalao({ grove: bosqueDefendivel({ atacado: bosqueAtacado, cuidavel: bosqueCuidavel }, fioMetaCumprida), rift: naMasmorra, achado: achadoPendente !== null }, gameState.balaoDourado, diaBalao)');
  });
  it('grava ao TOCAR e ser direcionado, não ao exibir: Bosque e achado dispensam no toque; a Fenda dispensa ao ESCOLHER ir', () => {
    const toque = app.slice(app.indexOf('const handleBalaoDourado'), app.indexOf('const balaoDouradoHud'));
    expect(toque).toContain("if (tipo === 'rift') { abrirAvisoMasmorra(null); return; }");
    expect(toque).toContain('dispensarBalao(tipo);');
    const fenda = app.slice(app.indexOf('const irAFenda'), app.indexOf('const irAFenda') + 200);
    expect(fenda).toContain("dispensarBalaoRef.current('rift')");
  });
  it('Bosque sob ataque leva ao Bosque sem exigir pré-requisito (nada de tarefas na conta do toque)', () => {
    const toque = app.slice(app.indexOf('const handleBalaoDourado'), app.indexOf('const balaoDouradoHud'));
    expect(toque).toContain("setPendingSheet({ area: 'hall', lot: 'grove' })");
    expect(toque).not.toMatch(/tend|pendentes|metaCumprida|tarefas/);
  });
  it('a volta da missão não abre o encontro sozinha: guarda o achado para o balão', () => {
    expect(app).toContain('setAchadoPendente({ loja: volta.feiraLoja })');
    expect(app).toContain('setAchadoPendente({ evento: volta.evento })');
    expect(app).not.toMatch(/\bsetFeiraEvento\(volta\.evento\)/);
    expect(app).not.toMatch(/\bsetFeiraLoja\(volta\.feiraLoja\)/);
  });
  it('o HUD recebe o balão e o ponto de montagem do chat não foi tocado', () => {
    expect(app).toContain('balaoDourado={balaoDouradoHud}');
    expect(app).toContain('onBalaoDourado={handleBalaoDourado}');
    expect(hud).toContain('{chatHost ? createPortal(chatDock, chatHost) : chatDock}');
  });
  it('o sinal "Bosque sob ataque" é o `underAttack` do servidor: só leitura, sem timer, só com memória de roda, nada no save', () => {
    expect(hook).toContain("import('../utils/claApi')");
    expect(hook).toContain('readGroveLocal()');
    expect(hook).not.toMatch(/setInterval/);
    expect(hook).not.toMatch(/setGameState|GameState/);
  });
});

describe('sinal do Bosque (G4)', () => {
  const v = (o: Partial<Parameters<typeof bosqueSobAtaque>[0] & object> = {}) => ({ planted: true, mature: false, underAttack: true, protectedToday: false, ...o });
  it('atacada, de pé e ainda sem proteção: sim', () => { expect(bosqueSobAtaque(v())).toBe(true); });
  it('sem ataque, já protegida, madura, sem planta ou sem vista: não', () => {
    expect(bosqueSobAtaque(v({ underAttack: false }))).toBe(false);
    expect(bosqueSobAtaque(v({ protectedToday: true }))).toBe(false);
    expect(bosqueSobAtaque(v({ mature: true }))).toBe(false);
    expect(bosqueSobAtaque(v({ planted: false }))).toBe(false);
    expect(bosqueSobAtaque(null)).toBe(false);
  });
});

describe('§J tarefas linkadas: fiação', () => {
  it('campos novos do save são opcionais e hidratados com leitura tolerante', () => {
    expect(ctx).toContain('tarefaAuto?: string[];');
    expect(ctx).toContain('tarefaAuto: sanitizeTarefaAuto(loadedState.tarefaAuto)');
  });
  it('A8/A10: grava a chave ANTES de marcar e marca pelo MESMO handler do toque manual (sem bônus; sem Desfazer)', () => {
    const bloco = app.slice(app.indexOf('const autoCheck = useCallback'), app.indexOf('const autoCheckRef'));
    expect(bloco.indexOf('registrarAuto')).toBeGreaterThan(-1);
    expect(bloco.indexOf('registrarAuto')).toBeLessThan(bloco.indexOf('toggleHabitRef.current(id, { auto: true })'));
    expect(bloco).not.toMatch(/foodInventory|bumpDaily|award|grant/);
    expect(app).toContain('opts?.auto !== true && !(activity.completedToday');
  });
  it('A5: o MESMO evento de registro novo do Caderno dispara o check (sem gatilho paralelo); fechar sem salvar não dispara', () => {
    const cad = app.slice(app.indexOf('const handleCaderno = useCallback'), app.indexOf('Migração ÚNICA'));
    expect(cad).toContain("depois.some(e => !antes.some(o => o.id === e.id))) setCadernoGuardado(n => n + 1)");
    // §357: o check NUNCA roda dentro do evento do Guardar (travava o app); só no efeito pós-commit
    expect(cad).not.toContain("autoCheckRef.current('caderno')");
    expect(app).toContain("if (cadernoGuardado > 0) autoCheckRef.current('caderno');");
    expect(cad).toContain("bumpDailyIn(prev, 'journal')"); // o gatilho da semanal continua o mesmo
  });
  it('Q5: sessão de foco concluída marca só o hábito `habit:<id>` escolhido', () => {
    expect(app).toContain("onFocusSessionTask: (taskId?: string) => { if (taskId?.startsWith('habit:')) autoCheck('foco', [taskId.slice('habit:'.length)]); }");
  });
  it('A7: a tag espera qualquer intersticial (um aviso por vez) e o texto passa pelo anúncio de leitor de tela', () => {
    expect(app).toContain("autoTags.length > 0 && interstitial === 'welcome'");
    expect(tag).toContain('aria-label={autoTagAria(name, language)}');
  });
  it('A11/regra 1 de steps.ts: nenhuma recompensa nova ligada só a passo (o módulo de link não importa regra de pontuação)', () => {
    const link = readFileSync(new URL('./utils/tarefaLink.ts', import.meta.url), 'utf8');
    expect(link).not.toMatch(/foodInventory|awardBondXP|bumpDaily|energyPoints|perfectDays|healthPoints/);
  });
});

describe('§333 balões de dica: fiação', () => {
  it('a dica dourada navega pelo evento do app (requestGoToBuilding), nunca por caminho próprio', () => {
    const toque = app.slice(app.indexOf('const handleBalaoDourado'), app.indexOf('const balaoDouradoHud'));
    expect(toque).toContain('if (ehDicaDourada(tipo)) { encerrarDicaDourada(); requestGoToBuilding(DICA_DESTINO[tipo]); return; }');
  });
  it('a dica dourada só entra sem balão de evento na vez e só na Home (nunca empilha)', () => {
    expect(app).toContain("bloqueado: currentView !== 'home' || balaoTipo !== null");
    expect(app).toContain(': dicaDourada.ativa ? { tipo: dicaDourada.ativa, text: dicaTexto(dicaDourada.ativa, language)');
  });
  it('relaxar usa a régua da moeda do Refúgio (o do dia não tomado e energia não cheia) e o portão do prédio', () => {
    expect(app).toContain("refugioDaEnergia: buildingGateFor('forja.refugio', bondDica).open && !refugioEnergyTaken(gameState, agoraDica)");
  });
  it('a Lilia usa a MESMA meta que libera o cuidado do Grove e o portão do prédio', () => {
    expect(app).toContain('metaDoDia: fioMetaCumprida,');
    expect(app).toContain("groveAberto: !demo && buildingGateFor('hall.grove', bondDica).open,");
  });
  it('o HUD recebe a dica comum e devolve a aparição', () => {
    expect(app).toContain('dicaFala={dicaFalaHud}');
    expect(app).toContain('onDicaFalada={marcarDica}');
  });
  it('uma consulta ao servidor serve os dois sinais do Grove', () => {
    expect(hook).toContain('export function useGroveEstado');
    expect(app).toContain('const { atacado: bosqueAtacado, cuidavel: bosqueCuidavel } = useGroveEstado(');
  });
});

describe('balão do Bosque só com ação possível (13/11/2026)', () => {
  it('sob ataque mas SEM meta do dia (não dá para defender): sem balão', () => {
    expect(bosqueDefendivel({ atacado: true, cuidavel: true }, false)).toBe(false);
  });
  it('sob ataque, meta cumprida, mas sem cuidado do dia por fazer: sem balão', () => {
    expect(bosqueDefendivel({ atacado: true, cuidavel: false }, true)).toBe(false);
  });
  it('sob ataque + meta cumprida + cuidado por fazer: balão', () => {
    expect(bosqueDefendivel({ atacado: true, cuidavel: true }, true)).toBe(true);
  });
  it('sem ataque nunca há balão', () => {
    expect(bosqueDefendivel({ atacado: false, cuidavel: true }, true)).toBe(false);
  });
  it('o App usa a MESMA meta (`fioMetaCumprida`) que libera o cuidado, não uma cópia da regra', () => {
    expect(app).toContain('bosqueDefendivel({ atacado: bosqueAtacado, cuidavel: bosqueCuidavel }, fioMetaCumprida)');
  });
});
