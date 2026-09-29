/**
 * A RÉGUA DE COPY DA GUILDA (`docs/PLANO-GUILDA.md` §13, LV-G1..G10;
 * `docs/NARRATIVA-COPY-GUILDA.md` "Nunca escrever na Guilda").
 *
 * A Guilda estende o "COM" do pet para outras pessoas SEM trazer o cobrador
 * junto (02-psicologia §7.2): o app não cobra, mas onze pessoas cobrariam. Toda
 * frase que o jogador lê na Guilda nasce em `utils/guildCopy.ts`, e esta régua
 * varre a tabela inteira (PT e EN) e o fonte dos componentes da pasta.
 *
 * Duas famílias de proibição, com o mesmo motivo:
 *  · **vocabulário de cobrança** — "faltam", "faltou", "ausente", "precisa de
 *    você", "saiu": qualquer palavra que nomeia quem não veio ou quanto falta;
 *  · **número** — nenhum dígito literal (o `{n}` só nasce de constantes, e NUNCA
 *    na família do agregado: "N fios" ao lado de "M na roda" reconstrói "N de M
 *    vieram", a Recusa 3 do guarda da linha vermelha, 29/09/2026).
 *
 * Toda regra tem o teste dela abaixo — e o de autoverificação, porque uma régua
 * que nunca reprovou nada não prova que enxerga.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GUILD_COPY } from '../../utils/guildCopy';

/** Vocabulário vetado na copy da Guilda (PT + EN). Fronteira de palavra. */
export const VETADAS: RegExp[] = [
  /\bfalt(a|am|ou|aram|ando)\b/i, /\bfaltas?\b/i, /\bmissing\b/i, /\babsent\b/i, /\bausen(te|tes|cia)\b/i,
  /\bnot yet\b/i, /\bain?da n[aã]o\b/i,
  /\bprecisa de voc[eê]\b/i, /\bneeds? you\b/i, /\bsentimos sua falta\b/i, /\bmiss(ed)? you\b/i,
  /\bsa[ií]u\b/i, /\bleft the (circle|guild)\b/i, /\babandon/i,
  /\bcl[ãa]\b/i, /\btribo\b/i, /\bfac[çc][ãa]o\b/i, /\bequipe\b/i, /\bteam\b/i, /\bclan\b/i, /\bfaction\b/i,
  /\bl[ií]der\b/i, /\bleader\b/i, /\bchefe\b/i, /\bboss\b/i,
  /\boutros? bosques?\b/i, /\bother groves?\b/i, /\badvers[aá]rio\b/i, /\bopponent\b/i,
  /\bcampe(ão|ões|oes)\b/i, /\bchampions?\b/i, /\bMVP\b/, /\bpior\b/i, /\bworst\b/i,
  /\bWeave\b/, /\bGlitchtama\b/, /\bV[ií]rus\b/, /\bVacina\b/,
  /%/, /\bcontribu/i, /\bcontribut/i, /\bstreak\b/i, /\branking\b/i, /\bplacar\b/i,
];

const DIGITO = /\d/;
/** A família do agregado nunca tem `{n}` (nem variante por quantidade). */
const FAMILIA_AGREGADO = /^guild\.bosque\.agregado\./;

const entradas = Object.entries(GUILD_COPY) as Array<[string, readonly [string, string]]>;
const textos = entradas.flatMap(([k, [pt, en]]) => [[`${k} (PT)`, pt], [`${k} (EN)`, en]] as const);

describe('copy da Guilda — vocabulário vetado', () => {
  it('a tabela existe e tem as duas línguas em toda chave', () => {
    expect(entradas.length).toBeGreaterThan(50);
    for (const [k, [pt, en]] of entradas) {
      expect(pt.trim().length, k).toBeGreaterThan(0);
      expect(en.trim().length, k).toBeGreaterThan(0);
    }
  });

  it.each(textos)('%s não usa vocabulário de cobrança', (_id, texto) => {
    for (const re of VETADAS) expect(texto, String(re)).not.toMatch(re);
  });

  it('nenhuma string tem dígito literal (número vem de constante)', () => {
    for (const [id, texto] of textos) expect(texto, id).not.toMatch(DIGITO);
  });

  it('a família do agregado NÃO tem {n} nem outro placeholder', () => {
    const agregado = entradas.filter(([k]) => FAMILIA_AGREGADO.test(k));
    expect(agregado.length).toBeGreaterThan(0);
    for (const [k, [pt, en]] of agregado) {
      expect(pt, k).not.toMatch(/\{/);
      expect(en, k).not.toMatch(/\{/);
    }
  });

  it('{n} só existe onde é contagem de VAGAS ou de membros, nunca de quem veio', () => {
    const comN = entradas.filter(([, [pt]]) => pt.includes('{n}')).map(([k]) => k).sort();
    expect(comN).toEqual(['guild.criar.codigo.corpo', 'guild.roda.contagem']);
  });

  it('a linha de presença é a marca positiva — não existe chave de "ausente"', () => {
    expect(Object.keys(GUILD_COPY).filter(k => /ausen|absent|faltou|silencio\.?nome|apagado/i.test(k))).toEqual([]);
    expect(GUILD_COPY['guild.roda.presente'][0]).toBe('no bosque hoje');
  });

  it('não há chave para o estado "meta ainda não cumprida" nem para "nenhum gesto" (SILÊNCIO)', () => {
    expect(Object.keys(GUILD_COPY).filter(k => /fio\.ainda|gesto\.nenhum|agregado\.zero|mural\.vazio|viajante/.test(k))).toEqual([]);
  });

  it('o alerta é sempre o mesmo tom: nenhuma frase de erro acusa a pessoa', () => {
    for (const [k, [pt, en]] of entradas.filter(([k]) => k.startsWith('guild.erro.'))) {
      expect(pt, k).not.toMatch(/\b(você|voce) (errou|falhou|não)\b/i);
      expect(en, k).not.toMatch(/\byou (failed|didn't|did not)\b/i);
    }
  });
});

describe('fonte dos componentes da Guilda — sem texto solto vetado', () => {
  const dir = __dirname;
  const arquivos = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && !f.includes('.test.'));

  /** Tira comentários (a lápide cita o vocabulário para dizer que não pode voltar). */
  const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

  it('há componente a varrer', () => {
    expect(arquivos).toContain('GuildSheet.tsx');
  });

  const PROIBIDO_NO_JSX = [/\bfaltam?\b/i, /\bfaltou\b/i, /\bausente\b/i, /\babsent\b/i, /\boutros? bosques?\b/i, /\bnot yet\b/i, /ainda não hoje/i, /\bmissing\b/i, /\{n\}/];

  it.each(arquivos)('%s: nenhum literal vetado nem `{n}` solto', (arq) => {
    const fonte = semComentarios(fs.readFileSync(path.join(dir, arq), 'utf8'));
    for (const re of PROIBIDO_NO_JSX) expect(fonte, `${arq} ${re}`).not.toMatch(re);
  });

  it('GuildSheet não lê progress/target (a barra da semana saiu) nem ordena a roda', () => {
    const fonte = semComentarios(fs.readFileSync(path.join(dir, 'GuildSheet.tsx'), 'utf8'));
    expect(fonte).not.toMatch(/\b(g|guild|load\.guild)\.(progress|target)\b|progressbar/);
    expect(fonte).not.toMatch(/\.sort\(|\.toSorted\(|\.reverse\(/);
  });

  it('a presença nominal só nasce de apareceuHoje === true (quem não veio não ganha marca)', () => {
    const fonte = semComentarios(fs.readFileSync(path.join(dir, 'GuildSheet.tsx'), 'utf8'));
    expect(fonte).toMatch(/apareceuHoje === true/);
    expect(fonte).not.toMatch(/apareceuHoje\s*\?[^:]*:\s*[^)]/); // nenhum ternário com ramo "não veio"
    expect(fonte).not.toMatch(/apareceuHoje === false|!m\.apareceuHoje/);
  });

  it('autoverificação: a régua ENXERGA o que veta', () => {
    expect(VETADAS.some(re => re.test('Faltam 3 fios para a Copa'))).toBe(true);
    expect(VETADAS.some(re => re.test('ainda não hoje'))).toBe(true);
    expect(VETADAS.some(re => re.test('Alguém saiu da roda'))).toBe(true);
    expect(VETADAS.some(re => re.test('outros bosques'))).toBe(true);
    expect(VETADAS.some(re => re.test('Seguir o próprio caminho'))).toBe(false);
    expect(DIGITO.test('3 de 5 vieram')).toBe(true);
    expect(FAMILIA_AGREGADO.test('guild.bosque.agregado.outros')).toBe(true);
  });
});
