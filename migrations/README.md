# migrations/ — o schema do D1, versionado

Até 26/08/2026 o único schema do banco D1 deste projeto vivia como um bloco de
SQL solto dentro de `docs/BILLING-SETUP.md`, para ser colado à mão. Nada no
repositório dizia qual era a forma real da tabela em produção, e uma mudança de
coluna não tinha onde ser registrada. Este diretório existe para fechar isso.

Regras:

- **Ordem numérica, uma vez cada.** `0001`, `0002`, … Aplicar fora de ordem
  quebra, porque cada arquivo assume o estado deixado pelo anterior.
- **Migração aplicada não se edita.** Se o resultado estiver errado, escreve-se
  a próxima. Editar uma que já rodou faz o arquivo mentir sobre o banco.
- **Toda migração declara o que acontece com as linhas existentes**, no
  cabeçalho do próprio arquivo. Um banco vazio não é o caso interessante.

Aplicar (o binding é `DB`, ver `docs/BILLING-SETUP.md`):

```
npx wrangler d1 execute <nome-do-banco> --remote --file migrations/0001_order_claims.sql
npx wrangler d1 execute <nome-do-banco> --remote --file migrations/0002_order_claims_expires_at.sql
```

O `0001` é `IF NOT EXISTS`: num banco que já rodou o SQL da doc antiga, ele é
no-op. O `0002` falha alto se já tiver rodado (SQLite não tem `ADD COLUMN IF NOT
EXISTS`), e falhar alto é o comportamento desejado.
