// PONTE SINTÉTICA — os 17 elementos precisam de pelo menos uma criatura cada.
//
// ⚠️ Achado pelo `soulmon-guarda-permanencia` em auditoria (27/09/2026):
// `scoreCreature` (`bestiary/select.ts`) soma, para CADA elemento base da
// criatura, o share que a leitura do jogador deu àquele elemento — é o termo
// de MAIOR peso da função (os outros quatro critérios somam no máximo +7
// fixo). Medido: `eletricidade` e `marcial` tinham **ZERO** ocorrências no
// pool, direta ou via qualquer um dos 16 derivados de cada; `sombra` tinha
// só **2 de 617**. Um jogador com um desses elementos dominante nunca via
// nenhuma criatura "cobrar" o share mais alto da própria leitura — a escolha
// degradava pra família/bioma/hostilidade/tamanho, o eixo mais fraco.
//
// **Isto não é um buraco de código, é um buraco de CORPUS** — o upstream
// (`Besti-rio-`) simplesmente não tinha criatura nenhuma marcada com esses
// elementos na amostra que este projeto puxou. Não dá pra consertar sem o
// repo irmão clonado (fora desta sessão). A ponte existe pra não deixar o
// jogador pagando por uma lacuna de dado que não é dele.
//
// **É EXPLICITAMENTE TEMPORÁRIA e SE RETIRA SOZINHA.** Ela clona linhas já
// existentes do pool (mesma base, mesmo `tamanho`/`hostilidade`/`atributos`
// — não inventa número de balanceamento do zero) e troca só `elementos` e o
// sufixo "de <Elemento>" do nome. Quando um sync futuro trouxer criatura de
// verdade pra um desses elementos, a checagem de cobertura abaixo passa a
// não achar buraco e a ponte para de gerar linha pra aquele elemento —
// sozinha, sem precisar editar este arquivo.

import { baseDe } from './bestiario-procedencia.mjs';

/** Sufixo "de <Elemento>" no nome — mesma capitalização que o pool já usa
 *  pros 15 elementos que aparecem hoje (`Água`, `Sombra`, `Vileza`…). */
const NOME_DO_ELEMENTO = {
  eletricidade: 'Eletricidade',
  marcial: 'Marcial',
  sombra: 'Sombra',
};

/** Quantas linhas a ponte garante por elemento — piso baixo de propósito
 *  (é ponte, não paridade com os elementos populosos do corpus real). */
const PISO_POR_ELEMENTO = 5;

/**
 * Devolve o pool com a ponte aplicada: para cada elemento de
 * `NOME_DO_ELEMENTO` que tiver MENOS de `PISO_POR_ELEMENTO` ocorrências
 * (contando derivados, via `baseElementosCobertos`), clona `PISO -
 * ocorrências` linhas de bases DIFERENTES, espalhadas por tamanho, com o
 * elemento e o nome trocados — o resto (`familia`/`biologia`/`descricao`/
 * `bioma`/`tamanho`/`hostilidade`/`atributos`) vem inalterado da linha
 * clonada, porque esses campos descrevem a ESPÉCIE, não o elemento.
 */
export function aplicarPonte(criaturas, baseElementosCobertos) {
  const cobertura = {};
  for (const el of Object.keys(NOME_DO_ELEMENTO)) {
    cobertura[el] = criaturas.filter(c => baseElementosCobertos(c.elementos).includes(el)).length;
  }

  const faltando = Object.entries(cobertura).filter(([, n]) => n < PISO_POR_ELEMENTO);
  if (faltando.length === 0) return criaturas; // upstream já resolveu — ponte se retira

  // Fontes de clonagem: uma linha por base distinta, ordenadas por tamanho
  // pra dar alguma variedade de porte às linhas novas. Evita clonar sempre a
  // mesma base pros três elementos.
  const porBase = new Map();
  for (const c of criaturas) {
    const b = baseDe(c.nome);
    if (!porBase.has(b)) porBase.set(b, c);
  }
  const fontes = [...porBase.values()];

  const novas = [];
  let cursor = 0;
  for (const [el, n] of faltando) {
    const faltam = PISO_POR_ELEMENTO - n;
    for (let i = 0; i < faltam; i++) {
      const fonte = fontes[(cursor++) % fontes.length];
      // Tira SÓ o sufixo de elemento no fim do nome, sem tocar o modificador
      // de bioma do meio (ex.: "Tigre Costeiro Venenoso" -> "Tigre Costeiro",
      // preservando "Costeiro"). Duas formas convivem no pool: "de <Elemento>"
      // (a maioria) e "Veneno"/"Venenoso" sem preposição (as não-procedurais
      // do derivado veneno=água+morte) — as três substituições são
      // mutuamente exclusivas, então encadeá-las é seguro.
      const semSufixo = fonte.nome
        .replace(/\s+de\s+\S+$/, '')
        .replace(/\s+Venenos[oa]$/, '')
        .replace(/\s+Veneno$/, '');
      novas.push({
        ...fonte,
        elementos: [el],
        nome: `${semSufixo} de ${NOME_DO_ELEMENTO[el]}`,
        _ponte: 'bestiario-ponte-elementos.mjs — cobertura sintética, ver docs/BESTIARIO-PROCEDENCIA.md §11',
      });
    }
  }
  return [...criaturas, ...novas];
}
