# Beta fechado — plano de contingência

> **Run `beta-play-01`** (11/10/2026). Um cenário por seção: **sinal de detecção ->
> quem age -> comandos -> mensagem pronta ao testador (PT-BR)**. Companheiro do
> [`BETA-FECHADO-RUNBOOK.md`](BETA-FECHADO-RUNBOOK.md) (o passo a passo) e do
> [`BETA-TESTADORES.md`](BETA-TESTADORES.md) (canais e formulário).
>
> **Fato que muda tudo:** o APK carrega o app de `server.url` =
> `https://soulmon.mateus-sprnd.workers.dev`. Logo, **quase todo defeito é corrigido
> publicando o Worker, sem tocar na Play**, e o rollback também é do Worker. Só o que
> mora no código nativo (Kotlin, manifesto, plugin de billing, ícone, permissões) exige
> novo AAB.
>
> **Quem age:** "Dono" = você (tem login no Cloudflare/Play/Firebase). "Squad" = o
> agente, em worktree, pode preparar o fix, rodar `npm run portoes`, abrir PR e *dirigir
> o Chrome* com o seu "sim". Nada aqui dá à squad senha, JSON ou keystore.
>
> **Limitações que este plano assume (honestas):**
> - Não existe backup automático do KV (`SOULMON_SAVES`). O KV da Cloudflare **não
>   versiona**. O que existe é: o save local do aparelho, a exportação em Configurações ->
>   Seus dados, e o snapshot que o §2 manda **você instalar antes do beta**.
> - Não existe flag única "desliga a compra". O jeito de desligar é descrito no §3.
> - Estimativas de cota gratuita da Cloudflare/Firebase abaixo são de memória: **[a
>   confirmar no painel]** antes de confiar.

## Severidade e relógio

| Nível | Exemplo | Resposta |
|---|---|---|
| **S1** | tela branca para todos; save sumindo; compra cobrando de verdade; vazamento de segredo | agir em minutos; avisar testadores; congelar mudanças |
| **S2** | crash em um modelo de aparelho; compra falha; push repetido | agir no mesmo dia |
| **S3** | bug visual, texto errado | entra no formulário, corrige na semana |

**Regra do relógio:** o que ameaça o relógio dos 14 dias é *perder opt-in*. Qualquer
incidente S1/S2 termina com mensagem aos testadores dizendo **o que foi, que já foi
resolvido e que não precisam fazer nada** (ou exatamente o que fazer).

**Registro:** cada incidente vira uma linha em `docs/STATUS.md` (data, cenário, causa,
correção). Sem isso o próximo incidente repete a investigação.

---

## 1. Crash em massa / tela branca

**Sinal.**
- Mensagens de vários testadores "abre e fica branco / fecha sozinho".
- `/api/crash` com pico de ocorrências: `$env:METRICS_ADMIN_KEY = "<valor>"; node scripts/crash-report.mjs --days 1` (agrupa por assinatura, mais frequentes primeiro).
- Android vitals (Play Console -> Qualidade) com taxa de falha > 0 (pouco sinal com 15
  testadores; não espere por ele).
- Tela branca *sem* texto = Worker fora ou bundle quebrado; tela de erro de rede com a
  identidade do app = o WebView não alcançou o servidor (rede ou Worker fora, §8).

**Quem age.** Dono, com a squad preparando o diagnóstico.

**Passos.**

1. Confirme que o Worker responde: `curl.exe -s -o NUL -w "%{http_code}" https://soulmon.mateus-sprnd.workers.dev/`
   (esperado `200`). Se não for 200, vá ao §8.
2. Foi o último deploy? `npx wrangler deployments list` (raiz do repo) mostra data/hora do
   último. Compare com a hora do primeiro relato.
3. **Rollback do Worker (30 segundos):**

```powershell
cd D:\Soulmon\repo
npx wrangler deployments list
npx wrangler versions list
npx wrangler rollback <VERSION_ID_ANTERIOR> --message "rollback: tela branca no beta"
```

   (`rollback` sem argumento volta à versão imediatamente anterior.) **Verificação:**
   `curl.exe -s https://soulmon.mateus-sprnd.workers.dev/sw.js | Select-String CACHE_VERSION`
   mostra a versão anterior; abra o app e confira.
4. **Impeça o redeploy automático do mesmo commit ruim.** O push na `main` publica o
   Worker sozinho. Reverta o commit para a `main` voltar a ser a versão boa:

```powershell
git fetch origin; git checkout main; git pull --ff-only
git revert --no-edit <SHA_RUIM>
npm run portoes
git push origin main
```

5. **Service worker velho:** testadores que já carregaram o bundle ruim ficam com ele em
   cache. O fix precisa subir o `CACHE_VERSION` de `public/sw.js` (o revert deixa a versão
   *anterior*, que o cliente considera velha -> troca; confira que o SW novo de fato
   substitui). Se o bundle ruim travar o próprio carregamento do SW, peça "limpar dados do
   app" (mensagem abaixo) — o save está na nuvem.
6. **Se o defeito é nativo** (AAB): corrija, suba `versionCode` +1 (`RUNBOOK` Fase 3) e
   publique **na mesma trilha de teste fechado**. Para impedir novas instalações da versão
   ruim enquanto isso, **Pausar a faixa** (Testes -> Teste fechado -> faixa -> menu ->
   *Pausar faixa* **[a confirmar a opção no Console]**). A versão anterior boa também pode
   ser republicada como versão nova com `versionCode` maior (rollback = roll-forward).
7. Colete a causa: stack em `/api/crash`, `npx wrangler tail soulmon --format pretty`,
   `adb logcat -d | Select-String "AndroidRuntime|chromium"` num aparelho conectado.

**Mensagem ao testador.**
> Oi! Hoje entre HH:MM e HH:MM o Soulmon podia abrir em branco ou fechar sozinho. Já
> corrigimos. Se ainda abrir em branco: feche o app, abra de novo com Wi-Fi ligado; se
> persistir, Configurações do Android -> Apps -> Soulmon -> Armazenamento -> **Limpar
> cache** (não precisa limpar dados; seu progresso está salvo na nuvem). **Não
> desinstale.** Obrigado por ajudar a testar!

---

## 2. Save corrompido ou perdido

**Sinal.** Relato "voltei e meu bichinho/tarefas sumiram", "voltou ao dia 1", nível
reduzido; ou erro 5xx em `/api/save`; ou a migração de campos novos (gauge de evolução,
`dungeonDepthRecord`, `evolutionPoints` vindo de `perfectDays`) escrevendo errado.

**Quem age.** Dono (precisa de login); squad prepara a restauração. É **S1**.

### 2.0 Prevenção (faça ANTES do dia 0 do relógio)

Snapshot diário do KV, rodando na sua máquina (Agendador de Tarefas do Windows ou à
mão), para `E:\soulmon-backups\`:

```powershell
$dir = "E:\soulmon-backups\$(Get-Date -Format yyyy-MM-dd_HH)"; New-Item -ItemType Directory -Force $dir | Out-Null
$ns = "20b3ba78a3e84265b5e2d4cd0d411d43"    # SOULMON_SAVES (wrangler.jsonc)
$keys = npx wrangler kv key list --namespace-id $ns --remote | ConvertFrom-Json
foreach ($k in $keys) {
  if ($k.name -match '^(ord:|del:|coop|push:|fcm:)') { continue }      # só saves; ajuste o filtro às chaves reais
  npx wrangler kv key get $k.name --namespace-id $ns --remote | Out-File -Encoding utf8 "$dir\$($k.name -replace '[^\w\.-]','_').json"
}
```

Com 15 testadores são ~15 chaves de save: segundos. Confira **uma vez** que o filtro pega
os saves (`$keys | Select-Object -First 10 name`) — a chave de save é o `saveId` (hash do
e-mail). Guarde 7 dias.

### 2.1 Diagnóstico

1. Peça ao testador o Gmail e a hora aproximada. O servidor só conhece o `saveId` (hash).
2. O Worker *recusa escrita* de conta apagada (tombstone `del:done:<saveId>` por 30 dias):
   confira se o testador apertou **Excluir conta** (`npx wrangler kv key get "del:done:<saveId>" --namespace-id <ns> --remote`).
3. Veja o que está gravado hoje: `npx wrangler kv key get <saveId> --namespace-id <ns> --remote`
   (guarde a saída em arquivo; **não cole em chat**, tem dado pessoal: humor, textos livres).
4. Há cópia local no aparelho? Se o app abre e mostra o save bom, **não deixe sincronizar
   por cima**: peça "Configurações -> Seus dados -> Exportar" **antes** de qualquer outra
   ação e guarde o arquivo.

### 2.2 Restauração

Fonte, em ordem de preferência: (1) exportação do próprio testador; (2) snapshot de
§2.0; (3) save local do aparelho.

```powershell
# validar JSON antes de gravar
Get-Content E:\soulmon-backups\2026-10-20_09\<saveId>.json -Raw | ConvertFrom-Json | Out-Null
npx wrangler kv key put <saveId> --path E:\soulmon-backups\2026-10-20_09\<saveId>.json --namespace-id 20b3ba78a3e84265b5e2d4cd0d411d43 --remote
```

O `put` perde os *metadados* do KV (`firstSeen`, usado em TTL/renovação). Efeito pequeno
no beta; a primeira escrita do app o recria. **Verificação:** o testador faz logout/login e
vê o bichinho de volta; confira com ele nível e quantidade de tarefas.

Se o defeito é a **migração** (campo novo): pare novas escritas ruins primeiro (rollback do
Worker, §1), só então restaure — senão o app sobrescreve de novo.

**Mensagem ao testador.**
> Oi! Vimos que o seu progresso no Soulmon ficou diferente do que devia. Estamos
> restaurando o seu save a partir de uma cópia. **Por favor, não abra o app até a gente
> avisar** (leva ~1 h); se já abriu, tudo bem, só não apague nada. Antes de voltar a usar:
> Configurações -> Seus dados -> **Exportar** e nos mande o arquivo, se puder. Obrigado, e
> desculpa o susto: é para isso que existe teste.

---

## 3. Billing quebrado (compra falha, duplica ou cobra)

**Sinal.** Testador: "paguei e não liberou", erro na folha, "créditos sumiram"; 5xx/4xx
em `/api/billing`; `wrangler tail` mostra `verification-failed`, `account-mismatch` ou
`order-in-use` em massa. **Se alguém foi cobrado de verdade** (licença de teste mal
configurada) é S1.

**Quem age.** Dono (Play Console, secrets). Compra de teste não cobra cartão; confirme
que o Gmail do testador está em **Configurações -> Teste de licença**.

**Diagnóstico rápido por código de erro.**

| Resposta | Causa | Ação |
|---|---|---|
| 503 | falta `GOOGLE_PLAY_SERVICE_ACCOUNT` ou `ANDROID_PACKAGE_NAME` | `npx wrangler secret list`; recolocar (RUNBOOK 7.2) |
| 502 `verification-failed` | service account sem permissão financeira / API desligada / propagação | RUNBOOK 7.1 |
| 403 `account-mismatch` | `PLAY_REQUIRE_ACCOUNT_BINDING=true` e a compra veio sem vínculo (AAB velho) | peça atualização do app; **se for em massa, desligue o flag** abaixo |
| 409 `order-in-use` | o mesmo recibo em outra conta (trava do D1 funcionando) | esperado; se for o mesmo testador, ver §2 |
| 500 | tabela `order_claims` ausente (migração não aplicada) | `wrangler d1 migrations apply soulmon-billing --remote` |

**Desligar o flag de vínculo (se travou todas as compras):**

```powershell
npx wrangler secret delete PLAY_REQUIRE_ACCOUNT_BINDING
```

**Desligar as compras de vez (último recurso):**
1. Play Console -> Monetizar -> Produtos -> **Desativar** os produtos (a folha da Play
   deixa de vender; quem já comprou continua com o direito).
2. `npx wrangler secret delete GOOGLE_PLAY_SERVICE_ACCOUNT` faz o servidor **recusar tudo
   com 503** (falha fechada; nada é concedido). Atenção: isso também bloqueia *restaurar*
   compras e a verificação da assinatura. Só use se houver risco de conceder indevidamente.
   Recolocar depois: RUNBOOK 7.2.

**Compra feita e não concedida:** o recibo está na Play. Peça ao testador **Configurações
-> Conta e compras -> Restaurar compras**. Se falhar, conceda por cortesia
(`ENTITLEMENTS_ADMIN_KEY`, `/api/entitlements?action=grant`, teto `COURTESY_MAX_ACCOUNTS`).

**Assinatura:** ver também §4 (RTDN). Se o Console mostra assinatura ativa e o app não abre
a vitrine, force releitura pedindo "Restaurar compras"; o servidor refaz `GET
subscriptionsv2`.

**Mensagem ao testador.**
> Oi! A compra de teste no Soulmon deu problema por um erro nosso (você **não foi cobrado**
> — é licença de teste). Já ajustamos. Pode tentar de novo? Se aparecer "já comprado",
> vá em Configurações -> Conta e compras -> **Restaurar compras**. Se mesmo assim não
> liberar, responda esta mensagem com o horário da tentativa.

---

## 4. RTDN falhando (assinatura não atualiza)

**Sinal.** Assinatura renovada na Play, mas a vitrine continua fechada (ou o oposto:
cancelada e continua aberta); Pub/Sub -> assinatura -> **mensagens não confirmadas
crescendo**; `wrangler tail` mostra 401/5xx em `/api/rtdn`.

**Quem age.** Dono.

1. `curl.exe -i -X POST https://soulmon.mateus-sprnd.workers.dev/api/rtdn` -> esperado **401**
   (não 404/500). 404 = rota não foi deployada (merge/deploy); 500 = erro de código.
2. Console Cloud -> Pub/Sub -> assinatura `play-rtdn-push` -> **Métricas**:
   *Idade da mensagem mais antiga*. Se > 0 e crescendo, o endpoint está falhando.
3. 401 em tudo: o `aud` ou o e-mail da SA de push no Worker não bate com a assinatura
   (RUNBOOK 7.3 passo 4-5). Corrigir o secret e fazer um novo deploy não é necessário.
4. Pub/Sub **reenvia sozinho** com backoff (retenção padrão 7 dias): corrigido o endpoint,
   as mensagens pendentes chegam. Para forçar: Console Play -> Configuração de
   monetização -> **Enviar notificação de teste**.
5. Rede de proteção: o `auditRefunds` (polling diário por conta) e o "Restaurar compras"
   releem a Play e acertam o estado. Dê ao testador o caminho de restaurar.
6. Se o Pub/Sub inteiro estiver sem solução em horas: aceite a defasagem no beta (nada de
   dinheiro depende de RTDN: a vitrine futura abre/fecha, o entregue fica) e registre.

**Mensagem ao testador.**
> Oi! A atualização automática da assinatura do Soulmon atrasou. Seus itens **não foram
> perdidos**. Se a vitrine do trimestre não abrir, vá em Configurações -> Conta e compras
> -> **Restaurar compras**. Já estamos acertando por aqui.

---

## 5. Push spamando (notificações repetidas ou fora de hora)

**Sinal.** Testador: "recebi 5 notificações"; ritmo das refeições disparando a cada 30
min; notificação depois de o dia estar fechado.

**Quem age.** Dono. S2 (afeta confiança do testador e a permissão de notificação).

**Desligar o cron (preferido; reversível):**

```powershell
cd D:\Soulmon\repo\workers
# editar workers/wrangler.toml:  crons = []
npx wrangler deploy -c wrangler.toml
npx wrangler deployments list -c wrangler.toml
```

**Mais rápido, sem editar código:** só parar o canal Android derrubando a conta de serviço
do FCM (recriável em minutos):

```powershell
npx wrangler secret delete FIREBASE_SERVICE_ACCOUNT -c wrangler.toml
```

(Web Push segue; para cortar também o Web Push, use `crons = []`. **Não** apague
`VAPID_JWK`: gira o par e invalida todas as inscrições.)

Depois de achar a causa (fuso de hora local da inscrição, `mealRhythm`, ritmo `*/30`),
restaure: `crons` originais (`["0 1 * * *", "0 13 * * *", "0 19 * * *", "*/30 * * * *"]`)
+ `secret put FIREBASE_SERVICE_ACCOUNT` + `deploy`. **Verificação:** só chega a notificação
esperada, na hora local certa, de um aparelho de teste seu por 24 h.

**Mensagem ao testador.**
> Oi! Por uns instantes o Soulmon mandou notificações repetidas — foi um erro nosso, já
> desligamos. Pode ignorá-las. Pedimos que **não desative** as notificações do app: elas
> voltam amanhã no ritmo certo. Se quiser, avise o horário da que veio errada.

---

## 6. Testador sai e a contagem cai abaixo de 12

**Sinal.** Play Console -> Teste fechado -> Testadores: opted-in < 12 (ou < 15, o seu
alerta). Ou o testador avisa que desinstalou.

**Quem age.** Dono (decide), squad (recruta; ver `BETA-TESTADORES.md`).

**Prevenção — reserva.** Mantenha **15-20 opted-in** desde o dia 1 e uma **lista de
espera de 10 contatos** já convidados ao grupo mas ainda não adicionados (ou adicionados
e avisados de que são "reserva ativa"). Cada baixa: um da reserva entra no mesmo dia.

**Se cair abaixo de 12:**

1. Mesmo dia: peça ao testador desistente para **voltar a optar** (se desinstalou por
   engano, reinstalar pelo link recompõe). Mensagem abaixo.
2. Adicione reservas ao Google Group (RUNBOOK 9.1) e mande o convite
   (`BETA-TESTADORES.md` §2). Opt-in precisa ser feito por cada um no link.
3. Abra o Console e anote: o contador de dias **parou ou reiniciou?** O Google já mudou
   essa regra antes **[a confirmar no Console]**. Trate como reiniciado até ver o contrário
   e **não** assuma que "voltou depois" conta.
4. Recrute mais: r/AndroidClosedTesting, r/TestersCommunity, Discord, troca recíproca
   (`BETA-TESTADORES.md`). Meta: 20+ para nunca depender de um só.
5. Se o relógio reiniciou: reinicie o calendário do RUNBOOK 10.2 com nova data D0 e avise
   quem está ativo que precisa ficar mais 14 dias (mensagem educada abaixo).

**Mensagem ao testador que saiu.**
> Oi! Percebemos que o Soulmon saiu da sua lista. Precisamos de **12 pessoas com o app
> instalado por 14 dias seguidos** para o Google liberar o lançamento — cada pessoa conta.
> Dá para reinstalar pelo mesmo link de teste e só deixar ele aí até o dia DD/MM? Você não
> precisa jogar todo dia; o que conta é **não desinstalar**. Obrigado!

**Mensagem ao grupo se reiniciou.**
> Oi, pessoal! O Google reiniciou a contagem dos 14 dias porque alguém saiu do teste. É por
> isso que **o que mais ajuda é não desinstalar**. A nova data final é DD/MM. Seguimos
> juntos, e o 1º dia de uso novo já vale como feedback. Obrigado!

---

## 7. A Play rejeita (revisão do teste fechado, ficha ou produção)

**Sinal.** E-mail da Play / painel "Problemas encontrados" / versão com status
*Rejeitada* ou *Remoção*. **Quem age.** Dono lê a mensagem exata (print); squad redige a
resposta e o ajuste.

| Motivo comum | Onde a squad olha | Resposta/ajuste |
|---|---|---|
| **Data Safety diverge do app** (permissões, SDKs, diagnóstico de crash, assinatura) | `PLAY-DATA-SAFETY.md` §2.4b e §2.7 | corrigir o formulário; **declarar o crash reporting próprio** e o histórico de compras/assinatura |
| **Declaração de permissão sensível** (`SCHEDULE_EXACT_ALARM`, `RECORD_AUDIO`, `ACTIVITY_RECOGNITION`) | `AndroidManifest.xml`; `PLAY-DATA-SAFETY.md` §2.4b | `SCHEDULE_EXACT_ALARM` **foi removida** (#311) — mostrar o manifesto mesclado sem ela; declarar só `RECORD_AUDIO` e `ACTIVITY_RECOGNITION` |
| **Política de privacidade ou exclusão de conta** inacessível | `privacidade.html#exclusao` no ar | conferir 200 e o botão in-app Seus dados -> Excluir conta |
| **Acesso ao app**: revisor não consegue entrar | conta de teste do revisor | recrie a conta de e-mail/senha, ative, reenvie as instruções |
| **App em WebView / funcionalidade mínima** (o APK é um shell que carrega `server.url`) | `capacitor.config.json` | responder com a lista de recursos nativos reais: notificações push e locais, Play Billing, contador de passos, widget, microfone; e o app funcionar mesmo com a tela de erro de rede própria |
| **Assinatura sem divulgação clara** (preço, renovação, cancelamento) | tela de compra do app, `termos.html` | exibir "a cada 3 meses", renovação automática, "cancele em Play Store -> Assinaturas" e o botão Gerenciar |
| **Conteúdo gerado por IA** sem aviso/denúncia | `PLAY-FICHA.md` §5; Configurações -> Sobre | o aviso existe; indicar o caminho de reporte (e-mail de contato) |
| **Conteúdo gerado pelo usuário** (nome de guilda, apelido) sem moderação | `PLAY-FICHA.md` §4 | explicar o filtro e o canal de denúncia; **[confirmar que existe botão de denunciar]** |
| **Classificação (IARC)** inconsistente | `PLAY-FICHA.md` §4 | refazer o questionário incluindo compras, assinatura e interação |
| **Metadados**: promete o que o app não faz, "offline", "melhor que" | `PLAY-FICHA.md` §3 | trocar o texto, reenviar |

**Procedimento:** (1) não faça nova submissão antes de entender o motivo (reincidência
piora); (2) corrija o que apontaram, mais o que a mesma classe de erro atingiria; (3) se
discordar, **Apelar** no próprio e-mail/painel com texto objetivo e prints; (4) o tempo de
espera conta contra o plano: avise os testadores que o relógio pode atrasar.

**Mensagem ao testador.**
> Oi! A atualização do Soulmon está em análise no Google e deve sair em poucos dias.
> Continue com a versão que você tem instalada e **não desinstale**. Aviso quando mudar.

---

## 8. Worker fora / limite gratuito da Cloudflare

**Sinal.** Tela de erro de rede do app (a nova, com a identidade do Soulmon) para vários
testadores ao mesmo tempo; `curl.exe -i https://soulmon.mateus-sprnd.workers.dev/` devolve
5xx, `1015` (rate limited), `1027` ou "exceeded"; status em `cloudflarestatus.com`.

**Quem age.** Dono.

**Por que importa com 15 testadores.** O plano gratuito do Workers tem teto de
requisições/dia e o **KV gratuito tem teto baixo de gravações/dia** (da ordem de mil por dia
**[a confirmar no painel: Workers & Pages -> Planos]**). Cada ação sincronizada do app
grava o save. Se o beta estourar, `PUT` falha e o app mostra erro de sync.

1. Painel Cloudflare -> Workers & Pages -> `soulmon` -> **Metrics**: pedidos, erros, e
   *KV operations* por dia. Se bateu no teto: **upgrade para Workers Paid (≈ US$ 5/mês)**
   — resolve na hora e é a decisão correta para um beta com pagamento. Dê antes de
   precisar.
2. Incidente da própria Cloudflare: nada a fazer; o app mostra a tela de erro de rede
   (não branca) e o save local é preservado. Avise e espere.
3. Deploy ruim: §1 (rollback).
4. D1: `npx wrangler d1 execute soulmon-billing --remote --command "SELECT count(*) FROM order_claims"`
   responde? Se não, compras 500 (§3).
5. Depois do incidente: confira que **nenhum save foi sobrescrito vazio** (§2).

**Mensagem ao testador.**
> Oi! O servidor do Soulmon ficou indisponível por um tempo (ou ficou lento). Sua tela de
> erro é normal nessa hora: feche e abra de novo daqui a alguns minutos. **Seu progresso
> não se perde.** Se não voltar em 1 hora, nos avise.

---

## 9. Firebase Auth fora (login)

**Sinal.** "Não consigo entrar", "senha incorreta" para quem já entrava; 401 em tudo em
`/api/save`; `status.firebase.google.com` com incidente em Authentication; ou **depois de
mexer em restrição da API key** (RUNBOOK 5.2).

**Quem age.** Dono.

1. Quem **já está logado** normalmente continua: o Worker valida o ID token com as chaves
   públicas do Google; o token dura ~1 h e renova. Quem **abre do zero** durante o
   incidente não entra.
2. Se começou logo depois de mexer na chave de API: o suspeito nº 1 é a restrição. Cloud
   Console -> Credenciais -> a key **Web** (`VITE_FIREBASE_API_KEY`) deve estar com
   restrição **HTTP referrer** `soulmon.mateus-sprnd.workers.dev/*` e **não** restrição
   Android. Afrouxe temporariamente, teste, corrija.
3. Se o `FIREBASE_PROJECT_ID` sumiu do Worker (`vars` do `wrangler.jsonc` foi
   sobrescrito?), `/api/save` volta ao modo aberto ou 503: confira `wrangler.jsonc` ->
   `vars.FIREBASE_PROJECT_ID = "soulmon-app"` e o último deploy.
4. Não proponha "trocar o login" no meio do beta.

**Mensagem ao testador.**
> Oi! O login do Soulmon está instável por um problema no serviço do Google/Firebase (ou
> num ajuste nosso). Se você **já estava logado, pode seguir usando**. Se foi deslogado,
> tente de novo daqui a ~30 min. Seu progresso está salvo.

---

## 10. Keystore de upload perdida ou comprometida

**Sinal.** O `.jks` sumiu (disco, formatação, `E:\` apagado), esqueceu a senha, ou ele
vazou (foi para um repo, chat, nuvem).

**Quem age.** Dono. **Com Play App Signing a situação é recuperável**: a chave que o
usuário vê é a do Google; a sua é só de upload.

**Primeiro, tente recuperar:** backup offline e gerenciador de senhas (RUNBOOK 1.2).
Abra com `keytool -list`. Se abrir, acabou.

**Se não há backup (ou a senha é irrecuperável) — redefinir a chave de upload:**

1. Gere uma **nova** keystore (RUNBOOK 1.1) com outro alias, ex. `soulmon-upload2`, em outro
   arquivo. Faça backup na hora.
2. Exporte o certificado público (não é segredo):

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -export -rfc -alias soulmon-upload2 `
  -keystore E:\soulmon-secrets\soulmon-upload2.jks -file E:\soulmon-secrets\upload_certificate.pem
```

3. Play Console -> **Testar e lançar -> Configuração -> Integridade do app -> Assinatura
   de apps pela Play -> Solicitar redefinição da chave de upload** (ou "Perdi minha chave de
   upload") **[a confirmar a redação no Console]** -> envie o `.pem`. A Play ativa a chave nova
   em até ~2 dias úteis. **Enquanto isso você não consegue subir AAB.**
4. Quando a chave nova estiver ativa: adicione o novo SHA-1/SHA-256 de upload no Firebase
   (RUNBOOK 5.1) e na restrição da API key (5.2), reconstrua o AAB com a chave nova
   (`ORG_GRADLE_PROJECT_RELEASE_KEY_ALIAS=soulmon-upload2`) e `versionCode` +1.
5. **Os testadores não são afetados**: o APK entregue continua assinado pela chave do
   Google.

**Se ela vazou:** trate como perdida (redefina). Quem tem o `.jks` **e** a senha pode subir
um AAB na sua conta **só se também tiver acesso à sua conta Play** — o risco é menor com 2FA
na conta. Ative verificação em duas etapas e revise "Usuários e permissões".

**Sem mensagem aos testadores** (invisível para eles), salvo atraso de correção urgente: use a
mensagem do §1 passo 6.

---

## 11. Vazamento de segredo (chave de API, service account, admin key)

**Sinal.** Segredo apareceu em commit, PR, issue, print, chat, log; alerta do GitHub
(*secret scanning*) ou do Google ("chave exposta"); consumo estranho na Groq/Higgsfield;
compra concedida sem pagamento.

**Atenção:** o repo `HexerVoodoom/Soulmon` é **público**. Segredo que entrou em commit é
considerado **comprometido para sempre**, mesmo depois de apagar (o histórico/forks/caches
guardam). O que resolve é **rotacionar**, não reescrever histórico.

**Quem age.** Dono, em minutos. Nada a squad pode rotacionar sozinha.

| Segredo | Rotação |
|---|---|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | Cloud Console -> IAM -> Contas de serviço -> `play-billing-verify` -> **Chaves**: criar chave JSON nova, `npx wrangler secret put GOOGLE_PLAY_SERVICE_ACCOUNT`, **excluir a chave antiga** |
| `FIREBASE_SERVICE_ACCOUNT` (push) | Firebase -> Contas de serviço -> gerar nova chave; `cd workers; npx wrangler secret put FIREBASE_SERVICE_ACCOUNT -c wrangler.toml`; excluir a antiga em Cloud IAM |
| Conta de serviço do RTDN (OIDC) | recriar a SA `rtdn-push`; ajustar assinatura do Pub/Sub; atualizar o secret do e-mail |
| `VAPID_JWK` | gira o par: **invalida todas as inscrições de Web Push** (usuários reativam as notificações). Só se vazou de fato. Ver commit "gira o par VAPID" no histórico |
| `METRICS_ADMIN_KEY`, `ENTITLEMENTS_ADMIN_KEY`, `SEASON_ADMIN_KEY` | `openssl rand -hex 32` (ou `[guid]::NewGuid()` x2) -> `wrangler secret put` na raiz e, no caso da season, também em `workers/` (mesmo valor) |
| `GROQ_API_KEY`, `HF_API_KEY`/`HF_SECRET`, `GEMINI_API_KEY` | revogar no painel do provedor, criar nova, `secret put` |
| Chave de API do Firebase/Google (`AIza...`) | é pública por desenho; **restrinja** (RUNBOOK 5.2). Se foi usada fora, gere outra e atualize `google-services.json` + `VITE_FIREBASE_API_KEY` (rebuild) |
| Keystore de upload | §10 |
| Token do GitHub / `gh` | github.com/settings/tokens -> revogar; `gh auth login` de novo |

**Depois da rotação:**
1. `npx wrangler secret list` (raiz e `workers/`) — conferir os nomes.
2. Teste uma compra de teste e uma notificação (se rotacionou Play/Firebase).
3. Busque o vazamento: `git log --all -S"<trecho>" --oneline` e, se for o caso,
   `git filter-repo` **só como higiene**, nunca como solução.
4. Registre no `docs/STATUS.md`: o quê, quando, onde vazou, o que rotacionou.

**Mensagem ao testador:** normalmente nenhuma. Se houve indisponibilidade, use §8.

---

## 12. Cartão de bolso (qual comando para qual fogo)

| Fogo | Primeiro comando |
|---|---|
| Tela branca para todos | `npx wrangler rollback` |
| Save errado de 1 pessoa | `npx wrangler kv key get <saveId> --namespace-id 20b3ba78a3e84265b5e2d4cd0d411d43 --remote` |
| Compra não concede | `npx wrangler tail soulmon --format pretty` |
| Binding derrubou compras | `npx wrangler secret delete PLAY_REQUIRE_ACCOUNT_BINDING` |
| Push spam | `crons = []` em `workers/wrangler.toml` + `npx wrangler deploy -c wrangler.toml` |
| Gente saindo do teste | `BETA-TESTADORES.md` §2 (convite) |
| Chave perdida | Console Play -> Integridade do app -> redefinir chave de upload |
| Segredo vazou | §11 — rotacionar, não reescrever histórico |
