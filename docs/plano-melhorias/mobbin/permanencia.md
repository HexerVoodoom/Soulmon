# Mobbin × Permanência — Dossiês 7 (coleção/dex) e 12 (card compartilhável)

Dono: guarda-permanência (WP4.1–4.8). Fonte: `docs/guia-experiencia/09-mobbin-dossie.md`
§1, §8 (Dossiê 7), §13 (Dossiê 12), §15.3 (ficha de item). Data: 2026-09-02.
Toda afirmação sobre o código abaixo foi confirmada por `grep`/`sed` nesta sessão; o
símbolo vai junto para o próximo `grep` reencontrar.

## 0. Limites do dossiê que valem para este domínio (§1)

- Só iOS, sem data de captura, sem estado transitório. **A celebração de "novo item na
  coleção" (o toast do momento em que o sonho/forma entra) está fora por construção** —
  o dossiê fotografa a grade em repouso. Nada aqui decide a animação de entrada.
- Dossiê 12 é declarado **FORTE com viés**: quase todo Wrapped do acervo é número que
  cresce + percentil. A parte aproveitável é a estrutura, nunca a métrica.
- §1 recomenda um 3º passe de fluxos (grade → item; tarefa → conquista → coleção). Não
  existe; o que segue é sobre telas, não sobre a sequência.

## 0b. Correção de evidência ANTES dos achados — o "roster de 60" não existe

O briefing deste domínio, o anexo `F-conteudo.md` (§ Sonhos/missões/coleção), o ledger
(`permanencia.md`, linha WP4.6) e o `PLANO-MELHORIAS.md` (WP4.6, evidência) afirmam que
`LEGACY_FORM_TIERS` é um roster de 60 nomes de arte consumido por `getDungeonEnemySprite`.
**É falso, e o grep prova:**

| Afirmação | O que o grep mostra |
|---|---|
| "`LEGACY_FORM_TIERS` consumido por `getDungeonEnemySprite`" | `grep -rn LEGACY_FORM_TIERS src desktop` → **um único uso de código**: `src/types/progression.ts:90` (`LEGACY_LEVEL_OF`, tabela id-antigo→nível). Os outros 3 hits são comentários (`cloudSync.ts:21`, dois testes). `getDungeonEnemySprite` (`src/utils/sprites.ts:61`) sorteia de **`DUNGEON_LINE_SPRITES`** — 6 linhas (ignar/lumel/serah/kaelen/orrin/thalindra) × 4 estágios. |
| "60 nomes de arte" | `ls src/assets/soulmon/lines` → **24 PNGs** (+ pasta `full`); `ls -R src/assets \| grep -ci "agumon\|gaioumon\|veemon"` → **0**. Os 60 nomes são ids Bandai sem arte nenhuma no bundle (`CLAUDE.md`, "Arte e nomes": "é só compatibilidade de save… Não é roster de nada"). |
| O que engana | O comentário morto em `progression.ts:57-59` ("Roster 'selvagem' da masmorra (utils/dungeon.ts) + fallback de sprite genérico") — o `dungeon.ts:40-44` diz o contrário ("the roster used to be a list of borrowed species names… and both are gone"). |
| Identidade real do inimigo | `enemyKey(tier, line)` = `` `${line}-${tier}` `` (`dungeon.ts:48`), com `LADDER_TIERS` = 6 tiers (`dungeon.ts:24`) → **36 chaves distintas, 24 artes** (baby-i/baby-ii/rookie da mesma linha compartilham o sprite rookie, `sprites.ts:66-70`). Nomes: `DUNGEON_LINE_NAMES` = **6** (`sprites.ts:56-59`). |
| Segundo "bestiário" | `loadBestiaryPool` (`src/utils/arena.ts:243`) carrega `pool.json` com **2.000** criaturas — mas o item 0 tem `descricao` "Pikachu é uma espécie fictícia… da Nintendo" (conteúdo de terceiro, nunca exibível) e **nenhum componente importa `arena.ts`** (`grep -rln` → só o próprio arquivo e testes). É a leitura do Oráculo, não um roster de jogo. |

Consequência: **a "maior massa de conteúdo existente e invisível" tem 36 entradas com 24
artes e 6 nomes, não 60.** A tese do WP4.6 ("melhor razão conteúdo/esforço do plano")
cai pela metade e o dossiê 7 mostra onde ela renasce (item 2, WP4.6). As três fontes
acima precisam de correção — proposto em §5 (candidato C1). A conta de Bits (D15–D23)
**não** depende disso e continua válida.

## 1. Achado a achado — Dossiê 7 (coleção / dex / álbum)

Colunas: **o que o app faz · o que o Soulmon faz hoje (arquivo+símbolo) · veredito.**

| Achado (app) | O que o app faz | O que o Soulmon faz hoje | Veredito |
|---|---|---|---|
| **Finch — `?` + `#25` + fração por categoria** | Não obtido = quadrado cinza com `?` grande (curiosidade, não bloqueio); item obtido carrega número de catálogo; várias frações (`1/60`, `2/114`) por subcoleção — impossível estar em zero em todas. | `DreamDex.tsx` é a **única** dex (`ls src/components \| grep -i dex`). Não coletado = rótulo `'???'` (`DreamDex.tsx:155`) + `aria-label` "Sonho ainda não descoberto" (`:90`); contador único `"{collected} de {total}"` via `dexProgress` (`:164`, `restWindow.ts:557`); agrupado por raridade (`RARITY_ORDER`, `:230`) com `got` por grupo (`:233`). **Sem número de catálogo.** | **PADRÃO já adotado em parte.** O `???` é o `?` do Finch em texto. Falta o número de catálogo (custo zero: índice no `DREAM_CATALOG`) e, para o álbum de formas, o `#` do estágio. Levar para WP4.6. |
| **Reddit — branco sem detalhe + barra só onde há progresso** | Não obtido = mesma forma do emblema sem nenhum ícone interno; barra de progresso só no item em que a pessoa já andou; **datas nos obtidos**. | Silhueta cheia: `filter: 'grayscale(1) brightness(0.35) opacity(0.6)'` (`DreamDex.tsx:135`, comentário "SILHUETA, não falta"). Barra de completude renderiza **sempre**, inclusive em zero (`ratio = total>0 ? collected/total : 0`, `:166-`; a barra está fora de qualquer condicional), compensada por copy de zero-state (`:217`). **Nenhuma data por item**: `rest.dreams: string[]` (`restWindow.ts:107`), `unlockedEvolutions: string[]` (`GameStateContext.tsx:187`). | **PADRÃO, parcialmente adotado.** A silhueta do DreamDex é o "forma sem detalhe" do Reddit. A lacuna real é a **data** — é o que torna a coleção *daquela pessoa* (Reddit, Runna, Me+, Finch "Hatched on"). Candidato C2. A barra em zero é aceitável porque a copy ao lado a reenquadra; não mexer. |
| **Me+ — relevo branco + `Not obtained` ×N** | Rotula verbalmente o bloqueado; a frase se repete 4× na área visível. | `DreamDex.tsx` não escreve negativa nenhuma na célula (`grep "Not obtained\|não obtido" DreamDex.tsx` → 0); a negativa mora só no `aria-label`. `EvolutionPath.tsx:586-587` escreve "bloqueada"/"locked" no `aria` e `:469` cita um card "BLOQUEADA". | **LIMÍTROFE → ANTI para o Soulmon.** Acúmulo de "não" numa tela de coleção é cobrança. O DreamDex está certo; a página de Evolução usa vocabulário de cadeado (ver §3). |
| **Withings — cadeado sobre arte desfocada + `Unlocked 0/30`** | Um asset serve aos dois estados (desfoque), mas cadeado + contador zero no topo de 30 células idênticas. | Sem cadeado no DreamDex (`grep "🔒\|lock" DreamDex.tsx` → 0). `EvolutionPath.tsx:593` usa "Evolução travada/destravada" — mas é o **cadeado manual** (`evolutionLocked`), um controle do jogador, não estado de coleção. | **ANTI-PADRÃO (o par cadeado + zero exposto).** A técnica de desfoque isolada é PADRÃO e já é o que o DreamDex faz por CSS. Regra para WP4.6: **nunca `0/36` no cabeçalho** — mostrar a fração só por linha/estágio em que há ≥1 (Reddit) ou zero-state em copy (DreamDex). |
| **Replika — preço na célula** | Cada traço da "coleção" tem preço em duas moedas; não obtido = comprável. | Loja (`ShopModal`, `utils/shop.ts`) e dex (`DreamDex.tsx`) são superfícies separadas; `DreamDex.tsx` não importa nada de `shop`/`currencies` (`grep -n "shop\|Bits\|currenc" DreamDex.tsx` → 0). | **ANTI-PADRÃO.** Vale como proibição escrita para o álbum/bestiário e para a vitrine do WP4.5: **nenhuma célula de coleção exibe preço**; a vitrine da estação vive na Loja. |
| **Duolingo — grade mensal em cinza** | 12 slots por ano; o mês perdido fica cinza para sempre. | Nada equivalente: `SEASON_PATHS` (`seasons.ts:329`) dá medalha por trimestre, mas o anexo F registra que não há grade de meses; `DreamDex` agrupa por raridade, não por calendário. | **ANTI-PADRÃO** (é a streak que zera em formato anual). Nunca indexar álbum/bestiário/medalhas por calendário fechado. |
| **Runna — `-` no lugar da data; fantasma dessaturado** | Não obtido = mesmo ícone em cor muito clara + travessão onde iria a data. | Célula não coletada do DreamDex mostra `???` no lugar do nome (`:155`) — o mesmo gesto tipográfico (silêncio, não zero). Sem datas, então não há onde pôr o `-`. | **PADRÃO.** Quando C2 datar as coleções, o não obtido usa `-`/vazio, nunca `0`. |
| **Apple Games — `2%` de raridade populacional** | Troca progresso por exclusividade. | Não existe métrica populacional no cliente; `community.js` só tem rank/season. `tournamentTiers.ts` já declara que posição absoluta é leitura tóxica. | **PADRÃO só para cosmético** (Dossiê 8/Opal, fora do meu domínio). **Nunca** sobre forma ou sonho — "73% têm" humilha o comum. Não entra em WP4.6. |
| **Tripadvisor — cadeado + `0/3` ×5 + barra vazia** | Empilha os três sinais de falta. | Não existe. | **ANTI-PADRÃO.** Referência negativa para a aba Missões (WP4.7): missão semanal não exibe `0/3` em série antes de a semana começar. |
| **GoHenry — sem estado bloqueado** | Grade sem diferença entre obtido e não obtido; mostra a recompensa. | `PetPage.tsx:205-207` mostra **só** as formas já desbloqueadas ("nunca as futuras") — é o GoHenry invertido: em vez de tudo sem estado, só o obtido. | **LIMÍTROFE.** A ficha do Pet acerta (é vitrine, não catálogo). O álbum do WP4.6 precisa dos dois estados, senão perde a função de "quem ele já foi". |
| **Finch — ficha do Micropet (§15.3)** | Espinha: `#` · arte · `BABY` (estágio separado do nome) · nome · `She/Her · Gentle Nature` · lore · `Equip` · `Hatched on…`. Paleta da folha vem da criatura. | Não existe ficha por forma. `unlockedEvolutions` é renderizado em 4 lugares e nenhum é ficha: `EvolutionPath.tsx:197` (árvore), `EvoTrail.tsx:49` (trilha, 'reached'/'locked' `:19-20`, opacidade 0.9/0.6 `:65`), `PetPage.tsx:205` (só vividas), `StatsPage.tsx:199,309-312` (nomes unidos por `' · '` numa frase). Matéria-prima existe: `petPassive` (`GameStateContext.tsx:336`; `namePt/nameEn` em `passives.ts`), `createdAt`/`startDate` (`:127/:123`), `petName` (`:224`, `soulmonDisplayName`), `stageName` (`EvolutionPath.tsx:672`). `DreamDex.tsx` não tem detalhe (`grep "onClick\|dialog\|Sheet" DreamDex.tsx` → 0). | **PADRÃO — modelo direto.** É o que transforma o WP4.6 de "dex de inimigos" em "álbum de formas vividas" (rel. 04 rec. 5 e 13). Ver §2. |
| **Tolan — seletor `You / Tolan`** | A mesma ficha para usuário e criatura; barra de compatibilidade que pode descer. | `StatsPage.tsx` já fala em "Vocês" (`:318`, "Vocês também…"). Sem seletor; sem número relacional. | **PADRÃO o seletor; ANTI a barra.** Fora do escopo dos meus WPs (ficha do usuário é WP3.x). Só a proibição entra: **nenhum número de relação que diminui** (mesma regra de `restWindow`: "nenhuma função devolve número que diminui"). |
| **Deepstash — ficha do não obtido** | Arte completa + "You haven't unlocked this yet". | `EvolutionPath.tsx:203/:558/:567` tem a versão Soulmon: `revealed` (Set de sessão) + modal "espiar é spoiler… vai aparecer escurecida e esconder de novo quando você sair" (`:777-779`). | **PADRÃO já adotado, melhor que o Deepstash** (a espiada é opt-in e não persiste). Manter; reusar o mesmo mecanismo na ficha do álbum para forma futura. |

## 1b. Achado a achado — Dossiê 12 (card compartilhável)

| Achado (app) | O que o app faz | O que o Soulmon faz hoje | Veredito |
|---|---|---|---|
| **Duolingo — card 4:5, mascote integrado, 1ª pessoa, 2×2, data de corte, `SHARE FOR A REWARD`** | Estrutura universal do Wrapped; paga pelo share; `top 8%` e streak como métricas. | **Nada.** `grep -rln "navigator.share\|html2canvas\|toBlob\|shareCard" src` → 0 em componentes (só `oracle`/`arena`/`soulProfile` batem por "bestiary"). `DailyReportModal.tsx` recebe `soulGoal` (`:15,:130-133`) e `report.wasPerfect` (`:69`), mas não gera imagem. | **PADRÃO na estrutura; ANTI em `top 8%`, streak e pagamento pelo share.** Base do WP4.8 (§2). |
| **Spotify — listas nomeadas em vez de agregados** | "Top Artists" com nomes é o que se posta; arte de campanha invade o card. | Os nomes existem: `formNames` (`StatsPage.tsx:199`), `petName`, `stageName`. `StatsPage.tsx:312` já imprime a linhagem como frase. | **PADRÃO.** A linhagem (rookie → champion-x → …) é a "Top Artists" do Soulmon. Entra no card. |
| **Uxcel — moldura de story simulada; share no dia 2** | Reserva a área que a UI do Instagram cobre; oferece share com números irrisórios. | Nada. | **PADRÃO a moldura; LIMÍTROFE o timing.** Define o **piso** do WP4.8. |
| **Beli — `LAST 30 DAYS`, dois percentis** | Janela de 30 dias torna o card recorrente; ranking duplo. | `weeklyReport` (`rituals.ts`) é semanal e descritivo; sem percentil (`community.js` tem rank, mas o `tournamentTiers` o esconde atrás da faixa). | **LIMÍTROFE.** Aproveitar só a janela (30/90 dias do WP4.8); percentil proibido. |
| **Paired / pliability — `-` em vez de `0`; tema do card; foto do usuário** | Travessão não acusa; 5 fundos selecionáveis; compartilha `1/7 days`. | Cenário equipado existe (`equippedDecor`/bg, `docs/PALCO-E-DECORACAO.md`). | **PADRÃO o tema (usar o bg equipado, custo zero) e o `-`.** Nunca foto do usuário (sem dado de terceiro, sem câmera). |
| **Polarsteps — visualização em vez de número; `Download`** | Mapa substitui métrica; ação primária é baixar. | Nada. | **PADRÃO.** O sprite + trilha de formas é a "visualização"; `Download` é obrigatório porque `navigator.share` não existe no Electron/desktop nem em todo browser. |
| **Goodreads / Marriott — card com zeros** | Exibe o card mesmo com dado irrisório; "Feel free to brag" sobre quatro zeros. | Nada. | **ANTI-PADRÃO.** Argumento definitivo do piso: **nenhum campo em zero entra no card.** |
| **Future Pro — resumo por sessão** | Cadência por evento, não por ano. | A cerimônia de evolução existe (`EvolutionCeremony.tsx`, `MANUAL_EVOLUTION`). | **PADRÃO.** Confirma a conclusão do dossiê: o gatilho do card é a **forma nova**, não o calendário. Rel. 04 rec. 12 já pedia exatamente isso. |

## 2. O que muda em cada WP meu

### WP4.1 (uma verdade para a evolução) — sem mudança de spec
Dossiês 7/12 não tocam. Nota lateral: o `#` de catálogo da ficha (Finch) e o `stageName`
mostram ao jogador **em que degrau está** — o que hoje é confuso porque `daysToEvolve`
declara 10/20/30/40 e o gate real é `.required` 4/5/5/6. Qualquer ficha só pode citar
o gate real. Continua `BLOQUEADO:D5`.

### WP4.2 (Ultra sem degeneração forçada) — sem mudança
Um álbum de formas vividas **expõe** o problema: quem chega ao Ultra pelo caminho atual
tem no álbum duas formas "revividas" após HP zero. Reforça a prioridade; não muda a spec.

### WP4.3 (Vínculo pós-L13) — sem mudança de spec
Apenas a proibição herdada do Replika: **recompensa de Vínculo nunca aparece dentro de
uma célula de coleção como "comprável"**.

### WP4.4 (estações cíclicas) — sem mudança
Duolingo (grade mensal cinza) é a prova de por que a vitrine sazonal **não** vira um
calendário de medalhas perdidas: a estação que passou não deixa slot cinza.

### WP4.5 (sumidouro de Bits) — texto novo de uma linha
Acrescentar à spec: "(d) a vitrine mora na Loja; **nenhuma superfície de coleção
(DreamDex, álbum, bestiário) exibe preço, cadeado ou botão de compra** (Replika = loja
disfarçada de dex; ANTI-PADRÃO do Dossiê 7)."

### WP4.6 (Bestiário + Abismo) — **o dossiê e o grep mudam a spec**

**Por quê:** (1) a evidência "60 nomes invisíveis" é falsa (§0b): são 36 chaves/24
artes/6 nomes, e o jogador **já vê** nome e sprite do inimigo em combate
(`DungeonGame.tsx:392,:397,:498`); (2) o relatório 04 rec. 13 fixa: "se um dia houver
coleção, que seja de FORMAS vividas (rec. 5) e sonhos, nunca de criaturas paralelas";
(3) o achado mais transferível do dossiê inteiro (§15.3) é a **ficha de criatura**, e
o Soulmon tem `unlockedEvolutions` em 4 renders sem ficha nenhuma.

**Texto novo proposto (substitui a spec de WP4.6):**

> **WP4.6 · Álbum de formas vividas + Encontros da masmorra** — M (era G)
> - **Evidência (corrigida):** `unlockedEvolutions` é renderizado em `EvolutionPath.tsx:197`,
>   `EvoTrail.tsx:49`, `PetPage.tsx:205` e `StatsPage.tsx:199` sem ficha, sem data e sem
>   número de catálogo; `DreamDex.tsx` é a única dex e já tem o padrão certo de não
>   obtido (`???` + silhueta, `:135,:155`). A masmorra sorteia de `DUNGEON_LINE_SPRITES`
>   (6 linhas × 4 artes; `enemyKey` = 36 chaves) e `onEnemyDefeated: () => void`
>   (`DungeonGame.tsx:122`) descarta a identidade do inimigo (`App.tsx:2443` só soma
>   `dungeonKills`). `LEGACY_FORM_TIERS` **não** é roster (uso único: `progression.ts:90`).
> - **Spec (a) Álbum:** página `AlbumPage.tsx` no molde do `DreamDex.tsx`, seção
>   "Formas" com uma célula por forma da árvore (11, `EvolutionPath.tsx:80`) — vivida =
>   sprite + nome + `#n` de catálogo (índice fixo na árvore) + data; não vivida = a
>   MESMA receita do DreamDex (`filter grayscale/brightness/opacity` + `???`),
>   **nunca cadeado, nunca "bloqueada", nunca `0/11` no cabeçalho** (fração só aparece
>   quando ≥1, e com o rookie sempre vivido ela nunca é zero — a lição do Finch
>   "impossível estar em zero em todas"). Toque na vivida abre a **ficha na espinha do
>   Finch**: `#n` · sprite · `stageName` em caixa alta · nome · linha de metadados
>   `traço de nascimento (petPassive) · galho` · descrição da forma (a que o Oráculo
>   já gera) · rodapé "Nasceu em {createdAt}" / "Virou {forma} em {data}". Toque na não
>   vivida reusa o `revealed` de sessão do `EvolutionPath.tsx:203` (espiada opt-in que
>   não persiste), não um modal de "você ainda não desbloqueou".
>   Datas exigem `formReachedAt: Record<string, string>` (dayKey do jogador,
>   `playerDayKey`), migração `?? {}`, escrita no `handleEvolve` (`App.tsx:2244`) e no
>   nascimento (`rookie` = `createdAt`). Save antigo sem data mostra `-` (Runna), nunca
>   inventa data.
> - **Spec (b) Encontros:** seção "Encontros" no mesmo `AlbumPage`, agrupada por
>   LINHA (6 grupos × 6 tiers = 36 células, 24 artes; baby-i/ii/rookie da mesma linha
>   mostram o sprite rookie com o tier no rótulo) — fração **por linha** (Finch), e só
>   nas linhas com ≥1. `GameState.encounters: string[]` (chaves `enemyKey`, migração
>   `?? []`, idempotente), escrita ao derrotar: `onEnemyDefeated(enemyKey: string)` —
>   mudança de assinatura em `DungeonGame.tsx:122` e `App.tsx:2442`. Não obtido = a
>   receita do DreamDex. É pequeno (uma run visita 6 tiers de linhas sorteadas; fecha em
>   ~10–15 runs) e é declarado pequeno: não é "conteúdo para meses", é registro.
> - **Spec (c) Abismo:** a justificativa original ("entradas do bestiário de tiers
>   altos") caiu — não existe tier acima de mega nem arte ultra (`sprites.ts:66-70`
>   mapeia ultra em mega). **Abismo fica ADIADO** até haver algo que ele alimente sem
>   inflar Bits (candidato: uma missão semanal do WP4.7 "descer ao Abismo 1×", que é
>   comportamento, e a ficha de Encontros com rótulo "visto no Abismo"). Se entrar,
>   mantém: `ptsMult` congelado no andar 5, perder não custa nada, `MAX_FLOORS` sai de
>   `DungeonGame.tsx:44` para `dungeon.ts`.
> - **Aceite:** `test -f src/components/AlbumPage.tsx`; teste "célula não vivida não
>   renderiza `🔒`, `bloquead`, `locked`, `Not obtained` nem `0/`"; teste de
>   idempotência de `encounters` e de `formReachedAt` (evoluir 2× para a mesma forma
>   não sobrescreve a data); teste "nenhuma célula do álbum contém preço/`Bits`";
>   WP0.7 mede `encounters[]` (≤36 strings) e `formReachedAt` (≤11 pares).
> - **Comando:** `grep -n "onEnemyDefeated" src/components/DungeonGame.tsx` deve mostrar
>   `(enemyKey: string) => void`; `grep -c "grayscale" src/components/AlbumPage.tsx` ≥ 1.

### WP4.7 (missões semanais) — uma linha nova
Tripadvisor (`0/3` ×5 + cadeado) vira aceite negativo: "a aba Missões não exibe fração
zero em série; missão sem progresso mostra só o enunciado." O resto fica.

### WP4.8 ("Memórias" + card) — **o dossiê muda gatilho, piso e composição**

**Correção de referência:** a spec cita "Guia #37/#24". `grep -n "^37\.\|^24\."
docs/guia-experiencia/07-retencao-engajamento.md` → só `24.` existe e é "Widget
iOS/desktop tray parity"; não há `37.`. As fontes reais são: guia 01 lição 18 + item 3
(card mensal), 02 rec. 4 (diário da criatura), 04 rec. 12 (card da cerimônia:
sprite antes/depois + dias de jornada). Trocar a citação.

**Texto novo proposto (substitui a spec de WP4.8):**

> **WP4.8 · Card da forma nova + "Memórias" aos 30/90 dias** — M
> - **Evidência:** nenhuma geração de imagem no app (`grep -rln "navigator.share\|toBlob\|shareCard" src/components` → 0). Dossiê 12: estrutura universal = card 4:5, marca no rodapé, afirmação em 1ª pessoa, **2×2 é o teto**, data de corte; conclusão do dossiê + rel. 04 rec. 12: **o gatilho é a forma nova, não o calendário**; Uxcel (dia 2) e Marriott (quatro zeros) provam a necessidade de piso.
> - **Spec:** `utils/shareCard.ts` (puro: recebe um `MemoryCardData`, devolve o que desenhar; o canvas fica em `MemoriesCard.tsx`). Dois formatos: **4:5** (post) e **9:16** (story) com a faixa superior de ~18% reservada e vazia (Uxcel — onde a UI do Instagram cobre). Composição, de cima para baixo: marca "Soulmon" pequena à esquerda + rótulo do momento à direita ("NOVA FORMA" / "30 DIAS" / "90 DIAS") · **o sprite atual grande ao centro sobre o cenário equipado** (pliability: o tema é o bg que a pessoa já comprou; custo zero) · afirmação em 1ª pessoa: "Meu {petName} virou {forma}" ou "{petName} e eu, {N} dias juntos" · **linhagem** em uma linha (Spotify: nomes, não agregados) — `formNames` com `›` entre eles · **grade 2×2, e só com o que só cresce**: formas vividas, sonhos coletados (`dexProgress`), dias perfeitos totais (`totalPerfectDays`), dias de jornada (desde `createdAt`) · rodapé "em {data}" + o `soulGoal` em itálico se existir (o "porquê", 02 rec. 5) · nada mais. Ações: `Baixar` (sempre; Polarsteps) e `Compartilhar` (só se `navigator.share` existir). **Sem recompensa por compartilhar** (o Duolingo paga; aqui seria uma fonte nova de Bits/Emblemas por ato que não é cuidado — e a criatura é o ativo, não a métrica).
> - **Gatilho:** (1) fim da `EvolutionCeremony` (forma nova); (2) `DailyReportModal` nos dias 30 e 90 desde `createdAt` (uma vez cada, `memoriesShown: number[]` no save). Em ambos, **piso**: o card só é oferecido se as 4 células forem > 0 — e no D30/D90 o card é a vista "Memórias" (02 rec. 4: nascimento, evoluções, sonhos, primeiro dia perfeito), com o botão de compartilhar aparecendo só quando o piso passa. Nunca no D2.
> - **Proibições no card:** constância %, "N das últimas 7", streak, faixa/posição do Torneio, percentil, humor, qualquer número que possa ser menor no card seguinte. Nenhum dado de terceiro, nenhum logo de rede.
> - **Aceite:** `test -f src/utils/shareCard.ts`; teste "com qualquer célula em 0 o card não é oferecido"; teste "o card de um save de 90 dias tem exatamente 4 métricas e todas são funções monótonas do estado" (rodar o mesmo save +1 dia e exigir ≥); render test do 9:16 exigindo a faixa superior vazia; teste de que o texto do card não contém `%`, `streak`, `rank`.
> - **Comando:** `grep -n "totalPerfectDays\|dexProgress\|formNames\|createdAt" src/utils/shareCard.ts` → 4 hits; `grep -c "share_reward\|SHARE FOR" src` → 0.

## 3. Como o não obtido deve aparecer — a régua consolidada para o meu domínio

Seis técnicas no acervo; a escolha é sobre **o que a pessoa sente diante do vazio**:
cadeado = bloqueio, cinza+rótulo = falta, desfoque/branco = mistério, `?` = curiosidade.
Para o Soulmon (tese: nunca cobrador) só o eixo **curiosidade/mistério** serve:

1. **Silhueta cheia + `???`** (já em `DreamDex.tsx:135,:155`) é a receita única de todas as
   coleções: DreamDex, álbum de formas, encontros.
2. **Fração só onde ≥1**, agrupada por subcoleção (Finch/Reddit). Cabeçalho geral só
   quando existir pelo menos uma vivida — e no álbum de formas isso é sempre (rookie).
3. **Data no obtido, `-` no não obtido** (Reddit/Runna). Exige C2.
4. **Número de catálogo no obtido** (Finch) — sugere o tamanho do mundo sem exibir zero.
5. **Ficha só do obtido com a espinha do Finch**; o não obtido tem a espiada opt-in que
   já existe (`EvolutionPath.tsx:203`).
6. A página de Evolução hoje mistura vocabulários: `???` (`:670`, curiosidade) **e**
   "bloqueada/locked" (`:586-587`) na mesma célula. Não é WP meu (é a árvore, WP4.1/4.2
   tocam a regra, não a copy), mas fica registrado: o `aria-label` deveria dizer
   "ainda não vivida", não "bloqueada".

## 4. ANTI-PADRÕES com a proibição citada

| Anti-padrão (app) | Proibição que o barra |
|---|---|
| Cadeado + `Unlocked 0/30` (Withings), cadeado + `0/3` ×5 (Tripadvisor) | Essência (`CLAUDE.md`): "avatar que evolui COM o usuário… nunca um cobrador"; DreamDex já grava a regra local: "A ausência lê como 'ainda não', nunca como erro — nada de vermelho, nada de tracejado de falta" (`DreamDex.tsx:104-107`). |
| `Not obtained` repetido (Me+) | Mesma regra; e transcrição C2 (Freedom Fallacy): sinal desacoplado de satisfação vira ruído. |
| Grade mensal cinza permanente (Duolingo) | `CLAUDE.md` Motor de tarefas: "Se alguém acrescentar um `streak` que zera, desfez a tese do produto"; Fresh start: "perda só sobre item recuperável, nunca sobre identidade ou progresso acumulado". Um mês cinza é perda de identidade fossilizada. |
| Preço na célula da coleção (Replika) | `CLAUDE.md`: "As três moedas nunca se misturam visualmente"; Emblemas/Vínculo "tudo cosmético — há teste travando"; Loja é `ShopModal`, coleção é dex. |
| `top 8%` / `Top 10% Diner` / "more active than 90%" (Duolingo, Beli) | `tournamentTiers.ts` (via `CLAUDE.md` 🎪): "posição absoluta é a leitura associada a comparação tóxica, e a faixa mede o jogador contra ele mesmo". |
| `2%` de raridade sobre forma/sonho (Apple Games, se aplicado à criatura) | §15.3 do próprio dossiê: "só funciona no Soulmon se aplicado a COSMÉTICO, nunca à criatura"; rel. 04 rec. 13 (coleção só de formas vividas e sonhos). |
| Card com zeros + "Feel free to brag" (Marriott), share no dia 2 (Uxcel), `1/7 days` e `3%` (pliability) | Regra da Janela de Descanso (`CLAUDE.md` 🛏️): "nenhuma função devolve número que diminui" + "sem score"; o card é uma função do estado e obedece à mesma régua; piso obrigatório (WP4.8). |
| `SHARE FOR A REWARD` (Duolingo) | Anexo F: fontes de Bits já esgotam o catálogo em D15–D23 — nenhuma fonte nova por ato que não é cuidado; guia 03: canais white-hat não exploram. |
| Barra de compatibilidade que desce (Tolan) | "nenhuma função devolve número que diminui" (`restWindow`); humor "NUNCA alimenta pontuação" (`CLAUDE.md` 😊). |
| Foto do usuário no card (pliability) | `CLAUDE.md` WP4.8: "sem dado de terceiro"; nenhuma câmera/sensor ("Sem sensor nenhum", 🛏️). |

## 5. Candidatos a WP novos (SEM número) — só lacuna real

**C1 · Corrigir a evidência do "roster de 60" nas três fontes** — PP
- Lacuna: `F-conteudo.md` (§ Sonhos/missões/coleção, "Bestiário: NÃO EXISTE… 60 nomes"),
  `ledger/permanencia.md` (linha WP4.6, "60 nomes de arte invisíveis hoje") e
  `PLANO-MELHORIAS.md` (WP4.6, evidência) afirmam o que `grep` desmente (§0b). O
  comentário `progression.ts:57-59` é a origem do erro.
- Spec: trocar por "6 linhas × 4 artes (`DUNGEON_LINE_SPRITES`), 36 chaves
  (`enemyKey`), 6 nomes; `LEGACY_FORM_TIERS` = só `LEGACY_LEVEL_OF`"; atualizar o
  comentário de `progression.ts` para o que `CLAUDE.md` já diz ("só compatibilidade de
  save; não é roster de nada").
- Aceite: `grep -rn "60 nomes" docs/plano-melhorias` → 0; teste que afirma que
  `getDungeonEnemySprite` nunca devolve um nome fora de `DUNGEON_LINE_NAMES`.
- Comando: `grep -n "Roster \"selvagem\"" src/types/progression.ts` → 0.

**C2 · Datar as coleções (formas e sonhos)** — P
- Lacuna: `rest.dreams: string[]` (`restWindow.ts:107`) e `unlockedEvolutions: string[]`
  (`GameStateContext.tsx:187`) não guardam **quando**. Reddit/Runna/Me+/Finch datam o
  obtido; é o que faz a coleção ser *daquela pessoa* e é insumo do card (WP4.8) e da
  ficha (WP4.6).
- Spec: `formReachedAt: Record<string,string>` e `rest.dreamDates: Record<string,string>`
  (dayKey do jogador via `playerDayKey`, nunca `toDateString`), migração `?? {}`,
  escrita em `handleEvolve` (`App.tsx:2244`) e em `recordNight`/`:553` (onde
  `dreams` recebe o id). Sem data → `-`. Nunca retroalimenta pontuação.
- Aceite: teste "coletar o mesmo sonho 2× não muda a data"; teste de hidratação com
  save antigo (sem os campos) rendendo `-` na célula.
- Comando: `grep -n "formReachedAt\|dreamDates" src/contexts/GameStateContext.tsx src/utils/restWindow.ts` ≥ 2.

Não proponho WP para "ficha da forma" nem para "piso de compartilhamento": ambos cabem
dentro de WP4.6 e WP4.8 reescritos acima, e abrir pacote novo duplicaria dono.

## 6. Confirmação por grep — o DreamDex já usa os padrões do dossiê?

`grep -n "…" src/components/DreamDex.tsx` (287 linhas):

| Padrão do Dossiê 7 | Presente? | Onde |
|---|---|---|
| Silhueta / forma sem detalhe (Reddit, Runna) | **Sim** | `:135` `filter: owned ? 'none' : 'grayscale(1) brightness(0.35) opacity(0.6)'`; comentário `:129-134` "SILHUETA, não falta". |
| `?` de curiosidade (Finch) | **Sim, em texto** | `:155` `{owned ? label : '???'}`; `:90` `aria-label` "Sonho ainda não descoberto". |
| Fração por subcoleção (Finch) | **Parcial** | `:164` `dexProgress` → "X de Y" (`:184`); `:233` calcula `got` por raridade. |
| Barra só onde há progresso (Reddit) | **Não** | Barra renderiza sempre (`ratio` em `:166`, sem condicional); compensada pela copy de zero-state `:217`. |
| Data no obtido | **Não** | `grep -n "date\|data\b\|Date" DreamDex.tsx` → 0 (não há campo no estado). |
| Número de catálogo (Finch `#25`) | **Não** | `grep -n "#\${" DreamDex.tsx` → 0. |
| Cadeado / `Not obtained` / vermelho (Withings, Me+) | **Ausentes, de propósito** | `grep -n "🔒\|lock\|Not obtained\|red" DreamDex.tsx` → 0; `:104-107` proíbe. |
| Ficha de detalhe (Finch §15.3) | **Não** | `grep -n "onClick\|dialog\|Sheet\|detail" DreamDex.tsx` → 0. |
| Preço na célula (Replika) | **Ausente** | `grep -n "shop\|Bits\|currenc" DreamDex.tsx` → 0. |

Veredito: o DreamDex é o **molde correto** — está no eixo curiosidade/mistério e recusa
os três anti-padrões. O que lhe falta (data, `#`, ficha) é exatamente o que os
candidatos C2 e o WP4.6 reescrito acrescentam.

## 7. Estado dos WPs e a conta de Bits

| WP | Estado | Efeito do dossiê |
|---|---|---|
| 4.1 | `BLOQUEADO:D5` | nenhum |
| 4.2 | `BLOQUEADO:D6` | nenhum (o álbum torna o problema visível) |
| 4.3 | `PROPOSTO` | proibição de "comprável" na coleção |
| 4.4 | `PROPOSTO` | nenhum |
| 4.5 | `PROPOSTO` | +1 linha (nenhuma coleção exibe preço) |
| 4.6 | `PROPOSTO` → **REESCREVER** | evidência falsa (§0b); vira Álbum de formas + Encontros; Abismo adiado; G → M |
| 4.7 | `PROPOSTO` | +1 aceite negativo (sem `0/3` em série) |
| 4.8 | `PROPOSTO` → **REESCREVER** | gatilho = forma nova; piso; 2×2 monótono; 4:5 + 9:16; referência "#37/#24" inválida |

**Conta de Bits:** nenhum WP deste documento cria fonte ou sumidouro. O Abismo (se
entrar) mantém `ptsMult` congelado; o card não paga por compartilhar; Encontros e
Álbum não vendem nada. **O catálogo permanente (53 itens, 8.540 Bits) continua
esgotando em D15–D23** (D15–D18 com 5 amigos), como no anexo F.
