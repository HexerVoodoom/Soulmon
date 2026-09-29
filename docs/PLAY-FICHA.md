# Ficha da Google Play — Soulmon (PT-BR + EN, pronta para colar)

> **Para que serve:** tudo que o Play Console pede na aba *Presença na loja › Ficha
> principal da loja* e em *Conteúdo do app*, já no limite de caracteres e já filtrado
> pelo vocabulário da bíblia (`docs/NARRATIVA-E-UNIVERSO.md` §12–§13) e pela decisão
> #14 do dono (a marca **Soulmon** fica — `docs/REGISTRO-DE-DECISOES.md` §14.1). O
> rascunho anterior com `[NOME]` (`docs/reviews/2026-08-03/soulmon-growth-aso.md`
> Anexos A/B) está **superado** por este arquivo: ele falava "dia perfeito" (hoje é
> **dia completo**, P5), cobrava na voz do mundo ("abandonar dói", "não te dá parabéns
> por nada" — vetado por L1–L6 da bíblia) e ainda não existia a declaração de IA
> (decisão #22).
>
> **Quem cola é o dono** (decisão #16). O passo a passo do console, com a ordem e o
> critério de "feito", está em [`PLAY-LANCAMENTO.md`](PLAY-LANCAMENTO.md) §C.
>
> **Atualizado em:** 22/09/2026 (QA rodada 1 — fecho, título EN, claims "igual"/"faltou", UGC, §5, D.7). Antes de colar, confira: o nome "dia completo"
> (`CLAUDE.md` › Regras do jogo ⭐), o Torneio ainda ligado (`functions/api/community.js`
> › `match`), e a lista de permissões de `docs/PLAY-DATA-SAFETY.md` §2.4.

---

## 0. Identificadores (não mudam entre idiomas)

| Campo do console | Valor | Fonte |
|---|---|---|
| Nome do pacote (`applicationId`) | `com.hexervoodoom.soulmon` | `android/app/build.gradle` › `defaultConfig.applicationId` |
| Nome do app | `Soulmon` | `capacitor.config.json` › `appName` |
| Idioma padrão da ficha | **Inglês (Estados Unidos) — en-US** | `CLAUDE.md` › "Idioma: inglês é a base"; PT-BR entra como tradução |
| Categoria | **Estilo de vida** (Lifestyle) | Anexo A.7/B.7 da review de 03/08 — argumento em §"CATEGORIA DE LOJA" daquele arquivo: prateleira de *care*, não de produtividade |
| Tags (até 5, o console oferece a lista) | `Hábitos`, `Bichinho virtual`, `Autocuidado`, `Pixel art`, `Produtividade` — escolher as que existirem na lista do console, nesta ordem | `[a confirmar no Play Console]` — a lista de tags é fechada e muda |
| E-mail de contato | `mateus.sprnd@gmail.com` | o mesmo de `public/privacidade.html` (§"Dúvidas") e do VAPID (`docs/STATUS.md` §3.2 ✅) |
| URL da política de privacidade | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html` | `public/privacidade.html` — a mesma página responde em `/privacidade` (é a URL que `PLAY-DATA-SAFETY.md` §0 usa); as duas valem, cole a com `.html` |
| URL de exclusão de conta | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html#exclusao` | âncora `id="exclusao"` em `public/privacidade.html` (§8) |
| Site (opcional) | `https://soulmon.mateus-sprnd.workers.dev` | `CLAUDE.md` › Deploy |
| Ícone 512×512 (PNG 32-bit, sem alfa) | `public/favicon-512x512.png` **depois de conferido a olho** | pedido §6.4 abaixo — a review 12 §1 suspeita que ainda seja a arte "D" do DigiApp |
| Público-alvo | **18+** (não é app para crianças) | decisão #15 (`docs/PERGUNTAS-DO-DONO.md`); `PLAY-DATA-SAFETY.md` §0 |
| Anúncios | **Não contém anúncios** | `docs/BILLING-SETUP.md` §4b (`ADMOB_SSV_ENABLED` ausente); decisão #14 mantém desligado |
| Plataformas suportadas (não é campo do console — é a régua de "isto é bug nosso?") | **Android Chrome (PWA e APK) + desktop Chromium** = suportados; **iOS e Firefox Android** = melhor esforço (sem push, e no iOS o storage é separado e apagável) | decisão do dono **#49/#69**; detalhe em [`docs/manual/01-VISAO.md` §9b](manual/01-VISAO.md) |

---

## 0b. A tagline ÚNICA (decisão do dono **#70**, 22/09/2026)

| | |
|---|---|
| **PT-BR** | **Ela cresce com o seu dia.** |
| **EN** | **It grows with your day.** |

Uma frase, em todas as superfícies. Onde ela já está aplicada:

| Superfície | Campo | Estado |
|---|---|---|
| Site / link compartilhado | `index.html` › `<meta name="description">` e `<meta property="og:description">` | ✅ abre com a tagline + frase de apoio |
| PWA (tela de instalar) | `public/manifest.json` › `description` | ✅ mesmo texto (o guard exige `manifest.description == meta description`) |
| Feature graphic da Play | pedido §6.3 | ✅ já pedia esta frase — foi de onde ela saiu |
| Ficha da Play (título/curta/longa) | §1 e §2 | ⬜ **de propósito não mudou**: título (30) e descrição curta (80) têm limite de caracteres e copy já validada pela squad-narrativa em 22/09; a tagline é a assinatura da MARCA, não o texto da vitrine |

⚠️ **O que a decisão resolve:** havia **três** frases de abertura diferentes —
`meta description`, `og:description` e o manifesto, cada uma com a sua. Quem
colava o link, quem instalava o PWA e quem abria a loja lia produtos diferentes.
A **frase de apoio** pode variar por superfície (limite de caracteres); a
**tagline** não.

**Guard executável:** `src/deploy/manifest.contract.test.ts` — exige que as
três descrições **comecem** com a tagline PT, e que as duas versões da frase
estejam neste arquivo. Mudar a tagline quebra o teste em vez de divergir em
silêncio.

---

## 1. Ficha PT-BR (Português — Brasil)

### 1.1 Título — máx. 30 · **28**

```
Soulmon: Nasce das Respostas
```

> 22/09/2026 (QA rodada 2, `02-narrativa` §2): a squad-narrativa validou a sugestão
> registrada em §2.1 — criatura como sujeito, sem espelho, sem espera; e o título
> PT passa a falar a mesma língua da descrição curta e do título EN.

### 1.2 Descrição curta — máx. 80 · **72**

```
Uma criatura que nasce das suas respostas e muda de forma com o seu dia.
```

### 1.3 Descrição longa — máx. 4.000 · **3.376**

```
Ele nasce das suas respostas. E muda de forma com o que você faz.

Responda ao Oráculo — seis perguntas sobre você — e uma criatura se assenta no visor. A linha de formas dela é gerada a partir das suas respostas: cada resposta diferente gera uma criatura diferente, e mudar uma resposta muda quem ela vai ser. Do outro lado da tela, o seu dia é o que dá corpo a ela.

Não há veredito aqui. O Soulmon não te dá nota, perdoa um dia sem marcar por semana, sozinho, e não manda mensagem cobrando. Depois de dois dias seguidos sem marcar, ele pergunta — e oferece uma versão menor. Ele mostra. Você olha, e decide.

━━━━━━━━━━━━━━━━━━━━━━

★ O DIA, DO SEU JEITO

• Tarefas e hábitos de verdade — os seus, do mundo físico. Uma tarefa pesa pelo esforço que exige, não pela quantidade.
• Cada conclusão vira uma ocasião para a criatura: energia, e uma inclinação que decide o galho que ela vai seguir.
• Dia completo: cumprir o que você mesmo combinou. É isso que aproxima a próxima forma.
• A mudança de forma é sua: quando o caminho está pronto, você toca nela. Nunca acontece sem você.
• Constância, não sequência: o app conta "quantas das últimas sete", então uma falha custa pouco — nunca zera tudo.
• Escudos de descanso: dias de boa constância geram proteção, usada sozinha quando você precisa. Sem lembrar de ativar.
• Dois dias seguidos sem marcar e a criatura oferece uma versão de cinco minutos. Aceitar conta.

★ CUIDAR É PARTE DO DIA

• Alimente, e a comida que você escolhe inclina a forma seguinte.
• Faça carinho, dê banho, ponha para dormir, recolha o que ela deixa pelo abrigo.
• Converse com ela. Ela fala pouco, tem sono, tem opinião — e fala do que está sentindo, não do que você fez.
• Num dia sem o bastante, ela recua para uma forma que se sustenta com menos. Voltar sempre dá, e nada do que você construiu se apaga.

★ QUANDO O DIA ACABA

• As fendas: cinco camadas, seis encontros por camada, com achados raros.
• Torneio de fim de semana, contra outros jogadores, em faixas que medem você contra você mesmo antes de qualquer ranking.
• Grupo cooperativo por código de convite: quem apareceu hoje, e só isso.
• Janela de descanso e 30 cenas de sono colecionáveis — premiam deitar no horário, nunca dormir "bem".
• Loja de cenários e decoração com a moeda que você ganha jogando.

★ FEITO PARA CABER NA VIDA

• Lembretes que respeitam o que você já fez — se o dia está fechado, o app cala.
• Relatório do dia e da semana, com o check-in de humor que você responde se quiser.
• Pixel art dentro do visor, interface limpa por fora. Sem anúncios.
• Português e inglês. Funciona no navegador e no Android, com o mesmo save.

━━━━━━━━━━━━━━━━━━━━━━

★ O QUE É GRÁTIS E O QUE NÃO É

Você começa com uma das criaturas de demonstração, sem pagar nada. Um único desbloqueio, pago uma vez, gera a criatura só sua a partir do Oráculo. Créditos, opcionais, pagam uma nova leitura das suas respostas — determinística, nunca sorteio. Nada do que se compra muda a regra de mudança de forma: ela vem do seu dia, não do seu cartão.

★ SOBRE A IA

A imagem da sua criatura e as falas dela são geradas por inteligência artificial, sem revisão humana. A conversa não é aconselhamento nem serviço de emergência. Os detalhes estão na política de privacidade e nos termos, dentro do app.

━━━━━━━━━━━━━━━━━━━━━━

Sua criatura nasce das suas respostas — e cresce com o que você faz.
```

> Fecho anterior — *"Ela está esperando. Ela vai se parecer com você."* — saiu em
> 22/09/2026: reprovava L2 (a criatura não é espelho) e L11 (emoção da criatura
> causada pela ausência da pessoa). Achado de `00-design-narrativa-a` /
> `06-guardas-squads-r1` #3. O fecho novo não afirma espera nem semelhança.

---

## 2. Ficha EN (English — United States) — idioma padrão

### 2.1 Title — max 30 · **29**

```
Soulmon: Born of Your Answers
```

> Escolha de 22/09/2026 (marca-crítico §3.1: `Habit Pet` falhava o teste de troca de
> logo — servia igual para o Finch). Duas opções avaliadas, ambas ≤ 30:
> **(A) `Soulmon: Born of Your Answers`** (29) — o Oráculo é o único gancho que só o
> Soulmon tem; é a mesma frase da descrição curta, então título e curta falam a
> mesma língua. **(B) `Soulmon: Pet That Takes Form`** (27) — o mecanismo, mas
> "takes form" sozinho é obscuro na busca. Fica **A**. O PT (`Bichinho de Hábitos`,
> 28) falha pelo mesmo motivo e deve seguir A quando a squad-narrativa validar:
> sugestão `Soulmon: Nasce das Respostas` (28).

### 2.2 Short description — max 80 · **70**

```
A creature born from your answers. It takes new forms as your days do.
```

### 2.3 Full description — max 4,000 · **3,338**

```
It is born from your answers. And it takes new forms from what you do.

Answer the Oracle — six questions about you — and a creature settles in the visor. Its line of forms is generated from your answers: every different answer generates a different creature, and changing one answer changes who it becomes. On the other side of the screen, your day is what gives it a body.

There is no verdict here. Soulmon doesn't grade you, forgives one unmarked day a week on its own, and doesn't message you to nag. After two days in a row without one, it asks — and offers a smaller version. It shows. You look, and you decide.

━━━━━━━━━━━━━━━━━━━━━━

★ YOUR DAY, YOUR WAY

• Real tasks and habits — yours, in the physical world. A task weighs by the effort it takes, not by count.
• Every completion becomes an occasion for the creature: energy, and a leaning that decides which branch it follows.
• Complete day: meeting what you yourself committed to. That is what brings the next form closer.
• Taking a new form is your move: when the path is ready, you touch it. It never happens without you.
• Consistency, not streaks: the app counts "how many of the last seven", so one miss costs little — it never resets everything.
• Rest shields: days of good consistency earn protection, spent on its own when you need it. Nothing to remember to activate.
• Two days in a row without a check and the creature offers a five-minute version. Accepting counts.

★ CARING IS PART OF THE DAY

• Feed it, and the food you choose leans the next form.
• Pet it, bathe it, put it to sleep, clean up what it leaves around the den.
• Talk to it. It says little, gets sleepy, has opinions — and talks about what it feels, not about what you did.
• On a day without enough, it folds back to a form it can hold with less. Coming back always works, and nothing you built is erased.

★ WHEN THE DAY IS DONE

• The rifts: five layers, six encounters per layer, with rare finds.
• Weekend tournament against other players, in tiers that measure you against yourself before any ranking.
• Co-op group by invite code: who showed up today, and nothing more.
• Rest window and 30 collectible sleep scenes — they reward going to bed on time, never sleeping "well".
• A shop of scenes and decoration with the currency you earn by playing.

★ BUILT TO FIT A LIFE

• Reminders that respect what you already did — if the day is closed, the app stays quiet.
• Daily and weekly report, with a mood check-in you answer only if you want.
• Pixel art inside the visor, clean interface outside. No ads.
• English and Portuguese. Works in the browser and on Android, with the same save.

━━━━━━━━━━━━━━━━━━━━━━

★ WHAT IS FREE AND WHAT ISN'T

You start with one of the demo creatures, at no cost. A single one-time unlock generates the creature that is only yours, from the Oracle. Optional credits pay for a new reading of your answers — deterministic, never a draw. Nothing you buy changes how forms change: that comes from your day, not your card.

★ ABOUT THE AI

Your creature's image and its lines are generated by artificial intelligence, without human review. The conversation is not advice and not an emergency service. Details are in the privacy policy and terms, inside the app.

━━━━━━━━━━━━━━━━━━━━━━

Your creature is born from your answers — and grows with what you do.
```

---

## 3. Verificação de verdade — cada frase contra o código

Regra do `alpha-growth`: a ficha só promete o que o build promete. Tabela do que a
descrição afirma e onde isso mora. Se uma linha desta tabela deixar de ser verdade,
a frase correspondente sai da ficha **antes** do próximo envio.

| Frase da ficha | Onde no código | Observação |
|---|---|---|
| Oráculo com seis perguntas; linha de formas gerada; "cada resposta diferente gera uma criatura diferente" | `src/utils/oracle.ts` › `ORACLE_QUESTIONS`; `src/utils/newReading.ts` ("mesma resposta, mesma criatura"); `functions/api/generate-sprite.js` | semente **determinística** — por isso a ficha NÃO diz "ninguém tem outra igual" (dois jogadores com as mesmas 6 respostas recebem a mesma linha; marca-crítico §3.2) |
| Tarefa pesa pelo esforço | `src/types/taskModel.ts` › `HABIT_WEIGHT`, `effort`; `src/utils/dailyReset.ts` › `dailyGoalFor` | `CLAUDE.md` › Motor de tarefas ⚖️ |
| Dia completo (não "perfeito") | `CLAUDE.md` › Regras do jogo ⭐; textos PT/EN dizem "dia completo"/"complete day" | o campo interno continua `perfectDays` |
| Mudança de forma é manual, o jogador toca | `MANUAL_EVOLUTION = true`; `handleEvolve` em `src/App.tsx` | `CLAUDE.md` › 🔒 Cadeado de evolução |
| "N das últimas 7", nunca zera | `src/utils/habitRhythm.ts` › `CONSTANCY_WINDOW_DAYS` | teste trava streak que zera |
| Escudos consumidos sozinhos | `applyMissedDay`; `REST_SHIELD_*` | `CLAUDE.md` › 🛡️ |
| "perdoa um dia sem marcar por semana, sozinho; depois de dois seguidos, pergunta" / versão de 5 minutos | `REST_DAYS_PER_WEEK` = 1 (a 1ª perda da semana é absorvida na virada); `MAX_HEARTS_LOST_PER_DAY`; `MISS_INTERVENTION_AT` = 2; `needsIntervention`; `applyMissedDay` | `CLAUDE.md` › 🚫 Never miss twice. A ficha NÃO diz mais "não conta os dias que você faltou": o app conta (`CONSTANCY_WINDOW_DAYS`), o que ele não faz é cobrar (L6) |
| Fecho "nasce das suas respostas — e cresce com o que você faz" | `ORACLE_QUESTIONS`; `perfectDays` / `handleEvolve` | sem L2 (espelho) nem L11 (espera/saudade); "cresce" descreve `perfectDays` acumulando |
| Comida inclina o galho | `careRules.ts`; atributos poder/harmonia/benevolência | `CLAUDE.md` › 🍎 |
| Carinho, banho, sono, recolher | `careRules.ts`, `poopDrain.ts` | `CLAUDE.md` › 🫶 🚿 💤 💩 |
| Chat: fala do que sente, não do que você fez | `functions/api/chat.js` (cláusula SAFETY); `src/utils/chatSafety.ts`; bíblia §5.10/§13 | IA sem revisão humana — declarado em §5 abaixo |
| "Num dia sem o bastante" recua para uma forma que se sustenta com menos; nada se apaga | degeneração por HP 0 (`CLAUDE.md` › ❤️); `applyFreshStart` nunca toca `perfectDays`/marcos | frase-modelo da bíblia §13 ✅. ⚠️ Dizia "Se você se afasta" até 22/09/2026 (QA R2 A2): afastar-se é o que NÃO custa (`ABSENCE_FORGIVENESS_DAYS` = 2), e L4 proíbe atribuir causa — a causa real é o dia sem o bastante |
| Fendas: 5 camadas × 6 encontros | `MAX_FLOORS` em `src/components/DungeonGame.tsx`; `LADDER_TIERS` | `CLAUDE.md` › ⚔️ |
| Torneio de fim de semana, faixas antes do ranking | `src/utils/tournamentSeason.ts`, `tournamentTiers.ts`; `functions/api/community.js` › `match`, `rank` | **se o PvP for desligado, a linha sai** |
| Grupo cooperativo por código: "apareceu hoje" | `functions/api/community.js` › `coopCreate`/`coopJoin`/`coopCheckin` | `docs/PLANO-COOP.md` |
| Janela de descanso + 30 cenas de sono | `src/utils/restWindow.ts` › `DREAM_CATALOG`, `DEFAULT_REST_WINDOW` | premia deitar, nunca dormir bem (`CLAUDE.md` › 🛏️) |
| Loja com moeda do jogo | `src/utils/shop.ts`; Bits = `gamePoints` | `CLAUDE.md` › 💠 🛒 |
| Lembretes calam se o dia fechou | `functions/api/_pushTargets.js`; `workers/push-scheduler.js` | `CLAUDE.md` › Arquitetura › Push |
| Relatório do dia/semana + humor opcional | `DailyReportModal`; `src/utils/mood.ts` | humor nunca alimenta pontuação |
| Sem anúncios | `ADMOB_SSV_ENABLED` ausente; UI esconde a opção | `docs/BILLING-SETUP.md` §4b |
| PT e EN; navegador e Android, mesmo save | `src/utils/i18n.ts` › `resolveLanguage`; `functions/api/save.js` | o APK carrega a URL de produção |
| Demo grátis; 1 desbloqueio; créditos = nova leitura determinística | `functions/api/_billing.js` › `PRODUCTS`; `src/utils/newReading.ts` | `docs/BILLING-SETUP.md` §1; STATUS §3.1 ✅ (não é loot box) |

**Vocabulário conferido** (vetados que NÃO aparecem): tamer, domador, treinador,
digievolução, mundo digital, digimon, avatar, parceiro/partner, dex. Termos de
terceiros vetados pela review 03/08 (pokemon, tamagotchi, digivice, neopets, pou,
finch, habitica, forest): ausentes. Não escrevi "melhora sua saúde mental",
"comprovado", "offline" (o APK carrega a URL de produção — prometer offline seria
falso no Android).

---

## 4. Classificação de conteúdo (IARC) — respostas do questionário

O questionário do console muda de redação; as respostas abaixo são o que o app
**tem**, com o ponteiro. Regra: responder pelo que o APK **pode** fazer, não pela
configuração de hoje (mesma regra de `PLAY-DATA-SAFETY.md` §2.4).

| Tema do questionário | Resposta | Por quê / onde |
|---|---|---|
| Categoria do app | **Jogo** — ou "Utilitário/produtividade" se o console exigir escolher pela função principal; `[a confirmar no Play Console]` qual das duas o formulário aceita para um app híbrido | a listagem é de *care* + tarefas; o loop principal é tarefa → criatura |
| Violência | **Sim, mínima/fantasiosa**: combate por turnos contra criaturas pixel art nas fendas; sem sangue, sem morte (o corpo "volta para a camada" — bíblia §5.12) | `src/components/DungeonGame.tsx`, Torneio (`community.js` › `match`) |
| Violência realista contra humanos | Não | — |
| Medo/horror | Não (a tarefa "assombrada" é um esmaecimento + o pet olhando — sem imagem de horror) | `CLAUDE.md` › 👻 |
| Sexo/nudez | Não | — |
| Linguagem imprópria | **Não no conteúdo do app**; o chat é gerado por IA em tempo real com cláusula de segurança, sem moderação humana — declarar em "interação" abaixo | `functions/api/chat.js` › SAFETY |
| Drogas, álcool, tabaco | Não | — |
| Jogo de azar / apostas simuladas | **Não** — a Nova Leitura é determinística sobre as respostas; nenhum `Math.random` no caminho pago | `src/utils/newReading.ts`; STATUS §3.1 ✅ |
| Compras digitais | **Sim** — 1 não consumível + 3 consumíveis via Play Billing | `functions/api/_billing.js` › `PRODUCTS` |
| Os usuários podem interagir entre si | **Sim, limitado**: diretório público de jogadores (apelido + forma), Torneio assíncrono (sem chat), presentes de moeda entre amigos, grupo cooperativo com "apareci hoje". **Não há mensagens entre usuários.** | `functions/api/community.js` › `players`, `match`, `gift`, `coop*` |
| Compartilha localização | Não | nenhuma permissão de localização (`PLAY-DATA-SAFETY.md` §2.7) |
| Compartilha informações pessoais com terceiros (via interação) | Só o apelido escolhido, e só se o jogador entrar no diretório | `community.directoryConsent.test.js` |
| Conteúdo gerado pelo usuário visível a outros | **Apelido, nome da criatura e o nome do grupo cooperativo** (escrito por quem cria o grupo, visto por quem entra pelo código) — texto livre curto; sem moderação prévia | `community.js` › `profile`, `coopCreate` (nome do grupo); política §2 "Grupo cooperativo" |
| Chat sem moderação humana | **Sim, com IA** (não entre usuários) — declarar aqui **e** na seção de IA (§5) | `chat.js`; `docs/PLAY-DATA-SAFETY.md` §3b |
| Anúncios | Não | — |
| Acesso à câmera/microfone | **Microfone** (recado falado, opcional) | `RECORD_AUDIO` no manifesto; `PLAY-DATA-SAFETY.md` §2.4 |
| Público-alvo | 18+ (a política declara na §7; caixa de maioridade na tela de conta) | `PLAY-DATA-SAFETY.md` §0 |

Resultado esperado: **Livre / PEGI 3–7** com descritores de "compras no app" e
"interação entre usuários". Se o IARC devolver algo mais alto por causa do combate,
aceite — a classificação sai do questionário, não da vontade.

---

## 5. Declaração de IA generativa (Conteúdo do app › "Recursos de IA generativa")

Decisão #22 do dono: **declarar**. O texto abaixo é a resposta ao formulário; a
tabela de origem asset a asset está em `docs/PLAY-DATA-SAFETY.md` §3b e a procedência
em `docs/Attributions.md`.

| Pergunta (redação aproximada) | Resposta |
|---|---|
| O app usa IA generativa para criar conteúdo? | **Sim** |
| Que tipo de conteúdo? | **Imagens** (o sprite das 11 formas da criatura do jogador pago — Higgsfield, reserva Gemini) · **Texto** (as falas da criatura no chat e a transcrição do recado falado — Groq) · Áudio: **não gerado em tempo de uso** (os 3 sons de evento e a trilha foram gerados uma vez, ouvidos e instalados — declarar como conteúdo estático se o formulário perguntar) |
| O usuário pode gerar conteúdo com IA? | **Sim, limitado**: o texto que ele escreve no chat vira prompt; o prompt do sprite vem das respostas do Oráculo (não é texto livre para imagem) |
| Há filtro/segurança? | Cláusula SAFETY no prompt do chat (`functions/api/chat.js`) + ponte local de crise com lista curada (`src/utils/chatSafety.ts`, CVV 188 / findahelpline.com); minimização de dado pessoal antes de enviar (`functions/api/_redact.js`); cotas por conta e teto global do dia (`functions/api/_aiGuard.js`) |
| Há revisão humana? | **Não, no caminho em tempo real** (chat, sprite do jogador pago). Sim para toda arte estática e sons (curados antes de instalar) |
| Como o usuário reporta conteúdo? | E-mail de contato da ficha; dentro do app, Configurações › Sobre traz o aviso de IA e o link para a política |
| Onde está avisado ao usuário? | Configurações › Sobre (aviso curto PT/EN — texto exato e o que entra em 22/09 em `PLAY-DATA-SAFETY.md` §3b item 2) · `public/termos.html` §8 (versão 2026-09-21) · `public/privacidade.html` §2b |

Também vale para o **formulário de Segurança de Dados**: `PLAY-DATA-SAFETY.md` §2.3
já declara "Outras mensagens no app" → Groq (chat com contexto, sugestões, Decompor)
**e** Higgsfield/Gemini (descrição da criatura como prompt de imagem). Transcreva de lá.

---

## 6. Pedidos à `squad-arte` / `arte-gerador` — screenshots, feature graphic, ícone

> **Não gere nada a partir deste arquivo sem passar pela `squad-arte`** — a regra-mãe
> dela (pixel art só dentro do visor; `.claude/skills/squad-arte/SKILL.md`) e o
> conferente valem para material de loja também. Os 3 PNG de `screenshots/` na raiz
> são da era DigiApp (review 12 §1) e **não servem**.

### 6.1 Especificação comum

- **Screenshots:** 8 imagens, retrato **1080×1920** (9:16), PNG ou JPG 24-bit, cada
  uma < 8 MB `[a confirmar no Play Console os limites vigentes]`. Legenda em faixa
  superior, fonte grande (a legenda é lida antes da tela), moldura de celular
  opcional, fundo escuro do sistema (`--sm2-*` do tema escuro, `docs/manual/04-IDENTIDADE-VISUAL.md`).
- **Capturar do build atual** (PWA em viewport 360×780 ou APK), tema escuro, idioma
  PT para o conjunto PT e EN para o conjunto EN — **dois conjuntos**, 16 arquivos.
- **Criatura nos prints:** usar uma das 6 de demonstração (arte própria de
  `src/assets/soulmon/`) — nunca sprite ou nome derivado (`CLAUDE.md` › Arte e nomes).
- **Sem texto de cobrança** nas legendas: as legendas abaixo foram escritas contra
  a bíblia §13 (constatação, 2ª pessoa, sem veredito). Trocar uma legenda = passar
  pelo `soulmon-narrative-critic`.
- Arquivo: `docs/loja/play/<pt|en>/0<n>-<slug>.png` (pasta a criar pela squad-arte).

### 6.2 Roteiro dos 8 screenshots

| # | Tela (estado a preparar) | Legenda PT | Caption EN | Por que aqui |
|---|---|---|---|---|
| 1 | **Antes/depois**: a mesma linha em duas formas lado a lado (rookie à esquerda, ultimate/mega à direita), sem números de dias | **Ela mudou de forma com o seu dia.** | **It took a new form with your day.** | A promessa inteira sem texto. Única imagem que aparece na busca |
| 2 | Oráculo: uma pergunta real em tela, resposta parcialmente digitada | **Nasce das suas respostas. Só sua.** | **Born from your answers. Only yours.** | Diferencial antes da mecânica |
| 3 | Home: criatura no abrigo + barras de energia + lista do dia com 3 itens (1 feito) | **Suas tarefas viram o dia dela.** | **Your tasks become its day.** | O núcleo, honesto: é um app de tarefas |
| 4 | Cerimônia de mudança de forma, no instante em que o jogador toca | **Quando o caminho está pronto, você toca.** | **When the path is ready, you touch it.** | O loop e a regra manual, em uma imagem |
| 5 | Página de Evolução com o galho previsto e a constância "5 das últimas 7" | **Cinco das últimas sete. Nada zera.** | **Five of the last seven. Nothing resets.** | A tese anti-streak, visível |
| 6 | Grid de cuidado: comida, carinho, banho, sono (criatura acordada) | **Cuidar é parte do dia.** | **Caring is part of the day.** | Vínculo — o que difere de um checklist |
| 7 | Fenda, camada 3, um encontro em curso | **Quando o dia acaba, tem mais.** | **When the day is done, there is more.** | Riqueza, sem virar "jogo" |
| 8 | Cena de sono colecionada (uma rara) + janela de descanso | **A noite também assenta.** | **The night settles too.** | Descanso premiado pelo comportamento |

### 6.3 Feature graphic — 1024×500 (obrigatório)

- **Formato:** 1024×500 PNG/JPG, sem alfa, **sem texto pequeno** (a Play sobrepõe o
  botão de play e o corta em telas estreitas — deixar 15 % de margem segura em cada
  lado) `[a confirmar no Play Console]`.
- **Composição pedida:** o visor (moldura da identidade, `04-IDENTIDADE-VISUAL.md`
  §"O Visor") centralizado à direita com **uma** criatura de demonstração em pixel
  art dentro; fora do visor, fundo escuro liso do sistema com o wordmark **Soulmon**
  (`arte-marca`) à esquerda e a tagline curta **"Ela cresce com o seu dia."** / EN
  **"It grows with your day."** — uma linha, fonte da UI (Fredoka para o wordmark,
  Rubik para a tagline, `docs/Attributions.md`), nada em pixel fora do visor.
- **Dois arquivos:** `docs/loja/play/pt/feature-1024x500.png` e `.../en/feature-1024x500.png`.
- Não usar `#2bff95` (verde do DigiApp que a review 03/08 ainda citava): a paleta é a
  do rebrand (`--sm2-primary-ink`, `docs/manual/04-IDENTIDADE-VISUAL.md`).

### 6.4 Ícone 512×512

- Conferir a olho `public/favicon-512x512.png` e `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`:
  se ainda for a arte "D" do DigiApp (`docs/APK-BUILD-INFO.md` §"Design dos Ícones"),
  a `arte-marca` gera o ícone novo (chama/visor da identidade, fundo sólido, sem
  texto) e o `arte-instalador` troca os `mipmap-*` + `ic_launcher_foreground` +
  `favicon-*` no mesmo commit. Entregar também o `<monochrome>` (review 15 §B: falta).
- O console pede o PNG 512×512 32-bit **sem transparência** — exportar sobre o fundo
  sólido.

### 6.5 Vídeo (opcional, não bloqueia)

Roteiro de 25 s existe em `docs/reviews/2026-08-03/soulmon-growth-aso.md` A.6/B.6.
**Reescrever as legendas** antes de produzir: "Se você some, ela definha" é cobrança
(L6). Fora do escopo desta rodada.

---

## 7. O que ficou de fora, e por quê

- **Preço** — não vai na ficha; é o que estiver no console (`docs/BILLING-SETUP.md` §1).
  Os Termos EN publicam **US$ 6.99 como preço de referência** (redação A, decisão
  provisória do coordenador, 21/09/2026); o critério de "feito" de
  `PLAY-LANCAMENTO.md` §D.7 inclui **confirmar esse USD no console** — se a Play
  converter para outro valor, quem muda é o `FULL_UNLOCK_PRICE_LABEL_USD`
  (`src/utils/monetization.ts`), e o teste `publishedPrice.test.ts` puxa os Termos junto.
- **"Funciona offline"** — o APK carrega a URL de produção; prometer seria falso.
- **Número de usuários / prova social** — não existe ainda. Adicionar quando houver.
- **Steam / desktop** — outra loja, outro documento (`docs/PLANO-DESKTOP-STEAM.md`).
- **Fase 4 (Health Connect)** — não está no build; se entrar, a ficha e a Data Safety
  mudam de categoria (`PLAY-DATA-SAFETY.md` §5).
