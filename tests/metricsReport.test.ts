/**
 * WP0.1 — o leitor dos números, escrito ANTES da chave.
 *
 * A decisão D1 do dono foi "escrevo o leitor agora, chave depois": em vez de o
 * plano inteiro esperar por uma variável de ambiente, o leitor espera por ela.
 * Isto é o teste dessa metade — as cinco regras de leitura, cada uma travada
 * como comportamento e não como comentário.
 *
 * O ponto de todas elas é o mesmo: o dano dos números não vem de coletar
 * errado, vem de LER errado com convicção. Uma regra escrita num README é uma
 * regra que alguém esquece às 2h da manhã olhando um dashboard.
 */
import { describe, it, expect } from 'vitest';
import {
  medianaDeHistograma, diasDaJanela, razao, linhaDeRazao, barras,
  histogramaGoalDays, renderRelatorio, MIN_DIAS_CONVERSAO,
} from '../tools/metricsReport.mjs';

const resposta = (totals: Record<string, number>, from = '2026-07-01', to = '2026-07-31') => ({
  ok: true, from, to, days: {}, totals,
  notes: { cohort: 'nao existe', unreadable: ['retencao', 'D7'] },
});

describe('mediana de histograma (regra 2)', () => {
  it('devolve o valor do meio, não a média', () => {
    // Nove semanas de 1 dia e uma de 7: a MÉDIA diz 1,6 e descreve ninguém.
    expect(medianaDeHistograma({ 1: 9, 7: 1 })).toBe(1);
  });
  it('sem observação nenhuma devolve null — e null não é zero', () => {
    expect(medianaDeHistograma({})).toBeNull();
    expect(medianaDeHistograma({ 3: 0 })).toBeNull();
  });
  it('ignora contagem inválida sem quebrar', () => {
    expect(medianaDeHistograma({ 2: 5, 3: NaN as unknown as number })).toBe(2);
  });
});

describe('razão e o `n` colado (regras 1 e 4)', () => {
  it('sem denominador não existe 0% — existe "sem dados"', () => {
    expect(razao(0, 0)).toBeNull();
    expect(linhaDeRazao('x', razao(3, 0))).toMatch(/sem dados/);
  });
  it('toda razão sai com o numerador e o denominador ao lado', () => {
    const linha = linhaDeRazao('recusas ÷ vistas', razao(3, 12)!);
    expect(linha).toContain('25.0%');
    expect(linha, 'percentual sem denominador é a mentira mais barata').toContain('(3 de 12)');
  });
  it('a razão é rotulada como aproximada', () => {
    expect(linhaDeRazao('x', razao(1, 2)!)).toContain('~');
  });
});

describe('histograma com eixo em zero (regra 3)', () => {
  it('a barra é proporcional ao valor absoluto, não à diferença', () => {
    const linhas = barras({ 0: 0, 1: 5, 2: 10 }, { largura: 10 });
    expect(linhas[0]).toMatch(/│ {10}│ 0/);       // zero é zero, não "o menor"
    expect(linhas[1]).toMatch(/█{5} {5}│ 5/);     // metade do máximo
    expect(linhas[2]).toMatch(/█{10}│ 10/);
  });
  it('todo balde vazio ainda aparece — ausência é dado', () => {
    expect(barras({ 0: 0, 1: 0 })).toHaveLength(2);
  });
});

describe('janela e a recusa de conversão (regra 5)', () => {
  it('conta os dias inclusive nas duas pontas', () => {
    expect(diasDaJanela('2026-07-01', '2026-07-31')).toBe(31);
    expect(diasDaJanela('2026-07-01', '2026-07-01')).toBe(1);
    expect(diasDaJanela('2026-07-31', '2026-07-01')).toBe(0);
  });

  it('janela curta NÃO imprime conversão — não é aviso, é ausência', () => {
    const txt = renderRelatorio(
      resposta({ unlock_view: 100, purchase: 9 }, '2026-07-01', '2026-07-10'),
    ).join('\n');
    expect(txt).toMatch(/NÃO IMPRESSA/);
    expect(txt, 'o número apareceu mesmo assim — um aviso ao lado não impede ninguém de ler')
      .not.toMatch(/compras ÷ visualizações/);
    expect(txt).toContain(`mínimo ${MIN_DIAS_CONVERSAO}`);
  });

  it('janela suficiente imprime, com o n junto', () => {
    const txt = renderRelatorio(resposta({ unlock_view: 100, purchase: 9 })).join('\n');
    expect(txt).toMatch(/compras ÷ visualizações: ~9\.0%\s+\(9 de 100\)/);
  });
});

describe('o relatório inteiro', () => {
  it('abre dizendo o que NÃO sabe, antes de qualquer número', () => {
    const linhas = renderRelatorio(resposta({ day_active: 40 }));
    const iAusencia = linhas.findIndex((l: string) => l.includes('NÃO é calculável'));
    const iNumero = linhas.findIndex((l: string) => l.includes('dias-ativos contados'));
    expect(iAusencia).toBeGreaterThan(-1);
    expect(iAusencia, 'a ausência tem de estar nos dez primeiros segundos de leitura')
      .toBeLessThan(iNumero);
    expect(linhas.join('\n')).toContain('retencao');
  });

  it('avisa que dia-ativo não é gente', () => {
    // É o erro de leitura mais provável deste agregado, e ele é estrutural:
    // sem identidade, uma pessoa em dez dias e dez pessoas num dia são o
    // mesmo número.
    expect(renderRelatorio(resposta({ day_active: 40 })).join('\n'))
      .toMatch(/NÃO é gente/);
  });

  it('esforço sai rotulado como MÉDIA, com a ressalva de que não decide sozinho', () => {
    const txt = renderRelatorio(resposta({ day_active: 10, 'effort_sum.demo': 109 })).join('\n');
    expect(txt).toContain('MÉDIA por dia-ativo: 10.90');
    expect(txt).toMatch(/média de distribuição com cauda mente/);
    expect(txt, 'a dependência do WP0.8 tem de estar dita').toMatch(/WP0\.8/);
  });

  it('a métrica-norte sai como histograma + mediana, nunca só como taxa', () => {
    const totals: Record<string, number> = { 'week_active.goal_days.1': 9, 'week_active.goal_days.7': 1 };
    const txt = renderRelatorio(resposta(totals)).join('\n');
    expect(txt).toContain('mediana: 1 dia(s) de 7');
    expect(txt).toContain('n = 10 semanas');
  });

  it('sem dados diz "sem dados", nunca zero', () => {
    const txt = renderRelatorio(resposta({})).join('\n');
    expect(txt.match(/sem dados/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(txt).not.toMatch(/mediana: 0/);
  });

  it('o histograma de goal_days cobre 0..7 inteiro', () => {
    expect(Object.keys(histogramaGoalDays({}))).toEqual(['0','1','2','3','4','5','6','7']);
  });
});
