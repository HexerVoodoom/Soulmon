# Publicar o site do beta

**Só publicar com aval da sessão operacional.** Comandos rodam em `site-beta/`.

## Antes de publicar (bloqueios)

- [ ] Captura real de gameplay em `src/content/midia.json` (§17 do plano). Sem ela a seção de prova fica oculta.
- [ ] Comparar `BETA_EMAILS` com os testadores atuais, avisar a operacional, ligar `BETA_CLOSED` e testar 403 com conta fora da lista. Quem joga hoje é afetado.
- [ ] Aprovação do dono: cristal provisório, política de privacidade, frase de "quando recebo o convite".
- [ ] Runbook do convite testado com uma conta nova, de ponta a ponta.

## Primeira publicação

1. **Turnstile (dono, painel Cloudflare):** criar widget com hostname `soulmon.pages.dev` e anotar site key e secret.
2. **Banco:**
   ```bash
   npx wrangler d1 create soulmon-beta
   ```
   Copie o `database_id` para `wrangler.jsonc`.
   ```bash
   npx wrangler d1 migrations apply DB --remote
   ```
3. **Projeto:** já criado, vazio, em 06/11 (`soulmon`, URL final https://soulmon.pages.dev/beta, EN em /beta/en/); só repetir se for recriar.
   ```bash
   npx wrangler pages project create soulmon --production-branch site-beta
   ```
   Se o nome estiver ocupado, ajuste `ORIGENS`, `TURNSTILE_HOST` e o widget.
4. **Secrets:** cada comando pede o valor.
   ```bash
   npx wrangler pages secret put TURNSTILE_SECRET --project-name soulmon
   ```
   ```bash
   npx wrangler pages secret put RESEND_API_KEY --project-name soulmon
   ```
   ```bash
   npx wrangler pages secret put HASH_SALT --project-name soulmon
   ```
   ```bash
   npx wrangler pages secret put NOTIFICAR_PARA --project-name soulmon
   ```
   `HASH_SALT`: valor aleatório longo; guarde em local seguro, porque os scripts `remover` e `proxima-leva` precisam dele. `NOTIFICAR_PARA`: `soulmon.revisor@gmail.com`. `RESEND_API_KEY`: o valor do app não é legível; cole a mesma chave ou gere outra na Resend.
5. **Build e envio:** troque `<site key>`.
   ```bash
   PUBLIC_TURNSTILE_SITEKEY=<site key> npm run build
   ```
   ```bash
   npx wrangler pages deploy dist --project-name soulmon --branch site-beta
   ```
6. **Conferir:** cadastro real com e-mail do dono, chegada da notificação, `exportar --remote`, `remover --remote`.
7. **Analytics:** ativar Web Analytics no projeto, pelo painel.

## Operação

- **Fila e convites:** `HASH_SALT=... npm run proxima-leva -- 30 --remote`. Depois de enviar, repetir com `--marcar`. Até 30 por dia, por causa do teto de sprites.
- **Marcar:** `proxima-leva --optin <email>` e `--ativo <email>`.
- **Exportar:** `npm run exportar -- --remote` grava em `E:/Soulmon-marketing/inscritos/`. Apague o CSV depois de usar.
- **Remover:** `HASH_SALT=... npm run remover -- <email> --remote`, só a pedido do próprio endereço.
- **Lista de espera:** depois de revisar a lista, troque `LEVA_ESTADO` para `espera` em `wrangler.jsonc` e publique.

## Preview local

```bash
npm run db:local
```
```bash
PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA npm run preview
```
O preview local fica em http://localhost:8799/beta/ (a raiz redireciona; a API segue em /api/* na raiz). `.dev.vars` local (fora do git): `TURNSTILE_SECRET=1x0000000000000000000000000000000AA`, `TURNSTILE_HOST=example.com`, `ORIGENS=http://localhost:8799`, `HASH_SALT` qualquer.
Se o localhost mostrar o app em vez do site, é service worker antigo nessa porta: remova-o no navegador.
