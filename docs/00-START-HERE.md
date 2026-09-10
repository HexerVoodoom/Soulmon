# Soulmon — por onde começar

App de produtividade gamificado (v-pet). React 18 + TypeScript + Vite 6 (web),
Capacitor (APK Android), overlay Electron em `desktop/`.

> ⚠️ **Este arquivo era o `00-START-HERE` do DigiApp** — abria com "DigiApp",
> se declarava "100% completo, 0 bugs" e descrevia estágios, HP e regras de
> evolução que não existem. O `docs/squad/00-BRIEFING.md` mandava agentes
> começarem por ele. O original está em `docs/historico-digiapp/`, junto com os
> outros sete que foram aposentados no mesmo dia; a lista do que cada um
> ensinava de errado está em `docs/historico-digiapp/LEIA-ANTES.md`.

## Leia nesta ordem

1. **`CLAUDE.md` (raiz)** — regras de jogo, arquitetura, footguns, convenções.
   É a fonte da verdade resumida, e precede o manual na hierarquia.
2. **`docs/STATUS.md`** — registro vivo: o que está no ar, achados em aberto,
   e a lista do que depende do dono. Leia no começo da sessão, atualize no fim.
3. **`docs/manual/00-MAPA.md`** — **a porta de entrada do manual completo**, e o
   único índice do repositório. Ele tem o protocolo de leitura para IA, o índice
   por assunto, o índice por pergunta ("vou mexer em X → leia Y, dono Z, régua
   W"), o índice por arquivo de código e a etiqueta de todo `.md` de `docs/`
   (vivo / registro / pesquisa / plano). **Leia-o inteiro antes de trabalhar em
   qualquer assunto** — é ele que diz o que NÃO ler primeiro.

Tudo o que existia neste arquivo como "mapa do resto" foi absorvido pelo
`docs/manual/00-MAPA.md`, seção 6. Não mantenha índice paralelo aqui: dois
índices divergem em silêncio, e há guard (`src/docsManual.contract.test.ts`)
que exige que o mapa alcance todo documento.

## Comandos

```bash
npm install
npm run dev                                  # desenvolvimento

npx tsc --noEmit                             # ANTES de todo commit
npx tsc -p tsconfig.server.json --noEmit
npx tsc -p desktop/tsconfig.json --noEmit
npx vitest run
npm run build                                # dist/ É commitado

npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts   # ao mexer em docs/
```

## A regra que vale para todos eles

**A régua viva é o teste, não o documento.** Onde uma tabela em markdown
discordar de um arquivo em `src/`, o arquivo ganha e o documento está com
defeito — foi assim que a pasta `historico-digiapp/` nasceu. A precedência
completa é: código > teste > `CLAUDE.md` > manual.
