# Ícones de elemento — instalado

**137 ícones**: os 136 elementos derivados (`src/utils/soulProfile/derivedElements.ts`)
+ `neutro`. Célula **128×128**, fundo transparente. Nomes: `el-<id>.png`.

Instalado em 27/ago/2026. Histórico completo da geração, os prompts e as
armadilhas estão em `D:\Soulmon\scripts-arte\` (repo git local, sem remoto) —
`PROMPT-ICONES-ELEMENTOS.md`, `elementos-motivos.json`, `_icones-estado.json`.

## O que é este ícone (e o que não é)

É o **objeto** que representa o elemento — caveira para veneno, ampulheta para
areia, foice para ceifa. **Não** é o efeito em combate: isso é
`fx-ataque/`, coberto por `attackFxArt.ts`.

Duas fontes alimentaram cada ícone: a FORMA veio de um dicionário de motivos
escrito para esta leva (`elementos-motivos.json`), e a COR veio do mesmo
`derivados-descritores.json` que gerou os FX — é por isso que o ícone de um
elemento e o FX dele falam a mesma paleta.

## ⚠️ Isto abre uma exceção no PLANO-DESIGN

`docs/PLANO-DESIGN` §1 declara que pixel art existe **DENTRO** do visor do
v-pet e que tudo **FORA** é SVG limpo + Material Symbols — e estava marcado
como "não reabro nada disto".

Estes ícones foram encomendados para a **Ficha**, que é superfície de fora. O
dono decidiu a exceção em 27/ago/2026, com a consequência posta na mesa.
**Três coisas ficaram pendentes disso:**

1. O texto do `PLANO-DESIGN` ainda diz o contrário. Enquanto não registrar a
   exceção, o próximo a ler vai tratar esta leva como erro.
2. Os 4 itens do `docs/BACKLOG-ARTE-GERAR.md` aposentados pelo mesmo motivo
   (`A3`, `A10`, `A15`, `A16`) **podem** ter voltado a ser válidos. Não
   assuma que sim — a exceção foi dada para ícone de elemento, não em geral.
3. Pixel chapado ao lado dos Material Symbols de traço fino da Ficha é um
   risco de leitura que ainda não foi visto na tela real. Vale olhar antes de
   espalhar o uso.

## Integração: `src/utils/elementIconArt.ts`

```ts
elementIcon(elementoId: string): string | undefined
elementIconIds(): string[]
```

Usa `import.meta.glob` eager, como `attackFxArt.ts` — o Vite empacota
cada PNG estaticamente sem exigir 137 imports à mão.

Devolve `undefined` quando não há arte, de propósito: o consumidor decide se
mostra rótulo de texto, um traço, ou nada.

**Os 17 elementos BASE não têm ícone.** `elementIcon('fogo')` é `undefined` e
isso é esperado, não um bug. Se um dia forem gerados, entram nesta mesma pasta
com o mesmo prefixo `el-` e a função os pega sozinha.

## Cobertura

| conjunto | ícone? |
|---|---|
| 136 derivados | ✅ |
| `neutro` (sem elemento) | ✅ |
| 17 elementos base | ❌ não gerados |

Sobre o `neutro`: não é um elemento derivado, é o caso "sem elemento". Já
existia nos FX (`fx-neutro-*`, ainda não instalados) e faltava aqui. É
monocromático de propósito — um vazio preto esfarelando em dithering — porque
o que ele comunica é a ausência de identidade elemental. Levou quatro rodadas
até fechar; disco de pedra, sigilo ilegível e cubo impossível foram
descartados por lerem como objeto em vez de ausência.

## Verificação feita na entrega

Todos os 137 passaram por: dimensão 128×128, nenhum sprite vazio, nenhum
preenchendo a célula inteira, nenhum quase-branco (a armadilha que matou o
`anim-hunger-drop` na entrega 4), e diff de ids contra a fila — nenhum
faltando, nenhum sobrando.

## Armadilha do fatiamento, para quem regerar

O `_fatiar.mjs` (projeção de pixels) **abortou nas 13 folhas**: os ícones se
tocam dentro das células — numa folha, dois viraram uma caixa única de 518px.
Isso é o guard funcionando, não um bug. Como as folhas são grade regular, o
`_fatiar-grade-n.mjs` resolveu todas.

Vale saber que **isso não aparecia na inspeção visual** das folhas a 520px; só
apareceu no fatiamento. Conferir a folha por print não substitui fatiar.
