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
import { GUILD_COPY_CORE } from '../../utils/guildCopyCore';

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
    // B2: `{n}` também é a QUANTIA de Emblemas colhidos e o intervalo da Concha — nunca de quem veio.
    // L4: `guild.entrar.codigo.dica` leva o TAMANHO do código (`GUILD_CODE_LENGTH`), que é regra e não pessoa.
    expect(comN).toEqual(['guild.criar.codigo.corpo', 'guild.entrar.codigo.dica', 'guild.feira.colhido', 'guild.help.concha.def', 'guild.roda.contagem']);
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

// ─────────────────────────────────────────────────────────────────────────────
// FATIA B1 — as strings do Bosque, dos gestos, do marco e do Mural.
// ─────────────────────────────────────────────────────────────────────────────
describe('copy do Bosque, dos gestos, do marco e do Mural', () => {
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../docs/NARRATIVA-COPY-GUILDA.md'), 'utf8');
  const chaves = (re: RegExp) => entradas.filter(([k]) => re.test(k));

  it('os placeholders permitidos são só {n} (vagas/membros), {estagio}, {data} e {gesto} — nunca de pessoa ou de quantidade de quem veio', () => {
    for (const [k, [pt, en]] of entradas) {
      for (const txt of [pt, en]) {
        for (const m of txt.matchAll(/\{(\w+)\}/g)) expect(['n', 'estagio', 'data', 'gesto', 'nome', 'max', 'cheio', 'piso', 'semanas'], `${k}: {${m[1]}}`).toContain(m[1]);
      }
    }
    // {estagio} é NOME de estágio; nenhuma chave de estágio/gesto/marco/mural leva {n}
    for (const [k, [pt]] of chaves(/^guild\.(bosque\.(estagio|perto|regra)|gesto|marco|mural|aria\.(bosque|gesto|mural))/)) expect(pt, k).not.toContain('{n}');
  });

  it('`perto` é BINÁRIO: uma frase só, sem número, sem razão, sem tempo estimado, e não existe chave de barra de progresso', () => {
    const [pt, en] = GUILD_COPY['guild.bosque.perto'];
    expect(pt).toBe('Perto de {estagio}.');
    expect(en).toBe('Near {estagio}.');
    expect(Object.keys(GUILD_COPY).filter(k => /progresso|progress|falta|restam|barra/i.test(k))).toEqual([]);
    for (const txt of [pt, en]) expect(txt).not.toMatch(/\d|%|\bdias?\b|\bdays?\b|\bhoras?\b|\bhours?\b|\bfaltam?\b|\bleft\b/i);
  });

  it('cada estágio tem nome e linha em PT e EN, na ordem certa, e os nomes do EN são os do documento (Boughs, não Tangle)', () => {
    const nomes = chaves(/^guild\.bosque\.estagio\..*\.nome$/).map(([, [, en]]) => en);
    expect(nomes).toEqual(['Clearing', 'Boughs', 'Canopy', 'Thicket', 'Old grove']);
    expect(chaves(/^guild\.bosque\.estagio\..*\.linha$/)).toHaveLength(5);
  });

  it('os TRÊS gestos são fixos, anônimos e para a roda: recebidos dizem "alguém", nunca quem nem quantos', () => {
    expect(chaves(/^guild\.gesto\.\w+\.nome$/).map(([, [pt]]) => pt)).toEqual(['Aceno', 'Luz', 'Descanso']);
    for (const [k, [pt, en]] of chaves(/^guild\.gesto\.\w+\.recebido$/)) {
      expect(pt, k).toMatch(/^Alguém /);
      expect(en, k).toMatch(/^Someone /);
      expect(pt + en, k).not.toMatch(/\{|\d|\bvários\b|\bmuitos\b|\bseveral\b|\bmany\b|\bdois\b|\btwo\b/i);
    }
    for (const [k, [pt, en]] of chaves(/^guild\.gesto\.\w+\.enviado$/)) {
      expect(pt + en, k).not.toMatch(/amanh|tomorrow|volte|come back|de novo|again/i);
    }
  });

  it('o gesto recebido sem tipo (FINAL, L3) é anônimo, sem número, sem tipo', () => {
    const [pt, en] = GUILD_COPY['guild.gesto.recebido.agregado'];
    expect(pt).toMatch(/^Alguém /);
    expect(en).toMatch(/^Someone /);
    expect(pt + en).not.toMatch(/\{|\d|luz|aceno|descanso|light|wave|rest/i);
  });

  it('não existe chave de chat, de resposta a gesto nem de gesto por destinatário', () => {
    expect(Object.keys(GUILD_COPY).filter(k => /chat|mensagem|message|responder|reply|destinat|para\.quem/i.test(k))).toEqual([]);
  });

  it('a cerimônia constata (o mundo mudou) — nunca "parabéns", nunca "você fez", nunca número', () => {
    for (const [k, [pt, en]] of chaves(/^guild\.marco\./)) {
      expect(pt + ' ' + en, k).not.toMatch(/parab[ée]ns|congrat|voc[êe] (fez|conseguiu|merece)|you (did|made|earned|deserve)|n[ãa]o perca|don'?t miss|\bbem feito\b|well done/i);
    }
    expect(chaves(/^guild\.marco\.\w+\.(mundo|pet)$/)).toHaveLength(8);
  });

  it('o aviso da Home não urge (L4): sem "não perca", sem prazo', () => {
    const [pt, en] = GUILD_COPY['guild.marco.aviso'];
    expect(pt + en).not.toMatch(/perca|miss|hoje|today|agora|now|corra|hurry|último|last/i);
  });

  it('o Mural é descrição: peça de maré com UM texto e três nomes de tamanho, sem "melhor/pior/maior"', () => {
    expect(chaves(/^guild\.mural\.mare\.tamanho\./).map(([, [pt]]) => pt)).toEqual(['Pétala', 'Corola', 'Floração cheia']);
    for (const [k, [pt, en]] of chaves(/^guild\.mural\./)) {
      expect(pt + en, k).not.toMatch(/melhor|maior|menor|pior|best|better|worse|biggest|smallest|\bbroto\b|\bsprout\b/i);
    }
  });

  it('toda chave da B1 está no documento de copy (nenhuma inventada), com o mesmo texto', () => {
    // `guild.gesto.recebido.agregado` é PENDENTE por desenho (B5 do backend: roda de 2 não manda o
    // tipo) e ainda não está no documento — o `soulmon-narrative-critic` a vê; sai desta lista quando entrar.
    const PENDENTES: string[] = []; // L3 (29/09): agregado entrou no documento
    const novas = entradas.filter(([k]) => /^guild\.(bosque\.(regra|perto|estagio\.)|gesto\.|marco\.(?!data)|mural\.|aria\.(bosque|gesto|mural))/.test(k) && !PENDENTES.includes(k));
    expect(novas.length).toBeGreaterThan(40);
    for (const [k, [pt, en]] of novas) {
      // o documento usa `guild.mural.mare.tamanho.*` como grupo; os demais são chaves literais
      const literal = k.replace(/\.(petala|corola|floracao)$/, '.*');
      expect(doc.includes(`\`${literal}\``) || doc.includes(`\`${k}\``), `${k} fora do documento`).toBe(true);
      const norm = (t: string) => t.replace(/[’']/g, "'");
      if (!k.includes('tamanho') && !k.includes('estagio.')) {
        expect(norm(doc).includes(norm(pt)) || k.startsWith('guild.aria.'), `${k}: PT diferente do documento`).toBe(true);
        expect(norm(doc).includes(norm(en)) || k.startsWith('guild.aria.'), `${k}: EN diferente do documento`).toBe(true);
      }
    }
  });
});

describe('fonte da B1 — o palco, o visor e a memória não ordenam nem leem presença', () => {
  const raiz = path.resolve(__dirname, '../..');
  const fonte = (rel: string) => semComentarios2(fs.readFileSync(path.join(raiz, rel), 'utf8'));
  function semComentarios2(s: string) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1'); }

  it('groveStage.ts, GroveVisor.tsx e groveLocal.ts: sem .sort/.reverse e sem ler `apareceuHoje`', () => {
    for (const rel of ['utils/groveStage.ts', 'components/guild/GroveVisor.tsx', 'utils/groveLocal.ts', 'components/guild/GroveMilestoneCeremony.tsx']) {
      expect(fonte(rel), rel).not.toMatch(/\.sort\(|\.toSorted\(|\.reverse\(/);
      expect(fonte(rel), rel).not.toMatch(/apareceuHoje|cameToday|presence/);
    }
  });

  it('o visor não recebe nem lê estágio, linha ou HP de outro membro (LV-G10)', () => {
    const v = fonte('components/guild/GroveVisor.tsx') + fonte('utils/groveStage.ts');
    // `guild.bosque.stage` (o estágio da RODA) é legítimo; o de UM MEMBRO, não.
    expect(v).not.toMatch(/\b(m|member|other|o)\.(stage|hp|line|evolutionStage|healthPoints)\b|healthPoints|evolutionStage/);
    // ...nem por um `as any`, e o palco puro (`groveStage.ts`) nem tem a palavra: só o visor a usa, e só da RODA.
    expect(v).not.toMatch(/as any\)\.(stage|hp|line)/);
    expect(fonte('utils/groveStage.ts')).not.toMatch(/\b(stage|hp|healthPoints|evolution\w*)\b/i);
    const usosDeStage = [...fonte('components/guild/GroveVisor.tsx').matchAll(/(\w+(?:\.\w+)*)\.stage\b/g)].map(m => m[1]);
    expect(usosDeStage.length).toBeGreaterThan(0);
    for (const u of usosDeStage) expect(u).toBe('guild.bosque');
  });

  it('o Bosque na folha não faz conta com o índice do estágio (só o nomeia), e não cita progresso cru', () => {
    const f = fonte('components/guild/GuildSheet.tsx');
    expect(f).not.toMatch(/stageIndex\s*[-+*/%<>]=?\s*\d|bosqueProgress|progresso\b/);
    expect(f).not.toMatch(/\.bosque\.(progress|raw|hp|dmg)/);
  });

  it('a memória do aparelho guarda só id público, índices e datas: nenhum nome, código nem contagem', () => {
    const l = fonte('utils/groveLocal.ts');
    expect(l).not.toMatch(/\.(name|code|members|size)\b/);
  });

  it('o id opaco do membro (`memberId`) nunca é usado para buscar perfil: a folha e o palco não chamam `player`/perfil', () => {
    for (const rel of ['components/guild/GuildSheet.tsx', 'utils/groveStage.ts', 'components/guild/GroveVisor.tsx', 'utils/groveLocal.ts']) {
      expect(fonte(rel), rel).not.toMatch(/action=player|getPlayer|getProfile|getPublicProfile|visitPlayer|community\?action/);
    }
  });

  it('autoverificação: a régua enxerga um "faltam N" e um sort no palco', () => {
    expect(/\.sort\(/.test(semComentarios2('members.sort((a,b)=>a-b)'))).toBe(true);
    expect(/apareceuHoje/.test(semComentarios2('m.apareceuHoje ? 1 : 0'))).toBe(true);
    expect(VETADAS.some(re => re.test('Faltam 2 dias para a Copa'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FATIA B2 — a Feira, o resgate, a Concha da Maré e o glossário.
// ─────────────────────────────────────────────────────────────────────────────
describe('copy da Feira e do glossário (B2)', () => {
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../docs/NARRATIVA-COPY-GUILDA.md'), 'utf8');
  const copySrc = fs.readFileSync(path.resolve(__dirname, '../../utils/guildCopy.ts'), 'utf8');
  const norm = (t: string) => t.replace(/[’']/g, "'");
  /** Chaves da B2 que NÃO estão no documento — cada uma tem de estar marcada PENDENTE em `guildCopy.ts`. */
  const PENDENTES: string[] = []; // L3 (29/09): concha.* e cenarios.titulo entraram no documento
  const chavesB2 = entradas.filter(([k]) => /^guild\.(feira\.|help\.|guide\.|aria\.(feira|rodada)|concha\.|cenarios\.)/.test(k));

  it('toda chave da B2 está no documento com o MESMO texto (nada inventado), exceto as PENDENTES declaradas', () => {
    expect(chavesB2.length).toBeGreaterThan(30);
    for (const [k, [pt, en]] of chavesB2) {
      if (PENDENTES.includes(k)) continue;
      expect(doc.includes(`\`${k}\``), `${k} fora do documento`).toBe(true);
      expect(norm(doc).includes(norm(pt)), `${k}: PT diferente do documento`).toBe(true);
      expect(norm(doc).includes(norm(en)), `${k}: EN diferente do documento`).toBe(true);
    }
  });

  it('toda chave PENDENTE está marcada `PENDENTE` num comentário acima dela em guildCopy.ts (e nenhuma outra finge ser do documento)', () => {
    for (const k of PENDENTES) {
      expect(GUILD_COPY[k as keyof typeof GUILD_COPY], k).toBeTruthy();
      expect(doc.includes(`\`${k}\``), `${k} entrou no documento: tire de PENDENTES`).toBe(false);
      const antes = copySrc.slice(0, copySrc.indexOf(`'${k}'`));
      expect(antes.slice(antes.lastIndexOf('\n  // PENDENTE') === -1 ? 0 : antes.lastIndexOf('\n  // PENDENTE')), k).toMatch(/PENDENTE/);
    }
  });

  it('a Concha da Maré nomeia o ATO da roda: nunca "campeão", nunca contagem exibida, nunca uma pessoa', () => {
    for (const [k, [pt, en]] of entradas.filter(([k]) => /^guild\.(concha|help\.concha)/.test(k))) {
      expect(pt + ' ' + en, k).not.toMatch(/campe|champion|vencedor|winner|troféu|trophy|\bvoc[êe]\b|\byou\b/i);
    }
    expect(GUILD_COPY['guild.concha.nome']).toEqual(['Concha da Maré', 'Tide shell']);
  });

  it('a Feira não tem número de dano, "volte amanhã", nem cobrança: a rodada feita é fato', () => {
    for (const [k, [pt, en]] of entradas.filter(([k]) => /^guild\.feira\./.test(k))) {
      expect(pt + ' ' + en, k).not.toMatch(/dano|damage|\bhp\b|amanh|tomorrow|volte|come back|ainda n|not yet|faltam?|restam|left\b|quem|who\b|\bvoc[êe]s? (perderam|falharam)|you (lost|failed)/i);
    }
    // os dois únicos placeholders numéricos da Feira vêm de constantes (Emblemas), nunca de progresso
    expect(GUILD_COPY['guild.feira.sobria'][0]).toContain('{cheio}');
    expect(GUILD_COPY['guild.feira.sobria'][0]).toContain('{piso}');
  });

  it('`recuou` não culpa NEM absolve (§17-3): constata que voltou à névoa e que o bosque segue como estava', () => {
    const [pt, en] = GUILD_COPY['guild.feira.recuou.mundo'];
    expect(pt + en).not.toMatch(/culpa|fault|n[ãa]o foi|wasn'?t|falh|fail|perd|lost|todos|ningu[ée]m|nobody|everyone/i);
    expect(pt).toContain('bosque segue como estava');
  });

  it('a fala do NPC da Feira é a do documento, e a Feira tem o NPC Fanfare (Marla fica só no Salão)', async () => {
    const { lotNpcVoice } = await import('../../utils/areaNpcVoice');
    for (const [lang, i] of [['pt-BR', 0], ['en-US', 1]] as const) {
      const v = lotNpcVoice('arena', 'feira', lang);
      expect(v.name).toBe('Fanfare');
      expect(v.line).toBe(GUILD_COPY['guild.npc.feira'][i]);
      expect(lotNpcVoice('hall', 'guilda', lang).name).toMatch(/Marla/);
    }
  });

  it('o glossário e o guia leem a copy da tabela e as CONSTANTES (nenhum número escrito à mão)', () => {
    const raiz = path.resolve(__dirname, '../..');
    const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), 'utf8');
    const help = ler('components/HelpModal.tsx');
    for (const c of ['max: GUILD_MAX_MEMBERS', 'semanas: GUILD_TIDE_WEEKS', 'cheio: RAID_EMBLEMS, piso: RAID_EMBLEMS_FLOOR', 'n: RAID_TROPHY_EVERY']) expect(help).toContain(c);
    expect(help).not.toMatch(/\b(max|semanas|cheio|piso|n): \d/);
    for (const k of ['guild.help.guilda', 'guild.help.bosque', 'guild.help.fio', 'guild.help.feira', 'guild.help.mare', 'guild.help.concha']) expect(help).toContain(k);
    expect(ler('components/GuideModal.tsx')).toMatch(/guild\.guide\.titulo[\s\S]*guild\.guide\.corpo/);
  });

  it('o resgate lê o direito do SERVIDOR: a folha só credita via `onClaimed` e não conhece a quantia por conta própria', () => {
    const f = fs.readFileSync(path.resolve(__dirname, 'GuildSheet.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(f).not.toMatch(/setGameState\(|localStorage|\.emblems\s*\+|emblems\s*\+=/);
    expect(f).toMatch(/onClaimedRef\.current\?\.\(\{ emblems: c\.emblems/);
    expect(f).toMatch(/hasClaimedReceipt\(c\.receipt\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RODADA L4 — o que o QA de experiência do L3 reabriu, agora travado.
// ─────────────────────────────────────────────────────────────────────────────
describe('L4: estados que não podem voltar', () => {
  const sheet = fs.readFileSync(path.resolve(__dirname, 'GuildSheet.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../docs/NARRATIVA-COPY-GUILDA.md'), 'utf8');
  const copySrc = fs.readFileSync(path.resolve(__dirname, '../../utils/guildCopy.ts'), 'utf8');

  it('o nome acessível da Feira diz o ESTADO sem nunca dizer "ferido", "metade" nem HP (M2)', () => {
    for (const k of ['guild.aria.feira', 'guild.aria.feira.ferido', 'guild.aria.feira.dissipado'] as const) {
      const [pt, en] = GUILD_COPY[k];
      expect(pt + ' ' + en, k).not.toMatch(/ferid|metade|quase|abalad|\bhp\b|dano|damage|half|wounded|hurt|almost|health/i);
    }
    expect(GUILD_COPY['guild.aria.feira.ferido'][0]).toBe('Fenômeno da semana: {nome}, com luz passando entre as camadas.');
    expect(GUILD_COPY['guild.aria.feira.ferido'][1]).toBe('This week’s phenomenon: {nome}, with light showing between its layers.');
    expect(GUILD_COPY['guild.aria.feira.dissipado'][0]).toBe('Fenômeno da semana: {nome}, desfeito.');
    expect(GUILD_COPY['guild.aria.feira.dissipado'][1]).toBe('This week’s phenomenon: {nome}, come apart.');
  });

  it('o 401 nunca é beco: "tentar de novo" NÃO é mais condicionado a `!== login`, e há caminho até Entrar', () => {
    expect(sheet).not.toMatch(/load\.kind\s*!==\s*'login'/);
    expect(sheet).toMatch(/onLogin/);
    expect(sheet).toMatch(/guild\.erro\.demo/);
    expect(sheet).toMatch(/<UnlockNudge/);
  });

  it('gesto enviado fica FOCÁVEL: nenhum `disabled` no botão de gesto (só `aria-disabled`) — o teclado não perde o lugar (M6)', () => {
    const trecho = sheet.slice(sheet.indexOf('data-gesto={k}'), sheet.indexOf('data-gesto={k}') + 700);
    expect(trecho).toMatch(/aria-disabled/);
    expect(trecho).not.toMatch(/(?<![-\w])disabled=/);
  });

  it('a saída mora no RODAPÉ da folha (M5) e os gestos recebidos no Bosque, não na lista de nomes (M3/B7)', () => {
    expect(sheet).toMatch(/className="sm2-guild-foot"/);
    const roda = sheet.slice(sheet.indexOf('function SalaRoda'), sheet.indexOf('function SalaMural') > 0 ? sheet.indexOf('/**\n * MURAL') : undefined);
    expect(roda).not.toMatch(/data-guild-recebidos/);
    const bosque = sheet.slice(sheet.indexOf('function SalaBosque'), sheet.indexOf('function SalaRoda'));
    expect(bosque).toMatch(/data-guild-recebidos/);
  });

  it('as seis chaves novas do L4 estão no documento E marcadas FINAL (L5) em guildCopy.ts (resolvidas na L5)', () => {
    const novas = ['guild.criar.nome.dica', 'guild.entrar.codigo.dica', 'guild.erro.entrar', 'guild.feira.semroda', 'guild.aria.feira.ferido', 'guild.aria.feira.dissipado'];
    for (const k of novas) {
      expect(doc.includes(`\`${k}\``), `${k} fora do documento`).toBe(true);
      const antes = copySrc.slice(0, copySrc.indexOf(`'${k}'`));
      expect(antes.slice(antes.lastIndexOf('\n  // ')), k).toMatch(/FINAL/);
    }
    // e `guild.erro.demo` é do documento original (§2), sem PENDENTE
    expect(doc).toContain('`guild.erro.demo`');
  });

  it('a Concha da loja lê nome e descrição da copy da Guilda (nenhum literal duplicado — L3-copy)', () => {
    const shop = fs.readFileSync(path.resolve(__dirname, '../../utils/shop.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(shop).toMatch(/GUILD_COPY_CORE\['guild\.concha\.nome'\]/);
    expect(shop).toMatch(/GUILD_COPY_CORE\['guild\.concha\.desc'\]/);
    expect(shop).not.toMatch(/Concha da Maré|Tide shell|Deixada pela maré/);
  });

  it('o mínimo da entrada (`guildCopyCore`) é SUBCONJUNTO de `GUILD_COPY` (uma tabela só) e o App/cerimônia não importam o dicionário inteiro (M4)', () => {
    for (const [k, v] of Object.entries(GUILD_COPY_CORE)) expect(GUILD_COPY[k as keyof typeof GUILD_COPY], k).toEqual(v);
    const raiz = path.resolve(__dirname, '../..');
    const semC = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const rel of ['App.tsx', 'components/guild/GroveMilestoneCeremony.tsx', 'utils/shop.ts', 'hooks/useGroveWatch.ts', 'utils/groveLocal.ts']) {
      expect(semC(fs.readFileSync(path.join(raiz, rel), 'utf8')), rel).not.toMatch(/from '(\.\.?\/)+(utils\/)?guildCopy'/);
    }
  });
});
