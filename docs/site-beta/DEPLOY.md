# Publicar o site do beta: passo a passo

URL final: https://soulmon.pages.dev/beta/ (inglês: https://soulmon.pages.dev/beta/en/).
Projeto Pages `soulmon`: criado, vazio. Banco D1 `soulmon-beta`: criado, migrações 0001 e 0002 aplicadas (id em `site-beta/wrangler.jsonc`). Nada foi publicado ainda.

Regra: **só publicar com aval da sessão operacional.** Todos os comandos rodam no PowerShell, dentro de `E:\Projetos\soulmon-site-beta\site-beta`. Um comando por bloco: copie, cole, aperte Enter, espere terminar, só então o próximo.

Primeiro comando de toda sessão (entra na pasta):

```powershell
cd E:\Projetos\soulmon-site-beta\site-beta
```

Esperado: nada é impresso; o prompt passa a mostrar essa pasta. Se disser que não encontra o caminho, avise a squad.

## Quem faz o quê

| O dono faz | A squad faz |
|---|---|
| Criar o widget Turnstile no painel e anotar as duas chaves | Código, testes, build, texto da política |
| Colar os 4 secrets (os valores só o dono tem) | Conferir `wrangler.jsonc`, migrações, scripts |
| Rodar o deploy (ou autorizar a squad a rodar) | Revisar a saída do deploy e da conferência pós-deploy |
| Ativar Web Analytics no painel | Comparar a lista do BETA_EMAILS e preparar o valor novo |
| Decidir BETA_CLOSED, aprovar a política, convidar as levas | Manter este roteiro e o rollback |

## Parte 0. Preparação (uma vez)

Entrar na conta Cloudflare pelo terminal:

```powershell
npx wrangler login
```

Abre o navegador; clique em Permitir. Esperado no terminal: `Successfully logged in`. Se falhar, feche o navegador e rode de novo; se persistir, avise a squad.

```powershell
npx wrangler whoami
```

Esperado: seu e-mail da Cloudflare e o nome da conta. Se mostrar "not authenticated", repita o `login`.

```powershell
npx wrangler pages project list
```

Esperado: tabela com o projeto `soulmon` e o domínio `soulmon.pages.dev`. Se `soulmon` não aparecer, pare e avise a squad.

## Parte 1. Turnstile (dono, no painel)

Turnstile é a verificação anti-robô do formulário.

1. Abra https://dash.cloudflare.com e entre.
2. No menu da esquerda, clique em **Turnstile**.
3. Clique em **Add widget**.
4. Nome: `soulmon-beta`.
5. Hostname: clique em **Add hostname** e escolha/digite `soulmon.pages.dev`.
6. Modo: **Managed**.
7. Clique em **Create**.
8. Aparecem duas chaves. Anote as duas em local seguro (gerenciador de senhas):
   - **Site key**: pública, vai no build (Parte 3).
   - **Secret key**: privada, vai no secret `TURNSTILE_SECRET` (Parte 2). Nunca mande por chat nem coloque em arquivo do projeto.

O Turnstile é gratuito. Se a tela pedir pagamento, pare e avise a squad.

## Parte 2. Os 4 secrets (dono)

Cada comando pergunta o valor. Cole e aperte Enter (ao colar, nada aparece na tela; é normal). Esperado ao final de cada um: `Success! Uploaded secret ...`. Se o projeto ainda não tiver nenhum deployment e o wrangler reclamar, avise a squad (os secrets podem ser colocados pelo painel: Settings > Variables and Secrets).

**2.1. TURNSTILE_SECRET**: cole a Secret key da Parte 1.

```powershell
npx wrangler pages secret put TURNSTILE_SECRET --project-name soulmon
```

**2.2. RESEND_API_KEY**: a **mesma chave que o app usa**. Copie do seu gerenciador de senhas ou do painel da Resend (https://resend.com/api-keys; a Resend só mostra a chave inteira na criação; se não a tiver mais, crie uma nova lá, e atualize o app também).

```powershell
npx wrangler pages secret put RESEND_API_KEY --project-name soulmon
```

**2.3. HASH_SALT**: gere um valor aleatório longo (imprime 64 caracteres):

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join ''
```

Esperado: uma linha com 64 letras e números. **Guarde esse valor agora em local seguro.** Se perder, não dá para remover ninguém a pedido nem marcar convites (os scripts precisam dele). Não troque depois que houver inscritos: os hashes deixam de bater. Cole o mesmo valor aqui:

```powershell
npx wrangler pages secret put HASH_SALT --project-name soulmon
```

**2.4. NOTIFICAR_PARA**: digite `soulmon.revisor@gmail.com`.

```powershell
npx wrangler pages secret put NOTIFICAR_PARA --project-name soulmon
```

Conferir que os 4 existem (mostra só os nomes):

```powershell
npx wrangler pages secret list --project-name soulmon
```

Esperado: `TURNSTILE_SECRET`, `RESEND_API_KEY`, `HASH_SALT`, `NOTIFICAR_PARA`.

## Parte 3. Build e deploy

**3.1. Dependências** (só na primeira vez nesta máquina):

```powershell
npm install
```

Esperado: termina sem `ERR!`.

**3.2. Testes** (a squad já rodou; confirme):

```powershell
npx vitest run
```

Esperado: `Test Files ... passed` e `Tests ... passed`, sem `failed`. Se algo falhar, não publique e avise a squad.

**3.3. Build com a site key real.** Troque `COLE_A_SITE_KEY` pela Site key da Parte 1:

```powershell
$env:PUBLIC_TURNSTILE_SITEKEY = "COLE_A_SITE_KEY"
```

```powershell
npm run build
```

Esperado: termina sem erro e a pasta `dist` fica criada. Use as duas linhas na mesma janela do PowerShell.

**3.4. Branch de produção.** O deploy só vira o endereço oficial se a branch passada for a de produção do projeto. Veja no painel: Workers & Pages > `soulmon` > Settings > Builds > **Production branch**. (`pages project list` não mostra isso. O projeto foi criado em 06/11 com `--production-branch main`: use `main` para a produção; confirme no painel.) Use no próximo comando o nome que o painel mostrar. Se usar outro nome, o deploy vira só uma prévia em `<branch>.soulmon.pages.dev` e a URL oficial continua vazia; não há dano, refaça com a branch certa.

**3.5. Deploy** (troque `site-beta` pelo nome do painel, ex.: `main`):

```powershell
npx wrangler pages deploy dist --project-name soulmon --branch main
```

Esperado no fim: `Deployment complete! Take a peek over at https://<código>.soulmon.pages.dev`. Em 1 a 2 minutos o dono vê no navegador: **https://soulmon.pages.dev/beta/**. Aviso de "commit sujo" não é erro. "Project not found": confira o nome `soulmon` e o login.

## Parte 4. Conferência pós-deploy

1. Abra https://soulmon.pages.dev/beta/ e https://soulmon.pages.dev/beta/en/: carregam, o formulário aparece e a página de privacidade abre.
2. Cadastre o **seu próprio e-mail**. Esperado: mensagem de sucesso.
3. Em alguns minutos deve chegar "Nova inscricao no beta" em soulmon.revisor@gmail.com (o aviso não traz o e-mail do inscrito). Veja o spam. Se não chegar, confira `RESEND_API_KEY` e `NOTIFICAR_PARA` e avise a squad.
4. Defina o HASH_SALT nesta janela (valor guardado na Parte 2.3):

```powershell
$env:HASH_SALT = "COLE_O_HASH_SALT"
```

5. Exportar a lista (grava um CSV em `E:\Soulmon-marketing\inscritos\`, fora do git):

```powershell
npm run exportar -- --remote
```

Esperado: caminho do arquivo e contagem; seu e-mail está na lista. Apague o CSV depois de usar.

6. Remover o e-mail de teste (troque pelo seu):

```powershell
npm run remover -- seu@email.com --remote
```

Esperado: `removido (linha apagada)`. Se aparecer `FALHOU` ou erro de HASH_SALT, o valor da etapa 4 está errado.

## Parte 5. Web Analytics (dono, no painel)

1. https://dash.cloudflare.com > **Workers & Pages** > projeto `soulmon`.
2. Aba **Metrics**: seção **Web Analytics** > **Enable**.
3. Confirme. Funciona sem cookies. Se pedir para criar um "site" separado, escolha a opção do próprio projeto Pages. Os números aparecem depois de algumas visitas.

## Parte 6. BETA_CLOSED (cuidado: afeta quem joga hoje)

`BETA_CLOSED` fica no **app** (não neste site). Ligado, quem não está na lista `BETA_EMAILS` consegue logar, mas leva 403 `beta-closed` e **perde acesso a save, IA e compra**. Quem joga hoje e não está na lista é barrado. Passo a passo seguro:

1. **Dois arquivos de texto**, fora do repo (por exemplo em `E:\Soulmon-marketing\inscritos\`):
   - `atual.txt`: o valor atual do secret `BETA_EMAILS` do app (copie de onde você o guarda; a Cloudflare não mostra o valor de um secret).
   - `testadores.txt`: os testadores atuais (separados por vírgula, `;`, espaço ou linha, ou CSV com coluna `email`).
2. **Comparar** (sem rede; imprime só contagens e iniciais mascaradas, como `j***@gmail.com`):

```powershell
npm run comparar-beta -- --atual E:\Soulmon-marketing\inscritos\atual.txt --testadores E:\Soulmon-marketing\inscritos\testadores.txt
```

Esperado: totais de cada lista; em ambas; **só em testadores** (faltam no secret: seriam barrados com 403); só no atual; duplicatas; inválidas; e o aviso de que a regra do Gmail (ignora pontos e `+tag`) pode juntar duas entradas em uma. O detalhe completo vai para `E:\Soulmon-marketing\inscritos\comparacao-<data>.txt`, e o novo valor sugerido para `BETA_EMAILS` (união normalizada, separada por vírgula, não impresso na tela) vai para `beta-emails-sugerido-<data>.txt`. Esses arquivos têm e-mails: nunca commitar nem mandar por chat.
3. **Se "só em testadores" for maior que 0**, essas pessoas seriam barradas. Atualize o secret `BETA_EMAILS` do app com o conteúdo do arquivo sugerido **antes** de ligar a flag.
4. **Avise** a sessão operacional e os testadores e combine o horário.
5. **Ligue** `BETA_CLOSED=1` no app (a squad passa o comando exato do projeto do app).
6. **Teste o 403:** entre no app com uma conta Google que **não** está na lista; deve aparecer a tela de beta fechado. Depois entre com uma conta da lista; deve funcionar.
7. **Desfazer:** remova o secret `BETA_CLOSED` (ou ponha `0`) no app e republique.

## Parte 7. Operação diária

Antes de usar os scripts em uma janela nova, defina o HASH_SALT (Parte 4, passo 4).

**Convites** (até 30 por dia, por causa do teto de sprites; o convite vale 7 dias). Este comando só mostra as vagas a liberar (convites com mais de 7 dias sem instalação) e os próximos 30 da fila, sem gravar nada:

```powershell
npm run proxima-leva -- 30 --remote
```

Envie os convites; só depois grave que foram enviados (não repita à toa, senão pula gente):

```powershell
npm run proxima-leva -- 30 --marcar --remote
```

Opcional: `--leva 2` junto, para numerar a leva. Marcar entrada no teste fechado e jogo ativo:

```powershell
npm run proxima-leva -- --optin email@exemplo.com --remote
```

```powershell
npm run proxima-leva -- --ativo email@exemplo.com --remote
```

**Lista de espera (vagas esgotadas):** em `site-beta\wrangler.jsonc` troque `"LEVA_ESTADO": "abertas"` por `"LEVA_ESTADO": "espera"` e refaça a Parte 3 (build e deploy). O formulário passa a dizer que a pessoa entrou na fila.

**Remoção a pedido:** só quando o próprio endereço pedir (escrevendo do e-mail inscrito para mateus.sprnd@gmail.com):

```powershell
npm run remover -- email@exemplo.com --remote
```

Esperado: `removido (linha apagada)`. Responda dizendo que o backup do D1 expira em até 7 dias.

**Retenção de 12 meses (limpeza de antigos):** cadastros com mais de 12 meses são apagados (DELETE real) automaticamente a cada cadastro novo (no máximo uma vez por dia por isolate, em `functions/api/inscrever.js`). Pages Functions não têm cron; um cron em Worker separado pode ser acrescentado depois. Para rodar à mão e ver só a contagem apagada:

```powershell
npm run limpar-antigos -- --remote
```

**Migração 0003 (remove `novidades` e `removido_em`):** é aplicada no deploy, antes de publicar o código novo. Primeiro veja a lista de migrações pendentes; depois aplique:

```powershell
npx wrangler d1 migrations list DB --remote
```

```powershell
npx wrangler d1 migrations apply DB --remote
```

## Checklist final: pode publicar?

- [ ] Dono: widget Turnstile criado, site key e secret anotados
- [ ] Dono: 4 secrets criados (`secret list` mostra os 4); HASH_SALT guardado em local seguro
- [ ] Dono: aprovou cristal provisório, o texto da política (ver `POLITICA-PRIVACIDADE.md`, pontos a decidir) e a frase de "quando recebo o convite"
- [ ] Dono: branch de produção conferida no painel
- [ ] Squad: captura real de gameplay em `src/content/midia.json` (sem ela a seção de prova fica oculta)
- [ ] Squad: `npx vitest run` verde e build com a site key real sem erro
- [ ] Runbook do convite testado com uma conta nova, de ponta a ponta (Partes 4 e 7)
- [ ] Sessão operacional deu o aval
- [ ] BETA_CLOSED só depois da Parte 6, em horário combinado

## Rollback

**Voltar a versão anterior:** painel Cloudflare > Workers & Pages > `soulmon` > **Deployments**; no deployment bom anterior, menu de três pontos > **Rollback to this deployment**. Efeito em segundos. Para ver a lista pelo terminal:

```powershell
npx wrangler pages deployment list --project-name soulmon
```

**Tirar o site do ar:** a opção mais limpa é no painel apagar o deployment de produção (Deployments > três pontos > Delete) ou, em último caso, apagar o projeto (a URL some; o banco `soulmon-beta` não é afetado). Para só parar de coletar e-mails sem tirar o site: apague o secret `TURNSTILE_SECRET` (o cadastro passa a falhar) e republique ou aguarde. O banco nunca é afetado por rollback.

## Preview local (squad)

```powershell
npm run db:local
```

```powershell
$env:PUBLIC_TURNSTILE_SITEKEY = "1x00000000000000000000AA"; npm run preview
```

Fica em http://localhost:8799/beta/. `.dev.vars` local (fora do git): `TURNSTILE_SECRET=1x0000000000000000000000000000000AA`, `TURNSTILE_HOST=example.com`, `ORIGENS=http://localhost:8799`, `HASH_SALT` qualquer. Se o localhost mostrar o app em vez do site, é service worker antigo nessa porta: remova-o no navegador.


## Prévia já publicada (08/11/2026)

A pedido do dono, foi publicada uma prévia (ramo `previa`, noindex, build sem sitekey, formulário sem cadastro): https://previa.soulmon.pages.dev/beta/ (EN em /beta/en/). Para atualizar a prévia: `npx wrangler pages deploy dist --project-name soulmon --branch previa`. A produção (`--branch main`) continua vazia até as chaves reais.
