# Decisões de wireframe — o que o dono respondeu antes do primeiro desenho

> **Dono:** `soulmon-design-lead` (registro) · decididas pelo **dono do produto** em 13/09/2026,
> em modal, uma a uma · **Estado:** vivo — recebe uma seção por fluxo a cada `decidir`
> **Verificação:** as 20 respostas abaixo casam 1:1 com as 11 dúvidas de
> [INVENTARIO-WIREFRAMES.md](INVENTARIO-WIREFRAMES.md) §3.2 e as 9 tensões de
> [PRINCIPIOS-DE-WIREFRAME.md](PRINCIPIOS-DE-WIREFRAME.md) §14. As cinco que reabrem decisão
> de produto estão também no [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §13.
> **Não cobre:** as decisões por fluxo (entra/volta/sai), que nascem a cada `decidir`.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Onde uma decisão abaixo
> reabre regra, o código ainda faz o antigo até alguém implementar — o wireframe desenha o
> NOVO e marca `[decisão 13/09]` no rodapé.

## 1. Estrutura dos canvases (dúvidas 1–3, 5, 9)

| # | Dúvida | Decisão | Consequência |
|---|---|---|---|
| D1 | Sub-aba do pet (`PetPage`, `DreamDex`, `AdventureDiary`) | **Canvas próprio "Pet"** | 11º canvas; desenhado logo após Rituais (P0+). `EVO-22`→`EVO-29` migram para `PET-*` |
| D2 | Biblioteca (social, coop, presentes) | **Canvas próprio "Social"** | 12º canvas; o `soulmon-guarda-linha-vermelha` dá parecer sobre ele inteiro. `CONTA-26`→`CONTA-32` migram para `SOC-*`; o caminho de chegada continua sendo o menu |
| D3 | Posição do Onboarding | **Dividido**: funil (identidade → free/pago → objetivo → escolher personagem) em **5º** (logo depois do canvas Pet, que a D1 acrescentou); ritual do Oráculo em **último** | Dois canvases: `onboarding-funil/` e `onboarding-oraculo/` |
| D5 | `ShopModal` variante sheet (sem `asPage`, sem caminho vivo) | **Registrar como achado, não desenhar** | `LOJA-12` → `fora`; item no STATUS como candidato a remoção |
| D9 | Offline | **Artboard offline nas quatro superfícies de rede** (Biblioteca, Torneio, chat, geração de sprite) | +4 artboards; o `OfflineSeal` continua na raiz |

Ordem final dos canvases: Home · Atividades · Rituais · **Pet** · Onboarding-funil · Evolução ·
Jogos · Loja · Estatísticas · **Social** · Conta · Fora do app · Onboarding-oráculo.

## 2. Conteúdo e estados (dúvidas 4, 6, 7, 8, 10, 11)

| # | Dúvida | Decisão | Consequência |
|---|---|---|---|
| D4 | Ramos de save antigo (`STAT-10`, `EVO-23`, `ONB-13`) | **Marcar `fora`; a conta vai ao STATUS** | Não se desenha. Apagar código continua decisão separada do dono |
| D6 | Seis superfícies sem descrição no manual (inclui o seletor de comida, P0) | **Medir no código antes de desenhar** | O cartógrafo acrescenta as subseções ao `03-FLUXO-DE-TELAS.md` §4 e troca `medição faltando` no inventário (rodada de 13/09/2026) |
| D7 | `reduced-motion` | **Artboard extra só onde a ESTRUTURA muda** (ex.: a intercalação de 3 s da evolução vira quadro estático); onde só desliga animação, nota no rodapé | |
| D8 | Idioma do artboard | **Inglês é a língua principal do wireframe** (é a base do produto — "inglês é a base, PT-BR é localização", `CLAUDE.md`). PT-BR vai como nota `PT: …` no rodapé; artboard extra só onde o comprimento muda a caixa (barra inferior, botões de largura fixa) | Corrige o handoff §5 e a regra W2 |
| D10 | Carga do dia (`isOvercommitted`) | **Linha no check-in + peça discreta no topo da lista** quando estourar; convite, sem vermelho | Aviso, nunca bloqueio (`02` §33) |
| D11 | As quatro divergências código × `CLAUDE.md` (loja 2 segmentos, `UnlockNudge` em 6 pontos, microfone vira "enviar", marco espera o gesto) | **Nenhuma reaberta: desenhar como o código faz** | O `CLAUDE.md` é corrigido pelo dono depois |

## 3. As nove tensões pesquisa × decisão (T1–T9)

Cinco foram **reabertas** pelo dono — são decisões de produto novas e estão no
`REGISTRO-DE-DECISOES.md` §13 com a alternativa que perdeu e o gatilho de revisão. Quatro
mantidas.

| # | Tema | Decisão do dono (13/09/2026) | Para o wireframe |
|---|---|---|---|
| T1 | Paywall no reveal | **REABERTA: oferta no reveal** | O reveal ganha a oferta — **dispensável pelo próprio card, largura parcial, container igual ao não-comercial, "agora não" com o peso do primário** (padrão Garmin, `PRINCIPIOS` §8). Sem tabela free × pago, sem preço riscado, sem contagem |
| T2 | Contador do dia no widget | **REABERTA: mostrar o contador** | O widget desenha "N de M" — **só quando ≥ 1 feita** e nunca com verbo de cobrança; a faixa de constância continua. Implementar exige mudar `widgetSemCobranca.contract.test.ts` e a linha do `CLAUDE.md` |
| T3 | "FOMO saudável" (live-ops rotativo) | **Segue a pesquisa** | Visita/conteúdo rotativo semanal **que aparece por tempo mas nunca tira o que já foi ganho** — a proibição #15 ("última chance", FOMO que tira) continua valendo na copy: nada de contagem regressiva nem "expira". Desenhar como ritual, não como tranca |
| T4 | Card compartilhável mensal | **REABERTA: card mensal também** | Dois gatilhos: evolução (existente) e mês fechado — ambos com **piso** (nenhum campo em zero) |
| T5 | Estoque de escudos | **REABERTA: visível sempre, inclusive zero** | Seção "o que você tem" na lista/estatísticas mostra os escudos como posse (leitura Yazio, `MOB §15.5`), zero incluído, **sem placar nem "faltam"** |
| T6 | Prestígio visual (D4: o que dói perder) | **Prestígio visível; escudo NÃO quebra a aura** | A aura de 28 dias (`steadyWindow`) aparece; dia protegido por escudo conta como feito. O que dói perder continua sendo só o coração (teto 1/dia) |
| T7 | Criatura do amigo no estágio real | **Mantido o veto (#21)** | Amigo aparece como é, sem escada nem rank ao lado do seu |
| T8 | Psicométrico invisível | **Mantido invisível** | Nome e descrição no reveal; nada de eixo nem "porque" |
| T9 | Valor antes de cadastro | **Mantido: conta primeiro, com o porquê visível** | A tela de conta desenha o valor (o que a conta guarda, a promessa) ANTES do campo, e o caminho "entrar depois" onde a regra permitir |

## 4. O que muda nos documentos por causa disto

- `HANDOFF-WIREFRAMES.md` §4 (ordem: +Pet, +Social, Onboarding em dois), §5 (inglês principal),
  §8 (as cinco reaberturas saem de "não se reabre").
- `INVENTARIO-WIREFRAMES.md`: `LOJA-12` e os três ramos de save → `fora`; ids `PET-*` e
  `SOC-*`; +4 artboards offline; as seis medições (rodada do cartógrafo).
- `PRINCIPIOS-DE-WIREFRAME.md` §14: coluna "decisão do dono 13/09" apontando para cá.
- `REGISTRO-DE-DECISOES.md` §13: as cinco reaberturas.
- `.claude/skills/squad-design/METODO.md` W2: inglês principal.

## 5. Home: entra / volta / sai (decisão do `soulmon-design-lead`, 13/09/2026)

> **Canvas:** [Soulmon — Wireframes Home](https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/home/` (`Main.dc.html` + 27
> `<TelaEstado>.dc.html` + `canvas.json`; 48 linhas `HOME-*` do inventário em 28 artboards).
> **Crítica:** `design-critic` (W1–W10, a11y — rodada 1: "não passa", 6 bloqueantes; rodada 2:
> ver o carimbo no `docs/STATUS.md`), `soulmon-product-designer` (IA/fluxo, com a dobra
> **medida**: "Daily rituals" nascia a 739px com o dock a 722), `soulmon-guarda-linha-vermelha`
> (família **APROVADA COM RESSALVA** — 1 veto cirúrgico, 4 ressalvas que viraram aceite).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. O código ainda faz o antigo;
> o wireframe desenha o novo e marca `[novo]`.

### 5.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| E1 | **Play vira a 5ª célula do deck** (`feed · items · bath · sleep · play`); o PlayCard sai da coluna; o custo viaja no desejo do balão ("Want to play for a bit? It costs 1 energy." `[novo]`); a recusa é fala do pet; célula inerte com `aria-disabled` quando `playedToday` | `02 §13` "Onde a UI mostra" já manda ("na área do pet, junto de banho/dormir/itens, porque é gesto de cuidado, não minijogo"); `PD §5` "cartões contextuais da Home: 1 por vez" (slot + PlayCard eram dois); **fecha a dobra** — "Daily rituals" volta à primeira tela (product-designer §1, medido) | O parágrafo de custo/prêmio antes do toque (mitigado pelo desejo) e o "+ one attribute point" (volta no resultado do minijogo); a linha do buff (`+20% Bits · N min · Data`) sai da Home e vai para o canvas **Jogos**, onde o buff é gasto |
| E2 | **Slot de avisos abaixo do pet** (topo → pet → slot), não acima | O pet é fixo (`.sm-pet-sticky`, `M-vinc §1`) e o cartão do dia não pode mudar a posição do pet nem rolar por cima dele; o slot vira o primeiro item do "que eu faço" (Finch, `MOB §15.1`); o FirstDayCard fica adjacente aos gestos que nomeia | O topo da tela para HP ≤ 1 e para o primeiro dia — HP baixo já está na pose e no medidor; o FirstDayCard continua na primeira tela (o palco tem 200px) |
| E3 | **Medidores dentro do palco** (`HomeHud hideBrand compact`), topo só com `<h1>` + selo do foco; escala **real** (rookie 3 HP / 4 energia; ultra 5/6); rótulo de texto `HP`/`EN` no lugar de glifo | É o que o código faz desde 27/08/2026 ("o dono achou os medidores grandes demais acima do pet", `App.tsx`) — a rodada 1 reproduzia a composição rejeitada; `02 §1`/`progression.ts` para a escala; orçamento de ícones do `PD §5` (moldura = HomeHud + cabeçalho + ações do pet; a BottomNav tem linha própria): deck 5 + chat 1 = 6, + Evolve = 7, teto 8 | Os 2 glifos do HUD; se o segmento vira coração/raio é decisão da **Fase 2** (visual-designer) |
| E4 | **Sombra de contato** elíptica sob o sprite | `M-vinc §4`: única invariante de presença ausente (Finch, Yazio, Abode, Tolan, BitePal) | Nada |
| E5 | **Piso ≥ 1 para todo dígito de "feito"** na Home: HUD sem dígito em zero, `x/y` do painel só com `x ≥ 1`, "not yet today" `[novo]` na linha do hábito | Guarda 8b (`PRINCÍPIOS §4` "qualquer zero exposto"; ledger E4/C-P2); é a **mesma régua** da decisão 13.2 do dono para o widget ("só com ≥ 1 feita") | Nada. **Distinção a escrever uma vez** (pedido do guarda): escudos (13.5) são **posse** — "o que você tem" pode mostrar zero; `N of M` é **dívida do dia** — não pode. Não colidem |
| E6 | **Copy nova** `[novo]`, quatro linhas: aviso de HP sem "— or a rub gives half a heart back"; priming com "One a day. You can turn it off in Settings."; recomeço "Postponed items start from zero. Your evolution, habit milestones and dream collection stay exactly as they are."; desejo de brincar com o custo | Guarda 1b (perdão que esvazia: dois caminhos no mesmo prato), 1d (`PRINCÍPIOS §3`: escopo + reversibilidade), 1e ("nagging" nomeia uma cobrança que o produto declara não ter); E1 | Nada de regra: as quatro mudam só superfície. Viram tarefa de copy do `staff-frontend` na implementação |
| E7 | **Regra única de "não dá agora" no deck** (rodada 3): **célula inerte** (`aria-disabled`, borda tracejada, rótulo diz o porquê `[novo]`) = a ação não existe agora por regra — Bath em cooldown, Play já usado hoje, Play antes da primeira conclusão (`!jaConcluiuAlgo`, o gate que o cartão já tinha); **célula viva + fala do pet** = a ação existe e a criatura recusa — barriga cheia, sem energia, HP cheio. Nunca toast para recusa de cuidado | Crítico r2 #2–#4: o deck tinha três respostas para "não dá agora"; `02 §13` ("a recusa não é erro vermelho: é uma frase do pet"); `PRINCÍPIOS §13` (toast só para transição de estado) | Os dois toasts 🎈 de `handlePlay` ("We already played today! More tomorrow." / "A snack first, then we play.") — a recusa muda de canal `[novo — estrutura]` |
| E8 | **`HomeRolado`** (lista sob o pet fixo) e a **fronteira do sticky** desenhada em todo artboard de tela cheia | Crítico #9 e product-designer: a interação central (BitePal, `M-vinc §1`) não aparecia; a lista ganha 356px (≈ 6 linhas) ao rolar | Nada |
| E9 | **Ordem de foco** numerada e única em todo artboard de tela cheia e em toda folha (× por último, Escape anotado); rótulos reais do chat ("Record message · Send message · Stop recording · Sending message…"); `aria-disabled` e `aria-valuenow/max` onde o estado existia só por cor | W10 é o único aceite executável; crítico #3, #6, #14, #16 | Nada |

### 5.2 Volta (a crítica pediu; o lead recusa ou adia, com motivo)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Restringir a pastinha (Items) aos itens especiais — hoje ela também alimenta comida comum, duplicando a folha Feed (W4 cruzado, product-designer §5) | **Decidido pelo dono (14/09/2026): pastinha só com especiais** → `REGISTRO` 13.6 | Era regra, não wireframe; o canvas Loja/Atividades desenha a pastinha sem comida comum; a Home fica como está (a folha Alimentar é a única porta da comida) |
| V2 | Calar o pulso de presença de 3 min (`getIdlePhrase`) | **Volta parcial**: o pulso fica, o léxico muda | `M-vinc §8` pede trocar a frase, não calar; sai só o léxico de cobrança (ver S4). A fome vira pose + o desejo único de `needsAttention` (`02 §13`) |
| V3 | Skeleton "em forma de página" (GoFundMe, `MOB §3`) | **Volta**: desenhado como o código (visor 56×40 + "LOADING") | D11 (desenhar como o código faz); a proposta vai ao `docs/STATUS.md` como dívida, não ao wireframe |
| V4 | Tirar o lápis da `RitualRow` (3 controles contra `PD §5` "1 selo + 1 checkbox + 2 metadados") | **Adiado → canvas Atividades** | A linha é átomo do fluxo Atividades (inventário §0: "a composição fica na página; o átomo fica no fluxo que o possui") |
| V5 | Palco ≤ 140px (crítico #1) | **Volta**: 200px | `STAGE_HEIGHT = 250` e `PET_BOX = 152` no código; 140 não comporta o sprite. A dobra fechou por E1 + E2, não por encolher o pet |
| V6 | Feed e Items inertes no dia 1 com `foodStock = 0` (product-designer #7; entrou na rodada 2) | **Volta** ao código (rodada 3) | Crítico r2 #4: `MOB §15.1` limita por **pose**, não por engenharia; a folha vazia é a superfície que ensina de onde vem a comida (`CompanionHUD.cta.test.tsx` exige que o vazio explique); duas regras para a mesma condição (dim no D1, folha vazia no D2+) seria pior que uma |
| V7 | Nível do Vínculo em dígito sob o nome (`02 §55` "nível e título") | **Volta**: só o título ("Companion") | Teto de 5 leituras (`PD §5.1`) e piso de dígitos; o nível continua na ficha do pet (canvas Pet). Reversível na Fase 2 |

### 5.3 Sai (o que a Home de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **EvoTrail** (trilha de estágios ao lado da lista) | Escada Rookie→Mega com o nível marcado fora da própria tela — altura, não galho (`PRINCÍPIOS §6`; `MOB §16.2`; `M-LV §2` E3); "Locked future form" é o vocabulário que §6 manda trocar por `???`; devolve 54px à lista; o destino (`setCurrentView('evolution')`) é a célula 3 da barra, a um toque. Guarda 7 e product-designer 2a concordam |
| S2 | **PlayCard** como cartão (título, parágrafo, botão, `aria-live`) | E1 |
| S3 | **Medidores acima do palco** | E3 (composição rejeitada em 27/08/2026) |
| S4 | **Léxico de cobrança da fala idle**: `companionNeedHelp` ("I need your help! Complete tasks to keep me healthy!"), "Feed me!", "Clean me!", "Let's keep going!" | `M-vinc §8`; `PRINCÍPIOS §1` proibido (fala idle que pede trabalho); guarda 2b APROVADO |
| S5 | **Dígito "(N)" do "Tidy the pile"** | **VETADO** pelo guarda (1c): `02 §34` — não mostra total de pendências no topo; o contador mostra o que JÁ foi decidido, dentro da folha. O botão fica |
| S6 | "— or a rub gives half a heart back" · "pending nagging is cleared" · vermelho `sm2-notice-warn` no aviso de HP | Guarda 1b, 1e; W6 |
| S7 | Balão idle na Home vazia e no dia 1; linha de Vínculo abaixo do nível 2 | `PRINCÍPIOS §1` (nunca frase que descreve estado; nunca `0/75` sob o nome); `bondTitle()` devolve `null` |

### 5.4 O que fica registrado para depois (não muda agora)

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (E1, E2, E7 entram; 13.6 pastinha só especiais; 13.7 posse × dívida). Registro do que foi apresentado: (1) E1, E2 e E7 são as mudanças estruturais da Home — a recomendação era aprovar as três; (2) V1 (pastinha só especiais?) é decisão de regra sua; (3) a distinção posse × dívida de E5 fica escrita aqui para não colidir com a 13.5.
- **Para o cartógrafo:** a condição de `HOME-08` está errada (`hideMeters` é fixo no topo desde 27/08; o toggle é `HOME-05`); "retorno após ausência" (`welcomeBackLine`) e "Home rolada" não têm linha — anotado no inventário §2.1.
- **Para o `docs/STATUS.md` (dívidas):** o `ScreenSkeleton` não tem a forma da página (V3); o `HomeHud` entrega a regra por `title=` (invisível no toque/teclado); "+10%" não existe — o código imprime `+20%` (`PLAY_BUFF_MULTIPLIER = 1.2`), e o número deve ser dado, nunca escrito à mão.
- **Para o `staff-frontend`, quando implementar:** a lista de S1–S7 e E1–E7 é o diff da Home; nenhum item muda regra de jogo (`02`); as copies `[novo]` passam pelo `soulmon-guarda-linha-vermelha` como critério de aceite (já dado neste parecer).
