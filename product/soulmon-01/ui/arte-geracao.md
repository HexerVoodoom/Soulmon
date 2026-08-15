# Geração de arte — sessão de 14/08/2026 (agente noturno)

## Resumo

| Item | Estado |
|---|---|
| **A1 · Berço do pet** | ✅ **feito e instalado** em `src/assets/soulmon/nest-base.png` — com a fumacinha de volta |
| **A3 · Ícone de Poder** | ⚠️ **gerado e tratado**, mas **NÃO instalado** — esperando os outros dois |
| **A3 · Ícone de Harmonia** | ❌ falhou 2×, parei (motivo abaixo) |
| **A3 · Ícone de Benevolência** | não tentado |
| **A2 · Botões hover/active** | não tentado (é dívida, não impedimento — o CSS resolve) |
| **P2 (A4–A6)** | não tentado |

## Estado do navegador e dos créditos

- **Chrome: funcionando.** O bloqueio de `Viewport: 0x0` do backlog **não estava
  presente** — a janela reportou 958×952 e cliques/digitação chegaram. Não usei
  o CLI do Higgsfield, então **os 1,5 crédito continuam intactos**.
- Conta do Gemini logada, modo Pro. Conversa usada:
  `https://gemini.google.com/app/97f5bc9d884a1be3` (tem o berço e o ícone de
  Poder no histórico — continue nela para manter o estilo).

## A descoberta que destrava o resto: o Gemini não entrega alfa

Pedir "transparent PNG" ao Gemini produz **xadrez de transparência assado nos
pixels** — ele mesmo escreveu isso na resposta: renderizou o xadrez "rather than
true alpha transparency". É exatamente o defeito que já mandou `nest-base.png` e
`icon-reset.png` para conserto antes.

**A receita que funciona:** pedir a arte sobre **fundo verde chapado #00FF00**,
dizendo que a peça não pode ter verde nenhum nem franja verde em volta, e fazer
o recorte por algoritmo aqui. O script está salvo em
`product/soulmon-01/ui/arte-pendente/chroma-key.mjs`:

```
node chroma-key.mjs <entrada-verde.png> <saida.png> [lado]
```

Ele faz, nesta ordem: chroma-key → *despill* (mata a franja verde) → descarte de
ilhas com menos de 24px (o ruído pontilhado que o guard barra) → recorte da
bounding box → reescala *nearest* (pixel art não pode ser interpolada) →
centralização na caixa de destino.

**Coloque isso no prompt de todo item futuro do backlog** — sem o fundo verde, o
asset nasce reprovado.

## A1 · Berço — o que foi feito

Gerado com `docs/ui-refs/ref-asset-sheet-v1.png` anexada (bloco "Pet Cradle &
Soul Elements"), fundo verde, recorte pelo script, saída 360×201 ancorada
embaixo. A peça tem o que faltava no arquivo remendado: **a fumaça de ciano
subindo do cristal**, além da filigrana em cobre e das correntes nas pontas.

Medições do guard no arquivo instalado:

| métrica | antes (remendado) | agora |
|---|---|---|
| xadrez | 0,0% | 0,0% |
| magenta | 0,00% | 0,00% |
| transparente | 77,2% | 67,8% |
| opaco | 16,9% | 32,2% |

(A área opaca subiu porque a peça agora ocupa mais da caixa e tem a fumaça.)

Checklist do backlog cumprido: guard `assets.contract.test.ts` **18/18 verdes**,
`npm run build` rodado (118 PNGs → WebP), **`CACHE_VERSION` bumpado v48 → v49**
em `public/sw.js`, `npx tsc --noEmit` limpo, backlog marcado ✅.

## A3 · Ícones de atributo — por que parei no meio

- **Poder:** gerado com `REF-attr-poder.png` anexada, ficou bom e fiel — moldura
  de cano em cobre, interior teal, triângulo ciano com chama e cristal. Já está
  tratado em **128×128 com alfa real** em
  `product/soulmon-01/ui/arte-pendente/icon-attr-poder.png`.
- **Harmonia:** falhou **duas vezes seguidas**. Na primeira, o Gemini devolveu a
  **própria imagem de referência** (o mockup em pergaminho com o rótulo
  "Harmonia" e "64x64") em vez de criar arte nova. Na segunda, com o pedido
  explícito de criar imagem nova do zero, a geração **travou** (ficou em
  "Generating New Pixel Art" por mais de 5 minutos sem devolver nada — mesmo
  comportamento de uma geração anterior que sumiu ao recarregar a página).
  Parei aqui, como manda a regra de não repetir tentativa que falha duas vezes.

**Por que o Poder não foi instalado:** os três ícones aparecem lado a lado em
Estatísticas e Evolução. Trocar um por arte nativa e deixar os outros dois como
recortes reescalados dos mockups deixaria o trio visivelmente desigual. Instale
os três juntos.

## Para você terminar em 5 minutos

1. Abra a conversa do Gemini acima (o estilo já está estabelecido nela).
2. Anexe `docs/ui-refs/REF-attr-harmonia.png` e peça — **dizendo que é imagem
   NOVA, não edição da referência**, e que o fundo é **verde chapado #00FF00**:
   moldura quadrada de cobre com cantos chanfrados e juntas de cano, interior
   teal profundo, dentro uma **espiral dupla em teal e cobre dentro de um anel
   de louros**, brilho ciano suave, paleta estrita `#0B3A40 #6EFFF8 #C68642
   #0D0D0D`, sem magenta/roxo/violeta/rosa, sem verde na peça nem franja verde.
3. Repita para Benevolência com `REF-attr-benevolencia.png` e o símbolo
   "árvore cujos galhos viram duas mãos abertas segurando uma gota brilhante,
   com um coraçãozinho no tronco".
4. Salve as duas imagens verdes em qualquer pasta e rode, para cada uma:
   `node product/soulmon-01/ui/arte-pendente/chroma-key.mjs <verde.png> src/assets/soulmon/icons/icon-attr-<nome>.png 128`
5. Copie também o Poder já pronto:
   `cp product/soulmon-01/ui/arte-pendente/icon-attr-poder.png src/assets/soulmon/icons/`
6. Feche o checklist: `npx vitest run src/assets/assets.contract.test.ts`,
   `npm run build`, bump do `CACHE_VERSION`, `npx tsc --noEmit`.

Ficam guardados também os PNGs verdes originais
(`raw-nest-verde.png`, `raw-attr-poder-verde.png`) caso queira recortar com
outro enquadramento.

## Um achado fora do meu escopo (não mexi)

`functions/api/_billing.js` está na árvore **com uma mutação esquecida de teste
de mutação**: em `isSteamPurchaseVoided`, `data?.response?.params?.status` virou
`data?.response.params.status`. Isso derruba `functions/api/billing.test.js` e
`functions/api/entitlements.test.js` no import. Existe um
`functions/api/_billing.js.mutation-bak` com o conteúdo original. **Não é do
trabalho de arte e não toquei** — mas é código de dinheiro com teste vermelho,
vale reverter antes de qualquer deploy. (`npx vitest run` fora esses dois
arquivos: 961 testes passando.)

## Não commitei nada

Tudo está na árvore de trabalho, sem commit e sem push, como combinado.
Arquivos alterados por mim: `src/assets/soulmon/nest-base.png`, `public/sw.js`
(v49), `docs/BACKLOG-ARTE-GERAR.md`, `dist/` (saída do build), e os novos em
`product/soulmon-01/ui/`.
