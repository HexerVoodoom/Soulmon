# QA rodada 2 — 03 · Negócio, benchmark e pesquisa E0 (salvo pelo coordenador a partir da resposta do agente)

Data: 22/09/2026 · alpha-estrategista-negocio + alpha-benchmark + alpha-gestor-pesquisa · base a6c1cd8a. Câmbio US$ 1 = R$ 5,40 [suposição].

## 0. Veredito
1. Economia por unidade fecha em todos os cenários (custo variável R$ 0,04–0,10/usuário ativo/mês; custo único por pagante R$ 1,11–2,63; receita líquida R$ 25,42; margem > 90 %). O que decide é FIXO × VOLUME: ponto de equilíbrio ~157 usuários ativos/mês (3 % conversão) a ~530 (1 %) com Starter + Workers Paid (R$ 108/mês).
2. **Free tier do Cloudflare estoura por ESCRITA de KV (1.000/dia) em ~18 DAU** (~55 writes/usuário/dia: save debounce 3 s + 2 puts por chamada de IA + telemetria). `_aiGuard.js` é fail-closed → `put` falho = 503 no chat; cloud save perdido em silêncio. E0 (10 + dono + 2º aparelho) = ~72 % do teto.
3. Higgsfield Starter (R$ 81 fixo) só compensa acima de 35 pagantes novos/mês; para o E0, Gemini avulso (fallback já implementado) custa R$ 23 vs R$ 92.
4. R$ 29,90 / US$ 6.99 coerente com o benchmark (Finch 9,99/mês; Habitica 4,99/mês; Pokémon Sleep 10/mês); Forest abandonou a compra única em 2026. US$ 6.99 = R$ 37,75 (+26 %) — é decisão de preço, não "conversão".
5. Cauda do chat com 8b e teto 120/dia: base R$ 0,5–1/ano/conta, teto R$ 11/ano. Único cenário que quebra a compra única: trocar o modelo (×60). **Demo tem a mesma cota de chat (120/dia) que pagante** — `AI_LIMITS.chat.perAccount` não olha tier.

## Passivos estruturais
- Rebirth promete 11 formas novas contra `perAccountLifetime: 26` sem reset de `aiLifetime` → renascido recebe arte de reserva após ~5 recusas. Decisão do dono (48 ou zerar no rebirth).
- Chat sem teto por tier: 1.000 demos no teto = R$ 950/mês, receita zero; alcançável por `curl` com conta grátis.

## Cenários (R$/mês)
| | 10 (E0) | 100 | 1.000 |
|---|---|---|---|
| Custo total (Starter) | 92,5 | 115 | 180 |
| Custo total (Gemini + Free/Paid) | 23,5 | 38 | 135 |
| Receita líquida | 0 | 76 | 763 |
| Margem (Starter / Gemini) | −92,5 / −23,5 | −39 / +38 | +583 / +628 |
KV writes: Free estoura em ~18 DAU; requests em ~1.600; Higgsfield 800 img/mês em ~72 pagantes novos/mês.

## Pesquisa E0
- Pergunta: adulto conhecido com versão completa volta por conta própria 14 dias e conclui coisas reais? Quando não volta: esqueceu / não viu valor / travou?
- Pré-registro (`docs/E0-PREREGISTRO.md`): H1 retenção por contexto (falsa se `retained.d7 ≤ 2/10` e ≥6 "esqueci"); H2 1ª tarefa como ativação (falsa se `first_task_done ≥ 7/10` e `retained.d7 ≤ 2/10`); H3 cortesia como diferencial (falsa se `reveal_seen.paid < 6/10` não testada, ou ≥8 e `retained.d7 ≤ 2`). Morte precoce: `onboarding_step.demo.35 < 7/10` até D+3. Denominador 10 pessoas; aparelhos do dono excluídos; codificação em 3 baldes por dois leitores; leitura só a partir de D7 do último convite; parada D+21.
- Roteiro D7 (8 perguntas, ler ao pé da letra, nunca dizer Oráculo/evolução/push/cortesia/gostou): semana com o app · última vez do começo ao fim · dia que pensou e não abriu · o que cadastrou (real?) · algo que não entendeu · descreve a criatura, mudou? · se sumisse amanhã · quer perguntar algo.
- Roteiro D14: segunda semana · mudou o jeito · algo fora do app lembrou · uma coisa real marcada · a criatura hoje, esperava algo? · quanto imagina que custa, uma vez ou por mês (nunca citar 29,90) · o que diria a um amigo · vai continuar / o que faria parar.
- n=10 NÃO conclui: taxa de retenção (3/10 = IC 7–65 %), conversão/preço (todos cortesia), canal, estranhos, plataforma, hábito × novidade, efeito de push (se worker off), desejabilidade (entrevistador = amigo).
- Consentimento da pesquisa SEPARADO dos Termos (`docs/E0-CONSENTIMENTO.md`): liga e-mail↔saveId a pessoa nomeada (fora da política), grava fala; controlador = dono; áudio ≤30 d, transcrições 12 meses; sair não tira a cortesia; sem remuneração; LGPD art. 7º I; 18+.

## Tabela final
| # | Achado | Sev | Conserto | Dono |
|---|---|---|---|---|
| 1 | Free tier estoura por KV writes em ~18 DAU; put falho = 503/save perdido | alto | Workers Paid antes do convite ou alerta; 1 put por chamada de IA | operador / architect |
| 2 | Starter só compensa > 35 pagantes/mês; E0 no Gemini custa 4× menos | alto (caixa) | pausar Starter (sem `HF_API_KEY` cai no Gemini) | dono |
| 3 | `AI_LIMITS.chat.perAccount` igual para demo e pago | médio | cota por tier (demo 30 / paid 120) | architect; dono aprova |
| 4 | Rebirth × `perAccountLifetime 26` sem reset | médio | 48 ou zerar no rebirth | dono |
| 5 | Troca de modelo de chat quebra a compra única | médio (regra) | linha no REGISTRO | doc-mantenedor + dono |
| 6 | `COURTESY_DEFAULT_MAX 25` ≠ plano 10 | baixo | secret = 10 | dono |
| 7 | comentário "conversão" em `FULL_UNLOCK_PRICE_LABEL_USD` | baixo | reescrever | squad |
| 8 | sem pré-registro nem consentimento de pesquisa | alto | criar os 2 docs, indexar, assinar antes do 1º convite | gestor-pesquisa + compliance + dono |
| 9 | entrevistador = dono = amigo | médio | roteiro literal; 2 leitores | — |
| 10 | economia não refeita desde 08/2026 | baixo | Parte 3 com a tabela | doc-mantenedor |
Sem dono: vigia de custo em dinheiro; plano contratado CF/Higgsfield; impostos BR; suporte no E0; iOS.
