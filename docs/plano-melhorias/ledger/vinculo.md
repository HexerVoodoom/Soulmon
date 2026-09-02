# Ledger — guarda-vínculo (WP3.1–3.5)

Dono: `soulmon-guarda-vinculo`. Anexo: `../C-presenca.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP3.1 | Contexto + memória curta no chat | `PROPOSTO` (camada `soulGoal` em texto: `BLOQUEADO:D8`) | `grep -q "CONTEXT" functions/api/chat.js` + teste do servidor rejeitando `context` com string + teste do cliente: `context` nunca contém texto de tarefa | hoje `messages=[system,user]`, sem memória |
| WP3.2 | Voz nos momentos mudos + o pet olha a assombrada | `PROPOSTO` | `grep -c "haunted" src/components/CompanionHUD.tsx` → ≥1; teste por kind; nenhuma frase com "deveria/atrasou/falhou" | `CLAUDE.md` prometia e não existia |
| WP3.3 | Título do Vínculo sob o nome + micro-cerimônia | `PROPOSTO` | `grep -q "bondTitle" src/components/CompanionHUD.tsx` + `bond_level` emitido | comentário de `BOND_REWARDS` mentia |
| WP3.4 | Push: fonte única, sem dedup PWA×APK, com win-back | `PROPOSTO` | `! grep -q "passou pra dizer oi" src/components/NotificationManager.tsx` (copy só em `_pushCopy.js`) + teste do scheduler com `refreshedAt` 3/6/15/40 dias → 0/1/1/0 + `wrangler deploy` manual | copy duplicada hoje (footgun 9) |
| WP3.5 | Um som de presença | `BLOQUEADO:D11` | `grep -q "playChirp" src/utils/sounds.ts` + respeita `SOUND_MUTED` + 1× por sessão | nenhum som ligado à voz hoje |

## Verdades deste domínio que o guarda defende
- O chat é o canal de vínculo **mais potente e mais arriscado** (efeito ELIZA). O prompt tem um bloco `NEVER` (culpa/vergonha/cobrança) que **sobrepõe** até o estilo do usuário — não se enfraquece.
- Texto do usuário (`soulGoal`, nome de tarefa) **não vai para IA** sem decisão D8 — `_redact.js` garante isso hoje.
- Push é **em nome do pet** e nunca cobra. O nudge das 21h ("está preocupado! Complete suas tarefas") foi removido de propósito — não volta.
- Win-back tem **duas** mensagens (D5–7, D14–16) e depois **silêncio**. Quem sumiu não é perseguido.
- `bondLevel` **nunca** é persistido — sempre `bondLevelFor(totalXP)`.
