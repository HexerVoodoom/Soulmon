# Play Console — rascunho de preço e descrição (NÃO PUBLICADO)

> Rascunho de 01/11/2026. Nada foi enviado à Play. Base: `docs/PLANO-ONBOARDING-VELADO.md` (D8, D9, D30–D34, §6.1, §15) e `docs/PLAY-FICHA.md` (ficha vigente). O dono executa o console.

## 1. Produto `soulmon.unlock.full` (compra única)

| Campo | Valor |
|---|---|
| Preço Brasil | R$ 19,90 (D9, decidido) — **confirmar no console** |
| Preço EUA | US$ 3,99 (D9) — **confirmar no console** |
| Demais países | [preço a definir pelo dono] (a Play converte; conferir arredondamento) |
| Quando trocar | No dia em que `ONBOARDING_VELADO` for ligado (PERGUNTAS-DO-DONO, 30/10, item 1) |
| Código | `FULL_UNLOCK_PRICE_LABEL(_USD)` já seguem D9 com o interruptor ligado; `publishedPrice.test.ts` trava o HTML |
| Assinatura trimestral de cenários | [preço a definir pelo dono] (sem decisão nova neste plano) |
| Pacotes de créditos | [preço a definir pelo dono] |

## 2. Regras free / paid (para a descrição e o suporte)

- **Free**: recebe um BB pronto do pool (D30), sem custo de API. Evolui BB → rookie de graça (D8), com BB atingindo Vínculo 2 (D4). Do rookie em diante, evoluir exige o desbloqueio.
- **Paga de cara** (D31/D33): compra confirmada pelo **servidor** até o reveal (mesmo comprada no meio do onboarding) → ganha o próprio bebê exclusivo gerado.
- **Paga depois** (D32): mantém o BB do pool; a primeira forma exclusiva é o rookie.
- O BB exclusivo consome 1 geração do teto vitalício e conta como mais uma forma no teto por forma (D34).
- Linha vermelha: dinheiro nunca compra cuidado nem HP.
- BB fica trancado em Torneio, Duelo PvP e Guilda (D5): não prometer isso na loja.

## 3. Trecho substituto da descrição longa — PT-BR

Substitui o bloco "O QUE É GRÁTIS E O QUE NÃO É" de `PLAY-FICHA.md` §1.3 (limite total 4.000; reconferir a contagem ao colar).

```
★ O QUE É GRÁTIS E O QUE NÃO É

Você começa de graça com um bebê Soulmon, e ele evolui sozinho até a primeira forma, só com o seu dia. Um único desbloqueio, pago uma vez, abre o resto da linha de formas, geradas a partir das suas respostas. Quem desbloqueia desde o início ainda ganha um bebê exclusivo, só seu. Créditos, opcionais, pagam uma nova leitura das suas respostas — determinística, nunca sorteio. Nada do que se compra muda a regra de mudança de forma: ela vem do seu dia, não do seu cartão.
```

## 4. Trecho substituto — EN

```
★ WHAT'S FREE AND WHAT ISN'T

You start free with a baby Soulmon, and it evolves into its first form from your day alone. A single one-time unlock opens the rest of the form line, generated from your answers. If you unlock from the start, you also get your own exclusive baby. Credits, optional, pay for a new reading of your answers — deterministic, never a lottery. Nothing you buy changes how forms change: that comes from your day, not your card.
```

## 5. Velados (se entrar na ficha)

O Oráculo vira um Velado ancião (D1) e há a Guilda de Mercenários com Velados das Ordens (D22: "Ordem"/*Order*). Sugestão: **não citar nome de personagem** na ficha; no máximo "um ancião que apresenta a missão". Nomes do ancião e do Velado da Mão: [nome a definir pelo dono]. Revisar `narrative-critic` antes de colar.

## 6. Itens do console que são do dono

- Trocar preço do produto (item 1) no dia de ligar `ONBOARDING_VELADO`.
- Data Safety: seção de ads só se ads forem mantidos (#14); declarar token FCM (#21); `freeGen` (hash do e-mail + URL) sobrevive à exclusão (D28) — conferir `PLAY-DATA-SAFETY.md`.
- Declaração de IA generativa (`PLAY-FICHA.md` §5) segue valendo; BB do pool é arte pré-gerada, não geração em tempo real.
- Publicar `termos.html` novo (ver `termos.rascunho.html`) **e** decidir o reaceite (#24/QA-13): subir `TERMS_VERSION` muda o consentimento de todos.

## 7. Lacunas abertas

1. Preços fora BR/EUA, assinatura e créditos: [preço a definir pelo dono].
2. Nomes do ancião e do Velado da Mão.
3. Decisão de reaceite ao subir `TERMS_VERSION` (#24).
4. Contagem de caracteres das descrições novas não foi medida contra o limite de 4.000.
5. Termos §8 (IA/crise) e MIS-15 já constam em `termos.html`; não foram alterados no rascunho.
