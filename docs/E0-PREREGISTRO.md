# E0 — pré-registro do experimento (10 conhecidos, 14 dias)

> **Dono:** `alpha-gestor-pesquisa` (desenho) · controlador e entrevistador: **o dono do projeto** · **Data:** 22/09/2026 (QA Rodada 2, [`reviews/2026-09-22-qa-rodada-2/03-negocio-pesquisa-r2.md`](reviews/2026-09-22-qa-rodada-2/03-negocio-pesquisa-r2.md) §Pesquisa) · **Estado:** vivo — **rascunho até o dono datar e assinar o §9** (pergunta #71); depois do 1º convite, este documento **congela** (é o sentido de um pré-registro: hipótese e critério de falseamento escritos ANTES de existir dado)
> **Verificação:** os nomes de evento e chave citados aqui existem em `functions/api/metrics.js` › `applyAggregate` e em `src/utils/telemetry.ts` (`grep -n "retained\|first_task_done\|reveal_seen\|onboarding_step\|week_active" functions/api/metrics.js src/utils/telemetry.ts`); o leitor é `scripts/metrics-report.mjs` (`node scripts/metrics-report.mjs --days 21 --full`, com `METRICS_ADMIN_KEY`). O que este doc afirma sobre o app (cortesia, funil, push) é conferido contra [`manual/02-REGRAS-DE-NEGOCIO.md`](manual/02-REGRAS-DE-NEGOCIO.md) e [`manual/08-INTEGRACOES-E-DEPLOY.md`](manual/08-INTEGRACOES-E-DEPLOY.md)
> **Não cobre:** o texto do consentimento (→ [`E0-CONSENTIMENTO.md`](E0-CONSENTIMENTO.md)); quem faz o quê no E0 (→ `PERGUNTAS-DO-DONO.md` #51); o procedimento de cortesia (`grant`, `ENTITLEMENTS_ADMIN_KEY` — → [`PLAY-LANCAMENTO.md`](PLAY-LANCAMENTO.md) §E.1 e o runbook do `soulmon-operador`); a leitura do resultado depois de D21 (é do `alpha-insights`, e nasce como doc novo com o dado)
> **Precedência:** código > teste > `CLAUDE.md` > manual > este documento. Onde o app fizer diferente do que está descrito aqui, o app está certo e este doc tem defeito — e o defeito entra na leitura como limitação, não se corrige o dado.

---

## 0. Por que existe

O E0 (decisão #11, 21/09/2026: 10 conhecidos do dono, adultos, PWA, cortesia da versão
completa, 14 dias) estava pronto para **gravar** e não para **ser lido**: sem hipótese escrita
antes do dado, qualquer resultado confirma alguma coisa. A QA Rodada 1 pediu pré-registro
(`02-discovery-e0.md` R2); a Rodada 2 constatou que não existia (`03` #8, alto). Este é ele.

Regra do documento: **tudo que pode ser decidido antes do dado é decidido aqui**, com o número
que falsifica. O que só o dado pode responder fica na §7 como "não conclui".

## 1. A pergunta

> Um adulto conhecido, com a versão completa liberada por cortesia, **volta por conta própria
> durante 14 dias e conclui coisas reais** no app? Quando não volta: **esqueceu, não viu valor,
> ou travou?**

Não é pergunta de preço (todos têm cortesia), nem de canal (todos são convidados por
mensagem direta), nem de estranhos (todos conhecem o dono). Ver §7.

## 2. Hipóteses e critério de falseamento

Denominador em todas: **10 pessoas** (as convidadas, não as que instalaram). Aparelhos do dono
e o 2º aparelho de teste **excluídos** por `saveId` antes de qualquer contagem.

| # | Hipótese | Instrumento | **Falsa se** (escrito antes do dado) |
|---|---|---|---|
| **H1** | **Retenção vem do contexto** (a criatura reage ao dia da pessoa), não da novidade: quem volta no D7 volta porque o app entrou na rotina | `retained.d7` (`metrics.js`; marco por conta, lido no relatório) + entrevista D7 pergunta 3 ("dia que pensou e não abriu") | `retained.d7 ≤ 2/10` **e** ≥ 6 das 10 respondem "esqueci" na pergunta 3 (o app não entrou na rotina; não é falta de valor, é falta de lembrete — e isso é outra tese) |
| **H2** | **A primeira tarefa REAL é a ativação**: quem cadastra algo verdadeiro no D0–D1 volta; quem só olha o bicho não volta | `first_task_done` (funil de onboarding; `onboarding_step.<funil>.<n>`) cruzado com `retained.d7`; entrevista D7 pergunta 4 ("o que cadastrou — real?") | `first_task_done ≥ 7/10` **e** `retained.d7 ≤ 2/10` (fizeram a tarefa e mesmo assim não voltaram — a ativação não é essa) |
| **H3** | **A cortesia (versão completa) é diferencial percebido**: quem vê o Oráculo/sprite próprio volta mais | `reveal_seen.paid` (`reveal_seen.<funil>.sprite_*`) cruzado com `retained.d7`; entrevista D14 pergunta 5 ("a criatura hoje — esperava algo?") | **Não testada** se `reveal_seen.paid < 6/10` (a cortesia foi invisível — é o achado R-D1 da R1, "convidado com cortesia nunca é avisado", ainda aberto: registrar como limitação, não como resultado). **Falsa** se `reveal_seen.paid ≥ 8/10` **e** `retained.d7 ≤ 2/10` |

**Morte precoce** (para no D+3 e não espera D14): `onboarding_step.demo.35 < 7/10` até D+3 do
último convite — menos de 7 pessoas chegaram ao passo 35 do funil (nascimento) em 3 dias. Aí o
problema é o portão, não a retenção, e o E0 vira teste de onboarding.

## 3. Denominador, exclusões e leitura

- **n = 10** (convidados). Quem não instala conta como 0 em tudo — não sai do denominador.
- **Excluídos por `saveId`**: os aparelhos do dono (todos) e o 2º aparelho de teste. A lista
  de `saveId` excluídos fica com o dono (nunca neste doc — o `saveId` é derivável do e-mail).
- **Leitura só a partir de D7 do ÚLTIMO convite** (`retained.d7` só existe 7 dias depois de
  cada conta nascer; ler antes lê um subconjunto). Segunda leitura em D14 do último convite.
  **Parada em D+21** do último convite: depois disso nada mais entra.
- **Instrumento**: `node scripts/metrics-report.mjs --days 21 --full` (exige
  `METRICS_ADMIN_KEY` — definida no ar em 22/09/2026; o `--full` imprime todo prefixo com
  contagem > 0, o que cobre as chaves que hoje não têm linha própria — `04-dados-r2.md` §4).
- **Codificação das entrevistas em 3 baldes** — *esqueci* / *não vi valor* / *travei* — por
  **dois leitores independentes** (o dono e um agente `alpha-pesquisador-campo` sobre a
  transcrição), com desempate registrado. Um leitor só, sendo o entrevistador e o amigo, é o
  viés declarado em §7.

## 4. Roteiro D7 (8 perguntas — ler ao pé da letra)

Nunca dizer **Oráculo, evolução, push, cortesia, gostou**. Não corrigir a pessoa. Não explicar
o app. Gravar (com o consentimento assinado — `E0-CONSENTIMENTO.md`).

1. Como foi a semana com o app? (aberta; deixar falar)
2. Conta a última vez que você abriu, do começo ao fim.
3. Teve algum dia que você pensou no app e não abriu? O que aconteceu?
4. O que você cadastrou lá? Era coisa de verdade da sua vida?
5. Teve alguma coisa que você não entendeu?
6. Descreve a criatura para mim. Mudou alguma coisa nela desde o começo?
7. Se o app sumisse amanhã, o que aconteceria?
8. Quer me perguntar alguma coisa?

## 5. Roteiro D14 (8 perguntas — ler ao pé da letra)

Mesmas proibições. **Nunca citar R$ 29,90** nem nenhum preço.

1. Como foi a segunda semana?
2. Mudou o jeito que você usa o app em relação à primeira semana?
3. Aconteceu algo fora do app que te lembrou dele?
4. Me conta uma coisa real que você marcou como feita.
5. A criatura hoje — você esperava algo dela que não aconteceu?
6. Quanto você imagina que isso custa? Uma vez, ou por mês?
7. O que você diria a um amigo sobre o app?
8. Você vai continuar? O que te faria parar?

## 6. O que cada número vai dizer (tabela de decisão, antes do dado)

| Resultado | Leitura autorizada | Próximo passo autorizado |
|---|---|---|
| `retained.d7 ≥ 5/10` e balde "não vi valor" ≤ 2 | H1 sobrevive | E1 com estranhos (canal, não conhecidos) |
| `retained.d7 ≤ 2/10` e "esqueci" ≥ 6 | H1 falsa por lembrete | rever push/priming (`08` §2.6) **antes** de qualquer mudança de regra |
| `retained.d7 ≤ 2/10` e "não vi valor" ≥ 6 | H1 falsa por valor | volta ao discovery (`02-discovery-e0.md`), não ao código |
| `retained.d7 ≤ 2/10` e "travei" ≥ 4 | não é retenção, é bug/UX | os "travei" viram itens nomeados para o QA |
| `reveal_seen.paid < 6/10` | H3 não testada | R-D1 (aviso de cortesia) antes de repetir |
| `onboarding_step.demo.35 < 7/10` até D+3 | morte precoce | E0 vira teste de portão; nada de retenção se conclui |

## 7. O que n = 10 NÃO conclui (limites declarados)

- **Taxa de retenção**: 3/10 tem intervalo de confiança de ~7–65 % (Wilson 95 %). O E0 mede
  *direção e motivo*, não taxa.
- **Conversão e preço**: todos têm cortesia; a pergunta 6 do D14 mede *percepção*, não
  disposição a pagar.
- **Canal**: todos convidados por mensagem direta do dono.
- **Estranhos**: são conhecidos; a desejabilidade social é máxima (entrevistador = amigo).
- **Plataforma**: PWA Android + desktop; iOS/Firefox Android sem paridade declarada (#69).
- **Hábito × novidade**: 14 dias não separam os dois; H1 só diz se a rotina *começou*.
- **Efeito de push**: se o FCM estiver sem `FIREBASE_SERVICE_ACCOUNT` (#66), o APK não recebe
  push e a PWA recebe — anotar por pessoa qual superfície usou; sem isso, push é confundidor.
- **Desejabilidade**: o entrevistador é o dono e o amigo — por isso roteiro literal e dois
  leitores (§3).

## 8. O que este pré-registro NÃO muda no app

Nenhuma regra de jogo, nenhuma cota, nenhum texto. O E0 mede o app como está em
`a6c1cd8a` + as correções da Rodada 2 (o SHA do build usado entra no §9 na assinatura).
`TERMS_VERSION`/`PRIVACY_VERSION` **não mudam** durante o E0 (R1 `07` N9) — se mudarem, o
banner de termos vira variável de confusão e é registrado como tal.

## 9. Assinatura (o dono preenche — só depois disso o 1º convite sai)

| Campo | Valor |
|---|---|
| Data do congelamento | `[dono preenche]` |
| SHA do build no ar (`curl -s …/sw.js \| grep -m1 CACHE_VERSION` + `git log -1 --format=%h main`) | `[dono preenche]` |
| Data do 1º convite / do último convite | `[dono preenche]` / `[dono preenche]` |
| `ENTITLEMENTS_ADMIN_KEY` e `COURTESY_MAX_ACCOUNTS=10` definidos (prova: grant com chave errada → 401) | `[ ]` |
| `FIREBASE_SERVICE_ACCOUNT` no worker (ou "E0 sem push no APK" declarado) | `[ ]` |
| Consentimento (`E0-CONSENTIMENTO.md`) assinado por cada convidado antes do grant | `[ ]` |
| Assinatura | `[dono]` |
