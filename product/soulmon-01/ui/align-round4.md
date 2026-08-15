# Alinhamento — rodada 4

Três correções vindas do dono, olhando a Home: **a área do pet é fixa**, **o
ícone do item sai da caixa**, **a quina da moldura fecha**.

Branch `claude/ui-qa`, worktree `E:\soulmon-ui-qa`, mesclado com `origin/main`
(`173ba076`) antes de qualquer edição. Nada foi commitado nem enviado.

Portões, números reais:

| portão | resultado |
| --- | --- |
| `npx tsc --noEmit` | 0 erros |
| `npx vitest run` | 66 arquivos, **1142 passando**, 1 pulado, 0 falhando |
| `npm run build` | 1864 módulos, `built in 3.39s`, worker compilado |

Verificação em Playwright (`E:/pw`), build real servido por `vite preview`,
`serviceWorkers: 'block'`, modais de abertura dispensados, **tema claro e
escuro**, **412×915 e 412×700**. Roteiros novos: `E:/pw/round4.mjs` (medida +
screenshots), `E:/pw/quina.mjs` (recorte ampliado de quina sob demanda),
`E:/pw/telas4.mjs` (as outras telas), `E:/pw/arvore.mjs` (árvore de caixas).

---

## 1. A área do pet é fixa

### O que estava errado

Medido, não estimado: rolando a Home até o fim em 412×915 e 412×700, a área do
pet saía **inteiramente** da tela (`areaVisivel: false`, `spriteVisivel: false`
nos quatro cenários). O jogador que descia para marcar o terceiro ritual perdia
de vista a única coisa que dá sentido a marcar ritual.

### O que foi feito

`position: sticky`, **não** `fixed` (`.sm-pet-sticky` em `src/index.css`,
aplicado ao `<div>` mais externo do `CompanionHUD`).

Sticky continua **no fluxo**: a lista não precisa de nenhum `padding-top`
mágico para não nascer embaixo do pet, e a densidade continua sendo cálculo
normal de layout. `fixed` exigiria cravar a altura da área em px — exatamente o
número mágico que `--sm-chatdock-h` aposentou na rodada 3. Pelo mesmo motivo,
o padding-top do scroller virou o token **`--sm-scroll-pt`**, consumido pelos
dois lados (`App.tsx` e o `top` do sticky): com 12px cravado em dois lugares
sobrava uma fresta por onde a lista aparecia rolando **acima** do pet — está no
screenshot que me fez voltar e corrigir.

Três cuidados que o pedido nomeava:

**Opacidade sem tapar o cenário.** A Home pinta um cenário `position: fixed`
cobrindo a tela. A área fixa repete o mesmo cenário com
`background-attachment: fixed`, que ancora no viewport — então ela é opaca (a
lista não aparece por trás) e casa pixel a pixel com o fundo de baixo, em vez
de virar uma tarja de cor chapada por cima dele.

**Sangria lateral.** `margin-inline: -24px` + `padding-inline: 24px`, porque o
scroller tem `px-6`: sem isso, 24px de cada lado ficariam transparentes.

**Aparelho baixo.** A área fixa não pode comer a tela — e a primeira tentativa
comeu: encolher o palco de 250px cortava o pet pelos pés, porque tudo lá dentro
(sprite, berço, decoração, `GROUND_Y`) é ancorado no **centro** dos 250px.
A solução foi separar **janela** de **composição**: a composição continua com
`STAGE_HEIGHT` (250px) e é ancorada ao **fundo**; quem encolhe é a janela por
cima dela, que corta pelo **topo** — exatamente onde estava o ar (o sprite só
começa a 87px). `utils/petStage.ts` não mudou uma linha, e o pet nunca aparece
cortado.

O botão **Evoluir** mudou de `top: 10` para `bottom: 6` junto: a janela corta
pelo topo, e controle cortado é defeito funcional, não estético — em 412×700
ele sumiria da tela.

### Densidade (T4), recalculada

Unidades de ação **inteiras** acima da dobra **útil** — e a dobra útil é o topo
do dock de chat, não o fim da tela; o que está atrás do dock não está visível.
Essa correção de método mudou o número de referência: pela régua antiga
(`innerHeight`) o "antes" em 915 parecia 5.

| viewport | antes | depois | meta |
| --- | --- | --- | --- |
| 412×915 | 3 | **4** | ≥3 ✅ |
| 412×700 | 0 | **2** | ≥3 ❌ |

E, em qualquer posição de rolagem, a área do pet e o sprite continuam visíveis
(`areaVisivel: true`, `spriteVisivel: true` nos quatro cenários, com o scroller
no fim).

O que devolveu altura: janela do palco 250 → **215** (padrão) e **175**
(≤800px de altura), padding vertical do sticky a zero, e em tela baixa a linha
de ritual aperta de 72 para 64px com o título do painel mais justo — sem tocar
em alvo de toque (o checkbox continua 44×44 e a coluna de texto mantém
`min-height: 44px`; WCAG 2.2 AA 2.5.8 intacto).

### O que NÃO consegui, e por quê — precisa de decisão do dono

**≥3 em 412×700 não é alcançável com o pet permanentemente visível.** Não é
falta de tentativa, é geometria. O orçamento medido nessa tela:

```
dobra útil ................ 548px  (700 − dock de chat 84 − nav 68)
HUD (marca+créditos, VIDA/ENERGIA) ....  94px
área fixa do pet (janela 175 + fileira de ações 64) ... 239px
moldura + título do painel ............  38px
                                        ─────
sobra para a lista ....................  150px  =  2 linhas de 64px
```

Para 3 linhas faltam ~88px, e não há de onde tirar sem uma decisão de produto:

- **175px é o piso do palco.** O sprite começa a 87px do topo da composição;
  abaixo de ~165px a janela corta o pet pela cabeça.
- Cortar a fileira Itens/Banho/Dormir (64px) ainda deixaria em 2.
- Os 88px existem em exatamente dois lugares: a **linha da marca do HUD**
  (94px com os créditos) ou o **dock de chat** (84px).

Minha recomendação: em `max-height: 800px`, colapsar a linha da marca (a
cápsula CRÉDITOS sobe para a fileira de medidores). Não fiz porque tirar o
wordmark da tela é decisão do dono, não minha. Registrado o número exato para
a decisão ser sobre o trade, não sobre o palpite.

Vale dizer o que melhorou de verdade em 700 mesmo sem bater a meta: **de 0 para
2** unidades no repouso, e — o que o dono pediu — a lista mantém 274px de área
viva em **qualquer** posição de rolagem, em vez de perder a tela inteira.

---

## 2. O ícone do item saiu da caixa

Cada linha de ritual tinha o ícone dentro de um quadrado de cobre chanfrado. A
moldura saiu; o ícone fica solto na linha e cresceu de 28 para 32px, já que não
divide mais a casa com uma borda.

**A regra da rodada 3 não foi violada.** "Controle interativo sem superfície =
0" vale para **controle**. Essa casa é um `<span aria-hidden>` decorativo.
Conferido no depois: os três controles da linha continuam com superfície e alvo
próprios — a coluna de texto (`min-height: 44px`, `:focus-visible`), o checkbox
de cobre (44×44, emoldurado, e a quina dele agora fecha) e o expansor de etapas
(44×44, emoldurado).

**O fallback mudou junto, e essa era a pergunta em aberto.** A linha sem
categoria mostrava o quadro de cobre **vazio** — que lia como "sem categoria"
justamente porque a moldura existia. Sem moldura, o quadro vazio vira **40px de
nada** no meio de uma tela de 412px: largura reservada para uma coisa que não
existe. Então a casa deixa de ser renderizada e **a linha começa no texto**. A
leitura passa a vir da ausência, e a linha ganha 50px de largura de nome — que
em PT-BR é o recurso mais escasso da tela. Está no screenshot: "Tarefa sem
categoria nenhuma" agora cabe inteira, sem reticências.

Emoji do sistema continua proibido nessa casa (era o gap mais gritante do tema
claro: duas eras gráficas na mesma linha).

O teste que travava o comportamento antigo foi reescrito para travar o novo
(`RitualPanel.render.test.tsx`): a casa **não existe** sem ícone, e quando
existe não tem borda nem `clip-path`.

**Fora de escopo, e proposital — quero confirmação:** `.sm-px-slot`, a moldura
de 44px do ícone de item na **Loja** e na **Biblioteca**, continua lá. O pedido
descreve a linha de ritual da Home, e na Loja a moldura tem outra função (é a
superfície de um card comprável, não um ícone decorativo solto). Se "item dentro
de box" é regra geral e não só a Home, é uma linha de CSS a mais — só não quis
decidir isso sozinho.

---

## 3. As quinas fecham

### Causa, confirmada no pixel

A pista estava certa e o diagnóstico se generalizou: **não é uma peça, são 21**.
Todo o kit é `border: Npx solid <cor>` + `clip-path` de octógono. A borda é
desenhada como **retângulo**; o clip corta as quatro quinas **por cima** dela.
Sobra um trilho de cobre que para a N px do canto e um chanfro descoberto.

Recorte ampliado do antes (DPR 8), cápsula VIDA/ENERGIA — dá para contar os
pixels do buraco entre a borda de cima e a da esquerda:
`E:/pw/shots/r4-antes-{light,dark}-quina-capsula.png`.

O painel de rituais tinha uma causa **diferente**, e a hipótese do "border-image
que não desenha" não se confirmou: a peça de canto desenha. O que estava errado
eram os dois números do 9-slice. Amostrando o pixel de `btn-lg.png` (borda de
cima): contorno escuro 0–11, cobre 12–29, contorno interno 30–39, **miolo teal
a partir de 40**.

- `slice: 43` metia 3px do miolo teal dentro da fatia da borda — vazava como um
  risco escuro dentro da moldura.
- O ladrilho de quina é `slice × slice` espremido em `--sm-px-bw`: 43px de arte
  em **10px** de tela colapsavam o chanfro do desenho num tarugo escuro de
  ~10px. É esse o "bloco escuro".

### O conserto

**Uma regra, no fim do `index.css`, para as 21 peças** ("RODADA 4 — A QUINA
FECHA"): em cada quina entra uma **banda de 45°** da mesma cor e da mesma
espessura da borda.

A geometria é exata, não é aproximação. Cada quina recebe um ladrilho de
`c × c` com um gradiente diagonal; num ladrilho **quadrado**, a posição 50% do
gradiente cai exatamente sobre a reta do chanfro, e as posições em px medem
distância **perpendicular** a ela — logo `50% → calc(50% + bw)` é uma banda de
espessura `bw` colada por dentro do chanfro. E ela encosta na borda reta: a
banda cobre `x + y ∈ [c, c+bw·√2]`, a borda de cima cobre
`y ≤ bw ∧ x + y ≥ c`, e as duas se sobrepõem a partir de `x = c − bw`. Sem
fresta, sem meia-quina, em qualquer tamanho de peça.

**Por que `background-image` e não um `::before`:** um pseudo-elemento exigiria
`position: relative` em 21 classes, e isso mudaria o bloco contenedor de
qualquer descendente absoluto que hoje se ancora num avô — regressão silenciosa,
do tipo que ninguém vê em review. Como camada de background, o `clip-path` da
própria peça já recorta a banda na diagonal certa: a geometria não fica
duplicada em dois lugares que podem divergir.

O painel: `slice 43 → 40` (a moldura tem 40px de arte) e `bw 10px → 14px` (o
ladrilho de quina passa a caber). Custo: +4px de moldura por lado. É o preço de
a peça de canto existir.

O checkbox fecha nos **dois** estados (cobre e teal-marcado) — é o controle mais
importante da Home.

### O footgun que isso cria, e a trava

Quem usa essas classes **não pode escrever `background:`** — o atalho zera
`background-image` e apaga as quinas. Isso já ia acontecendo em 6 lugares no
próprio CSS (`&:hover` de 5 peças e `&:disabled` do `.sm-px-jump`, que por terem
especificidade maior ganhariam da regra base) e em 9 `style` inline no TSX.
Todos convertidos para `background-color`. Onde o inline também repinta a
moldura (`borderColor`), passou a repintar a banda junto via `--sm-cham-line`
— senão a quina sairia cobre e a borda vermelha.

Isso não fica valendo por boa vontade: quatro asserções novas em
`src/index.css.contract.test.ts` travam, mecanicamente,

1. que a regra das bandas existe e cobre o kit (>15 classes);
2. que **nenhuma** peça com `clip-path` chanfrado ficou sem banda;
3. que o chanfro da banda (`--sm-cham-c`) é o **mesmo** do `clip-path`, peça por
   peça — se divergirem, a banda nasce fora da diagonal e fica um degrau;
4. que nenhuma variante usa o atalho `background:` numa peça com banda.

### Prova

Recorte ampliado (DPR 8), quina superior-esquerda, **antes → depois**:

| peça | antes | depois |
| --- | --- | --- |
| cápsula VIDA/ENERGIA | `r4-antes-{light,dark}-quina-capsula.png` | `q-depois-{light,dark}-capsula.png` |
| checkbox | `r4-antes-*-quina-checkbox.png` | `r4-depois-*-quina-checkbox.png` |
| painel de rituais | `q-antes-light-painel-topo.png` | `q-d2-{light,dark}-painel-topo.png` |

Nos dois temas, nas duas alturas. Conferido também em tela cheia, fora da Home:
abas, cards, slots, cápsulas, tags, chips e a placa da nav — Loja, Biblioteca,
Menu, Evolução, Atividades (`r4-depois-{light,dark}-*.png`). Todas fecham.

### Prova de rolagem

`r4-depois-{light,dark}-{915,700}-home-fim.png`: scroller no fim
(`rolouAteOFim: true`), pet no topo, lista passando por baixo. Nenhuma fresta.

---

## Screenshots

Todos em `E:/pw/shots/`.

- Home, antes: `r4-antes-{light,dark}-{915,700}-home.png` e `-home-fim.png`
- Home, depois: `r4-depois-{light,dark}-{915,700}-home.png` e `-home-fim.png`
- Quinas ampliadas: `r4-{antes,depois}-{light,dark}-quina-*.png`,
  `q-{antes,depois,d2}-{light,dark}-*.png`
- Outras telas, depois: `r4-depois-{light,dark}-{loja,biblioteca,menu,evolucao,atividades}.png`

## Arquivos tocados

- `src/index.css` — bandas de quina (21 peças), `.sm-pet-sticky`,
  `--sm-petstage-h`, `--sm-scroll-pt`, ícone de ritual sem moldura, aperto de
  linha em tela baixa, 6 atalhos `background:` → `background-color:`
- `src/components/CompanionHUD.tsx` — área fixa, janela do palco, Evoluir no rodapé
- `src/components/pixel/RitualPanel.tsx` — `RitualIcon` sem moldura e sem casa vazia
- `src/components/pixel/PixelKit.tsx` — fatia e largura do 9-slice do painel
- `src/App.tsx` — `--sm-scroll-pt`, `background` → `backgroundColor` + `--sm-cham-line`
- `src/components/{StepRow,ShopModal,DungeonGame,RPSGame,DinoGame,PlayerDetailModal}.tsx`
  — `background:` inline → `backgroundColor:` (e `--sm-cham-line` onde repinta a moldura)
- `src/index.css.contract.test.ts` — 4 travas novas da quina
- `src/components/pixel/RitualPanel.render.test.tsx` — testes do ícone sem moldura

## Em aberto para o dono

1. **≥3 unidades em 412×700**: sai da linha da marca no HUD ou do dock de chat?
   (números acima)
2. **`.sm-px-slot`**: "item dentro de box" vale só para a linha de ritual ou
   também para o ícone de item da Loja/Biblioteca?
