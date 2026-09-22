# Segurança R2 — threat-model de a6c1cd8a (salvo pelo coordenador; tabela final)
| # | Achado | Sev | Conserto | Dono |
|---|---|---|---|---|
| 1.3 | Lápide só bloqueia `save.js`; `pushProfile` paralelo regrava `profile:`/`pid:`; sprite, rank, reinscrição seguem | Alto | `isAccountDeleted` dentro de `authorizeSaveAccess`; cliente só `pushProfile` após save ok | backend + frontend |
| 2 | `pushidx` envenenável: 17 POSTs anônimos com `saveId` da vítima expulsam a inscrição real (`PUSHIDX_MAX`) | Alto | `authorizeSaveAccess` no `saveId` de `subscribe`/`fcm-subscribe` (não-ok → grava sem saveId); `Authorization` no CORS; cliente manda Bearer; varredura quando índice cheio | backend + frontend |
| 1.1 | Exclusão sem reautenticação recente | Médio | `auth_time` ≤ 5 min nas 2 ações | backend + frontend |
| 1.2 | Recriação nos 30 d: `reconcileSaveId` ignora `excluida` → perde 3 s de jogo com mensagem errada | Médio | tratar `excluida` no portão com prazo; opcional `action=reopen` | frontend; dono decide |
| 1.4 | `del:done:` retém hash 30 d pós-exclusão, não declarado | Médio | política + Data Safety | compliance |
| 8 | Ack de compra no cliente antes do grant; sem ack no servidor | Médio | ack após `/api/billing` ok (ou no servidor) | backend |
| 6 | `ia.camposEnviados` não vê `fetch('/api/transcribe')` nem interior de `context`/`history` | Médio-baixo | estender teste | qa |
| 11 | `@capacitor/cli` em `dependencies` traz `tar` crítico; `depsVivas` legitima | Médio-baixo | mover para devDependencies; teste exige ausência | devops |
| 7 | `_redact.js` marca faixas/horários/anos como telefone/data | Baixo | separador obrigatório; data só com ano antigo | backend |
| 5 | 410 apaga local sem cópia | Baixo | backup em CONFLICT_BACKUP | frontend |
| 10 | `exp` chutado 1 h em vez de lido do JWT | Baixo | decodificar exp | desktop |
Limpos: fila hidden, `?src=`, alarme. `npm audit --omit=dev`: 1C+2A, todos via @capacitor/cli.
