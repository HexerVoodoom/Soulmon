# Propostas de narrativa — **depende do dono**

> **Dono:** `soulmon-loremaster` · **Data:** 21/09/2026 · **Estado:** vivo
> **Não cobre:** regra de jogo. **Nada aqui está implementado.**
> **Precedência:** código > teste > `CLAUDE.md` > manual > a bíblia > este doc.
> **A bíblia é `docs/NARRATIVA-E-UNIVERSO.md`**; este arquivo é a §14 dela,
> extraída em 21/09/2026 porque 180 linhas de proposta ficavam entre a lore e o
> checklist que todo redator precisa alcançar — e proposta é justamente o
> material que **não** decide nada.

## As propostas

Nenhuma destas altera regra de jogo. P1–P7 e P9–P16 são de TEXTO, rótulo ou
guard; **P8 é decisão de marca e precede as outras**. Todas passam pelo
`soulmon-guarda-linha-vermelha` e pelo `soulmon-ip-brand-guardian`.

**P1 — Nome de jogador para os três galhos (Ruptura / Trama / Guarda).**
*O que é:* trocar o rótulo visível de `virus`/`data`/`vaccine` pelos nomes de
§6.6. *Sistema tocado:* rótulos em `EvolutionPath.tsx`, `BranchForecast`,
`GuideModal`, `HelpModal`, `PetPage` e nomes de forma em `oracle.ts` (os ids
`champion-virus` etc. continuam intactos). *Risco:* o id fica, então o rótulo
novo cria um segundo vocabulário para a mesma coisa — se alguém escrever "vírus"
num texto futuro, os dois convivem e confundem; exige varredura e, idealmente,
um teste que reprove as três palavras em texto de jogador. Linha vermelha #20
respeitada (nada renomeado no save). *A decidir:* se troca, e se o guarda aceita
um teste de vocabulário sobre `.tsx`.

**P2 — Uma frase no retorno após ausência.** *(redação revista pelo parecer de
psicologia de 21/09/2026 — a primeira versão, "Ele está na janela", foi
REPROVADA)*
*O que é:* uma frase de acolhimento no primeiro dia de volta, na voz do mundo:
PT *"Você abriu. Ele está aqui."* / EN *"You opened it. He's here."*
(alternativa mais fria e igualmente boa: *"A Malha seguiu. Ele também."*).
*Por que "na janela" caiu:* é a imagem cultural da espera fiel — o cão, a mãe, o
amante. É chantagem afetiva mesmo sem contar dias: a culpa vem da cena, não do
número. L6 proibiu a contabilidade e deixou passar a iconografia.
*Por que não fica 100% mudo:* quem sumiu não volta porque **imagina** o que vai
encontrar (*abstinence violation effect*); perdão silencioso não desarma a
expectativa — a pessoa abre tensa, não encontra cobrança e não fica sabendo que
não encontrou. É o mesmo argumento que fez `restDayUsed` virar linha no
relatório, e esse precedente já está no `CLAUDE.md`.
*Fundamentação de mundo (nova, §5.10):* a criatura **não poderia** ter frase
diferente para 2 e para 40 dias, porque não tem leitura que distinga os dois. O
critério (c) abaixo deixou de ser uma restrição editorial e virou anatomia.
*Critérios de aceite da frase, se o dono aprovar:* (a) não menciona tempo,
ausência, espera, volta, saudade ou falta; (b) não atribui à criatura emoção
causada pela pessoa (L11); (c) é **idêntica** no 2º e no 40º dia — texto que
muda com a duração virou contador; (d) **não vem acompanhada de recompensa** —
o incentivo a sumir mora no prêmio de retorno, não na frase; (e) **não existe
frase diferente para quem NÃO sumiu** — se a presença é detectável pelo texto,
a ausência virou contador por outro meio.
*A decidir:* se entra.

**P3 — Nomear as cinco camadas das fendas.**
*O que é:* nome de era para cada camada, da mais recente à mais antiga. **A
proposta concreta está escrita na §7.3** — a Borda · o Enquadre · a Insônia ⚠️ ·
o Primeiro Chão · o Cobre Frio (EN: the Edge · the Frame · the Sleepless · the
First Ground · the Cold Copper) —, com cada camada correspondendo a uma era da
§8, de modo que descer é atravessar a linha do tempo ao contrário.
*Sistema:* `src/utils/dungeonScenes.ts` (só rótulo; `buildRunScenes` e
`DUNGEON_SCENES` continuam sorteando o cenário exatamente como hoje).
*Risco:* baixo em PI, mas aumenta superfície a revisar; e nome de camada
adjacente a dificuldade crescente pode ler como "quanto mais fundo, pior" —
a regra de escrita da §7.3 (fundo é velho, não maligno) existe para isso.
*⚠️ Nada em `src/` muda enquanto esta proposta estiver aberta; nenhuma string
pode nascer com estes nomes.* *A decidir:* se vale antes de a distribuição
existir, e os rótulos.

**P4 — Linha de mundo no reveal.**
*O que é:* uma frase de cosmogonia antes do nome da criatura, uma vez só.
*Sistema:* `SoulmonOnboarding`. *Risco:* alonga a tela mais frágil do funil; e
uma frase sobre "a parte de você que não coube" beira L1 se mal escrita.
*A decidir:* se entra, tem de ser **uma** frase, sobre a MALHA e nunca sobre a
pessoa.

**P5 — Trocar `Glitchtama`.** ⚠️
*O que é:* o nome carrega "-tama", eco sonoro direto de um brinquedo de outra
marca, e é visível ao jogador. *Sistema:* `SPECIAL_ITEMS`, drop da fenda.
*Risco:* IP. Substituto próprio a definir com o guardião (candidato: **Nó de
Dia** / EN **Day-knot**). *A decidir:* se troca — é rótulo, não chave.

**P6 — Nota de fundamentação junguiana pública.**
*O que é:* um parágrafo em doc aberto explicando a base conceitual. *Risco:*
quebra o registro diegético se vazar para texto de jogador, e psicologia citada
em produto vira promessa (L8). *A decidir:* recomendação é ficar interno.

**P7 — "Contraparte" como termo de UI.**
*O que é:* hoje é só termo de bíblia. *Risco:* palavra abstrata numa UI de
frases curtas; todo termo novo precisa de par EN e entrada no `HelpModal`.
*A decidir:* provável não — o app diz "seu Soulmon".

---

**P14 — A frase de normalização do resumo de humor.**
*O que é:* `moodSummary` (`src/utils/mood.ts`, no `DailyReportModal`) devolve
hoje *"Seus últimos dias têm sido de altos e baixos — e tudo bem que seja
assim"*. A segunda metade é normalização, que a L9 proíbe nas duas direções: o
produto não diz que é doença **nem** que não é nada. A primeira metade e a
existência da devolutiva ficam — a regra do próprio módulo, de que coletar sem
devolver é extração, é anterior e é boa. *Sistema:* uma string em `mood.ts`.
*A decidir:* a redação substituta, que descreve sem avaliar.

**P8 — ⚠️ A MARCA `Soulmon`.** *(achado do parecer de PI de 21/09/2026 —
precede todas as outras propostas)*
*O que é:* **`Soulmon` é o nome canônico de uma criatura da Bandai** — Champion,
tipo Fantasma, **atributo Virus** —, listada na enciclopédia oficial
(`digimon.net/reference_en/detail.php?directory_name=soulmon`), verificada na
fonte em 21/09/2026. Não é eco de sufixo: é o nome exato, e ele aparece dentro
do gênero de produto onde a confusão é máxima — v-pet de criatura que evolui por
atributo vírus/dado/vacina numa escada rookie→champion→ultimate→mega.
*Sistema tocado:* tudo — nome do app, `package.json`, manifest, ficha de loja,
domínio, e esta bíblia inteira, que é escrita em cima do nome.
*Risco:* Play e App Store aceitam reclamação de PI sem exigir registro
específico do termo; remoção costuma ser sem aviso, e strike de PI marca a conta
de desenvolvedor. A revisão humana da Apple (5.2.1 / 4.1) é o ponto provável de
reprovação.
*A decidir (só o dono):* busca de anterioridade formal (INPI + USPTO + uso) e se
o produto troca de nome **antes** de submissão a loja. Esta bíblia não depende
do nome: o mundo se chama **a Malha**, que é peça própria e livre.

**P9 — Três nomes de linha de criatura com colisão de PI.**
*O que é:* `Serah` (Serah Farron, Final Fantasy XIII) e `Pyraka` (Piraka,
Bionicle/LEGO) são **risco alto** e trocam; `Igni` (sinal de The Witcher, mas
latim comum) é risco baixo e fica a critério. Candidatos: **Sereh/Selah/Serai**
· **Pyrala/Pyrakai** · **Ignen/Ignara**. *Sistema:* `DUNGEON_LINE_NAMES`
(`src/utils/sprites.ts`) é dono único, e `sprites.dungeonRoster.test.ts` já
reprova string duplicada — o **id** da linha não muda (é ele que resolve sprite,
save e nome de arquivo de arte), como já foi o caso em 08/09/2026 com
Pyrakamon → Pyraka. *A decidir:* os nomes.

**P10 — `Zeed` em `MEGA_STAGE_PREFIXES` (`src/utils/oracle.ts`).**
*O que é:* diferente de `War`/`Chaos`/`Omega`/`Arch`/`Seraph`/`Meta`/`Holy`, que
são palavras comuns, `Zeed` não é palavra de idioma nenhum — é grafia inventada
por outra franquia. A regra do `CLAUDE.md` que permite os prefixos genéricos não
o cobre. Candidatos: **Zaed**, **Zenor**. *A decidir:* se troca.

**P11 — A escada de rótulos `rookie → champion → ultimate → mega`.**
*O que é:* cada palavra é genérica, mas a **sequência ordenada exata** é a
localização inglesa da escada de outra franquia. Os **ids ficam** (#20); o que
mudaria é o rótulo visível. Candidata, coerente com a §3/§5 desta bíblia:
**Encosto → Assentado → Ancorado → Profundo → Vasto**. ⚠️ O topo **"Inteiro"
foi REPROVADO** pelo guarda de linhas vermelhas (21/09/2026): insinua que quem
não chegou lá está incompleto, e faz a queda de forma por sustentação zero ler
como "deixou de ser inteiro" — exatamente o dano que fez "dia perfeito" virar
"dia completo". Alternativa a *Vasto*: *Aberto*. *Risco:* é o rótulo
mais espalhado do app (guia, glossário, evolução, página do Pet) e mexe em texto
que o jogador já conhece. **Nota nova (§5.8):** a candidata acima casa com a
anatomia por forma — *Ancorado* é o degrau em que o elemento vira matéria e
*Profundo* é o primeiro em que há massa assentada nova. *A decidir:* v1.1,
depois do nome (P8).

**P12 — `fendas` → `dobras` / `folds`.**
*O que é:* "rift" é comum, mas está saturado como nome próprio de gênero. A
própria §7 define fendas como "dobras da Malha" — o termo melhor já está no
texto. *Risco:* nenhum de PI; é ganho de identidade. *A decidir:* se vale.

**P13 — Teste de vocabulário executável.** *(EXISTE desde 21/09/2026 —
`src/narrativa.contract.test.ts`)*
*O que é:* a coluna "proibido" da §12 virou guard: varre `src/**/*.ts(x)` e
reprova `Weave`, `Vírus|Vacina|Virus|Vaccine`, `Glitchtama`,
`domador|treinador|tamer`, `digievolu*` e `mundo digital` em fonte, com uma
tabela `DÍVIDA` declarando arquivo por arquivo o que já está no app e sob qual
proposta (P1, P5). A régua também exige que **todo caminho `src/…` citado nesta
bíblia exista** e que as doze leis estejam declaradas.
*O que falta:* a DÍVIDA encolher até `[]`, o que é o aceite de P1 e P5. ⚠️ O
parecer de PI mediu **7 famílias** de superfície visível, e a pior não está na
UI: o texto do **Ultra** em `oracle.ts` interpola as três palavras na tela de
revelação. Trocar rótulo e esquecer o gerador deixa a citação mais exposta no ar.
*A decidir:* nada — a régua está no ar; o que resta é P1 e P5.

**P15 — ⚠️ Vocabulário de término no combate.**
*O que é:* a §5.12 fixa que corpos de fenda **param de insistir** e voltam à
camada, e proíbe matar/abater/eliminar sobre eles. Falta medir e trocar o que
está no ar hoje em `DungeonGame.tsx`, `NightmareBattle.tsx` e `ArenaGame.tsx` —
rótulo de vitória, texto de HP zerado do inimigo, contador de `dungeonKills`
(o **id** fica, linha vermelha #20; o que muda é qualquer rótulo que o jogador
leia). *Risco:* é a superfície onde o vocabulário de morte entra sem ninguém
perceber, porque combate é gênero e o gênero fala assim. *Por que importa:* a
proibição de morte sobre a criatura do jogador (§11) fica sem valor se o app
ensinar a palavra três telas antes, no mesmo mundo. *A decidir:* se entra, e
se a régua da narrativa ganha uma família nova de termos.

**P16 — Uma linha de mundo no registro/bestiário.**
*O que é:* o registro cataloga **padrões, não indivíduos** (§5.11), e hoje nada
no app diz isso — o que deixa a leitura padrão do gênero ("cada um é um bicho
que eu peguei") ocupar o vazio. Uma linha só, na aba Estatísticas, em voz de
mundo. *Sistema:* rótulo no bloco do `bestiary`. *Risco:* baixo; o cuidado é
não transformar em texto longo numa tela de grade, e não usar "espécie" nem
"capturado". *A decidir:* se entra e a redação.
