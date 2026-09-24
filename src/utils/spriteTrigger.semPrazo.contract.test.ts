// GUARD DE FONTE — a incubação não pode virar PRAZO (D-G8b, parecer R-P).
//
// Condição de merge do v1, não da v2.0. O motivo, escrito pelo
// `soulmon-guarda-linha-vermelha`: sem esta varredura, `incubation.since` é um
// prazo esperando o agente futuro que escreva o `if` óbvio — a família do veto
// E5. A diferença entre incubação e timer gate não é o tempo, é o que o
// relógio pode FAZER; aqui ele só pode LIBERAR.
//
// Também trava o R-J (veto preventivo): a espera é UNIFORME. Nenhum caminho
// pode encurtá-la, vendê-la, pulá-la ou premiá-la — nem "a primeira evolução
// é sem espera", nem redução por pagante, vínculo ou traço. Uma espera
// encurtável deixa de ser incubação e vira preço, e o produto passa a fabricar
// a impaciência que vende.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');
const trigger = readFileSync(join(SRC, 'utils/spriteTrigger.ts'), 'utf8');

describe('o relógio da incubação só LIBERA', () => {
  it('existe UMA comparação de data, e é a permitida', () => {
    // A permitida, nomeada: `now.getTime() - t >= INCUBATION_MIN_MS`.
    const permitida = /now\.getTime\(\)\s*-\s*t\s*>=\s*INCUBATION_MIN_MS/;
    expect(trigger).toMatch(permitida);

    // Qualquer OUTRA comparação envolvendo o limite é suspeita: `<`, `>`,
    // `<=` e `!==` sobre `INCUBATION_MIN_MS` seriam a porta do "tarde demais".
    const usos = trigger.match(/INCUBATION_MIN_MS/g) ?? [];
    // 1 na declaração, 1 no comentário do dono único, 1 na comparação.
    const comparacoesProibidas = trigger.match(/INCUBATION_MIN_MS\s*[<>]|[<>]\s*INCUBATION_MIN_MS(?!\s*;)/g) ?? [];
    const soAPermitida = comparacoesProibidas.filter(c => !permitida.test(c));
    expect(soAPermitida, `comparações suspeitas: ${soAPermitida.join(' | ')}`).toHaveLength(0);
    expect(usos.length).toBeGreaterThan(0);
  });

  it('nenhuma palavra de EXPIRAÇÃO aparece no módulo', () => {
    // Não é purismo de vocabulário: o nome vem antes do comportamento, e
    // `expired`/`expirou` é o campo que o próximo `if` vai ler.
    const proibidas = /\b(expire[ds]?|expirou|expirad[ao]|expiracao|expiração|deadline|prazo\s+(?:final|esgotado)|caducou|tardeDemais|tooLate)\b/i;
    const linhasRuins = trigger.split('\n')
      .map((l, i) => [i + 1, l] as const)
      .filter(([, l]) => proibidas.test(l) && !/NÃO|nunca|proib|sem prazo|veta|vira PRAZO/i.test(l));
    expect(linhasRuins.map(([n, l]) => `${n}: ${l.trim()}`)).toEqual([]);
  });
});

describe('R-J — a espera é UNIFORME e nada a encurta', () => {
  it('`INCUBATION_MIN_MS` tem dono único: nenhum outro arquivo de src o redeclara', () => {
    // Mesma regra do alvo de loudness (`loudness.ts`): número de política se
    // escreve num lugar só, senão a segunda cópia é a que alguém ajusta.
    const { execSync } = require('node:child_process') as typeof import('node:child_process');
    const saida = execSync(
      `grep -rln "INCUBATION_MIN_MS\\s*=" ${SRC} || true`,
      { encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean);
    // Separador normalizado: no Windows o `grep` devolve `src/utils/…` com `/`
    // depois de um `SRC` em `\`, e a comparação crua reprovava o dono certo.
    const norm = (p: string) => p.trim().replace(/\\/g, '/');
    expect(saida.map(norm)).toEqual([norm(join(SRC, 'utils/spriteTrigger.ts'))]);
  });

  it('o valor não é condicionado, multiplicado nem dividido em lugar nenhum', () => {
    // Um `INCUBATION_MIN_MS * fator` seria exatamente a espera comprável que o
    // R-J veta preventivamente.
    const aritmetica = /INCUBATION_MIN_MS\s*[*/+]|[*/]\s*INCUBATION_MIN_MS/;
    expect(trigger).not.toMatch(aritmetica);
  });

  it('a espera não olha tier, vínculo, traço nem moeda', () => {
    const bloco = trigger.slice(trigger.indexOf('export const INCUBATION_MIN_MS'));
    expect(bloco).not.toMatch(/\b(accountTier|paid|demo|bondLevel|petPassive|gamePoints|credits|emblems)\b/);
  });
});

describe('o gatilho não depende do acervo de sprites (D-G8d / R-M)', () => {
  it('`incubationFor` não recebe `library` na assinatura', () => {
    const assinatura = trigger.slice(
      trigger.indexOf('export function incubationFor'),
      trigger.indexOf('/** Acervo vazio'),
    );
    // `Pick<SpriteTriggerInput, …>` explicitamente SEM 'library'.
    expect(assinatura).toMatch(/Pick<SpriteTriggerInput,/);
    expect(assinatura).not.toMatch(/'library'/);
  });
});

describe('R-I — a incubação nunca vira contagem na tela', () => {
  const app = readFileSync(join(SRC, 'App.tsx'), 'utf8');

  /** O bloco do aviso, do marcador até o fechamento do push. */
  const aviso = app.slice(
    app.indexOf("if (incubandoAgora) avisos.push({"),
    app.indexOf("/* ── 2. SEMANAL"),
  );

  it('a varredura tem chão embaixo — o aviso existe', () => {
    expect(aviso.length).toBeGreaterThan(200);
    expect(aviso).toMatch(/key: 'incubacao'/);
  });

  it('o texto do aviso não imprime número, hora nem unidade de tempo', () => {
    // R-I: proibido dígito que decresce, barra em tempo real e hora impressa.
    // O texto é palavra grossa ("leva um tempo"), nos dois idiomas.
    // Só as frases: descarta nome de classe/chave (sem espaço) e pega o que
    // tem espaço e ponto final, que é copy de verdade.
    const textos = [...aviso.matchAll(/'([^'\n]{20,})'/g)].map(m => m[1])
      .filter(t => /\s/.test(t) && /[.!?]/.test(t));
    expect(textos.length).toBeGreaterThanOrEqual(2); // PT + EN
    for (const t of textos) {
      expect(t, `número na copy da incubação: ${t}`).not.toMatch(/\d/);
      expect(t, `unidade de tempo na copy: ${t}`).not.toMatch(/\b(minutos?|minutes?|horas?|hours?|segundos?|seconds?|min\b)/i);
    }
  });

  it('o aviso não monta relógio: nenhum contador, barra ou temporizador no bloco', () => {
    expect(aviso).not.toMatch(/setInterval|Date\.now|getTime|toLocaleTimeString|progress|restante|remaining/i);
  });

  it('o relógio que existe é de PORTA, não de vitrine: tica em minuto, sem render de tempo', () => {
    // O ticker existe só para o botão acender sozinho. Se alguém o acelerar
    // para segundos, é porque passou a desenhar contagem.
    const ticker = app.slice(app.indexOf('const [agoraParaIncubacao'), app.indexOf('const incubandoAgora'));
    expect(ticker).toMatch(/setInterval\([\s\S]*?,\s*60_000\)/);
    expect(ticker).not.toMatch(/1_?000\)|setTimeout/);
  });
});
