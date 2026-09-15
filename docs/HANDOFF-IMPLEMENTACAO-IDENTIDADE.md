# Handoff — Implementação da UI de Identidade (Fase 2, mão na massa)

> **Para:** uma sessão nova do Claude Code, especialista em implementação de
> identidade visual no Soulmon (código real, não canvas).
> **Não substitui** [`HANDOFF-IDENTIDADE.md`](HANDOFF-IDENTIDADE.md) — aquele
> é o PROCESSO (canvas primeiro, por fluxo, checkpoint do dono). Este é o
> INVENTÁRIO DE MATERIAL: o que existe pra construir com, e como classificar
> cada tela antes de tocar código.
> **Data:** 15/09/2026.

---

## 0. Leia nesta ordem

1. [`docs/manual/04-IDENTIDADE-VISUAL.md`](manual/04-IDENTIDADE-VISUAL.md) —
   a tese "O Visor" (§1), os 50 tokens `--sm2-*` (§2.8), tipografia (§4),
   ícones (§5), motion (§6), palco/decoração (§7), sourcing de arte (§8),
   e **§11 "no ar × plano"** — o raio-x mais importante deste doc: o que já
   está implementado vs. o que só existia no plano antigo.
2. [`src/styles/tokens.md`](../src/styles/tokens.md) — contrato executável
   dos tokens de cor. `src/styles/tokens.contrast.test.ts` trava AA nos dois
   temas — rode antes de mexer em qualquer cor.
3. [`src/index.css`](../src/index.css) — **o único CSS compilado do
   projeto** (sem build de Tailwind). Qualquer classe nova tem que entrar
   aqui ou virar `style={{}}` inline; classe com colchete (`rounded-[28px]`)
   não faz nada.
4. [`docs/design/INVENTARIO-WIREFRAMES.md`](design/INVENTARIO-WIREFRAMES.md)
   — as 273 linhas (tela × estado) da Fase 1, já aprovadas. **É a lista
   fechada de telas** — não inventar tela nova aqui.
5. [`docs/design/DECISOES-WIREFRAME.md`](design/DECISOES-WIREFRAME.md) §5–§17
   — o que cada fluxo decidiu (entra/sai/volta), incluindo as regras 13.1–13.19
   do [`REGISTRO-DE-DECISOES.md`](REGISTRO-DE-DECISOES.md) §13.
6. `docs/design/wireframes/<fluxo>/*.dc.html` — os wireframes cinza
   aprovados. É a ESTRUTURA a vestir — não redesenhar layout aqui.
7. `.claude/agents/soulmon-visual-designer.md` — o agente já calibrado pra
   esse trabalho (SVG inline + Material icons fora do visor, bitmap só de
   criatura, restrições de acessibilidade). Use-o via `/squad-design
   identidade <fluxo>` fluxo a fluxo, como já validado com o dono.

---

## 1. Inventário de assets — o que existe e pra onde vai

### 1.1 `src/assets/soulmon/` — a arte DENTRO do visor (pixel art)

| Pasta | Conteúdo | Onde é usado / vai |
|---|---|---|
| `lines/` (53 arquivos) + `lines/full/` | Sprites reais das criaturas (rookie→mega, 3 branches: Ignar/Lumel/Serah + Kaelen/Orrin/Thalindra), geradas pelo pipeline oficial do oráculo (`utils/oracle.ts` `imagePrompt`) | `getSpriteForStage`/`legacySpriteForStage`/`fallbackSpriteForStage`, sempre dentro do `Viewport` — fluxos Pet, Evolução, Onboarding-oráculo (Nascimento/Reveal/RevealDemo) |
| `bg/` (15) | Cenas 960×540 (masmorras dungeon-1..10, torneio, minijogos Dino/RPS) | `DungeonGame.tsx`, `TournamentPage.tsx`, `Arena` — fluxo Jogos. **Achado §11 do `04`**: formato deitado mal aproveitado em container retrato (`background-size:cover` corta ~70%) — registrar como achado no canvas de Jogos, não corrigir escondido |
| `evolution/` (4) | `node-current/forecast/locked/reached` — nós da árvore de evolução | Fluxo Evolução, `EvoArvore.dc.html` |
| `progress/` (4) | Barras de HP/XP em pixel (segmentada ciano/vermelha, lisa azul/ciano) | HUD do Pet, dentro do visor — Home/Pet |
| `fx/` (12) + `fx-ataque/` (817!) | Partículas de carinho (`care-*`), combate (`fx-hit/shield/dizzy`), e a MAIOR pasta do projeto: 817 variações de `fx-<elemento>-{aura,cast,defended,impact,orb,slash}.png` para cada um dos ~136 elementos de `elementos/` | Cerimônia de evolução, masmorra/torneio (ataques). Fluxo Jogos e Evolução |
| `elementos/` (138) | Ícones pixel de cada elemento de ataque (`el-abismo.png`...) — tem `INSTALAR.md` próprio | Ficha de habilidade/ataque, dentro do visor. Fluxo Pet (Ficha) e Jogos |
| `items/` (13) | Comida (`food-*`) e itens especiais (chips, coração, glitchtama) — pixel, tamanho de inventário | `ItensPastinha.dc.html`, `AlimentarFolha.dc.html` — fluxo Home |
| `adventures/` (24) + `dreams/` (30) | Cenas pequenas de "aventura fora" e "sonho" — ilustração narrativa pixel | Fluxo Rituais (`SonhoComCena.dc.html`, `RelatorioNormal` menções de aventura) |
| `buttons/` (13) + `ui/` (3) + `windows/` (1) | Botões pixel prontos (3 tamanhos × 4 estados) e moldura de janela de inventário | **Candidatos a NÃO usar fora do visor** — a tese §1 do `04` proíbe pixel fora do visor; se algum destes hoje vaza pra fora (ver §2 abaixo), é achado a registrar, não a reproduzir em tela nova |
| `icons/` (57) + `icons/categories`, `icons/games` | Ícones pixel de categoria de hábito, jogos (pedra/papel/tesoura) | Mistos — alguns são conteúdo DENTRO do visor (troféus, minijogo), outros são ícone de sistema que **deveriam** ser Material Symbols (`Icon.tsx`) e não pixel — checar caso a caso antes de reusar |

### 1.2 `src/assets/backgrounds/` — cenários do pet-box da loja

11 PNGs (`bg-matrix`, `bg-ocean`, `bg-gameboy`, `bg-attic`, `bg-arcade`,
`bg-library`, `bg-shrine`, `bg-rooftop`, `bg-cloudsea`, `bg-observatory`,
`bg-swamp`) + `home-scene-1547.png` (candidato a fundo da Home, ver
`[[soulmon-icones-ui-pasta]]` na memória — ainda não decidido pelo dono).
Catalogados em `src/utils/backgrounds.ts` (`PET_BACKGROUNDS`) com `setting`,
`slots`, `horizonY` — **regra dura**: todo cenário com chão tem que alinhar em
`GROUND_Y = 74%` (`utils/petStage.ts`), senão pet/decoração flutuam. Vai para
o fluxo Loja (`CenariosMobilias.dc.html`) e HUD do Pet na Home.

### 1.3 Ícones de sistema (fora do visor)

**Fonte única**: `Icon.tsx` + `NavGlyphs.tsx` — Material Symbols Rounded como
motor padrão, com glifos SVG próprios sobrescrevendo nome a nome quando
existirem. Regra travada por teste: ícone nunca dentro de caixa
(`sm2-icon` não desenha moldura/fundo/borda). A fonte é um SUBSET de 99
ícones (145 KB) — **nome fora do inventário não renderiza nada, falha
silenciosa**. Antes de usar um ícone Material novo num canvas/implementação,
conferir a lista em `src/styles/tokens.md` ou rodar o comando de regeração se
precisar adicionar.

### 1.4 Catálogo de itens/decoração/loja (não é pasta de imagem, é dado)

`src/utils/shop.ts` — todo item da loja é **emoji + preço + moeda**, não
ícone vetorial próprio (decisão já registrada: os 15 `displayIcon` que
existiam saíram sem substituto — item da pastinha é conteúdo, não ícone de
sistema). Decoração de palco usa `utils/decorArt.ts` (não listado acima —
conferir na hora) para a arte pixel de cada peça de mobília, mapeada por
`SlotId`/`DecorFit`.

### 1.5 Android / widgets

`android/res/drawable` **não existe** nesta árvore de trabalho (`find`
retornou vazio) — os widgets Android citados no `04` e na regra 13.18
(copy só em inglês) provavelmente vivem num módulo Android separado, fora
deste checkout, ou o caminho mudou. **Pendência para a sessão nova**:
localizar onde o app Android/widget realmente vive antes de tocar nisso —
não assumir o caminho do `CLAUDE.md` sem confirmar.

### 1.6 O que NÃO existe ainda (gerar ou aceitar como débito)

- Nenhuma arte para `ArenaGame.tsx`/`OraclePage.tsx` além do que já está — e
  ambos **ainda estão no bundle de produção** apesar de supostamente
  descontinuados (achado §11 do `04`, não resolvido).
- Sem tokens de espaçamento/grid — só valor literal. Não inventar token novo
  sem registrar como achado (regra do `HANDOFF-IDENTIDADE.md` §6).
- Cerimônia de Evolução e os dois minijogos (Dino/PPT) **nunca tiveram arte
  própria** — só gradiente CSS, confirmado no `soulmon-redesign-status`
  (memória). Se a Fase 2 for cobri-los, é geração nova (pipeline Higgsfield/
  Gemini documentado na memória do dono), não reuso.

---

## 2. Divergências código × tese que a sessão nova PRECISA saber antes de tocar

(Repetido do `HANDOFF-IDENTIDADE.md` §6 — crítico o bastante pra estar nos
dois lugares.) Confirmar cada um ainda vale antes de reusar, porque o código
muda:

1. **Pixel art fora do Visor em 28 arquivos `.tsx`** (kit `.sm-px-*`, 82
   classes) — contradiz a fronteira diegética do §1. Não é pra "consertar
   silenciosamente" — é achado a registrar por canvas que tocar essas telas.
2. **`BottomNav` renderiza Silkscreen em 12px** — abaixo do piso declarado de
   14px pra essa fonte (§4 do `04`).
3. **`lucide-react` ainda importado em 8 arquivos** apesar de estar marcado
   pra sair (ícones deveriam vir só de `Icon.tsx`).
4. **`ArenaGame.tsx` e `OraclePage.tsx`** seguem no bundle.
5. **Sem tokens de espaço/grid** — literal em todo lugar.

Regra: o canvas de identidade DESENHA A TESE (como deveria ficar) e REGISTRA
a divergência como achado — não silenciosamente já "conserta" o código atual
por baixo do pano no meio de um trabalho de canvas.

---

## 3. Como classificar cada tela antes de implementar

Para cada uma das 273 linhas do `INVENTARIO-WIREFRAMES.md`, ao chegar a vez
do fluxo (na ordem já validada com o dono — ver `HANDOFF-IDENTIDADE.md` §3),
classificar em uma das três categorias abaixo **antes** de abrir o canvas de
identidade daquele artboard:

- **JÁ EXISTE (reusar)** — o componente React já usa os tokens `--sm2-*`
  corretos, tipografia certa, e só falta o canvas de identidade confirmar/
  documentar (recorte 200×200 + AA). Ex.: qualquer tela cujo componente já
  não apareça na lista de divergências da §2 acima.
- **PRECISA RETRABALHO** — o componente existe e funciona, mas usa cor/fonte/
  ícone fora do sistema (ex.: pixel fora do visor, Silkscreen abaixo de 14px,
  `lucide-react`) — a Fase 2 aplica os tokens certos SEM mudar estrutura
  (a estrutura já foi aprovada na Fase 1, não se reabre).
- **PRECISA CRIAR** — a superfície existe no wireframe aprovado mas o
  componente React de produção ainda não existe, ou existe como placeholder
  puro (gradiente CSS, sem arte) — ex.: Cerimônia de Evolução, os minijogos.

Essa classificação **não está pronta hoje** — nenhuma varredura completa
tela-a-tela foi feita nesta sessão (levaria uma passada própria, fluxo a
fluxo, cruzando as 273 linhas com os componentes reais). É o primeiro
trabalho real da sessão nova, fluxo a fluxo, seguindo a ordem do
`HANDOFF-IDENTIDADE.md` §3 (Sistema → Home → Atividades → Rituais → Pet →
Onboarding-funil → Evolução → Jogos → Loja → Estatísticas → Social → Conta →
Fora do app → Onboarding-oráculo).

---

## 4. Prompt de partida para a sessão nova

Copie o bloco abaixo como primeira mensagem da sessão especialista:

```
Você vai implementar a Fase 2 (identidade visual) do Soulmon — aplicar o
sistema visual real (tokens --sm2-*, Fredoka/Rubik/Silkscreen, Material
Symbols, motion) sobre os wireframes cinza já aprovados da Fase 1.

Leia nesta ordem antes de escrever qualquer código:
1. docs/HANDOFF-IMPLEMENTACAO-IDENTIDADE.md (este handoff — inventário de
   assets, achados de divergência, como classificar telas)
2. docs/HANDOFF-IDENTIDADE.md (o processo: canvas primeiro por fluxo,
   checkpoint do dono por canvas, ordem dos 13 fluxos)
3. docs/manual/04-IDENTIDADE-VISUAL.md (a tese "O Visor" e os tokens)
4. docs/design/INVENTARIO-WIREFRAMES.md e docs/design/DECISOES-WIREFRAME.md
   (as 273 telas aprovadas e o que cada fluxo decidiu)

Primeiro trabalho, ANTES de desenhar qualquer canvas de identidade: percorra
os componentes React reais do fluxo "Sistema" (o primeiro da ordem) e
classifique cada superfície do inventário em JÁ EXISTE / PRECISA RETRABALHO /
PRECISA CRIAR (critério na §3 do handoff de implementação). Me mostre essa
classificação fluxo a fluxo, sem pular pra código, e só depois de eu validar
o mapeamento de um fluxo você aciona `/squad-design identidade <fluxo>` para
aquele fluxo.

Regras que não se reabrem: a estrutura aprovada na Fase 1 (não redesenhar
layout), a tese do Visor (pixel só dentro dele), as decisões 13.1-13.19 do
REGISTRO-DE-DECISOES.md, e as divergências código×tese listadas no handoff
de implementação — você REGISTRA essas divergências como achado quando
tocar a tela, não conserta escondido no meio de um canvas de identidade.

Comece pelo fluxo Sistema.
```

---

## 5. O que este documento não fez (limite explícito)

- Não classificou as 273 telas uma a uma — é trabalho fluxo a fluxo, feito
  pela sessão nova junto com o dono, não uma varredura única.
- Não confirmou onde vive o código dos widgets Android (não está neste
  checkout) — primeira coisa a resolver se a sessão nova chegar no fluxo
  "Fora do app" (Android widgets, regra 13.18).
- Não gerou nenhum asset novo — Cerimônia de Evolução e os minijogos seguem
  sem arte própria; decidir se entram na Fase 2 ou ficam como débito é
  chamada do dono, não deste handoff.
