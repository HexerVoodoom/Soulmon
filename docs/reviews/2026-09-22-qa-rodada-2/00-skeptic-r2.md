# Skeptic R2 — correções de a6c1cd8a (salvo pelo coordenador; tabela final)
| # | Achado | Sev | Conserto | Dono |
|---|---|---|---|---|
| 1 | Lápide bloqueia o MESMO e-mail 30 d: login → conta nova → POST 410 → wipe+logout em loop (`cloudLoad`/`reconcileSaveId` ignoram `excluida`) | FATAL | `save.js`: `auth_time` do token > `tombstone.at` → `clearTombstone` e segue (`_auth.js` expor `auth_time`) | backend+frontend |
| 1b | `reagirContaExcluida` sem backup local | fixável | `CONFLICT_BACKUP` antes do remove | frontend |
| 2 | `PUSHIDX_MAX` expulsa inscrições reais (também benigno: 16 reinstalações de PWA) | alto | `kv.delete` do que sai do índice + autenticar saveId | backend |
| 3 | `orderDetails.slice(-200)` pode podar o pedido paid → auditoria rebaixa | baixo | nunca podar paid vivo | backend |
| 4 | fila hidden guarda props cruas; sem dedupe ONCE_PER_DAY | baixo | sanitizar; filtrar (e,d) | frontend |
| 5 | Gate WebView rotula Samsung Internet/Firefox como WebView | fixável | detectar `; wv)` | frontend |
| 6 | `qualDocMudou` com versão desconhecida afirma "Termos mudaram" | trivial | ilegível → both | frontend |
| 7 | 1.1.4 não identifica bundle web | baixo | `__BUILD_ID__` (SHA/CACHE_VERSION) | frontend |
| 8 | `connect()` em CONNECTING → DEVELOPER_ERROR | fixável | checar connectionState | android |
| 9 | fallback inexato até 1 h; `canScheduleExact` sem UI (guard tautológico) | fixável | `setWindow(10 min)`; UI | android+frontend |
| 10 | chatSafety EN "don't want to wake up early" → crise | fixável | exigir anymore | frontend |
| 11 | `ageDaysOf` em UTC: push 22h BRT sai no D0 | fixável | `T03:00:00Z` | backend |
| 12 | csp.test só inclusão; comentário "TRÊS" com 4 hashes | trivial | igualdade | security |
Ruído: ?src, bridgeReply URL, minimizeForAi data, manifest, _headers, confirmDelete teto, TTL índice, loop 5xx.
