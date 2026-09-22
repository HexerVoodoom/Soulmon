# Compliance R1 (salvo pelo coordenador — tabela final)
| # | Achado | Sev | Conserto | Dono |
|---|---|---|---|---|
| 1 | `App.tsx` › `PostponeNudgeSheet` › `runDecompose` manda `task.name` ao Groq; política §2b/§3 e termos §9 negam | BLOQUEIA alto | declarar OU mandar só categoria; guard chamadores de `suggestTasks` × campos | squad + dono |
| 2 | `GameTutorialFlow.tsx` › `useState(soulGoal)` pré-preenche `goalText` → Groq; §2/§2b/DS §2.6 dizem "não passa por IA" | BLOQUEIA alto | declarar OU `useState('')` | squad + dono |
| 3 | `customKeywords` no prompt de sistema; §2b "nunca texto seu" | RISCO médio | §2b+§6 | squad |
| 4 | `moodToday`, estágio, galho, tom vão ao Groq; §2b lista 4 números | RISCO baixo | completar lista | squad |
| 5 | Transcrição = Supabase (repasse) + Groq Whisper; nenhum nomeado | LACUNA médio | nomear nos 3 docs | squad |
| 6 | Aviso in-app (SettingsPage) não diz "sem revisão humana/não é emergência/sons"; DS §3b e FICHA §5 dizem que diz | RISCO médio | frase PT/EN | squad |
| 7 | DS §2.7 diz push "não cruzado com o save"; agora grava `saveId` | RISCO médio | reescrever §2.7 + política §2 | squad |
| 8 | Termos §8 mistura ponte local (voz de pet, EN sem site) e servidor (larga voz, sem canal) | RISCO médio | redação fiel; `bridgeReply` EN ganha findahelpline | squad (#27) |
| 9 | `Attributions.md` diz que nomes de franquia saíram do prompt; `oracle.ts` › `imagePrompt` os cita | RISCO médio | reescrever item | squad-docs |
| 10 | Steam fora da política §6 | LACUNA baixo | quando sair da C3 | — |
| 11 | Save expira 365 d (`SAVE_TTL_SECONDS`); política silenciosa | LACUNA baixo | §8 | squad |
| 12 | `ent:` "5 anos" sem âncora | baixo | "a partir da exclusão" | squad |
| 13 | IARC UGC omite nome do grupo coop | baixo | FICHA §4 | squad-docs |
| 14 | FICHA §5 / LANCAMENTO D.5/H.3 apontam buraco §2.3 já fechado | baixo | apagar notas | squad-docs |
| 15 | US$ 6.99 fonte = plano | baixo | redação A/B | dono #25 |
Perguntas ao dono: tarefa/soulGoal no Groq (declarar ou cortar); Supabase como terceiro; encarregado LGPD; cortesia nos termos; US$ A/B; Steam na política; retenção do save 365 d.
Sem dono: base normativa documentada (§6 do contexto); guard "que campos saem para IA".
