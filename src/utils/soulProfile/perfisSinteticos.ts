// Perfis sintéticos para as RÉGUAS DE OCORRÊNCIA do oráculo.
//
// ⚠️ **Existe por causa de um erro de medição real, em 22/09/2026.** As
// primeiras medições de balanceamento usaram nomes formulaicos —
// `Perfil 1 Teste`, `Perfil 2 Teste`, `Ana Silva 0`, `Ana Silva 1` — e os
// números saíram muito piores do que a realidade.
//
// A causa: `normalizeName` (utils/oracle.ts) só preserva A–Z, então **o
// índice é descartado**. `Perfil 1 Teste` e `Perfil 2 Teste` têm numerologia
// IDÊNTICA, e 600 perfis assim carregam UM único conjunto de números. Como a
// numerologia alimenta o alinhamento (`alignments[NUMBER_ALIGNMENT[n]] += 4`)
// e o elemento, a amostra inteira herdava o mesmo viés — efeito de rebanho.
//
// O tamanho do erro, medido trocando só o prefixo do nome e nada mais:
// `harmonia` como alinhamento dominante saltou de **57,7% para 7,0%**.
// Quarenta e cinco pontos percentuais de diferença entre dois arnês que só
// discordavam no nome.
//
// Com nomes variados de verdade (782 distintos em 800), o alinhamento mede
// harmonia 41,9% · poder 33,4% · benevolência 24,8%.
//
// **Regra que fica: régua de ocorrência do oráculo usa estes perfis.** Nome
// formulaico com índice não é amostra — é um perfil só, repetido.

/** Pools separados para que a combinação gere numerologias distintas: são
 *  30 × 25 × 15 = 11.250 nomes possíveis. */
const PRIMEIROS = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Felipe', 'Gabriela', 'Hugo',
  'Isabela', 'Joao', 'Karen', 'Lucas', 'Mariana', 'Nuno', 'Olivia', 'Pedro',
  'Quesia', 'Rafael', 'Sofia', 'Tiago', 'Ursula', 'Vitor', 'Wesley', 'Ximena',
  'Yara', 'Zeca', 'Alice', 'Breno', 'Camila', 'Davi',
];

const MEIOS = [
  'Silva', 'Costa', 'Mendes', 'Alves', 'Souza', 'Rocha', 'Lima', 'Martins',
  'Dias', 'Pereira', 'Barbosa', 'Fernandes', 'Gomes', 'Ribeiro', 'Castro',
  'Nunes', 'Moraes', 'Teixeira', 'Cardoso', 'Ferreira', 'Azevedo', 'Braga',
  'Cunha', 'Duarte', 'Esteves',
];

const ULTIMOS = [
  'Oliveira', 'Santos', 'Carvalho', 'Araujo', 'Freitas', 'Guimaraes',
  'Henriques', 'Isaac', 'Junqueira', 'Lopes', 'Machado', 'Neves', 'Pinto',
  'Queiroz', 'Reis',
];

/** Nome completo sorteado pelo RNG semeado de quem chama — determinístico. */
export function nomeSintetico(rng: () => number): string {
  const p = PRIMEIROS[Math.floor(rng() * PRIMEIROS.length)];
  const m = MEIOS[Math.floor(rng() * MEIOS.length)];
  const u = ULTIMOS[Math.floor(rng() * ULTIMOS.length)];
  return `${p} ${m} ${u}`;
}

export interface NascimentoSintetico {
  birthDate: string;
  birthTime: string;
}

/**
 * Data e hora de nascimento sorteadas numa janela ampla.
 *
 * 1955–2009 e não 1990–2000: os planetas LENTOS (Plutão, Netuno, Urano) mal
 * se movem numa década, e é deles que sai a âncora dos 11 elementos cósmicos
 * (`axes.ts`). Janela estreita = amostra que não vê a variação que o produto
 * realmente encontra.
 */
export function nascimentoSintetico(rng: () => number): NascimentoSintetico {
  const ano = 1955 + Math.floor(rng() * 55);
  const mes = 1 + Math.floor(rng() * 12);
  const dia = 1 + Math.floor(rng() * 28);
  const hora = Math.floor(rng() * 24);
  const minuto = Math.floor(rng() * 60);
  return {
    birthDate: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
    birthTime: `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`,
  };
}
