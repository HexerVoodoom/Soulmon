# Plano — modo cooperativo leve (Fase 4.3)

> **Status:** proposta. Nada implementado ainda.
> É o **último item aberto** da `docs/PLANO-EVOLUCAO.md` que não depende de arte
> (5.1) nem de decisão de balanceamento do dono (P1–P3, P5).

## 1. Por que existe, e o que a pesquisa exige

`PLANO-EVOLUCAO.md`, item 4.3: *"Cooperação tem evidência mais forte que
competição para adesão a hábito. Precisa de saída limpa do grupo, sem
penalidade."* E o item 4.2 registra o número que manda no desenho: em ambientes
só-de-leaderboard, **31,3% relataram efeito psicológico negativo de
comparação**.

Isso não é um detalhe de UX — é a restrição de projeto. Um grupo cooperativo que
mostra quanto cada membro contribuiu **reinventa o leaderboard dentro do
grupo**, e com um agravante: no ranking global o outro é um estranho; no grupo
ele é o amigo que a pessoa vai olhar na cara. A vergonha fica pior, não melhor.

**A regra que sai daí, e que vale mais que qualquer feature desta página:**

> O grupo mostra o **progresso COLETIVO** e o **fato de cada membro ter
> aparecido hoje** (sim/não). Nunca quanto cada um fez.

Aparecer é binário e não ordena ninguém. "12 de 30" é do grupo. "Ana fez 9, você
fez 1" não existe.

## 2. O que já está pronto e deve ser reusado

`functions/api/community.js` já resolveu, com teste, tudo que costuma dar errado
numa camada social:

- **`pid` público ≠ `saveId`.** O saveId é o SHA-256 do e-mail; devolvê-lo seria
  um oráculo de e-mail. O índice `pid:<pid>` já faz a indireção, e **há teste
  travando que nenhuma resposta pública devolva saveId**.
- **`authorizeSaveAccess`** (`_auth.js`) — token do Firebase verificado na borda.
- **`_rateLimit.js`** com duas classes de custo (varredura de KV × leitura
  única), já calibradas.
- **Amigos (teto 5), presentes, e o gate por nível de Vínculo** (`_bond.js`,
  `BOND_PVP_MIN_LEVEL`).

O modo cooperativo **não precisa de banco novo, de endpoint novo de identidade,
nem de segunda noção de amizade**. É um prefixo a mais no mesmo KV.

## 3. Desenho

### 3.1 O objeto

```
coop:<groupId>   → { id, name, createdAt, ownerSave, members[saveId] (2–4),
                     goal: { kind: 'checkins', target, weekKey },
                     progress: { <saveId>: <dias em que apareceu na semana> } }
coopOf:<saveId>  → groupId   (um grupo por pessoa, de propósito — ver 3.4)
```

`weekKey` = ISO `YYYY-Www`. O objeto **rola sozinho** na virada da semana: quem
lê numa semana nova vê `progress` zerado, sem job agendado. É o mesmo padrão da
season (`rank:<season>:<saveId>`), que já provou que não precisa de cron.

### 3.2 A meta

`target = 5 × membros` check-ins na semana — um check-in é "a pessoa cumpriu a
**própria** meta do dia" (`dailyGoalFor`, o dono da regra). Não é "fez N
tarefas": cada um tem a sua meta, e é assim que um grupo com um ultra e um
rookie não vira injustiça.

5 e não 7 **de propósito**: a Fase 1 inteira existe para o app não cobrar dia
perfeito. Um grupo que exige 7/7 desfaz o perdão de ausência (1.2) por pressão
social, que é o jeito mais eficaz de desfazê-lo.

### 3.3 O que a tela mostra

| Mostra | Não mostra |
|---|---|
| `18 / 20 esta semana` (a barra do grupo) | quanto cada um contribuiu |
| avatar + "apareceu hoje ✓" por membro | ranking, ordenação, medalha |
| "faltam 2" | "faltando por sua causa" |

Sem notificação de cobrança. O grupo **nunca** manda push dizendo que alguém não
apareceu — isso é o cobrador da essência declarada, entregue por terceiro.

### 3.4 A saída limpa, que o plano exige por escrito

- Sair é **um toque, sem confirmação de ninguém e sem penalidade**: nenhum item,
  nenhum XP, nenhuma streak se perde. O `progress` da pessoa some do grupo e a
  meta do grupo **encolhe junto** (`target` é derivado de `members.length`, não
  gravado) — senão sair vira sabotagem e o grupo pressiona para ficar.
- Um grupo por pessoa. Não por limitação técnica: **pertencer a três grupos é
  três cobranças**, e a auditoria de carga diária (4.5) existe justamente para
  o app não virar segundo emprego.
- Grupo que fica sem membros é apagado na primeira leitura. Grupo sem check-in
  por 4 semanas idem — sem tombstone, sem "seu grupo morreu".

## 4. Segurança e privacidade — o que precisa ser travado por teste

1. Nenhuma resposta de `coop` devolve `saveId` (o teste que já existe para
   `community` precisa cobrir as rotas novas).
2. Entrar num grupo exige **convite por código** de uso único, não busca no
   diretório: grupo público é raide de estranho, e o directory já respeita
   consentimento (N-4 do `STATUS.md`) — não vale furar isso por uma porta nova.
3. O nome do grupo é **texto do jogador** → passa pelo mesmo tratamento do chat
   (N-8: texto do jogador sai da lista de regras e vira dado delimitado) e pelo
   `_redact.js`.
4. Escrever `progress` é sempre sobre **si mesmo**, autorizado por token. Um
   membro não escreve o progresso do outro nem lê o e-mail de ninguém.
5. Rate limit: `coop` de leitura é LIGHT; criar/entrar é HEAVY (varre índice).

## 5. O que eu preciso de você (dono)

1. **A meta é `5 × membros` check-ins por semana?** É o único número inventado
   aqui. As alternativas honestas são 4 (mais perdão) ou "metade dos dias".
2. **Recompensa:** o grupo que bate a meta ganha o quê? Minha recomendação é
   **Bits para os dois lados e nada exclusivo** — item exclusivo de grupo obriga
   quem joga sozinho a arranjar gente, e o app é para uma pessoa. Precisa da sua
   palavra porque mexe em economia.
3. **Vale gate de Vínculo?** O PvP exige nível 5 (`BOND_PVP_MIN_LEVEL`). O
   cooperativo não tem o mesmo risco do PvP, mas exigir algum nível evita conta
   descartável usada para spam de convite.

## 6. Ordem de execução, quando aprovado

1. `functions/api/coop.js` + testes (o motor e as travas da seção 4).
2. Paridade da meta com `dailyGoalFor` — o servidor **não** pode ter uma segunda
   fórmula de meta do dia (footgun 9). Vale o mesmo padrão do
   `bond.parity.test.js`.
3. UI: painel no lugar onde hoje mora a Biblioteca, com os dois estados que
   costumam ser esquecidos — **sem grupo** e **grupo com 1 membro só**.
4. PT **e** EN (guard `i18nSemPtSozinho.contract.test.ts`).
