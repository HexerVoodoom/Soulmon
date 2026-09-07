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
   É a fonte da verdade e o único doc que se pretende completo.
2. **`docs/STATUS.md`** — registro vivo: o que está no ar, achados em aberto,
   e a lista do que depende do dono. Leia no começo da sessão, atualize no fim.
3. **`docs/PLANO-EVOLUCAO.md`** — a essência declarada do produto e o benchmark
   de onde ela saiu. Rege as decisões de regra.

## Comandos

```bash
npm install
npm run dev                                  # desenvolvimento

npx tsc --noEmit                             # ANTES de todo commit
npx tsc -p desktop/tsconfig.json --noEmit
npx vitest run
npm run build                                # dist/ É commitado
```

## Mapa do resto

| Assunto | Onde |
|---|---|
| Motor de tarefas (hábito × tarefa) | `docs/PLANO-TAREFAS.md` |
| Pacotes de melhoria e o ledger | `docs/PLANO-MELHORIAS.md` · `docs/plano-melhorias/LEDGER.md` |
| Auditoria de alinhamento mais recente | `docs/AUDITORIA-ALINHAMENTO.md` |
| Herança do fork e o que falta separar | `docs/SEPARACAO-DIGIAPP.md` |
| Telas, palco e decoração | `docs/INVENTARIO-TELAS.md` · `docs/PALCO-E-DECORACAO.md` |
| Oráculo (leitura + criação da criatura) | `docs/ORACULO.md` |
| Cobrança e compras | `docs/BILLING-SETUP.md` |
| Overlay Electron | `desktop/README.md` · `docs/PLANO-DESKTOP-STEAM.md` |
| Arte de terceiro: o que saiu e por quê | `docs/Attributions.md` |
| O que só o dono pode fazer | `docs/DEPENDE-DE-VOCE.md` |

## A regra que vale para todos eles

**A régua viva é o teste, não o documento.** Onde uma tabela em markdown
discordar de um arquivo em `src/`, o arquivo ganha e o documento está com
defeito — foi assim que a pasta `historico-digiapp/` nasceu.
