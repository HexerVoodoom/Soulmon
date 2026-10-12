import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOURCES, OUT_FILE, buildChunks, renderModule, chunkRules, chunkGlossary } from '../../scripts/chat-knowledge-lib.mjs';
import { KNOWLEDGE, KNOWLEDGE_HASH } from './_chatKnowledge.data.js';
import { searchKnowledge, tokenize, knowledgeBlock, MIN_SCORE } from './_chatKnowledge.js';

const root = resolve(__dirname, '..', '..');
const read = rel => readFileSync(resolve(root, rel), 'utf8');

describe('índice de conhecimento do chat: não pode ficar velho', () => {
  it('o arquivo gerado é EXATAMENTE o que as fontes produzem hoje', () => {
    const files = Object.fromEntries(SOURCES.map(s => [s, read(s)]));
    const esperado = renderModule(buildChunks(files));
    const atual = read(OUT_FILE);
    expect(
      atual,
      'docs/manual mudou e o índice do chat não: rode `npm run gen:chat-kb` e commite',
    ).toBe(esperado);
  });

  it('hash e conteúdo batem; índice não vazio e compacto', () => {
    expect(KNOWLEDGE_HASH).toMatch(/^[0-9a-f]{16}$/);
    expect(KNOWLEDGE.length).toBeGreaterThan(100);
    expect(read(OUT_FILE).length).toBeLessThan(120_000);
  });

  it('não vaza bastidor: nada de admin/GM/KV/token/⚰️ nem identificador de código', () => {
    const tudo = KNOWLEDGE.map(c => `${c.t} ${c.x}`).join('\n');
    expect(tudo).not.toMatch(/ADMIN_EMAILS|purchaseToken|\bKV\b|⚰️|NÃO implementada/);
    expect(KNOWLEDGE.every(c => c.x.length >= 25 && c.x.length <= 600)).toBe(true);
  });
});

describe('marca de segredo/spoiler: trecho marcado nunca entra', () => {
  it('seção do 02 com kb:secret fica de fora', () => {
    const md = [
      '## 1. A',
      '', '**Em uma frase.** Isto é público e explica o jogo.', '',
      '## 2. B', '<!-- kb:secret -->',
      '', '**Em uma frase.** Isto é um spoiler de lore que não pode aparecer.', '',
    ].join('\n');
    const ids = chunkRules(md).map(c => c.id);
    expect(ids).toEqual(['regra-1']);
  });

  it('linha do glossário marcada fica de fora', () => {
    const md = [
      '| **Aberto** | Um termo que o jogador pode ler sem problema nenhum. | x |',
      '| **Segredo** | Um termo cheio de spoiler. [spoiler] | x |',
    ].join('\n');
    expect(chunkGlossary(md).map(c => c.t)).toEqual(['Aberto']);
  });
});

describe('BM25: recupera o certo e RECUSA o que não sabe', () => {
  it.each([
    ['quantos corações eu perco por dia?', /Corações/],
    ['how does habit consistency work', /Constância|Hábito/],
    ['como funciona o banho', /Banho/],
    ['what is the rest shield', /Escudo/i],
  ])('"%s" encontra o trecho', (q, re) => {
    const hits = searchKnowledge(q);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.slice(0, 3).some(h => re.test(h.t))).toBe(true);
  });

  it.each([
    'qual a capital da frança?',
    'who won the world cup',
    'asdkjh qwe zzz',
    '',
  ])('"%s" → sem evidência (o chat diz que não sabe)', q => {
    expect(searchKnowledge(q)).toEqual([]);
    expect(knowledgeBlock(searchKnowledge(q))).toBe('');
  });

  it('todo resultado supera o limiar e vem ordenado', () => {
    const hits = searchKnowledge('hábito constância semana', { k: 5 });
    expect(hits.every(h => h.score >= MIN_SCORE)).toBe(true);
    expect([...hits].sort((a, b) => b.score - a.score)).toEqual(hits);
  });

  it('tokenização remove acento e stopword e ponte EN→PT', () => {
    expect(tokenize('Quantos CORAÇÕES eu tenho?')).toContain('coraca');
    expect(tokenize('the hearts')).toEqual(tokenize('coracao'));
  });
});
