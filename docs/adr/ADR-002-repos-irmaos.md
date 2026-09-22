<!-- doc-historico -->
# ADR-002 — Propagação viva dos repos irmãos (DP-02)

**Dono:** `alpha-architect` (autor original); custódia em `docs/adr/`: `doc-mantenedor`
**Data:** copiado para o repo em 21/09/2026 (QA GERAL #35); a data da decisão está no corpo
**Estado:** `registro` — cópia FIEL de `squad-alpha-runs/soulmon-02/adr-repos-irmaos.md` (pasta fora do git, `.gitignore`); o corpo abaixo NÃO foi reescrito, e cita código por `arquivo:linha` como estava na época — linhas escorregaram, procure pelo SÍMBOLO
**Verificação:** `git ls-files docs/adr` (existe no git) · `diff <(tail -n +14 docs/adr/ADR-002-repos-irmaos.md | tr -d '\r') <(tr -d '\r' < squad-alpha-runs/soulmon-02/adr-repos-irmaos.md)` (corpo idêntico ao original, enquanto a pasta local existir; o `tr` existe porque este arquivo está em CRLF no working tree do Windows — sem ele o comando reprovava com 572 linhas de diff, QA Rodada 1 `08` A2)
**Não cobre:** o estado atual do código — para isso leia a linha "Vale em" abaixo e o `docs/manual/05-ARQUITETURA.md`
**Precedência:** código > teste > `CLAUDE.md` > manual > esta ADR

**Vale em 21/09/2026?** Adotada de fato: `vendor/class-system/` com `_provenance.json`, `.github/workflows/sync-irmaos.yml` semanal abrindo PR, `paths` no `tsconfig.json`. É a única ADR citada por doc versionado (`docs/STATUS.md`, `docs/PLANO-DESKTOP-STEAM.md`). Fonte: `docs/reviews/2026-09-21-qa-geral/05-arquitetura.md` §8.

---
# ADR-002 — Propagação viva dos repos irmãos (DP-02)

**Status:** proposta
**Data:** 25/ago/2026 · **Decisor:** dono (Mateus) · **Autor:** `alpha-architect`, run `soulmon-02`

## Contexto

O dono quer que atualizar **Bestiário**, **Class-System** e **teste-personalidade** reflita
no Soulmon. O `contexto.md` §8 registra a decisão **oposta** — snapshot commitado — e o motivo
está escrito no próprio código:

> "Por que snapshot commitado e não dependência de git como no teste-personalidade: o Soulmon
> builda para APK/Cloudflare com `dist/` commitado, e o typecheck estrito não pode depender do
> `tsconfig` de outro repo." — `scripts/sync-oracle-data.mjs:14-19`

**Os três repos NÃO têm o mesmo acoplamento.** Tratá-los como um problema só é o erro que esta
ADR evita:

| Repo | Como entra hoje | Momento | Evidência |
|---|---|---|---|
| **Bestiário** | **DADO**, snapshot JSON commitado (2000 criaturas) | build-time, e só ao rodar `npm run sync:oracle-data` | `src/utils/soulProfile/bestiary/pool.json` |
| **Class-System** | **CÓDIGO EXECUTÁVEL**, dependência npm real, no bundle | `npm ci` a **cada build**, inclusive o do Cloudflare Pages | `package.json:40`; `ficha/realEngine.ts:26` — `await import('class-system')` |
| **teste-personalidade** | **NADA** — o código foi **copiado**, arquivo a arquivo | nunca | `axes.ts:4`, `numerology.ts:3`, `astrology/chart.ts:4`, `personality/*` — todos dizem "Portado de …" |

### A restrição nova e dura (achado do `alpha-qa`)

```
package-lock.json:5502
  "resolved": "git+ssh://git@github.com/HexerVoodoom/Class-System.git#fb866455…"
```

Isto **só funciona hoje porque o repo é público** — o npm cai para HTTPS anônimo quando o SSH
falha. O dono pretende tornar o repo privado.

**Consequência exata, verificada:** o `class-system` é importado em runtime
(`realEngine.ts:26`) e entra no bundle. O build do Cloudflare Pages roda `npm ci`. Com o repo
privado, **o `npm ci` do Cloudflare falha, e o deploy da `main` para de publicar** — sem chave
SSH, sem PAT, e sem lugar para colocar um. Não é degradação: é o site fora do ar no próximo push.

> 🔴 **Isto já é verdade hoje, independentemente desta ADR.** No dia em que o dono clicar em
> "make private", o Soulmon para de buildar. Qualquer desenho que dependa de o repo continuar
> público está morto na chegada — inclusive o desenho **atual**.

### Restrições que qualquer solução tem que respeitar

- **Offline.** É PWA. Nada que o jogo precise para funcionar pode depender de rede em runtime.
- **`dist/` é commitado** e o Cloudflare também builda. Build não reprodutível = `dist/`
  commitado diferente do que o CF gera, e ninguém percebe.
- **Typecheck estrito** (`npx tsc --noEmit`, exit 0 obrigatório). Não pode depender do
  `tsconfig` de outro repo.
- **Dev solo, `gh` não instalado**, orçamento ~R$ 200/mês.
- **Cobertura travada por simulação** que não pode cair: 17/17 elementos, 65/65 talentos,
  11/11 profissões, 32/32 criaturas, pool inteiro do bestiário.
- **Footgun 9**: regra copiada é regra que diverge em silêncio. `cascata.parity.test.ts` existe
  exatamente por isso — e **funciona**: neste run ele pegou uma divergência real (ver §5).

---

## Decisão

**Três mecanismos, um por tipo de acoplamento. Nenhum deles usa rede em runtime, e nenhum
deles precisa que repo algum seja público.**

### 1. Class-System (código) — **artefato compilado, vendorizado e commitado**

A dependência `"class-system": "github:HexerVoodoom/Class-System"` **sai do `package.json`.**

O Class-System passa a **publicar um artefato de build** (`npm run build` → JS ESM + `.d.ts`,
sem `.ts` de origem). O Soulmon guarda esse artefato em `vendor/class-system/`, **commitado**,
com um `_provenance.json` ao lado (repo + tag + SHA + data), e um alias no `vite.config.ts`
mapeando `class-system` → `vendor/class-system/index.js`. O `realEngine.ts` **não muda uma
linha** — `await import('class-system')` continua igual.

Por que isso resolve os quatro problemas de uma vez:

| Problema | Como o vendor resolve |
|---|---|
| Repo privado | O `npm ci` do Cloudflare **não busca nada**. A credencial só existe na CI que gera o PR (§4), nunca no build. |
| Typecheck estrito | O vendor traz `.d.ts`, não `.ts`. Declaração não é compilada pelo nosso `tsconfig`, e `skipLibCheck` já cobre o resto. O `tsconfig` do outro repo deixa de existir para nós. |
| Build reprodutível / `dist/` commitado | O input do build vira um arquivo versionado. Dois builds do mesmo commit dão o mesmo `dist/`, sempre. |
| Offline | Zero rede. |

**Custo que fica:** o repositório engorda (o `dist/` do class-system, ~algumas centenas de KB —
irrelevante ao lado dos 74 sprites que já saíram e do `dist/` que já é commitado) e alguém
precisa lembrar de atualizar o vendor. É esse "lembrar" que a §4 automatiza.

### 2. Bestiário (dado) — **fica como está: snapshot commitado**, agora apontando para `main`

`pool.json` é uma amostra estratificada de 2000 criaturas com procedência. **Não muda.** O que
muda é a ref, e isso já foi executado neste run (ver `p2-merge-bestiario.md`): o default de
`sync-oracle-data.mjs` e de `export-canonico.mjs` deixou de ser uma branch de trabalho de outro
repo e passou a ser `origin/main`.

O snapshot é a resposta certa aqui e vale dizer por quê, para ninguém "modernizar" depois: a
seleção do pool é **determinística e calibrada** (`hashString`, estratos por elemento×família,
dedupe por nome), e a cobertura é travada por teste. Um pool que muda sozinho é um pool que
quebra a cobertura sozinho, num commit que ninguém escreveu.

### 3. teste-personalidade (código duplicado) — **o Soulmon vira o dono do motor; o teste vira a porta**

O dono quer o `teste-personalidade` como **porta de entrada**, "integrando de verdade". Isso é
compatível com o que já existe, mas exige inverter a direção de quem copia de quem.

Hoje: `derivedElements.ts` / `axes.ts` / `numerology.ts` / `astrology/*` / `personality/*` são
**cópias** do teste-personalidade. Duas implementações do mesmo cálculo, sem teste de paridade
nenhum entre elas — footgun 9 sem rede de proteção. E a cópia do Soulmon é a que evoluiu: os
coeficientes de `axes.ts` foram **calibrados por simulação** para que nenhum elemento/papel/reino
tenha vantagem estrutural (`CLAUDE.md` §Oráculo), e a cobertura de 17/17 elementos é travada aqui.

**Decisão:**

1. **O motor é do Soulmon.** `src/utils/soulProfile/` é a fonte da verdade do cálculo —
   é onde estão os coeficientes calibrados e os testes de cobertura.
2. **O motor é extraído para um pacote próprio** (`soul-profile`), com **zero dependência de
   React e zero de Vite**, e publicado como o **mesmo tipo de artefato** do §1: JS ESM + `.d.ts`.
   Dentro do Soulmon ele continua sendo código local (não vira dependência externa do próprio
   dono); o artefato existe para o **outro** consumidor.
3. **O teste-personalidade vendoriza esse artefato**, do mesmo jeito, pela mesma CI. Ele deixa
   de calcular e passa a **coletar e apresentar** — que é o que "porta de entrada" quer dizer.
4. **A fronteira entre os dois continua sendo FORMATO, não API viva.** O
   `teste-personalidade` produz um `SoulProfile` JSON e o entrega ao Soulmon. Isso preserva a
   propriedade que faz o Oráculo funcionar offline: o cálculo roda 100% no navegador.
5. **Enquanto a extração não acontece, entra um teste de paridade**, no molde do
   `cascata.parity.test.ts` que já provou seu valor: fixtures geradas pelo motor do
   teste-personalidade, conferidas contra a réplica do Soulmon. **Duplicação sem teste de
   paridade é a única forma inaceitável de duplicação.**

**Entrega do `SoulProfile` — contrato, porque contrato sem erro é caminho feliz:**

```
POST /api/soul-profile/claim          (Pages Function nova, do Soulmon)
Authorization: Bearer <firebase-id-token>
{ "version": 1, "profile": { … }, "producedAt": "<ISO>" }

201 → { "ok": true, "claimed": true }
200 → { "ok": true, "claimed": false }   já havia perfil — NÃO sobrescreve (ver abaixo)
400 → { "error": "schema" }              versão desconhecida ou campo obrigatório ausente
401 → { "error": "unauthenticated" }
```

**Idempotente por conta, e de propósito não-sobrescrevível:** a `OraclePage` declara ao jogador
que o teste longo é **decisão SEM VOLTA** (`CLAUDE.md` §Oráculo). Um endpoint que aceita o
segundo envio desmente a tela. `version` existe porque o dia em que o schema mudar vai chegar, e
um 400 explícito é melhor que um perfil meio lido.

**Falha parcial:** se o `claim` falhar, o `teste-personalidade` **não perde o perfil** — ele o
entrega ao Soulmon pelo mesmo caminho que já usa hoje (o formato, no navegador). O endpoint é
conveniência, não dependência.

### 4. O que mantém tudo vivo: **CI que abre PR quando o canônico muda**

Um só workflow, no Soulmon, `.github/workflows/sync-irmaos.yml`:

- **Gatilho:** `repository_dispatch` (Class-System e Bestiário disparam ao mergear na `main`)
  **+ `schedule` semanal** como rede — dispatch é a peça que silencia sem avisar.
- **Credencial:** um PAT `fine-grained`, escopo **read-only** nos dois repos, como
  secret do Soulmon. **É a única credencial do desenho, e ela vive na CI — nunca no build.**
  É isto que faz a solução sobreviver ao repo privado.
- **Passos:** clona os irmãos → roda `npm run sync:oracle-data` → regenera `vendor/class-system/`
  → roda `npx tsc --noEmit` e `npx vitest run` → **se passou, abre PR; se falhou, abre PR
  mesmo assim, marcado `sync-quebrado`, com a saída do teste no corpo.**
- **PR, nunca push direto.** Um sync que empurra sozinho para a `main` publica no Cloudflare em
  ~2 min sem ninguém ter lido nada.
- **O PR não toca `dist/`.** `dist/` é regerado no merge, pelo fluxo normal.

**É aqui que "propagação viva" acontece de verdade:** o dono muda o Bestiário, e em minutos
existe um PR no Soulmon que já rodou o typecheck e os testes. Ele lê e mergeia. O que ele
**não** ganha é mudança entrando sem passar por ele — e essa recusa é a decisão, não uma
limitação.

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| **CI que abre PR quando o canônico muda** | Propagação real e rápida; toda mudança passa por typecheck+teste antes de existir; `dist/` continua reprodutível; funciona com repo privado (PAT na CI) | Não resolve sozinha o `class-system` como dependência npm — o `npm ci` do Cloudflare continua buscando o repo no **build** | **Adotada — mas só como motor.** Sozinha não sobrevive ao repo privado; é o §1 que sobrevive. As duas juntas são a recomendação. |
| **Dependência npm fixada por SHA** (o desenho de hoje) | Uma linha no `package.json`; versão explícita e auditável; o npm resolve tudo | 🔴 **Morre no dia em que o repo virar privado** — `git+ssh` sem chave no Cloudflare Pages derruba o deploy · o `.ts` de origem entra no nosso `tsconfig` estrito · o build passa a depender de rede e do GitHub estar de pé · SHA fixo não é "propagação viva", é o oposto | **Rejeitada.** É exatamente o desenho que a restrição nova mata. Vale registrar que ela morre **hoje**, não quando mudarmos algo. |
| **Endpoint do Bestiário lido em runtime, com fallback para o snapshot** (`bestiario.mateus-sprnd.workers.dev`) | Propagação instantânea, sem PR, sem build; o Bestiário já está publicado como Worker | 🔴 **Quebra a determinismo do pool**: a amostragem estratificada é calculada com hash e travada por teste de cobertura — um pool que muda em runtime falha a cobertura em produção, onde não há teste · **latência no caminho mais alto do jogo** (o reveal do Oráculo) · **offline**: o fallback teria que existir de qualquer jeito, então o snapshot **continua sendo commitado** e a rede vira custo puro · segunda fonte da verdade para o mesmo dado · superfície de rede nova, com CORS, timeout, retry e 5xx do outro app | **Rejeitada para o pool.** ⚠️ Mas é a alternativa **certa** para um caso que não existe hoje: uma tela de "explorar o Bestiário" dentro do Soulmon, que é conteúdo opcional e não regra de jogo. Se isso entrar no escopo, este endpoint volta — para ela, e nunca para o pipeline. |
| **Monorepo** (os 4 repos num só) | Acaba a classe inteira de problema; uma versão só; refatoração atômica | Migração dos 4 repos, com histórico, CI, deploys e integrações de Cloudflare separadas · o Bestiário sozinho tem 120 MB · o `dist/` commitado do Soulmon num monorepo com 120 MB de JSON vira um `git clone` de vários minutos | **Rejeitada agora.** É a resposta certa se o dono um dia trabalhar nos 4 na mesma sessão com frequência. Fica como gatilho de reversão. |
| **Publicar `class-system` no npm público** | Resolve o build sem credencial; o npm cacheia; versionamento semântico de graça | O dono quer o repo **privado** — publicar o pacote público publica o conteúdo mesmo assim · uma superfície pública a manter (issues, semver, depreciação) para um consumidor só | **Rejeitada** por contrariar a intenção declarada. Se a intenção mudar, é a solução mais barata de todas e substitui o §1. |
| **GitHub Packages (registry npm privado)** | Resolve o privado "do jeito certo"; `npm ci` funciona com `.npmrc` | Exige um **token no build do Cloudflare Pages** — credencial de longa duração numa variável de ambiente de build, para um dev solo. E o `npm ci` volta a depender de rede e do GitHub de pé no momento do deploy | **Rejeitada.** O vendor entrega o mesmo resultado sem credencial nenhuma no build. Menos peça, menos segredo, menos coisa para cair às 3h da manhã. |
| **`git submodule`** | Nativo, pinado por SHA, sem registry | O Cloudflare Pages **não** inicializa submódulo privado sem credencial — mesmo problema do `git+ssh` · e o `.ts` volta para dentro do nosso `tsconfig` | **Rejeitada** pelo mesmo motivo da dependência npm. |

---

## Recomendação, com o trade-off explícito

**Vendorizar o artefato compilado do Class-System (§1) + CI que abre PR (§4), mantendo o
Bestiário em snapshot (§2).**

**O trade-off, dito sem enfeite:** **trocamos frescor por reprodutibilidade e por
independência de credencial no build.**

- O que **perdemos**: a mudança no canônico não aparece no Soulmon **automaticamente**. Ela
  aparece como um **PR**, em minutos, e só entra quando alguém mergeia. Existe uma janela — do
  merge lá até o merge aqui — em que os dois repos discordam.
- O que **ganhamos**: o build do Soulmon **não depende de rede, de credencial, nem do GitHub
  estar de pé**. Sobrevive ao repo privado sem mudar nada. O `dist/` commitado continua
  reprodutível. Nenhuma mudança de outro repositório chega em produção sem ter passado por
  `tsc` e `vitest`. O `tsconfig` de terceiro nunca toca o nosso.
- **Por que este lado do trade-off:** a alternativa que dá frescor total é a que entrega
  mudança não revisada num app que publica sozinho em ~2 min a cada push na `main`. Com um
  dono só e nenhuma telemetria coletando, quebra em produção só é descoberta abrindo o app.

**O que este desenho NÃO faz, e é bom que não faça:** ele não torna o Soulmon capaz de refletir
uma mudança do canônico **sem um build**. Se um dia isso for requisito de verdade (conteúdo
editorial mudando toda semana), a resposta é o endpoint em runtime — mas para uma superfície
nova, mantendo o pipeline determinístico intocado.

---

## Consequências

**Aceitamos de bom:** o build para de depender de repo público, de SSH e de rede · o typecheck
estrito deixa de poder ser contaminado pelo `tsconfig` de outro repo · o `dist/` commitado volta
a ser reprodutível de verdade · a duplicação do teste-personalidade ganha dono e, no mínimo,
teste de paridade · toda propagação passa por `tsc` + `vitest` antes de existir como PR.

**Aceitamos de ruim, e fica escrito:**

- **Janela de divergência** entre o merge no canônico e o merge do PR aqui. Mensurável: é o
  tempo que o dono leva para ler um PR.
- **O repositório engorda** com o vendor. Some no ruído do `dist/` commitado.
- **Um PAT `fine-grained` read-only** para operar e rotacionar. É a única credencial nova, e ela
  **não** está no caminho do build. Rotação: anual, ou imediata se vazar.
- **Trabalho de uma vez** para gerar o artefato compilado do Class-System (um `npm run build`
  que hoje não existe lá — ele é TypeScript puro) e para extrair o motor do `soulProfile`.
- **O `sync-oracle-data.mjs` continua exigindo os clones irmãos e um `npm install` neles.** Ele
  virou script de CI, não de máquina de dev — e é assim que deve ser lido.

**Custo de infra:** **R$ 0/mês.** GitHub Actions em repo privado tem 2.000 min/mês gratuitos;
este workflow gasta ~3 min por disparo. Nenhum serviço novo, nenhum registry, nenhuma peça de
runtime.

**Gargalo nomeado, com volume:** o clone do Bestiário na CI é de **120 MB** (medido neste run) e
o `sync:oracle-data` percorre um corpus de **6.709 criaturas elegíveis** para amostrar 2.000. A
~3 min por rodada, isso é irrelevante no disparo por merge; **passa a doer se o gatilho virar
`push` em vez de merge na `main`** (dezenas de rodadas por dia) ou se o corpus crescer ~10×
(60 mil criaturas). Nos dois casos, a alavanca é `git clone --filter=blob:none --depth=1`, não
mais máquina.

---

## O que reverteria esta decisão

- **O dono decidir manter os repos públicos e publicar o `class-system` no npm** ⇒ o §1 vira
  desnecessário: `"class-system": "^1.2.3"` volta ao `package.json` e o vendor sai. É mais
  barato que o vendor, e a única razão de não ser a escolha é a intenção declarada de privar.
- **Conteúdo do Bestiário virar editorial de alta frequência** (mudanças semanais que precisam
  aparecer sem build) ⇒ o endpoint em runtime volta, **para uma superfície nova**, com o
  snapshot preservado como fallback e como fonte do pipeline.
- **O dono passar a trabalhar nos 4 repos na mesma sessão com frequência** ⇒ monorepo. O sinal
  concreto: PRs de sync que precisam de um PR correspondente no irmão para não quebrar — ou
  seja, quando a fronteira parar de ser fronteira.
- **A CI de sync abrir PR quebrado com frequência** (mais de ~1 em 4 rodadas) ⇒ o contrato entre
  os repos está errado, não a automação. A resposta é congelar o contrato do class-system num
  arquivo de máquina — que é o que o `taxonomy.json` já começou a fazer.
- **O `vendor/` divergir do canônico sem ninguém notar** ⇒ falta de teste de paridade. A resposta
  não é abandonar o vendor: é estender o `cascata.parity.test.ts` para cobrir a superfície nova.

---

## Perguntas endereçadas ao dono (`docs/DEPENDE-DE-VOCE.md`)

| | Pergunta | Impacto |
|---|---|---|
| 🔴 | **Antes de tornar o `Class-System` privado**: aceita que o `npm ci` do Cloudflare Pages para de resolver `git+ssh://` e o **deploy da `main` quebra no push seguinte**? A §1 precisa estar feita **antes** do clique em "make private". | Site fora do ar, sem aviso, num repositório que publica sozinho em ~2 min. |
| 🔴 | Autoriza criar um **PAT fine-grained read-only** nos dois repos irmãos como secret do Soulmon, e habilitar `repository_dispatch` no Class-System e no Bestiário? | Sem isso não há propagação viva nenhuma — só o sync manual de hoje. |
| 🟠 | Aceita a inversão do §3 — **o Soulmon é o dono do motor** de `soulProfile`, e o `teste-personalidade` passa a consumir o artefato e a ser só a porta de entrada? | Hoje são duas implementações do mesmo cálculo, sem paridade. A do Soulmon é a calibrada. |
| 🟠 | Quer o gatilho por **`repository_dispatch` (minutos)** ou só o **semanal**? O dispatch exige mexer nos workflows dos dois irmãos. | Define se "vivo" quer dizer minutos ou uma semana. |
| 🟡 | Uma tela de "explorar o Bestiário" dentro do Soulmon está no horizonte? | É o único caso em que o endpoint em runtime é a resposta certa. |

## Handoffs

→ **`alpha-backend`**: `POST /api/soul-profile/claim` com o contrato do §3 (idempotente, não
sobrescreve, `version` obrigatória).
→ **`alpha-delivery-ops`**: `.github/workflows/sync-irmaos.yml` (§4), o PAT, e o
`repository_dispatch` nos dois irmãos. **O PR nunca toca `dist/`.**
→ **`alpha-qa`** (pontos de falha a testar): vendor divergindo do canônico sem teste de paridade;
`claim` chamado duas vezes (o segundo **não** pode sobrescrever); PR de sync quebrando a cobertura
de 17/17 elementos; `sync:oracle-data` sem `node_modules` no clone irmão (deve dar mensagem, não
ENOENT — já corrigido neste run).
→ **`alpha-estrategista-negocio`**: custo **R$ 0/mês**; o custo real é tempo do dono lendo PRs.
→ **Gate:** `alpha-skeptic`.
