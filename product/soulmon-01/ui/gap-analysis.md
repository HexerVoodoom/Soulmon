# Gap Analysis — app atual × referências v1.2

> `design-critic`, feita **vendo** as imagens (`docs/ui-refs/REF-*.png`) contra os
> screenshots reais em `E:\pw\shots\`. Corrige a SPEC onde a descrição textual
> escondeu o que a imagem mostra.

## 0. Veredito

O app já acertou **paleta, moldura de cobre e nav em pixel-art** — a linguagem base
está lá. O que separa `kit-dark-10-home.png` da `REF-home.png` não é polimento: são
**quatro coisas estruturais** (densidade/composição da Home, tipografia, ícones
emoji, área do pet com asset sujo), mais **um buraco inteiro de telas nunca
tocadas** (loja, torneio, minijogos) ainda na estética anterior.

**Nenhuma delas depende de arte bloqueada. A arte não é o gargalo — a ligação é.**

## 1. O que já está BOM (não mexer)

| Elemento | Onde | Por quê |
|---|---|---|
| **Paleta** | global dark | Lado a lado com a REF, a cor **não é** o que denuncia a diferença. Encerrado. |
| **Moldura de card em cobre** | `kit-dark-11-home-cards.png` | Bisel com canto chanfrado, praticamente a moldura da REF. **Melhor item do app.** Não refazer em 9-slice por purismo. |
| **Nav inferior** | todas r3/kit | Ícones emoldurados reais, ativo com halo ciano. Único lugar que já consome `iconRegistry` — prova que o kit funciona. |
| **Chips `ENERGY`/`CREDITS`** | topo da Home | Cápsula de cobre + rótulo caixa-alta + número. Formalmente idêntico à REF. |
| **Evolução (grafo)** | `r3-dark-21` | Nós losangulares aceso/previsto/travado, linha pontilhada, grade de circuito. Leitura mais fiel do bloco SOUL LINK que existe — e resolveu em CSS o que a SPEC listou como "falta gerar". |
| **Glossário** | `r3-dark-31` | Título bitmap letterspaced + botão `FECHAR` emoldurado. |
| **Contraste corrigido** | global | Não regredir. |

## 2. Gap priorizado por impacto visual

**(A)** CSS/token hoje · **(B)** asset existente não ligado · **(C)** bloqueado em arte.

### G1 — A Home não tem a composição da referência · (A) · BLOQUEADOR
**Ref:** grafo à esquerda + card `DAILY RITUALS` com 3 linhas densas (ícone + nome +
subtítulo + barra segmentada + checkbox) e CTA largo. Tudo numa tela.
**App:** coluna única; o pet ocupa ~600px mortos no topo e cada tarefa é um card de
~200px com um checkbox, um emoji e um título. Três tarefas estouram a dobra e a
quarta é cortada pelo dock de chat. Zero barra de progresso na linha.
**Importa porque:** a REF comunica "seu ritual de hoje de relance"; o app comunica
"role para ver suas tarefas". Nenhuma moldura compensa densidade 3× menor.
**Fix:** linha de ritual de ~72px (ícone 40px, nome + subtítulo empilhados, barra
segmentada fina, checkbox 44×44 à direita), agrupadas num **único** `PixelPanel`
titulado.

### G2 — Ícones de conteúdo são emoji do sistema · (B) · BLOQUEADOR
💧📚🧘📖🦠 crus, renderizados pela fonte do SO. Em `kit-light-10-home.png` é
gritante: emoji Noto colorido sobre card branco ao lado de moldura de cobre pixelada
— duas eras gráficas na mesma linha. É o gap mais barato: `src/assets/soulmon/icons/`
tem ~60 ícones emoldurados, documentados como "soltos no bundle".
**Fix:** estender `iconRegistry` para categoria de tarefa/atividade, itens de loja e
cabeçalho de painel. Fallback = quadro de cobre vazio, **nunca** emoji.

### G3 — Área do pet: asset sujo shipado · (C parcial) · BLOQUEADOR
No berço há **xadrez de transparência assado nos pixels** em volta do cristal, mais
nuvem de pontilhado cinza envolvendo o pet. Em tema claro o xadrez brilha contra o mint.
**Importa porque:** é a definição de "protótipo" — derruba o acabamento percebido da
tela inteira.
**Fix:** regerar `nest-base.png` limpo — **único item C urgente**. Enquanto não
existir: **esconder** berço e halo. Pet sem berço é neutro; pet com xadrez é quebrado.

### G4 — Telas nunca tocadas na estética antiga · (A) · BLOQUEADOR
`64-torneio.png` é a prova: fundo mint, cards brancos com sombra suave, abas com
sublinhado, ícones em line-art vetorial, botão `120 BITS` pill verde. Mesma coisa em
`61-atividades`, `92-*`, `90-player-detail`.
**Importa porque:** coerência é multiplicativa. O usuário toca em "Loja" na terceira
sessão e o reskin perde credibilidade.
**Fix:** varredura de tokens. Zero arte nova. **Maior ganho por hora depois do G1.**

### G5 — Tipografia: bitmap só nos títulos · (A) · ALTO
`attr-dark.png` mistura **três** famílias na mesma tela.
**Fix:** dois níveis travados — **Silkscreen** = título, rótulo, número, botão, chip,
nav; **sans** = texto corrido acima de ~4 palavras. Eliminar o terceiro nível (mono).

### G6 — Barras lisas onde a ref é segmentada · (B) · MÉDIO
`PixelSegmentedBar` existe e está subutilizado; `progress/bar-*` existe em asset.
Barra segmentada é a assinatura do gênero v-pet.

### G7 — Corações de HP pretos · (A) · MÉDIO / a11y
Renderizam **pretos sólidos** representando HP *cheio*. **Verificar se é bug de
estado, não só de cor** — se cheio e vazio não se distinguem, a regra central fica
invisível.

### G8 — Forasteiros de outro design system · (A) · MÉDIO
FAB `+` teal circular com sombra (Material puro; a REF não tem FAB, tem CTA largo no
fim do painel) · dock de chat azul-marinho que **não muda no tema claro** · chips de
dia como pílulas sem moldura.

### G9 — Estados de botão invertidos no tema claro · (A) · MÉDIO
`attr-light.png`: a aba **inativa** parece a selecionada; em `attr-dark` inverte.
**Fix:** 4 estados em tokens, com o **preenchimento** carregando a seleção nos dois temas.

### G10 — Fundo de circuito ausente · (A) · BAIXO-MÉDIO
Custo quase zero, ganho de profundidade. Só depois de G1–G4.

### G11 — Moldura de cano + vinha · (C) · BAIXO — provavelmente NÃO fazer (ver N4)

### G12 — Os 6 PNGs em quarentena · (C) · BAIXO
Correto mantê-los desligados, e **não bloqueiam nada**: hover/active saem de CSS a
partir dos tokens (variante **aninhada**, footgun 1). Dívida de arte, não impedimento.

## 3. Resumo por categoria

- **(A) hoje, sem arte:** G1, G4, G5, G7, G8, G9, G10, G12 → **8 de 12.**
- **(B) asset existente não ligado:** G2, G6, `window-inventory-frame` sem consumidor.
- **(C) bloqueado:** G3 berço (**único urgente**), G11 (despriorizar), G12.

## 4. Onde a referência NÃO deve ser seguida

**N1 — Duas colunas.** Em 412px viram duas de ~190px. Coluna única em retrato; a
**densidade** do G1 é o alvo, não a geometria. Duas colunas só ≥768px.

**N2 — Bitmap em tudo.** Silkscreen não tem minúsculas reais nem acentuação
confortável, e caixa-alta lê ~15% mais devagar. Nomes de tarefa são escritos pelo
**usuário**, sem limite.

**N3 — Rótulos curtos em EN.** `DAILY RITUALS` → `RITUAIS DIÁRIOS` é ~25% mais longo.
Dimensionar containers pelo PT-BR; a linha precisa sobreviver a 40+ caracteres.

**N4 — Moldura de cano em volta da tela.** Ótima na splash. Numa tela rolável come
40–60px de cada lado (~25% da largura útil em 412px), briga com safe area do iOS e
gesto de voltar do Android, e **piora o G1**. Só splash e talvez modal — isso rebaixa
o 9-slice de "bloqueia o visual" para "enfeite opcional".

**N5 — O grifo cobre.** O pet é **gerado pelo usuário**: qualquer silhueta, qualquer
paleta. Por isso o berço (G3) importa mais do que parece — ele **normaliza** um asset
imprevisível.

**N6 — Escuro como único tema.** O cobre funciona sobre claro; o **neon ciano não**
(falha 4.5:1 sobre branco) e precisa escurecer como acento.

**N7 — `SOUL CRYSTAL` genérico.** Créditos = dinheiro real, e as três moedas já se
confundiram uma vez. O cristal pertence a **um** só.

**N8 — HP e XP simultâneos.** Empilhar 4 medidores porque a folha empilha é ruído.

## 5. Ordem de execução

1. **G3** esconder o berço sujo + pedir regeração · 2. **G1** linha compacta + painel
único · 3. **G2** ligar `iconRegistry` no conteúdo · 4. **G4** varredura de tokens ·
5. **G5+G8+G9** rodada de sistema · 6. **G7+G6** · 7. **G10** · 8. G11/G12
despriorizados **por decisão, não por bloqueio**.

## 6. Critério objetivo de "muito alinhado"

Seis portões binários, cada um verificável por outra pessoa a partir de screenshot.

**T1 — Teste dos 5 segundos, invertido.** REF-home e o screenshot lado a lado, 5s,
para quem não trabalhou na tela: *"o que é diferente?"* **Passa** se toda resposta for
de **conteúdo** (bicho, nomes, números). **Falha** se citarem moldura, botão, barra,
fonte, ícone, cor ou espaçamento. Portão soberano.

**T2 — Inventário de linguagem visual (automatizável sobre o DOM).** Famílias
tipográficas ≤2 · emojis do sistema em conteúdo = 0 · controles pílula/círculo = 0 ·
sombras Material = 0 · ícones sem moldura em conteúdo = 0.

**T3 — Higiene de asset (CI, bloqueante).** Nenhum PNG com xadrez assado, pixel fora
da paleta > 1%, ou 100% opaco onde deveria haver alfa. *(Já existe:
`src/assets/assets.contract.test.ts`.)*

**T4 — Densidade.** Unidades de ação primária acima da dobra em 412×915. REF ≈ 3 +
CTA. **Passa com ≥3.** Hoje: 1,5.

**T5 — Paridade de tema.** Nenhum elemento inverte hierarquia entre temas, nenhuma
ilha mantém a cor do outro tema, contraste 4.5:1/3:1. **Falha automática se o tema
claro não foi olhado.**

**T6 — Cobertura de tela (lista fechada).** Home · Atividades · Evolução ·
Estatísticas · Loja (5 abas) · Torneio · Masmorra · Dino · Configurações ·
Glossário/Guia · onboarding/ritual · modais. **É o portão que impede o G4 de se
repetir** — sem ele o loop pole a Home para sempre.

**Regra de parada:** T2–T6 passando em todas as telas de T6, e T1 passando na Home, na
Loja e em mais uma tela sorteada. Continuar depois disso é refinamento sem retorno — a
diferença que sobra é a que separa um app real de um mockup, e ela **deve** sobrar.

## 7. A correção mais alta em alavancagem

**Compactar a linha de ritual e agrupá-la num painel único (G1).** Cria o lugar
natural para o ícone emoldurado (G2), a barra segmentada (G6) e o checkbox de cobre, e
mata o FAB (G8) ao dar um fim de lista onde o CTA largo cabe. **Quatro gaps caem com
uma mudança de layout, sem um pixel de arte nova.**
