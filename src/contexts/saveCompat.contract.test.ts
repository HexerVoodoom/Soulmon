/**
 * RÉGUA DE COMPATIBILIDADE DO SAVE (D-01, 20/10/2026)
 * ====================================================
 *
 * Há usuários reais desde 20/10/2026 (teste fechado na Play). Campo novo no
 * save sem leitura tolerante quebra o save de quem já tem o app. A regra
 * completa está no CLAUDE.md, seção "Compatibilidade — há usuários reais
 * desde 20/10/2026".
 *
 * Três réguas, só por leitura de fonte (sem jsdom):
 *  1. todo campo de `GameState` tem linha própria em `hydrateSave`;
 *  2. o que o servidor (`functions/api/save.js`) sanitiza existe em
 *     `GameState` e tem teste de servidor (dívida atual congelada);
 *  3. nenhuma chave de localStorage já publicada some.
 *
 * A AUTOVERIFICAÇÃO roda as mesmas funções sobre fontes sintéticas para
 * provar que a régua reprova.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { STORAGE_KEYS } from '../utils/storageKeys';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(resolve(RAIZ, p), 'utf8');

// ------------------------------------------------------------ congelados

/** Nomes que o regex de `state.X` poderia pegar e que não são campo do save. Hoje: nenhum (conferido à mão em 20/10/2026). */
const NAO_SAO_CAMPOS: string[] = [];

/**
 * Campos que o servidor sanitiza (`'X' in state`) e que hoje NÃO são citados
 * em nenhum functions/api/*.test.js.
 * Dívida registrada em 20/10/2026; não cresça esta lista (só pode diminuir).
 */
const SEM_TESTE_DE_SERVIDOR_HOJE: string[] = ['missionsClaimed'];

/** Espelho de SERVER_OWNED_FIELDS em functions/api/save.js. */
const SERVER_OWNED_FIELDS = ['accountTier', 'credits'];

const GAME_STATE = 'soulmon_state_v1';

/**
 * Chaves que nasceram DEPOIS de 20/10/2026. Chave nova em STORAGE_KEYS entra
 * aqui no mesmo PR (e daí em diante também não pode sumir).
 */
const NOVAS_DESDE_20_10_2026: readonly string[] = [
  'soulmon-save-quarantine-v1',
  'soulmon-local-stale-v1',
  'soulmon-backup-ring-v1',
  'soulmon-save-revision-v1',
  'soulmon-picross-base-paid',
  'soulmon-gifts-credited-v1',
  'soulmon-generate-character-until',
];

/** Valores de STORAGE_KEYS em 20/10/2026 — literal, não derivada. */
const CHAVES_EM_20_10_2026: readonly string[] = [
  'soulmon_state_v1',
  'soulmon-last-bad-day',
  'soulmon-ai-settings',
  'soulmon-theme',
  'soulmon-language',
  'soulmon-onboarding-complete',
  'soulmon-user-name',
  'soulmon-egg-type',
  'soulmon-first-task-popup-shown',
  'soulmon-notifications-enabled',
  'soulmon-notification-first-open-asked',
  'soulmon-pwa-install-dismissed',
  'soulmon-notification-prompt-dismissed',
  'soulmon-notification-prompt-dismissed-at',
  'soulmon-notification-priming-dismissed',
  'soulmon-scheduled-notifications',
  'soulmon-daily-notification-check',
  'soulmon-save-id',
  'soulmon-account-deleted-notice',
  'soulmon-user-email',
  'soulmon-protect-prompt-at',
  'soulmon-is-sleeping',
  'soulmon-food-feed-times',
  'soulmon-rub-heal-day',
  'soulmon-daily-report-shown',
  'soulmon-notice-toast-seen',
  'soulmon-notice-toast-once',
  'soulmon-rub-hint-shown',
  'soulmon-auto-sleep-enabled',
  'soulmon-auto-sleep-start',
  'soulmon-auto-sleep-end',
  'soulmon-dungeon-difficulty',
  'soulmon-dungeon-best',
  'soulmon-dungeon-reached',
  'soulmon-dungeon-heart-drops',
  'soulmon-dungeon-speed',
  'soulmon-ritual-open',
  'soulmon-match3-best',
  'soulmon-dino-best',
  'soulmon-library-seen',
  'soulmon-picross-daily-paid',
  'soulmon-sound-muted',
  'soulmon-sound-category-volumes',
  'soulmon-sound-track-enabled',
  'soulmon-sound-prefs-version',
  'soulmon-sound-theme-off',
  'soulmon-sound-music-off',
  'soulmon-sound-music-version',
  'soulmon-fcm-token',
  'soulmon-last-cloud-sync',
  'soulmon-sync-pending',
  'soulmon-oracle-form',
  'soulmon-oracle-draft',
  'soulmon-gate-draft',
  'soulmon-profile',
  'soulmon-tutorial-complete',
  'soulmon-welcome-tour-shown',
  'soulmon-pending-login-email',
  'soulmon-sleep-started-at',
  'soulmon-night-armed-at',
  'soulmon-push-event-ledger',
  'soulmon-sleep-reminder-enabled',
  'soulmon-morning-dream-shown',
  'soulmon-day-woke',
  'soulmon-rest-setup-shown',
  'soulmon-rest-setup-first-open',
  'soulmon-terms-notice-seen',
  'soulmon-terms-notice-shown',
  'soulmon-guild-last-stage',
  'soulmon-guild-claimed',
  'soulmon-foco-timer',
  'soulmon-foco-sessions',
  'soulmon-foco-workshops',
  'soulmon-foco-workshop-plan',
  'soulmon-foco-vibrate',
  'soulmon-caderno',
  'soulmon-npc-fala-vista',
];

// ------------------------------------------------------------ funções puras

function camposDeGameState(fonte: string): string[] {
  const ini = fonte.indexOf('export interface GameState {');
  if (ini < 0) return [];
  const fim = fonte.indexOf('\n}\n', ini);
  const bloco = fonte.slice(ini, fim < 0 ? undefined : fim);
  return [...bloco.matchAll(/^ {2}([A-Za-z_]+)\??:/gm)].map((m) => m[1]);
}

function corpoHydrate(fonte: string): string {
  const ini = fonte.indexOf('function hydrateSave(');
  if (ini < 0) return '';
  const fim = fonte.indexOf('\n}\n', ini);
  return fonte.slice(ini, fim < 0 ? undefined : fim);
}

/** Campos sem linha PRÓPRIA em hydrateSave. `[ \t]` e não `\s`: `\s*` atravessa linhas. */
function camposSemLinhaEmHydrate(fonteContexto: string): string[] {
  const corpo = corpoHydrate(fonteContexto);
  return camposDeGameState(fonteContexto).filter(
    (c) => !new RegExp('^[ \\t]*' + c + '[ \\t]*[:,(]', 'm').test(corpo),
  );
}

/** Linhas de hydrateSave que só repassam o valor cru (`campo: loadedState.campo,`), sem `??`/sanitizador. */
function repassesCrus(fonteContexto: string): string[] {
  const corpo = corpoHydrate(fonteContexto);
  return [...corpo.matchAll(/^[ \t]*([A-Za-z_]+)[ \t]*:[ \t]*(?:loadedState|rawState|x)\.([A-Za-z_]+)[ \t]*,[ \t]*$/gm)]
    .filter((m) => m[1] === m[2])
    .map((m) => m[1]);
}

/** Formas de ler o save no servidor que a régua de paridade não enxerga. */
function leiturasOpacas(saveJs: string): string[] {
  const achados: string[] = [];
  if (/\}\s*=\s*state\b/.test(saveJs)) achados.push('destructuring de state');
  if (/Object\.(keys|entries|values)\(\s*state\s*\)/.test(saveJs)) achados.push('Object.keys/entries/values(state)');
  const colchetes = [...saveJs.matchAll(/state\[([^\]]*)\]/g)].map((m) => m[1]).filter((k) => k !== 'field');
  if (colchetes.length) achados.push('state[...] fora do laço de SERVER_OWNED_FIELDS: ' + colchetes.join(', '));
  return achados;
}

function chavesNaoCongeladas(valoresAtuais: readonly string[], congeladas: readonly string[], novas: readonly string[]): string[] {
  return valoresAtuais.filter((v) => !congeladas.includes(v) && !novas.includes(v));
}

function nomesDoServidor(saveJs: string): { emState: string[]; todos: string[] } {
  const emState = [...new Set([...saveJs.matchAll(/'([A-Za-z_]+)' in state/g)].map((m) => m[1]))];
  const pontos = [...saveJs.matchAll(/state\.([A-Za-z_]+)/g)].map((m) => m[1]);
  const limpa = (l: string[]) => l.filter((n) => !NAO_SAO_CAMPOS.includes(n));
  return { emState: limpa(emState), todos: limpa([...new Set([...emState, ...pontos])]) };
}

function nomesForaDeGameState(nomes: string[], gameStateSrc: string): string[] {
  const campos = new Set(camposDeGameState(gameStateSrc));
  return nomes.filter((n) => !campos.has(n));
}

/** Compara VALORES reais de STORAGE_KEYS (substring na fonte casaria com comentário). */
function chavesSumidas(congeladas: readonly string[], valoresAtuais: readonly string[]): string[] {
  return congeladas.filter((k) => !valoresAtuais.includes(k));
}

// ------------------------------------------------------------ fontes reais

const CTX = ler('src/contexts/GameStateContext.tsx');
const SAVE_JS = ler('functions/api/save.js');
const VALORES_KEYS: string[] = Object.values(STORAGE_KEYS) as string[];
const TESTES_SERVIDOR = readdirSync(resolve(RAIZ, 'functions/api'))
  .filter((f) => f.endsWith('.test.js'))
  .map((f) => ler('functions/api/' + f));

describe('LEITURA TOLERANTE: todo campo de GameState tem linha em hydrateSave', () => {
  it('há campos e hydrateSave foi encontrada', () => {
    expect(camposDeGameState(CTX).length).toBeGreaterThan(100);
    expect(corpoHydrate(CTX).length).toBeGreaterThan(500);
  });
  it('nenhuma linha só repassa o valor cru (`campo: loadedState.campo,` sem ?? / sanitizador)', () => {
    const crus = repassesCrus(CTX);
    expect(crus, `repasse cru em hydrateSave: ${crus.join(', ')}. Save antigo não tem o campo: use ?? default ou sanitizador`).toEqual([]);
  });
  it('nenhum campo sem linha própria', () => {
    const faltam = camposSemLinhaEmHydrate(CTX);
    expect(
      faltam,
      `campos sem linha em hydrateSave: ${faltam.join(', ')}. campo novo no save precisa de linha em hydrateSave (leitura tolerante: ?? / sanitizador) — o \`...loadedState\` não basta; ver CLAUDE.md › Compatibilidade`,
    ).toEqual([]);
  });
});

describe('PARIDADE COM O SERVIDOR: save.js x GameState', () => {
  const { emState, todos } = nomesDoServidor(SAVE_JS);
  it('o servidor sanitiza alguma coisa', () => {
    expect(emState.length).toBeGreaterThan(10);
  });
  it('save.js não lê o save por forma que a régua não enxerga', () => {
    expect(leiturasOpacas(SAVE_JS)).toEqual([]);
  });
  it('o espelho de SERVER_OWNED_FIELDS bate com save.js', () => {
    const m = /const SERVER_OWNED_FIELDS = \[([^\]]*)\]/.exec(SAVE_JS);
    const doServidor = [...(m?.[1] ?? '').matchAll(/'([A-Za-z_]+)'/g)].map((x) => x[1]);
    expect(doServidor).toEqual(SERVER_OWNED_FIELDS);
  });
  it('todo nome que o servidor lê existe em GameState', () => {
    const fora = nomesForaDeGameState([...todos, ...SERVER_OWNED_FIELDS], CTX);
    expect(
      fora,
      `save.js lê campos que GameState não tem: ${fora.join(', ')}. Renomear campo no cliente deixa o sanitizador do servidor cego.`,
    ).toEqual([]);
  });
  it('todo campo sanitizado por `in state` tem teste em functions/api (ou está na dívida congelada)', () => {
    const semTeste = emState.filter((c) => !TESTES_SERVIDOR.some((t) => t.includes(c)));
    const novos = semTeste.filter((c) => !SEM_TESTE_DE_SERVIDOR_HOJE.includes(c));
    expect(novos, `campos novos sem teste de servidor: ${novos.join(', ')}`).toEqual([]);
    const quitados = SEM_TESTE_DE_SERVIDOR_HOJE.filter((c) => !semTeste.includes(c));
    expect(
      quitados,
      `ganharam teste, tire da lista SEM_TESTE_DE_SERVIDOR_HOJE: ${quitados.join(', ')}`,
    ).toEqual([]);
  });
});

describe('CHAVES DE ARMAZENAMENTO NÃO SOMEM', () => {
  it('GAME_STATE continua soulmon_state_v1', () => {
    expect(STORAGE_KEYS.GAME_STATE).toBe(GAME_STATE);
  });
  it('a lista congelada não tem duplicata nem encolheu', () => {
    expect(new Set(CHAVES_EM_20_10_2026).size).toBe(CHAVES_EM_20_10_2026.length);
    expect(CHAVES_EM_20_10_2026.length).toBe(77);
  });
  it('toda chave atual de STORAGE_KEYS está congelada (chave nova entra em NOVAS_DESDE_20_10_2026)', () => {
    const soltas = chavesNaoCongeladas(VALORES_KEYS, CHAVES_EM_20_10_2026, NOVAS_DESDE_20_10_2026);
    expect(soltas, `chave nova sem congelar: ${soltas.join(', ')}. Adicione em NOVAS_DESDE_20_10_2026 no mesmo PR`).toEqual([]);
  });
  it('cada chave congelada ainda é valor de STORAGE_KEYS', () => {
    const sumidas = chavesSumidas([...CHAVES_EM_20_10_2026, ...NOVAS_DESDE_20_10_2026], VALORES_KEYS);
    expect(
      sumidas,
      `chaves sumidas: ${sumidas.join(', ')}. renomear/apagar chave de localStorage exige migração de leitura que aceite o nome antigo (o 'visto' por aparelho conta)`,
    ).toEqual([]);
  });
});

describe('AUTOVERIFICAÇÃO', () => {
  const ctxSint = (linha: string) =>
    [
      'export interface GameState {',
      '  nome: string;',
      '  campoNovoSemLinha?: number;',
      '}',
      '',
      'function hydrateSave(x) {',
      '  return {',
      '    nome: x.nome ?? "",',
      linha,
      '  };',
      '}',
      '',
    ].join('\n');

  it('campo novo sem linha em hydrateSave é acusado', () => {
    expect(camposSemLinhaEmHydrate(ctxSint(''))).toEqual(['campoNovoSemLinha']);
  });
  it('com a linha, passa', () => {
    expect(camposSemLinhaEmHydrate(ctxSint('    campoNovoSemLinha: x ?? null,'))).toEqual([]);
  });
  it('save.js sintético com campo que GameState não tem é acusado', () => {
    const { todos } = nomesDoServidor("if ('renomeado' in state) { state.renomeado = 1; }");
    expect(nomesForaDeGameState(todos, ctxSint(''))).toEqual(['renomeado']);
  });
  it('chave congelada que saiu de STORAGE_KEYS é acusada (comentário com o nome antigo não salva)', () => {
    expect(chavesSumidas(['chave-a', 'chave-b'], ['chave-a'])).toEqual(['chave-b']);
  });
  it('chave nova não congelada é acusada', () => {
    expect(chavesNaoCongeladas(['chave-a', 'chave-nova'], ['chave-a'], [])).toEqual(['chave-nova']);
    expect(chavesNaoCongeladas(['chave-a', 'chave-nova'], ['chave-a'], ['chave-nova'])).toEqual([]);
  });
  it('repasse cru em hydrateSave é acusado; com ?? passa', () => {
    expect(repassesCrus(ctxSint('    campoNovoSemLinha: x.campoNovoSemLinha,'))).toEqual(['campoNovoSemLinha']);
    expect(repassesCrus(ctxSint('    campoNovoSemLinha: x.campoNovoSemLinha ?? null,'))).toEqual([]);
  });
  it('leitura opaca do save no servidor é acusada', () => {
    expect(leiturasOpacas('const { novo } = state;')).toEqual(['destructuring de state']);
    expect(leiturasOpacas('for (const k of Object.keys(state)) {}')).toHaveLength(1);
    expect(leiturasOpacas('for (const field of X) delete state[field];')).toEqual([]);
  });
});
