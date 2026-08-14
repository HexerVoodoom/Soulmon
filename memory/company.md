# Company context — Soulmon

> Contexto compartilhado que toda persona lê antes de agir.
> (Substitui o `company.md` que veio no kit ProdSquad, que era de outro cliente —
> Tradicional.bet, apostas reguladas. Nada daquele domínio se aplica aqui.)

## Operador

- **Produto:** Soulmon — app de produtividade gamificado, gênero v-pet/Tamagotchi.
  O usuário cuida de uma criatura que evolui conforme ele cuida de si mesmo.
- **Repositório:** `HexerVoodoom/Soulmon` (fork do DigiApp — ainda divide URL de
  produção, namespace KV e projeto Firebase; ver `docs/SEPARACAO-DIGIAPP.md`).
- **Plataformas:** Web/PWA (Cloudflare Pages), APK Android (Capacitor 8.4),
  overlay Electron (`desktop/`). Stack: React 18 + TS + Vite 6, Cloudflare Pages
  Functions + Workers + KV, Groq (chat), Firebase Auth, Vitest.
- **Mercado:** BR + internacional. UI sempre PT-BR **e** EN.
- **Estágio:** pré-lançamento (Play Store e Steam pendentes — ver `docs/STATUS.md` §3).

## Guardrails inegociáveis (todo artefato respeita)

1. **A essência declarada** (`docs/PLANO-EVOLUCAO.md`): o Soulmon é um avatar que
   evolui COM o usuário e o encoraja — **nunca um cobrador**. Nenhuma mecânica pode
   punir ausência, explorar culpa ou usar dark pattern de compulsão. Teto de dano,
   perdão de ausência e alívio semanal são regra, não gentileza.
2. **Nada de terceiro entra no bundle.** Zero arte/nome de Digimon, Pokémon ou
   qualquer franquia — inclusive no prompt do gerador (`utils/oracle.ts`). Há teste
   travando. Ver `docs/Attributions.md`.
3. **Dinheiro é servidor, nunca cliente.** Créditos vivem em `ent:<saveId>`;
   um comprovante vale para uma conta só (`claimOrder`). Bits/Emblemas ficam no
   save do cliente **apenas enquanto comprarem só cosmético** (há teste travando).
4. **Privacidade:** PII do oráculo (nome, data/hora/local de nascimento) fica só no
   `localStorage`, nunca no `GameState`, nunca em `/api/save`. LGPD + ECA Digital
   (Lei 15.211/2025) aplicáveis — reroll pago com dinheiro real é risco aberto.
5. **Compatibilidade de save é sagrada.** Chaves `digiapp_*` e o binding
   `DIGIAPP_SAVES` são mantidos DE PROPÓSITO — renomear quebra quem já joga.

## Como isso molda cada disciplina

- **Produto/Estratégia:** retenção sem coerção; moat = a criatura gerada por usuário
  (identidade, não poder) + o laço de cuidado, não uma feature copiável.
- **Arquitetura/Backend:** Cloudflare KV é **eventualmente consistente** (~60s, cache
  de borda inclusive para chave inexistente) — qualquer coisa que dependa de
  atomicidade precisa de D1/Durable Objects, não de read-modify-write em KV.
- **Design/Frontend:** `src/index.css` é Tailwind v4 **pré-compilado** — classe
  utilitária que não está lá **não aplica nada** (já escondeu o checkbox central do
  app em 2px). Layout crítico vai em `style={{}}` inline. Todo texto nasce em EN
  com par PT-BR.
- **QA/Sweeper:** `npx tsc --noEmit` + `npx vitest run` + `npm run build` são gate de
  release. Regra copiada = regra que diverge em silêncio (o desktop reimplementa
  saveId e tabelas de HP — `desktop/renderer/src/cloudSync.test.ts` é o único ponto
  de paridade). Todo bug real vira teste de regressão.

## Tom

pt-BR, técnico/praticante. Registro vivo do projeto é `docs/STATUS.md` — ler no
começo e **atualizar ao terminar**. Guia de agentes é `CLAUDE.md` (o `PROJETO.md`
está desatualizado, é da era DigiApp).
