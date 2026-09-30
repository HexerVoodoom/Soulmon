# Handoff — continuar na sessão LOCAL, sem depender do GitHub Actions

> **Etiqueta: plano** (30/09/2026). Para um agente rodando na máquina do dono (Windows, repo em
> `D:\Soulmon\repo`, PowerShell), com terminal, navegador logado e as contas dele. Não substitui o
> [`HANDOFF-SESSAO-LOCAL.md`](HANDOFF-SESSAO-LOCAL.md) (infra de 07/09); este é sobre **trabalhar
> sem Actions**.
>
> Estado de referência: `main` em `6d44c0f` + o commit que trouxe este arquivo e o `npm run portoes`.

---

## 1. O que aconteceu

- O workflow **`CI (typecheck + testes)`** termina em **~4 segundos com falha em TODO commit** —
  pelo menos desde a execução 634 (`78146c6c`, 30/09/2026), passando por `7a4bf5b`, `16fa385` e
  `6d44c0f`. Em 4 s nem o `npm ci` roda, e o log do job devolve **HTTP 404**: o runner não chega a
  executar nada. **Não é defeito de código.**
- Causa **provável, não verificada**: limite de minutos / cobrança do GitHub Actions na conta, ou
  Actions desativado no repositório. Onde o dono confere: GitHub → *Settings* → *Billing and plans*
  (uso de Actions) e o repositório → *Settings* → *Actions* → *General*.
- Na nuvem os portões locais passaram: `tsc` limpo, 6278 testes verdes e 1 vermelho
  (`tests/convertToWebp.test.ts`, caso "arquivo somente-leitura"). Esse vermelho é do **contêiner**:
  ele roda como root, e root ignora `chmod`. Numa conta comum do Windows deve passar; num
  PowerShell **como administrador** pode falhar do mesmo jeito.

## 2. O que cada workflow fazia, e o substituto local

| Workflow | Fazia | Na sessão local | Precisa quando |
|---|---|---|---|
| `ci.yml` | vendor + 3 `tsc` + `vitest` | **`npm run portoes`** (`scripts/portoes.mjs`, os mesmos passos na mesma ordem + guard do manual; `-- --build` inclui o `npm run build`) | **todo** commit que vai para a `main` |
| `docs-sync.yml` | guard do manual + `/manter-docs` | o hook de sessão já avisa `docs: DEFASADO`; rode **`/manter-docs`** | quando o briefing disser DEFASADO (hoje diz: 24 commits) |
| `android-build.yml` | APK debug + `.aab` assinado | `npm run build` → `npx cap sync android` → `cd android` → `.\gradlew assembleDebug` (JDK 21). Release: `.\gradlew bundleRelease -PRELEASE_STORE_FILE=… -PRELEASE_STORE_PASSWORD=… -PRELEASE_KEY_ALIAS=… -PRELEASE_KEY_PASSWORD=…` com o keystore local (senhas por variável de ambiente, **nunca** escritas em doc/commit) | só se mudou `android/` — o APK carrega a URL de produção |
| `desktop-build.yml` | instalador Windows, sem publicar | `cd desktop` → `npm ci` → `npx tsc --noEmit` → `npm run dist -- --publish never` | só se mudou `desktop/` |
| `desktop-release.yml` | publica GitHub Release (fonte do auto-update) | `npm run dist:publish` com `GH_TOKEN` — **só de propósito**: a `version` de `desktop/package.json` tem que ser a da tag; publicar instala em quem tem o overlay | release deliberado do dono |
| `sync-irmaos.yml` | sincroniza Class-System e Bestiário | clones irmãos lado a lado → `npm run vendor:class-system` **e** `npm run sync:oracle-data` (mesmo SHA) → `npm run portoes` → commit | quando os repos irmãos mudarem |

**O deploy web NÃO depende do Actions**: a `main` é a branch de produção da Cloudflare, que builda
sozinha no push (`CLAUDE.md` › Deploy). O worker de push continua manual (`wrangler deploy` em `workers/`).

## 3. O fluxo de merge sem CI

1. Trabalhe na branch combinada; ao terminar: **`npm run portoes`** (e `-- --build` se mexeu em
   assets/UI, porque `dist/` é commitado).
2. `git push -u origin <branch>` e abra o PR (web ou `gh`), colando no corpo a última linha do
   `portoes` — o PR fica com a evidência que o CI deixaria.
3. Merge ff-only: `git fetch origin` → `git merge-base --is-ancestor origin/main HEAD` (tem que
   sair 0) → `git push origin HEAD:main`. Na nuvem o `main` local estava sem histórico em comum
   com o remoto (`refusing to merge unrelated histories`); empurrar `HEAD:main` depois da checagem
   evita esse problema.
4. Se o GitHub recusar o push por **proteção de branch exigindo o check `tsc + vitest`**: isso é
   do dono (desligar a exigência enquanto o Actions estiver parado, ou consertar o Actions). **Não
   contorne** com push forçado.
5. O `CLAUDE.md` manda "esperar UMA vez o CI": sem CI, o `portoes` verde É essa espera. Não crie
   loop de checagem.

## 4. O que está aberto

- **Manual defasado** (24 commits desde `ae366480`): primeira coisa da sessão, `/manter-docs`.
- **Actions parado**: o dono decide entre consertar (cobrança/limite) ou seguir só local.
- **Benchmark**: o hub [`BENCHMARK-E-REFERENCIAS.md`](BENCHMARK-E-REFERENCIAS.md) e a `squad-benchmark`
  nasceram hoje; a lacuna mais urgente é `/squad-benchmark conferir BENCHMARK-COMBATE.md`
  (inteiro de memória).
- O resto do que depende do dono segue em `docs/STATUS.md` §3 e `docs/PERGUNTAS-DO-DONO.md`.

---

## 5. O prompt — cole na sessão local

```text
Você está na máquina do dono do Soulmon (Windows, PowerShell, repo em D:\Soulmon\repo).
O GitHub Actions está parado (todo job aborta em ~4 s, log 404) — trabalhe SEM depender dele.

1. `git fetch origin` e `git checkout main` + `git pull --ff-only`. Se o pull recusar, pare e me diga.
2. Leia docs/HANDOFF-LOCAL-SEM-ACTIONS.md inteiro; é o contrato desta sessão.
3. Invoque /soulmon start (o coordenador). Se o briefing disser "docs: DEFASADO", rode /manter-docs antes de qualquer trabalho novo.
4. Portão de TODO commit que vai para a main: `npm run portoes` (e `npm run portoes -- --build` se mexeu em UI/asset). Verde = pode mergear; vermelho = conserte, não mergeie. Se o único vermelho for tests/convertToWebp.test.ts e você estiver num terminal de administrador, rode de novo num terminal comum antes de concluir qualquer coisa.
5. Merge: ff-only, conferindo `git merge-base --is-ancestor origin/main HEAD` antes de `git push origin HEAD:main`. Se a proteção de branch recusar por falta do check do CI, pare e me avise — não force.
6. APK (android/) e desktop (desktop/) só se a mudança tocar essas pastas; os comandos locais estão no §2 do handoff. Nunca publique release do desktop sem eu pedir.
7. Ao fechar: bloco datado no docs/STATUS.md, e uma linha dizendo se o Actions voltou (rode um push e veja se o job passa de 4 s).

Primeira tarefa depois do /manter-docs: <descreva aqui o que quer fazer>.
```
