// ---------------------------------------------------------------------------
// O OFFSET DE UM FUSO IANA NUM INSTANTE — uma implementação só.
//
// Isto morava PRIVADO dentro de `soulProfile/astrology/chart.ts`, que é o
// arquivo PESADO do módulo de alma (puxa a `astronomy-engine` inteira e por
// isso só é alcançado por import dinâmico). O `playerDay.ts` precisa do MESMO
// cálculo e roda no caminho quente do jogo: importar `chart.ts` para pegar uma
// função de 20 linhas arrastaria a engine para o bundle inicial, e reescrevê-la
// em `playerDay.ts` criaria duas implementações da mesma conversão — o footgun
// que este repo já pagou em `parseDayValue`/`sameDay` (ver `rituals.ts`).
//
// Então a função foi MOVIDA para cá, sem alteração de corpo: `chart.ts` passa a
// importá-la. Um dono só, zero dependência, e o mapa astral continua sendo o
// oráculo do comportamento — se este cálculo quebrar, o teste do mapa quebra.
// ---------------------------------------------------------------------------

/**
 * Quantos milissegundos o fuso `timeZone` está À FRENTE do UTC no `instant`.
 *
 * Positivo a leste (Tóquio: +9h), negativo a oeste (São Paulo: −3h). O valor é
 * do INSTANTE, não do fuso: é assim que horário de verão entra na conta sem
 * ninguém precisar saber que ele existe.
 *
 * O método é o de sempre com `Intl`: pede as partes da data JÁ no fuso alvo,
 * remonta esse relógio de parede como se fosse UTC e mede a diferença para o
 * instante real. `hour12: false` pode devolver `24` para a meia-noite em alguns
 * runtimes — daí o `% 24`, que não é enfeite.
 *
 * Lança `RangeError` se `timeZone` não for um identificador IANA válido; quem
 * chama com dado vindo de save decide o que fazer (ver `playerDay.ts`).
 */
export function tzOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(instant).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - instant.getTime();
}
