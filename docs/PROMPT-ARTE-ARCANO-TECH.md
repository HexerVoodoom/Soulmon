# Prompt canônico de arte — estilo arcano-tech

> Decisão do dono, 08/09/2026. Substitui o prompt-base do
> `BRIEF-ARTE-DECORACAO.md` e o do `HANDOFF-ARTE-GEMINI.md` para **toda** peça
> nova de decoração e de cena.

## A direção

O dono descreveu o estilo assim:

> Uma ilustração de pixel art de alta fidelidade e polida de um **[ITEM]**,
> projetada para a interface de um jogo móvel com o estilo visual **arcano-tech**
> distinto das referências. O item é renderizado com uma paleta de cores de
> fundo verde-petróleo escuro, com molduras de cobre profundo e detalhes de
> fiação. Elementos de energia, como chamas de alma e cristais, brilham com uma
> luz ciano néon. O design combina elementos orgânicos como videiras integradas
> a tubos de metal e engrenagens. O sombreamento é suave para criar profundidade
> e brilho. Se aplicável, o item é emoldurado por uma borda decorativa de metal
> e videiras.

## A única adaptação, e por que ela existe

O texto acima pede **sombreamento suave** e **alta fidelidade**. Isso briga com
o tamanho real de tela destas peças: a decoração é desenhada em **48–56 px** e
as cenas da aventura em **28 px**. Gradiente e anti-aliasing nesse tamanho viram
mingau — é o risco que o próprio `BRIEF-ARTE-DECORACAO.md` chama de "pior que os
emoji atuais".

**Resolução aprovada pelo dono:** ficam a **paleta e os motivos** do arcano-tech
(verde-petróleo, cobre, energia ciano, videiras entrando em tubos e engrenagens,
moldura decorativa); sai o **sombreamento suave**, substituído por sombreamento
em degraus de cor chapada — que dá a mesma sensação de profundidade e brilho sem
borrar o pixel.

## O prompt, pronto para colar

Trocar `<ITEM>` pela direção de arte da peça, `<L>×<A>` pelo tamanho da caixa e
a última linha pela proporção da caixa.

```
High-fidelity polished pixel art of <ITEM>, for the UI of a mobile game in the
distinct arcane-tech style of the attached reference. Dark petroleum-teal base
palette with deep copper frames and fine wiring details. Energy elements - soul
flames and crystals - glow in neon cyan. Organic elements such as vines woven
into metal tubes and gears. Where it fits the object, a decorative border of
metal and vines.
Depth and glow come from STEPPED SHADING in flat color bands, never from soft
gradients: crisp hard-edged pixels, no anti-aliasing, no blur, no soft shading.
Limited palette of 5-7 colors plus a dark near-black 1px outline around the
silhouette.
Drawn as a single object on a solid flat chroma green background (#00FF00). The
object itself must contain no green at all, and no green fringe or halo around
its edges. No shadow, no ground line, no scenery.
Absolutely no magenta, purple, violet or pink anywhere - not in the object, not
in glows, outlines or edges.
The object must be fully readable at <L>x<A> pixels.
Square 1:1 aspect ratio.
```

**Sempre anexar** `docs/ui-refs/v2/REF-splash-arcano-tech.png` (e, quando útil,
`docs/ui-refs/REF-kit-v12.png`). Anexo tem de ser **PNG** — `.jfif` o Gemini
trata como documento e a geração falha.

## Regras de operação que continuam valendo

- **A proporção vai no fim, e é a proporção da IMAGEM, não a forma do objeto.**
  Medido: descrever "6,5× mais largo que alto" falhou duas vezes; pedir
  `wide banner composition, 6.5:1 aspect ratio` acertou de primeira.
- **Envie com Return**, não com o botão "Enviar mensagem", que falha em silêncio.
- **Só digite depois de a página hidratar**: enquanto o campo aparece como
  "Peça ao Gemini" ele engole o texto; quando vira "Insira um comando para o
  Gemini" está pronto.
- **Uma conversa nova por peça ou por folha.** Com muitas imagens na mesma
  conversa, o botão de download da mais recente deixa de ser alcançável.
- **A pasta de download é `E:\dowload`** (sem o "n").
- **Peça em FOLHA quando as peças compartilham a proporção** — corta N gerações
  em 1, e o `scripts/fatiar-folha.mjs` recorta por projeção de pixels.

## Diagnóstico obrigatório antes de culpar a UI do Gemini

Se o texto entra no campo e desaparece sem criar conversa, **meça a visibilidade da
aba antes de qualquer outra hipótese**:

```js
({ w: window.innerWidth, h: window.innerHeight,
   vis: document.visibilityState, focus: document.hasFocus() })
```

`vis: "hidden"` explica o sintoma inteiro. A janela do Chrome está minimizada ou
atrás de outra janela, e o Gemini descarta o envio — é a condição que as
instruções globais descrevem ("a aba precisa estar em primeiro plano"), só que
ela é invisível para quem só olha a página.

Medido em 08/09/2026: `hasFocus()` retornou `true` **junto com**
`visibilityState: "hidden"`. Ou seja, `hasFocus` sozinho não serve de teste —
use `visibilityState`.

Foram gastas seis rotas de envio antes desse diagnóstico (Return por coordenada,
Return por `ref`, botão por `ref`, botão por coordenada, `.click()` de JS,
`focus()` de JS + Return). Todas falham do mesmo jeito, e nenhuma delas era o
problema. Um `screenshot` na aba às vezes traz a janela à frente; quando não
traz, **só o dono resolve** — clicar na janela do Chrome. A extensão de
automação não levanta janela, e o `computer-use` deste ambiente não tem o Chrome
na lista de aplicativos concedíveis (ele aparece só como "Chrome Remote
Desktop").

## Os três prompts da splash (A13), prontos para colar

Único item de arte que sobrou. Cada um é uma **conversa nova**; o ciclo e o
pós-processamento são os mesmos das outras peças. Depois de baixar:

```bash
node scripts/decor-para-caixa.mjs <raw.jfif> src/assets/soulmon/splash/<nome>.png <L> <A> --cores 10 --dist 34
```

### 1 · `logo-soulmon.png` (wordmark)

```
Pixel-art game logo on flat chroma green #00FF00, arcane-tech style: the word
SOUL in hollow letters with a glowing neon cyan outline, and below it the word
MON in solid deep copper with a dark outline. A cyan soul flame rises behind the
letters, thin cyan circuit traces drip below like data rain. Hard-edged pixels,
stepped shading, no anti-aliasing, no gradients, no blur. The lettering contains
no green and no green fringe. No magenta, purple, violet or pink. Readable at 220
pixels wide. Wide composition, aspect ratio 3:2, NOT square.
```

### 2 · `frame-pipes.png` (moldura 9:16 — resolve o A6 também)

```
Full-screen pixel-art frame on flat chroma green #00FF00, arcane-tech style: an
ornate deep copper pipe border running along all four edges, with elbow joints
and glowing cyan crystals at the four corners, and dark teal-green vines with
small leaves wrapped asymmetrically around the pipes, denser at the top corners.
THE CENTER IS ENTIRELY CHROMA GREEN AND EMPTY - only the border has art. The
border contains no green and no green fringe. No magenta, purple, violet or
pink. Readable at 360 pixels wide. Portrait composition, aspect ratio 9:16, NOT
square.
```

### 3 · `crystals-pedestal.png` (os 3 cristais do rodapé)

```
Pixel-art element on flat chroma green #00FF00, arcane-tech style: three large
glowing neon cyan crystals standing on small dark stone pedestals, side by side,
connected to each other by hanging deep copper chains, front view. Stepped
shading in flat bands, hard-edged pixels, no anti-aliasing, no gradients, no
blur. The crystals and pedestals contain no green and no green fringe. No
shadow, no ground line, no scenery. No magenta, purple, violet or pink. Readable
at 280 pixels wide. Wide composition, aspect ratio 5:2, NOT square.
```

### Por que estes três não foram gerados nesta rodada

**Seis envios perdidos, todos com `document.visibilityState: "hidden"`.** A
janela do Chrome estava maximizada (1920×953) mas atrás da janela do app do
Claude, e nessa condição o Gemini descarta o envio — o texto entra no
`contenteditable` (confirmado por leitura) e desaparece sem criar conversa.

Tentado e falhado para trazer a janela à frente: `screenshot` na aba (às vezes
funciona, não funcionou), fechar o grupo de abas e deixar a extensão criar uma
JANELA nova, e `computer-use` — este último não tem o Chrome na lista de
aplicativos concedíveis desta máquina (aparece só como "Chrome Remote Desktop").

⚠️ **`hidden` não é bloqueio absoluto**, e é isso que faz valer a pena insistir:
na mesma condição, nesta sessão, passaram a folha de 12 ícones e as duas
gerações do berço. É intermitente. O que resolve de vez é o dono clicar na
janela do Chrome.
