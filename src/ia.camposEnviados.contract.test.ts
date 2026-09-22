import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * FRONTEIRA: o que o cliente MANDA para a IA.
 *
 * A política de privacidade (§2b) e os termos (§9) dizem, campo a campo, o que
 * sai do aparelho para o provedor. O compliance R1 (21/09/2026) achou dois
 * campos fora da lista — `task.name` no "Decompor" e o `soulGoal` pré-preenchido
 * do tutorial — e a conclusão foi que a fronteira estava "sem dono": ninguém
 * falhava quando um chamador acrescentava um campo ao body.
 *
 * Este teste é o dono. Ele lê os call sites de `aiFetch` (o ÚNICO caminho do
 * cliente para as rotas de IA — `utils/aiClient.ts`) e compara as chaves do
 * body com uma lista FECHADA por rota e por arquivo. Chave nova, rota nova ou
 * arquivo novo chamando IA → vermelho, até alguém acrescentar aqui E na
 * política. Também fecha quem chama `suggestTasks` (que embrulha o
 * `/api/suggest-tasks`) e onde `getAIResponse` mora.
 *
 * Não valida o VALOR (isso é do servidor, `_aiGuard.js`/`chat.js`): valida a
 * FORMA — que é o que a política promete.
 */

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

/** Rota → arquivo → conjunto de chaves de topo do body. `id` entra em `aiFetch`. */
const CAMPOS_DECLARADOS: Record<string, Record<string, string[][]>> = {
  '/api/chat': {
    // Chat aberto (mensagem digitada). `context` = inteiros de estado (WP3.1);
    // `history` = as falas anteriores desta conversa (política §2b).
    'src/components/ChatBox.tsx': [
      ['message', 'petName', 'mood', 'evolutionStage', 'dominantBranch', 'language', 'aiSettings', 'context', 'history'],
    ],
    // Fala espontânea (idle) e fala ao toque — `message` aqui é um prompt fixo
    // do app, nunca texto da pessoa.
    'src/components/CompanionHUD.tsx': [
      ['message', 'petName', 'mood', 'evolutionStage', 'dominantBranch', 'language', 'aiSettings'],
      ['message', 'petName', 'mood', 'evolutionStage', 'dominantBranch', 'language', 'aiSettings', 'context'],
    ],
  },
  '/api/suggest-tasks': {
    // `goalText` É texto da pessoa: objetivo do tutorial OU nome da tarefa
    // (Decompor). Declarado na tela em cada chamador (ver CHAMADORES_SUGGEST).
    'src/utils/taskSuggestions.ts': [['goalText', 'categories', 'language']],
  },
  '/api/generate-sprite': {
    'src/utils/spriteGen.ts': [['prompt', 'referenceImageUrls', 'promptFallback', 'formId']],
  },
};

/** Quem chama `suggestTasks` (e portanto manda texto da pessoa ao Groq), e o
 *  que cada um manda como `goalText`. Compliance #1 e #2: provisoriamente
 *  DECLARADOS na tela (hint), não cortados — decisão do dono pendente. */
const CHAMADORES_SUGGEST: Record<string, string> = {
  'src/components/GameTutorialFlow.tsx': 'goalText.trim()',   // pré-preenchido com soulGoal
  'src/App.tsx': 'task.name',                                  // PostponeNudgeSheet › runDecompose
};

/** `getAIResponse` mora num lugar só. */
const DONO_GET_AI_RESPONSE = 'src/components/ChatBox.tsx';

function listar(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listar(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p: string) => fs.readFileSync(p, 'utf8');

/** Do texto logo após `aiFetch(`: a rota (1º arg) e as chaves de topo do body (2º arg). */
function extrairChamada(src: string, idx: number): { rota: string | null; chaves: string[] } {
  let i = idx;
  const rotaM = /^\s*(['"`])([^'"`]*)\1\s*,/.exec(src.slice(i));
  const rota = rotaM ? rotaM[2] : null;
  if (rotaM) i += rotaM[0].length;
  // pula até o `{` do body
  while (i < src.length && src[i] !== '{') {
    if (src[i] === ')' ) return { rota, chaves: ['<body não é objeto literal>'] };
    i++;
  }
  // corpo balanceado
  let depth = 0; let start = i; let fim = -1;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') { depth--; if (depth === 0) { fim = j; break; } }
  }
  if (fim < 0) return { rota, chaves: ['<sem fechamento>'] };
  const corpo = src.slice(start + 1, fim);
  // split por vírgula no nível 0
  const partes: string[] = []; let d = 0; let cur = '';
  for (const c of corpo) {
    if (c === '{' || c === '(' || c === '[') d++;
    if (c === '}' || c === ')' || c === ']') d--;
    if (c === ',' && d === 0) { partes.push(cur); cur = ''; } else cur += c;
  }
  partes.push(cur);
  const chaves = partes
    .map(p => p.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim())
    .filter(Boolean)
    .map(p => {
      if (p.startsWith('...')) return `<spread ${p.slice(0, 30)}>`;
      const m = /^([A-Za-z_$][\w$]*)\s*(?::|$)/.exec(p);
      return m ? m[1] : `<ilegível ${p.slice(0, 30)}>`;
    });
  return { rota, chaves };
}

function chamadasDeAiFetch(): Array<{ arquivo: string; rota: string | null; chaves: string[] }> {
  const out: Array<{ arquivo: string; rota: string | null; chaves: string[] }> = [];
  for (const f of listar(SRC)) {
    const src = read(f);
    if (rel(f) === 'src/utils/aiClient.ts') continue; // a definição
    const re = /\baiFetch\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      out.push({ arquivo: rel(f), ...extrairChamada(src, m.index + m[0].length) });
    }
  }
  return out;
}

describe('ia.camposEnviados — a lista fechada do que sai para a IA', () => {
  const chamadas = chamadasDeAiFetch();

  it('há chamadas (controle negativo do próprio teste)', () => {
    expect(chamadas.length).toBeGreaterThanOrEqual(5);
  });

  it('toda chamada de aiFetch tem rota literal e body objeto-literal (senão a lista não é verificável)', () => {
    for (const c of chamadas) {
      expect(c.rota, `${c.arquivo}: rota tem que ser string literal`).toMatch(/^\/api\//);
      expect(c.chaves.join(','), `${c.arquivo} ${c.rota}`).not.toMatch(/</);
    }
  });

  it('cada (rota, arquivo) manda EXATAMENTE as chaves declaradas — chave nova é vermelho até entrar aqui e na política', () => {
    const vistos = new Set<string>();
    for (const c of chamadas) {
      const porArquivo = CAMPOS_DECLARADOS[c.rota!];
      expect(porArquivo, `rota ${c.rota} não declarada (chamada em ${c.arquivo})`).toBeDefined();
      const permitidos = porArquivo![c.arquivo];
      expect(permitidos, `${c.arquivo} não está na lista de quem pode chamar ${c.rota}`).toBeDefined();
      const chave = [...c.chaves].sort().join(',');
      const bate = permitidos!.some(lista => [...lista].sort().join(',') === chave);
      expect(bate, `${c.arquivo} → ${c.rota} manda [${c.chaves.join(', ')}], fora da lista declarada`).toBe(true);
      vistos.add(`${c.rota}|${c.arquivo}|${chave}`);
    }
    // E o inverso: nada declarado que não exista mais (lista podre é lista falsa).
    for (const [rota, porArquivo] of Object.entries(CAMPOS_DECLARADOS)) {
      for (const [arquivo, listas] of Object.entries(porArquivo)) {
        for (const lista of listas) {
          const k = `${rota}|${arquivo}|${[...lista].sort().join(',')}`;
          expect(vistos.has(k), `declarado mas não existe mais: ${k}`).toBe(true);
        }
      }
    }
  });

  it('`aiClient.ts` acrescenta só `id` ao body', () => {
    const src = read(path.join(SRC, 'utils/aiClient.ts'));
    expect(src).toMatch(/JSON\.stringify\(\{ \.\.\.body, id: readLocal\(STORAGE_KEYS\.SAVE_ID\) \}\)/);
  });

  it('quem chama `suggestTasks` está na lista, com o texto que manda, e cada um DECLARA isso na tela', () => {
    const chamadores: Record<string, string[]> = {};
    for (const f of listar(SRC)) {
      const r = rel(f);
      if (r === 'src/utils/taskSuggestions.ts') continue;
      const src = read(f);
      // `suggestTasksResult` (QA rodada 2, E1) é o MESMO pedido com a falha
      // nomeada — manda o mesmo texto, então conta como chamador.
      const re = /\bsuggestTasks(?:Result)?\(\s*([^,]+?)\s*,/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) (chamadores[r] ||= []).push(m[1].trim());
    }
    expect(Object.keys(chamadores).sort()).toEqual(Object.keys(CHAMADORES_SUGGEST).sort());
    for (const [arquivo, texto] of Object.entries(CHAMADORES_SUGGEST)) {
      expect(chamadores[arquivo], arquivo).toEqual([texto]);
      // A declaração na tela (compliance #1/#2): a palavra "provedor de IA" / "AI provider".
      const src = read(path.join(ROOT, arquivo));
      expect(src, `${arquivo} chama suggestTasks sem dizer na tela que o texto vai ao provedor de IA`).toMatch(/provedor de IA/);
      expect(src, `${arquivo}: falta o par EN`).toMatch(/AI provider/);
    }
  });

  // QA rodada 2 (22/09/2026): a lista só é fechada se TODA chamada às rotas de
  // IA passar por `aiFetch`. Mutação `fetch('/api/chat', …)` direto no ChatBox
  // ficou verde — esta régua fecha o desvio (rota literal ou em template).
  it('nenhum `fetch` direto às rotas de IA fora de `aiClient.ts` — tudo passa por aiFetch', () => {
    const rotas = Object.keys(CAMPOS_DECLARADOS).map(r => r.replace(/[/-]/g, '\\$&')).join('|');
    const re = new RegExp(`\\bfetch\\s*\\([^)]*?(?:${rotas})`, 'g');
    const desvios: string[] = [];
    for (const f of listar(SRC)) {
      if (rel(f) === 'src/utils/aiClient.ts') continue;
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      if (re.test(src)) desvios.push(rel(f));
      re.lastIndex = 0;
    }
    expect(desvios, 'chamada direta a rota de IA — use aiFetch e declare os campos').toEqual([]);
  });

  it('`getAIResponse` só existe no ChatBox', () => {
    const donos = listar(SRC).filter(f => /\bgetAIResponse\b/.test(read(f))).map(rel);
    expect(donos).toEqual([DONO_GET_AI_RESPONSE]);
  });

  it('a política nomeia cada campo de texto que sai (goalText/objetivo, nome da tarefa, mensagem do chat)', () => {
    const pol = read(path.join(ROOT, 'public/privacidade.html'));
    // Se algum destes sumir da política, a lista daqui virou promessa sem documento.
    expect(pol).toMatch(/chat-contexto/);
    expect(pol).toMatch(/objetivo/i);
  });
});
