# Chat com o Soulmon (agente): ações, dúvidas do jogo e feedback

> **Dono:** `functions/api/chat.js` (rota) · `functions/api/_chatActions.js` (schema das ações) ·
> `functions/api/_chatKnowledge.js` (busca) · `functions/api/_llm.js` (provedor) ·
> `src/utils/chatActions.ts` + `src/components/ChatActionCard.tsx` (cliente).
> **Pedido do dono:** 11/10/2026 ("ligar as IAs de chat com o Soulmon"). Decisão: `REGISTRO-DE-DECISOES.md` §32.
> **Voz:** a da bíblia (`NARRATIVA-E-UNIVERSO.md`, L1..L12). O pet nunca cobra.

## 1. Arquitetura

```
ChatBox (cliente) ──POST /api/chat──▶ guardAiRequest (cota/tier/custo, _aiGuard.js)
   │  message, history(3), context(inteiros),        │
   │  actions:true, behavior? (agregado)             ▼
   │                                      minimizeForAi (PII) → prompt de sistema
   │                                        + GAME FACTS (BM25, só se houver evidência)
   │                                        + BEHAVIOR SUMMARY (só se enviado)
   │                                        + ACTIONS (regras das ferramentas)
   │                                                  ▼
   │                                      _llm.js: Groq (tool calling) ─falha→ Gemini
   │                                                  ▼
   │                                      sanitizeToolCalls (schema + teto 2) → portão de intenção
   ◀── { response, actions? } ───────────────────────┘
   ▼
parseChatActions (2ª validação) → ChatActionCard → [Criar] → commitHabitCreate / commitTaskCreate
```

**Regra de ouro:** o modelo nunca escreve no save. Ele propõe; a pessoa confirma no cartão; o
App grava pelo MESMO portão que a UI usa (`commitHabitCreate`/`commitTaskCreate`, com teto do
demo, teto de estágio e telemetria `path: ai_chat`). Recusa por teto = aviso sem culpa.

## 2. Schema das ações (resposta `actions`, no máximo 2)

| `type` | Campos | Confirmação |
|---|---|---|
| `create_task` | `task: { name ≤60, category (8 enums), effort 1\|2\|3, date? YYYY-MM-DD }` | cartão (Criar / Editar nome / Agora não) |
| `create_habit` | `habit: { name ≤60, category, schedule, time? HH:MM }`, `schedule` = `{kind:'weekdays',days:[0..6]}` \| `{kind:'timesPerWeek',target:1..7}` \| `{kind:'everyNDays',n:2..60,from:'completion'}` | cartão |
| `flip_soulmon`, `fly`, `land` | — | leve: aplica direto via `applySpritePose` (`src/utils/spritePose.ts`) com "Desfazer" |

Argumentos de ferramenta do modelo: `create_habit(name, category?, cadence: daily\|weekdays\|times_per_week\|every_n_days,
days?, times_per_week?, every_n_days?, time?)` e `create_task(name, category?, effort?, date?)`. O servidor traduz
para o schema acima. `complete_task`/`list_today` ficaram de fora (o modelo não conhece ids do save; reabrir se o dono quiser).

**Camadas de defesa (todas testadas, `chat.actions.test.js`):**
1. Enum fechado, faixa numérica, nome saneado (uma linha, sem marcação, sem PII, ≤60); campo extra é ignorado.
2. Ferramenta desconhecida (`delete_save`, `set_tier`, `read_save`...) é descartada; teto de 2 por resposta ("crie 500 hábitos" → no máx. 2 cartões).
3. **Portão de intenção:** só passa se a ÚLTIMA mensagem da pessoa pede aquilo (verbo/substantivo de criar; verbo de pose). Modelo induzido a propor sem pedido é cortado.
4. Cliente revalida (`parseChatAction`) — `chatActions.parity.test.js` trava servidor × cliente.
5. Confirmação humana + portão único de criação.
6. Nada do corpo escolhe a conta: o `id` só vai ao `_aiGuard`; o prompt nunca recebe o `saveId`.

## 3. Dúvidas sobre o jogo (base curada)

- `scripts/gen-chat-knowledge.mjs` (`npm run gen:chat-kb`) lê `docs/manual/02-REGRAS-DE-NEGOCIO.md` (a frase "Em uma frase" + o 1º parágrafo sem código de cada seção) e `11-GLOSSARIO.md` (coluna "O que é") e grava `functions/api/_chatKnowledge.data.js` (~200 trechos, ~35 KB).
- Fora do índice: bastidor (admin/GM, KV, tokens, "NÃO implementada", nomes mortos ⚰️) e qualquer trecho com `<!-- kb:secret -->`, `[spoiler]` ou `🔒 spoiler` (use para lore que não deve ser revelado).
- Busca: BM25 simples no Worker (título pesa 3×, ponte EN→PT de vocabulário). Abaixo do limiar `MIN_SCORE` não há trecho, e o prompt manda dizer que não sabe. O modelo só responde regra a partir do bloco `GAME FACTS`.
- `chatKnowledge.stale.test.js` **reprova** se `docs/manual/` mudar e o índice não for regerado (`npm run gen:chat-kb`).

## 4. Feedback sobre o comportamento

- Cliente (`chatBehavior.ts`) agrega os últimos 7 dias: dias ativos, hábitos total/feitos/devidos hoje, constância média, hábitos quietos (só a contagem), tarefas feitas/abertas, escudos de descanso, humor médio, faixa do dia e categoria mais ativa. **Só inteiros e categorias fixas.**
- Só sai quando a pessoa pergunta como está indo (`FEEDBACK_ASK`) ou liga o **Comentário do dia** (Configurações do chat; padrão desligado; no máx. 1x/dia; só ao tocar no campo — nunca push, o nudge das 21h continua removido).
- Voz (regras no prompt, após o bloco NEVER ter precedência): nomeia o ATO e o efeito, nunca a pessoa (L1, L12); sem veredito, sem "parabéns/você merece"; sem contagem do que não foi feito (L3/L4/L6); um passo pequeno opcional como convite; sem conselho de saúde (L8/L9); 2–3 frases. Humor baixo no dia: acolhe e não propõe tarefa.

## 5. Provedor

`_llm.js`: Groq `openai/gpt-oss-120b` (produção, tool use — console.groq.com/docs/models, 11/10/2026), troca por var `CHAT_MODEL`. Falha de rede/5xx/429 → Gemini `gemini-2.5-flash` (`GEMINI_API_KEY`, chave em header). 400 `tool_use_failed` → repete sem ferramentas. Sem nenhuma chave: `500 AI not configured`, a UI avisa "o chat inteligente não está ligado agora" e segue com as respostas locais. Kill-switch `CHAT_DISABLED` (BETA-CONTINGENCIA §0.2).

**Custo zero (dono, 11/10/2026, REGISTRO §32):** só planos GRATUITOS. Groq `openai/gpt-oss-120b` (padrão; `reasoning_effort: low`, +300 de `max_tokens` para o raciocínio) — fonte console.groq.com/docs/rate-limits lida em 11/10/2026: 30 RPM · 1.000 RPD · 8K TPM · 200K TPD. `llama-3.3-70b-versatile` não aparece nessa tabela; terceiros (2026) dão 30 RPM · 1.000 RPD · 12K TPM · 100K TPD (metade dos tokens/dia). Reserva: Gemini `gemini-2.5-flash` gratuito (~10 RPM · ~250 RPD, guias de jan/2026; o Google manda conferir no AI Studio — **[DONO confere em aistudio.google.com/rate-limit]**). Com ~1.900 tokens/chamada: ~105 chamadas/dia no Groq + ~250 no Gemini. `_aiGuard`: 15/dia (demo) e 20/dia (pago) por conta, **250/dia no total e 4/min por conta** (antiabuso, REGISTRO §34). Os dois no limite → `429 ai-busy` e o Soulmon diz "Tô cansadinho agora… tenta de novo daqui a pouco?" (sem toast de erro). Nenhuma chave exige billing pago: crie a `GROQ_API_KEY` numa org Groq no plano Free e a `GEMINI_API_KEY` num projeto do AI Studio **sem** faturamento.

## 6. Privacidade

Sai do aparelho para Groq (e, na reserva, Google): mensagem (≤500 caracteres, PII removida por `_redact.js`), 3 últimas trocas, nome/estágio/galho/humor da criatura, inteiros de estado, `aiSettings`, e — **novo** — o resumo agregado acima (somente quando pedido/opt-in). Não sai: nomes de hábitos/tarefas, `soulGoal`/`soulStruggle`, save, e-mail. Nada é guardado no servidor (a memória é da sessão). Logs: só contagens/status; corpo de erro do provedor nunca é logado. Ver `PLAY-DATA-SAFETY.md` §2.3 e `PLAY-FICHA.md` §5.

## 7. Operar

`GROQ_API_KEY` (principal), `GEMINI_API_KEY` (reserva), `CHAT_MODEL` (opcional). Teste manual: `wrangler pages dev` com `.dev.vars` e `curl -X POST /api/chat` com `actions:true`. Regerar a base: `npm run gen:chat-kb`.
