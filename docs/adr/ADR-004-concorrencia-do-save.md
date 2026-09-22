<!-- doc-historico -->
# ADR-004 — Concorrência de escrita no save: `revision` no servidor, `GET` antes de `POST` no cliente

**Dono:** `alpha-architect` (autor do rascunho); custódia em `docs/adr/`: `doc-mantenedor`
**Data:** 21/09/2026 (QA rodada A, frente ARQUITETURA, 2ª passada)
**Estado:** **Proposta** — ⬜ **reavaliar DEPOIS do E0** (decisão do dono **#52**, 22/09/2026: *"aprovar a 006 agora; 004 e 005 depois do E0"*). Não é recusa: é sequenciamento. As duas tratam de risco que só aparece **com usuário real e concorrente** — e o E0 (10 convidados, 14 dias, `docs/E0-PREREGISTRO.md`) é o primeiro momento em que esse usuário existe. Reabrir quando o E0 fechar, com o dado dele na mão. Até lá nada aqui autoriza código. ⚰️ Até 22/09/2026 esta linha dizia **Proposta (aguarda o dono)** — promovida do rascunho `docs/reviews/2026-09-21-qa-rodada-1/adr-propostas/ADR-004-concorrencia-do-save.md` em 21/09/2026 (QA Rodada 1, pergunta #52 de `docs/PERGUNTAS-DO-DONO.md`); corpo idêntico ao rascunho. Vira **Adotada** só com a resposta do dono ao §"Perguntas"; até lá nada aqui autoriza código. ADR nova nasce em `docs/adr/`, não em `squad-alpha-runs/`
**Verificação:** `git ls-files docs/adr | grep ADR-004` (existe no git) · `diff <(tr -d '\r' < docs/adr/ADR-004-concorrencia-do-save.md) <(tr -d '\r' < docs/reviews/2026-09-21-qa-rodada-1/adr-propostas/ADR-004-concorrencia-do-save.md)` (só o cabeçalho difere; `tr` porque o Windows grava CRLF) · `grep -n "revision\|baseRevision" functions/api/save.js` → 0 · `grep -n "cloudLoad" src/contexts/GameStateContext.tsx` → 0 · `grep -c "cloudLoad\|adoptCloudSave" src/App.tsx` → 16, todos em fluxos de LOGIN/restauração (nenhum em boot nem em `visibilitychange`)
**Não cobre:** identidade (`saveId`, `whoami`) — é a ADR-001 §1–§2 · merge de campo (recusado na ADR-001 §4, continua recusado)
**Precedência:** código > teste > `CLAUDE.md` > manual > esta ADR

**Relação com a ADR-001:** a ADR-001 §3 já DECIDIU `revision` + 409. Esta ADR não a substitui: ela (a) registra por que a decisão ficou 27 dias sem executar e o que isso custa hoje com auth ligada, (b) acrescenta a metade que a ADR-001 não tinha — **o cliente web nunca lê a nuvem depois do login** —, e (c) recorta o mínimo que cabe antes dos 10 usuários.

---

## Contexto

| Fato (21/09/2026) | Evidência |
|---|---|
| O `POST /api/save` grava a chave inteira, sem ler o que estava lá | `functions/api/save.js` › ramo `POST`: `kvOrThrow(env).put(saveId, serialized, …)` — nenhum `get` antes, nenhum campo de versão |
| O cliente web só carrega o save do `localStorage` no boot | `src/contexts/GameStateContext.tsx` › inicializador de `useState<GameState>`: `readLocal(STORAGE_KEYS.GAME_STATE)` → `hydrateSave`. Nenhum `cloudLoad` |
| Depois do login, o cliente web **nunca mais lê a nuvem** | `src/App.tsx`: os 16 usos de `cloudLoad`/`adoptCloudSave` estão em `completeLoginFromLink`, `onLoginWithEmail`, `onRestoreFromCloud`, upgrade e reconciliação — todos disparados por gesto de identidade. O único `visibilitychange` do arquivo lê passos do pedômetro, não a nuvem |
| O cliente escreve a cada mutação, com debounce de 3 s e teto de 15 s | `GameStateContext.tsx` › `CLOUD_SAVE_DEBOUNCE_MS = 3000`, `CLOUD_SAVE_MAX_WAIT_MS = 15000` |
| O desktop faz `GET` → `mutate` → `POST` (leitura-modificação-escrita sem CAS) | `desktop/renderer/src/cloudSync.ts` › `pushCareAction` |
| A autorização **está ligada** — `FIREBASE_PROJECT_ID` mora no `wrangler.jsonc` desde 07/09/2026 | `wrangler.jsonc` › `vars.FIREBASE_PROJECT_ID: "soulmon-app"`. A premissa "fail-open" da ADR-001 §Contexto **não vale mais** |
| O tipo do 409 já existe no cliente, sem produtor | `src/utils/cloudSave.ts` › `CLOUD_SAVE_POLICY.conflict` (`retentavel: false`) |
| O efeito de cloud save **não pode** tocar `setGameState` (R-1) — reconciliação precisa de via própria | comentário R-1 em `GameStateContext.tsx`, dentro do `setTimeout` que chama `cloudSaveComRetry` |
| O `sw.js` não cacheia `/api/save` | `public/sw.js` (denylist, ADR-001 §5 cumprida) |

**O dano concreto, sem adjetivo.** Cenário do produto declarado (celular + overlay de desktop, mesma conta):

1. Celular aberto de manhã (save local = S0, nuvem = S0).
2. À tarde o overlay dá comida: `GET` S0 → `POST` S1. Nuvem = S1.
3. À noite o celular, **que nunca releu a nuvem**, marca uma tarefa sobre S0: `POST` S0+tarefa. Nuvem = S0'. **A comida do desktop sumiu**, sem erro em lado nenhum.

Não é "janela de segundos" (limitação declarada na ADR-001 §3). É **janela de horas, e é o caso normal de uso do overlay** — o overlay existe para ser usado com o app fechado. Hoje, com 1 usuário (o dono) em 2 aparelhos, a probabilidade por dia de uso conjunto é ~1; com 10 usuários e PWA-only (resposta #11 do dono: "10 conhecidos, PWA, 14 dias") o caso cai para quem instala PWA em celular **e** desktop-browser — ainda plausível, ainda silencioso.

**Por que a ADR-001 §3 não saiu em 27 dias:** "UI antes de infra" (memória do dono). A decisão desta ADR respeita isso: recorta o pedaço que **protege dado** e adia o pedaço que **é UI** (diálogo de conflito).

---

## Decisão (proposta)

### D1. Servidor: `revision` monotônica e recusa de escrita cega — como na ADR-001 §3, com duas correções

- Registro na KV: `{ v: 1, revision, h, updatedAt, deviceId?, state }` (o `v` é da ADR-006; entra junto porque muda o formato da chave uma vez só).
- `GET` devolve `{ found, revision, state }`. `POST` manda `baseRevision`.
- `baseRevision === revision` ⇒ grava `revision + 1`, devolve `{ ok: true, revision }`.
- Divergente ⇒ **409** `{ error: 'conflict', revision, h, state }`, não grava, **reescreve o registro inalterado para renovar o TTL** (ADR-001 §3, decisão de 26/08).
- Sem `baseRevision` ⇒ grava como hoje e loga `save: escrita sem baseRevision`. **Correção 1:** o prazo para virar 412 não é "30 dias depois do APK" — o APK carrega a URL de produção (`CLAUDE.md` §Deploy), então cliente web e APK atualizam juntos. Quem fica para trás é só o **overlay Electron** (build própria). Prazo: quando `desktop/renderer/src/cloudSync.ts` mandar `baseRevision` e a release do desktop sair, o servidor passa a 412 — por evento, não por calendário.
- **Correção 2 — idempotência do reenvio:** a ADR-001 diz "compara igualdade do `state`". Comparar até 5 MB de JSON no servidor a cada 409 é caro; compara-se o **hash** (SHA-256 do `serialized`, guardado no registro como `h`). Reenvio de um 200 perdido ⇒ 409 com `h` igual ao que o cliente mandou ⇒ o cliente aceita em silêncio.
- **Consistência eventual da KV (~60 s) continua sendo a limitação declarada.** Dois `POST` em 60 s ainda podem ambos ler `revision = n`. Fecha a janela de horas; não a de segundos. Gatilho para Durable Object no fim.

### D2. Cliente web: **`GET` antes do primeiro `POST` de cada sessão** e ao voltar do plano de fundo

É a metade que faltava. Sem ela, `revision` só troca "sobrescrever em silêncio" por "409 em toda sessão de quem usa dois aparelhos" — porque o cliente web parte SEMPRE de um `baseRevision` velho.

- No boot, **depois do primeiro render** (o app abre com o local, ADR-001 §5), se há `SAVE_ID` + token: `GET /api/save`. Se `revision` da nuvem > a guardada localmente **e** não há mutação local pendente ⇒ adota a nuvem (`adoptCloudSave`, que já grava dado antes de identidade e já faz backup). Se há mutação pendente ⇒ **não decide sozinho**: fica para o 409 do próximo `POST`.
- Em `visibilitychange` → `visible` depois de ≥ 5 min escondido: mesmo `GET`. Cinco minutos é o throttle que a régua do `CLAUDE.md` já usa para o relógio do cocô — não é número novo.
- `revision` local vive em `localStorage` (`STORAGE_KEYS.SAVE_REVISION`, chave nova em `storageKeys.ts`), **fora** do `GameState` — nunca dentro do save, pelo mesmo motivo do `bondLevel` (footgun 9: duas fontes para o mesmo número).
- Via própria para a reconciliação (R-1): um `useEffect` separado, dependente de `[saveId, authReady]` e do evento de visibilidade — **nunca** o efeito `[gameState]` que agenda o `POST`.

### D3. Cliente web: o que fazer com o 409 — **agora**: backup + adotar o servidor; **depois** (UI): o diálogo da ADR-001 §4

- **Agora (antes dos 10 usuários):** ao receber 409, gravar o lado local em `soulmon_state_conflict_<ISO>` via `safeStorage.writeLocal` (teto 2 cópias — ADR-001 §4, regra inegociável), adotar o `state` do servidor, mostrar **um** toast "Seu bicho andou jogando em outro lugar — trouxemos o progresso de lá" (PT+EN). Não é diálogo, não é decisão do jogador, mas **nunca destrói o lado perdedor** — o único dano que o produto não sabe consolar (ADR-001 §4).
- **Depois:** o diálogo de duas opções da ADR-001 §4, quando a fila de UI abrir. O backup já existe; o diálogo só passa a oferecer restaurá-lo.

### D4. Desktop: `baseRevision` no `pushCareAction`; no 409 recarrega e reaplica pela `careRules` (máx. 2×) — ADR-001 §6, sem mudança.

### D5. O que NÃO entra

- Merge de campo (ADR-001 §4 — ressuscita tarefa concluída).
- Durable Object (gatilho no fim).
- `whoami` (ADR-001 §2 — é de identidade; não muda a concorrência).

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| **A. Só `revision` no servidor (ADR-001 §3 como está)** | Menor; já decidido | O cliente web parte sempre de `baseRevision` velho ⇒ todo usuário de 2 aparelhos toma 409 na primeira mutação de toda sessão; sem D3 isso vira "não sincronizado" permanente (a política `conflict` é `retentavel: false`) | Protege o dado mas transforma o caso normal em erro visível. D2 é o que faz o 409 ser raro |
| **B. Só `GET` antes de `POST` no cliente, sem `revision`** | Zero mudança de servidor; zero mudança de formato | Continua last-write-wins entre o `GET` e o `POST` (3–15 s de debounce + rede); o desktop já faz isso e ainda perde | Fecha metade da janela e não dá ao servidor nenhum jeito de recusar |
| **C. `revision` + `GET` no boot (D1+D2+D3) — a escolhida** | Fecha a janela de horas nos dois lados; 409 vira exceção; nenhuma peça nova; reversível (servidor aceita sem `baseRevision`) | +1 `GET` por sessão (US$ 0,50/M leituras — irrelevante em 10 usuários); formato da chave muda (envelope) | É o mínimo que resolve o dano nomeado |
| **D. Durable Object por save (CAS real)** | Fecha a janela de segundos; serialização de verdade | Peça de infra nova (classe, migração de dados, DO no `wrangler`), custo por request + duração, save deixa de ser legível por `wrangler kv key get` | Compra a janela de segundos, que 10 usuários PWA não abrem. Gatilho declarado |
| **E. Push servidor → cliente (SSE/WebSocket) para invalidar o local** | O celular saberia da comida do desktop na hora | Conexão persistente em Worker = Durable Object ou terceiro; um canal a mais para operar além de FCM + Web Push | Resolve percepção, não integridade; custo desproporcional |
| **F. Overlay só leitura até a fatia de UI** | Elimina o segundo escritor hoje | Overlay perde a razão de existir (`CLAUDE.md` §Desktop: "controle remoto"); PWA em 2 navegadores continua igual | Trata UM escritor; o problema é o modelo |

---

## Consequências

**Aceitamos de bom:** dado deixa de sumir em silêncio entre aparelhos · o servidor ganha um "não" · nenhuma infra nova · reversível: o servidor continua aceitando `POST` sem `baseRevision` até o 412 ser ligado · o backup do lado perdedor existe antes de existir UI para ele.

**Aceitamos de ruim, e fica escrito:**
- **Formato da chave muda** (`state` cru → envelope `{ v, revision, h, updatedAt, state }`). O `GET` lê os dois formatos durante a transição (save sem envelope = `revision 0`). É a mesma migração que a ADR-006 precisa; por isso entram juntas.
- **Um toast novo** no 409 (D3) — fricção real, mitigada por D2 (raro) e PT+EN.
- **A janela de segundos continua aberta** (KV eventual). Dois aparelhos no mesmo minuto: pode perder um.
- **Custo de infra: R$ 0/mês.** +1 `GET` por sessão e +1 `put` de metadado por 409.
- **Gargalo nomeado (ADR-001):** 1 escrita/s por chave na KV. Com debounce de 3 s, 3 aparelhos ativos saturam. Com D1 o perdedor também escreve (renovação de TTL) — mesmo gatilho.

**Custo de execução (estimativa, para o dono pesar contra "UI antes de infra"):** servidor `save.js` + testes ≈ ½ dia; cliente D2/D3 ≈ 1 dia (a via própria fora do efeito `[gameState]` é a parte delicada — R-1); desktop D4 ≈ ½ dia. **Tudo que é UI (diálogo) fica de fora.**

---

## O que reverteria esta decisão

- **409 > ~1 por usuário ativo por semana** medido em `m:<dia>` (`metrics.js`), com D2 ligado ⇒ a KV eventual perde a corrida mais que o esperado ⇒ Durable Object.
- **`GET` do boot acima de 500 ms p95** ⇒ mover para depois do primeiro gesto (já é pós-render por desenho; o gatilho é se ainda assim doer).
- **A KV perder escrita** (log de 200 e `GET` seguinte devolve `revision` menor) ⇒ Durable Object imediatamente.
- **O dono cortar o overlay Electron da build do Steam** (ADR-001 §Perguntas) ⇒ D4 sai; D1–D3 ficam (PWA em dois navegadores é o mesmo caso).

---

## Perguntas endereçadas ao dono

| | Pergunta | Impacto |
|---|---|---|
| 🔴 | Autoriza D1+D2+D3 **antes** dos 10 usuários, como exceção declarada a "UI antes de infra" (é infra que protege dado; o único pedaço de UI é um toast)? Ou registra como **risco aceito com data** (D4 da review 05)? | Sem D2, o cenário celular+desktop perde dado em silêncio hoje, com o dono como usuário |
| 🟠 | O toast de D3 (adotar o servidor + backup local) é aceitável como comportamento provisório até o diálogo da ADR-001 §4? | A alternativa é reter o local e mostrar "não sincronizado" — pior para quem usa dois aparelhos |
| 🟡 | `visibilitychange` ≥ 5 min como gatilho do `GET`, ou só no boot? | Só no boot deixa o PWA fixado no celular (nunca fecha) sem reler |

## Handoffs

→ **`alpha-backend`**: `save.js` (envelope, `revision`, 409 com renovação de TTL, `h`, log de escrita sem `baseRevision`); `GET` lê os dois formatos.
→ **`alpha-frontend`**: `STORAGE_KEYS.SAVE_REVISION`; `GET` pós-render e em `visibilitychange`; via própria (R-1); D3 com `safeStorage.writeLocal`; toast PT+EN.
→ **`alpha-qa`**: `POST` sem `baseRevision` grava e loga · 409 renova TTL e não grava · reenvio com `h` igual não gera toast · boot com nuvem mais nova e sem mutação pendente adota · boot com mutação pendente NÃO adota · o efeito `[gameState]` não chama `cloudLoad` (guard de AST, como `x6Updaters`) · desktop 409 ×2 ⇒ "abra o app".
→ **Gate:** `alpha-skeptic`.
