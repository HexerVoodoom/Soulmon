# Régua permanente C1–C8 do Oráculo — desenho (Fase 0)

Não executado. Só desenho, conforme pedido. Base: `docs/PLANO-ORACULO.md`,
`criacaoDistribuicao.test.ts` (régua atual C1/C2/C4 parcial), `_diag.test.ts`
(protótipo de auditoria com JSON), `pipeline.ts`, `select.ts`, `buildSheet.ts`,
`classTitle.ts`, `oracle.ts`.

## 1. Onde a régua vive — os DOIS, com papéis diferentes

**Não é "teste marcado lento OU script" — é OS DOIS, cada um com um trabalho:**

- **`src/utils/soulProfile/criacaoDistribuicao.test.ts`** (já existe) continua
  sendo o **gate bloqueante da suíte normal**, mas fica PEQUENO (N atual = 240,
  ~seg) e só cobre o que já cobre hoje: elemento, caminho, família visual,
  companheiro, espécie, linhagem, unicidade de tupla-3, fidelidade (já tem uma
  versão simplificada no teste "é resultado dos dados do usuário"). Continua
  rodando em todo `npx vitest run`, é o que trava PR.
- **`scripts/oraculo-auditoria.mjs`** (novo, promovido do `_diag.test.ts`) é
  script `npm run oraculo:auditoria`, **fora do `vitest run`** (não entra em
  `include` do `vitest.config.ts`), N grande (800–3200), grava
  `docs/reviews/AAAA-MM-DD-oraculo-c1-c8.json` + um `.md` legível (tabela como
  a do plano). Cobre os 8 critérios completos, inclusive C1 (cobertura de
  TODOS os itens: 79 classes, 194 criaturas etc. — só viável com N grande) e
  C3/C5/C7/C8 que pedem população maior para não dar falso-positivo por
  amostra pequena.
- Por quê os dois: o teste pequeno já pegou regressão grosseira (razão >1,5×)
  sem custar minutos no CI; o script grande é o que fecha o Fase-0 (dono lê
  o `.md`, decide, arquiva o `.json` como evidência — o mesmo hábito de anexar
  saída real que o `sweeper` cobra). Rodar o script é manual/CI noturno, nunca
  bloqueante de commit.

## 2. Como não deixar a suíte lenta

- **Nunca subir N do teste bloqueante para caçar C1 completo.** C1 (79
  classes, 194 criaturas, 72 famílias — "≥1 em N=3200") estruturalmente exige
  N grande; forçar isso no teste de todo commit é o erro a evitar. C1 vive
  só no script.
- Teste bloqueante fica em **cobertura por RAZÃO** (topo/piso, dispersão),
  que converge rápido com N pequeno — é o que já está feito.
- `testTimeout` do `vitest.config.ts` é 15s de piso de robustez, não válvula
  para teste lento — não usar para acomodar N grande (o próprio arquivo diz
  isso). Script de auditoria roda fora do vitest, sem esse teto.
- Se quiser um sinal de C1 no CI sem pagar N=3200 a cada commit: rodar o
  script de auditoria só no cron noturno ou manualmente antes de mexer em
  `oracle.ts`/`bestiary`/`buildSheet.ts` — não em todo push.

## 3. Seeds — calibração × validação

- Manter a separação que já existe: **seed de calibração `20260928`** (a que
  foi usada pra ajustar `RITUAL_ELEMENT_SCALE` etc. — cai em `_diag.test.ts`)
  nunca é a seed que fecha um critério. **Seed de validação `19870412`**
  (já usada em `criacaoDistribuicao.test.ts`, comentário linha 37 explica o
  motivo) é a que decide. Regra explícita a formalizar: **toda seed usada
  para CALIBRAR um peso fica proibida de aparecer como seed de VALIDAÇÃO** —
  mesma lógica do comentário já no arquivo ("senão a régua mediria o próprio
  ajuste").
- Para o script grande: rodar com **≥2 seeds de validação** distintas da(s)
  de calibração (o `_diag.test.ts` já roda 2: `20260928` e `19870412` — mas
  a primeira é a de calibração, então isso está ERRADO no protótipo atual e
  precisa trocar por uma segunda seed nunca usada em ajuste, ex. `20260101`
  ou `31415926`). Divergência grande entre as duas seeds de validação é sinal
  de resultado instável, não só de viés.

## 4. Bloqueante × só-relatório

| Critério | No teste pequeno (bloqueante) | No script grande (relatório) |
|---|---|---|
| C1 cobertura | não (N insuficiente) | sim — lista o que nunca saiu, decide aceito-por-design vs buraco |
| C2 sem vencedor (4 eixos) | sim, por razão topo/piso | reconfirma com N maior |
| C3 escola dominante | não hoje — falta o teste; propor criar em `ficha/classeOcorrencia.test.ts` (citado no cabeçalho do arquivo mas não lido aqui — CONFERIR se existe) | sim |
| C4 grupos/famílias | sim (já existe) | reconfirma |
| C5 fidelidade direcional | parcial (o teste "muda a criatura" já mede troca, não OPOSIÇÃO de eixo) — ver §5 | sim, versão completa |
| C6 caminho×elemento | sim (já existe, arquivo separado `alinhamentoElemento.test.ts`) | reconfirma |
| C7 linhagem | sim (já existe) | reconfirma |
| C8 unicidade+colisão nome | unicidade sim (tupla); colisão de nome NÃO existe ainda | sim, versão completa — ver §6 |

Regra geral: **bloqueante = pode ficar vermelho e travar PR; script = nunca
trava PR, só gera número para o dono decidir.** Nenhum dos 8 fica só no
script para sempre — o objetivo da Fase 0 é que cada um tenha pelo menos uma
versão bloqueante, mesmo que aproximada, e a versão completa no script.

## 5. Como medir C5 — fidelidade direcional (ainda não existe)

Hoje o teste "é resultado dos dados do usuário" (linha 144–159 do arquivo
atual) só mede se TROCAR uma resposta muda a tupla visível (≥90% mudam) —
isso é sensibilidade, não DIREÇÃO. C5 pede o oposto: resposta OPOSTA →
eixo OPOSTO, ou pelo menos deslocado, não qualquer mudança aleatória.

Desenho proposto:
- Para cada pergunta do ritual (`ORACLE_QUESTIONS`), cada opção tem um polo
  (ex.: se as perguntas mapeiam para eixos elemento/alinhamento por peso —
  conferir em `oracle.ts` a estrutura de score por opção). Gerar par
  (resposta A, resposta oposta-no-mesmo-eixo B) e medir se
  `dominantElement`/`dominantAlignment` mudam NA DIREÇÃO esperada (não
  qualquer mudança — a comparação tem que ser contra o eixo que a pergunta
  empurra, não contra a tupla visível inteira, que mistura ruído de nome
  aleatório/bestiário).
- Métrica: para cada pergunta com polos claramente opostos, % de pares em
  que o eixo-alvo muda na direção certa. Alvo do plano: ≥80%.
- Cuidado: **nem toda pergunta tem "opostos" declarados** — algumas podem
  ter 3+ opções sem eixo linear (checar `ORACLE_QUESTIONS` antes de assumir
  bipolaridade). Onde não houver oposto claro, excluir da métrica de C5 em
  vez de forçar um par arbitrário — isso é um edge case do desenho em si,
  não da população sintética.
- Roda **só no script grande** (custa 1 pipeline extra por par, por pergunta,
  por pessoa) — não cabe no teste bloqueante de 15s.

## 6. Como medir C8 — colisão de nome (não existe ainda)

- Nome do personagem = string gerada em algum ponto de `oracle.ts`/`buildSheet.ts`
  (prefixo de linha + o que hoje virou nome sem sufixo "-mon" fixo — ver regra
  do CLAUDE.md sobre nomes). Precisa achar a função exata (`rookieName` etc.,
  citada no CLAUDE.md) antes de escrever o teste real.
- Régua: rodar N grande, contar nomes EXATOS repetidos entre pessoas
  DIFERENTES (nome determinístico por `nomeSintetico(rng)` + seed, então tem
  que garantir que a comparação é sobre o NOME GERADO DA CRIATURA, não o nome
  sintético da pessoa — são coisas diferentes, conferir em `pipeline.ts`/
  `buildSheet.ts` qual campo é o nome que aparece no reveal).
- Alvo do plano: ≤2% de colisão. Só faz sentido medir no script grande — com
  N pequeno, colisão zero não prova nada (espaço amostral pequeno demais para
  detectar colisão rara).
- Edge case a decidir: nome de personagem PREMADE (`PREMADE_CHARACTERS`,
  6 hoje) não deveria contar como colisão contra os sintéticos — excluir do
  denominador/numerador explicitamente, senão C8 mede colisão contra um pool
  que nem é gerado pelo mesmo mecanismo.

## 7. Remedir "papel" (eixo que falta, C2)

- O plano já marca "papel: não remedido" — hoje só elemento/caminho/reino têm
  número atual. Mesma metodologia dos outros 3: no script grande, contar
  distribuição de `dominantRole`/eixo-papel (achar o campo exato — não lido
  neste desenho; procurar ao lado de `dominantRealm`/`dominantElement`/
  `dominantAlignment` em `pipeline.ts`/`select.ts`) com razão topo/piso ≤1,5×,
  seed de validação, N igual aos outros eixos para comparabilidade.
- Adicionar ao teste bloqueante do C2 assim que existir número — hoje ele só
  testa 3 eixos (`ELEMENT_ORDER`, `ALIGNMENT_ORDER`, implicitamente reino via
  família?) — CONFERIR se reino já está no bloqueante ou só no script (o
  arquivo lido não mostrou teste de `dominantRealm` isolado — pode estar
  faltando também, não só papel).

## 8. Edge cases da população sintética — cada um, e se entra na régua

| Edge case | Hoje na régua? | Entra? |
|---|---|---|
| Sem hora de nascimento (`timeUnknown: true`) | Não — `nascimentoSintetico`/pessoas() sempre passam `timeUnknown: false` | **Sim, deveria entrar.** É caminho real do produto (ascendente incerto muda o mapa astral). Adicionar uma fatia da população sintética (ex. 20%) com `timeUnknown: true` e medir se C1–C4 ainda seguram — sem hora pode colapsar elemento/reino num sub-conjunto menor de resultados possíveis, e isso só aparece testando o ramo. |
| Só as 6 perguntas, sem o teste longo (`soulProfile` ausente/`answers` sem os 20 itens) | Não — todo perfil sintético passa por `buildSoulProfile` com dados completos | **Sim, crítico.** O CLAUDE.md é explícito: "para quem não faz o teste longo, as 6 respostas são o único sinal" — e `OracleInput.soulProfile` é OPCIONAL, caminho legado inteiro depende disso. Sem cobrir esse ramo a régua nunca testou o caminho que o CLAUDE.md chama de mais frágil (quem tem MENOS sinal é onde colisão/falta de unicidade é mais provável). Precisa de uma fatia da população rodando SEM soulProfile — ou com soulProfile mínimo/legado — e medir C1/C2/C8 separadamente para esse grupo. |
| Reroll | Não visto no código lido | Entra como edge de ESTADO, não de input: reroll consome Créditos e troca resultado — testar que reroll muda a tupla (parecido com C5, mas sem restrição de eixo) e que **não** reintroduz um resultado idêntico ao anterior com frequência alta (senão "reroll" é decorativo, 50 Bits/Créditos gastos à toa). Não é bloqueio de Fase 0, mas listar como item explícito pendente. |
| Rebirth | Não visto | Entra: rebirth multiplica orçamento por 1.5 e reabre escolha de criatura/escola/elemento — a régua de C1–C8 pode não valer para o ramo pós-rebirth (base multiplicada é estruturalmente diferente). Decisão a levar ao dono: rebirth é população SEPARADA na régua (métrica própria) ou fica fora do escopo da Fase 0 porque ainda não tem volume de uso (feature nova, paga, uma vez só por conta). Recomendo: fora do escopo do C1–C8 por ora, mas documentado como "não coberto" — não fingir que está coberto. |
| Nome sem letra latina (unicode, CJK, acentos raros, emoji) | Não — `nomeSintetico` provavelmente só gera nomes latinos sintéticos (não lido o corpo da função) | **Sim, entrada ruim clássica do eixo QA.** Precisa checar: (1) pipeline não quebra/lança exceção com nome não-latino; (2) o campo que vira PROMPT de imagem (`imagePrompt`) sanitiza/aspas corretamente — CLAUDE.md já menciona "campo aberto, higienizado e entre aspas no prompt... delimitar é o que impede injeção" para rebirth, mesma preocupação vale para nome de usuário no fluxo normal; (3) nome vazio, nome gigante (limite de caracteres), nome só com espaços — não vistos no teste atual. Isto é responsabilidade do sweeper, não do C1–C8 de distribuição — mas merece um teste de robustez separado (`oracle.robustez.test.ts` ou similar), citado aqui para não ser esquecido. |

## 9. Armadilhas já conhecidas no repo (aplicam à régua)

- **Vitest engole `console.log`.** O script de auditoria tem que **gravar
  JSON em arquivo** (como já faz `_diag.test.ts`, `writeFileSync` para
  `E:/tmp/.../diag.json`) — nunca depender de log lido do output do vitest.
  Para o script permanente, gravar em `docs/reviews/` (git-tracked) em vez
  de scratchpad, já que é artefato de decisão do Fase-0, não descartável.
- **CRLF.** Repo Windows — ao criar `scripts/oraculo-auditoria.mjs`, checar
  final de linha consistente com o resto do repo (`.gitattributes` se
  existir) para não gerar diff gigante de CRLF↔LF no PR.
- **Hook mascara suíte quebrada** (`soulmon-hook-mascara-suite-quebrada`,
  achado já registrado): "Tests N passed" não prova que a suíte rodou —
  checar sempre "Test Files" na saída real do `npx vitest run`, e arquivo
  `.mjs` importado por teste precisa de shebang/extensão correta ou é
  silenciosamente pulado. Ao promover `_diag.test.ts` para script fora do
  vitest, isso deixa de ser risco PARA ELE (não é mais arquivo de teste) —
  mas o teste bloqueante pequeno que description continua dentro do vitest
  segue exposto: ao rodar `npx vitest run` para fechar a Fase 0, colar a
  saída real com a contagem de "Test Files", não só "Tests passed".
- **`class-system` importado dinamicamente** (`await import('class-system')`
  no `_diag.test.ts`) — se esse pacote for workspace/link local, confirmar
  que o script novo fora do vitest ainda resolve o import (node puro, sem
  helpers do vitest/vite) — pode precisar rodar via `tsx`/`ts-node` ou já
  compilado, não simplícito no protótipo atual.

## 10. Resumo do que falta para a Fase 0 fechar

1. Promover `_diag.test.ts` → `scripts/oraculo-auditoria.mjs` (fora do
   `vitest.config.ts` include), gravando `.json`+`.md` em `docs/reviews/`.
2. Escrever C3 (escola dominante) e C8 (colisão de nome) como testes reais —
   hoje não existem.
3. Escrever C5 (fidelidade direcional por eixo, não por tupla) — hoje o que
   existe mede sensibilidade, não direção.
4. Remedir "papel" nos dois níveis (bloqueante + script).
5. Corrigir a seed de calibração vazando como seed de validação no protótipo
   (`20260928` aparece nos dois papéis no `_diag.test.ts`).
6. Cobrir os 3 edge cases prioritários da população sintética: sem hora de
   nascimento, sem teste longo (soulProfile ausente), nome não-latino/vazio.
7. Decidir com o dono: reroll e rebirth entram no escopo do C1–C8 da Fase 0
   ou ficam documentados como não cobertos por ora.
