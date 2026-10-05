# Inventário de assets novos: Combate v3 + progressão (run `combate-v3-01`)

> Alpha · Product Designer, 05/10/2026. **Só planejamento**: nenhuma imagem gerada, nenhum código alterado.
> Fontes: `contexto.md` §2.1–§2.14, stories PR1–PR11, `BACKLOG-ARTE-GERAR.md`, `NARRATIVA-E-UNIVERSO.md` §5.8 e §12, `attackFxArt.ts`, varredura de `src/assets/` por pasta.
> **Rev. 2**: revisado pelo `alpha-design-critic`; os fixáveis foram aplicados e as decisões do dono estão na §0.
> ⚠️ A extensão do Chrome ainda não está conectada. **Não gerar** até o aviso.

## 0. Decisões do dono, já aplicadas

| # | Decisão |
|---|---|
| M1 | Arte nova **LIBERADA** P0+P1. Supera, para estes assets, a §10 e o "só reuso" do PR11. Som continua fora (R-NOVA). |
| M2 | Level do Soulmon = **`Lv N`** abreviado. Nunca "nível" por extenso, nunca "KO"/"morte" (NARRATIVA §12). |
| M3 | **3 slots**, um por atributo: Núcleo→ATK, Carapaça→DEF, Rastro→SPD. Tier comprado direto, sem RNG. |
| M4 | Maré de sorte **OCULTA**. A mecânica fica, a arte não existe. |
| C1 | Debuff de DEF racha **só fora do corpo**: escudo rachado + chevrons ▼. **Nenhuma rachadura na silhueta da criatura** (NARRATIVA §5.8). |
| C2 | `gate-arena` é **peça nova e distinta**. Não anexar `icon-game-tournament.png` como referência. |

## 1. Regras de formato (valem para todas as linhas)

| Regra | Valor |
|---|---|
| Estilo | Pixel art 16-bit nítida, contorno `#0D0D0D`, **mais 1 px de borda clara `#6EFFF8` por fora do contorno** (o `#0D0D0D` sozinho sobre `#0B3A40` dá cerca de 1,4:1 e some). Luz no topo à esquerda, sem blur. Referência sempre anexada: `docs/ui-refs/REF-kit-v12.png` + o irmão indicado no lote. |
| Paleta | `#0B3A40` · `#6EFFF8` · `#C68642` · `#1E9EFE` · `#0D0D0D` · **âmbar-negativo `#D9822B`** (novo, para debuff/maldição/DoT). Proibidos magenta, roxo, violeta, rosa e verde. |
| Contraste sobre `#0B3A40` (L = 0,034, WCAG 2.x) | cobre `#C68642` **4,1:1** ✓ · elétrico `#1E9EFE` **4,4:1** ✓ · ciano `#6EFFF8` cerca de **10,7:1** ✓ · âmbar `#D9822B` **4,3:1** ✓ · ~~ferrugem escura `#A0602A` 2,5:1~~ ✗, proibida como preenchimento. Meta 1.4.11: ≥ 3:1. |
| Ícone UI | 128² nativo, exibido a 20–48 px. |
| Glifo de status | 64² nativo, exibido a 16–24 px. No máximo 2 cores internas. |
| FX | Frames de 128² em **grade 3×2, 1:1** (6 frames). Círculo de cast: 256² solo. **Toda partícula ciano leva contorno `#0D0D0D`** (sem contorno, ela some no fundo claro do Torneio). |
| Fundo de geração | **Todas as folhas e peças em `#00FF00` chapado.** Fatiar por projeção (`scripts-arte/_fatiar.mjs`), depois chroma-key → despill → ilhas <24 px → bbox → nearest (`chroma-key.mjs`). Nenhuma peça pode ter verde. |
| Aceite de legibilidade | Cada glifo é testado **a 16 px, sobre `#0B3A40`, em escala de cinza**. Se dois glifos se confundirem em cinza, um dos dois é regerado. Obrigatório para `st-buff-atk` × `st-buff-spd` e para `st-hot` × `st-cura`. |
| Acessibilidade | Status = **silhueta + seta + texto** (`aria-label` "efeito, N turnos"). No movimento reduzido saem as partículas: ficam o glifo estático, o contador e um flash único. |
| Um dono por silhueta | Cada forma pertence a **um** asset, e os derivados (glifo, família) a reusam sem desenhar de novo. Punho = `strike-melee`. Espada = `attr-atk`. Bota alada = `attr-spd`. Escudo = `attr-def`. Hexágono = `st-escudo`. Cruz = `st-cura`. |
| Prioridade | **P0** bloqueia o PR consumidor · **P1** a tela tem fallback, mas fica pobre · **P2** acabamento. |

Legenda de "Já existe": **reuso** `caminho` (verificado por Glob na pasta) · **derivar** (Pillow/tint, sem gerador) · **novo** (gerar) · **CSS**. Os caminhos são relativos a `src/assets/soulmon/`, salvo indicação.

---

## G1 · Vínculo (level do usuário), PR7

| id | descrição (EN / PT) | tipo | tam | estados | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|---|---|
| `vinculo-badge` | Insígnia do Vínculo, número em CSS (Bond / Vínculo) | ícone | 128² | 1 | F1 | P0 | PR7 | novo |
| `vinculo-meter` | Barra até o próximo Vínculo | UI | 9-slice | vazio/parcial/cheio | — | P0 | PR7 | **reuso** `hud/bar-frame-96x8.png` + `hud/bar-fill-6.png` (tint cobre) |
| `vinculo-levelup` | "Vínculo N", sem "faltam…" | FX | 256² | aplicar/repouso/reduzido | — | P1 | PR7 | **derivar** `fx/gain-levelup.png` (tint cobre) |
| `talent-point-chip` | Ponto de talento (Talent point / Ponto de talento) | ícone | 64² | disponível / 0 (cinza) | F1 | P0 | PR7 | novo |
| `gate-arena` | Duelo PvP | ícone | 128² | aberto/fechado (+ cadeado sobreposto) | F1 | P0 | PR7 | **novo** (C2) |
| `gate-torneio` | Torneio (as arenas) | ícone | 128² | idem | F1 | P0 | PR7 | novo, distinto do `gate-arena` |
| `gate-andar` | Andares altos (o andar 1 nunca tem cadeado) | ícone | 128² | idem | — | P0 | PR4/PR7 | **reuso** `icones-ui/masmorra-escada.png` |
| `gate-renascer` | Renascimento (pago + Vínculo) | ícone | 128² | idem | — | P0 | PR7 | **reuso** `fx/ovo-renascimento.png` (reduzir) |
| `gate-lock-overlay` | Cadeado do gate | ícone | 48² | fechado/aberto | — | P0 | PR7 | **reuso** `icones-ui/interacao/status-cadeado.png`, `status-cadeado-aberto.png` |

## G2 · Level do Soulmon, PR2

| id | descrição | tipo | tam | estados | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|---|---|
| `soul-xp-bar` | Barra de XP | UI | 9-slice | vazio/parcial/cheio/teto | — | P0 | PR2 | **reuso** `progress/bar-smooth-xp-cyan.png` |
| `soul-lv-badge` | Selo `Lv N` | ícone | 64² | normal / no teto | F1 | P0 | PR2 | novo |
| `soul-cap-mark` | Teto da forma (Form cap): entalhe, não cadeado | ícone | 32² | 1 | F1 | P0 | PR2 | novo |
| `soul-levelup` | `Lv` subiu | FX | 256² | aplicar/reduzido | — | P1 | PR2 | **reuso** `fx/gain-levelup.png` |
| `soul-leveldown` | `Lv` desceu, **neutro**: onda calma baixando, sem seta vermelha nem tremor | ícone | 64² + fade CSS | 1 + reduzido (troca seca) | F1 | P0 | PR2 | novo |
| `soul-xp-gain-pop` | "+XP" | UI | — | — | — | P1 | PR2 | **CSS** |

## G3 · Árvore de talentos, PR7

### G3a · Estrutura

| id | descrição | tipo | tam | estados | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|---|---|
| `talent-path-pvp` | Emblema Duelo: **losango** elétrico | ícone | 128² | ativo/inativo (CSS) | F2 | P0 | PR7 | novo |
| `talent-path-pve` | Emblema Fendas: **escudo-arco** cobre | ícone | 128² | idem | F2 | P0 | PR7 | novo |
| `talent-path-comercio` | Emblema Comércio: **círculo-moeda** ciano | ícone | 128² | idem | F2 | P0 | PR7 | novo |
| `talent-root-pvp/pve/com` | Nó-raiz de cada caminho (3) | UI | 128² | 3 | F2 | P1 | PR7 | novo |
| `talent-node-locked/available/bought` | Moldura de nó (3): travado (cinza + cadeado) · disponível (borda dupla) · comprado (cheio + check). A diferença está na forma, não só na cor | UI | 96² | 3 | F2 | P0 | PR7 | novo. Os nós do Soul Link (A4) **não foram localizados em `src/assets`**: se o PR achar o PNG via `nodeArt.tsx`, anexar como referência |
| `talent-connector` | Conector: tracejado (inativo) / contínuo (ativo) | UI | — | 2 | — | P0 | PR7 | **CSS** |
| `talent-respec` | Redistribuir talentos, sempre pago (Reset talents / Redistribuir talentos) | ícone | 64² | habilitado / sem Bits | F1 | **P0** | PR7 | **novo**: `icons/icon-reset.png` existe, mas tem xadrez assado e não serve |
| `talent-tree-bg` | Painel | UI | 9-slice | — | — | P2 | PR7 | **reuso** `hud/frame-pipe-vine-96.png` |

### G3b · 21 ícones de talento (96², P0, PR7, novos). Silhuetas desduplicadas contra G4/G6/G7/G8

| id | efeito proposto | silhueta (única) |
|---|---|---|
| `tal-pvp-01` | +% ATK no Duelo | ponta de losango furando um anel |
| `tal-pvp-02` | +% DEF no Duelo | braçadeira com cravo em losango |
| `tal-pvp-03` | +% SPD no Duelo | flecha de investida com 3 linhas |
| `tal-pvp-04` | energia inicial do especial | raio dentro de um frasco |
| `tal-pvp-05` | torcida +% (≤ ±25%) ⚠️ | mão aberta com ondas sonoras |
| `tal-pvp-06` | DoT recebido −% | brasa abafada sob tampa |
| `tal-pvp-07` | capstone: +1 turno de buff | emblema-losango coroado por estrela |
| `tal-pve-01` | +% ATK na fenda | garra de três unhas |
| `tal-pve-02` | +% DEF na fenda | muro de blocos de pedra |
| `tal-pve-03` | cura recebida +% | gota ciano subindo num anel |
| `tal-pve-04` | Bits da fenda +% | agulha de bússola |
| `tal-pve-05` | +% contra Pesadelo | lua crescente com olho |
| `tal-pve-06` | escudo do especial +% | arco de luz sobre uma criatura pequena |
| `tal-pve-07` | capstone: começa com escudo leve | emblema-arco coroado por estrela |
| `tal-com-01` | preço de equipamento −% | etiqueta de preço |
| `tal-com-02` | fragmentos +% | dois fragmentos se juntando |
| `tal-com-03` | respec mais barato | ampulheta sobre moeda |
| `tal-com-04` | +1 espaço na mochila | bolsa com alça |
| `tal-com-05` | conveniência de câmbio ⚠️ (não mexe no teto de 25%) | balança |
| `tal-com-06` | Bits de missão +% | pergaminho enrolado |
| `tal-com-07` | capstone: desconto rotativo determinístico | emblema-moeda coroado por estrela |

⚠️ `tal-pvp-05` e `tal-com-05` encostam em linha vermelha. O PR7 confirma ou corta, e a arte só sai depois.

## G4 · Golpe e ofício, PR1b/PR9

O FX por elemento já existe: 924 peças em `fx-ataque/` (ex.: `fx-fogo-{cast,aura,slash,impact,defended,orb}.png`, verificado). **Não gerar FX elemental.**

| id | descrição | tipo | tam | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|---|
| `strike-melee` | Corpo a corpo (Melee / Corpo a corpo): **dono do punho** | ícone | 64² | F4 | P1 | PR1b | novo |
| `strike-ranged` | À distância (Ranged / À distância) | ícone | 64² | — | P1 | PR1b | **reuso** `icons/icon-target.png` |
| `oficio-combate_fisico` | Ofício físico: antebraço enfaixado, mão aberta (sem punho) | ícone | 96² | F4 | P1 | PR9 | novo |
| `oficio-longo_alcance` | Arco com flecha | ícone | 96² | F4 | P1 | PR9 | novo |
| `oficio-conjuracao` | Conjuração | ícone | 96² | — | P1 | PR9 | **reuso** `icons/icon-spellbook.png` |
| `oficio-evocacao` | Orbe de runa subindo da palma | ícone | 96² | F4 | P1 | PR9 | novo |
| `oficio-benca` | Halo sobre mãos em concha | ícone | 96² | F4 | P1 | PR9 | novo |
| `oficio-maldicao` | Tábua de runa rachada em âmbar, sem caveira | ícone | 96² | F4 | P1 | PR9 | novo |
| `familia-*` (7) | Família do especial na ficha | ícone | 64² | — | P1 | PR9 | **derivar** dos glifos G6 + `attr-*` (mesmo dono) |

## G5 · FX de combate, PR11

Ciclo: **aplicar** (frames 1–2) → **ativo** (3–6 em loop) → **expirar** (pisca 2× e some). No reduzido, o glifo G6 fica fixo, com contador e flash único.

| id | descrição | tipo | tam | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|---|
| `fx-cast-circle` | Círculo de cast do especial, tint por elemento em runtime | FX | 256² solo | solo | P0 | PR11 | novo (complementa `fx-ataque/fx-<el>-cast.png`) |
| `fx-cast-seal` | Selo do nome próprio (só o nome) | UI | 9-slice | — | P0 | PR1b/PR9 | **derivar** do `SpecialBanner` + `hud/frame-pipe-vine-96.png` |
| `fx-buff-loop` | Partículas ciano **subindo** + chevrons ▲ | FX | 3×2 de 128² | F5b | P0 | PR11 | novo |
| `fx-debuff-loop` | Escudo rachado flutuando **fora** do corpo + chevrons ▼ caindo (C1) | FX | 3×2 | F5b | P0 | PR11 | novo |
| `fx-maldicao-loop` | Elos de corrente âmbar orbitando em anel | FX | 3×2 | F5b | P1 (inalcançável, Q-FX1) | PR11 | novo |
| `fx-dot-tick` | Gotas-brasa âmbar pingando + flash de tick | FX | 3×2 | F5b | P0 | PR11 | novo (não usar `fx-fogo-impact`: é elemental) |
| `fx-cura-burst` | Cruz ciano expandindo | FX | 128² | — | P0 | PR11 | **reuso** `fx/fx-heal.png` |
| `fx-hot-loop` | Anel aberto girando lento + cruzes pequenas | FX | 128² | — | P1 (inalcançável) | PR11 | **derivar** `fx/fx-heal.png` + silhueta do `st-hot` |
| `fx-escudo-loop` | Bolha; ao quebrar, estilhaça | FX | 128² | — | P0 | PR11 | **reuso** `fx/fx-shield.png` + `fx/fx-corrida-estilhaco-sheet.png` |
| `fx-status-expire` | Puff de expiração | FX | 64² | — | P2 | PR11 | **reuso** `fx/move-poof.png` |
| `fx-target-down` | Alvo derrubado: **se desfaz / volta à camada**. A forma se solta em fiapos ciano que descem, e os status somem. Rótulo EN "fades back to the layer", PT "volta à camada" | FX | 3×2 | F5c | P1 | PR11 | **novo** (não reusar `fx/fx-defeat.png`) |

## G6 · Glifos de status no HUD, PR11 (8 novos, 64², folha F5a)

Contador de turnos e "+k" de excedente em CSS. Todos são **novos**: a cura e o escudo deixam de ser reuso, para a folha sair coerente.

| id | kind | silhueta | dono da forma | prio |
|---|---|---|---|---|
| `st-buff-atk` | buff ATK | espada + ▲ | `attr-atk` | P0 (aceite só após teste 16 px em cinza contra `st-buff-spd`) |
| `st-buff-spd` | buff SPD | bota alada + ▲ | `attr-spd` | P0 (idem) |
| `st-debuff-def` | debuff DEF | escudo rachado + ▼ | `attr-def` | P0 |
| `st-maldicao` | maldição | elo de corrente | próprio | P1 |
| `st-dot` | DoT | gota-brasa | próprio | P0 |
| `st-cura` | cura | cruz cheia | próprio | P1 |
| `st-hot` | HoT | **cruz dentro de anel aberto** (anel com abertura a 1h) | próprio | P1 (aceite só após teste 16 px contra `st-cura`) |
| `st-escudo` | escudo | **hexágono** | próprio | P0 |
| `st-overflow` | "+k" | — | — | P0, **CSS** |

## G7 · Atributos e chips, PR2/PR6

| id | descrição | tam | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|
| `attr-atk` | ATK: **espada curta** (dono) | 128² | F4 | P0 | PR2 | novo. Não reusar `atributo-poder` (Poder é galho, não atributo) |
| `attr-spd` | SPD: **bota alada** (dono) | 128² | F4 | P0 | PR2 | novo. Não usar `icones-ui/energia.png` (é a energia do especial) |
| `attr-def` | DEF: escudo (dono) | 128² | — | P0 | PR2 | **reuso** `icons/icon-shield.png` |
| `attr-hp` | HP | 128² | — | P0 | PR2 | **reuso** `icones-ui/hp.png` |
| `attr-dist-cap` | Marca de concentração máx. 45% | — | — | P1 | PR2/PR6 | **CSS** |
| `chip-*` (3) | Chips: só pontos de tipo, só na evolução | — | — | — | PR6 | **reuso** `items/item-chip-{power,harmony,benevolence}.png` |
| `chip-legacy-tag` | Tag de efeito antigo | — | — | P2 | PR6 | **CSS** |

## G8 · Equipamento e moeda, PR8 (M3; sem RNG; só moeda ganha)

| id | descrição | tam | estados | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|---|
| `slot-nucleo/carapaca/rastro` | Slot vazio com silhueta (gema facetada / placa curva / tornozeleira) | 96² | vazio/equipado/bloqueado | F7 | P0 | PR8 | novo |
| `eq-<slot>-t1/t2/t3` | 9 itens iniciais; o tier mostra lapidação crescente, não sorte | 96² | normal/equipado (CSS) | F7 | P0 | PR8 | novo |
| `fragmento` | Fragmento de equipamento (Shards / Fragmentos) | 64² | 1 | F7 | P0 | PR8 | novo: `fx/cristal-moeda.png` existe, mas já tem leitura de moeda e confundiria |
| `rarity-frame-1/2/3` | Moldura de tier com 1/2/3 entalhes | 96² | 3 | — | P0 | PR8 | **derivar** `molduras/loja-cristal.png` |
| `slot-comercio-paid` | Slot extra do Comércio | 96² | bloqueado/liberado | — | P1 | PR8 | **derivar** do slot + cadeado |
| `moeda-bits` · `moeda-creditos` | Moedas | — | — | — | — | PR8 | **reuso** `icones-ui/moeda-bits.png`, `icones-ui/moeda-creditos.png` |
| `cambio-cap` | Teto diário de câmbio (neutro) | 64² | 1 | — | P1 | PR8 | **reuso** `icons/icon-clock.png` |
| `shop-equip` | Vitrine | — | vazio/compra/erro/offline | — | P1 | PR8 | **reuso** `areas/lote-loja-itens.png` + `npcs/npc-loja-itens.png` |

## G9 · Missão e especial

| id | descrição | tam | folha | prio | PR | já existe |
|---|---|---|---|---|---|---|
| `mission-card` | Card de missão na home (sessão irmã: não tocar) | — | — | — | — | **reuso** `icones-ui/quest.png` + `icones-ui/interacao/recompensa-*.png` |
| `mission-xp-reward` | Recompensa "XP do Soulmon": estrela com faísca subindo | 64² | F1 | P1 | PR2 | novo |
| `special-energy` | Carga do especial (enche e zera) | — | — | — | PR1b | **reuso** `src/assets/icons/especial-carga-{0-vazio,1-meio,2-cheio}.png` |

---

## Totais (rev. 2)

| Grupo | Novo (gerar) | P0 | P1 | Derivar | Reuso | CSS |
|---|---|---|---|---|---|---|
| G1 Vínculo | 4 | 4 | 0 | 1 | 4 | 0 |
| G2 Level do Soulmon | 3 | 3 | 0 | 0 | 2 | 1 |
| G3a Estrutura | 10 | 7 | 3 | 0 | 1 | 1 |
| G3b Talentos | 21 | 21 | 0 | 0 | 0 | 0 |
| G4 Golpe/ofício | 6 | 0 | 6 | 7 | 2 | 0 |
| G5 FX | 6 | 4 | 2 | 2 | 3 | 0 |
| G6 Status | 8 | 5 | 3 | 0 | 0 | 1 |
| G7 Atributos | 2 | 2 | 0 | 0 | 5 | 2 |
| G8 Equipamento | 13 | 13 | 0 | 4 | 4 | 0 |
| G9 Missão | 1 | 0 | 1 | 0 | 2 | 0 |
| **Total** | **74** | **59** | **15** | **14** | **23** | **5** |

A rev. 2 subiu de cerca de 62 para 74 peças: G6 virou 8 novos, nós, respec e fragmento viraram novos, e `fx-target-down` foi criado. Nenhuma peça P2 nova.

## Lotes (7 lotes = 14 conversas Gemini: 8 folhas + 6 de FX; tudo em `#00FF00`)

| Lote | Folha | Grade | Peças | Destrava |
|---|---|---|---|---|
| 1 | F5a status | 3×3 (1 vazia) | 8 | PR11 |
| 2 | F1 HUD de progressão | 3×3 | 9: `vinculo-badge`, `talent-point-chip`, `gate-arena`, `gate-torneio`, `soul-lv-badge`, `soul-cap-mark`, `soul-leveldown`, `talent-respec`, `mission-xp-reward` | PR2, PR7 |
| 3 | F4 atributos, golpe, ofício | 3×3 (1 vazia) | 8: `attr-atk`, `attr-spd`, `strike-melee`, 5 ofícios | PR2, PR9 |
| 4 | F2 árvore | 3×3 | 9: 3 emblemas, 3 raízes, 3 molduras | PR7 |
| 5 | F3a/b/c talentos | 3×3 (2 vazias) ×3 | 21 | PR7 |
| 6 | F5b/F5c FX (1 conversa por FX) + cast solo | 3×2 por FX | 6: buff, debuff, DoT, maldição, target-down, círculo | PR11 |
| 7 | F7 equipamento | 4×4 (3 vazias) | 13 | PR8 (gera antes; o merge espera o desbloqueio) |

**Total: 74.** Depois de cada folha: fatiar, rodar `assets.contract.test.ts`, fazer o teste de 16 px em cinza sobre `#0B3A40` e conferir o hash contra a geração anterior.

## Prompts Gemini (EN, prontos para colar)

O bloco **[STYLE]** entra em todo prompt:

> [STYLE] Crisp 16-bit pixel art, hard pixel edges, no blur, near-black #0D0D0D outline with an extra 1-pixel light cyan #6EFFF8 rim OUTSIDE the outline, light source top-left. STRICT palette only: deep teal #0B3A40, neon cyan #6EFFF8, copper #C68642, electric blue #1E9EFE, warm amber #D9822B, outline #0D0D0D, plus lighter tints of these. ABSOLUTELY NO magenta, purple, violet, pink or green anywhere, not in glows, halos, rims or anti-aliasing. No text, letters or numbers. Match the attached references exactly.

O bloco **[SHEET]** entra em toda folha:

> on a solid flat pure green #00FF00 background, with wide even green gaps between items. Each item is a CUT-OUT object floating alone: no frame, no tile, no background shape, no green inside the item and no green fringe.

**Lote 1 · F5a.** Anexar `docs/ui-refs/REF-kit-v12.png` + `src/assets/soulmon/icones-ui/atributo-poder.png`.
> A sprite sheet of 8 small pixel-art status icons for a battle HUD in a 3×3 grid (last cell empty) [SHEET] Each must read at 16 pixels in grayscale, with a bold unique silhouette and at most 2 inner colors. In order: 1) a short copper sword with a bold upward chevron; 2) a winged boot with a bold upward chevron; 3) a cracked shield with a bold downward chevron; 4) a single heavy chain link in warm amber; 5) a single falling ember-drop in warm amber; 6) a solid cyan plus-shaped cross; 7) a small cyan plus-cross inside an OPEN ring with a gap at the top right; 8) a plain cyan hexagon barrier. No two icons share an outline shape. [STYLE] Square 1:1 full-bleed composition.

**Lote 2 · F1.** Anexar `REF-kit-v12.png` + `src/assets/soulmon/icones-ui/moeda-emblema.png`. **Não** anexar o ícone do Torneio.
> A sprite sheet of 9 pixel-art UI icons in a 3×3 grid [SHEET] In order: 1) a round copper bond insignia of two intertwined cyan threads with an empty center; 2) a small glowing cyan diamond seed; 3) two facing creature silhouettes across a single glowing line on the ground (one-on-one duel); 4) a tall copper banner on a pole above a stepped stone circle (tournament grounds); 5) a teal hexagonal badge with a copper rim and empty center; 6) a tiny copper bracket-shaped notch; 7) a calm cyan wave settling lower, neutral, no arrow and no red; 8) a cyan star with a small rising spark; 9) a circular double arrow in cyan and copper (reset). [STYLE] Square 1:1 full-bleed composition.

**Lote 3 · F4.** Anexar `REF-kit-v12.png` + `src/assets/soulmon/icones-ui/atributo-poder.png` + `src/assets/soulmon/icons/icon-spellbook.png`.
> A sprite sheet of 8 pixel-art icons in a 3×3 grid (last cell empty) [SHEET] In order: 1) a short copper sword pointing up; 2) a winged boot with speed streaks; 3) a clenched fist with impact lines (the ONLY fist in the set); 4) a bandage-wrapped forearm guard with an OPEN hand, no fist; 5) a drawn bow with an arrow; 6) a rune orb rising from an open palm; 7) a soft cyan halo over cupped hands; 8) a cracked rune tablet with warm amber cracks, no skull. [STYLE] Square 1:1 full-bleed composition.

**Lote 4 · F2.** Anexar `REF-kit-v12.png` (+ o PNG dos nós do Soul Link, se o PR o localizar).
> A sprite sheet of 9 pixel-art talent-tree pieces in a 3×3 grid [SHEET] Row 1, path emblems: an electric blue DIAMOND crest; a copper SHIELD-ARCH crest; a neon cyan COIN-CIRCLE crest. Row 2: larger ornate root nodes with the same three shapes and colors and an empty center. Row 3: square-ish crystal node frames with an empty center: LOCKED (dark desaturated teal with a tiny padlock), AVAILABLE (bright cyan double border), PURCHASED (solid copper fill with a small check mark). [STYLE] Square 1:1 full-bleed composition.

**Lote 5 · F3a/F3b/F3c** (uma conversa por folha). Anexar `REF-kit-v12.png` + o emblema do caminho aprovado no Lote 4.
> A sprite sheet of 7 pixel-art talent icons in a 3×3 grid (last two cells empty) [SHEET] Dominant accent: <COLOR>. In order: <LIST>. [STYLE] Square 1:1 full-bleed composition.
- F3a, `<COLOR>` electric blue #1E9EFE: diamond tip piercing a ring; bracer with a diamond stud; dashing arrow with three speed lines; lightning bolt inside a flask; open hand with sound waves; ember smothered under a lid; diamond crest crowned by a star.
- F3b, `<COLOR>` copper #C68642: three-nail claw; wall of stone blocks; cyan drop rising into a ring; compass needle; crescent moon with an eye; arch of light over a small creature; shield-arch crest crowned by a star.
- F3c, `<COLOR>` neon cyan #6EFFF8: price tag; two shards joining; hourglass over a coin; satchel with a strap; balance scale; rolled scroll; coin crest crowned by a star.

**Lote 6 · F5b/F5c** (uma conversa por FX). Anexar `REF-kit-v12.png` + `src/assets/soulmon/fx/fx-corrida-faisca-sheet.png` + o glifo correspondente aprovado no Lote 1.
> A pixel-art animation sheet of 6 frames in a 3×2 grid, each frame a 128×128 cell [SHEET] Every cyan particle has a #0D0D0D outline. Frames 1–2 = apply (one bright flash); frames 3–6 = seamless loop. Effect: <FX>. Leave an empty creature-sized space in the center of each frame; never draw on or crack the creature itself. [STYLE] Square 1:1 full-bleed composition.
- buff: cyan particles rising, with bold upward chevrons.
- debuff: a cracked shield floating BESIDE the empty center, with amber downward chevrons falling; nothing cracks in the center.
- DoT: warm amber ember drops dripping down.
- curse: amber chain links orbiting in a ring.
- target-down: a soft outline that loosens into cyan threads drifting downward and fading, calm, no skull, no explosion.

**Lote 6 · círculo de cast** (peça solta).
> A single pixel-art casting circle seen from slightly above, lying flat: concentric neon cyan rings, copper rune ticks, an electric blue inner glyph ring, empty center, on a solid flat pure green #00FF00 background, with no green and no green fringe in the circle. [STYLE] Square 1:1 full-bleed composition.

**Lote 7 · F7.** Anexar `REF-kit-v12.png` + `src/assets/soulmon/molduras/loja-cristal.png` + `src/assets/soulmon/items/item-chip-power.png`.
> A sprite sheet of 13 pixel-art creature equipment icons in a 4×4 grid (last three cells empty) [SHEET] Row 1: three empty slot silhouettes in dark teal outline: a faceted CORE gem socket, a curved CARAPACE plate, a TRAIL anklet ring. Rows 2–4: CORE, CARAPACE and TRAIL in three tiers each, showing visible craftsmanship growth (tier 1 plain copper, tier 2 polished copper with cyan inlay, tier 3 ornate with an electric blue crystal). Final cell: two small cyan shards that fit together (fragment). [STYLE] Square 1:1 full-bleed composition.
