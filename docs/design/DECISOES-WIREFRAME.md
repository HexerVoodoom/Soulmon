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

## 6. Atividades: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Atividades](https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1)
> (rodada 3 — carimbo do `design-critic` na rodada 2, ressalvas de amostra aplicadas) · arquivos em `docs/design/wireframes/atividades/` (`Main.dc.html` + 16
> `<TelaEstado>.dc.html` + `canvas.json`; 27 linhas `ATIV-*` em 17 artboards).
> **Crítica:** `design-critic` (rodada 1: "não passa", 9 bloqueantes — quase todos de fidelidade ao
> código; **rodada 2: CARIMBO passa**; rodada 3 aplicou as 7 ressalvas de amostra R1–R7), `soulmon-product-designer` (achado que
> mudou o canvas: o CTA da Home abre o `EditModal`, não o `CreateModal`; `handleAddNewTask` não
> tem chamador), `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA** — 3 vetos
> cirúrgicos, todos de copy/superfície).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. As regras fechadas na Home
> (§5: piso de dígitos, regra de canal, célula inerte × recusa do pet) valem aqui.

### 6.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| A1 | **Um só modal de criação**: o CTA "+ New Activity" abre o `CreateModal` (uma linha de captura + "More options" fechado, como o código já desenha); o `EditModal` só edita | Hoje o CTA abre o `EditModal` sem `initialData` ("`create_modal` só abre a partir da tela de evolução", `App.tsx`) e `handleAddNewTask` não tem chamador — tarefa avulsa na Home só nasce pela barra; dois modais de criação são W4 cruzado (product-designer §6) | O funil "home_edit × create_modal" (duas populações na telemetria) muda de nome; **ATIV-18** (teto do demo dentro do `EditModal`) perde o caminho vivo — vira achado no STATUS, como o `LOJA-12` |
| A2 | **Linha de hábito com dois metadados**: a janela de 7 e o glifo de maturidade (a aura de 28 dias é tratamento do glifo, não chip). "N of the last 7", escudos, legenda e "Nothing resets here" vão para a **ficha do hábito**, no topo do `EditModal` (1 toque no nome) | `PD §5` (1 selo + 1 checkbox + máx. 2 metadados, "verificável por teste de DOM"); `M-const §1` (aura "já vestida" no ícone); a dobra: 358px sob o pet fixo, linha de 77px → 60px = 6 hábitos em vez de 4 (product-designer §2) | O dígito de constância na Home (fica no `aria-label` da janela e na ficha) |
| A3 | **Tarefas concluídas hoje ficam no fim do painel**, riscadas e inertes, lidas de `completedTasks` | A regra `completeTask` (remove de `tasks`, alimenta meta/selo/relatório; 6 testes) **não muda**; muda a superfície: o mesmo gesto tinha dois comportamentos (hábito feito fica, tarefa feita some); Finch mantém como prova (`MOB §15.5`); Todoist mostra no fim; a pergunta da tela é "o que eu escolho fazer" — o restante vem primeiro | ~60px por tarefa feita; a linha é `aria-disabled` (não existe desconcluir — dar undo seria regra) |
| A4 | **Cabeçalho `feitos/total` sobre o dia devido**: o denominador exclui o hábito fora do dia; o numerador inclui as concluídas de hoje; dígito só com feitos ≥ 1 | Guarda 1a (hábito inerte no denominador é dívida que não dá para pagar hoje: "5/5" nunca fecha num dia de hábito leve); E5/13.7 (piso); o código hoje conta só `tasks` (a concluída sai da conta) — achado para o STATUS | Nada de regra: é o cálculo da UI |
| A5 | **Carga do dia = 7ª entrada da fila 2** (`… → recomeco → carga`), como texto `role="status"` sem moldura, só depois do check-in e só enquanto `plannedEffort > OVERCOMMIT_EFFORT` (estritamente maior) | D10 (decisão do dono) + W7 (superfície nova entra numa das duas filas, com posição declarada); `PRINCÍPIOS §2` (aviso de carga é texto); a moldura tracejada era o léxico de célula inerte (Home E7) | Quando HP ≤ 1 e carga coincidem, a carga vira "+1" — HP é mais urgente. `filaDeAvisos.contract.test.ts` ganha a 7ª chave (estrutura). **Dívida registrada:** a lista não tem gesto de "amanhã"; o convite aponta para editar "When I plan to do it" (não contado, `02 §30`), nunca um `postpone` contado (guarda 3) |
| A6 | **Escudos por hábito** (T5/13.5): na lista só `> 0` (como o código); **zero visível na ficha do hábito e em Estatísticas**, três casas de `REST_SHIELD_MAX`, casa vazia = losango vazado (nunca o glifo de "não devido"); frase única para os dois estados `[novo]`: "They arrive with steady weeks and step in on their own when a day slips." | `HabitRhythm.shields` é **por hábito** (`earnShield(rhythm)`) — uma linha agregada mentiria (product-designer §5); três contornos × N hábitos na Home leem "você não tem" 3N vezes (`HabitConstancy.tsx`); guarda 2e ("Spent automatically…" sob casas vazias diz que foram gastos) | O "sempre visível" do dono fica a um toque (ficha) e em Estatísticas — não na linha da Home |
| A7 | **Copy nova** `[novo]`: título do nudge do teto "Want a ceiling that grows with you?" (o código diz "Want to create without limits?" — **VETADO** pelo guarda 4b: o pago tem teto, `activityCapFor`); "M steps" no lugar de "0/M steps"; "done today" no subtítulo da concluída | Guarda 4b (precedente C-S1: o app mentindo na tela em que cobra); piso E5 | Nada de regra; lote WP5.9 |
| A8 | **Estado "0 das últimas 7" = silêncio** (janela + glifo, nenhuma frase) | Guarda 2a: "não uma frase de consolo, que seria cobrança com sorriso"; piso E5 | Nada |

### 6.2 Volta (a crítica pediu ou a rodada 1 tinha; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Confirmação de "Delete" que nomeia o que vai ("This habit is a Sapling — 30 days.") ou "Put aside" para hábito (guarda 4e) | **Decidido pelo dono (14/09/2026): confirmar nomeando o marco** → `REGISTRO` 13.8 | Era regra (apagar hábito com histórico apaga marco, `02 §28`); o wireframe desenha o Delete como o código (abaixo, quiet, separado do primário) |
| V2 | Copy da recusa da barra "That didn't fit — you've reached your item limit." → "free mode holds N active habits. One-off tasks still fit." (guarda 9a) | **Volta ao código no canvas; vira critério de aceite** | W2 (texto real); a alternativa está na nota do artboard para o `staff-frontend` |
| V3 | Passos aceitos no nudge: substituem a tarefa ou somam? (guarda 5) | **Decidido pelo dono (14/09/2026): somam à mesma tarefa** → `REGISTRO` 13.9 | Regra do `onDecompose`; sem zeramento novo |
| V4 | Recompensa material ao terminar a triagem ("terminar rende recompensa", `CLAUDE.md`) | **Sai** (guarda 6d: VETADO; não existe no código — divergência já registrada em `02 §34`) | #16/#19; a copy real "You decided on N items…" fica: N é decidido (feito ≥ 1) |
| V5 | Foco do dia (0/1/2/3) na lista (`PRINCÍPIOS §2` estados) | **Não desenhado** | `02 §32` "Onde a UI mostra" = check-in e selo do HUD; inventar seria funcionalidade sem regra — lacuna registrada |

### 6.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **O segundo modal de criação** (`EditModal` como criação) e, com ele, o teto do demo dentro do `EditModal` (ATIV-18) | A1; guarda 4d (trancar edição no teto seria paywall que interrompe fluxo — o código não tranca edição, `blocked = atCap && !initialData`) |
| S2 | **A linha agregada de escudos "para a lista inteira"** (rodada 1) e as casas vazias na linha da Home | A6 |
| S3 | **"N of the last 7" na linha** (vai para a ficha) | A2 |
| S4 | **"Want to create without limits?"** | A7 (veto 4b) |
| S5 | **A tarefa concluída que some da lista** (superfície; a regra fica) | A3 |
| S6 | **O cartão tracejado de carga do dia** (rodada 1) | A5 |
| S7 | O lápis — **não existe no código**; a rodada 1 o marcava como `[novo]` por engano (crítico B9). O nome da linha É o botão de editar | `RitualPanel.tsx`, decisão 5 do cabeçalho |

### 6.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (A1–A8 entram; 13.8 confirmar Excluir nomeando o marco; 13.9 passos do nudge somam). Registro do que foi apresentado: A1, A2, A3 e A5/A6 eram as mudanças estruturais — a recomendação era aprovar as cinco.
- **Para o cartógrafo:** `03 §4.5` está defasado em dois pontos (CTA → `CreateModal`; "toque no lápis"); `03 §4.1` diz "tarefas por `completed`" (concluídas nem estão em `tasks`); `ATIV-05` no inventário descreve a regra certa e a prova errada; `ATIV-18` deixa de ter caminho vivo.
- **Para o `docs/STATUS.md` (achados):** `feitos/total` cego às tarefas concluídas (`App.tsx`); `"0/3 steps"` impresso antes do primeiro passo (fura o piso); "Bring back" a 36px; "Want to create without limits?" (C-S1); `handleAddNewTask` sem chamador; o `CLAUDE.md` promete recompensa na triagem que o código não tem.
- **Para o `staff-frontend`:** A1–A8 e S1–S7 são o diff do motor de tarefas; nenhum item muda regra de jogo (`02`); as copies `[novo]` passam pelo guarda como aceite (dado neste parecer); a régua A4 é da UI, não do motor.

## 7. Rituais: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Rituais](https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/rituais/` (`Main.dc.html` + 20
> `<TelaEstado>.dc.html` + `canvas.json`; 26 linhas `RIT-*` em 21 artboards).
> **Crítica:** `design-critic` (rodada 1: "não passa", 5 bloqueantes B1–B5 + 7 ressalvas — todos
> aplicados na rodada 2), `soulmon-product-designer` (10 achados; o que mudou o canvas: o
> `FirstTaskCompletedPopup` monta POR BAIXO dos intersticiais e o gatilho vive neste canvas; a
> ordem do relatório; o retorno de ausência), `soulmon-guarda-linha-vermelha` (família **APROVADA
> COM RESSALVA** — 1 veto de copy, 4 vetos ao código que o canvas já corrige, 9 ressalvas que viram
> aceite, 3 decisões para o dono).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. As regras fechadas na Home
> (§5: piso de dígitos, regra de canal, ordem de foco) e em Atividades (§6: léxico da janela de 7,
> carga como 7ª entrada da fila 2) valem aqui.

### 7.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| R1 | **O mapa completo do que vive fora das duas filas** (RIT-01): a cerimônia do marco (z-300) e a de evolução (z-500) de propósito; o `ProtectProgressModal` e o `FirstTaskCompletedPopup` **sem posição declarada**; o canal de VOZ (`falar`, `welcomeBackLine` no HUD, toast) como terceiro canal | W7 (superfície nova entra numa das filas, com posição declarada); `03 §3.1`; crítico B5/N2/N5; product-designer #1/#6/#10 | Nada — o quadro só passa a dizer a verdade: `interstitial === 'welcome'` é a condição de montagem do welcome prompt, não "nada aberto" |
| R2 | **Relatório em ordem de tempo**: ONTEM inteiro (linhas · notas · aventura · memória) → a pergunta de HOJE (humor) → convite → "Start the day" `[novo — estrutura]` | W4 (o humor é a única pergunta de hoje e fica colada ao CTA de hoje); product-designer #4; `02 §12` não é reaberto (o humor continua no relatório) | Nada de regra: nada entra nem sai, só a ordem do DOM |
| R3 | **Um caminho de volta por superfície**: a nota "A rub gives half a heart back, if you feel like it…" sai do relatório; o botão "I did it, forgot to log" fica | Guarda 1b (dois caminhos no mesmo prato — mesma ressalva da Home E6); o carinho é gesto da Home e se ensina lá (E7) | A menção ao carinho no relatório |
| R4 | **Retorno de ausência com o pet na peça**: o sprite no lugar do ícone e UMA linha da família `welcomeBackLine` (faixa de ausência, `welcomeBack.ts`, teste "nenhuma frase menciona o que ficou"); o **N de dias fora sai**; "Complete days saved" some com `perfectDays === 0` `[novo — estrutura]` | PRINCÍPIOS §4 ("quantificar a ausência é criar uma consequência para depois anunciar que ela não existe"; Lovi; Finch linha 1); `02 §45` (`AbsenceBucket`: faixa, nunca o número cru); guarda 1c (VETADO o "You were away N days" do código); product-designer #6/Q5 (uma fonte só de copy) | A frase do código "You were away N days and your Soulmon lost nothing waiting…" |
| R5 | **Piso de dígitos nos rituais** (E5/13.7 aplicados): "· chosen focus: 0" e "Planned load: 0 points" somem; "Yesterday's tasks" vira **"not logged"** com coração cobrado e some sem cobrança; no semanal a linha "N tasks done · N effort points" some com `tasksDone === 0`, e cada hábito tem **uma anatomia** — janela de 7 (léxico A2) + "N of M" só com N ≥ 1; plurais reais ("2 tasks", "1 point") | E5/13.7; guarda 4a/4c/4d/4e (VETADOS no código: "0 of 4", "chosen focus: 0"); crítico B2/R2; product-designer #5/Q4 (sem a linha, "I did it, forgot to log" perde o referente) | O "of M" quando feitos = 0; o "(s)" do código |
| R6 | **Estado "aceitei" da oferta reduzida** `[novo]`: o botão vira chip preenchido "Stretch · counted" — sem prêmio, sem confete | `02 §27` ("conta como feito" é literal); product-designer #3 (hoje o plano é congelado e nada muda na tela — achado) | Nada |
| R7 | **Copy nova** `[novo]`: "You two have a history now." no lugar de "You're on a good streak!" (`ProtectProgressModal`, `reason === 'streak'`) | Guarda 5a — **VETADO** o título do código: não existe streak (o gate é `completedTasks.length ≥ 5`); é o vocabulário que o produto trocou por constância, numa tela que pede dado pessoal (precedente C-S1: o app mentindo na tela em que pede); T9 | Nada de regra; lote de copy do `staff-frontend` |
| R8 | **Primeira tarefa concluída como cerimônia**: o sprite na peça (com o 🌱), uma frase, um botão; e a peça muda de classe — sai da `ModalSheet` (z-120, sob os intersticiais) para a classe da cerimônia do marco (fora das filas de propósito, z-300, espera o gesto) `[novo — estrutura]` | W7 (hoje monta POR BAIXO de um intersticial aberto, invisível, com trap próprio — e o gatilho é o "just 5 minutes today?" de RIT-06); PRINCÍPIOS §5 (é celebração, não folha de sistema; Alan: prova pelo uso); crítico N2; product-designer #1/Q5 | A folha; o "Got it" pode virar saída relacional na implementação (copy do lote) |

### 7.2 Volta (a crítica pediu ou a rodada 1 tinha; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | × no topo da cerimônia do marco (rodada 1, PRINCÍPIOS §5 "composição de 9 apps") | **Sai** | Crítico B3: `MilestoneCeremony.render.test.tsx` trava UM botão (teste > docs); × é postura de DISPENSA e o produto escolheu RELAÇÃO (Ahead, MOB §6A). Escape = o mesmo `onDone` cobre o teclado — vai como aceite a11y (ver STATUS) |
| V2 | A linha de carga do check-in reagindo ao foco ESCOLHIDO (hoje lê `plan.plannedEffort` congelado e ignora `focusEffort`) | **Adiado → STATUS / `staff-frontend`** | É comportamento do motor, não superfície; o wireframe desenha o código (D11). É a única tela em que a carga ainda é decisão — a proposta fica registrada |
| V3 | Versão máxima do retorno: sem as duas linhas de extrato ("Hearts untouched", "Complete days saved" → Estatísticas) | **Volta parcial** | O pet e a linha entram (R4); as linhas ficam — são o código, "Complete days saved" é posse (13.7) e some em zero |
| V4 | A missão semanal `mood-checkins` (2 Emblemas) recompensa responder um dado que a regra declara opcional e fora de pontuação (guarda 5b) | **Decidido pelo dono (14/09/2026): a missão fica, com alvo 5 em vez de 3** → `REGISTRO` 13.10 | É regra (`02 §12`, `02 §50`); o wireframe já desenha as carinhas sem rótulo de prêmio |
| V5 | "1×/semana" da oferta: hoje `offerShownWeek` é carimbado no TOQUE, não na exibição — na prática "todo dia completo até tocar ou dispensar" (guarda 3a-ii) | **Decidido pelo dono (14/09/2026): conta ao MOSTRAR** → `REGISTRO` 13.11 | É regra (`offerMoment.ts`); o guarda recomenda carimbar ao mostrar (o que WP5.1 aprovou) |
| V6 | O carinho continuar lembrado no relatório (guarda, decisão 3) | **Sai** (R3) | É superfície, não regra: um caminho por tela |

### 7.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **"You were away N days…"** — o número de dias fora | R4 (PRINCÍPIOS §4; `02 §45`; guarda 1c) |
| S2 | **"0 of 4"** (semanal), **"0 task(s) done · 0 effort point(s)"**, **"chosen focus: 0"**, **"Planned load: 0 points"**, **"Yesterday's tasks 0 of M"** | R5 (E5/13.7; guarda 4a/4c/4d/4e) |
| S3 | **A nota do carinho no relatório** | R3 (guarda 1b) |
| S4 | **"You're on a good streak!"** | R7 (guarda 5a) |
| S5 | **O × da cerimônia** (rodada 1) | V1 |
| S6 | **O 4º candidato de foco sem pendência de ontem** (rodada 1, RIT-03) — sem `carryOver` o teto é 3 (`suggestedFocus.slice(0, 3)`) | Crítico B1 |
| S7 | **"(s)"** nos plurais do semanal | R5 |
| S8 | **A `ModalSheet` da primeira tarefa** (a peça vira cerimônia) | R8 |

### 7.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (R1–R8 entram; 13.10 `mood-checkins` fica com alvo 5; 13.11 a semana da oferta conta ao mostrar). Registro do que foi apresentado: R2, R3, R4, R5 e R8 eram as mudanças estruturais — a recomendação era aprovar as cinco; V4 e V5 eram decisões de regra do dono (o guarda recomendava tirar a missão; o dono preferiu mantê-la com alvo maior).
- **Para o cartógrafo:** `RIT-15` no inventário diz "item na pastinha → `applySpecialItem`" — é `handleRecoverHearts`, sem item; `03 §4.21` diz que o gate "substituiu" o `setTimeout(15 s)` — os dois coexistem ("o timer fica", `App.tsx`); `03 §3.1` precisa dizer que `interstitial === 'welcome'` monta o welcome prompt E libera o `ProtectProgressModal` (duas `ModalSheet` juntas); `RIT-26` não tem posição nas filas (R8); `RIT-13` "Forms lived" são nomes de estágio, não tiers.
- **Para o `docs/STATUS.md` (achados de código):** (a) `FirstTaskCompletedPopup` z-120 sob os intersticiais, fora do `filaDeAvisos.contract.test.ts`, alcançável pela oferta reduzida; (b) `ProtectProgressModal` × `WelcomePromptModal` no mesmo valor de `interstitial`; (c) a linha de carga do check-in cega ao foco escolhido; (d) `WeeklyReportCard` imprime "0 of 4", "0 task(s) done" e "(s)"; (e) oferta reduzida sem estado pós-aceite (plano congelado); (f) `MilestoneCeremony` `role="status"` sem trap nem Escape — Tab vaza para o check-in sob o véu; (g) "You're on a good streak!"; (h) `restDayUsed`/`weeklyRelief` sem `!welcome` (podem aparecer no retorno); (i) `offerShownWeek` gravado no toque; (j) "You were away N days"; (k) "chosen focus: 0"; (l) o comentário "some sozinha em 2,5s" (já em `03 §6`).
- **Para o `staff-frontend`:** R1–R8 e S1–S8 são o diff dos rituais; nenhum item muda regra de jogo (`02`) — V4 e V5 são regra e esperam o dono; os aceites do guarda viram critério: 1a (nenhuma superfície fora do check-in repete a oferta reduzida nem conta faltas), 2e (a raridade do sonho nunca vem com causa, comparação ou à noite), 3a-i (`heartsLost === 0` como trava explícita da oferta), 5b (as carinhas sem rótulo de prêmio), 5c (`soulStruggle` só na oferta reduzida — nunca push, chat ou telemetria), e "Escape = `onDone`" + `role="dialog"` na cerimônia.

## 8. Pet: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Pet](https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/pet/` (`Main.dc.html` + 8
> `<TelaEstado>.dc.html` + `canvas.json`; 7 linhas `PET-*` em 9 artboards — `PET-02` é `fora` por D4).
> Canvas próprio por **D1** (os ids `EVO-22`→`EVO-29` viraram `PET-01`→`PET-08`; inventário §1.4a).
> **Crítica:** `design-critic` (rodada 1: "não passa", 1 bloqueante sistêmico B1 + 2 ressalvas — aplicados
> na rodada 2), `soulmon-product-designer` (8 achados; o que mudou o canvas: as sub-abas desenhadas com
> semântica que o código não tem; a data das formas mora no `FormAlbum`; a coluna sem wayfinding),
> `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA** — 1 veto ao `[novo]` da rodada 1
> que suprimia o "0 of 30": reverteria 13.7 sem evidência nova).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem aqui E5/13.7 (posse × dívida),
> A6 (zero de posse como texto quieto) e D4 (save legado = fora).

### 8.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| P1 | **Dex vazio sem a barra de progresso em 0% e sem as frações "0 of 12 / 0 of 10 / 0 of 8"** — só enquanto as TRÊS raridades estão em zero; o dígito "0 of 30 · dreams discovered" **fica**, como texto quieto | PRINCÍPIOS §9 (Reddit: barra suprimida no zero; "zeros em série"); guarda 1b/1c; 13.7 + A6 (posse pode mostrar zero, como linha quieta — nunca banner + cadeado, que é o anti-padrão Withings); é branch `collected === 0` no `DreamDex.tsx`, não CSS | A barra vazia e o "0 · 0 · 0" do dia 1 |
| P2 | **Célula obtida do Dex ganha "#NN · data"** (`#NN` = índice GLOBAL no `DREAM_CATALOG`, 1–30; a data = `rest.dreamDates[id]` via `collectedAt`); o não obtido fica só com "???" | PRINCÍPIOS §9 ("data no obtido" — Reddit/Runna; "número de catálogo" — Finch #25); `02 §45` (o save já carimba a primeira data e a UI nunca a mostrou); crítico R1 (o número tem de vir do dado, como o "+20%"); guarda 1d | Nada de regra: `collectedAt` devolve `null` em save antigo → célula só com o nome (nunca data inventada) |
| P3 | **Sub-abas desenhadas como o código**: três `<button>` (`sm-btn` / `sm-btn-secondary`), o ativo só por classe — sem `tablist`, sem `aria-selected` | D11; crítico B1 (a rodada 1 desenhava um `tablist` que o código não tem, sem `[novo]`, e ainda numerava três paradas de Tab — um tablist real tem uma) | A semântica de aba vai ao STATUS como dívida a11y (roving-tabindex + setas é implementação, não wireframe) |
| P4 | **Estados da ficha que o inventário não tinha**: habilidades antes do "power N" chegar (o par qualitativo pinta primeiro), classe ainda não computada, o vazio (`formas.length === 0`), save que aponta para forma fora da lista (cai na última alcançada) | W3; `PetPage.tsx` (três `try/catch` independentes: "sem classe é melhor que sem página"); crítico item 3 (achado, rota certa = cartógrafo) | Nada |

### 8.2 Volta (a crítica pediu ou a rodada 1 tinha; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Suprimir o dígito "0 of 30" no Dex vazio (rodada 1) | **Sai — VETADO pelo guarda (1a)** | Reverteria 13.7 ("coleção é posse, pode mostrar zero") sem evidência nova; a régua já fechada em E5/A6 é a mesma: o dígito como texto quieto não é o padrão Withings (cadeado + vermelho + banner). Não vai ao dono |
| V2 | A data das formas anteriores na ficha ("Who they used to be") — PRINCÍPIOS §9 "data no obtido" | **Adiado → canvas Estatísticas, com recomendação** | Uma casa só (guarda 2a): o `FormAlbum` (STAT-08) já lê `collectedAt(reachedAt, id)` e é peça de COLEÇÃO; a ficha continua narrativa (Finch Micropet, MOB §15.3: a data mora no rodapé da coleção, não na ficha de identidade). Duas superfícies com a mesma data seria W4 cruzado |
| V3 | Wayfinding na coluna ficha → Dex → diário (chips de salto, ou cabeçalhos `sticky`) | **Adiado → STATUS / lead** | Não inventar navegação; a proposta menor (os `h2` de seção como `.sm-pet-sticky`, padrão já do dono) fica registrada. As setas ▲▼ do canvas são anotação, não componente |
| V4 | Um `Suspense` só para os três blocos (três "LOADING" empilhados leem como três falhas) | **Adiado → STATUS** | É custo medido (o chunk mais lento seguraria a ficha), não decisão de wireframe; desenhado como o código (D11) |
| V5 | A transição do primeiro sonho obtido (o dia em que `collected` vira 1) e a forma nova na ficha como momento | **Não desenhado** | O momento do sonho é o `MorningDream` (RIT-16, canvas Rituais); a forma nova é a `EvolutionCeremony` (canvas Evolução) — o Pet é o arquivo, não a celebração (PRINCÍPIOS §5 × §9) |

### 8.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **A barra de progresso em 0%** e as três frações em zero no Dex vazio | P1 |
| S2 | **O `tablist` da rodada 1** | P3 (B1) |
| S3 | **A miniatura de 56px empilhada em cartões iguais** (a ficha antes do revamp — ⚰️ já saiu do código) | `PetPage.tsx` cabeçalho |
| S4 | **Nível numérico, "N/M formas", escada Rookie→Mega na ficha** | PRINCÍPIOS §6 (altura fica na própria tela de Evolução); `02 §14` |
| S5 | **A seção "What they can do" no save legado** (`PET-02`) | D4: `fora`; não se desenha |

### 8.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (P1–P4 entram; sem decisão de regra nova — a tensão 13.7 × §9 foi resolvida pelo lead com a régua já aprovada em E5/A6). Registro do que foi apresentado: P1 e P2 eram as mudanças estruturais — a recomendação era aprovar as duas.
- **Para o cartógrafo:** o estado vazio da ficha (`formas.length === 0`) existe no código e não tem linha no inventário; as duas habilidades do estágio **não têm seção no `02-REGRAS-DE-NEGOCIO.md`** (a regra vive só em `utils/soulProfile/ficha/skills` — o `02 §15` é atributos e galhos); a data das formas tem de ter UM dono de tela (V2).
- **Para o `docs/STATUS.md` (achados de código):** (a) `DreamDex` sempre renderiza contador + `progressbar`, mesmo em zero; (b) `dreamDates` carimbado no save e nunca exibido; (c) a fileira de sub-abas são três `<button>` sem grupo nem estado ativo para leitor de tela; (d) a sub-aba Soulmon não tem sinal de posição ao rolar (ficha → Dex → diário); (e) três `ScreenSkeleton` empilhados; (f) as habilidades do estágio sem seção no manual.
- **Para o `staff-frontend`:** P1–P4 e S1–S5 são o diff do Pet; nenhum item muda regra de jogo; aceites do guarda: 1c (as frações somem só com as três em zero), 2a (a data das formas em uma casa só).

## 9. Onboarding-funil: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Onboarding-funil](https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/onboarding-funil/` (`Main.dc.html` + 16
> `<TelaEstado>.dc.html` + `canvas.json`; 25 linhas `ONB-*` do funil em 17 artboards — `ONB-13` é `fora` por D4).
> Por **D3** o Onboarding são dois canvases: este é o FUNIL (splash → intro → portão → perguntas → grátis ×
> completo → personagem → cadastro demo → tutorial); o ritual do Oráculo (`ONB-21`→`ONB-33`, `35`→`38`) é o
> último canvas.
> **Crítica:** `design-critic` (rodada 1: "não passa", 4 bloqueantes B1–B4 + W3 — aplicados na rodada 2),
> `soulmon-product-designer` (6 achados; os que mudaram o canvas: o nascimento demo sem a criatura, o
> objetivo perguntado duas vezes, a justificativa do campo), `soulmon-guarda-linha-vermelha` (família
> **APROVADA COM RESSALVA** — nenhum veto; 2 ressalvas: rotular o estado pós-marcação em ONB-09 e a
> disclosure da IA no tutorial).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem T9 (conta primeiro, com o porquê),
> D4 (rascunho = fora), D8 (o objetivo não sai do aparelho para ordenar), D11.

### 9.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| O1 | **O sprite grande do personagem escolhido no cadastro demo** (`ONB-34`), na tonalidade escolhida | O caminho grátis nasce sem a criatura na tela do nascimento — o `REGISTER` demo não tem `<img>` (product-designer #1, fatal); PRINCÍPIOS §3 ("o reveal tem a criatura desenhada"; Finch entrega o birb, não um parágrafo); a arte existe (`src/assets/soulmon/lines/`) | Nada de regra |
| O2 | **A justificativa do campo de objetivo** (`ONB-14`): "Your Soulmon brings this back on the days that count." | PRINCÍPIOS §3 "justificativa por campo" é obrigatório (crítico item 2: nota de rodapé não satisfaz; product-designer #4); a frase promete só o que `02 §21` permite (volta em momentos-chave — RIT-09, ONB-43; nunca vira nota, meta, cobrança) | Nada |
| O3 | **O objetivo do tutorial nasce pré-carregado com o `soulGoal`** (`ONB-40`), editável; com ONB-14 pulado, mostra o placeholder | "What do you want to improve in your life?" e "What’s your goal?" são a mesma pergunta duas vezes em três telas (product-designer #3); o valor já está no save — não é funcionalidade nova | O campo vazio |
| O4 | **Um "Back" nos três becos sem saída** — `STRUGGLE_STEP`, `CHOICE_STEP`, `REGISTER` | `back()` sabe voltar dos três e nenhum botão o chama (crítico B1: a rodada 1 os desenhava como se existissem); o botão quiet é o mesmo que os passos do ritual já têm | Nada de regra; achado de código |
| O5 | **Rótulo e teclado no skip da intro** (`ONB-03`): `aria-label="Skip intro"` na superfície, com Enter/Espaço | W10 (toda ação com rótulo e caminho de teclado); hoje a raiz só tem `onClick` (crítico B4) | Nada |
| O6 | **O aviso junto de "Suggest tasks with AI"** (`ONB-40`): "Your goal is sent to the AI to write suggestions." | Guarda 2e: o objetivo VAI para `/api/suggest-tasks` (`minimizeForAi` tira identificador direto, não dado de saúde) e a política de privacidade não menciona o endpoint — aceite: linha na política PT/EN antes de implementar + o aviso curto | Nada de regra |
| O7 | **Estados que a rodada 1 não tinha**: o par "Sign in" do e-mail (reset enviado como `role="status"`, `aria-invalid`, "I forgot my password"); ONB-05 como o que é (a tela sem-Firebase por um tick); o rótulo real do teto no tutorial ("Stage limit of N activities reached — unselect something to swap.") como UI; a barra do tutorial como pontinhos, como o código | W3 (crítico); B2, B3; fidelidade | Nada |

### 9.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **Reordenar o funil**: as duas perguntas abertas (ONB-14/15) DEPOIS do personagem e do cadastro (ONB-20/34), para a criatura subir da 7ª para a 5ª tela (product-designer #2, "criatura antes do pedágio") | **Decidido pelo dono (14/09/2026): MANTER a ordem de hoje** (a criatura continua na 7ª tela; as perguntas ficam entre a conta e o ritual) | Muda a ordem dos `step` em `SoulmonOnboarding.tsx` e o funil medido (PP Parte 0); é a maior alavanca do canvas e não é do wireframe decidir. Custo: perde "a conta fica atrás, o ritual à frente" das perguntas; ganha fundir com O3 (a pergunta do tutorial). Recomendação do lead: reordenar — o dono preferiu não mexer no funil medido; a proposta fica registrada como perdedora |
| V2 | O porquê da ausência de conta em ONB-09 (T9 parcial; product-designer #5): "No account here — your progress stays on this device." | **Adiado → lote de copy** | Copy nova numa tela que hoje tem hint próprio; registrada como candidata |
| V3 | A métrica "8 telas + WelcomePromptModal" (PP Parte 0) × as 10 telas contadas no canvas (o tutorial são 2) | **→ STATUS** | Reconciliar a régua, não o desenho |
| V4 | Copy dizendo que a 1ª atividade do tutorial é REAL (vai para `gameState.activities`), não demo | **Adiado → lote de copy** | Achado para o STATUS; nenhuma tela diz isso hoje |

### 9.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **O campo de objetivo vazio no tutorial** | O3 |
| S2 | **O nascimento demo sem a criatura** | O1 |
| S3 | **O "carregando" do portão como tela própria** (rodada 1) — é a tela sem-Firebase por um tick | Crítico B2 |
| S4 | **A barra contínua do tutorial** (rodada 1) — são pontinhos | Fidelidade |
| S5 | **O rascunho retomado do portão** (`ONB-13`) | D4: `fora` |

### 9.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (O1–O7 entram; V1: a ordem de hoje do funil FICA — o lead recomendava reordenar, o dono decidiu manter; sem decisão de regra nova no `REGISTRO`). Registro do que foi apresentado: O1–O4 eram as mudanças estruturais — a recomendação era aprovar as quatro.
- **Para o cartógrafo:** `03 §2.3` não diz que `STRUGGLE`, `CHOICE` e `REGISTER` não têm volta; `03 §2.4` não diz que o campo de objetivo do tutorial é independente do `soulGoal`; a régua "8 telas" de PP Parte 0 exclui o tutorial.
- **Para o `docs/STATUS.md` (achados de código):** (a) três becos sem saída no funil (`back()` sem botão em `STRUGGLE_STEP`, `CHOICE_STEP`, `REGISTER`); (b) `REGISTER` demo sem `<img>`; (c) durante a checagem assíncrona o portão renderiza a tela sem-Firebase por um tick — quem toca "Continue" entra sem conta mesmo com Firebase configurado (`mostrarAuth = authUsavel && !authEmail`, `authUsavel` nasce `false`); (d) o skip da intro sem rótulo nem `onKeyDown`; (e) `/api/suggest-tasks` recebe `goalText` e a `privacidade.html` não o menciona; (f) o objetivo perguntado duas vezes (ONB-14 e ONB-40); (g) nenhuma copy diz que a 1ª atividade é real; (h) a métrica "8 telas" × 10 contadas.
- **Para o `staff-frontend`:** O1–O7 e S1–S5 são o diff do funil; nenhum item muda regra de jogo; aceites do guarda: 2c (as caixas de ONB-09 nascem desmarcadas — o artboard mostra o estado pós-marcação), 2e (linha na política antes de implementar a disclosure); V1 espera o dono.

## 10. Evolução: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Evolução](https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/evolucao/` (`Main.dc.html` + 14
> `<TelaEstado>.dc.html` + `canvas.json`; 21 linhas `EVO-*` em 15 artboards — a sub-aba Soulmon migrou para o Pet, D1).
> **Crítica:** `design-critic` (rodada 1: "não passa", 3 bloqueantes — B1 ordem de foco invertida em 7 artboards,
> B2 a cerimônia sem semântica de diálogo, B3 risco de flash na intercalação — + W3 o estado por nó da árvore;
> aplicados/registrados na rodada 2), `soulmon-product-designer` (8 achados; os que mudaram o canvas: a data e a
> saída relacional na cerimônia; a tag "LOCKED" duplicada), `soulmon-guarda-linha-vermelha` (família **APROVADA
> COM RESSALVA** — nenhum veto; 3 ressalvas que viram aceite: o cadeado avisa dos corações, a data na cerimônia,
> a pausa entre a cerimônia e o modal).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D7 (reduced-motion muda a estrutura da
> cerimônia), D9 (offline na geração de sprite), D11 (a 4ª divergência — marco espera o gesto — não é reaberta) e
> a régua viva `evolucaoManual.contract.test.ts`.

### 10.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| X1 | **A DATA na cerimônia de evolução** ("September 14, 2026" — `formReachedAt`, 02 §45) | PRINCÍPIOS §5 obriga (MOB §6A, 4 de 11 apps; "marco é memória, não aviso"); a cerimônia do marco já a tem (RIT-20); guarda 4a (aceite); product-designer #1 | Nada de regra |
| X2 | **"Continue" vira "Let’s keep going together"** na cerimônia | PRINCÍPIOS §5 (saída de RELAÇÃO — Ahead); o marco já usa esta frase: duas celebrações, uma saída (product-designer #2/#3); `onClose` intacto | O "Continue" neutro |
| X3 | **A tag do cadeado do jogador vira "ON HOLD"** (era "LOCKED", a mesma palavra da forma não alcançada) | Em EN duas coisas tinham um nome; o PT já desambigua (TRAVADA × BLOQUEADA); casa com o botão "Evolution on hold" (PRINCÍPIOS §6 "vocabulário único"; M-perm §3 item 6; crítico ressalva; product-designer #5) | Nada; a tag "LOCKED" da forma não alcançada fica |
| X4 | **A superfície do cadeado diz o que ele não protege**: "Holding the form doesn’t shield it — hearts can still drop on hard days." | 02 §17 ("o cadeado não protege de degeneração") vivia só em comentário de código; quem trava para "manter como está" podia ver a criatura cair sem aviso — teste do homem atrás da cortina (guarda 1c, aceite) | Nada |
| X5 | **Estados que a rodada 1 não tinha**: a linha de estado por NÓ da árvore (`linhaDeEstado` roda em cada card — "NEW · Visor tuned", "Not revealed yet", "The Oracle is drawing…"); o offline da geração de sprite (D9); a cerimônia em movimento reduzido como quadro antes → depois (D7); o `role="dialog"` na cerimônia; plural real no `EvolveTaskModal` | W3 (crítico); D7; D9; B2 | Nada |

### 10.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **O `EvolveTaskModal` em cima do clímax** (Continue → "cadastre mais tarefas" em dois toques; guarda 4b, product-designer #4) — alternativa: virar CARD na página de Evolução, onde a barra já mudou | **Decidido pelo dono (14/09/2026): vira CARD na página** → `REGISTRO` 13.12 | É a única mudança que reorganiza uma superfície inteira; o código já encadeou o modal para DEPOIS da cerimônia (03 §4.11) e a régua `filaDeAvisos` trava a string do `isOpen`. Recomendação do lead: virar card na página (o mesmo léxico do convite), sem modal |
| V2 | O gesto duplo do visor (alterna o cadeado; com a barra cheia, dispara a evolução) — separar "travar" de "evoluir" | **Adiado → STATUS / lead** | É IA do motor (product-designer #2/#4); o botão de 44px replica o cadeado; um botão "Evolve" separado seria funcionalidade nova — registrada como dívida, não desenhada |
| V3 | "N complete days to go." como leitura dominante (PRINCÍPIOS §6 família "faltam N", PARCIAL) — copy candidata "4 of 7 complete days" | **Adiado → lote de copy** | A frase está abaixo da barra e diz "complete"; trocar a ordem (feito primeiro) é copy, não estrutura |
| V4 | O × permanente no `UnlockNudge` (Garmin, PRINCÍPIOS §8) | **Volta ao código (D11)** | Decisão preexistente do dono (13/09): as quatro divergências não são reabertas; o guarda registra (3a) e segue |
| V5 | W9: nenhum artboard nomeia o que o Soulmon ATUAL perde (só anti-padrões de outros apps) | **Aceito como lacuna documental** | D11 manda desenhar como o código já faz; a coluna "Sai" desta seção é o delta |

### 10.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **"Continue"** na cerimônia | X2 |
| S2 | **A tag "LOCKED" do cadeado do jogador** | X3 |
| S3 | **A intercalação de 3 s e o vídeo em loop** em movimento reduzido — viram quadro antes → depois | D7 (o código não lê `prefers-reduced-motion` — achado) |
| S4 | **"(s)"** nos plurais do `EvolveTaskModal` | X5 |
| S5 | **A ordem de foco começando no visor** (rodada 1) — as sub-abas vêm antes no DOM | Crítico B1 |

### 10.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (X1–X5 entram; 13.12: o aviso pós-evolução vira card na página, não modal). Registro do que foi apresentado: X1–X4 eram as mudanças estruturais/copy — a recomendação era aprovar as quatro; V1 era decisão de regra do dono — o lead recomendava o card.
- **Para o cartógrafo:** o botão "Degenerate" nos cards de estágio anterior (dois toques: "Confirm degeneration" → "Final warning") não tem linha no inventário nem seção no 03 §4.10; a linha de estado por nó da árvore (`linhaDeEstado`) não está no 03; no demo os estados de sprite (GERANDO/ERRO/A_SINTONIZAR) nunca disparam (`getSpriteForStage` é o fallback) — EVO-05/06/07 são só de conta paga.
- **Para o `docs/STATUS.md` (achados de código):** (a) **flash** — a intercalação da cerimônia decai de 420 ms até 55 ms (~18 trocas/s) de sprites brancos sobre fundo escuro, acima do piso do WCAG 2.3.1; capar em ≥ 334 ms independente da preferência (prioridade alta); (b) `EvolutionCeremony` sem `role`, `aria-modal`, trap nem Escape num z-500 que bloqueia o app; (c) `EvolutionCeremony` não lê `prefers-reduced-motion` (o `MilestoneCeremony` lê); (d) a cerimônia sem a data e com saída neutra; (e) "LOCKED" para duas coisas em EN; (f) o cadeado não avisa que não protege de degeneração; (g) `EvolveTaskModal` no kit antigo (Consolas, `sm-card`) com "Create new task" / "Got it" só em inglês; (h) o gesto duplo do visor; (i) o "Degenerate" fora do inventário.
- **Para o `staff-frontend`:** X1–X5 e S1–S5 são o diff da Evolução; nenhum item muda regra de jogo (`02`); V1 espera o dono; aceites do guarda: 1c (a frase do cadeado), 4a (a data), 4b (a pausa entre cerimônia e modal — resolvida por V1 se o dono aprovar o card).

## 11. Jogos: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Jogos](https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/jogos/` (`Main.dc.html` + 15
> `<TelaEstado>.dc.html` + `canvas.json`; 25 linhas `JOGO-*` em 16 artboards).
> **Crítica:** `design-critic` (rodada 1: "não passa", 6 bloqueantes B1–B6 — todos aplicados na rodada 2),
> `soulmon-product-designer` (6 achados; os que mudaram o canvas: o chrome da run nas fases de luta, a
> instrução da barra no pesadelo, a tensão do "N pts" por pessoa), `soulmon-guarda-linha-vermelha` (família
> **APROVADA COM RESSALVA** — **1 veto** (3b: a faixa do Torneio ao lado do oponente), 3 ressalvas que viram aceite).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D9 (offline no Torneio), D11 e T7
> (a criatura do amigo no estágio REAL, sem escada nem rank).

### 11.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| J1 | **O card do oponente no Torneio = criatura + nome + "‹pet› · ‹estágio›"** (como o código: `o.petName || o.stage` · `getStageLevel`), sem a faixa | Guarda 3b (VETO à faixa da rodada 1: reusar o selo de "Your tier" no card alheio é a armadilha do #21 — Mimo); crítico B1 (a faixa só é calculada para o próprio jogador); T7 (estágio real) | A faixa ao lado do oponente (rodada 1) |
| J2 | **O chrome persistente da run** ("Dungeon · Floor N/5 · scene · enemy I/6" + ×) em todas as fases de luta | `DungeonGame.tsx` monta o cabeçalho sempre; sem ele o jogador não sabe onde está no turno (product-designer #1) | Nada |
| J3 | **Uma linha de instrução no pesadelo** `[novo]`: "Tap when the marker crosses the middle." | O pesadelo pode ser o PRIMEIRO combate do jogador (fila 1, antes de abrir Jogos) e o `NightmareBattle` não explica a barra (product-designer #5) | Nada |
| J4 | **Estados que a rodada 1 não tinha**: o erro `sem-motor` da Arena ("I could not load the challengers right now… try again in a bit." + "Go back"); o `fightError` do Torneio ("The match didn’t happen. Try again."); o relógio de defesa de 3,0 s como padrão (o "(no time limit)" só com `prefers-reduced-motion`); "2.4s" como instante, não constante; o offline do Torneio (D9) | W3 (crítico B4, B5, B6); D9 | Nada |
| J5 | **Fidelidade de a11y**: o × é o PRIMEIRO interativo em todo minijogo (`sm-px-arcade-close`); os cards da página sem `aria-label` — o nome acessível é a concatenação sem separador (como o código, registrado como achado); plural real em "N matches left today" | Crítico B2, B3; precedente RIT-18 | O `aria-label` inventado da rodada 1 |

### 11.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **"Against ‹oponente› · N pts" no resultado do Torneio** — número por pessoa (PRINCÍPIOS §10; MOB §13A), tensão nova fora de T1–T9 (product-designer #3) | **→ dono** | O "N pts" é o poder DAQUELA partida (`result.points`, com aleatoriedade), nunca `lifetimePoints` (guarda 3c, aceite); mesmo assim é um número ao lado de um nome. Recomendação do lead: manter (é o placar da partida, não do jogador; some com o "Continue") — registrar no `REGISTRO` como decidido |
| V2 | Confirmação ao sair da run pelo × (hoje `exitRun` sai imediatamente em qualquer fase, inclusive após "Go deeper") | **Adiado → STATUS** | É comportamento do motor; o wireframe desenha o código (D11) e registra |
| V3 | A fonte pixelada (`sm-px-arcade-value/-label`, Silkscreen) no popup "PERFECT!" e no placar — contra PRINCÍPIOS §7 / Life Reset | **Adiado → STATUS** | O wireframe desenha sans-serif (a fronteira certa); o vazamento é do código, para a Fase 2 / `staff-frontend` |
| V4 | Viewport curto (iPhone SE): a 5ª card da página pode sair da dobra sem affordance | **Aceito como nota** | 390×844 é o viewport do canvas; a rolagem é natural |

### 11.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **A faixa ao lado do oponente** (rodada 1) | J1 (veto 3b) |
| S2 | **O `aria-label` "‹título› — ‹descrição›" dos cards** (rodada 1) — o código não o tem | J5 (B2); vira achado a11y |
| S3 | **"(no time limit)" como padrão do pesadelo** (rodada 1) | J4 (B6) |
| S4 | **A Biblioteca como card da página** (PD §5 dizia que viraria) — o código não tem; é o canvas Social (D2), pelo menu | D2 |

### 11.4 O que fica registrado para depois

- **Para o dono, no checkpoint:** J1, J2, J3 são as mudanças estruturais/copy — a recomendação é aprovar; **V1 (o "N pts" por pessoa no resultado do Torneio) é decisão sua** — o lead recomenda manter.
- **Para o cartógrafo:** `JOGO-22` no inventário cita a faixa do oponente? (não — o inventário está certo; a rodada 1 do wireframe errou); a Arena tem o estado `sem-motor` sem linha; o `fightError` sem linha.
- **Para o `docs/STATUS.md` (achados de código):** (a) o × da masmorra sai da run sem confirmação em qualquer fase, inclusive após gastar Bits; (b) `sm-px-arcade-value/-label` (Silkscreen) no popup e no placar — fonte pixelada no corpo do texto (PRINCÍPIOS §7); (c) os cards da página de Jogos sem `aria-label` (nome acessível = concatenação sem separador); (d) "N match(es)" e o "(s)"; (e) o pesadelo sem instrução da barra.
- **Para o `staff-frontend`:** J1–J5 e S1–S4 são o diff dos Jogos; nenhum item muda regra de jogo; aceites do guarda: 2b (a barra "You" da run nunca usa ❤️), 2c ("N matches left today" nunca vira push nem contagem regressiva), 3c ("N pts" = poder da partida); V1 espera o dono.
