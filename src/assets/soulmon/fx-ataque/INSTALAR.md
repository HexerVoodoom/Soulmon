# FX de ataque dos 136 elementos derivados — instalado

**816 sprites**: os 136 elementos derivados (`src/utils/soulProfile/derivedElements.ts`)
× 6 estados, célula **128×128**, fundo transparente. Nomes: `fx-<id>-<estado>.png`.

Instalado em 27/ago/2026, a pedido explícito do dono — a convenção anterior
("quem gera arte não toca no repo") valia até este ponto; a campanha de
geração está descrita em `D:\Soulmon\scripts-arte\HANDOFF.md` e
`D:\Soulmon\_gemini_out\entrega6\derivados\INSTALAR.md` (histórico completo de
como cada sprite foi gerado, o que deu errado, e a tabela de cobertura por
ocorrência real). Este arquivo aqui é o canônico daqui pra frente.

## Os 6 estados

| estado | o que é | quando apareceria |
|---|---|---|
| `cast` | círculo/glifo de conjuração, runas na borda, energia no centro | início do turno |
| `aura` | halo oval **vazado no meio**, para o bicho ficar dentro | buff, elemento ativo |
| `slash` | crescente único cortando na diagonal | corpo a corpo |
| `impact` | explosão irregular a partir de um núcleo claro, com estilhaços | o golpe acerta |
| `defended` | barreira frontal trincando, com duas fagulhas defletidas | o golpe é bloqueado |
| `orb` | projétil compacto com rastro afilado, **voando para a DIREITA** | ataque à distância |

Duas consequências práticas do desenho (herdadas da entrega6 base):

- **`aura` é vazada de propósito.** Vai ATRÁS do sprite do bicho (z-index
  menor), não por cima — desenhada por cima, tapa a cara do bicho.
- **`orb` aponta para a direita.** Projétil indo para a esquerda é
  `transform: scaleX(-1)`, não um arquivo novo.

## ⚠️ Continua não existindo ponto de chamada

O combate de hoje **não conhece elemento**. `buildDungeonWave` sorteia por
tier, não por elemento, e os popups de `DungeonGame`/`NightmareBattle` mostram
os emojis genéricos de `fxArt.ts` (⚔️ 💥 🛡️ ✨ 💫 🏳️). Instalar os arquivos e o
mapa (`src/utils/derivedAttackFxArt.ts`) não troca nenhuma arte hoje — deixa a
peça pronta para o dia em que alguém decidir de onde vem o elemento do golpe
(do bicho do jogador? do inimigo? de um item equipado?). Essa é uma decisão de
produto, não de arte, e continua em aberto.

O caminho mais barato para estrear a arte sem tocar no motor de combate:
`derivedAttackFx(idDoElementoDoGalho, 'aura')` na página de **Evolução**, que
já sabe o galho elemental do bicho.

## Integração: `src/utils/derivedAttackFxArt.ts`

Usa `import.meta.glob('../assets/soulmon/fx-ataque/*.png', { eager: true })`
em vez de 816 imports nomeados — o Vite ainda vê e empacota cada PNG
estaticamente (mesma garantia de bundle que imports explícitos dariam), só
que sem exigir uma linha por arquivo. A função exportada:

```ts
derivedAttackFx(idElementoDerivado: string, estado: AttackFxState): string | undefined
```

Devolve `undefined` de propósito quando não há arte para a combinação — hoje
isso nunca acontece (os 136×6 estão todos aqui), mas mantém o mesmo contrato
"cai no emoji genérico" que `attackFxArt.ts` (dos 17 elementos base) usa.

Os 17 elementos **base** (fogo, água, terra...) têm sua própria leva
(`_gemini_out/entrega6/`) e **ainda não foram instalados** — essa decisão
não foi pedida nesta sessão. Quando forem, devem cair no mesmo
`fx-ataque/` e no mesmo formato de chave `'<id>:<estado>'`; o glob de
`derivedAttackFxArt.ts` já os pegaria automaticamente, mas o nome do módulo
("derived...") deixaria de fazer sentido — vale renomear para algo neutro
(`attackFxArt.ts`, unificando os dois mapas) nesse momento.

### Custo de bundle

816 PNGs de 128×128 (~beira de poucos KB cada; ver tamanho real com
`du -sh src/assets/soulmon/fx-ataque/`). Como não há ponto de chamada, hoje é
peso morto no bundle inicial se o Vite não fizer code-splitting do glob. Se o
tamanho final incomodar, a saída é trocar `eager: true` por lazy
(`import.meta.glob(..., { import: 'default' })` sem `eager`, resolvendo a
Promise só quando o elemento entrar em jogo) — mas isso exige que o chamador
seja assíncrono, o que hoje não existe. Deixado como está (eager) por ser mais
simples e por não haver chamador ainda; revisitar quando o combate elemental
nascer. Se a arte entrar de fato em uso, o `CACHE_VERSION` do `public/sw.js`
precisa subir.

## Cobertura por ocorrência real

Medida em 40.000 perfis sintéticos com o motor de eleição de verdade (ver
`D:\Soulmon\scripts-arte\_alcance-derivados.ts` e o `ALCANCE.md` da campanha
para o método). Os 15 primeiros da tabela cobrem 90,1% das ocorrências reais;
os outros 121 (incluindo `equilibrio`, que nunca é eleito — 0/40.000, arte
pronta sem ponto de entrada, destino em aberto pro dono) somam o resto.
Tabela completa preservada em
`D:\Soulmon\_gemini_out\entrega6\derivados\INSTALAR.md` e `ALCANCE.md` —
não duplicada aqui para não desatualizar em dois lugares.

## Como estes foram gerados (resumo — detalhe completo no handoff de geração)

Prompt canônico em `D:\Soulmon\scripts-arte\PROMPT-DERIVADOS.md`, descritor de
cor de cada elemento em `D:\Soulmon\scripts-arte\derivados-descritores.json`.
Armadilhas que custaram gerações e ficaram documentadas lá: rótulos de texto
desenhados na folha (guard de contagem não pega isso — confira a olho),
ícones que se tocam entre si (o fatiador aborta corretamente; usar
`_fatiar-grade.mjs` como fallback de grade fixa 3×2), e SIGPIPE ao truncar
a saída do fatiador com `| head`.

As folhas 3×2 originais (`raw/`) **não foram copiadas para o repo** — ficam só
em `D:\Soulmon\_gemini_out\entrega6\derivados\raw\`, caso alguém precise
recortar diferente.
