# Lançamento — o que depende do dono (11/10/2026)

Etiqueta: **vivo** (riscar à medida que o dono fizer). Base: `f3acead1`. A auditoria
que sustenta a lista é [`AUDITORIA-SEGURANCA-LANCAMENTO.md`](AUDITORIA-SEGURANCA-LANCAMENTO.md);
as decisões de produto abertas estão em [`PERGUNTAS-DO-DONO.md`](PERGUNTAS-DO-DONO.md).

- [ ] **Higgsfield — arte a gerar:** o pedido do **Level Up do Vínculo** (`ASSETS-A-GERAR.md` §16, segunda seção com esse número) e os **pacotes das sombras do Pesadelo** (§17; hoje roda placeholder em `utils/nightmareShadows.ts`).
- [ ] **Higgsfield — fixar o HOST do CDN** na allowlist de URL de sprite (`isSafeSpriteUrl` só fecha o esquema; o beacon `https://…/x.png` só se fecha fixando o host).
- [ ] **Rate Limiting no painel do Cloudflare** (o `takeToken` do código vive na memória de cada isolate e não basta; ver a auditoria, seção "Aberto").
- [ ] **Novo APK:** `@capacitor/*` foi para **8.4.3** (GHSA-rvm3-566m-v7fv) e as notificações nativas mudaram (permissão na 1ª abertura); só o `android-build.yml` + Play entregam isso. Web não precisa.
- [ ] **Worker de push:** `wrangler deploy` dentro de `workers/` (ritmo das refeições mudou o `push-scheduler.js`).
- [ ] **Segredos do `/api/transcribe`:** `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY` — e `FIREBASE_PROJECT_ID` (a rota agora exige o ID token e é fail-closed: 503 sem ele).
- [ ] **Conferir no aparelho:** onboarding de 3 blocos, tour do corvo, Level Up, masmorra idle, comida premium, música por superfície, notificações no APK.
- [ ] **Próxima rodada (decisão do dono):** a masmorra passa a usar a **energia da Home** e um **teto de andares por nível** (fases até 999). **Atualizado 11/10/2026 (C6):** já implementado (STATUS, REGISTRO §31): energia por camada, teto 999, Level Up restaura. O que falta são as constantes do dono (4 h, 25%, curva da zona, sumidouro de Bits).
- [ ] As 11 decisões L1–L11 de `PERGUNTAS-DO-DONO.md`.
