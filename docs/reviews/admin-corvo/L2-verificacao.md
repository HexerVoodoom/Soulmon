# L2 — Verificação independente do lote de 29/09/2026

Verificador de release, sem confiar nos relatórios dos agentes. HEAD verificado:
`cf05bcad` (branch `ccr-1aa8b7db-xk45mh`). Portões e navegador rodaram numa
CÓPIA (`git archive HEAD` em `/tmp/sv`); o `dist/` do repo não foi tocado.
Navegador: `vite preview` da cópia, Chromium do Playwright, `serviceWorkers:'block'`,
save semeado por `addInitScript`, `/api/*` mockado. Capturas em
[`shots-verificacao/`](shots-verificacao/) (16).

## Veredito

| Seção | Veredito |
|---|---|
| (a) Mapas internos | **BLOQUEADO**: regressão ALTA nos quatro jogos (R1) + balão cortado em 360×640 (R2) |
| (b) Renomeio de caminhos | **PRONTO PARA MERGE** (com a ressalva B1, que é baixa) |
| (c) Admin / painel de GM | **COM RESSALVA** (C1) |
| (d) Corvinho em 11 formas | **PRONTO PARA MERGE** |
| Portões | **COM RESSALVA**: orçamento de bytes (G1) |

## 1. Portões (cópia do HEAD)

- `npx tsc --noEmit` 0 · `tsc -p tsconfig.server.json` 0 · `tsc -p desktop/tsconfig.json` 0.
- `npx vitest run`: **6066 passaram / 7 falharam** (434 arquivos). Das 7 falhas:
  - 4 são só por causa da cópia sem `.git` (`branchRename.contract` ×3 e `appUrl.contract`, que chamam `git ls-files`). **Rodei de novo no repo real: 3 arquivos verdes (32 testes)**, junto com `SoulmonOnboarding.portao` isolado (verde, o flake conhecido).
  - `convertToWebp` e `orcamentoDeBytes` são as duas falhas já conhecidas.
- `npm run build` na cópia: verde. Entrada `index-seU9qLX1.js` = **707 KB** (724.095 B); CSS de entrada `index-DxdCINez.css` = **150 KB** (153.652 B).
  - **G1**: o `dist/` já commitado (`1f03423a`) tinha 683 KB / 147 KB. O lote soma **~+24 KB de JS e ~+3 KB de CSS**, e o `orcamentoDeBytes` já estava vermelho (dívida registrada de 634 KB + folga de 8). A falha é antiga, mas o lote AUMENTA o valor.
- `grep` no `dist/assets/*.js` gerado por `champion-virus|champion-vaccine|champion-data|virusPoints|dataPoints|vaccinePoints`: **zero ocorrências**. Sobra um único `"virus"`/`"vaccine"` literal: o mapa de migração (`cd="virus",…,dd="vaccine",Yo={[cd]:"power",…}`) — é o esperado.
- Os **11 PNGs do corvo** (e as 11 variantes de 256) entram no build como 22 `.webp` (`corvo-*-<hash>.webp`). `sprites.dungeonRoster.test.ts` passou contra o dist gerado.

## 2. Migração de save antigo (navegador real)

Save semeado no formato ANTIGO: `evolutionStage:'champion-virus'`, `currentBranch:'virus'`,
`virusPoints 11 / dataPoints 7 / vaccinePoints 5`, `foodInventory {🦠:2, 💾:1, 💉:3, 🍎:4}`,
`unlockedEvolutions` e `spriteLibrary` (sprites, failures, reverted) com ids antigos, e
`soulmonStages[].branch:'virus'`.

| Caso | Resultado no save regravado |
|---|---|
| champion-virus | `champion-power` / `power`, pontos `11/7/5` em `power/harmony/benevolencePoints`, pastinha `👊2 🎶1 🤲3 🍎4`, `unlocked`/`sprites`/`failures`/`reverted` todos com ids novos, stage `power`. **Nenhum id antigo** (regex nos ids, campos e emojis). Nenhum erro de página. |
| Reabrir o save já migrado (idempotência) | idêntico, byte a byte nos campos acima |
| data → ultimate-harmony | `ultimate-harmony` / `harmony`, sem id antigo |
| vaccine → mega-benevolence | `mega-benevolence` / `benevolence`, sem id antigo |

Nada se perdeu (contagem de pontos, itens e entradas do acervo conservadas). A Árvore da
Evolução do save migrado mostra "Seguindo para **Poder**" e as linhas Poder/Harmonia/Benevolência
(`15-reg-evolucao-pt-BR.png`); a loja mostra os chips `item-chip-power/harmony/benevolence`.

- **B1 (BAIXO)**: a migração não deduplica `unlockedEvolutions` quando o save antigo tinha o id velho E o novo ao mesmo tempo (só acontece num save meio-migrado à mão). Inofensivo.

## 3. Áreas (Mercado, Jogos, Arena, Exploração, Laboratório, Hall)

Medido em PT claro 390×844, EN escuro 390×844 e PT escuro 360×640:

- Voltar das áreas = **ícone de mapa**, rótulo "Voltar ao mapa"/"Back to map"; Configurações (menu da Home) continua com a seta e "Voltar ao início". ✅
- Cena `fixed` cobrindo a tela inteira (0,0,390,844 e 0,0,360,640) nas 6 áreas, sem scroll horizontal. ✅
- Folha: Esc fecha e o foco volta ao lote que abriu (6/6 × 3 variações). Voltar do navegador/Android: 1º fecha a folha e fica na área, 2º volta ao mapa. ✅
- NPC da folha: 236×273 em 390 e 205×205 em 360; título da folha não é coberto. ✅
- Laboratório e Hall **não têm arte de fundo** (só Mercado/Jogos/Arena/Exploração têm `bg-*.png`) — a cena "full screen" ali é um gradiente escuro. Não é defeito do lote; registro para quem espera "lotes sobre clareiras" nas seis.

**R1 (ALTO, regressão — bloqueia)**: com o topo `overScene` (z-2) do commit `39e3b5f3`, o
botão de mapa e o título da área ficam **POR CIMA das telas de jogo**. Medido com
`elementFromPoint` no centro do botão, depois de iniciar cada jogo:

| Jogo | antes (`39e3b5f3^`) | depois (HEAD) |
|---|---|---|
| Masmorra | jogo cobre o topo | topo sobre o jogo |
| Corrida do Dino | jogo cobre o topo | topo sobre o jogo |
| Pedra, papel e tesoura | jogo cobre o topo | topo sobre o jogo |
| Duelo | jogo cobre o topo | topo sobre o jogo |

Na masmorra, "Exploration" se sobrepõe a "Dungeon / Layer 1 of 5" e o botão de mapa
fica em cima do cabeçalho do jogo, ao lado do ✕ do próprio jogo — dois "sair" diferentes
num canto (`02-regressao-masmorra-DEPOIS-topo-sobre-jogo.png` contra
`16-regressao-masmorra-ANTES-39e3b5f3.png`).

**R2 (MÉDIO)**: em 360×640, na Arena › Torneio, o balão do NPC começa em y = −16. O nome
"Vultrak, mestre da arena" sai **para fora da tela** (`10-arena-torneio-360x640-balao.png`).
As outras cinco áreas cabem.

## 4. Admin / GM

Save com `soulmon-save-id` e `/api/entitlements` mockado:

- `admin:true` → corvinho adotado (`soulmonMeta.creature:'corvo'`, 11 stages), painel de GM
  em Configurações (`12-admin-painel-gm.png`). "Ir para forma" oferece as **11 formas** e
  as 11 aplicam (`rookie` … `ultra`). Dar saldo: Bits/Emblemas 0→999999. Desbloquear tudo:
  11 evoluções, cenários 1→33. +1/+7/+30: `perfectDays` 0→38. Recarregar mantém o corvo e
  não readota. O save **não** grava `admin`. Nenhum erro de página. O ultra aparece na
  Home com 5 corações e a arte `corvo-ultra` (`13-admin-corvo-ultra-home.png`).
- `admin:false` → sem painel e sem corvo.
- Flag forjada (`admin/isAdmin` no save, `soulmon-admin`/`admin` no localStorage, entitlement sem o campo) → sem painel e sem corvo.
- `admin:"true"` (string) → sem painel e sem corvo (só o booleano literal vale).
- Servidor: `_admin.js` decide por `ADMIN_EMAILS` (env) + token verificado + saveId do próprio token. **Nenhum e-mail literal**.
- E-mail do dono: `git grep` acha o endereço só nos docs e artefatos **anteriores ao lote**, onde ele é o contato público decidido (VAPID, política §9, ficha da Play). **O lote introduz 0 ocorrências** (`git diff 1f03423a..HEAD` sem `dist`). Nem este relatório nem as capturas o contêm.

**C1 (MÉDIO)**: o comentário de `utils/corvoPet.ts` diz "o corvo não apaga nada", e isso
não é verdade para os campos que ele troca. `adoptCorvo` **sobrescreve `soulmonStages`**
(nomes, descrições e prompts das 11 formas da criatura do oráculo) e zera
`demoCharacterId`. Só o `spriteLibrary` sobrevive. Afeta só a conta do dono e foi pedido
como pet definitivo. Mesmo assim, a frase deve ser corrigida, e o dono precisa saber que a
criatura anterior não volta.

## 5. Regressão

Sem corvo (PT claro) e com corvo (EN escuro), num save migrado de `champion-virus`, abri:
Hall › Guilda, Mercado › Itens, Arena › Torneio e Duelo, Exploração › Masmorra, Laboratório ›
Evolução, Soulmon e Stats. Resultado:

- **Nenhuma** linha com `{n}`, `{{`, `undefined`, `NaN`, Vírus/Vacina/Dado/Vaccine no texto renderizado.
- Nenhuma imagem quebrada e nenhum `pageerror`.
- Com corvo, as artes `corvo-*` desenham em Guilda, Duelo, Masmorra, Evolução, Soulmon e Stats.
- Vocabulário em fonte: `branchRename.contract` e `narrativa.contract` verdes no repo real.
- Único defeito encontrado: o R1 acima.

## Para desbloquear

1. **R1**: esconder o `AreaTopBar overScene` (ou baixar o z-index dele abaixo do jogo) enquanto um jogo de tela cheia está montado. Depois, repetir a medição da tabela.
2. **R2**: limitar a altura do balão (ou `top` mínimo = safe-area) em 360×640.
3. Recomendado, sem bloquear: corrigir o comentário do C1 e re-medir a dívida do G1 com justificativa.
