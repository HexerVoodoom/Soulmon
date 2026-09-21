# Soulmon

App de produtividade gamificado (bichinho virtual, gênero v-pet): você cumpre tarefas da vida real e cuida de uma criatura que cresce com a sua constância. React 18 + TypeScript + Vite 6 (web/PWA), Capacitor 8.4 (APK Android) e um overlay Electron separado (`desktop/`). Backend em Cloudflare Workers/Pages Functions (`functions/`, `workers/`).

**Porta de entrada da documentação:** [`docs/manual/00-MAPA.md`](docs/manual/00-MAPA.md) — o manual completo (regras de negócio, telas, identidade, arquitetura, referência módulo a módulo, dados e save, deploy, histórico). Regras para agentes e footguns em [`CLAUDE.md`](CLAUDE.md); estado do projeto em [`docs/STATUS.md`](docs/STATUS.md).

## Comandos (rode antes de todo commit — fonte: `CLAUDE.md` › Comandos)

```bash
npx tsc --noEmit                            # typecheck do app
npx tsc -p tsconfig.server.json --noEmit    # functions/ e workers/
npx tsc -p desktop/tsconfig.json --noEmit   # overlay Electron
npx vitest run                              # testes
npm run build                               # vite build + PNG→WebP (dist/ é commitado)
```

Os fósseis do fork DigiApp (README, PWA-*, PROJETO, PLANO_MELHORIAS) vivem em `docs/historico-digiapp/` — registro, nunca instrução.
