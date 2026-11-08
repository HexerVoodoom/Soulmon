# Design system do site do beta do Soulmon (v1, 05/11/2026)

O que vive no código. Tokens em [`site-beta/src/styles/tokens.css`](../../site-beta/src/styles/tokens.css) (prefixo `--sb-`). O porquê e o como usar estão no [DESIGN-GUIDE.md](DESIGN-GUIDE.md). Direção: [PLANO-DESIGN.md](PLANO-DESIGN.md). Regras do dono: [PLANO.md](PLANO.md) §16 a §18. Peças em arte: [ASSETS-CHATGPT.md](ASSETS-CHATGPT.md) e `site-beta/src/content/assets.json`.

**Precedência:** regra do dono (PLANO §18 > §17 > §16) > este documento > benchmark. Onde decido contra o benchmark, está escrito "contra o benchmark".

**Fonte de cor e tipo:** app Soulmon, `D:\Soulmon\repo\src\index.css`, blocos `[data-theme="dark"]` e `:root, [data-theme="light"]`. Nenhuma cor do site foi inventada: todas são valores `--sm2-*` do app, mais 3 de estado (erro) e os véus.

---

## 1. Identidade em uma linha

Turquesa escuro de fundo, cristal da alma com chama, cobre como moldura, circuito fino e folhinhas como ornamento, clima arcano de natureza e magia. **Nada de engrenagem, rebite, válvula, manômetro, correia: nada de steampunk.** Moldura em pixel art com texto limpo por cima (Rubik nos botões, Cinzel nos títulos). Pixel art só em escala inteira.

---

## 2. Cor

### 2.1 Superfícies escuras

| Token | Valor | Origem no app | Papel |
|---|---|---|---|
| `--sb-fundo` | `#071413` | `--sm2-viewport-bg` (escuro) | Página, véu, fundo do hero antes do mapa carregar |
| `--sb-fundo-2` | `#08191A` | `--sm2-bg` (escuro) | Painel calmo (seções 2, 7, 9) |
| `--sb-sup` | `#0F2A29` | `--sm2-surface` | Placa: miolo do 9-slice, campo, lista de tarefas |
| `--sb-sup-2` | `#163735` | `--sm2-surface-2` | Aba ativa, linha em foco, divisória do FAQ |
| `--sb-linha` | `#1E3F3C` | `--sm2-line` | Divisória de 1px entre tarefas |

### 2.2 Tintas e acentos (sobre escuro)

| Token | Valor | Papel | Proibido |
|---|---|---|---|
| `--sb-tx` | `#E9F5F2` | Título, corpo, texto de botão | |
| `--sb-tx-2` | `#9DBCB4` | Frase de apoio, resposta do FAQ, rótulo "HOJE" | Sobre arte com véu menor que `--sb-veu-texto` |
| `--sb-pri` | `#5FF3E0` | Link, foco, "Forma N de 5", check marcado, "Gameplay real" | Preencher área grande (é energia, não parede) |
| `--sb-pri-2` | `#29C9B8` | Borda de nó revelado, canal da barra cheia | Texto pequeno (use `--sb-pri`) |
| `--sb-sobre-pri` | `#04211F` | Texto sobre preenchimento turquesa | |
| `--sb-ouro` | `#EBBE84` | "MISSÃO 0/3", número grande, "Demonstração", fundo do número do medalhão | |
| `--sb-cobre` | `#D9A05B` | Contorno da caixinha de tarefa (igual ao app) | |
| `--sb-anel` | `#C68642` | Anel de cobre: aparelho, campo de e-mail, aba sem asset | Sobre `--sb-claro-*` (2,8:1, reprova) |
| `--sb-anel-fundo` | `#241507` | Aro interno do anel do aparelho | |
| `--sb-sobre-ouro` | `#1C1006` | Número dentro do medalhão | |
| `--sb-erro` / `--sb-erro-tx` / `--sb-erro-fundo` | `#FF8B8B` / `#FFC2B8` / `#2D1512` | Borda do campo inválido / texto / placa da mensagem | Vermelho para cobrar ou apressar |

### 2.3 Contraste calculado (WCAG 2.x, luminância relativa sRGB)

Luminâncias usadas: `#071413` 0,0059 · `#08191A` 0,0082 · `#0F2A29` 0,0192 · `#163735` 0,0316 · `#E9F5F2` 0,8904 · `#9DBCB4` 0,4643 · `#5FF3E0` 0,7192 · `#29C9B8` 0,4570 · `#EBBE84` 0,5615 · `#D9A05B` 0,4065 · `#C68642` 0,2945 · `#04211F` 0,0121 · `#FF8B8B` 0,4159.

| Tinta \ fundo | `--sb-fundo` | `--sb-fundo-2` | `--sb-sup` | `--sb-sup-2` |
|---|---|---|---|---|
| `--sb-tx` | **16,8** | 16,2 | 13,6 | 11,5 |
| `--sb-tx-2` | 9,2 | 8,8 | 7,4 | 6,3 |
| `--sb-pri` | 13,8 | 13,2 | 11,1 | 9,4 |
| `--sb-ouro` | 10,9 | 10,5 | 8,8 | 7,5 |
| `--sb-cobre` (não-texto) | 8,2 | | 6,6 | |
| `--sb-anel` (não-texto) | 6,2 | 5,9 | 5,0 | |
| `--sb-pri-2` (não-texto) | 9,1 | | 7,3 | |
| `--sb-erro` | 8,3 | | 6,7 | |

Pares de preenchimento: `--sb-sobre-pri` sobre `--sb-pri` **12,4** · `--sb-sobre-pri` sobre `--sb-ouro` 9,8 · `--sb-sobre-ouro` sobre `--sb-ouro` **10,9** · `--sb-erro-tx` sobre `--sb-erro-fundo` **11,1**.

**Regra:** todo par de texto ≥ 4,5:1, todo componente e anel de foco ≥ 3:1. Todos os pares acima passam AA; os de texto passam AAA (7:1), exceto `--sb-tx-2` sobre `--sb-sup-2` (6,3) e sobre `--sb-sup` (7,4, passa).

### 2.4 Véus sobre arte (mapa por trás do texto)

Calculado contra o **pior caso: um pixel branco** sob o véu (o Hall tem nuvens claras). Mistura sRGB do navegador.

| Token | Opacidade | Cor resultante sobre branco | O que pode ir por cima |
|---|---|---|---|
| `--sb-veu-titulo` | 0,72 | ≈ `#4C5655`, L 0,089 | `--sb-tx` **6,8:1**, `--sb-pri` 5,5:1. **Não:** `--sb-ouro` (4,4) nem `--sb-tx-2` (3,7) |
| `--sb-veu-texto` | 0,82 | ≈ `#343E3E`, L 0,045 | qualquer tinta clara: `--sb-tx` 9,9:1, `--sb-tx-2` **5,4:1**, `--sb-ouro` 6,4:1 |
| `--sb-veu-barra` | 0,94 | quase `--sb-fundo` | tudo |

O véu cobre **só** a área do texto mais 24px de folga (gradiente que chega a 0 em 64px), nunca a cena inteira. Medição obrigatória: amostrar o pixel renderizado (Playwright + Pillow) atrás de cada bloco de texto em 390 e 1440; o footgun 10 do app mostra que screenshot pequeno engana.

### 2.5 Superfície clara (APOSENTADA na v3.1, 06/11/2026)

**Não usar.** Como entrar voltou ao escuro (painel calmo `--sb-fundo-2` com os passos na moldura 9-slice `painel`, a mesma da ficha). O ritmo da página vem de **cena cheia x painel calmo**, sem superfície clara. Os tokens `--sb-claro-*` ficam no `tokens.css` só por compatibilidade; a tabela abaixo é histórica.


Derivada do tema claro do app. É a única seção clara (ritmo claro e escuro de Sea of Stars `d3`/`d4` e Stardew `d2`).

| Token | Valor | Origem | Papel | Contraste |
|---|---|---|---|---|
| `--sb-claro-fundo` | `#F1F7F5` | `--sm2-bg` claro | Fundo da seção | |
| `--sb-claro-sup` | `#FFFFFF` | `--sm2-surface` claro | Cartão do passo | |
| `--sb-claro-sup-2` | `#E9F2EF` | `--sm2-surface-2` claro | Faixa da regra das 50 | |
| `--sb-claro-linha` | `#DCE9E6` | `--sm2-line` claro | Divisória decorativa (1,2:1: nunca é a única pista) | |
| `--sb-claro-tx` | `#0E2422` | `--sm2-ink` claro | Título e corpo | **15,0** sobre fundo · 16,2 sobre branco · 14,2 sobre sup-2 |
| `--sb-claro-tx-2` | `#4E6B66` | `--sm2-muted` claro | Frase de apoio | 5,4 · 5,8 · 5,1 |
| `--sb-claro-pri` | `#0B6F68` | `--sm2-primary-ink` claro | Link, foco | 5,6 · 6,0 · 5,3 |
| `--sb-claro-ouro` | `#8A5A2B` | `--sm2-gold-ink` claro | Número "50", "7 dias", "14 dias" | 5,4 · 5,9 · 5,2 |
| `--sb-claro-anel` | `#B0722F` | `--sm2-viewport-ring` claro | Filete de cobre, borda de cartão | 3,7 (não-texto, passa 3:1) |

Luminâncias: `#F1F7F5` 0,918 · `#E9F2EF` 0,871 · `#0E2422` 0,0147 · `#4E6B66` 0,131 · `#0B6F68` 0,124 · `#8A5A2B` 0,129 · `#B0722F` 0,215.

As peças em arte (medalhão, botão 9-slice) continuam escuras sobre o claro: são objetos, como a madeira da placa do app, que tem o mesmo valor nos dois temas. O contorno escuro de 1px da arte garante a borda.

A classe `.sb-claro` troca `--sb-foco-cor` para `--sb-claro-pri` (anel de foco 5,6:1 sobre o fundo).

---

## 3. Tipografia

### 3.1 Famílias

| Token | Pilha | Uso | Nunca |
|---|---|---|---|
| `--sb-fonte-titulo` | Cinzel, Georgia, serif | H1, H2, H3, número grande, nome de criatura | Corpo, botão, rótulo, campo |
| `--sb-fonte-texto` | Rubik, Segoe UI, system-ui | Todo o resto, **inclusive botão** | |

Cinzel 400 a 900 e Rubik 300 a 900 já estão em `public/fonts/` com subsets latin e latin-ext, `font-display: swap`. **Silkscreen não entra no site:** no app ela vive só dentro do visor (manual 04 §4.2) e o benchmark mostra fonte pixel em parágrafo cansando (Balatro `d2`). Título em Cinzel é regra do dono, contra a observação do benchmark mobile (§6: versalete serifado quebra em 3 linhas a 390). A resposta é a regra de comprimento em 3.3, não trocar a fonte.

### 3.2 Escala fluida (valores medidos nos breakpoints)

| Token | clamp | 360 | 390 | 768 | 1024 | 1440 | Peso / entrelinha |
|---|---|---|---|---|---|---|---|
| `--sb-t-display` | `2rem, 1.2rem + 3.4vw, 4rem` | 32 | 32,5 | 45 | 54 | **64** | Cinzel 700 / 1,14 |
| `--sb-t-numero` | `3rem, 2rem + 5vw, 6rem` | 50 | 51,5 | 70 | 83 | **96** | Cinzel 700 / 1 |
| `--sb-t-h2` | `1.75rem, 1.25rem + 2.2vw, 3rem` | 28 | 28,6 | 37 | 42,5 | **48** | Cinzel 700 / 1,14 |
| `--sb-t-h3` | `1.25rem, 1.1rem + .6vw, 1.5rem` | 20 | 20 | 22 | 23,7 | **24** | Cinzel 700 / 1,2 |
| `--sb-t-lead` | `1.0625rem, 1rem + .3vw, 1.25rem` | 17 | 17,2 | 18,3 | 19,1 | **20** | Rubik 400 / 1,5 |
| `--sb-t-tarefa` | fixo | 17 | 17 | 17 | 17 | 17 | Rubik 500 / 1,25 |
| `--sb-t-botao` | fixo | 18 | 18 | 18 | 18 | 18 | Rubik 600 / 1 |
| `--sb-t-corpo` | fixo | 16 | 16 | 16 | 16 | 16 | Rubik 400 / 1,5 |
| `--sb-t-botao-p` | fixo | 16 | 16 | 16 | 16 | 16 | Rubik 600 / 1 |
| `--sb-t-rotulo` | fixo | 14 | 14 | 14 | 14 | 14 | Rubik 600, CAIXA ALTA, `letter-spacing: .12em` |
| `--sb-t-legal` | fixo | 14 | 14 | 14 | 14 | 14 | Rubik 400 / 1,45 |

**Mínimos:** 14px é o piso absoluto do site (o app tem 12; o site recebe tráfego pago com gente apressada e sol na tela, então sobe). Corpo de leitura 16px. Campo de formulário 17px (abaixo de 16 o iOS dá zoom). Texto em caixa alta só no rótulo de 14px, com espaçamento `.12em`. Título com `text-wrap: balance`. Número que muda usa `font-variant-numeric: tabular-nums`.

### 3.3 Regra de comprimento (decorre da regra do dono "título ≤ 6 palavras + 1 frase")

- H2: até 6 palavras **e** até 34 caracteres, para caber em 2 linhas a 390 (Cinzel 700 a 28,6px mede cerca de 20px por caractere; coluna útil de 350px). H2 em 3 linhas a 390 é defeito.
- H1: até 6 palavras; o H1 aprovado ("Criaturas que evoluem com suas tarefas.", 39 caracteres) ocupa 3 linhas a 390 e 2 a 1440. É o único título com 3 linhas permitidas.
- Frase única: até 90 caracteres, `max-width: var(--sb-medida-frase)` (34ch), 1 a 2 linhas.
- Exceções só no FAQ e na privacidade (`--sb-medida-texto`, 60ch).

---

## 4. Espaço, grade e layout de cena cheia

### 4.1 Espaço

Base 4. Degraus: `--sb-e-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 24 · `-6` 32 · `-7` 48 · `-8` 64 · `-9` 96 · `-10` 128. Nada fora da escada. Respiro vertical de painel calmo: `--sb-secao-y` = `clamp(64px, 4rem + 4vw, 128px)` (64 a 390, 106 a 1024, 128 a 1440).

Ritmo interno de seção: título → frase `--sb-e-3`; frase → conteúdo `--sb-e-6` (celular) / `--sb-e-7` (desktop); conteúdo → CTA `--sb-e-6`.

### 4.2 Breakpoints e grade

O CSS é escrito a partir de 360 (base) e sobe com `min-width`. O site.css atual usa 900px: **migrar para 1024px** junto com a reconstrução.

| Faixa | Colunas | Calha | Margem esq. (inclui a barra) | Margem dir. | Contêiner |
|---|---|---|---|---|---|
| 360 a 767 (referência 390) | 4 | 16 | 24 | 16 | fluido |
| 768 a 1023 | 8 | 24 | 48 | 32 | fluido |
| 1024 a 1439 | 12 | 24 | 64 | 40 | fluido |
| 1440+ | 12 | 32 | 64 | 40 | `max-width: 1200px`, centrado |

A margem esquerda é maior porque a barra lateral de cobre (§6.9) ocupa 12px em `left: 4px` no celular e 24px em `left: 20px` no desktop.

### 4.3 Cena cheia (seções 1, 3, 4, 5, 6, 8-faixa, 10)

```
<section class="cena" style="--foco-x: 50%; --foco-y: 38%">   isolation:isolate; min-height:100svh
  <picture class="cena-mapa">   position:absolute; inset:0; z-index:var(--sb-z-cena)
  <div class="cena-veu">        gradiente só atrás do bloco de texto
  <div class="cena-elenco">     criaturas, z-index:var(--sb-z-criatura), pés em --x/--y medidos
  <div class="cena-conteudo">   grade da §4.2, z-index:var(--sb-z-conteudo)
```

- **Celular (360 a 767):** os mapas são retrato (480 × 1067, razão 0,45) e a tela de 390 × 844 tem razão 0,46. O mapa entra **inteiro, sem corte**, com `object-fit: cover` e `object-position: 50% 50%` (cortes laterais de até 2%). Cumpre o "sem corte" do dono.
- **Desktop (1024+):** tela cheia de verdade, `object-fit: cover`, com `object-position: var(--foco-x) var(--foco-y)` medido por mapa para manter o ponto focal (ponte, prédio central) no terço direito. Isso corta o mapa em cima e embaixo. **Decisão contra a regra do dono "mapa sem corte" do §18 e a favor do PLANO-DESIGN §4 e do benchmark (11 de 18 abrem com cena cheia; hero desktop em tira é o defeito nº 1).** Vai como dúvida ao dono. Alternativa já desenhada, se ele vetar: mapa inteiro a 100svh de altura no terço direito, com o elenco ocupando os dois terços restantes (nunca fundo chapado).
- **Altura:** hero `min-height: 100svh` (celular) e `min(100svh, 900px)` (desktop). Demais cenas: `min-height: 100svh`, conteúdo centrado na vertical.
- **Fonte de imagem:** AVIF + WebP por `srcset` em 480, 960 e 1440 de largura. Mapa é ilustração gerada, sem grade de pixel verificada: **nunca ampliar acima de 1:1 do arquivo** (DPR incluso). A regra de escala inteira vale para sprite e peça de interface (§8), não para mapa.
- **Sem JS / movimento reduzido:** cada seção mostra o próprio mapa estático. Com JS: uma camada fixa troca o mapa por *crossfade* de `--sb-dur-cena` (480ms) quando a seção seguinte cruza 50% da tela; em movimento reduzido a troca é corte seco.
- **Painel calmo** (seções 2, 7, 9): `--sb-fundo-2`, sem mapa, `--sb-secao-y` de respiro. Alterna com cena cheia.

### 4.4 Mapa por seção

| Seção | Lugar | Arquivo | Foco desktop (--foco-x, --foco-y) a medir |
|---|---|---|---|
| 1 Hero | Exploração | `mapa/exploracao-*` | ponte e escada central |
| 2 O jogo na sua mão | painel calmo | | |
| 3 Faça a tarefa | Laboratório | `mapa/laboratorio-*` | árvore com redoma |
| 4 Seu Soulmon | Jogos | `mapa/jogos-*` | casa-cogumelo |
| 5 O universo | Hall | `mapa/hall-*` | palácio do céu (nuvens claras: véu 0,82 obrigatório) |
| 6 O que você faz | Arena | `mapa/arena-*` | arena central |
| 7 Abertura | painel calmo | | |
| 8 Como entrar | painel calmo escuro (v3.1) | | |
| 10 Entre no beta (v3.1) | Guilda inteira | `mapa/guilda-*`, `guilda-fecho-d` | praça do cristal |
| 9 Perguntas | painel calmo | | |
| 10 Entre no beta | Exploração (fecha o ciclo do hero) | `mapa/exploracao-*` | outro recorte: base com cachoeiras |

Fora: Mercado, Forja, mapa-múndi, tudo da DEMO.

---

## 5. Raio, elevação, camadas, movimento

### 5.1 Raio

`--sb-raio-0` (9-slice, campo, rótulo) · `--sb-raio-sm` 4px (caixinha de tarefa) · `--sb-raio-md` 12px (print pequeno sem moldura) · `--sb-raio-lg` 20px (casca) · `--sb-raio-aparelho` 40px e `--sb-raio-aparelho-tela` 28px. Peça em arte nunca recebe `border-radius`: o canto é da arte.

### 5.2 Elevação e brilho

| Token | Valor | Uso |
|---|---|---|
| `--sb-sombra-1` | `0 4px 0 rgba(0,0,0,.40)` | Ficha, painel e lista sobre cena |
| `--sb-sombra-2` | `0 8px 0 rgba(0,0,0,.45)` | Pop-up, moldura de aparelho |
| `--sb-sombra-pe` | `rgba(0,0,0,.35)` | Elipse dura sob criatura: largura 60% do sprite, altura 1 pixel de arte × 3 |
| `--sb-brilho-cristal` | `drop-shadow(0 0 4px rgba(95,243,224,.32))` | Cristal aceso, check marcado (= `--sm2-check-glow`) |
| `--sb-brilho-criatura` | igual | Só a criatura protagonista do hero e da ficha |

Sombra é dura (sem desfoque), como em pixel art. Desfoque só nos dois brilhos acima, de 4px. O site.css atual usa 6px a 55% na criatura do hero: **baixar para o token**.

### 5.3 Camadas (z-index)

`--sb-z-cena` −1 (dentro de seção isolada) · `--sb-z-conteudo` 1 · `--sb-z-criatura` 2 · `--sb-z-progresso` 10 · `--sb-z-topo` 30 · `--sb-z-cta` 40 · `--sb-z-pular` 50 · `--sb-z-dialogo` 100 (fallback; `<dialog>` vive na top layer). Nada fixo cobre conteúdo focado: `scroll-padding-top: 72px` (barra superior) e `scroll-padding-bottom: 112px` (CTA fixo) no `html`.

### 5.4 Movimento

| Token | Valor | Uso |
|---|---|---|
| `--sb-dur-toque` | 120ms | Hover, pressionado |
| `--sb-dur-entrada` | 200ms | CTA fixo entrando, pop-up abrindo, barra superior ganhando fundo |
| `--sb-dur-pagina` | 320ms | Troca de aba, troca de ficha |
| `--sb-dur-cena` | 480ms | Crossfade de mapa entre seções |
| `--sb-dur-flutua` | 1600ms | Flutuação do elenco, `steps(2, end)`, `translateY(calc(-1 * var(--sb-passo-flutua)))` |
| `--sb-dur-carrega` | 900ms | 3 cristais no botão carregando, `steps(3, end)` |
| `--sb-ease` | `cubic-bezier(.2,0,0,1)` | Única curva (a do app) |
| `--sb-ease-linear` | `linear` | Só o que segue a rolagem |

Regras:
1. **Pixel se move por pixel inteiro.** Sprite desloca em múltiplos do tamanho do pixel de arte na escala atual (4px a 4x, 3px a 3x) e sempre com `steps()`. Deslizar subpixel borra pixel art (manual 04 §6.3).
2. **Movimento reduzido** (`prefers-reduced-motion: reduce`) zera todas as durações pelo bloco do `tokens.css`, e além disso: elenco parado; parallax desligado (camadas em `transform: none`); demo do ciclo sem *pin* (empilhada, os 5 estágios visíveis); cenário troca por corte; vídeo não toca sozinho; barra lateral ainda enche (é estado, não enfeite), sem transição; carrossel sem rolagem suave. **Reduz o movimento, nunca a pausa nem a informação:** o pop-up espera o gesto do mesmo jeito.
3. **Nada se move sozinho por mais de 5s sem controle** (WCAG 2.2.2): o loop de gameplay tem botão de pausa visível; a flutuação é de 4px e para em movimento reduzido.
4. **Parallax** com 3 planos no máximo (mapa 0,3×, elenco 0,6×, conteúdo 1×), só com `transform`, só ≥ 768px e só se o aparelho não sinalizar `Save-Data`.

---

## 6. Componentes

Formato de cada um: **anatomia · tamanhos · estados · tokens · a11y**. Estados não listados não existem para aquele componente (dito explicitamente). Peças marcadas *asset* vêm de `assets.json`; hover, foco e pressionado são CSS sobre o mesmo arquivo, nunca asset novo.

### 6.1 Barra superior fixa

- **Anatomia:** `<header>` com logo pequeno (link para o topo) · espaço · troca de idioma ("English" / "Português") · botão compacto "Entrar no beta" (só ≥ 1024). Link "Pular para o conteúdo" antes dela.
- **Tamanhos:** altura 56px (< 1024) e 64px (≥ 1024). Logo `logo-160` a 40px de altura (< 1024) e 48px (≥ 1024). Margens da grade §4.2.
- **Estados:**
  - *Sobre o hero:* fundo transparente, sem logo pequeno (o logo grande do hero está visível), sem CTA compacto.
  - *Rolada* (hero fora da tela em 80%): fundo `--sb-veu-barra`, filete inferior 1px `--sb-linha`, logo pequeno entra; ≥ 1024 o CTA compacto entra quando o CTA do hero sai da tela (IntersectionObserver). Transição `--sb-dur-entrada`.
  - *Dentro da seção 10 (formulário visível):* CTA compacto some (o formulário é o CTA).
  - *Foco:* anel `--sb-foco-cor` de 3px em cada link; a barra nunca cobre o elemento focado (scroll-padding).
  - Sem estado de erro, carregando ou desabilitado.
- **Tokens:** `--sb-z-topo`, `--sb-veu-barra`, `--sb-linha`, `--sb-t-corpo` (idioma, Rubik 500).
- **A11y:** `<header>` com `<nav aria-label="Principal">` só se houver links de seção (v1 não tem). Idioma com `lang` e `hreflang` no link ("English" com `lang="en"`). Alvo mínimo 44 × 44. Não esconder a barra ao rolar para baixo (contra o padrão Duolingo de encolher: a barra já é baixa e o CTA mora nela).
- **Origem:** CTA persistente em Eastward `d1`→`d5`, Duolingo `m2`, Forest; contraexemplo Ori `d2` (nav sobre texto).

### 6.2 Botão 9-slice (primário, contorno, compacto)

- **Anatomia:** `<a>` ou `<button>` com `border-image` do asset `botao` (`/site/botao.webp`, grade lógica 120 × 40, fatias `14 16`) + texto Rubik centrado. Ornamento (cristal e folhinha) só nas pontas; meio plano esticável.
- **Variantes e tamanhos** (escala sempre inteira da grade 120 × 40):

| Variante | Escala | Altura | `border-width` | Largura | Texto | `border-image-slice` |
|---|---|---|---|---|---|---|
| Primário grande | 3x | 120px | `42px 48px` | 100% (celular), 360px (desktop) | `--sb-t-botao` 600 `--sb-tx` | `14 16 fill` |
| Primário | 2x | 80px | `28px 32px` | mín. 240px | `--sb-t-botao` 600 | `14 16 fill` |
| Contorno | 2x | 80px | `28px 32px` | mín. 240px | `--sb-t-botao` 600 `--sb-pri` | `14 16` (sem `fill`: miolo transparente) |
| Compacto | 1x | 40px visual, alvo 48px | `14px 16px` | mín. 160px | `--sb-t-botao-p` 600 | `14 16 fill` |

  O compacto ganha alvo de 48px com `::before { inset: -4px 0 }`. O primário grande só no hero (celular) e na seção 10; nunca dois primários na mesma tela.
- **Estados:**

| Estado | Regra |
|---|---|
| Normal | Como acima, `image-rendering: pixelated` só na moldura (o texto fica liso) |
| Hover | `filter: brightness(1.15)` em `--sb-dur-toque` |
| Foco | `outline: 3px solid var(--sb-foco-cor); outline-offset: 4px` (fora da moldura, nunca dentro da arte) |
| Pressionado | `transform: translateY(var(--px))` com `--px` = 1 pixel de arte (2px a 2x, 3px a 3x, 1px a 1x) + `brightness(.92)` |
| Desabilitado | `aria-disabled="true"`, `filter: grayscale(.6) brightness(.7)`, texto `--sb-tx-2`, `cursor: not-allowed`. Usado só quando `LEVA_ESTADO` impede ação, nunca para "campo vazio" |
| Carregando | `aria-busy="true"`, texto troca para "Enviando…" / "Sending…", 3 cristais de 8px à direita acendem em `steps(3)` por `--sb-dur-carrega`; largura travada (não pula). Movimento reduzido: só o texto. Segundo clique ignorado |
| Erro | O botão **não** muda. Erro vai para o campo (§6.18) e o foco volta ao campo |

- **Tokens:** `--sb-sup` (fundo de segurança antes do asset), `--sb-anel` (borda de 2px se o asset não carregar), `--sb-tx`, `--sb-pri`.
- **A11y:** texto real sempre (nunca na arte). Rótulo único por destino: "Entrar no beta" leva ao formulário (#inscrever), "Ver o jogo" à seção 2. Contraste do texto sobre a placa `#0F2A29`: 13,6:1; contorno, `--sb-pri` sobre a cena com véu ≥ 0,72: 5,5:1 ou mais.

### 6.3 CTA fixo móvel

- **Anatomia:** faixa `position: fixed; bottom: 0` com um botão primário 2x de largura total.
- **Tamanhos:** < 1024 apenas. Padding `8px 16px calc(8px + env(safe-area-inset-bottom)) var(--sb-margem-esq)`. Altura total 96px + safe area. `body` reserva `padding-bottom: 104px`.
- **Estados:** *oculto* enquanto o CTA do hero estiver visível · *entra* (translateY de 100% a 0 em `--sb-dur-entrada`) quando o CTA do hero sai · *oculto* quando a seção 10 ou o campo de e-mail estiverem visíveis, quando o pop-up estiver aberto e quando o teclado virtual abrir (`visualViewport.height` cai mais de 25%) · com `LEVA_ESTADO=espera` o texto vira "Entrar na lista" / "Join the waitlist". Sem desabilitado, carregando ou erro (ele só rola até o formulário e foca o campo).
- **Tokens:** `--sb-z-cta`, `--sb-veu-barra`, filete superior 1px `--sb-linha`.
- **A11y:** é um link `href="#inscrever"`; ao ativar, foca o campo de e-mail. Quando oculto, `hidden` (sai da ordem de tabulação), não só `opacity: 0`.
- **Origem:** Eastward `m1`, Duolingo `m2`, Palworld `m1`; contraexemplo Palworld `d3` (botão flutuante sobre título): por isso a reserva de 104px.

### 6.4 Hero de cena cheia com elenco

- **Anatomia:** cena Exploração (§4.3) · logo completo grande no canto superior esquerdo · H1 · linha de vagas com "50" em número grande · CTA primário · CTA contorno "Ver o jogo" · linha "Android, pela Google Play" · elenco de 5 a 7 criaturas pisando no cenário.
- **Tamanhos:**

| | 390 | 1440 |
|---|---|---|
| Logo completo | 200px de largura | 360px de largura |
| H1 | `--sb-t-display` (32,5), máx. 3 linhas, 14ch | 64px, máx. 2 linhas, 15ch |
| "50 vagas" | "50" em `--sb-t-h2` Cinzel `--sb-ouro` + "vagas no beta" Rubik 17 | "50" em 48px |
| CTA | primário grande 3x, 100% | primário 2x 360px + contorno 2x 240px lado a lado, 16px de calha |
| Elenco | 1 protagonista 3x (192px) + 2 a 1x (64px) mais ao fundo | 1 protagonista 4x (256px) + 2 a 3x (192px) + 3 a 2x (128px) |
| Bloco de texto | coluna inteira, véu 0,72 atrás do H1 | colunas 1 a 6, véu 0,72; mapa e elenco nas colunas 7 a 12 |

- **Estados:** *carregando:* `--sb-fundo` + H1 + CTA já pintados (o mapa é a imagem LCP, `fetchpriority="high"`; o elenco carrega depois, `loading="lazy"`, fora do LCP); *sem JS:* igual, sem flutuação; *mapa falhou:* `--sb-fundo` com o elenco sobre a elipse de sombra (ainda é uma cena); *lista de espera:* linha de vagas troca para "Vagas desta rodada preenchidas. Entre na lista." e o CTA para "Entrar na lista"; *movimento reduzido:* elenco parado.
- **Tokens:** `--sb-veu-titulo`, `--sb-t-display`, `--sb-ouro`, `--sb-z-criatura`, `--sb-sombra-pe`, `--sb-brilho-criatura`.
- **A11y:** logo `alt="Soulmon"`, H1 é o único `<h1>`. Elenco decorativo `alt=""` (a ficha da seção 4 nomeia as criaturas). Ordem de leitura: logo → H1 → vagas → CTA → "Ver o jogo". 1ª dobra do celular cabe em 390 × 664 (svh do Chrome Android com barra): logo 210 + H1 111 (3 linhas) + vagas 32 + elenco 160 visíveis (a protagonista de 192px fica à direita e sobe 32px ao lado da linha de vagas) + CTA 120 + linha 20 = 653. A 360 × 640 o logo cai para 160px (srcset `logo-320`) para caber.
- **Origem:** Ori `d1`, Hyperlight `d1`, Sea of Stars `d1` (cena cheia); Palworld `d1`, Cassette `d1` (elenco); Hyperlight `d1` e Coromon `d1` (par cheio + contorno); Eastward `m1` e Neko `m1` (1ª dobra de celular completa).

### 6.5 Moldura de aparelho (vídeo ou print)

- **Anatomia:** `<figure>` · casca escura com anel de cobre · tela com o vídeo ou print · rótulo (§6.22) acima, colado à casca · legenda opcional abaixo (1 frase).
- **Construção:** casca `--sb-fundo` com `border-radius: var(--sb-raio-aparelho)`, anel `box-shadow: 0 0 0 3px var(--sb-anel), 0 0 0 5px var(--sb-anel-fundo), var(--sb-sombra-2)`, bisel interno de 8px, tela com `--sb-raio-aparelho-tela` e proporção dos prints reais 1170 × 2532 (`aspect-ratio: 1170 / 2532`). Sem câmera, botões laterais ou entalhe desenhados (seria imitar um telefone específico).
- **Tamanhos:** 390: 240px de largura (62% da tela, legível sem zoom, Neko `m1` e Umamusume `m3`). 768: 280px. 1024+: 320px. Mini (cartão de recurso, §6.14): 200px.
- **Estados:**

| Estado | Regra |
|---|---|
| Normal (vídeo) | `<video muted playsinline loop preload="none" poster>`; toca quando 50% visível, pausa ao sair |
| Pausado | Botão de pausa/play 48 × 48 no canto inferior direito da tela, sempre visível em foco |
| Carregando | Mostra o poster; nunca tela preta |
| Erro de mídia | Poster + texto "O vídeo não carregou." / "The video didn't load." + link para o arquivo |
| Movimento reduzido | Não toca sozinho; play manual |
| Print | `<img>` com `alt` descritivo; sem estado de reprodução |
| Sem mídia em `midia.json` | A seção **não aparece** e a Fatia 1 não publica (PLANO §17) |

- **A11y:** vídeo sem áudio (loop) não precisa de legenda; vídeo com áudio (cinemática) precisa de `<track kind="captions">`. Botão de pausa com `aria-label` "Pausar vídeo" / "Pause video" que troca com o estado.

### 6.6 Passo do loop

- **Anatomia:** 3 passos em sequência, a **mesma criatura** mudando de estado: (1) tarefa marcada ao lado da criatura em repouso, (2) a energia enchendo, (3) a nova forma. Cada passo: sprite 64 × 64 de arte · título de 3 a 5 palavras (`--sb-t-h3`) · 1 linha (`--sb-t-corpo`, `--sb-tx-2`). Entre passos, o asset `seta` (girado em múltiplos de 90°).
- **Tamanhos:** 390: empilhados, sprite 2x (128px), seta girada 90° a 1x (48 × 31). 1440: 3 colunas de 4 colunas da grade, sprite 3x (192px), seta a 1x horizontal.
- **Estados:** normal; *ativo* (quando a demo da seção 3 chega no passo: título `--sb-pri`); movimento reduzido mostra os 3 lado a lado sem transição. Sem hover, desabilitado, carregando ou erro (não é interativo).
- **A11y:** `<ol>`; a seta é `aria-hidden`. Texto do passo não depende da imagem.
- **Origem:** Forest `m2` (mesma árvore em 3 estados), Habitica `d2` (causa → efeito).

### 6.7 Lista de tarefas estilo jogo

Réplica da lista real da Home (`print-home-pt.png`, medido a 390 CSS px).

- **Anatomia:** cabeçalho com rótulo "HOJE" (`--sb-tx-2`) + "MISSÃO 0/3" (`--sb-ouro`), ambos `--sb-t-rotulo` 600 caixa alta `.12em` · subtítulo "HÁBITOS" no mesmo estilo · linhas: caixinha + nome da tarefa · divisória 1px `--sb-linha` entre linhas (não antes da primeira).
- **Medidas:** recuo lateral da lista 28px · linha de 56px de altura · caixinha 24 × 24, borda 2px `--sb-cobre`, `--sb-raio-sm`, fundo `--sb-fundo` · alvo de toque 44 × 44 em volta da caixinha · 16px da caixinha ao texto · nome `--sb-t-tarefa` (17px) Rubik 500 `--sb-tx`. Painel `--sb-sup` com `--sb-sombra-1` quando sobre cena. Largura 320px (390) e 360px (desktop).
- **Estados por linha:**

| Estado | Regra |
|---|---|
| Aberta | Caixinha vazia |
| Hover (desktop) | Linha `--sb-sup-2` |
| Foco | Anel 3px `--sb-foco-cor` na caixinha (offset 3px) |
| Pressionado | Caixinha `brightness(.9)` |
| Marcada | Check `--sb-pri` com `--sb-brilho-cristal`; nome passa a `--sb-tx-2` (sem riscar: o app não risca) |
| Desabilitada | Linhas futuras da demo antes da hora: `aria-disabled="true"`, sem mudança visual além do cursor |
| Carregando, erro | Não existem (é demonstração local) |

  Cabeçalho: "MISSÃO 0/3" conta com `tabular-nums` e atualiza em `aria-live="polite"`.
- **A11y:** cada linha é `role="checkbox"` com `aria-checked` e nome acessível = nome da tarefa (ou `<input type="checkbox">` nativo estilizado, preferido). Espaço marca. O rótulo "Demonstração" (§6.22) fica sobre a lista, não no rodapé.
- **Diferença do site atual:** o título da lista hoje é Cinzel; no jogo é rótulo Rubik espaçado. Segue o jogo.

### 6.8 Disco

- **Anatomia:** asset `disco` (grade 240 × 109) · sprite da criatura pisando no centro · cristal (3 estados) cravado na borda da frente · clarão turquesa na evolução.
- **Tamanhos:** disco 1x (240px) com sprite 2x (128px) a 390; disco 2x (480px) com sprite 4x (256px) ≥ 1024. Sempre sprite = 2 × escala do disco. Pés do sprite a 22% da base do disco; sprite centrado em 23,33% da esquerda (medido).
- **Estados:** repouso; *acendendo* (cristal `acendendo`); *evoluindo* (clarão `--sb-pri` em `mix-blend-mode: screen` por 320ms, depois troca de sprite por corte); *movimento reduzido:* troca de sprite sem clarão. Sem hover, foco ou erro (não interativo).
- **A11y:** sprite com `alt` = "Forma 3 de 5: <nome>" e região `aria-live="polite"` anunciando a troca de forma.

### 6.9 Barra de progresso lateral

- **Anatomia:** capa superior (`barraCapa`, espelhada) · trilho (`barraCorpo` repetido em Y) · enchimento (`barraCheio`, mesmo desenho pixel a pixel, recortado por `scaleY`) · capa inferior · 5 nós (um por seção-chave: hero, faça a tarefa, seu Soulmon, como entrar, entre no beta).
- **Tamanhos:** grade lógica 12 de largura. < 1024: 1x, 12px, `left: 4px`. ≥ 1024: 2x, 24px, `left: 20px`. Altura da janela.
- **Nós:** o cristal atual (48 × 96 de grade) não cabe numa barra de 12 a 24px sem escala fracionária. **Até existir o asset `cristal-no` (12 × 16 de grade, a pedir no ASSETS-CHATGPT), o nó é a `barraCapa` na escala da barra**, apagada (`brightness(.6)`) ou acesa (normal + `--sb-brilho-cristal`).
- **Estados:** enche de 0 a 100% conforme a rolagem do documento (linear, sem transição); nó acende quando a seção dele cruza o meio da tela. Movimento reduzido: igual (estado, não animação). Sem JS: trilho vazio, sem nós. Sem hover, foco, erro.
- **A11y:** `aria-hidden="true"` e `pointer-events: none`. Não é navegação (não é focável). O benchmark aponta que ela compete com o conteúdo e não tem equivalente em 18 sites: fica porque o dono aprovou ("barra lateral em asset", §18), mas a margem esquerda da grade a reserva para nunca encostar em texto.

### 6.10 Ficha de criatura com setas

- **Anatomia:** painel 9-slice (`painel`) · sprite grande sobre a elipse de sombra · nome (`--sb-t-h3` Cinzel) · chips de elemento (§6.11) · 1 frase (`--sb-tx-2`) · setas anterior/próxima · contador "3 de 8".
- **Tamanhos:** 390: ficha com largura da coluna, sprite 3x (192px), setas 48 × 48 dos lados do sprite. 1440: ficha de 480px nas colunas 7 a 12, sprite 4x (256px); à esquerda (colunas 1 a 6) o título da seção, o número grande e a árvore (§6.12).
- **Estados:**

| Estado | Regra |
|---|---|
| Normal | Uma criatura por vez |
| Troca | Sprite e textos trocam por corte; a ficha desliza 1 pixel de arte em `--sb-dur-pagina` |
| Seta hover | `brightness(1.15)` |
| Seta foco | anel 3px |
| Seta pressionada | 1 pixel de arte para baixo |
| Seta desabilitada | No primeiro e no último: `aria-disabled="true"`, `opacity: .4` (não dá a volta; dar a volta esconde onde termina) |
| Carregando | Silhueta (`brightness(0)`) do próximo sprite até a imagem chegar |
| Erro de imagem | Mantém a silhueta e o nome |

- **A11y:** `<section aria-roledescription="carrossel" aria-label="Criaturas">`, cada ficha `role="group" aria-roledescription="ficha" aria-label="3 de 8: <nome>"`. Setas `<button aria-label="Criatura anterior">`. Setas ← → funcionam quando o foco está dentro. Gesto de arrastar no celular, sempre com as setas como alternativa (WCAG 2.5.7). Troca anunciada por `aria-live="polite"` só no nome.
- **Conteúdo:** só `soulmon/novos/`; fora os 5 da DEMO (Crato, Brooka, Zefi, Oaken, Bolid) e o lagarto com chama na cauda.
- **Origem:** Cookie Run `m2`, AFK Journey `m2`, padrão mobile 13 (4 de 9 vitrines usam 1 por vez com setas).

### 6.11 Chip de elemento

- **Anatomia:** ícone do elemento (`el/<nome>.webp`) **pelado** + nome em Rubik. Sem caixa, sem placa: regra do app "ícone nunca dentro de box" (manual 04 §5.4).
- **Tamanhos:** ícone 32px + texto 16px 500, 8px entre eles; alvo 44px de altura quando interativo. Grande (aba Elementos): ícone 96px empilhado sobre o nome.
- **Estados:** normal (informativo, não interativo na ficha); na aba Elementos: *revelado* (ícone + nome) e *oculto* (ícone em `brightness(0)` + "?" em texto real 28px Rubik 700, nome "?" com `aria-label="Elemento ainda não revelado"`). Selecionado (filtro, se existir): sublinhado 3px `--sb-pri` (uma barra não é caixa). Hover: `brightness(1.15)`. Foco: anel 3px.
- **A11y:** o ícone tem `alt=""` porque o nome está ao lado.

### 6.12 Árvore de evolução

- **Anatomia:** 5 estágios de cima para baixo: 1 (rookie) → 3 caminhos (Poder, Harmonia, Benevolência) nos estágios 2, 3 e 4 → 1 (ultra). Um caminho revelado (linha planta), os outros em silhueta com "?". Células 9-slice (`celula`), setas (`seta`) girando 90°. Rótulo de linha à esquerda: "Forma 1 de 5" etc.
- **Tamanhos:** 390: células de 96px com sprite 1x (64px) e 16px de respiro; linha de 3 células = 3 × 96 + 2 × 12 = 312px. ≥ 1024: células de 144px com sprite 2x (128px).
- **Estados:** *revelado:* borda `--sb-pri-2` (2px por fora da célula), sprite colorido, nome embaixo; *oculto:* sprite `brightness(0)` com `drop-shadow(0 0 1px var(--sb-pri-2))` + "?" em Rubik 700 28px `--sb-tx`; *caminho ativo:* setas do caminho em brilho normal, das outras `brightness(.6)`. Não interativa na v1 (sem hover, foco ou erro).
- **A11y:** `<ol>` de estágios; cada estágio lista as formas; ocultas têm texto "Forma ainda não revelada". O nome dos caminhos só aparece como Poder/Harmonia/Benevolência (nunca os nomes vetados do app).

### 6.13 Abas e chips do Universo

- **Anatomia:** 4 abas pedidas pelo dono: Universo, Habitantes, Jogos, Elementos. Painel 9-slice abaixo.
- **Desktop (≥ 768):** `role="tablist"` com 4 abas (asset `aba`, 9-slice, fatia 8, borda 8px a 1x) em linha sobre o painel, altura 48px, texto Rubik 16 500. Painel com grade: Universo 6 colunas (lugares com nome em Cinzel 16 sobre véu), Habitantes 6, Jogos 3, Elementos 6.
- **Celular (< 768):** as abas viram **chips em 2 linhas de 2** (Cookie Run quebra 3 + 2; nunca rolagem lateral de aba); o conteúdo de cada painel vira faixa deslizável com `scroll-snap-type: x mandatory`, cartão de 72% da largura (o próximo aparece cortado para dizer "tem mais").
- **Estados:** *selecionada:* filtro normal + sublinhado 3px `--sb-pri` + fundo `--sb-sup-2`; *não selecionada:* `brightness(.7)`; hover `brightness(1)`; foco: anel 3px com `outline-offset: -3px` (dentro da aba); pressionada: 1px para baixo; desabilitada: não existe. *Carregando:* células com silhueta. *Vazio:* não pode acontecer (cada aba tem conteúdo fixo).
- **Conteúdo:** primeira aba rica (é a que todos veem). Habitantes = NPCs reais do app; Jogos = atividades reais (lotes); Elementos = principais com nome e ícone grande, os demais com "?".
- **A11y:** padrão WAI-ARIA Tabs com ativação automática: ← → entre abas, Home/End, Tab entra no painel. Chips do celular usam o mesmo `tablist` (mudam só de forma). Faixa deslizável com botões anterior/próximo para teclado.
- **Contra o benchmark:** 0 de 18 sites de jogos escondem conteúdo central em abas. Ficam por decisão do dono (PLANO-DESIGN §6), com a primeira aba rica e cartões deslizáveis.

### 6.14 Cartão de recurso com tela real

- **Anatomia:** moldura de aparelho mini (§6.5, 200px) com print real · rótulo "Gameplay real" · título (`--sb-t-h3`, até 4 palavras) · 1 linha (`--sb-tx-2`).
- **Conteúdo v1:** 3 cartões: Home, Hall, Jogos (`print-home-*`, `print-hall-*`, `print-jogos-*`, no idioma da página).
- **Tamanhos:** 390: faixa deslizável, cartão de 260px com o aparelho centrado. ≥ 1024: 3 colunas de 4, cartão com painel `--sb-sup` e `--sb-sombra-1` sobre a Arena.
- **Estados:** normal; hover (desktop): aparelho sobe 4px (1 pixel de arte a 4x) em `--sb-dur-toque`; carregando: proporção reservada (`aspect-ratio`) com `--sb-sup`; erro de imagem: `alt` visível sobre `--sb-sup`. Não é link na v1 (sem foco).
- **Origem:** Sea of Stars `d3`, Cult of the Lamb `d3`, Monster Sanctuary `d3`; contraexemplo Animal Well `d3` (bullets).

### 6.15 Número grande

- **Anatomia:** número em `--sb-t-numero` Cinzel 700 `--sb-ouro` (`--sb-claro-ouro` no claro) + legenda curta Rubik 17 `--sb-tx` embaixo.
- **Conteúdo permitido (só número real):** "50 vagas", "20 elementos", "mais de 200 combinações", "5 formas". Proibido: nota, downloads, inscritos, contador dinâmico (PLANO §17: sem contador na v1).
- **Estados:** estático. Sem animação de contagem (contar de 0 a 200 seria mentir por 1 segundo).
- **A11y:** número e legenda num só elemento de texto ("20 elementos"), não separados por `aria-hidden`.
- **Origem:** Palworld `d2` (um número, uma imagem, uma promessa), Forest `m3`, Finch `m1`.

### 6.16 Medalhão de passo

- **Anatomia:** asset `passo-1/2/3` (moldura de cobre com ícone, sem número na arte) · número real em placa `--sb-ouro` 32 × 32 no canto superior esquerdo, Rubik 700 16 `--sb-sobre-ouro` (10,9:1) · título do passo Rubik 600 18 `--sb-claro-tx` · 1 linha `--sb-claro-tx-2`.
- **Tamanhos:** medalhão a 96px (390, com texto ao lado) e 192px (≥ 1024, texto embaixo, 3 colunas). **Atenção:** o asset está registrado com grade 192 × 192; 96px é meia escala. Antes de publicar, `preparar-assets` confere se a grade real é ≥ 2px por pixel de arte; se não for, reprocessar para grade 96 ou 48. Escala fracionária de pixel art é defeito.
- **Estados:** estático. Sem interação.
- **A11y:** `<ol>`; o número visual é `aria-hidden` porque o `<ol>` já numera. Medalhão `alt=""`.

### 6.17 FAQ

- **Anatomia:** `<details>` + `<summary>` nativos, coluna `--sb-medida-texto` (60ch). Pergunta Rubik 500 17 `--sb-tx`; resposta Rubik 400 16 `--sb-tx-2`, até 3 linhas a 390. Marcador: asset `seta` a 1x, girado 0° (fechado) e 90° (aberto).
- **Medidas:** `summary` mínimo 48px de altura, padding 12px 0; divisória 2px `--sb-sup-2`; resposta com recuo de 24px.
- **Estados:** fechado; aberto (seta 90°, transição `--sb-dur-toque`, zero em movimento reduzido); hover (pergunta `--sb-pri`); foco (anel 3px em volta do `summary`). Sem erro ou carregando.
- **A11y:** nativo, nada de ARIA extra. Uma pergunta aberta não fecha as outras. Conteúdo obrigatório: 14 dias de opt-in, 7 dias para aceitar, 50 vagas, Android apenas, 18+, privacidade.

### 6.18 Campo de e-mail

- **Anatomia:** rótulo visível acima · dica (`--sb-t-legal`, `--sb-tx-2`): "E-mail da conta Google usada na Play Store." / "Google Account email used for the Play Store." · `<input>` · mensagem de erro (abaixo, só quando houver) · honeypot oculto · Turnstile quando exigido.
- **Medidas:** input 52px de altura, padding 0 12px, `--sb-t-tarefa` (17px), fundo `--sb-sup`, borda 2px `--sb-anel`, raio 0. Largura `min(100%, 480px)`. Rótulo Rubik 500 16.
- **Estados:**

| Estado | Regra |
|---|---|
| Vazio | Sem placeholder (o rótulo e a dica já dizem) |
| Foco | Borda `--sb-pri` + anel 3px `--sb-foco-cor` |
| Preenchido | Igual ao vazio |
| Inválido (formato) | Borda `--sb-erro`, `aria-invalid="true"`, mensagem "Confira o e-mail: falta algo antes ou depois do @." / "Check the email: something is missing before or after the @." Valida no envio e depois a cada saída do campo, nunca a cada tecla |
| Vazio no envio | "Escreva seu e-mail para entrar." / "Type your email to join." |
| Já inscrito | **Não é erro:** mensagem informativa `--sb-pri` "Esse e-mail já está na fila. O convite chega nele." |
| Sem rede | Placa de erro: "Sem conexão. Seu e-mail não foi enviado; tente de novo." O e-mail digitado fica no campo |
| Limite (429) | "Muitas tentativas daqui. Tente de novo amanhã." |
| Verificação falhou (Turnstile) | "Não deu para confirmar que você é uma pessoa. Recarregue a página." |
| Servidor (5xx) | "Algo falhou do nosso lado. Tente de novo em alguns minutos." |
| Enviando | `readonly`, botão em carregando (§6.2) |
| Sucesso | Abre o pop-up (§6.19); o formulário é trocado pela linha "Inscrição recebida." |
| Lista de espera | Mesmo campo; o pop-up usa o texto da lista de espera |

- **A11y:** `type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false"`. Dica e erro ligados por `aria-describedby`. Erro com `role="alert"` só depois do envio. Foco volta ao campo no erro. A linha legal (18+ e privacidade) fica entre o campo e o botão, Rubik 14 `--sb-tx`.

### 6.19 Pop-up

- **Anatomia:** `<dialog>` modal com moldura 9-slice `popup` (grade 72, fatia 24, borda 24px) · cristal aceso pendurado no topo central (48 × 96 a 1x, metade para fora) · título Cinzel 24 `--sb-pri` · 1 a 2 frases · primário "Compartilhar" / "Share" · secundário (link) "Fechar" / "Close".
- **Medidas:** `width: min(calc(100vw - 32px), 440px)`, padding 24px (dentro da borda), `--sb-sombra-2`, backdrop `--sb-veu-dialogo`.
- **Textos** (PLANO §18): vagas abertas: "Parabéns, você se inscreveu no beta!" + "Seu e-mail foi cadastrado. Você receberá o link para fazer o download nos próximos dias.". Lista de espera: "As vagas desta rodada foram preenchidas. Teremos uma nova rodada e seu e-mail já está na fila. Obrigado por se interessar no Soulmon!" / "This round is full. Another round is coming and your email is already in line. Thanks for your interest in Soulmon!"
- **Estados:** *abrindo* (escala de 0,96 a 1 e opacidade em `--sb-dur-entrada`; nada em movimento reduzido); *compartilhar:* Web Share API; sem ela, copia o link e mostra "Link copiado." em `aria-live`; *falha ao copiar:* mostra o link selecionável; *fechando:* Esc, botão Fechar ou clique no backdrop. Sem estado de erro (só abre em sucesso).
- **A11y:** `showModal()`, `aria-labelledby` no título, foco inicial em "Compartilhar", foco volta à linha "Inscrição recebida." ao fechar. Não fecha sozinho. Termina em ação, não em "Fechar" (defeito 6 do diagnóstico).

### 6.20 Divisor de seção

- **Anatomia:** faixa horizontal de cano de cobre fino com o cristal com chama no centro e duas folhinhas. Asset **a gerar** (`divisor`, 3-slice horizontal: pontas planas repetíveis, centro com cristal; grade 96 × 12).
- **Uso:** só entre dois painéis calmos seguidos ou entre cena e painel calmo; entre duas cenas a própria troca de lugar divide. Escala 2x (24px de altura), centrado.
- **Até o asset existir:** nenhum divisor. É proibido desenhar cano ou cristal em CSS (PLANO §18: "sem CSS imitando asset").
- **A11y:** `role="presentation"`, `alt=""`. Nunca `<hr>` visível sem semântica.

### 6.21 Rodapé

- **Anatomia:** logo pequeno (`logo-160`, 48px) · links: Privacidade, contato (e-mail), idioma · "© 2026 Soulmon" · aviso "Soulmon é um jogo independente." (opcional, dono decide).
- **Medidas:** `--sb-fundo`, padding 32px 16px, 104px de padding inferior abaixo de 1024 (CTA fixo), 32px acima. Rubik 15 `--sb-tx-2` (9,2:1); links `--sb-pri` sublinhados, alvo 44px.
- **Estados:** link hover `--sb-tx`, foco anel 3px. Nada mais.

### 6.22 Rótulos de mídia: "Gameplay real", "Demonstração", "Cinemática"

- **Anatomia:** texto em caixa alta `--sb-t-rotulo` (14px, 600, `.12em`) sobre placa `--sb-rot-fundo`, padding 4px 8px, borda 1px na cor do texto, raio 0. **Só texto, sem ícone** (o ponto colorido seria ícone em caixa).
- **Variantes:**

| Rótulo PT / EN | Cor | Onde | Contraste sobre a placa |
|---|---|---|---|
| GAMEPLAY REAL / REAL GAMEPLAY | `--sb-pri` | Todo vídeo e print capturado do app | ≥ 13:1 |
| DEMONSTRAÇÃO / DEMO | `--sb-ouro` | Lista + disco da seção 3; com a frase "No jogo, evoluir leva dias." | ≥ 10:1 |
| CINEMÁTICA / CINEMATIC | `--sb-tx-2` | Vídeo de abertura | ≥ 8,8:1 |

- **Posição:** acima da mídia, alinhado à esquerda, colado (0 de distância) à moldura. Sempre visível, nunca só no hover.
- **Regra:** só captura real leva "Gameplay real". A demo interativa nunca. A abertura nunca.
- **A11y:** o rótulo é texto do `<figcaption>` (lido junto da mídia).

---

## 7. Peças em arte (estado em `assets.json`)

| Peça | Grade lógica | Escalas usadas | Estado |
|---|---|---|---|
| `botao` 9-slice | 120 × 40, fatia `14 16` | 1x, 2x, 3x | aguarda revisão |
| `popup` 9-slice | 72 × 72, fatia 24 | 1x | aguarda revisão |
| `painel` 9-slice | 48 × 48, fatia 16 | 1x | aguarda revisão |
| `aba`, `celula` 9-slice | 24 × 24, fatia 8 | 1x | aguarda revisão |
| `disco` | 240 × 109 | 1x, 2x | aguarda revisão |
| `barraCorpo` / `barraCheio` / `barraCapa` | 12 × 8 / 12 × 8 / 12 × 12 | 1x, 2x | aguarda revisão |
| `cristal*` (3 estados) | 48 × 96 | 1x | aguarda revisão |
| `passo1..3` | 192 × 192 (conferir) | 0,5x ⚠, 1x | aguarda revisão |
| `seta` | 48 × 31 | 1x | aguarda revisão |
| `logo` | 480 × 503 (ilustração) | srcset, nunca ampliar | aguarda revisão |
| Sprites `novos/` | 64 × 64 | 1x, 2x, 3x, 4x | final |
| **A gerar:** `cristal-no` | 12 × 16 | 1x, 2x | não existe |
| **A gerar:** `divisor` | 96 × 12, 3-slice | 2x | não existe |

---

## 8. Regras de pixel art (verificáveis)

1. Sprite e peça de interface: escala **inteira** da grade lógica (1x, 2x, 3x, 4x). Tamanho CSS = grade × N, sempre. Escala fracionária (inclusive para baixo) é defeito.
2. `image-rendering: pixelated` em sprite e moldura; **nunca** em texto, mapa ou logo.
3. Deslocamento em múltiplos de 1 pixel de arte, com `steps()`. Rotação só em múltiplos de 90°. Espelhar (`scaleX(-1)`) é permitido. Escala não uniforme, proibida.
4. Cor da arte não muda por CSS. Permitidos: `brightness()` (hover, inativo, silhueta com `brightness(0)`), `grayscale(.6)` (desabilitado) e os dois brilhos de 4px.
5. Texto nunca dentro da arte: rótulo, número, "?", "Forma N de 5" são texto real.
6. Asset em WebP sem perda no menor tamanho da grade; o navegador amplia por escala inteira.

---

## 9. Orçamento técnico que o sistema respeita

LCP mobile < 2,5s (imagem LCP = mapa do hero, AVIF 480/620, `fetchpriority="high"`; logo e botão são as únicas outras peças na disputa) · JS inicial < 90 KB · CLS < 0,1 (toda imagem e vídeo com `width`/`height` ou `aspect-ratio`; fontes com `size-adjust` se o swap mexer no H1) · Lighthouse acessibilidade ≥ 95 · funciona sem JS (seções empilhadas, mapas estáticos, formulário com POST nativo).

## 10. Changelog

- **v3.1, 06/11/2026:** superfície clara aposentada (§2.5); escala de pixel única por cena (hero 3x no celular, 4x no desktop); véu em degradê mascarado (sem borda dura); moldura `painel` em lista de tarefas, cartões e passos; setas do carrossel com placa escura; número grande com um padrão só ("20 elementos", "+200 combinações").
- **v1, 05/11/2026:** primeira versão. Tokens `--sb-*` com ponte para os nomes do `site.css`; breakpoint de desktop sai de 900 para 1024; título da lista de tarefas sai de Cinzel para rótulo Rubik (como no jogo); brilho da criatura cai de 6px/55% para 4px/32%; piso de texto 14px; superfície clara criada para "Como entrar".


## Selo "Gameplay real" e "Demonstração" (padrão único, v4)
- **Um selo "Gameplay real" por seção.** Seção com um aparelho de tela real (Faz a tarefa): o selo fica colado à moldura desse aparelho. Seção com vários aparelhos (O que você faz): um selo só, no cabeçalho da seção; os cartões não repetem o selo nem têm moldura própria.
- **Demonstração:** a lista tocável ao lado do aparelho usa o rótulo "Demonstração" colado à lista, com a frase "Toque para marcar". Nunca recebe o selo de gameplay real.
- Trailer e cinemática usam seus próprios rótulos ("Trailer", "Cinemática"), nunca "Gameplay real".
