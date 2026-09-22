# Canvas Deriva — o que o código mostra e nenhum wireframe cobria

> **Data:** 22/09/2026 · **Fase:** 2 (identidade aplicada) · **Artboards:** 9
> **Origem:** auditoria de cobertura cruzando os 279 ids do
> [`../../INVENTARIO-WIREFRAMES.md`](../../INVENTARIO-WIREFRAMES.md), os 96 componentes de
> `src/components/` (incluindo as 6 subpastas) e os commits em `src/` posteriores a 20/09/2026.

## Por que este canvas existe

Os 14 canvases de Fase 2 fecharam em 20/09. Entre 21 e 22/09 o código ganhou superfícies que
o jogador vê e que não têm linha no inventário nem artboard em canvas nenhum. Este canvas
fecha essa lacuna. **Não é um canvas novo de produto — é a dívida de desenho da deriva.**

A regra de estilo é a dos outros: o CSS vem do canvas Conta (o mais completo em `switch`,
grupo, `toast`, `dock` e alerta), para a peça nova nascer no mesmo sistema.

## Os artboards

| id | arquivo | superfície | por que faltava |
|---|---|---|---|
| `DER-01…04` | `AvisoTermos` | aviso de mudança dos Termos / Política | é a **8ª chave** da fila 2 (`'termos'`), de 21/09; o quadro `RIT-02` ainda desenha 7 |
| `DER-05…07` | `ToastDesfazer` | toast "Desfazer" (5 s) | `UndoToast.tsx` nasceu em 22/09 — zero menções no inventário |
| `DER-08…10` | `ChatSuporte` | caminho de crise no chat | fechou o terceiro bloqueante do parecer clínico (21/09) |
| `DER-11…14` | `ConfigSomSobre` | Configurações: grupos **Som** e **Sobre** + `FeedbackLink` | três grupos que o canvas Conta não alcançou |
| `DER-15…17` | `ContaExcluida` | a lápide do `410 account-deleted` | correção da rodada 2 de QA; reabre também no login posterior |
| `DER-18` | `VozKinds` | 11 dos 21 `kind` de `petVoice.ts` | o balão está desenhado (`HOME-21 · 23 · 24`); o que ele **diz**, não estava |
| `DER-19 · 20` | `VozKindsTracos` | os outros 10 `kind` + a matriz de 5 traços | idem |
| `DER-21` | `GlifosNavDeck` | 20 dos 39 glifos autorais | ver abaixo |
| `DER-22` | `GlifosUtilitarios` | os outros 19 | ver abaixo |

## ⚠️ A divergência que passa deste canvas

**Os 199 artboards dos 14 canvases foram desenhados com Material Symbols. O app entrega 39
glifos autorais no lugar** (`src/components/ui/NavGlyphs.tsx`): a nav, o deck do aparelho, a
lista diária, as moedas e os utilitários de toda tela. Onde uma tela de qualquer canvas mostra
um ícone da lista de `DER-21`/`DER-22`, **o desenho verdadeiro é o de lá.**

Os 39 não foram redesenhados: saíram de um **render real** do componente
(`renderToStaticMarkup` sobre `GlyphSvg`, em contorno e cheio), guardado em `_glifos.json`.

## Como regenerar

Os quatro geradores estão em [`../_gerador/`](../_gerador/). Rodar da raiz do repo:

```bash
node docs/design/wireframes/deriva/_gerador/deriva.mjs
node docs/design/wireframes/deriva/_gerador/deriva-voz.mjs
node docs/design/wireframes/deriva/_gerador/deriva-glifos.mjs
```

`deriva-glifos.mjs` lê `_glifos.json`. Para refazer **esse** arquivo (só é preciso quando
`NavGlyphs.tsx` muda), o passo está descrito no topo do script: um teste temporário dentro de
`src/` que renderiza cada glifo e escreve o JSON, apagado em seguida.

⚠️ O `h` de cada artboard no `canvas.json` é **medido no navegador**, não estimado — um `h`
errado abre buraco na grade da página única de export. Depois de mexer no conteúdo de um
artboard, remedir.

## Onde isto é consumido

Na página única de todas as telas para importar no Figma
(`E:/Soulmon-figma/soulmon-telas.html`, seção 15). O gerador dessa página lê este canvas como
lê os outros 14 — `canvas.json` + `.dc.html`, sem caso especial.
