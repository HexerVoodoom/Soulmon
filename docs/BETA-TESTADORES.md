# Beta fechado — testadores: recrutamento, convite, onboarding, roteiro e pesquisa

> **Run `beta-play-01`** (11/10/2026). Tudo aqui é texto pronto para copiar. Quem envia é
> o **dono** (a squad redige; mensagem em nome do dono só sai com o seu "sim").
> Passo a passo técnico: [`BETA-FECHADO-RUNBOOK.md`](BETA-FECHADO-RUNBOOK.md). Quando algo
> quebra: [`BETA-CONTINGENCIA.md`](BETA-CONTINGENCIA.md).
>
> **A única coisa que o Google exige do testador:** ter o app **instalado e com opt-in**
> por **14 dias seguidos**. Tudo o resto é bônus. Por isso o texto insiste em "não
> desinstale" e a meta é **15+ pessoas** (regra: 12 contínuos).
>
> **Regras de honestidade nos textos:** diga que é um app em teste fechado; que compras são
> de teste (ninguém é cobrado); o que o app coleta (e-mail para a conta, o progresso do
> jogo; ver a política); não prometa pagamento, prêmio nem vantagem futura que não exista.

## 0. Antes de recrutar (checklist de 5 minutos)

- [ ] Grupo do Google criado (`soulmon-beta@googlegroups.com` ou o nome real) com aprovação manual.
- [ ] Link de opt-in da faixa fechada copiado (RUNBOOK 9.3):
      `https://play.google.com/apps/testing/com.hexervoodoom.soulmon`
- [ ] Formulário de bugs criado (§6) e link curto pronto.
- [ ] Planilha de controle `E:\soulmon-beta\testadores.csv`: nome, Gmail, canal, data do opt-in, instalou?, ativo?
- [ ] Texto da privacidade: `https://soulmon.mateus-sprnd.workers.dev/privacidade.html`.
- [ ] Meta de captação: **25 interessados -> 20 opt-ins -> 15+ ativos no dia 7**.

---

## 1. Textos de recrutamento

Substitua `{LINK_GRUPO}` e `{LINK_FORM}`. Quanto mais pessoal o canal, melhor a taxa
(amigos > grupos de teste > Reddit).

### 1.1 Discord (servidores de amigos/jogos) — PT-BR

```
Procuro testadores pro meu app: Soulmon, um bichinho virtual que evolui com as suas
tarefas e hábitos do dia a dia (pixel art, PT/EN, Android).

O que preciso: 14 dias com o app instalado (usar um pouquinho por dia ajuda, mas o que o
Google conta é NÃO DESINSTALAR). Compras são só de teste, ninguém é cobrado.

Como entrar (2 min):
1. Entre no grupo com o Gmail que você usa na Play Store: {LINK_GRUPO}
2. Abra o link de teste e toque em "Tornar-se testador": https://play.google.com/apps/testing/com.hexervoodoom.soulmon
3. Instale pela Play Store e crie sua conta (e-mail + senha).

Se puder me responder aqui com o seu Gmail, eu libero também a compra de teste.
Se achar bug, tem um formulário curtinho: {LINK_FORM}
Valeu demais! 🙏
```

### 1.2 WhatsApp (contato direto / grupos) — PT-BR

```
Oi! Posso te pedir um favor de 2 minutos? Estou lançando meu app (Soulmon, um bichinho que
evolui com as suas tarefas) e o Google exige 12 pessoas testando por 14 dias antes de eu
poder publicar.

Basta:
1) entrar neste grupo com seu Gmail: {LINK_GRUPO}
2) tocar em "Tornar-se testador" aqui: https://play.google.com/apps/testing/com.hexervoodoom.soulmon
3) instalar pela Play Store e deixar instalado até o dia {DATA_FIM}.

Não precisa jogar todo dia (mas se der uma olhada por dia, me ajuda muito). Só NÃO
desinstale. Compras são de teste, não cobram nada. Pode me mandar o seu Gmail por aqui?
Obrigado, de verdade! 💜
```

### 1.3 Reddit r/AndroidClosedTesting (EN; leia as regras do sub antes)

```
Title: [Android] Looking for 12+ testers for Soulmon (habit/task virtual pet) - closed testing, 14 days — happy to test yours back

Hi! I'm a solo dev. Soulmon is a virtual pet that takes new forms as you complete real
tasks and habits (pixel art, PT/EN). It's in Google Play closed testing and I need 12+
testers opted in for 14 days in a row (the requirement for new personal developer accounts).

What I need: join the Google Group with the Gmail you use on the Play Store ({LINK_GROUP}),
tap "Become a tester" ({OPT_IN_LINK}), install from Play, keep it installed for 14 days.
A short daily look helps; the only thing that counts for Google is not uninstalling.
In-app purchases are license-test only: nobody is charged.

I'll gladly test yours in return — drop your opt-in link below and I'll join today and keep
it for the full 14 days. Bugs / feedback form: {LINK_FORM}. Thank you!
```

### 1.4 Reddit r/TestersCommunity (EN)

```
Title: Soulmon (Android, habit-tracking virtual pet) needs testers — 14-day closed test, reciprocal

I'm testing a habit/task virtual pet (Soulmon). Looking for 12+ people to keep it installed
for 14 days via Play closed testing. I'll reciprocate with your app (I'll opt in, keep it
installed 14 days, and send feedback).

How: 1) join {LINK_GROUP} with your Play Store Gmail, 2) {OPT_IN_LINK} -> "Become a tester",
3) install. Free, purchases are test-only. Reply here with your app link and I'll join it
now. Thanks!
```

### 1.5 Grupos de teste recíproco (Telegram/Discord de "closed testing", PT/EN)

```
Troca de teste fechado (14 dias): eu instalo e mantenho o seu app, você mantém o meu.
Soulmon — bichinho virtual de hábitos (PT/EN). Opt-in: {OPT_IN_LINK} | Grupo: {LINK_GRUPO}
Me manda o link do seu que eu entro hoje e fico os 14 dias. Combinado?
```

```
Closed-test swap (14 days): I install and keep yours, you keep mine.
Soulmon — habit-tracking virtual pet (PT/EN). Opt-in: {OPT_IN_LINK} | Group: {LINK_GROUP}
Send me yours and I'll join today and stay for the full 14 days. Deal?
```

### 1.6 Regras de convivência (para não queimar canal)

- Um post por canal; responda comentários; sem prometer o que não vai cumprir.
- **Troca recíproca é compromisso:** cumpra os 14 dias do app do outro. Anote o link e a data na planilha.
- Não peça avaliação 5 estrelas nem pague por teste (viola política da Play).
- Nunca peça senha. Peça só o **Gmail da Play** (para o grupo e a licença de teste).

---

## 2. Mensagem de convite (para quem disse "sim")

### 2.1 Convite completo — PT-BR

```
Obrigado por topar testar o Soulmon! 🐾

Passo a passo (uns 3 minutos, no celular Android):

1) Entre neste grupo com o MESMO Gmail que usa na Play Store (se pedir, toque em
   "Pedir para participar"): {LINK_GRUPO}
   Eu aprovo em até algumas horas.

2) Depois, abra este link NO CELULAR e toque em "Tornar-se testador":
   https://play.google.com/apps/testing/com.hexervoodoom.soulmon

3) Toque em "Baixar na Google Play" e instale o Soulmon.

4) Abra o app, crie sua conta com e-mail e senha e responda às perguntas iniciais.

⚠️ O mais importante: NÃO DESINSTALE antes do dia {DATA_FIM}. O Google conta 14 dias
seguidos com o app instalado. Usar um pouquinho todo dia ajuda muito, mas o essencial é
deixar instalado.

💳 As compras são de teste: ninguém é cobrado. Me passa o seu Gmail da Play que eu libero.

🐛 Achou algo estranho? {LINK_FORM}

Qualquer dúvida é só chamar aqui. Obrigado!
```

### 2.2 Convite — EN

```
Thanks for testing Soulmon!

1) Join this Google Group with the same Gmail you use on Google Play (request to join if
   asked; I approve within hours): {LINK_GROUP}
2) On your phone, open and tap "Become a tester":
   https://play.google.com/apps/testing/com.hexervoodoom.soulmon
3) Install from Google Play. Open the app, sign up with email + password, answer the first
   questions.

Please DON'T UNINSTALL before {END_DATE} — Google counts 14 consecutive days installed.
A little daily use helps a lot, but staying installed is the key.
Purchases are test-only, nobody is charged (send me your Play Gmail so I can enable it).
Found a bug? {LINK_FORM}
```

### 2.3 Lembrete (se não fez o opt-in em 24 h)

```
Oi! Vi que você ainda não finalizou o teste do Soulmon. Falta só: (1) estar no grupo, (2)
tocar em "Tornar-se testador" no link de teste e (3) instalar. Se travou em algum passo,
me diz qual que eu te ajudo. Preciso de todo mundo instalado até {DATA_D0}.
```

---

## 3. Guia de onboarding do testador (cole como página/mensagem fixada)

**Soulmon — guia do testador**

1. **Requisitos:** celular Android 8.0 ou mais novo, conta Google (Gmail) na Play Store e
   internet (o app carrega online).
2. **Entrar no teste:**
   1. Entre no grupo `{LINK_GRUPO}` com o Gmail da Play.
   2. Abra `https://play.google.com/apps/testing/com.hexervoodoom.soulmon` no celular ->
      **Tornar-se testador**.
   3. **Baixar na Google Play** e abrir o Soulmon.
3. **Criar conta:** e-mail e senha. Marque que você tem 18+ (o app é para adultos).
4. **Notificações e permissões:** o app pode pedir notificações, contador de passos
   (atividade física) e microfone (recado falado). **Todas são opcionais**; o app funciona
   sem. Aceitar ajuda a testar, mas decida você.
5. **Não desinstale por 14 dias.** Se o Android sugerir "liberar espaço" ou "apps sem uso",
   **não aceite** para o Soulmon (Configurações -> Apps -> Soulmon -> **Desativar** a
   "Remover permissões e liberar espaço se o app não for usado").
6. **Atualizações:** a Play atualiza sozinha. Se avisarmos de uma versão nova, abra a Play ->
   Soulmon -> Atualizar. Seu progresso fica salvo na conta.
7. **Se algo der errado:** feche e abra o app; confirme o Wi-Fi; depois use o formulário
   `{LINK_FORM}`. **Nunca desinstale para "resolver"** — fale com a gente antes.
8. **Privacidade:** o app guarda seu e-mail (como hash), seu progresso e, se você usar,
   apelido, notificações, passos e microfone. Política completa:
   `https://soulmon.mateus-sprnd.workers.dev/privacidade.html`. Para apagar tudo:
   Configurações -> Seus dados -> **Excluir conta**.
9. **Compras:** são de teste (licença de teste). A folha da Play mostra "compra de teste".
   Não use cartão real.

---

## 4. Roteiro de teste dos 14 dias (o que cada um faz, ~5 min/dia)

> Ideia: cada dia explora uma área. **Quem não conseguir fazer a tarefa do dia, tudo bem**:
> o que importa para o Google é não desinstalar; o resto é feedback.

| Dia | O que fazer | O que observar |
|---|---|---|
| 1 | Instalar, criar conta, responder às perguntas iniciais, ver o bichinho nascer. | A abertura foi clara? Alguma tela branca ou travada? |
| 2 | Criar 2-3 tarefas e 1 hábito; completar uma. | O bichinho reagiu? A conclusão fez sentido? |
| 3 | Cuidar: alimentar, carinho, banho, sono. Ver a energia. | Os textos explicam o que cada coisa faz? |
| 4 | Fechar o app e reabrir; ligar o modo avião e abrir. | Seu progresso estava lá? A tela de erro de rede apareceu (e voltou ao reconectar)? |
| 5 | Conversar com o bichinho (digitando; se quiser, por voz). | Respostas fizeram sentido? Algo estranho ou ofensivo? |
| 6 | Completar um hábito 2 vezes no mesmo dia e olhar o "N de 3" da semana. | O contador da semana bate com o que você fez (atenção ao fuso)? |
| 7 | Abrir a loja de cenários/decoração; trocar o cenário. | Preços e nomes claros? |
| 8 | Aventura/masmorra: descer alguns andares. | Energia, recompensas e textos entenderam? |
| 9 | Notificações: deixar ligadas; reparar no horário e na quantidade. | Recebeu a hora certa? Alguma repetida/fora de hora? |
| 10 | Configurações -> Seus dados: ver o que existe; **não precisa exportar nem apagar**. | Dá para entender onde estão suas opções? |
| 11 | Compra de teste (Desbloqueio, pacote de créditos ou assinatura trimestral) — só se te liberamos. | A folha da Play abriu? Liberou? Mostrou "a cada 3 meses, renova, cancele na Play" na assinatura? |
| 12 | Guilda/grupo (se tiver um amigo testador no grupo). | Entrar, ver, doar? Algum texto confuso? |
| 13 | Usar normalmente o dia todo; trocar de rede (Wi-Fi/4G). | Algo lento? Algo travou? |
| 14 | Responder a pesquisa de saída (§9). **Ainda não desinstale** até avisarmos que o Google confirmou. | Resumo geral. |

**Dias de folga:** se pular um dia, retome. **Nunca** desinstale para "recomeçar do zero".

---

## 5. Como reportar um problema (versão curta para mensagem fixada)

> Achou bug ou algo confuso? Preencha: `{LINK_FORM}` (1 minuto). Diga **o que você estava
> fazendo, o que esperava e o que aconteceu**, e anexe print ou vídeo se puder.
> Se o app **fechar sozinho ou ficar branco**, responda "App travou" no formulário; a gente
> também recebe um aviso automático (sem seu nome). **Não desinstale.**

---

## 6. Modelo do Google Forms (bug report)

Criar em `forms.google.com` -> *Formulário em branco*. Título: **Soulmon Beta — reportar um
problema**. Configurações: **Não coletar e-mails** (a pergunta 1 é opcional); permitir
upload de arquivo só se quiser (exige login Google) — melhor pedir link de print.

**Descrição:** "Obrigado por ajudar! Quanto mais específico, mais rápido a gente acha.
Esse formulário vai só para o desenvolvedor."

| # | Pergunta | Tipo | Obrigatória |
|---|---|---|---|
| 1 | Gmail da Play (só para te responder; pode deixar em branco) | Resposta curta | Não |
| 2 | Que tipo de problema? | Múltipla escolha: App travou/fechou · Tela em branco · Não consigo entrar · Perdi progresso · Compra/assinatura · Notificação (errada/repetida) · Texto/tradução · Visual/layout · Lento · Sugestão · Outro | Sim |
| 3 | Quão grave? | Escala/Múltipla: Me impediu de usar · Atrapalhou · Incômodo pequeno · Só sugestão | Sim |
| 4 | O que você estava fazendo? (passo a passo) | Parágrafo | Sim |
| 5 | O que você esperava? | Parágrafo | Não |
| 6 | O que aconteceu de fato? (se houver mensagem de erro, copie o texto) | Parágrafo | Sim |
| 7 | Acontece sempre ou só às vezes? | Múltipla escolha: Sempre · Às vezes · Foi uma vez | Sim |
| 8 | Dia do teste e hora aproximada | Resposta curta | Não |
| 9 | Modelo do celular e versão do Android (Configurações -> Sobre o telefone) | Resposta curta | Não (muito útil) |
| 10 | Wi-Fi ou dados móveis? | Múltipla escolha | Não |
| 11 | Versão do app (Soulmon -> Configurações -> Sobre) | Resposta curta | Não |
| 12 | Link de print ou vídeo (Google Drive/Fotos, "qualquer pessoa com o link") | Resposta curta | Não |
| 13 | Posso te chamar para entender melhor? | Múltipla escolha: Sim · Não | Não |

**Triagem (pelo dono/squad):** abra as respostas em planilha. Prioridade por coluna 3
(`Me impediu` = S1/S2 -> `BETA-CONTINGENCIA.md`). Responda todo "Me impediu" no mesmo dia.

---

## 7. Mensagens de acompanhamento (D0 a D14)

### 7.1 Boas-vindas / D0
```
Tudo certo, você está dentro! Lembra: o essencial é deixar o Soulmon instalado até
{DATA_FIM}. Qualquer problema, formulário: {LINK_FORM}. Obrigado!
```

### 7.2 D4 — meio de jornada
```
Dia 4 de 14! Já estamos com {N} testadores ativos. Obrigado por manter instalado. Se der,
abra o app hoje e complete uma tarefa — e conte no formulário se algo estranhou.
```

### 7.3 D10 — "não desinstale"
```
Falta pouco: dia 10 de 14. Reforçando o pedido: por favor NÃO desinstale o Soulmon até
eu avisar. Se o celular sugerir limpar apps sem uso, ignore ou me chame. Obrigado!
```

### 7.4 Quando sai uma versão nova
```
Saiu uma atualização do Soulmon! Abra a Play Store -> Soulmon -> Atualizar. Seu progresso
está salvo na conta. O que mudou: {RESUMO}.
```

### 7.5 D14 — fim
```
Chegamos ao dia 14! 🎉 Falta só a pesquisa de saída ({LINK_SAIDA}, 3 minutos). E
mantenha o app instalado até eu confirmar com o Google — eu aviso aqui. Muito obrigado!
```

---

## 8. Roteiro diário de uso (cartão de 3 linhas, para quem quiser um ritual)

1. **Abrir** o Soulmon e ver como o bichinho está (10 s).
2. **Marcar** uma tarefa ou hábito como feito, e cuidar de uma coisa (alimentar/carinho).
3. **Anotar** no formulário se algo estranhar (30 s) — ou nada, se tudo estiver bem.

---

## 9. Pesquisa de saída (Google Forms, ~3 min, D13-D14)

Título: **Soulmon Beta — como foi?**

| # | Pergunta | Tipo |
|---|---|---|
| 1 | Você manteve o app instalado todos os 14 dias? | Sim · Quase (desinstalei e reinstalei) · Não |
| 2 | Com que frequência você abriu? | Todos os dias · 4-6 dias · 1-3 dias · Quase nunca |
| 3 | De 0 a 10, o quanto você recomendaria o Soulmon a um amigo? | Escala 0-10 |
| 4 | O que você mais gostou? | Parágrafo |
| 5 | O que mais te irritou ou confundiu? | Parágrafo |
| 6 | Em algum momento o app travou, ficou branco ou perdeu progresso? | Não · Uma vez · Mais de uma vez (descreva) |
| 7 | O bichinho/tarefas/hábitos ajudaram no seu dia? | Escala 1-5 + comentário |
| 8 | Os textos (PT/EN) estavam claros? Algum estranho? | Parágrafo |
| 9 | Você fez compra de teste? Como foi a experiência? | Não fiz · Fiz e funcionou · Fiz e deu problema (descreva) |
| 10 | A assinatura trimestral (R$ 9,90, só itens de decoração) ficou clara e justa? | Escala 1-5 + comentário |
| 11 | Notificações: quantidade e horário | Boas · Demais · Poucas · Horário errado · Desliguei |
| 12 | Você pagaria por algo no app? Por quê / por que não? | Parágrafo |
| 13 | Se pudesse mudar UMA coisa? | Parágrafo |
| 14 | Posso te chamar para uma conversa de 10 min? (opcional: seu contato) | Resposta curta |

**Para o formulário do Google Play** (candidatura à produção, RUNBOOK 10.6) a squad
resume desta pesquisa: nº de testadores, como foram recrutados, principais achados e o que
foi corrigido. Guarde o resumo em `E:\soulmon-beta\resumo-final.md` (não no repo).
