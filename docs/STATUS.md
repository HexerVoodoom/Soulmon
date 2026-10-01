# Status do Soulmon — registro vivo

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

Documento único de acompanhamento. **Se algo importante for decidido, descoberto
ou concluído, registre aqui**, senão se perde entre sessões.

- Estado do código e do que está no ar → seções 1 e 2
- **O que depende de você (dono do projeto)** → seção 3
- Dívidas conhecidas que ainda não valem o custo → seção 4

> ## 30/09/2026 — Rodada 3: fx-itens, extras, corrida e postais instalados (SQUAD-ARTE, `feat/arte-rodada3-levas`)
>
> 115 PNGs com sha256 conferido contra os MANIFEST antes e depois da cópia. Ligados: Concha da Maré
> (sai o SVG), mochila do passeio e sol de "Acordar" no `CompanionHUD`, `dias-completos-30` refeito,
> Feira com arte por **tipo × estado** (`fairFenomenoId`, SVG como fallback), insígnias das faixas no
> `TournamentPage`, obstáculos da Corrida com **3 variantes por tier** e `hit`/`top` medidos, 48 postais
> das Travessias em `ADVENTURE_ART`. **Sem chamada**: céu (sol + 5 luas), masmorra (porta/baús/escada),
> moedas, atributos, FX da corrida (estilhaço/faísca/cristal-moeda) e `icone-corrida`. Rótulos: moeda do
> Torneio = **Honra/Honor**; jogo = **Corrida com obstáculos/Obstacle Run** (ids de save intactos;
> REGISTRO §17). `CACHE_VERSION` v179. Registro: `ASSETS-A-GERAR.md` §8 I14–I17.

> ## 30/09/2026 — Bustos de NPC (16) e prédios de lote (10) instalados (SQUAD-ARTE, `feat/arte-npcs-bustos`)
>
> Leva `npcs-flare` (aprovada pelo dono): 10 NPCs de lote trocaram os placeholders em `LOT_NPC_ART`
> (`src/assets/soulmon/npcs/index.ts`) com falas do ROSTER em `LOT_NPC_VOICE`; **Bento** substitui o
> nome de terceiro no Meu Soulmon, **Medra** ganha voz própria (Conquistas herdava o Grom), **Brume**
> assume o Passeio (antes Zeph). `npc-placeholder-poring`/`-coruja-cervo` e `PLACEHOLDER_NPC_ART` saíram
> do bundle (bíblia das áreas §1.3 A3/A4). Os 6 NPCs de função (`FUNCTION_NPC_ART`/`FUNCTION_NPC_VOICE`)
> estão **sem chamada** — onde entram é `PERGUNTAS-DO-DONO.md` NPC-1. Leva `lotes-v2/final/`: 10 prédios
> próprios (Jogos mente/refúgio, Passeio, Laboratório ×3, Hall ×3, Mercado conquistas);
> `lote-exploracao-dino.png` ficou **sem consumidor** (arquivo em disco, sem import). Registro:
> `ASSETS-A-GERAR.md` §8 I12/I13.

> ## 30/09/2026 — Respostas MIS-13..MIS-16 (Travessias)
>
> Dono, por modal: caixa 18+ mantida; Travessias fora da ficha da loja na v1; frase "as Travessias são opcionais"
> nos Termos §8 (PT+EN) com `TERMS_VERSION` 2026-09-30 — quem já aceitou recebe o aviso de atualização; "Crossings"
> fica no app, e busca de marca antes de marketing. Registrado no REGISTRO §5.6.
> ⚠️ Instável sob carga (passa isolado): `classeOcorrencia.test.ts` "a classe é ESTÁVEL" e, numa rodada,
> três casos da Masmorra em `playArea.render.test.tsx` — timeout da suíte cheia, não regressão. Vale subir o timeout desses casos.
>
> ## 30/09/2026 — manual sincronizado com `bcfe7ca6` (`/manter-docs`, delta `3532ccf5..bcfe7ca6`, Termos §8 + MIS-13..16)
>
> Tocados e carimbados `verificado em 30/09/2026` (verificação própria; subagentes `doc-*` não registrados): `02` §56 e `06/utils` (`TERMS_VERSION` = `2026-09-30`, `PRIVACY_VERSION` segue `2026-09-22`; banner mostra `changed = 'terms'`), `08` §5 (Termos §8: Travessias opcionais), `10` tema 6 e `01` §10 (MIS-13..MIS-16 respondidas). `00-MAPA` sem mudança de conteúdo. `.sincronizado.json` = `bcfe7ca6`. Divergências novas: nenhuma. `novos` do `docs-delta.mjs` segue artefato do detector no Windows.
>
> ## 30/09/2026 — manual sincronizado com `3532ccf5` (`/manter-docs`, delta `cfe27cc7..3532ccf5`, Passeio + Travessias)
>
> Carimbados `verificado em 30/09/2026` (doc-mantenedor, símbolo a símbolo contra o fonte; sem verificador independente — subagentes `doc-*` não registrados):
> `02` §43 (Passeio + Travessias, `adventureOfNight`, exceção à regra 4) e §54 (Exploração = Masmorra + Passeio; saiu o ⚠️ "nada implementado"),
> `03` §1.3 (lote Passeio, 🎒), `07` §2 (`crossings`, 97 campos), `01` §10, `10` tema 6/§17, `00-MAPA` §4.1/§5/§6.2, `05` (App 7076),
> `06-REFERENCIA` (entradas do PR para `travessias.ts`/`travessiasSave.ts`/`types/travessias.ts`/`PasseioSheet` conferidas e mantidas; atualizadas
> `adventure.ts`, `playAreaLots`, `areaNpcVoice`, `AreaView`, `CompanionHUD`, `DailyReportModal`, `AdventureDiary`, `Guide`/`Help`, `App`, `GameStateContext`).
> `src/data/travessiasCatalog.ts` sem entrada própria em `06` (como `activityCatalog.ts`). `.sincronizado.json` = `3532ccf5`.
>
> ## 30/09/2026 — Passeio + Travessias IMPLEMENTADOS (Exploração)
>
> Novo lote **Passeio / Stroll** na Exploração (`PasseioSheet`): o pet sai todo dia para a região escolhida e o
> achado da noite vem de lá (`passeioFindOfDay`, fundido à Aventura; casa = Aventura comum idêntica). **Travessias**:
> 7 regiões × 3 desafios da vida real com versão pequena (`src/data/travessiasCatalog.ts`, revisado por PI/menores
> e psicologia), opt-in, sem prazo, "Fiz" guarda e abre no máximo 1 região por noite, névoa sem número, esconder
> na folha. Palco: mochila 🎒 nas costas do pet quando o destino não é casa (não bloqueia cuidado). Nada no núcleo
> lê Travessia; sem push/widget/desktop (contratos em `travessias.contract.test.ts`). **Conserto de brinde:** o
> efeito da Aventura guardava achado em cascata (recalculava e colecionava o próximo não coletado até esgotar a
> faixa) — agora o achado da noite é o já guardado naquela data (`adventureOfNight`). Chunk de entrada re-medido
> 718_798 → 728_687 (catálogo fora dele). Pendentes do dono: MIS-13..MIS-16 (a frase no `termos.html` é a MIS-15).
>
> ## 30/09/2026 — manual sincronizado com `cfe27cc7` (`/manter-docs`, delta `4a894f90..cfe27cc7`, 4 commits de docs)
>
> Só commits de docs (Exploração/Travessias). Carimbados `verificado em 30/09/2026`: `00-MAPA` (§6.2 conferida — as 8 linhas novas já tinham entrado à mão), `10-DISCUSSOES-E-DECISOES` (linha nova no tema 6 + 2 fichas no §17), `01-VISAO` (§10: terceira exceção da Camada 3, decidida e não implementada) e `02-REGRAS-DE-NEGOCIO` (§54: "a Exploração fica só com a Masmorra" marcado como revertido em parte só na decisão; `EXPLORACAO_LOTS` segue só com a Masmorra). Verificação própria (subagentes `doc-*` não registrados). `.sincronizado.json` = `cfe27cc7`. Divergências novas: nenhuma. Nota: `docs-delta.mjs` lista ~400 módulos como `novos` sem entrada — o delta não tem nenhum arquivo de código, então é artefato do detector, não módulo novo.
>
> ## 30/09/2026 — Travessias: missões de vida real na Exploração (proposta decidida, nada implementado)
>
> Pedido do dono: missões que "levantam a barra" com desafios da vida real, acessadas pela Exploração. Escrita a
> `docs/PROPOSTA-MISSOES-EXPLORACAO.md`, pareceres de linha vermelha, psicologia e monster taming em
> `docs/reviews/2026-09-30-missoes/` (três **APROVADO COM RESSALVA**; vetados só a leitura "cumprir para evoluir"
> e o exemplo "só olhar o próximo nível"). O dono decidiu por modal: exceção à Camada 3, nome **Travessias**,
> barra por **amplitude**, postal e lore exclusivos por região. Registro §5.6, ledger, MIS-5..MIS-12 pendentes com
> padrão. Próximo passo: o Passeio fundido à Aventura (pré-requisito, R-47), depois as Travessias.
>
> ## 30/09/2026 — Benchmark de Exploração + 3 pareceres (proposta ao dono, nada implementado)
>
> Criados `docs/BENCHMARK-EXPLORACAO.md` (pesquisa, formato do de minijogos, fontes ✔/◐/(≈)/✖) e os
> pareceres de linha vermelha, psicologia e monster taming em `docs/reviews/2026-09-30-exploracao/`; vetos
> registrados em `ledger/vetos.md`; perguntas **EXP-1..EXP-7** em `PERGUNTAS-DO-DONO.md`. Vereditos: **Passeio**
> VETADO na forma proposta (Bits pelo achado, push de retorno, acúmulo por ausência) e aprovado com ressalva só
> fundido com a Aventura da noite · **Diário de Campo** e **Escavação** APROVADO COM RESSALVA nos três.
> **Achado:** a Aventura da noite (`adventure.ts` + `AdventureDiary`, decisão de 08/09) já é "o pet saiu e voltou
> com um achado" — EXP-6 pergunta se funde. Camada 3 segue congelada (§5.6); zero código.
>
> ## 30/09/2026 — manual sincronizado com `4a894f90` (`/manter-docs`, delta `5edfcfba..4a894f90`, 4 commits)
>
> Só commits de docs: docs tocados e carimbados `verificado em 30/09/2026` — `00-MAPA` (§6.2: hub e BENCHMARK-COMBATE), `10-DISCUSSOES-E-DECISOES` (linha nova no tema 6 + ficha do hub) e `01-VISAO` (§10: Actions segue parado por cobrança, portões locais). Sem verificador independente (subagentes `doc-*` não registrados): verificação própria contra STATUS, hub e `package.json`. `docs/manual/.sincronizado.json` = `4a894f90`. Divergências novas: nenhuma.

> ## 30/09/2026 — conferência do BENCHMARK-COMBATE feita (`benchmark-pesquisador` + `benchmark-curador`)
>
> `docs/BENCHMARK-COMBATE.md` foi conferido na web (seção "Conferido em 30/09/2026", corpo intacto): **7 ✔ · 92 ◐ · 19 (≈) · 13 ✖** em 131 linhas; das 13 ✖, 10 são contraditas pela fonte
> (Colosseum tem história, GBL não é automático, Pokéwalker tem 3 opções, DW1 não gasta recurso ao ralhar, Cyber Sleuth tem 9 elementos, MH Stories 3 é de 03/2026, química do Cassette Beasts, combo do
> Monster Sanctuary, Hold do Temtem, e o vocabulário Vírus/Dado/Vacina revertido em 29/09) e 3 sem fonte. Hub (`BENCHMARK-E-REFERENCIAS.md` §1/§2/§7) e MAPA §6.2 atualizados.
>
> - **Guarda-linha-vermelha** passou as 8 opções propostas: **1 limpa, 7 com ressalva, nenhuma vetada** (tabela "Parecer do guarda-linha-vermelha" no fim do BENCHMARK-COMBATE). A vetada (e) foi
>   reescrita: "dinheiro nunca compra vantagem de combate". Nenhuma opção virou regra: **tudo depende do dono** (`PERGUNTAS-DO-DONO.md`).
> - **Actions voltou?** NÃO (30/09/2026): push 2fe828d8 disparou CI, Android APK Build e docs-sync; os 3 jobs falharam em ~4 s (cobrança, parado desde 16/09). Portões seguem locais (`npm run portoes`).

> ## 30/09/2026 — manual sincronizado com `5edfcfba` (`/manter-docs`, à mão: agentes `doc-*` não registrados na sessão)
>
> Delta `ae366480..5edfcfba` (26 commits). Docs tocados e carimbados `verificado em 30/09/2026`: 01, 02, 03, 04, 05, 07, 08, 09, 10, 11, 12,
> 00-MAPA e `06-REFERENCIA/{api-workers,components,hooks-contexts-types,utils}`. Redatores e verificadores foram subagentes gerais com a
> definição `doc-*` como papel; o MAPA, o GLOSSARIO e o COMO-MANTER foram verificados pelo mantenedor (sem verificador independente).
> `docs/manual/.sincronizado.json` = `5edfcfba`. Divergências novas registradas:
>
> - ⚠️ **Anfitrião do Refúgio: Boio × Bobbi** — `REGISTRO-DE-DECISOES.md` §5.6 e os blocos de 30/09 deste STATUS dizem *Boio*; o código
>   (`LOT_NPC_VOICE['jogos:refugio']` em `src/utils/areaNpcVoice.ts`) e o §14.6 dizem *Bobbi*. O código vence; REGISTRO §5.6 e STATUS ficam a corrigir (dono do texto).
> - ⚠️ **"641 runs, 0 sucesso" (bloco do Actions, abaixo, e `HANDOFF-LOCAL-SEM-ACTIONS.md` §1) está impreciso**: `gh run list --workflow ci.yml --limit 1000`
>   → 642 runs, 158 `success` antes de 16/09 e **294 runs, 0 `success` desde 16/09**. A conclusão (parado desde 16/09) não muda; o manual já traz o número certo.
> - ⚠️ `CLAUDE.md` ainda diz que o `ci.yml` e o `android-build.yml` rodam no push (CI, artefato do APK no Actions) e não cita `npm run portoes`; com o Actions parado o portão é o local (05 §9, 08 §3.3–§3.4).
> - ⚠️ `CLAUDE.md` (linha da Masmorra) ainda cita o cenário `Tamagotchi`; hoje é `Retro Pet` (`DUNGEON_SCENES` em `src/utils/dungeonScenes.ts`).
> - ⚠️ Este STATUS (bloco do duelo fantasma) cita "ideia C" de `BENCHMARK-COMBATE.md`; esse doc numera as ideias 1–7 e o equivalente é a ideia 3 ("Torcer em vez de comandar", §6).
> - Em aberto, sem edição (código/teste): títulos de `SettingsPage.sobre.render.test.tsx` e `TermsUpdateBanner.render.test.tsx` ainda falam em "âncora #en" (as asserções já usam `#pt`);
>   o comentário de topo do `TournamentPage.tsx` ("não há um único frame de combate") está defasado pelo duelo fantasma; `duelStats` usa literais (70, 6, 10, 1,2, 50) sem constante nomeada (R3);
>   `docs/som/PROPOSTA-SOM-MINIJOGOS-2026-09-30.md` diz "nenhum evento ganha som" e também "2 candidatos" no §2.

> ## 30/09/2026 — GitHub Actions: portões locais (`npm run portoes`) e correção do diagnóstico
>
> Nenhum job do Actions executa passo desde **16/09/2026 (cobrança — #48/#68)**; medido hoje: 641 runs do
> `ci.yml`, 0 sucesso, todos em 3–5 s, log 404. Não há defeito de workflow, teste ou artefato — **só o dono
> regulariza** (`github.com/settings/billing`). Uma leitura anterior desta sessão tratou a causa como "provável"
> e a data como 28/09; ambas estavam erradas, e este bloco as substitui. Entregue: `scripts/portoes.mjs`
> (`npm run portoes` = os passos do `ci.yml` + guard do manual) e `docs/HANDOFF-LOCAL-SEM-ACTIONS.md` (substituto
> local de cada workflow, fluxo de merge sem CI, prompt da sessão local). **Sem artefato novo de APK/desktop
> desde 16/09** — gerar localmente.
>
> ## 30/09/2026 — Hub de benchmarking e referências + SQUAD-BENCHMARK
>
> Verificado antes: benchmarks existiam (combate, minijogos, guilda, `PLANO-EVOLUCAO.md`, `guia-experiencia/`,
> Mobbin, estudos dos guardas, `CATALOGO-EVIDENCIAS.md`), mas espalhados, com três convenções de confiança e
> sem agente geral (só o `catalogo-benchmark`, restrito a hábitos). Criados: **`docs/BENCHMARK-E-REFERENCIAS.md`**
> (mapa de todos os benchmarks, lista-mestra "onde já estudamos X", acessos, critérios ✔/◐/(≈)/✖, método B1–B9,
> lacunas), os agentes **`benchmark-curador`** e **`benchmark-pesquisador`**, a skill **`squad-benchmark`** e o
> comando `/squad-benchmark`; roteamento no `soulmon-coordenador` e entradas no MAPA. **Lacuna mais urgente:**
> `BENCHMARK-COMBATE.md` é inteiro de memória (≈) — rodar `/squad-benchmark conferir BENCHMARK-COMBATE.md` antes
> de usá-lo em decisão.
>
> ## 30/09/2026 — Decisões do dono sobre o balanço, executadas
>
> Masmorra × 0,4 (`DUNGEON_BITS_FACTOR`: run completa ~130–170, bônus 4/6/8/10/12, começar mais fundo
> 16/nível); Arena medida (50/run, fica); "Bits de minijogo hoje: X de 150" nas folhas; Exploração só
> com a Masmorra (na clareira do fundo); convite ao Refúgio com humor 1–2 (regras do psicólogo, `convite.ts`,
> antes do HP na fila); números de apoio num dono só (`supportLine.ts`) + findahelpline.com + `tel:188`.
> **Fechado depois, no mesmo dia:** NPCs **Tessela** (Ateliê) e **Boio** (Refúgio); jogos novos mudos; Refúgio
> travado mudo (C-10); Dino e PPT sem `playTaskComplete` (C-11). **Seguem em aberto:** categoria `arcade`, fronteira
> da D11 no Eco, trilha no Refúgio e guia sonoro na respiração (`docs/som/PROPOSTA-SOM-MINIJOGOS-2026-09-30.md` §6); "Tico" (lab) é nome
> registrado em PT-BR e o placeholder "poring" leva nome de franquia no bundle (achados da loremaster,
> já registrados em `docs/design/areas/prompts/00-INDICE.md`).
>
> ## 30/09/2026 — Balanço dos minijogos (`docs/BALANCO-MINIJOGOS.md`)
>
> Régua nova `src/utils/mente/balanco.test.ts`: Bits/min do jogador típico entre 2,5 e 9 em todo jogo
> leve, experiente ≤ 13, e todo "até N Bits" alcançável. Ajustes: Bolhas 1 Bit/6 sonhos, teto 8 (era
> /10, teto 10 — o típico ganhava metade do Dino); Troca teto 6 (o 10 era inalcançável); Picross por
> tamanho 3/6/12 + 5 do dia, e o bônus do dia não repaga ao reabrir. **Achado para o dono:** uma run
> completa da Masmorra paga 327–417 Bits, 2–3× o teto diário de 150 — ela enche o teto no 2º/3º
> andar e zera todos os outros jogos no dia (§4–§5 do doc; recomendação: reduzir os Bits da Masmorra).
>
> ## 30/09/2026 — Jogos ganhou três prédios e seis jogos novos (decisão do dono)
>
> A área **Jogos** tem agora três construções (`src/utils/playAreaLots.ts`): **Salão de Jogos**
> (Corrida do Dino + PPT — o Dino saiu da Exploração, que ficou só com a Masmorra), **Ateliê da
> Mente** (Eco do Pet, Bolhas do Sonho, Troca de Regra, Picross da Malha, Revisão da Malha — pagam
> Bits pelo funil único com o teto diário) e **Refúgio** (Respirar com o Soulmon + Bolhas calmas —
> não pagam, não pontuam, não medem; aviso CVV 188 / 988 / 116 123). Pesadelo, Masmorra, PPT e Dino
> intactos. Os cartões da Revisão moram no save (`GameState.review`, higienizado por
> `sanitizeReview`); o dia é `playerDayIso` (nova, mesma âncora de `playerDayKey`). Exceção ao
> congelamento da Camada 3 registrada no `REGISTRO-DE-DECISOES.md` §5.6. **Pendências:** arte
> própria dos lotes `mente`/`refugio` e dos NPCs Tessela/Boio (arte placeholder; nomes decididos, `ASSETS-A-GERAR.md` §15);
> nomes dos NPCs são placeholder de nomeação; os jogos nascem mudos (a squad-som decide se soam).
> Decisão pequena tomada na implementação: o Picross do dia paga 10 Bits só na 1ª solução da tela;
> refazer pelo seletor paga 3.
>
> ## 30/09/2026 — Benchmark de minijogos com foco cognitivo (pesquisa, nada implementado)
>
> `docs/BENCHMARK-MINIJOGOS.md`: clássicos (Atari/arcade/casual), v-pets, Pokémon, Monster
> Rancher, puzzles e brain training, com a evidência conferida (Simons 2016, Melby-Lervåg 2016,
> Sala & Gobet 2019: **transferência distante ≈ nula**; FTC × Lumosity 2016) e 13 opções filtradas
> pelas linhas vermelhas. Recomendação: **Revisão da Malha** (recuperação espaçada do conteúdo do
> próprio jogador — única com evidência A, Dunlosky 2013) ou o pacote Eco + Bolhas do Sonho +
> Troca de Regra (as três funções executivas). **Depende do dono**: minijogo novo é Camada 3,
> congelada (§5.6) — implementar exige exceção registrada. Nenhuma copy pode prometer efeito cognitivo.
>
> ## 30/09/2026 — Voltar com o ícone ilustrado de mapa; administrador refeito após o login
>
> O voltar das seis áreas usa agora o mesmo `PixelIcon name="mapa"` da Home (era o glifo
> de contorno). O corvinho não aparecia após o login por duas causas de código, ambas
> corrigidas em `src/utils/entitlementSync.ts`: a consulta do entitlement rodava UMA vez por
> `saveId` (se a 1ª resposta saísse sem token do Firebase, a sessão ficava não-admin) e a
> auto-adoção era "uma vez por sessão" (um save remoto sem corvo a desfazia). Agora a consulta
> refaz ao mudar o usuário do Firebase, ao voltar o foco (no máximo 1 a cada 30 s) e com um
> retry único de 2,5 s. **Se ainda não aparecer em produção, procure `admin_denied` no log do
> Cloudflare**: `no-allowlist` = falta o secret `ADMIN_EMAILS`; `not-listed` = o e-mail do
> login não está na lista; `saveid-mismatch` = consulta antes do login. O commit do duelo
> fantasma (outra sessão) reintroduziu `champion-virus` num teste; corrigido para
> `champion-power` — quem mexer no combate deve usar os ids `power|harmony|benevolence`.
>
> ## 30/09/2026 — Torneio: duelo fantasma (PvP com torcida)
>
> O "Desafiar" do Torneio deixou de ser um placar sorteado: abre o **duelo fantasma**
> (`src/components/DuelScreen.tsx`) — os dois pets lutam sozinhos e o dono **torce** em
> 3 golpes (anel que fecha sobre o alvo; torcida só soma, ×1 a ×1,35). Regra única em
> `functions/api/_duel.js` (servidor decide, cliente anima com a mesma semente; semente
> recalculada no `match`). Calibração: mesmo estágio 50% → ~80% com torcida perfeita;
> um estágio abaixo com torcida perfeita ~39%. Origem: `docs/BENCHMARK-COMBATE.md`, ideia C.
> **Brechas fechadas (30/09/2026):** (1) **sair do duelo antes do fim é DERROTA** — a
> partida é gasta na abertura (`duelStart`) e um duelo que não chegou ao fim (× na tela,
> app fechado, mais de 5 min) é fechado como derrota pelo servidor (`forfeitPending`,
> `community.js`); (2) a **semente nasce no servidor depois do compromisso** e nunca vai na
> lista de oponentes, então o cliente não simula os 3 oponentes para escolher o que vence.
> Régua: `functions/api/community.duelo.test.js`. O que resta: torcida forjada rende o
> mesmo que timing perfeito (teto ×1,35 por golpe) — aceitável enquanto Emblemas forem
> só cosmético.
> Sem verificação visual por Playwright (a tela depende da API do Torneio, fora do sandbox).

> ## 30/09/2026 — Lote de 29–30/09 fechado: Guilda, administrador/corvinho, mapas, renomeio de caminhos, widget
>
> Verificação final independente (`docs/reviews/admin-corvo/L3-verificacao-final.md`):
> **pronto para merge, ressalvas menores**. Entrou: a Guilda implementada (Bosque, Feira,
> resgate, gestos, cerimônia de marco); o papel de administrador (servidor: só token
> Firebase verificado + `ADMIN_EMAILS`; cliente: painel de GM, dar saldo, desbloquear tudo,
> corvinho adotado sozinho e sem volta); o corvinho em 11 formas por recolor de matiz; os
> mapas internos com ícone de mapa, fundo em tela cheia e NPCs 1,4×; o renomeio
> vírus/dado/vacina → **poder/harmonia/benevolência** (migração de save em
> `branchMigration.ts`, guard `branchRename.contract.test.ts`); o widget Android com o
> corvinho e o nome do estágio do Bosque; bíblia visual das 6 áreas e prompts do Higgsfield
> (~187 imagens, NPCs pelo oráculo). `dist/` reconstruído e **teto de bytes re-medido**
> (JS 718.798 B, CSS 153.795 B; decisão do dono #31 reafirmada: corte real é tarefa própria).
>
> **Depende do dono (o que só você faz):**
> 1. `npx wrangler secret put ADMIN_EMAILS` (seu e-mail de login) — sem isso ninguém é admin.
> 2. `GUILD_MEMBER_SECRET` no Cloudflare — sem ele o id opaco dos membros usa sal vazio.
> 3. Regularizar a cobrança do GitHub (#48): o `android-build.yml` só compila o widget/Kotlin
>    depois disso e é a única prova de que o widget compila.
> 4. Crédito no Higgsfield para gerar a arte (`docs/design/areas/prompts/00-INDICE.md`).
> 5. Confirmar as ressalvas menores: no GM, "Ir para forma → ultra" abre o modal de
>    evolução por cima das Configurações; o voltar sai do jogo para a cena da área (não
>    reabre a folha); "Do bosque" no Mercado só foi conferido no código.
> 6. Dívidas conhecidas do administrador (M-3/B-3/B-4, STATUS §4) e o resgate de Emblemas em
>    2 aparelhos de regiões diferentes do KV (só Durable Object fecha de verdade).
> 7. O CI da `main` só fica verde quando o teste de arquivo somente-leitura
>    (`tests/convertToWebp.test.ts`) deixar de rodar como root.
>
> ## 29/09/2026 — Widget Android: o corvinho e o estágio do Bosque
> Decisão do dono. Bridge ganhou duas chaves NOVAS (`pet_line` = só `"corvo"`; `grove_stage` = só id de `GROVE_STAGES`; vazias → o plugin REMOVE). `resolveSprite` usa `CORVO_SPRITES` (11 `drawable-nodpi/sprite_corvo_*.png`, cópia dos -256) e o widget A mostra só o nome do estágio (`widget_grove`, strings em `values`/`values-pt`). Régua: `widgetSemCobranca.contract.test.ts` (allowlists, paridade 11 formas ↔ drawables ↔ mapa Kotlin; 14/14 mutações mortas).
> **APK precisa de build novo** (drawables + Kotlin + layout) — o `android-build.yml` builda no push da `main`; só ele prova que o Kotlin/XML compila (sem Gradle local). A limitação "o widget não desenha o corvo" do bloco abaixo fechou aqui.

> ## 30/09/2026 — Manual sincronizado com `ae366480` (doc-mantenedor, `8e6d0d9a..ae366480`)
>
> Docs tocados: 00-MAPA, 02 (§15 lápide do renomeio; **§60 novo** administrador/GM e corvinho),
> 03 (§1.3 mapa interno; §4.23 painel de GM), 04 (§8.2-A corvinho), 06 (components, utils,
> api-workers), 07 (§5.5, `ai:sprite:@admin`, `soulmonMeta.creature`), 10 (3 linhas), 11 (verbetes).
> Correções de fato: `ADMIN_AI_CAP_MULTIPLIER` era 10 no manual, é **3** + sub-teto de 40;
> aviso "o widget não desenha o corvo" era falso; ids `data` → `harmony` em 02/04/06/07.
> Divergências novas: nenhuma de código; verificação SEM verificador independente (só `grep`).
> Não re-sincronizado: `dist/`/teto de bytes, prompts em `docs/design/areas/` (só indexados).

> ## 29/09/2026 — Admin/GM no cliente + o corvinho de lanterna e cartola
> `useAdmin()` (`src/utils/adminFlag.ts`) espelha SÓ o `admin === true` de `GET /api/entitlements`, em memória (nunca save/localStorage; rede falha = não-admin).
> O admin adota o corvinho uma vez por sessão (`src/utils/corvoPet.ts` › `adoptCorvo`, marca `soulmonMeta.creature`); arte resolvida por `spriteLineOf` → `getSpriteForStage` em Home, Pet, Evolução, cerimônia, masmorra/arena/Dino/pesadelo, torneio e overlay desktop.
> Painel de GM nas Configurações (`GmPanel.tsx` + `src/utils/gmTools.ts`): saldo 999999 em Bits/Emblemas, desbloquear tudo, ir para forma, encher cuidados, +1/7/30 dias completos. Capturas em `docs/reviews/admin-corvo/shots-cliente/`.
> **Limitações:** o widget Android não desenha o corvo (drawables por estágio); o nome da forma aparece em PT também no EN (`CreatureStage.name` é monolíngue, como no oráculo). **Decidido pelo dono em 29/09/2026:** adoção do corvinho **automática** na primeira abertura como administrador e **sem volta**; ultra do corvinho **mantido como está**; GM no PvP **aceito como está** (dívida M-3 conhecida de `docs/reviews/admin-corvo/L1-sustento.md`, o administrador não sai do PvP). Registro em `REGISTRO-DE-DECISOES.md` §5.5. **Depende do dono:** `wrangler secret put ADMIN_EMAILS`.

> ## 29/09/2026 — Caminhos renomeados: Poder / Harmonia / Benevolência
>
> Pedido do dono ("remova toda menção a virus, data e vacina…"), registrado em
> `REGISTRO-DE-DECISOES.md` §14.5 (reverte o rótulo da §14.4). Ids `power`/
> `harmony`/`benevolence`, formas `champion-power` etc., campos `*Points`
> novos, chips 👊/🎶/🤲, arte e drawables renomeados, `CACHE_VERSION` +1.
> Save antigo migrado por `src/utils/branchMigration.ts` (local, nuvem,
> overlay); servidor lê só por compat as chaves KV antigas de sprite/teto por
> forma (`functions/api/_branchLegacy.js`). Régua: `branchRename.contract.test.ts`.
> **Nada depende do dono** — o APK precisa de build novo só para os drawables
> renomeados (o CI builda no push).

> ## 29/09/2026 — Guilda (o Bosque e a Feira) — IMPLEMENTADA (núcleo), falta o entorno
>
> Estado real: a exceção ao congelamento foi registrada pelo dono (linha
> "Camada 3 CONGELADA", `REGISTRO` §5.6 — G16 resolvido) e o núcleo WPG-0..12
> está no código: servidor `functions/api/guild.js` + `_coop.js` (Bosque,
> fio, marés, gestos, Feira, resgate), cliente `GuildSheet.tsx`, palco
> `groveStage.ts`, cerimônia de marco. QA L3 (`docs/reviews/guilda/qa/L3-*.md`):
> correções de servidor feitas em 29/09 — **A-1** (sair não descarta
> Emblemas/Concha não colhidos: direito em `coopPart:<save>:<week>`), **A1 do
> código** (409 `already claimed` traz `claimed:{…}` do registro), **M-1**
> (ausência nunca é chave `false`), **M-2** (dias distintos de fio sobrevivem à
> saída, `coopDias:<save>`), **M-3** (`progress/target` saíram; aliases `coop*`
> ficam só porque os testes de servidor os usam — nenhum cliente chama),
> **M-5** (régua LV-G6 `functions/api/guildReward.contract.test.js`), **B-2**
> (`threadedToday` só com fio). **G1** (fio pela meta de coração) está no código
> e foi **CONFIRMADO pelo dono em 29/09/2026** (`REGISTRO` §5.5).
> **Decidido pelo dono em 29/09/2026 (modal):** cenários `bg-guild-*` **diurnos**, tom do Hall (creme); fenômeno da Feira com **um sprite por tipo × 3 estados = 12** (`fair-fenomeno-<tipo>-<estado>`, +9 ativos; `FAIR_ART` em `src/utils/fairArt.ts` precisa de mapa por tipo×estado, código ainda não feito); Jogos: repintar só `bg-jogos` (lote PPT, Pipo e zona ficam como estão).
> **Falta:** widget (WPG-14), arte real (WPG-13/WPG-A, hoje placeholders; fila de prompts em `docs/design/areas/prompts/`, ~187 imagens estimadas),
> wireframes GUI-01..16 (WPG-W), manual + bíblia (WPG-15, `docsManual` com
> entradas faltando).
>
> **Cliente, rodada L4 (29/09/2026)** — fecha os achados do loop 3 no cliente
> (`docs/reviews/guilda/qa/impl-notas-front.md` › "Rodada L4"): o 409 do
> resgate credita pelo `claimed` (só quem tentou aqui); quem SAIU ainda vê o
> cartão de colher; 401 nunca é beco (Entrar + `UnlockNudge` do demo + tentar de
> novo); Clareira no vazio; saída fixa no rodapé; gestos recebidos no topo;
> "Do bosque" no topo do Mercado; `groveMilestone` com régua de posição na
> fila; fallback em memória para storage cheio (marco e recibo); JS de entrada
> −10,7 KB (722 489 → 711 766 B). **Depende do dono/servidor:** motivo próprio
> de telemetria para o convite da Guilda (hoje reusa `shop`, exige `reason`
> 5 no `metrics.js`); 6 chaves PENDENTE de revisão do `soulmon-narrative-critic`.
>
> **Manual sincronizado com `8e6d0d9a` (29/09/2026, `/manter-docs` desde `38c3ccb5`)** —
> a Guilda inteira (servidor fatias 1–3, cliente A/B1/B2/L4, correções L2/L3) chegou ao
> manual: docs `00-MAPA`, `01-VISAO`, `02` (novo §56-A e §56 CORRIGIDO — as 9 afirmações
> falsas do `L1-conformidade`), `03` (§4.26, fila, avisos), `04` (§7.5), `05`, `07` (11
> famílias `coop*`), `08` (§2.11-A, 15ª rota, seis eventos `guild_*`), `10`, `11` (9
> termos) e `06-REFERENCIA` (10 módulos novos, contagem de `utils` 139 → 157). Sem a
> ferramenta Agent na sessão: redação e verificação (grep símbolo a símbolo) feitas por
> um agente só. `docsManual`/`docsSemMentira` verdes.
> **Divergências novas (todas plano/comentário × código; código intocado):** (1)
> `PLANO-COOP.md` §4.2 "código de uso único" — o código é reutilizável até a guilda morrer;
> (2) `PLANO-COOP.md` §3.4 "sem check-in 4 semanas é apagado" — não implementado (só o TTL de
> 120 d, e com Bosque plantado nem ele); (3) `PLANO-GUILDA.md` §3 diz "dia UTC" no fio e "broto
> / ramo" nas marés — o código usa o dia do jogador (±1 UTC) e `petala`/`corola`/`floracao`;
> (4) comentários de `guildClaimLocal.ts`/`storageKeys.ts` chamam `GUILD_CLAIMED` de "terceira"
> chave — o teste trava exatamente duas; (5) a aba "Grupo" da `LibraryPage` é código morto
> (inalcançável); (6) **G1** segue adotado por padrão e **aguarda o dono**.
> **Depende do dono:** criar o segredo `GUILD_MEMBER_SECRET` no Cloudflare (sem ele o id
> opaco do membro usa sal vazio — funciona, mas é previsível); motivo próprio de telemetria
> para o convite da Guilda (hoje reusa `shop`); arte real do Bosque/Feira (`fairArt.ts`,
> `bg-guild-*`, `trophy-concha-mare`) e wireframes GUI-01..16 seguem pendentes.
>
> ### (registro anterior) Plano da Guilda — PLANO, sem código
>
> Pedido do dono: traçar o plano completo da guilda com foco CONSTRUTIVO
> (horta/cidade) e arena secundária. Decisões do dono no modal de 29/09:
> o Grupo cooperativo EVOLUI para Guilda de até 12 (um coletivo por pessoa);
> a construção é o **Bosque** (Clareira → Ramagem → Copa → Mata → Bosque
> antigo, 1 fio por membro que cumpre a própria meta do dia, agregado, anônimo,
> **nunca regride**); a arena é a **Feira** = raid cooperativa contra um
> fenômeno (sem confronto guilda × guilda); esta sessão entrega **só o plano +
> fila de WPs** — a Camada 3 segue congelada (REGISTRO §5.6). Entregue
> `docs/PLANO-GUILDA.md` (§0–§16: regras, constantes, salas, mapa, estética,
> servidor, balanceamento com simulação `docs/reviews/guilda/sim/`, LV-G1..G10,
> fila WPG-0..15, 17 itens G1..G17 que dependem do dono) sobre 8 docs de
> pesquisa em `docs/reviews/guilda/00..08`. Pareceres: linha vermelha
> **aprovado com ressalva** (`ledger/vetos.md`; achado LV-G3: o TTL de 120 dias
> de `coop:<gid>` apaga o Bosque — virou G17); crítica narrativa 3 bloqueantes
> corrigidos no plano (Feira "entre bosques" contradizia D-G4; o fenômeno não
> pode ser "a pilha de pendências"; promessa × mecânica do fio). Achados de
> carona sobre o coop no ar (D-1..D-5 em `05-servidor.md`): nome do grupo sem
> `_redact`, presença nominal viola LV-G2 acima de 4, exportação sem o
> progresso próprio, zero telemetria de coop. Também: `GuildSheet.tsx` e
> `backStack.ts` sem entrada em `06-REFERENCIA` (guard (c) vermelho, anterior
> a esta sessão) → `/manter-docs`.
>
> ⚠️ **CI da `main` está vermelho e NÃO é da Guilda** (29/09/2026, PR #169): o
> check `tsc + vitest` já falhava em `104abe2f` (#168) e `2e410432` (#167), em
> ~3 s, antes de qualquer teste. Localmente a suíte inteira reprova só em
> `src/deploy/orcamentoDeBytes.contract.test.ts` (`index-*.js` em **683 KB**
> contra dívida de 634 KB + 8 KB — o `dist/` cresceu em PRs anteriores; decisão
> #31: pagar ou re-medir com justificativa) e em `tests/convertToWebp.test.ts`
> (somente-leitura não vale como root). **Depende do dono:** o orçamento de bytes.
>
> **Depende do dono:** os 17 itens da §15 do `PLANO-GUILDA.md`; o mais
> importante é G1 (fio pela meta INTEIRA, como decidido, ou pela meta de
> coração, como psicologia e servidor recomendam) e G16 (exceção ao
> congelamento para começar WPG-0/1).

> ## 29/09/2026 — Manual sincronizado com `38c3ccb5`
>
> `/manter-docs auto` sobre `cf8a851d..38c3ccb5` (54 commits). Tocados:
> `06-REFERENCIA/utils.md` (entrada NOVA `backStack.ts`; exports reconferidos
> em `areaNpcVoice`, `areaSheetCopy`, `chatSafety`, `androidBack`, `oracle`,
> `rebirth`, `bestiary/select`) e `06-REFERENCIA/components.md` (entrada NOVA
> `guild/GuildSheet.tsx`; `AreaSheet`). Guard item (c) volta ao verde.
> ⚠️ **Parcial**: os demais docs do delta (02, 03, 05, 07, 10, 00-MAPA, 12,
> hooks-contexts-types) não foram reescritos nesta rodada — o delta deles é
> sobretudo docs de plano/review e módulos já com entrada; fica para a
> próxima passada. Divergências novas: nenhuma.

> ## 28/09/2026 — Fase 0 do Oráculo: régua única (auditoria N=800 + papel/reino no bloqueante)
>
> `docs/PLANO-ORACULO.md` §8 Fase 0. Novo `scripts/oraculo-auditoria.test.ts`
> (`npm run oraculo:auditoria`, config separado `vitest.oraculo.config.ts`,
> fora do include default — nunca trava PR), N=800, seeds de validação
> `19870412`+`31415926` (nunca a de calibração `20260928`), população
> cobrindo `timeUnknown` (~20%) e "só 6 perguntas sem teste longo" (~30%).
> Relatório: `docs/reviews/oraculo-auditoria/2026-09-28.md`. Tabela velha de
> `docs/ORACULO.md` §"Equilíbrio medido" corrigida com os números novos.
> `criacaoDistribuicao.test.ts` passou a medir papel e reino (achado do
> crítico: a régua nunca mediu os dois). **Vermelho, registrado e NÃO
> recalibrado** (recalibração é Fase 1): papel 1,79–1,89× e reino
> 2,31–2,75× contra a meta ≤1,5×; colisão de nome de criatura 3,00% contra
> meta ≤2%; grupo do bestiário (58×) e família visual (9,67×) muito acima da
> meta ≤4×. Dentro da meta: caminho (1,27×), linhagem (85,7%/52,7%),
> unicidade de tupla (95,4%). C5 (fidelidade direcional) e C9 (divergência
> comportamental) seguem não implementados — documentado como não coberto no
> relatório, não escondido.
>
> ## 28/09/2026 — Manual sincronizado com `83a9aac6`
>
> Delta `8110efc5..83a9aac6` (2 commits, PR #127). Docs tocados: 02 (§22
> Oráculo), 06/utils (`oracle.ts`, `bestiary/select.ts`, `pipeline.ts`). Guard
> verde. 00-MAPA/10-DISCUSSÕES/01-VISÃO sem edição de conteúdo (delta só
> apontava `docs/STATUS.md`/`docs/BESTIARIO-PROCEDENCIA.md` como gatilho, sem
> exigir mudança nesses três).
>
> ## 28/09/2026 — Criação única e proporcional (3 loops) + manual sincronizado com `cf8a851d`
>
> PR #133. Antes (N=400) → depois (900, 3 seeds): elementos 5,4× → 1,13×;
> caminhos 46/32,5/21,5 → ~36/36/28%; famílias visuais 13 → 44/44;
> companheiros 12 → 32/32; classes 72 → 78/79; evolução que atravessa
> família 21 → 43%; tupla visível única 26 → 95%. Régua nova
> `criacaoDistribuicao.test.ts` (seed fora da calibração). **Pendências do
> dono** (sem decisão tomada, detalhe em `REGISTRO-DE-DECISOES.md` §5.3):
> corpus do bestiário 55% `besta` / 3 `ave` (conserto é sync com o repo
> irmão); `combate_fisico` 40% (proporção clássica documentada); "Arauto do
> Fim" inalcançável; akasha ~2% / pântano ~4%.
>
> ## 28/09/2026 — Revisão do sistema de criação (3 loops) + manual sincronizado com `f465d266`
>
> PR #131. Companheiro capturável (calculado e descartado) passa a fechar a
> bio do reveal; bio × card de classe do Pet no rookie não nomeiam mais
> elementos opostos (~50% dos perfis antes). Refutados: profissão e poder de
> skill têm consumidor de UI. Novas réguas: `ficha/capture.test.ts` e a
> concordância em `ficha/classTitle.test.ts`. Docs: 02 §22, 06/utils,
> 06/components (`PetPage`), 10 tema 3. Flake conhecido sob carga:
> `SoulmonOnboarding.portao.render.test.tsx` (passa isolado).
>
> ## 28/09/2026 — Manual sincronizado com `25fd3c41`
>
> Delta `83a9aac6..25fd3c41` (2 commits, PR #129). O caminho (poder/harmonia/
> benevolencia) passa a pesar sobre o elemento: tabela declarada
> `ALIGNMENT_ELEMENT_AFFINITY` (`axes.ts`), ±15%, 3 favorecidos/3 neutros/2
> dificultados por caminho. Docs tocados: 02 (§22), 06/utils (`axes.ts`), 10
> (tema 3). Guard verde. Decisão em `REGISTRO-DE-DECISOES.md` §5.3.
>
> ## 28/09/2026 — Oráculo passou a explorar de verdade o bestiário curado
>
> PR #127 (`83a9aac6`). Pedido do dono: garantir que o bestiário atualizado
> (corte de procedência + curadoria + arquétipos, 27/09/2026) fosse bem
> aproveitado na criação E na evolução do personagem, embasado só em dado
> que já existe. Achados corrigidos, todos "dado calculado e descartado":
> `bestiaryInspiration.familia`/`.biologia` nunca eram lidos por `oracle.ts`
> (agora reforçam a escolha de família visual via nova ponte
> `bestiaryFamilyIds`); a linhagem por estágio (`selectBestiaryLineage`) era
> calculada e jogada fora em produção (agora cada forma de evolução usa o
> pick da própria linhagem no prompt de imagem); ponte de família para
> `humanoide` (via `biologia` real); rebalanceio dos 4 bônus fixos de
> `scoreCreature` (teto 7→14, pedido explícito do dono) porque o termo de
> elemento sozinho costumava superar todos os outros juntos. `ignea` ficou
> **de propósito** sem ponte — é resíduo suspeito de bug, registrado como
> pendência. Diagnóstico e detalhe completo: `docs/BESTIARIO-PROCEDENCIA.md`
> §13.
>
> ## 28/09/2026 — Manual sincronizado com `8110efc5`
>
> Delta `1d9e278d..8110efc5` (2 commits, PR #125). NPC por sub-loja no lugar do
> anfitrião fixo da área: `AreaScene` deixou de desenhar NPC no rodapé da cena;
> `AreaSheet` ganhou altura fixa em 2/3 da tela, com a metade de cima dedicada
> ao NPC do lote (`lotNpcArt`, `src/assets/soulmon/npcs/index.ts`) + balão de
> fala. Sub-lojas sem NPC próprio (Conquistas, Duelo, Corrida do Dino) usam
> placeholders (`PLACEHOLDER_NPC_ART`: coruja-cervo/poring, sobras de geração
> do Higgsfield de 23/09/2026, nunca instaladas antes). Docs tocados: 03
> (§1.3), 06/components (`AreaScene`, `AreaSheet`). Guard verde
> (`docsManual.contract.test.ts`, `docsSemMentira.contract.test.ts`).
>
> **Follow-up em aberto:** a fala (nome + linha) do NPC continua por ÁREA
> (`areaNpcVoice`), não por sub-loja — a imagem já mudou por loja, o texto do
> balão ainda não. Dar fala própria a cada NPC de sub-loja é trabalho de
> conteúdo/narrativa (squad-narrativa), fora do escopo do PR #125.
>
> ## 27/09/2026 — Manual sincronizado com `2336e4e7`
>
> Delta `c510c7e4..2336e4e7` (4 commits). Docs tocados: 02 (§22 D-B1 — o nome da
> inspiração vai no `imagePrompt`, reversão do dono com lápide; pool 617; §17
> `notified` ⚰️), 04 (§8.3 corte do bestiário, §8.4 D-B1), 06/utils, 06/components
> (o aviso da `OraclePage` ainda dizia "nunca entra em prompt"), 06/hooks-contexts-types,
> 07 (`incubation.notified` ⚰️), 10 (2 linhas no tema 10, frase do dono verbatim).
> 00-MAPA já tinha a entrada de `BESTIARIO-PROCEDENCIA.md` — conferida, sem duplicar.
> Exceção conhecida: `scripts/bestiario-procedencia.mjs` fica fora do inventário
> (`docs-inventario.mjs` não cobre `scripts/`). Divergências novas: nenhuma.

> ## 27/09/2026 — Manual sincronizado com `c510c7e4`
>
> Delta `78ef5367..c510c7e4` (3 commits, sendo 1 o próprio commit de docs anterior),
> rodado por `/manter-docs auto`. As duas frentes grossas — **WP4.29 (incubação)** e
> **minimal-ui F1–F6** — já tinham entrado no manual em `d433a607`; o que faltava eram
> as **duas correções pós-F3** de 24/09.
>
> Docs tocados e recarimbados: **00-MAPA** (§5 ganha `src/utils/androidBack.ts` e
> `src/components/ui/PixelIcon.tsx` + `assets/soulmon/icones-ui/`), **03** (§1.1 voltar
> físico do Android; §1.2 `icon="mapa"` e o saldo do Mapa no canto inferior direito em
> pílulas `chip-moeda`; §4.2 o deck de CINCO ações vira ⚰️ e no lugar entram OS TRÊS
> CUIDADOS), **04** (§5.1 ganha o terceiro caminho de ícone), **05** (§1.1 `@capacitor/app`;
> §2.2 `App.tsx` 6659 → 6646), **06/components** (`CornerLink`, `MapPage`),
> **06/utils** (cobertura re-medida), **08** (só o carimbo: §3.6 não repete o número),
> **09** (§1.5 ganha a linha das duas correções).
>
> - ⚰️ **Duas mentiras corrigidas, as duas da família "a régua descreve o app de ontem"**:
>   o manual dizia que o plugin do Android era procurado em tempo de execução porque
>   `@capacitor/app` não estava instalado e que na Home ele chamava `exitApp` (FECHAR o app
>   onde o Android manda só mandar a tarefa para trás) — hoje o pacote é dependência e
>   `utils/androidBack.ts` **minimiza**; e o §4.2 de telas descrevia um deck de CINCO
>   ações que tinha morrido na F2 (`grep -c 'sm2-deck"' src/components/CompanionHUD.tsx`
>   → 0), incluindo um botão de comer que hoje é arrasto da Mochila.
> - **Divergências novas: nenhuma.** As duas já registradas continuam abertas e são do
>   dono: o `CLAUDE.md` ainda descreve a Loja "na página Atividades (`ShopModal`)" e
>   Missões como "aba na loja", e ainda fala da "nav inferior 32px" sem citar a exceção D1.
> - Fechada a pendência menor do bloco anterior: `06-REFERENCIA/utils.md` dizia
>   "120/120 módulos" (medição certa de 09/09, árvore que cresceu 19 módulos desde então);
>   re-medido por `scripts/docs-inventario.mjs` → **139/139**, sem nenhum faltando.

> ## 24/09/2026 — Manual sincronizado com `78ef5367`
>
> Delta `c7bca6d..78ef5367` (19 commits: incubação WP4.29 + minimal-ui F1–F6 + Vesca),
> rodado por `/manter-docs`. Docs tocados, todos recarimbados pelo `doc-verificador`
> em 24/09: 00-MAPA, 01, 02 (§7, §17 incubação, §20, §47, §49, §51, §54, §59 D3), 03
> (aviso `incubacao`, §4.10, §4.9 `pane === 'oracle'`, Oráculo alcançável pelo menu),
> 04 (`--sm-corner-h`, exceção D1, `sm3-blink`/`sm3-sobe`), 05, 07 (92 campos,
> `incubation?`), 08 (7 bumps do `CACHE_VERSION`), 06/components, 06/utils,
> 06/hooks-contexts-types, 09, 10. Isto fecha o ⚠️ "não é uma sincronização completa"
> do bloco da F6 abaixo.
>
> - ⚠️ **`CLAUDE.md` diverge do código** (é do dono, não mexido): ainda diz Loja "na
>   página Atividades (`ShopModal`)" e Missões "aba na loja"; §5.4 de identidade não cita
>   a exceção D1 e ainda fala da "nav inferior 32px".
> - Pendências menores fora do delta: 02 ainda cita `EvoTrail.tsx` em seções não
>   tocadas; `06-REFERENCIA/utils.md` diz cobertura 120/120 mas há 121 módulos contados.

> ## 24/09/2026 — minimal-ui F6 (fechamento), branch `chore/minimal-ui-f6`
>
> - **Código morto removido**: a tela `ItemsWindow` (pastinha) + `showItemsWindow`/
>   `handleOpenItems` no `App.tsx` (sem chamador desde a F2; o arquivo ficou só com
>   `getFoodName`/`getFoodDesc`); o placeholder "chega na próxima fatia" do
>   `areaSheetCopy.ts`; o `donaDoH1` (sempre falso desde a F5) e os `Pane` mortos
>   (`games`/`tournament`/`library`/`shop`) do `App.tsx`.
> - **Texto**: a aba "Stats" do Laboratório era só EN — agora "Estatísticas"/"Stats"; a
>   copy que mandava para a "pastinha" (chips do Mercado, Glitchtama da masmorra,
>   coraçãozinho no `HelpModal`) agora diz "mochila"/"Backpack".
> - ⚠️ **Achado visual (não corrigido, anterior à F6)**: no Mapa, o saldo das 3 moedas
>   no topo direito fica por cima da arte do cogumelo de Jogos e "Emblemas"/"Créditos"
>   perdem leitura (`E:/soulmon-shots-f6/mapa.png`); na F3 o toast de nuvem escondia.
> - **Manual**: `03-FLUXO-DE-TELAS.md` §1 reescrito (Home + Mapa + 6 áreas) e as
>   menções vivas a `BottomNav`/`ActivitiesPage`/`ShopModal`/`ItemsWindow` em 02, 03,
>   04, 06 e 00-MAPA viraram caminho novo ou lápide ⚰️; `src/navigation.ts` ganhou
>   entrada em `06-REFERENCIA/utils.md`. `CACHE_VERSION` v166 → v167.
> - ⚠️ **Não é uma sincronização completa**: `docs/manual/.sincronizado.json` segue em
>   `c7bca6d` — o delta desde lá (fatias F1–F5 e o que veio antes delas) não passou
>   pelo `doc-verificador`; falta rodar `/manter-docs` na `main` depois do merge.

> ## 22/09/2026 — Manual sincronizado com `c7bca6d`
>
> Delta `89554b5d..c7bca6d` (7 commits, série BALANCEAMENTO DO ORÁCULO + a saída
> do texto livre do ritual). Docs tocados, todos recarimbados pelo
> `doc-verificador` no mesmo dia:
>
> | doc | o que entrou |
> |---|---|
> | `02-REGRAS-DE-NEGOCIO.md` §22 | ⚰️ o degrau da criatura favorita; a tabela das 4 frentes de rebalanceamento (`DOMINANT_SCHOOL_LEAD`, `melhorArquetipo`, `ANCHOR_BASE`/`vileza`, `sombra`); o aviso do erro de medição de `normalizeName` |
> | `03-FLUXO-DE-TELAS.md` | a linha `FAVORITE_STEP` virou ⚰️ + o degrau pulado nos dois sentidos e o rascunho antigo desviado |
> | `06-REFERENCIA/utils.md` | `oracleDraft.ts`, `soulProfile/axes.ts`, `ficha/buildSheet.ts`, `ficha/classTitle.ts` |
> | `06-REFERENCIA/components.md` | `SoulmonOnboarding.tsx` |
> | `10-DISCUSSOES-E-DECISOES.md` | 2 linhas novas (a decisão do texto livre e a série de balanceamento) |
>
> **Nenhuma regra que o jogador VIVE mudou** — as quatro frentes corrigem
> vantagem estrutural na LEITURA, e o §22 já dizia que nenhum elemento, papel ou
> reino pode tê-la.
>
> **Divergências novas: nenhuma.** A que continua aberta e não é desta série: o
> T-PISO (`ficha/buildSheet.piso.test.ts`) **REPROVOU** — 0,49 estrito / 0,82 sem
> desastre contra a meta de 0,95 da §10.2 da spec, que **não foi movida**; os
> valores medidos ficam como piso de regressão e a escolha entre as quatro saídas
> de `docs/plano-melhorias/ledger/permanencia.md` (bloco WP4.23) **depende do
> dono**. Não é "diverge de propósito".
>
> `perfisSinteticos.ts` (módulo novo) já tinha entrada em
> `06-REFERENCIA/utils.md`, escrita pela própria série; nada a indexar no
> `00-MAPA.md`.

> ## 22/09/2026 — BALANCEAMENTO 4: `sombra` e `pântano`, os dois outliers que sobraram
>
> Fechamento da série de balanceamento do oráculo. Sobravam dois pontos fora
> da faixa dos pares, medidos em 600 perfis pelo pipeline real (efemérides +
> numerologia + as 6 respostas do ritual, com nomes de `perfisSinteticos.ts`):
> o elemento **`sombra` dominava 3,8%** e o reino **`pântano` 4,8%**.
>
> **`sombra` — a causa não era a média, era a variância.** A média dela já
> estava em linha com as outras sete; o que faltava era PICO. Ela era o único
> elemento sem nenhuma das duas fontes de pico do `axes.ts`: não divide o pool
> astrológico de 60 (isso é dos quatro clássicos, que sobem a 40+ num mapa
> concentrado) e é primária em UM dos doze números de `NUMBER_ELEMENTS` contra
> seis de `luz`. Sobrava-lhe o neuroticismo, neutro no caminho das 6 perguntas
> — metade dos jogadores.
>
> **A armadilha, e é ela que vale registrar:** `sombra` é vocabulário
> COMPARTILHADO — o `classElements` a repassa crua —, e do outro lado ela já
> era a MAIS comum dos 17 (15,7%). Levantar o NÍVEL dela consertava o jogo e
> estourava o class-system: medido, o primeiro conserto (0,45→0,38 no
> neuroticismo, polaridade 12→26) deu 8,8% aqui e **22,1%** lá, reprovando
> `classeElementoOcorrencia.test.ts`. O conserto que ficou dá a `sombra` a
> fatia água+terra do pool astrológico (que é o que "noturno" significa no
> mapa) e **subtrai uma constante de 20** — deslocamento derruba a média sem
> tocar a variância, que era exatamente o que se precisava. O coeficiente do
> neuroticismo ficou em 0,45: baixá-lo apagava o sentido psicológico de
> `sombra` (0,05 e 0,10 foram medidos e funcionavam pelo motivo errado).
>
> Resultado: **3,8% → 10,3%** no jogo (par de `industrial`, 10,7%) e **15,7%
> → 15,7%** no class-system, exatamente a mesma de antes.
>
> **`pântano` andou pouco — 4,8% → 5,0% — e isso foi decidido, não aceito por
> omissão.** Ele é o único reino cujo peso não tem nenhum elemento em 3
> (`{ agua: 2, sombra: 2, planta: 2 }`), então soma três elementos de
> dominância baixa e nunca tem pico próprio. As duas saídas foram medidas e
> recusadas: `{ agua: 2, sombra: 3, planta: 2 }` o leva a **32,3%**, porque o
> escore do reino é soma CRUA e o peso total passaria de 6 para 7 — os nove
> reinos empatam em 6 de propósito; `{ agua: 1, sombra: 3, planta: 2 }`
> mantém o total, anda 0,2pp e tira a água da liderança de um pântano. A
> tabela ficou como está: o resto da diferença é FIDELIDADE, que é o critério
> que o dono fixou — o reino segue os elementos da pessoa, e os dele
> continuam entre os menos dominantes.
>
> **Régua nova:** `src/utils/soulProfile/elementoOcorrencia.test.ts` (os 8
> elementos do jogo e os 9 reinos — piso, teto e a explicação do que NÃO se
> consertou). A dos 17 do class-system já existia e continua verde.

> ## 22/09/2026 — `vileza` desacoplada (17/17) + ⚠️ ERRO DE MEDIÇÃO MEU, corrigido
>
> **1. Desacoplamento (decisão do dono).** `vileza` e `morte` saíam do MESMO planeta
> (Plutão, fatores 0,9 × 1,0) e o termo que deveria separá-las é neutro no caminho das 6
> perguntas. `vileza` era a única dos 17 que nunca dominava. Agora ela é **Plutão +
> Marte** (os dois maléficos clássicos) e `morte` segue Plutão puro. Medido: **17/17
> dominam**, razão entre grupos 1,08×, maior fatia 13,0%.
>
> **2. ⚠️ O erro de medição, e ele invalidou números que eu já tinha reportado.** As
> medições de balanceamento usavam nomes formulaicos — `Perfil 1 Teste`, `Ana Silva 0`.
> Como `normalizeName` só preserva A–Z, **o índice é descartado**: centenas de perfis
> herdavam UMA única numerologia, que alimenta alinhamento e elemento.
>
> O tamanho do erro, medido trocando SÓ o prefixo do nome e mais nada: `harmonia` como
> alinhamento dominante saltou de **57,7% para 7,0%**. Quarenta e cinco pontos
> percentuais entre dois arnês que só discordavam no nome.
>
> **A linha de base honesta, com 782 nomes distintos em 800 perfis:**
>
> | eixo | spread | extremos |
> |---|---|---|
> | alinhamento | 17,1pp | harmonia 41,9% × benevolência 24,8% |
> | reino | 15,1pp | floresta 20,3% × pântano 5,1% |
> | elemento (8) | 12,8pp | ar 17,0% × sombra 4,3% |
> | papel | 12,3pp | mágico 27,3% × alcance 15,0% |
>
> Muito mais saudável do que os números contaminados sugeriam, e comparável ao que o
> `ORACULO.md` já registrava.
>
> **As conclusões das frentes 1–3 foram RE-VALIDADAS com nomes reais e sobrevivem**
> (razão 1,08×, 17/17 dominando, fidelidade de escola total). O conserto era estrutural,
> não artefato da amostra.
>
> Novo módulo `soulProfile/perfisSinteticos.ts` com a regra escrita, e as três réguas
> passaram a usá-lo. Nome com índice não é amostra — é um perfil repetido.

> ## 22/09/2026 — BALANCEAMENTO 3: os 17 elementos em pé de igualdade (ANCHOR_BASE 15 → 45)
>
> **Decisão do dono:** "o class-system deve ser explorado ao máximo, com mesma chance
> pra todas as combinações e classes".
>
> **A causa era escala incomensurável.** Os 6 elementos de nome compartilhado com o jogo
> entravam na escala CRUA do eixo de elementos (25-55); os 11 cósmicos, numa âncora de
> base 15. Por desenho, o cósmico só alcançava o clássico no p99 de proeminência
> planetária. Medido em 400 perfis: **2,4× de vantagem estrutural** e **7 dos 17 nunca
> dominando**.
>
> A razão é IDÊNTICA nos dois caminhos do ritual — 2,36× só com as 6 perguntas, 2,41%
> com os 20 itens — o que descartou a camada psicométrica como causa e apontou a escala.
>
> **A/B com protocolo idêntico** (800 perfis × mega+ultra = 1600 fichas):
>
> | | BASE 15 | BASE 45 |
> |---|---|---|
> | classes que VENCEM | 70/79 | **75/79** |
> | classes que QUALIFICAM | 77/79 | **79/79** |
> | pares destravados | 102/136 | **132/136** |
>
> `arauto_do_fim` e `demiurgo_absoluto`, que **nunca se qualificavam**, passam a existir.
>
> **Duas correções minhas, registradas porque a lição se repetiu:** eu havia reportado
> "24 de 136 pares" e "59 de 79 classes" — os dois eram **limite de amostra**, não de
> cobertura. As linhas de base honestas são 102/136 e 70/79. Cobertura agora só se
> reporta com A/B de protocolo idêntico.
>
> **Uma hipótese minha que o teste derrubou:** escrevi que `morte` sombreia `vileza` por
> ter média maior. Falso — as médias são praticamente iguais (5,777 × 5,787, `vileza` de
> leve à frente). O que separa as duas é quem leva o topo nos picos. `vileza` segue sendo
> a única dos 17 que não chega a dominar, por compartilhar Plutão com `morte`; está
> MEDIDO em `classeElementoOcorrencia.test.ts`, não escondido.
>
> A régua trava o RESULTADO (razão entre grupos ≤1,45×, ≥15/17 dominando, nenhum acima de
> 22%), não o coeficiente — quem mexer em 45, em `ANCHOR_GAIN` ou nos termos de traço
> precisa manter isso de pé.

> ## 22/09/2026 — BALANCEAMENTO 2: o class-system explorado ao máximo (9 → 59 classes)
>
> **Decisão do dono:** "o class-system deve ser explorado ao máximo, com mesma chance
> pra todas as combinações e classes". Defeito, não calibração — mesma família do da
> escola.
>
> **O achado começou numa pergunta do dono** ("como todos saíram Red Mage??") sobre três
> prompts de exemplo. A leitura literal dos três estava errada (só um era Red Mage), mas
> a suspeita estava certa e a medição confirmou algo pior.
>
> **Medido antes** (120 perfis pelo pipeline real, ultra): `mago_vermelho` em **73 de 120
> (61%)**, e era o mais comum em TODOS os cinco papéis — inclusive tanque (10/23) e
> suporte (19/26). Só **9 classes** venciam, de um catálogo de **79**.
>
> **A causa não era falta de conteúdo — era a seleção jogando-o fora:**
>
> | | |
> |---|---|
> | arquétipos que se qualificam em ≥1 ficha | **76 de 79** |
> | arquétipos qualificados POR ficha | mediana **24,7** (mín 13, máx 46) |
> | arquétipos que venciam | **9** |
>
> `melhorArquetipo` escolhia "sempre o de condição mais específica" — função só da
> CONDIÇÃO do arquétipo, não da pessoa. Mesmo conjunto qualificado ⇒ mesmo vencedor, e
> as fichas do Soulmon se concentram nos mesmos eixos.
>
> **Conserto:** a escolha passa a ser determinística pela IDENTIDADE entre os
> qualificados. `especificidade` vira desempate fino em vez de critério único, e a lista
> é ordenada por `id` antes do índice — sem isso, um reordenamento dentro do motor
> vendorizado trocaria a classe de todo mundo em silêncio.
>
> **Medido depois** (300 perfis): **59 classes distintas** (eram 9), a mais comum em
> **5,7%** (era 61%).
>
> Duas propriedades travadas em `ficha/classeOcorrencia.test.ts` porque não podem se
> perder: a classe continua **EMERGENTE** (só entra arquétipo que a ficha conquistou — há
> teste conferindo contra a lista do motor) e **ESTÁVEL** (mesma pessoa, mesma classe;
> ela é cache determinístico no save, e classe que muda sozinha entre aparelhos é a QA
> rodada 1 de novo).
>
> Onde isso aparece: `promptClassFlavor`, o 4º traço do prompt de sprite, nas 11 formas.
> 61% dos jogadores pagantes teriam "Red Mage" escrito nos onze prompts da criatura.

> ## 22/09/2026 — o texto do jogador sai do ritual v1 (só depois do Renascimento)
>
> **Decisão do dono:** o jogador só insere texto que vai para o PROMPT depois do
> Renascimento. Antes disso a criatura é inteiramente leitura — quem a pessoa é, não
> o que ela digitou.
>
> O degrau **"Qual sua criatura favorita?"** (`FAVORITE_STEP`, o 5º do ritual) saiu do
> onboarding. O achado que o motivou, medido no pipeline real: o campo entrava como
> **prefixo literal nos 11 prompts**, e o prompt é inglês — um jogador brasileiro
> digitando "lobo" produzia `transparent background: lobo ant-rose, Tide Priestess, …`
> nas onze formas.
>
> ⚠️ **O NÚMERO do passo ficou, e não virou 4**: `utils/oracleDraft.ts` PERSISTE o
> `step`, então renumerar mandaria quem retomou um ritual para a tela errada — mesmo
> motivo pelo qual os passos de "porquê" usam ids negativos. A escada segue inteira, o
> degrau é pulado na ida e na volta, e **rascunho parado nele é levado adiante** (senão
> quem retomasse veria o casco do onboarding vazio, sem título, sem botão e sem saída —
> o dano que o comentário do piso `1` em `back()` já descrevia).
>
> `ORACLE_DRAFT_VERSION` **não subiu** de propósito: chave a mais é ignorada na leitura,
> e subir a versão descartaria rascunhos válidos de quem está no meio do ritual agora.
>
> Um teste de render foi ATUALIZADO, não desativado: ele afirmava que o voltar da 1ª
> pergunta ia para a criatura favorita; agora afirma que vai para o local de nascimento,
> e o que ele protege continua sendo o mesmo — a 1ª pergunta TEM saída.
>
> **`petDescription` não era v1** e foi parqueado junto: só a `OraclePage` o coleta, e ela
> não tem entrada na navegação. O defeito da bio em inglês saindo em português (quando há
> descrição livre) alcança a ferramenta interna, não o jogador — fica para a v2.
>
> A capacidade continua em `oracle.ts` (`favoriteCreature` no `OracleInput` e no
> compositor de prompt), inerte e testada, porque é dela que a v2 vai precisar.

> ## 22/09/2026 — BALANCEAMENTO 1/4: a escola voltou a seguir a pessoa
>
> Primeira frente do balanceamento pré-Renascimento. **Defeito, não calibração.**
>
> **Medido antes** (400 perfis pelo pipeline real — efemérides + numerologia + as 6
> respostas do ritual): `combate_fisico` dominava **100%** das fichas, e a fidelidade
> papel→escola era **0,0%** para `alcance`, `magico` e `suporte`. Um perfil de suporte
> recebia escola de lutador. A fidelidade global aparente (42,8%) só existia porque
> `fisico` e `tanque` calham de apontar para a escola que vencia de qualquer jeito.
>
> **Causa, estrutural:** `ROLE_TO_ESCOLA` manda `fisico` E `tanque` para `combate_fisico`
> (~40 de peso somado), enquanto a fatia de `suporte` racha entre `benca` e `maldicao`
> (~8 cada). Com os eixos normalizados em 100 e achatados (~20 por papel), nenhuma
> variação individual reverte isso — a escola não era desequilibrada, era **constante**.
>
> **Conserto:** `DOMINANT_SCHOOL_LEAD` (1,15) em `buildSheet.ts` — piso que garante que a
> escola do papel dominante lidere a segunda colocada. **Medido depois: fidelidade 100%
> nos cinco papéis**, e `suporte` racha `benca` 75% / `maldicao` 25% pelo alinhamento
> (as duas alcançáveis — `maldicao` já foi a escola que "nunca recebia um ponto").
>
> ⚠️ **A régua tem duas metades e confundi-las desfaz o desenho** (decisão do dono):
> a PROPORÇÃO POPULACIONAL pode e deve ser desigual — o gênero trabalha com ~3 dps :
> 1 tanque : 1 suporte, e os papéis já saem assim (medido: 58,5% / 24,8% / 16,8%). Mais
> fichas de combate que de cura é o resultado CERTO. O que não pode é a escola discordar
> da pessoa. `ficha/escolaFidelidade.test.ts` afirma as duas metades, e o teste da
> proporção afirma a FORMA (dps > tanque, dps > suporte, nenhum papel a zero), nunca
> uniformidade.
>
> **Ainda em aberto, medido e não consertado** (frentes 2 a 4): bestiário — `besta` 33,8%
> e **26,3% das criaturas saem sem família**; pares de elemento — só **24 de 136** já
> apareceram, `aurora` em 27,3%; elemento do class-system — só **6 de 17** já dominaram;
> `sombra` a 1,3% entre os 8 do jogo e `akasha` a 5,3% entre os 9 reinos. ⚠️ A
> documentação afirma cobertura 17/17 — o que foi medido lá é *alcançabilidade* com pisos
> de 0,1%, não OCORRÊNCIA. São coisas diferentes, e é a segunda que o jogador sente.

> ## 22/09/2026 — sincronização do manual pós-merge `89554b5d` (alocação de elemento parqueada)
>
> Delta `fadb1167..89554b5d`, 10 commits. **5 docs recarimbados**, quatro redatores em
> paralelo + verificação bloqueante. `00-MAPA` §6.4 reetiquetou a spec `G-alocacao-elemento.md`
> de "plano (spec, nada implementado)" para **plano PARQUEADO (v2.0)** — as duas metades da
> etiqueta antiga ficaram falsas no mesmo dia — e corrigiu a faixa para WP4.22…**WP4.33**;
> `10-DISCUSSOES` §3 ganhou 6 linhas e §18 o registro de que a alocação está aberta **por
> decisão**, não por esquecimento; `01-VISAO` §10 ganhou o adendo do parqueamento e do CI
> parado; `02-REGRAS` registrou a alocação como **capacidade dormente** dentro da §20
> (Renascimento) em vez de abrir seção — a mecânica não é regra que o jogador vive;
> `06-REFERENCIA/utils` ganhou `ALLOC_FRACTION`, `ElementPlan` e o 6º parâmetro de `buildFicha`.
>
> **A verificação pegou um eufemismo e o corrigiu:** a entrada de referência dizia que o
> T-PISO "diverge de propósito da régua da spec". Ele **REPROVOU** — 49,7% contra os 95%
> exigidos, régua não movida. Doc que suaviza reprovação vira doc que mente.
>
> Conferido no fonte, símbolo por símbolo: a alocação é **INERTE** (`grep` por chamadores de
> `buildFicha` → só o próprio módulo, `fromInput.ts` e os testes, e nenhum passa o 6º
> argumento), e nenhum dos cinco docs a apresenta como viva. 56 testes das réguas citadas
> passando; guards do manual verdes (10/10).

> ## 22/09/2026 — alocação de ELEMENTO: construída até o WP4.23 e ⏸️ PARQUEADA PARA A v2.0
>
> **Decisão do dono ao fim da sessão:** priorizar o balanceamento PRÉ-RENASCIMENTO
> agora e lançar a alocação de elemento junto do Renascimento na **v2.0 do app**.
> A spec fica completa e o trabalho salvo; nada mais entra antes disso.
>
> **Spec:** `docs/plano-melhorias/G-alocacao-elemento.md` (13 seções, com o
> cabeçalho de parqueamento). **Decisões #72–#78** em `PERGUNTAS-DO-DONO.md`.
> **Pareceres:** `ledger/vetos.md` (linha vermelha, APROVADO COM RESSALVA,
> R-A..R-H) e o parecer de psicologia comportamental, que revogou o prazo de 24h.
>
> **O que está no código e é INERTE** — ninguém passa plano de alocação (sem
> campo no save, sem tela, sem chamador), e sem plano `allocateElementos` é byte
> a byte a função de sempre, com teste exigindo isso estágio por estágio:
> · **WP4.22** carve-out em `ficha/buildSheet.ts` (+ `buildSheet.aloc.test.ts`, 30 testes)
> · **WP4.22b** R-B **verde** (`arena.alocacao.test.ts`): 17 planos adversariais,
>   3000 runs cada — melhor `morte` 63,8%, pior `vigor` 60,0%, **spread 3,8pp**,
>   dentro da janela 40–80%. Inclui trava anti-vacuidade (17 atributos distintos),
>   que foi o que pegou uma regressão minha antes de ela ser enviada.
> · **WP4.23 T-PISO REPROVOU**, e é aqui que o trabalho parou.
>
> **⚠️ A pendência que trava a retomada (seção 3).** A régua de §10.2 da spec
> ("pares destravados ≥ os da ficha automática em ≥95%") **não é atingível** —
> três mecanismos medidos, nenhum passa, e a causa é estrutural: par destrava
> com ≥50 pontos em CADA componente contra um orçamento de 500, com a maior base
> típica em 62 pontos. Os elementos ficam em cima do limiar. O trade-off medido:
>
> | Mecanismo | Pares ≥ auto | Fichas zeradas | Identidades de combate |
> |---|---|---|---|
> | carve-out (o que está no ar) | 49,7% | 62 | **17** |
> | bias multiplicativo | 62,5% | 6 | **1** |
>
> Ou a alocação significa algo, ou ela não quebra nada. **Quatro saídas medidas
> no bloco WP4.23 do `ledger/permanencia.md`** — o dono escolhe ao retomar.
> A régua NÃO foi movida; o teste trava os valores medidos como piso de
> regressão, com a divergência escrita no cabeçalho. Nenhum teste desativado.
>
> **CI:** o GitHub Actions não executa nada desde antes desta sessão — seis runs,
> quatro commits, três workflows, todos morrendo entre 2 e 15 s sem rodar um
> passo. Cloudflare publica normal. Já registrado na resposta #48 (o dono resolve
> depois) e comentado no PR #110. A verificação desta sessão foi local: `tsc`,
> `tsc` server, `tsc` desktop e `build` limpos, **4841 testes passando** — a única
> falha é `tests/convertToWebp.test.ts`, que exige erro ao escrever em arquivo
> somente-leitura e não reproduz rodando como root (falha de ambiente do sandbox,
> não do código).
>
> **🔬 Achado colateral, não investigado (não é desta sessão):**
> `src/components/SoulmonOnboarding.portao.render.test.tsx` › "entrar com Google
> não pede e-mail nenhum" é **INTERMITENTE na suíte completa** — falhou em 2 de
> 4 execuções cheias, e passa **3/3 rodando isolado** (25 testes verdes). Não é
> do diff desta sessão (apareceu antes dele e o diff era markdown). O padrão —
> verde sozinho, vermelho no conjunto — aponta para poluição entre testes ou
> corrida de timing, não para regressão do portão de identidade. Fica registrado
> porque teste instável num portão de AUTENTICAÇÃO é o tipo de coisa que passa a
> ser ignorada como "flaky" até esconder um defeito real.

> ## 22/09/2026 — sincronização do manual pós-merge `cf6315e1` (as 32 respostas do dono)
>
> Delta `cd66940f..cf6315e1` (5 commits: `917c9465`/`7d80f8d7`/`19f0d1f3` de narrativa, `592e2c14` já carimbado, e
> `cf6315e1` — a execução das 32 respostas), `/manter-docs auto` inline pelo doc-mantenedor numa worktree própria
> (`docs/sync-cf6315e1`), doc por doc, cada afirmação conferida por grep/`wc -l` contra o fonte.
> **14 docs recarimbados:** `02` — **oito regras de jogo mudaram, e este é o delta que mais mexe em regra desde a fundação**:
> §7 a virada julga o **último dia aberto** (`diaJulgado`; a folga segue ancorada em ONTEM de propósito, senão seria o nono perdão)
> e escreve quatro campos (`perfectDays`, `totalPerfectDays`, `missionPerfectDays`, `gamePoints`); §8 o dreno ganhou as **três
> travas** que o próprio doc já afirmava ter (carência de save novo, rampa de retorno, piso da raiz — o teto do dia
> compartilhado ficou com o dono); §18 **uma virada completa antes de re-evoluir** (`podeEvoluirDepoisDaQueda`, 3 chamadores);
> §24 `timesPerWeek` só cobra coração na **virada da semana** (`habitCountsForHeartsOn`/`isWeekClosingDay`); **§24-A novo** —
> desfazer a conclusão, janela de 5 s por snapshot de 11 campos; §46 **Bits por dia completo (100)** e **teto de minijogo
> (150/dia)** com o porquê de o teto ser em Bits e não em runs, mais o ponteiro do modelo de receita (§5.4 do REGISTRO);
> §48/§49 o 🌀 passou a escrever `missionPerfectDays`; §55 o ⚠️ virou a **tabela dos 6 emissores novos** (os 11 `BondEvent`
> têm emissor; a comida continua FORA, e isso está declarado); §57-A o 🌀 saiu das conquistas. `06-REFERENCIA/utils`
> (`currencies` com as 6 entradas do teto, `dailyReset` `podeEvoluirDepoisDaQueda`/`BITS_PER_COMPLETE_DAY`, `habitRhythm`
> `isWeekClosingDay`/`habitCountsForHeartsOn`, `missions`, `entitlements` `resetSpriteLifetimeAfterRebirth`, `poopDrain`,
> `specialItemUse`), `components` (`App.tsx` **6384** linhas/**81** handlers + o bloco da execução, `DungeonGame` **577** e
> `onFloorCleared`, `ActivitiesPage` **306**), `hooks-contexts-types` (**1542** linhas, **91** campos), `api-workers`
> (`_entitlements` **704** + `resetSpriteLifetimeOnRebirth`, `_aiGuard` **388** + a nota do renascimento, a lápide do
> "tabela ausente"), `07` (**91** campos, `missionPerfectDays`, `minigameBits`, `rebirthSpriteResetAt` no `ent:`),
> `08` (**D1 aplicado em produção** com a nota do `0002` marcado, rota `rebirth-reset`, secrets que seguem do dono),
> `03` (toast de desfazer na Home/Atividades + `UndoToast` entre as superfícies globais), `04` (tagline única travada por
> `manifest.contract.test.ts`; `UndoToast` sem classe, inline por decisão), `05` (**ADR-006 ACEITA** + `PLANO-SAVE-SCHEMA.md`,
> `booklet-pdf.mjs` em §2.1, dívida do JS de entrada re-medida **641 016 → 652 255 B** com justificativa),
> `09` (**#102–#107**: merge da R2, livrinho ilustrado, PDF + gerador, one shot, execução das 32; 1.080 commits),
> `10` (**8 linhas novas** — cinco no tema 1 e três no tema 6 — e o §18 fechando a fila das 32), `11` (5 termos novos:
> assinatura de IA, desfazer, `missionPerfectDays`, teto de minijogo, reabertura de conta), `00-MAPA` (`booklet-pdf.mjs`;
> a narrativa de `917c9465`/`7d80f8d7`/`19f0d1f3` **já estava indexada** em §6.2 com etiqueta `vivo`, e os dois cabeçalhos
> foram conferidos), `01` (§8 e §9b relidos — entraram no próprio `cf6315e1`).
> Guards `docsManual` + `docsSemMentira` + `narrativa` **verdes (3 files / 15 tests)** na worktree.
> **Divergências novas (doc ≠ decisão do dono — nenhuma de código):** (1) a resposta **#59b** diz "a tabela do §55 passa a
> incluir a comida" e isso **não foi implementado** — `BondEvent` tem 11 membros e nenhum é de alimentar (`grep` em
> `src/utils/bond.ts`), e nenhum caminho de `feedPet` chama `awardBondXP`; (2) os dois docstrings de `dailyReset.ts`/
> `currencies.ts` chamam o catálogo da loja de `SHOP_ITEMS`, e o export é `ALL_SHOP_ITEMS` (`src/utils/shop.ts`).
> **Observações:** `rebirth-reset` **tem** chamador no cliente desde `cf6315e1` (`handleRebirth` › `void
> resetSpriteLifetimeAfterRebirth()`) — a entrada de `api-workers` escrita no próprio commit dizia "ainda sem chamador";
> `AGE_DAY_BASE_UTC` segue no git e não no ar (worker de push sem redeploy desde 21/09). **Fora do delta, de propósito:**
> `12-COMO-MANTER` (os dois arquivos que o delta lhe atribui são a remoção dos symlinks `higgsfield-*` e o
> `som-produtor-assets`, ambos já descritos em `05` §2.2 e no MAPA §6.1).

> ## 22/09/2026 — sincronização do manual pós-merge `592e2c14` (QA Rodada 2)
>
> Delta `a6c1cd8a..592e2c14` (`95b18314` carimbo da R1, `592e2c14` correções da rodada 2), `/manter-docs auto` inline pelo
> doc-mantenedor numa worktree própria (`docs/sync-592e2c14`), doc por doc, cada afirmação nova conferida por grep/`wc -l`/`ls`
> contra o fonte. **16 docs recarimbados:** `06-REFERENCIA/api-workers` (`_coop.js` completa; `_accountTombstone` `gateTombstone`/
> `readTombstone`; `_auth` `authTime`/`authStatus`/`tombstone`; `save.js` releitura antes da renovação + `deletedAt`; `subscribe`/
> `fcm-subscribe` `saveIdAutorizado` + CORS `Authorization`; `_pushIdentity` expulsa apagada; `account.js` `coopLeave`/`pidDeAmigo`/
> `index+scan`/`NOT_INCLUDED`/`COPY`; `_entitlements` `podarOrderDetails`/`ORDER_HISTORY_MAX`/`ehViolacaoDeChave`; `_aiGuard`
> `perAccountByTier`; `community.js` 908 linhas/`CLOSED_SEASON_TTL`/410; `_redact` `keep`/`YEAR_OR_HOUR`; `_pushCopy` textos;
> `push-scheduler` `AGE_DAY_BASE_UTC`; 410 em `billing`/`entitlements`/`generate-sprite`), `utils` (`cloudSave` `checarContaExcluidaNoLogin`/
> `LeituraNuvem.excluidaEm`/`reconcileSaveId` `'excluida'`/`CONFLICT_BACKUP`; `community` 410; `notifications` `Bearer`; `playBilling`
> `fecharNaPlay`; `telemetry` fila saneada; `termsNotice` `'both'`; `taskSuggestions` `suggestTasksResult`; `trilha` `MotivoDePausa`/
> `trilhaPausada`; `bond`/`dailyReset` `perfectDay` emitido; `petVoice` 6 kinds; `chatSafety` EN; `storageKeys` 49 chaves +
> `TERMS_NOTICE_SHOWN`), `components` (⚰️ `figma/ImageWithFallback.tsx`; `CompanionHUD`/`EvolutionPath` `onError` + escada de fallback
> em `PET_VOICE_LINES` — ⚰️ "Me alimenta por favor!"; `FeedbackLink` `BUILD_ID`; `GameTutorialFlow` `falhaIa`; `MorningCheckIn` âncora;
> `SettingsPage` Termos/`#en`; `SoulmonOnboarding` `aposAutenticar` + região viva; `FormKit.ActionRow` `language`/sr-only; `RitualPanel`
> `aria-disabled`; `OfflineSeal` pré-Home; `App.tsx` `termsNoticePrimeiraVez`/trilha por estado/`PostponeNudgeSheet` ids),
> `hooks-contexts-types` (1523 linhas, `publicarPerfil` só após save ok, hydrate de `soulmonMeta`/`soulmonSkills`/`soulmonClassTitles`/
> `evolutionLocked`), `plugins-constants` (`BillingPlugin.kt` `acknowledge`, frases do widget, `csp` por igualdade, `depsVivas` `SO_DEV`,
> `ia.camposEnviados` sem `fetch` cru, `copy.semFomo` em `src/utils`, guards novos `artMaps`/`narrativa.superficies`/`regrasDeJogo.qaRodada2`),
> `desktop` (`jwtExp.js` completa — 32 linhas, `main.js` 374 `auth-clear`, `preload` `clearAuth`, `cloudSync` `'deleted'`, `menu.ts` 735,
> `phrases`, `alt=""`), `07` (as marcas "em curso 22/09" viraram fato: `del:done:` reabre + toda rota, `pushidx` invariante, coop/export,
> `closed:` 400 d; §3.3/§3.4/§4.1/§4.2), `08` (§1.1, §2.5–§2.8 ack + D1 sem fallback, §2.10/§2.11, §2.13, §3.5 e §4 **secrets medidos no
> ar** — `METRICS_ADMIN_KEY` ✅, `SEASON_ADMIN_KEY` ✅, `ENTITLEMENTS_ADMIN_KEY`/`FIREBASE_SERVICE_ACCOUNT`/`GEMINI_API_KEY` ausentes,
> D1 não aplicado), `03` (§2.1 `; wv)`, §2.3 portão com lápide antes do onboarding, §2.4 falha de IA com nome, §3.2 banner em posição 1
> na 1ª vez, §4.2 balão, §4.17, §4.23 Termos, §4.25), `02` (§46 cota por tier #55 + nota #61; §55 `perfectDay` emitido; §7 nota #58;
> §18 nota #59 — **nenhuma regra mudou**), `04` (§10.2 gate `; wv)` + CSP), `05` (§1.1 `@capacitor/cli` dev, §4 lápide em `_auth`,
> §7, §9 guards novos), `01` (§7 relido, sem mudança), `10` (15 linhas de 22/09/2026 nos temas 1/4/5/6/7/8/12/13/14 e §18 com #54–#71),
> `12` (§9 runbook que mede), `00-MAPA` (§5 `_coop.js`, `jwtExp.js`, guards novos, ⚰️ `figma/`; §7 relido).
> Guards `docsManual` + `docsSemMentira` **verdes (2 files / 10 tests)** na worktree; `node scripts/docs-delta.mjs` → "Nada a sincronizar".
> **Divergências novas (doc ≠ o que o consolidado prometeu — nenhuma de código):** (1) `00-CONSOLIDADO.md` §3.1 lista "`drainPrefix`
> desindexa a entrada morta" — **não aterrissou** (`grep desindexar workers/push-scheduler.js` vazio; o cron segue sem tocar `pushidx:`);
> (2) §3.3 diz que `narrativa.superficies.contract.test.ts` foi "estendido a `_pushCopy.js`/`account.js` + trava `partner`" — **não**:
> a régua varre booklet/ficha/`public/*.html`/`android/**.kt` e `partner` só aparece no comentário; (3) a entrada provisória
> de `desktop.md` (escrita "em curso" na R2) dizia que `main.js` importa `jwtExp.js` — só o `auth-preload.js` importa. **Observações:** `AGE_DAY_BASE_UTC`
> está no git, não no ar (worker de push sem redeploy desde 21/09); os 6 eventos do Vínculo do `App.tsx` seguem mudos (patch em
> `sim/patch-vinculo-app-eventos.md`, não aplicado). **Fora do delta, de propósito:** `09-HISTORICO` (a linha da R2 já está em
> `592e2c14`; falta só o SHA do merge desta rodada — próximo `/manter-docs`) e `11-GLOSSARIO` (os 5 termos da R2 entraram em `592e2c14`).

> ## 22/09/2026 — sincronização do manual pós-merge `a6c1cd8a` (QA Rodada 1)
>
> Delta `f4086ce0..a6c1cd8a` (`5228145e` carimbo, `959e3bee` BOOKLET-UNIVERSO — já indexado no MAPA §6.2 —,
> `a6c1cd8a` correções da rodada 1), `/manter-docs auto` inline pelo doc-mantenedor, doc por doc, cada afirmação
> nova conferida por grep/`wc -l`/`ls` contra o fonte. **16 docs recarimbados em 22/09/2026:** `06-REFERENCIA/api-workers`
> (`account.js` ordem do `delete-confirm` + lápide + sprites + `via`, `save.js` 410, `entitlements.js` 404 e `typeof`,
> `subscribe`/`fcm-subscribe` `desindexarInscricao`, `metrics.js` `invite`/`active_days`/`notes.retained`, `_entitlements`
> tier derivado + 620 linhas, `_pushCopy` D0 `null`, `_pushIdentity` `pushidx`, `_redact` cep/data/celular), `utils`
> (`REVOKE_PUSH_TIMEOUT_MS`, `normalizarParaLexico`, `deleted`/`reagirContaExcluida`/`mensagemContaExcluida`, versões
> `2026-09-22`, `unregisterFromPushNotifications` pós-`res.ok`, `ACCOUNT_DELETED_NOTICE` + fila `soulmon-telemetry-hidden`,
> `invite`/`limparOrigemDaUrl`/`drainHiddenTelemetry`/`MAX_HIDDEN`, `qualDocMudou`), `components` (`widgetPetName` e
> `limparOrigemDaUrl` no `App.tsx`, `getFoodName` exportado de `ItemsWindow` e usado no `CompanionHUD`, `APP_VERSION` ←
> `__APP_VERSION__`, feedback em Ajuda, Sobre com sons/sem revisão humana, `TermsUpdateBanner` `changed`/`region`/"Entendi",
> aviso de conta excluída no portão, `mailto:` sem `_blank`, ⚰️ "nenhuma" régua do `GameTutorialFlow`), `hooks-contexts-types`
> (1503 linhas, `.conquistas.qa`, 410 no `.then`), `plugins-constants` (`canScheduleExact`/`openExactAlarmSettings`,
> `widgetPetName`, guards novos: `ia.camposEnviados`, `copy.semFomo`, `manifest`, `versaoUnica`, `billingPbl8`, `widgetNome`),
> `desktop` (`exp` ilegível = agora + 1 h), `07` (§3.3 `deleted`, §4.1 `ACCOUNT_DELETED_NOTICE` + filas da telemetria, §8.1
> `del:`/`del:done:`/`sprite:*`, §8.2 `pushidx:`), `08` (§2.5/§2.6 índice e `res.ok`, §2.7 D0 nulo, §2.8 Billing 8.3.0,
> §2.10 404 + tier derivado, §2.12 três mudanças + nota de retenção corrigida, §2.13 ordem/410/sprites, §3.3 **Actions parado
> por cobrança como fato datado**, §3.4 versão única + alarme exato, §3.6, §4), `03` (§2.1 gate por plataforma, §2.3 aviso de
> conta excluída, §2.4 hint de IA, §3.2 item 7, §4.23 Ajuda/Sobre), `02` (§46 cortesia sobrevive a reembolso — provisório #40;
> §56 versões e `qualDocMudou`), `05` (§1.1 1.1.4, §1.3 8.3.0, §4 ADR-004..006 Proposta, §7, §9 guards + CI parado), `04`
> (§10.1 `manifest.json`, §10.2 gate por plataforma), `12` (§7 `/implementar-wp` com build, §9 operador com `gh run list`,
> §10 checklist), `01` (§7 recarimbo — a linha 15 já estava em `a6c1cd8a`), `10` (13 linhas de 22/09/2026 nos temas 4/6/7/8/13/14
> e §18 com #40–#53), `00-MAPA` (§5 `_accountTombstone.js` + guards da raiz; **§7 relido — estava parado em 10/09/2026 há
> três sincronizações**). Guards `docsManual` + `docsSemMentira` verdes (2 files / 10 tests), rodados numa worktree limpa
> em `a6c1cd8a` + o diff do manual — **na árvore compartilhada o item (a) reprova por `docs/reviews/2026-09-22-qa-rodada-2/`
> (untracked, de outra sessão, fora deste delta)**; quem fechar a rodada 2 indexa no MAPA §6.5.
> **Divergências novas:** nenhuma de código. **Observações:** `@capacitor/cli` continua em `dependencies` (o consolidado
> §3.4 dizia → `devDependencies`; não aconteceu em `a6c1cd8a`); `canScheduleExact`/`openExactAlarmSettings` sem chamador
> na UI. **Fora do delta, de
> propósito:** `09-HISTORICO` (sem linha nova para `a6c1cd8a`) e `11-GLOSSARIO` (os 9 termos da rodada já entraram em
> `a6c1cd8a`; "tier derivado" e "fila de oculto" não indexados).

> ## 21/09/2026 — sincronização do manual pós-merge `4a8b8049` (execução das respostas #11–#39)
>
> Delta `f02a3166..4a8b8049` (`42b07bec` + `4a8b8049`), `/manter-docs auto` feito inline pelo
> doc-mantenedor (redatores e verificador na mesma sessão, doc por doc, cada afirmação nova conferida
> por grep). **15 docs recarimbados:** `06-REFERENCIA/api-workers` (cortesia `action=grant`,
> `grantCourtesy`/`COURTESY_*`/`paidProviderOf`, `saveId` em `subscribe`/`fcm-subscribe`, varredura de
> push em `account.js` — corrigida a frase "hoje não escrevem `saveId`", que virou falsa em `42b07bec`),
> `utils` (`revokePushBeforeDelete`, `dias-completos-30`/`DIAS_COMPLETOS_PARA_CONQUISTA`/
> `gatilhoAntigoTasks100`, `FULL_UNLOCK_PRICE_LABEL_USD`, `saveId` em `notifications.ts`,
> `TERMS_NOTICE_SEEN`, ⚰️ `SettingsModal` nos "chamado por"), `components` (⚰️ `SettingsModal` no índice
> e nos chamadores, `NotificationManager.saveId`, `ErrorBoundary` + `FeedbackLink`, grupo Sobre da
> `SettingsPage`, item `termos` do `App.tsx`, 36 `useState`), `hooks-contexts-types` + `07`
> (`GameState.conquistasHerdadas`, 89 campos), `plugins-constants` (os dois guards de `src/deploy/`),
> `08` (§0 "produção é Worker → tudo secret", §1 `grant`, §2.10 credenciais `ENTITLEMENTS_ADMIN_KEY`/
> `COURTESY_MAX_ACCOUNTS`, §2.12 `scripts/metrics-report.mjs`, §2.13 push na exclusão, §3.3/§3.4
> `soulmon-debug`, `versionCode` 15, target 36, billing 6.2.1 `[a confirmar]`, §3.6 `cacheavel` 200),
> `05` (⚰️ 40 deps + 37 aliases, `depsVivas`/`orcamentoDeBytes` em §9, Android 15/1.1.4/36,
> `selector(&)` no `index.html`), `03` (§2.1 gate `selector(&)`, §3.2 item 6 `termos`, §4.23 Sobre com
> IA/feedback, §4.23a/§4.23b viraram lápide), `04` (gate de WebView em §10.2, ⚰️ `SettingsModal`), `02`
> (§46 cortesia, §56 banner sem re-aceite, §57-A herança, §58-A ⚰️), `01` (§3 18+ é ICP + primeiro
> usuário, §7 linha 16 vale para o cosmético, §10 as 29 respostas), `10` (18 linhas de 21/09/2026 nos
> temas 3/4/6/7/8/11/13/14/15, §17 `PLAY-FICHA`/`PLAY-LANCAMENTO`/`adr`/`plataforma`, §18 fila
> vazia), `12` (Medir é passo, `soulmon-operador` e `soulmon-guarda-plataforma` em §7/§9), `00-MAPA`
> (§3 linha de plataforma, §5 `scripts/`, §6.1 roster 37 com `arte-gerador`). Guards `docsManual` +
> `docsSemMentira` verdes (2 files / 10 tests). **Divergências novas:** nenhuma de código; o comentário
> do `vite.config.ts` diz "38 aliases" e o diff mostra 37 (`git diff f02a3166..4a8b8049 -- vite.config.ts
> | grep -c "^-      '"`); `src/security/oldWebview.test.ts` não exercita `selector(&)` sozinho.
> **Fora do delta, de propósito:** `11-GLOSSARIO` (termos "cortesia"/"dias completos 30" não indexados —
> o delta não o lista) e `09-HISTORICO` (sem linha para `42b07bec`/`4a8b8049`).

> ## 22/09/2026 — O DONO RESPONDEU AS 32 PERGUNTAS (#40–#71) E A SQUAD EXECUTOU
>
> Respostas literais em `docs/PERGUNTAS-DO-DONO.md` § "Respostas QA RODADAS 1 e 2". O que mudou:
> **Modelo de negócio (#55, decisão nova):** compra única R$ 29,90 (jogo + 11 formas) **+ assinatura de IA
> R$ 9,90/mês com 300 mensagens, só texto/voz** (chat melhor, sugestões, transcrição) — **sprite fica de
> fora**, porque imagem é o custo caro; estourou a cota, compra créditos; 1º mês de cortesia para quem
> comprou o desbloqueio. **Construir depois do E0.** Registro em `REGISTRO-DE-DECISOES.md` §5.4 com as duas
> alternativas que perderam e os gatilhos de revisão; `PLANO-PRODUTO` Parte 3 e `01-VISAO` §8 apontam para lá.
> **Regras de jogo (simulação 90 d, antes × depois):** 🌀 deixou de inflar `totalPerfectDays` (campo novo
> `missionPerfectDays` só para a missão; perfil só-masmorra caiu de 90 para **0** dias completos) · toast
> **"Desfazer" 5 s** com snapshot de 11 campos (`completionUndo.ts`, `UndoToast.tsx` com `role="status"` e
> alvo 44 — o `sonner` não dava nenhum dos dois) · `timesPerWeek` só cobra coração **se a semana fechar sem
> a meta** (perfil "3×/sem": 25 ♥ e 6 quedas → **0 e 0**) · a virada passa a julgar o **último dia aberto**
> (perfil que só abre seg/qua/sex: 0 dias completos em 90 → **38**, rookie → mega) · dreno de cocô com as
> travas da virada (save novo: 90 ♥ → **2**) · **uma virada completa antes de re-evoluir** (acabou a cura
> grátis: o ioiô sumiu, B foi de 9 para 8 evoluções) · os **6 `BondEvent` mudos** ganharam emissor (os 11 da
> tabela do §55 agora existem) · **Bits por dia completo (100) + teto de 150 Bits/dia de minijogo**: quem só
> cuida compra a loja em ~90 dias (era 0 Bits em 90), quem só grinda caiu de 3,9× para 1,5× a loja — a
> simulação mostrou que um teto por *runs* seria letra morta, porque o perfil já fazia 1 run/dia.
> **Privacidade/legal:** SteamID64 **apagado na exclusão** (#54 — e o resíduo em `consumedOrders`/
> `orderDetails` do `ent:` também) · encarregado LGPD nomeado na política §9 · plataformas declaradas
> (Android Chrome + desktop Chromium suportados; iOS e Firefox Android = melhor esforço) · tagline única
> **"Ela cresce com o seu dia."** em `index.html`, `manifest.json` e ficha, travada por contrato.
> **Infra:** **migrações D1 aplicadas em produção** (#65) — `0001` ok e `0002` marcada como aplicada porque a
> tabela já tinha `expires_at` (resíduo do `d1 execute --file` do README antigo); `PRAGMA table_info` = 4
> colunas, `migrations list` = "No migrations to apply" → **a 1ª compra da Play não dá mais 500** ·
> `POST /api/entitlements?action=rebirth-reset` (zera o teto vitalício de sprite no renascimento, com prova
> no save e idempotência) ligado no cliente · ADR-006 **aceita** (plano em `docs/PLANO-SAVE-SCHEMA.md`, sem
> implementar), 004/005 seguem Proposta até depois do E0 · symlinks `higgsfield-*` apagados do repo ·
> `E0-PREREGISTRO.md` e `E0-CONSENTIMENTO.md` **assinados**.
> **Continua com o dono:** `ENTITLEMENTS_ADMIN_KEY` + `COURTESY_MAX_ACCOUNTS=10` (#67 — sem isso a cortesia
> é 404 e o E0 não começa), `FIREBASE_SERVICE_ACCOUNT` no worker (#66 — FCM do APK mudo), **GitHub Actions
> parado por cobrança** (#48/#68). **Aberto por decisão:** teto do dia compartilhado entre virada e dreno, e
> o XP de comida fora da tabela do §55.
> **Portões:** `tsc` ×3 = 0 · `vitest` **354 arquivos, 4806 passed, 1 expected fail, 1 skipped, 4 todo** · `npm run build` ok. `CACHE_VERSION` v159 → **v160**. A dívida do JS de entrada foi RE-MEDIDA com justificativa (641 016 → 652 255 B: toast de desfazer + 6 emissores de vínculo), não perdoada.

> ## 22/09/2026 — QA RODADA 2 (completa, lentes rotacionadas + simulação do jogo) e suas correções
>
> 10 relatórios em **`docs/reviews/2026-09-22-qa-rodada-2/`** (consolidado `00-CONSOLIDADO.md`; fila do dono
> **#54–#71**; docs novos `E0-PREREGISTRO.md`, `E0-CONSENTIMENTO.md`, `orcamento-de-tempo.md`). A rodada
> atacou as correções da R1 e o que nenhuma rodada alcançou (simulação de 90 dias × 15 perfis, mutation test
> dos guards, inventário KV de 25 famílias, economia por unidade, o ar medido por `curl`/`wrangler`).
> **FATAIS achados e fechados no mesmo dia:** (1) a lápide da R1 bloqueava o PRÓPRIO e-mail por 30 dias
> (login → onboarding → 410 → wipe em loop) → `gateTombstone`: login com `auth_time` posterior à exclusão
> reabre; portão checa a lápide ANTES do onboarding; 410 agora em toda rota autorizada (community, sprite,
> entitlements, billing, IA, subscribe com saveId), cliente e desktop reagem (backup local em
> `CONFLICT_BACKUP`, `deletedAt` na mensagem); (2) **migrações D1 não aplicadas em produção** e
> `claimOrderAtomic` daria 500 na 1ª compra Play — o STATUS dizia "cai no caminho antigo" (falso) → só o
> dono aplica (#65); `catch` passou a engolir só violação de chave; (3) **free tier do Cloudflare estoura por
> escritas de KV em ~18 usuários/dia** (`_aiGuard` fail-closed → 503 no chat) → #64.
> **ALTOS fechados:** `pushidx` envenenável (saveId de inscrição só indexa autenticado; expulso é apagado;
> varredura quando índice cheio) · coop fora da exclusão (`_coop.js` › `coopLeave` no `delete-confirm`) ·
> exportação vazava `saveId` de terceiros (agora `pid`) · `pushProfile` só após save ok · `soulmonMeta` cru
> no hydrate derrubava a tela (fuzz de 89 campos × 14 valores hostis) · push das 22h BRT saía no D0
> (`ageDaysOf` em UTC; base `T03:00:00Z`) · 6 bloqueantes narrativos (tela de exclusão "vai sentir sua
> falta"/"porta aberta", ficha "se você se afasta, ela recua", booklet ovo/saudade, push "está te
> esperando", widget "partner") · voz do perfil D ("Me alimenta por favor!") migrada para `PET_VOICE_LINES`
> · trilha não pausava no sono automático/janela de descanso · `XP_PERFECT_DAY` nunca emitido ·
> `brand/design-system.md` era da Consultech360 e 2 agentes o carregavam como canônico · ack da compra
> só após `/api/billing` ok · `@capacitor/cli` → devDependencies (`npm audit --omit=dev` = 0) · cota de
> chat por tier (demo 30 / paid 120, provisório #55) · `orderDetails` nunca poda pedido pago · Ajuda com
> Termos, "(abre em nova aba)", `#en`, Firefox/Samsung fora do ramo WebView, `OfflineSeal` no onboarding,
> `onError` no sprite, hydrate de 3 campos crus, desktop com 410 e `exp` lido do JWT, frases de vigilância
> do overlay trocadas. **Mutation test:** 10 guards novos, nenhum tautológico; 2 buracos fechados
> (`fetch` cru a rota de IA; `semFomo` não varria `src/utils`). **Orçamento de tempo:** 4 casos do
> `ShopModal.canvas.render` em dívida nomeada. **Flakiness:** 3 rodadas, 0 oscilação.
> **Regras de jogo (simulação):** só o que contradizia a doc foi corrigido; o resto virou #57–#63
> (virada julga só ontem → perfil 3×/sem que só abre nesses dias = 0 dias completos; queda = cura grátis;
> Glitchtama = 51 % dos dias completos do perfil B; quem só cuida = 0 Bits em 90 d) com `it.todo`.
> **Ar medido (22/09):** produção = `a6c1cd8a`; `METRICS_ADMIN_KEY` ✅ definida (o §3.2 estava velho);
> `ENTITLEMENTS_ADMIN_KEY` ausente; worker de push deployado 21/09 mas sem `FIREBASE_SERVICE_ACCOUNT`;
> GitHub Actions **ainda parado** (260 runs falhando desde 16/09).
> **Portões:** `tsc` ×3 = 0 · `vitest` **351 arquivos, 4758 passed, 1 expected fail (GET renova TTL × POST — ADR-004), 1 skipped, 10 todo (regras #57–#63)** · `npm run build` ok · `npm audit --omit=dev` 0. `CACHE_VERSION` v158 → **v159**.

> ## 22/09/2026 — QA RODADA 1 (completa, todas as squads + SQUAD-Alpha) e suas correções
>
> 13 relatórios em **`docs/reviews/2026-09-21-qa-rodada-1/`** (consolidado `00-CONSOLIDADO.md`; fila do dono
> **#40–#53** em `PERGUNTAS-DO-DONO.md`). Três FATAIS novos: (1) **GitHub Actions parado por cobrança desde
> 16/09** — 339 runs falhando em segundos, nenhum portão de CI rodou desde então; produção não caiu porque o
> Cloudflare deploya sozinho (só o dono: `github.com/settings/billing`); (2) **`billing-ktx` 6.2.1 recusada pela
> Play** (v6 desde 31/08/2025, v7 desde 31/08/2026 — deprecation-faq) → **8.3.0** + `BillingPlugin.kt` na API
> nova (compile só o CI prova — e o CI está parado); (3) **a política negava envios de texto ao Groq que o
> código faz** (`customKeywords`, humor, nome da tarefa em Decompor, `soulGoal` pré-preenchido no tutorial) →
> declarados (§2b/§6 reescritos, hints nas telas, guard `src/ia.camposEnviados.contract.test.ts` fecha a
> fronteira); `TERMS_VERSION`/`PRIVACY_VERSION` **2026-09-22** (mudança material).
> **Corrigido:** `auditRefunds` derivava `tier` por pedido e derrubava a cortesia no reembolso da Play → tier
> derivado de `paidProviderOf` (cortesia sobrevive, #40 provisório) · exclusão de conta reordenada (tombstone
> `del:done:` 30 d + `save.js` **410**, sprites `sprite:img/lock/blob` apagados, save por último, índice
> inverso `pushidx:<saveId>` em vez de varrer o namespace) · cliente do 410 (`reagirContaExcluida`) · `FCM_TOKEN`
> só sai do aparelho após `res.ok` · `confirmDelete` com teto de 8 s · `handleGrant` recusa `saveId` não-string
> · telemetria em aba oculta vai para fila `soulmon-telemetry-hidden` em vez de morrer (`day_active` na virada) ·
> `?src=convite` (`app_open.source` 4, servidor e leitor) · `week_active.active_days` agregado · push **D0 = nulo**
> · `minimizeForAi` cobre CEP/data/celular curto · `chatSafety` normaliza acentos e cobre EN coloquial,
> `bridgeReply` EN cita findahelpline · gate de WebView com ramo Android (links Play) × não-Android, `lang`, mailto ·
> `TermsUpdateBanner` diz qual doc mudou, `region`, "(abre em nova aba)", "Entendi" · `APP_VERSION` única
> (`__APP_VERSION__` ← `package.json` 1.1.4 = `versionName`; contrato `versaoUnica`) · feedback em Ajuda ·
> Sobre declara sons/sem revisão humana/não é emergência · `manifest.json` sem copy do fork · alarme exato com
> `canScheduleExactAlarms()` + fallback · widget sem "I miss you" (L11) e `petName` = `soulmonDisplayName` ·
> desktop `exp` ilegível = agora+1h · termos §8 fiel às duas camadas, §4 cortesia, US$ redação A · `PLAY-FICHA`
> sem L2/L11 no fecho, título EN próprio · `PLAY-LANCAMENTO` §A.0 (Actions) e §G (Billing 8) · ledgers WP1.14/
> WP3.4 corrigidos de verdade · LV #15 virou teste (`copy.semFomo`) · ADR-004..006 promovidas como Proposta ·
> glossário/histórico atualizados · `CACHE_VERSION` **v158**.
> **Testes novos:** ~150 (grant, pushScan, deleteConfirm, pushidx, tombstone, webview gate, convertToWebp,
> swCacheavel, conquistas, ia.camposEnviados, versaoUnica, manifest, billingPbl8, widgetNome, semFomo…).
> **Depende do dono:** GitHub billing (#48), #40–#53, e o compile Kotlin só o CI prova.

> ## 21/09/2026 — EXECUÇÃO das respostas do dono, etapas 4 (limpeza) e 6 (Play)
>
> **#37** `SettingsModal` apagado (prop `onOpenAISettings` saiu da cadeia App → CompanionHUD → ChatBox).
> **#30** `tasks-100` → `dias-completos-30` (`totalPerfectDays ≥ DIAS_COMPLETOS_PARA_CONQUISTA`); herança única no
> load por `conquistasHerdadas` (`hydrateSave`); arte do emblema renomeada, ainda desenha "100" — squad-arte.
> **#33** 40 dependências sem import removidas (26 `@radix-ui/*`, `hono`, `recharts`, `vaul`, `cmdk`,
> `@jsr/supabase__supabase-js`…; 11 sobram); 37 aliases mortos do `vite.config.ts`; guard
> `src/deploy/depsVivas.contract.test.ts`. **#32** `scripts/convert-to-webp.mjs` reescreve as referências
> `.png` → `.webp` em `dist/` e só então apaga os PNG (o SW NÃO cobria a 1ª visita nem `fetch()` cru):
> `dist/` **123 MB → 24 MB**, provado no `vite preview` + Chrome. **#31** guard
> `src/deploy/orcamentoDeBytes.contract.test.ts` (JS entrada ≤ 250 KB, CSS ≤ 100 KB, imagem ≤ 400 KB, vídeo
> ≤ 800 KB) com a dívida atual nomeada: `index.js` 641 KB, `index.css` 143 KB, `evolution-bg.mp4` 3,9 MB,
> `intro.mp4` 2,5 MB — reprova arquivo novo acima do teto ou dívida que cresce.
> **Achados colaterais consertados:** `public/sw.js` › `cacheavel` exigia só `res.ok` e um 206 do `.mp4`
> estourava `Cache.put` (agora `status === 200`); shebang em `scripts/metrics-report.mjs` derrubava
> `tests/metricsReportFunil.test.ts` (regra da memória: sem shebang em `.mjs` importado por teste);
> `PLAY-DATA-SAFETY.md` §2.3/§3 ganharam Higgsfield + Gemini (a review 11 tinha apontado e a etapa 2 só
> fez §2.7/§3b).
> **#16 Play (etapa 6):** `docs/PLAY-FICHA.md` (ficha PT/EN completa, IARC, declaração de IA, pedidos de
> arte para os 8 screenshots + feature graphic) e `docs/PLAY-LANCAMENTO.md` (checklist §A–§I do console,
> passo a passo com URL, o que colar, critério de "feito", etiquetas `[dono digita segredo]` /
> `[submissão: confirmar]` / `[squad pode dirigir o Chrome]`). Android: `versionCode` 15 / `1.1.4`,
> `compileSdk`/`targetSdk` 36 (`[verificar no android-build.yml do CI após o merge]`), artefato
> `soulmon-debug-<sha>`; `billing-ktx` fica em 6.2.1 porque `BillingPlugin.kt` usa
> `enablePendingPurchases()` sem argumento (7.x quebra) — `[a confirmar no Play Console]`. Achado do
> operador: produção é **Worker**, não Pages — variável comum do painel some a cada deploy, então o checklist
> manda tudo como `wrangler secret`.

> ## 21/09/2026 — EXECUÇÃO das respostas do dono (#11–#39), etapas 1–3 e 5
>
> Cinco frentes em paralelo sobre a mesma árvore, arquivos disjuntos, um commit no fim.
> **Primeiro usuário (etapa 1):** rota de cortesia `POST /api/entitlements?action=grant`
> (`ENTITLEMENTS_ADMIN_KEY`, fail-closed 404; `COURTESY_MAX_ACCOUNTS`, padrão 25; `provider:'courtesy'`,
> idempotente — `grantCourtesy` em `_entitlements.js`, 8 testes) · `scripts/metrics-report.mjs`
> (funil da semana; exit 2 sem `METRICS_ADMIN_KEY`) · aviso de WebView velho por
> `CSS.supports('selector(&)')` (Chromium < 112; `index.html`, hash novo na CSP) · feedback in-app
> (`FeedbackLink.tsx`: Sobre + `ErrorBoundary`) · aviso de IA em Configurações › Sobre ·
> `TermsUpdateBanner` + `termsNotice.ts` (#24, banner, nunca re-aceite; `STORAGE_KEYS.TERMS_NOTICE_SEEN`) ·
> exclusão de conta revoga push (cliente chama os DELETE; servidor apaga `push:*`/`fcm:*` por `saveId`,
> que as inscrições passam a gravar — `NotificationManager` recebe `saveId`).
> **Legal (etapa 2):** termos §8 reescrito (IA sem revisão humana, não é emergência, CVV 188/findahelpline)
> · EN §4 em `US$ 6.99` (`FULL_UNLOCK_PRICE_LABEL_USD`; ⚠️ conversão do `PLANO-PRODUTO`, confirmar no Play
> Console antes da 1ª venda) · política §8 (o que a exclusão apaga; `ord:` 5 anos) · `PLAY-DATA-SAFETY.md`
> §2.7 token FCM = ID "Sim", §3b conteúdo de IA · `Attributions.md` com fontes e arte de IA por lote.
> **Docs (etapa 3):** `CLAUDE.md` 7 afirmações + 2 refs `arquivo:linha` corrigidas · 10 fósseis da raiz →
> `docs/historico-digiapp/` com lápide, `README.md` novo · `docs/adr/ADR-001..003` · `product/soulmon-01`
> e `docs/adr` no MAPA · REGISTRO: Camada 3 congelada (10 usuários × 14 dias), 18+ é ICP, cobrança web
> depois · `vetos.md`: exceção da #20, veto de `'tasks-100'` · LEDGER 87 WPs, WP1.14 RECUSADO, WP3.4
> IMPLEMENTADO, 8 comandos de aceite vivos.
> **Roster (etapa 5):** 64 → **37** agentes (`13-governanca-agentes.md` §8 aplicado): saíram 9 genéricos,
> `prod-squad` do repo, maestro + 12, `/revisao-soulmon`, 4 skills higgsfield; 6 `arte-*` → `arte-gerador`;
> cartógrafo/curador viraram procedimento; nasceram **`soulmon-operador`** (git × ar) e
> **`soulmon-guarda-plataforma`** (Android/desktop/EN/a11y, ledger `plataforma.md`). Tabela do coordenador
> e hook atualizados.
> **Portões:** `tsc` ×3 = 0 · `vitest` 311 arquivos, 4266 passed, 1 skipped · build ok · `CACHE_VERSION`
> v156 → **v157** · guards do manual verdes (3 módulos novos com entrada em `06-REFERENCIA`).
> **Depende do dono:** `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS` e `METRICS_ADMIN_KEY` no painel do
> Pages (#18); 1 h com profissional na trava de crise (#20). **Fica para a etapa 4:** `SettingsModal`,
> deps mortas + guard, PNG do `dist/`, orçamento de perf como guard, `'tasks-100'`. **Etapa 6:** Play.

> ## 21/09/2026 — sincronização do manual pós-merge `f9faf7a7` (QA geral)
>
> Delta `9f4e5a7a..f9faf7a7`, feita inline pelo coordenador (sem despacho de redatores: as
> passagens tocadas são poucas e cada uma foi conferida por grep no código). 8 docs recarimbados:
> `02` §consentimento (versões `2026-09-21` + régua `consent.versoes.contract.test.ts`), `04`
> (`.sm2-chat-support` 12px; anti-flash lia `digiapp-theme`; §10.0 novo — `description`/Open
> Graph e a `og:image` como 4ª fonte do `appUrl.contract`), `08` (`android-build.yml` sem
> `version-b`), `10` §18 (a fila viva é `PERGUNTAS-DO-DONO.md`, #11–#39), `12` (hook conta a
> fila), `06-REFERENCIA/utils.md` e `desktop.md` (lápides), `00-MAPA` §6.5 (17 docs da review
> indexados). Guards `docsManual` + `docsSemMentira` verdes (2 files / 10 tests).

> ## 21/09/2026 — QA GERAL: 19 frentes em paralelo, "o que nunca foi analisado nem desenvolvido"
>
> Pedido do dono: pull, chamar todos os agentes/skills/squads, mapear tudo e atualizar tudo.
> Base `212da7d5` (pull limpo). Portões na base: `tsc` ×3 = 0 · `vitest` **303 arquivos, 4223
> testes, 1 skipped**. Consolidado e os 16 relatórios em
> **`docs/reviews/2026-09-21-qa-geral/`** (indexados no MAPA §6.5). Frentes: cobertura dos
> planos · inventário de código · suíte · segurança · arquitetura · perf/a11y · design system ·
> produto (maestro condensado) · guardas e linhas vermelhas · squads temáticas · compliance ·
> growth · governança dos agentes · verificação de docs · desktop/Android/workers/CI · métricas,
> mais um passeio de runtime no dev server.
>
> **O que ninguém tinha olhado** (consolidado §2): operação do que está no ar (deploy manual do
> worker, migração D1, secrets — `e90f05a6` não é SHA do git, é id do Cloudflare; a versão no ar
> é desconhecida) · `android/` e `desktop/electron/*` com **zero teste** · `scripts/` sem dono e
> com 5 órfãos · `product/soulmon-01/**` (30 arquivos) fora do índice · ADRs 001–003 fora do git
> · Supabase residual · i18n EN como disciplina · leitor de tela nunca medido · orçamento de
> performance inexistente · custo em dinheiro sem vigia · 12 temas de arquitetura sem ADR ·
> ads recompensados no código contra o briefing · 7 áreas do sistema de agentes sem dono nenhum.
>
> **Corrigido na rodada** (consolidado §3): `termos.html` §4 PT vendia "cura na hora" e reroll
> "sorteado" (ambos removidos em 06/09) e §3 descrevia a idade errada; `privacidade.html` não
> citava Higgsfield/Gemini (recebem o prompt do sprite, com texto livre do jogador) e **não tinha
> o §2b em EN**; `consent.ts` gravava `PRIVACY_VERSION` de 25/08 para uma política de 08/09 —
> as três versões agora são `2026-09-21` e a régua nova `consent.versoes.contract.test.ts`
> compara com o "Última atualização" dos HTMLs; `.sm2-chat-support` 11px → 12px (piso do
> `04` §4.3); `index.html` ganhou `description` + Open Graph (tinha 0); `desktop/electron/main.js`
> tinha a mentira do "Pages" que o STATUS atribuía ao `config.ts`; hook de sessão lia um bloco
> de 09/09 e agora conta `PERGUNTAS-DO-DONO.md`; `/implementar-wp` ganhou o `tsc` do servidor;
> `android-build.yml` sem `version-b`; tabela do coordenador com linhas para perf/a11y,
> compliance e "git × ar"; §3.2 abaixo: o binding D1 **existe** (o STATUS dizia que não).
>
> **Mentiras apanhadas e NÃO tocadas** (esperam o dono): `CLAUDE.md` com 7 afirmações falsas
> (Coraçãozinho "à venda", "cura instantânea (10)", `digiapp_push`, `DigiWidgetPlugin`, `canPvp`,
> `DÍVIDA`, "17 documentos") — pergunta **#38**; fósseis da raiz (`README.md`, `PWA-*.md`,
> `PROJETO.md`, `PLANO_MELHORIAS.md`) — **#39**; ledger dos guardas com 2 falsos positivos
> (WP1.14, WP3.4) e 8 comandos de aceite mortos; linha vermelha #20 contradita por
> `widgetSemCobranca.contract.test.ts` — **#29**.
>
> **Fila do dono: 29 perguntas novas (#11–#39) em `docs/PERGUNTAS-DO-DONO.md`**, todas com
> provisório. As que destravam o primeiro usuário real: #11 (quem é), #12 (rota de cortesia),
> #18 (`METRICS_ADMIN_KEY`). Backlog que a squad executa sem ele: consolidado §6.

> ## 21/09/2026 — sincronização do manual pós-merge (`/manter-docs auto`)
>
> Base `15164e4c` → head `3cb89e59`. O manual **já cobria** o trabalho da rodada
> de narrativa (medido: bíblia, régua `narrativa.contract`, cláusula SAFETY,
> `findahelpline` e a classe `sm2-chat-support` aparecem nos docs certos,
> incluindo `06-REFERENCIA/components.md` e `api-workers.md`). O delta real era
> um commit, e o `doc-verificador` fechou a verificação com os três guards
> verdes.
>
> **O que estava falso e foi corrigido:**
> - `01-VISAO` §7 dizia que as propostas de narrativa estão "isoladas na §14 da
>   bíblia" — elas saíram para `docs/NARRATIVA-PROPOSTAS.md` em `e98fd2b7`, e
>   seis das dezesseis já estão fechadas;
> - o bloco da 4ª rodada do STATUS afirmava que o `CLAUDE.md` ainda diz
>   "S1..S13": falso desde `15164e4c`. Ganhou ⚰️;
> - `NARRATIVA-COPY.md` declarava duas linhas como "depende da P5", que o dono
>   fechou (§14.4);
> - os três testes do `narrativa.contract.test.ts` se chamavam "dívida" com a
>   constante já em `EXCECOES`;
> - **`docs/SOM.md` e `docs/HANDOFF-SOM.md` ainda diziam "S1..S13" e "zero byte
>   de asset"** — falso desde o S16 (medido: 5 `.webm` em `public/sounds/`,
>   `playComAsset` em 4 pontos). Corrigidos com a lápide.
> - e o `src/narrativa.contract.test.ts` tinha um **parágrafo duplicado no
>   próprio cabeçalho** (colisão de merge entre as duas rodadas) — o arquivo que
>   existe para impedir documentação que apodrece.
>
> **Fica aberta a D31, e legitimamente:** o `CLAUDE.md` ainda descreve a tabela
> do guard como `DÍVIDA` "por decisão pendente", quando ela virou `EXCECOES` por
> decisão tomada. Só o dono autoriza mexer no `CLAUDE.md` — a D32 vizinha só
> fechou porque houve essa autorização. Registrada em `02 §59`.

> ## 21/09/2026 — Manual sincronizado com `8d318529` (delta `5ac3d351..8d318529`, som)
>
> 10 docs de `docs/manual/` atualizados só nas seções que o delta tocou (S16, trilha de 2
> camadas, resposta ao A/B, chaves "Sons"/"Trilha" na `SettingsPage`) por 3 redatores e
> carimbados por 1 verificador (~50 símbolos, 9 shas, 5 arquivos/258 248 bytes, 4 bumps do SW
> conferidos por comando). Guards `docsManual` + `docsSemMentira` verdes. Novos: `02` §58-A
> "Som como regra", `03` §4.23b "Ajustes rápidos", `04` §9.1.1/§9.2.1, `06` entradas
> `sonsAssets.ts`/`trilha.ts`/`SettingsPage.tsx`. **Divergência que fica (D32):** `CLAUDE.md` › Áudio
> ainda diz "8 sons, todos sintetizados, zero byte de asset" e "S1..S13" — falso desde `ee79fd44`
> ⚰️ **fechada em `15164e4c`** (dono autorizou: `CLAUDE.md` › Áudio diz S1..S16, cinco arquivos,
> `sonsAssets.ts`/`trilha.ts`, chaves nas Configurações). `SettingsModal` segue sem gatilho vivo — candidato a remoção.

> ## 21/09/2026 — S16: som de IA INSTALADO ("só pra ter pronto") + trilha base ligável
>
> Decisão do dono, literal: *"Escolhe quaisquer um, só pra gente ter pronto. Depois melhoramos.
> Tenha toda parte de som pronta."* Entraram os assets em que o gerador **passou na régua**
> (`evolve`, `degenerate`, `task-complete`) e uma camada-base de trilha (`sonilo_music`, 30 s,
> 100 BPM, 1,88 cr); os cinco sons curtos seguem procedurais (o gerador reprovou neles) e os
> três com asset mantêm o procedural como **fallback**. **Codec = o Chrome** (MediaRecorder →
> WebM/Opus 48 kbps, decodificação conferida no mesmo motor): `E:/Soulmon-assets/som-01/
> codificar-opus.mjs`; trilha mestrada por `mestre-trilha.mjs` (mono, 12 compassos, crossfade,
> −28,00 LUFS-S / −19,53 dBTP / −31,75 LUFS int.). Total **188 031 bytes** em `public/sounds/`,
> zero em `PRECACHE_URLS`, `CACHE_VERSION` v150 → **v151**. Código: `src/utils/sonsAssets.ts`
> (manifesto + carga preguiçosa + `recortarSilencio` do pré-rolo), `src/utils/trilha.ts`
> (gesto liga/desliga, E0 em hidden/sono/mudo, retoma no 1º gesto da sessão se preferida),
> `sounds.ts` (`playComAsset`), `audioBus.ts` (`garantirBarramento`), switch "Trilha/Music" no
> `SettingsModal`, ganchos em `App.tsx` (`handleSleep`, `onToggleSound`). Régua nova:
> `sonsAssets.contract.test.ts` (S6 + S9 nas duas direções, 11 testes). **Provado no motor real**
> (dev server, Chrome): os 3 assets decodificam (1,159 / 0,669 / 0,179 s úteis) e tocam como
> buffer (0 osciladores); `playFeed` segue procedural; trilha liga/pausa/retoma/desliga.
> **Rodada 2 (mesmo dia, "resolva tudo"):** as duas sobras foram fechadas — o loop da trilha fecha em
> **28,800 s exatos** (12 compassos; o arquivo carrega 1 s de cauda e `loopEnd` fixa o ponto) e a trilha
> tem **duas camadas** (`base` + `ritmo`, `sonilo_music`, ambas mestradas no alvo sozinhas, em fase
> pelo mesmo `start(t0)`), com o trim medido da soma em `loudness.ts` (`TRIM_TRILHA_POR_CAMADAS_DB`,
> −2,024 dB). S6: as camadas a 32 kbps → **258 248 bytes** no total. A condição (1) da S13 (≥2
> camadas reais) está satisfeita; a máquina E0–E6 segue congelada (as duas tocam juntas, um estado).
> Provado no motor real: 2 camadas, `loopEnd` 28,8 nos dois buffers, desliga limpo. `CACHE_VERSION`
> **v152**. `8a930657` na `main`.
> **Resposta do dono ao A/B:** "Coloca o A" → aplicado literal (`c703c8bc`, `evolve.webm` saiu);
> perguntado, corrigiu: **"quero o gerado nos 3"** → `evolve.webm` voltou; os três eventos longos
> ficam com asset de IA. Escolha do dono, não protocolo. Registro na nota do §6.1. `CACHE_VERSION`
> **v154**.
> **Achado grave do doc-mantenedor, fechado (`980bc84c`):** o `SettingsModal` ("Ajustes rápidos")
> não tem gatilho vivo desde o canvas Conta — o mudo global e o switch da trilha eram
> **inalcançáveis pela UI**. As duas chaves ("Sons", "Trilha/Music") entraram na `SettingsPage`,
> grupo "Som"; `handleToggleSound` único no `App.tsx`; régua `settingsSom.render.test.tsx` (5
> testes, PT/EN, toque chega ao dono). `CACHE_VERSION` **v155**. O `SettingsModal` continua no
> código sem gatilho — candidato a remoção (não removido: fora do escopo do som).
> Portões: `tsc` ×3 · `vitest` **302 arquivos, 4217 testes** · `npm run build` ok. Registro:
> `REGISTRO-DE-DECISOES.md` §6.1 **S16**; `Attributions.md` com as linhas (5 depois da rodada 2) (hash, job, prompt,
> versão dos termos). **Sobra que fica:** o A/B cego (`E:/Soulmon-assets/som-01/ab/`) é quem
> decide se isso fica — o dono ainda não ouviu. ⚰️ (mesmo dia) "o loop perde ~48 ms" e "só a camada
> `base` existe" — as duas sobras foram fechadas na rodada 2, abaixo.

> ## 21/09/2026 — Manual sincronizado com `5ac3d351` (delta `dc72579e..5ac3d351`, 31 commits)
>
> 13 docs de `docs/manual/` atualizados só nas seções que o diff tocou (SQUAD-NARRATIVA
> 2ª–4ª rodadas, rodada 2 da squad-arte, SQUAD-SOM) por 7 redatores e carimbados por 3
> verificadores (1 devolução em `utils.md`/`welcomeBack` fechada com a evidência
> `f3654076`/§14.3). Guards `docsManual` + `docsSemMentira` verdes. **Divergências novas
> achadas na verificação (código/comentário, não tocadas):** o comentário de `contextBlock`
> em `functions/api/chat.js` afirma "frase idêntica no 2º e no 40º dia" e diz que a
> superfície de suporte "depende do dono" — `welcomeBack.ts` faz faixas por `absenceBucket`
> e o suporte existe desde `6ad2e629`; o cabeçalho de `src/utils/welcomeBack.ts` chama de
> "pendência" o que o §14.3 decidiu; `CONTEXT_SCHEMA.bond` é campo morto desde `01b649ce`;
> a cláusula SAFETY não tem teste; `docs/NARRATIVA-COPY.md` tem dois `## 8.`;
> `scripts-arte/derivar-rodada2.mjs` é citado como do repo mas vive em `D:\Soulmon\scripts-arte`;
> `CLAUDE.md` ainda diz `DÍVIDA` (é `EXCECOES` desde `f3654076`) — segue aberta, é a D31 de
> `docs/manual/02-REGRAS-DE-NEGOCIO.md` §59; a metade "S1..S13" ⚰️ **fechada em `15164e4c`**
> (o `CLAUDE.md` diz **S1..S16**, e o registro vai até S16 desde `ee79fd44` — não existe S14).

> ## 21/09/2026 — SQUAD-SOM retomada: os 12 prompts gerados, A/B cego MONTADO e não ouvido, gate destravado (flake, O-5, O-7)
>
> `docs/HANDOFF-SOM.md` executado. Dono respondeu as 3 perguntas do §3 em modal (gerar em
> `E:/` e instalar se a IA vencer · declarar IA na loja · manter S11/S12). `pacote-prompts.md`
> §0 rodou de ponta a ponta: **480,95 → 443,35 cr**, custo medido **2,5 cr/geração**, plano pro
> = **3 jobs concorrentes**, fila do gerador de 4 a 30 min. 12 prompts literais gerados
> (+1 duplicata acidental de `presence`, +2 regenerações) e pós-processados: **12 APROVADOS, 3 RECUSAS**
> de crista (`transaction` ×2 — conflito prompt "click" × limite de 6 dB —, `end-zero` na 1ª, aprovado na
> 2ª) e **4 com ganho > 20 dB** depois do corte (`presence` ×2, `shower`, `sleep` — o corpo do som
> ficou fora da janela; volta ao produtor). **Rodada v2 (decisão do dono em modal):** cláusula de
> duração no fim do prompt fez o gerador devolver 0,200 s exatos, mas quase mudo (ganho +22 a +40 dB);
> `transaction` sem click recusado pela **3ª** vez. Achado: o `seed_audio` não entrega os sons curtos e
> secos (Cuidado ×3, Transação) dentro da spec — provisório = ficam procedurais (`PERGUNTAS-DO-DONO.md`
> #10). Saldo final **429,35 cr** (19 gerações × 2,5 + 1 duplicata). Tudo em
> `E:/Soulmon-assets/som-01/` (`MANIFESTO.md`, cópia em `squad-alpha-runs/som-01/prototyper/`):
> **nenhum byte de áudio entrou no repo**, `Attributions.md` intacto, `CACHE_VERSION` intacto.
> **A/B cego** dos 3 pares montado pelo `ab-piloto.md` §8.1 (Δ 0,00 LU, semente 20260921,
> mapa cego separado, `escuta.html`) — **o dono escolheu fechar sem ouvir**: S10 intacta, premissa
> segue não medida (registro §6.1, nota de 21/09; `PERGUNTAS-DO-DONO.md` #8–#9).
> **Engenharia fechada** no arnês local: o flake "1 em 11" foi **reproduzido na 1ª execução
> instrumentada** ("Chrome nao expos aba pelo CDP" — porta `9500 + pid % 400` escolhida antes de
> o Chrome subir) e consertado lendo `DevToolsActivePort` com `--remote-debugging-port=0`;
> diagnóstico persistido em `prototyper/diagnosticos/`; O-5 (cortados fora da amostra,
> `MATERIAL_DE_TESTE` explícito, 48 → 46 renders) e O-7 (AC-1 varre todos os renders,
> `FORA_DO_AC1` com motivo e auto-auditável). **11 execuções, 11 verdes, 0 retries.** Limite que
> fica: baseline de `discovery/baseline-wav/` é captura da Fase 0 (`docs/SOM.md` §7).
> Portões: `tsc` ×3 exit 0 · `vitest` **301 arquivos, 4206 testes** · sem mudança em `src/`
> (build não rodado de propósito: nada a embarcar).

> ## 21/09/2026 (4ª rodada) — a copy da bíblia está em tela (`docs/NARRATIVA-COPY.md` §1–§6-bis)
>
> `staff-frontend` aplicou a tabela inteira menos cinco linhas registradas
> (`NARRATIVA-COPY.md` §8): `a2ded861` (voz da criatura — seis `kind` novos em
> `PET_VOICE_LINES`: `full`, `healCap`, `steady`, `sleep`, `wake`, `residue`;
> as duas famílias inline do `CompanionHUD` saíram; dormir/acordar e a borra
> deixaram de ser mudos), `84ae4937` (relatório do dia, evolução, cerimônias,
> fendas — inclusive a linha do nó, porque a P5 foi decidida), `5b91717c`
> (grupo **"Sobre"/"About"** no `SettingsPage` com os três limites da §16 —
> **L10 deixa de estar violada** —, abertura do `HelpModal`, `moodSummary` sem
> afirmar sobre a pessoa, recusas `not-ultra`/`already-used` do renascimento),
> `397899a4` (dist, `CACHE_VERSION` v150). `tsc` limpo; `vitest` 301/301
> arquivos, 4206 testes. **Não aplicadas, por decisão de outro dono:** §2.2
> (conflita com o piso sóbrio da §2.4), §2.7 (decisão 3: faixas ficam), §3.6
> `sprout`/`sapling` (já cumprem L12), §5.5 (EVO-20: `UnlockNudge` sem frase),
> texto de crise nas Configurações (já mora no `ChatBox`).

> ## 21/09/2026 — Manual sincronizado com `dc72579e` (delta `2580b73a..dc72579e`, 92 commits)
>
> 15 docs de `docs/manual/` reescritos só nas seções que o diff tocou (Fase 2
> identidade, squad-arte, widgets/overlay/push, bíblia narrativa), cada um
> verificado símbolo a símbolo e carimbado em 21/09/2026. Divergências novas
> registradas nos próprios docs: `CLAUDE.md` ainda diz "três personagens
> prontos" (são 6), `bitsStyleLight` "por tema" (idêntico), `setImageViewResource`
> confiável (hoje é fallback), `pet_grid.xml` (morto), `PlayCard`/`playLog` (sem
> consumidor desde `f5ead7c0`); cabeçalhos de `achievements.ts`/`emblemArt.ts`
> dizem 8 emblemas (são 9); cabeçalho de `gainArt.ts` diz "sem chamada" mas
> `evolutionBurst` já é desenhado pela cerimônia. `src/components/PlayCard.tsx`
> é candidato a remoção.
>
> ## 20/09/2026 — Fase 2 (identidade) FECHADA: 14 canvases aprovados e implementados na `main`
>
> Sistema + 13 fluxos (Home, Atividades, Rituais, Onboarding-funil, Pet,
> Evolução, Jogos, Loja, Estatísticas, Social, Conta, Fora do app,
> Onboarding-Oráculo), cada um com duas rodadas de crítico
> (`docs/design/wireframes/<fluxo>/identidade/{README,CRITICA}.md`) e checkpoint
> em `docs/design/DECISOES-WIREFRAME.md` §18–§31. Código: `PixelKit`/`FormKit`/
> `Viewport`/`MiniGlass`/`RitualDialog`/`SpriteAnim`/`VisorBar`, tokens `--sm2-*`,
> Material Symbols em subset — a tese "O Visor" (pixel só dentro do vidro) vale
> em todas as superfícies, inclusive widgets Android, overlay Electron e push.
> Arte da `squad-arte` instalada (cenários, pet-box, placeholders âmbar v4,
> emblemas, marca vetorizada). `tsc` ×3 limpos; `vitest` 299/299 arquivos
> (os guards `docsManual.contract` e `supabase.contract` voltaram a passar
> nesta sessão — MAPA completado; worktrees velhos removidos).
>
> **DEPENDE DO DONO:** `docs/PERGUNTAS-DO-DONO.md` — 7 itens (arte pendente da
> rodada 2, `bg-gameboy`, largura do `UnlockNudge`, correção do `CLAUDE.md`,
> deploy manual do worker de push, bump do `CACHE_VERSION`, branches órfãs).
>
> ## 21/09/2026 (3ª rodada) — o dono decidiu as quatro pendências da narrativa
>
> Registro canônico, com alternativa que perdeu e gatilho de revisão, em
> **`docs/REGISTRO-DE-DECISOES.md` §14**. Resumo:
>
> 1. **A marca `Soulmon` FICA** — *"o nome é do nosso app e personagens
>    próprios, não da Bandai"*. A medição que existia na hora de decidir está
>    registrada junto (há uma criatura da Bandai com esse nome, verificada na
>    enciclopédia oficial), **não para reabrir, mas para nenhuma sessão futura
>    tratar como novidade**. Gatilho: comunicação formal de titular ou de loja.
> 2. **A trava de crise ganhou caminho**: `findahelpline.com` (resolve por país)
>    + CVV 188 · 988 · 116 123, numa lista **curada e estática** no `ChatBox`.
>    A lista NUNCA sai do modelo — um 8B alucina telefone, e número errado em
>    tela de crise pune quem teve a coragem de pedir ajuda.
> 3. **O reencontro continua por FAIXAS** (WP2.7 mantido). As frases que
>    encenavam espera já tinham saído; a estrutura fica. Consequência declarada:
>    a saudação de retorno é a **única** exceção ao sensório, porque é voz do
>    PRODUTO lendo o save, não a criatura lendo tempo.
> 4. **Os nomes de PI ficam todos** (*"nenhum, aceito todos assim"*):
>    `Vírus/Dado/Vacina`, `Glitchtama`, `Serah`, `Pyraka`, `Zeed`.
>    `Ruptura/Trama/Guarda` viram vocabulário de MUNDO, não rótulo de UI. A
>    régua `src/narrativa.contract.test.ts` foi reescrita de `DÍVIDA`
>    (pendência) para `EXCECOES` (o que ficou, por decisão) — e continua
>    travando o que nunca foi aceito (`tamer`, `domador`, `treinador`,
>    `digievolução`, `mundo digital`) e o espalhamento para arquivo NOVO.
>
> **Aberto, e não depende do dono:** os três limites da §16 no guia e no Sobre
> (a L10 segue violada nessas duas telas — território da sessão de design) e o
> caminho determinístico de crise no servidor, que é a única peça testável e que
> o parecer clínico recomendou para a rodada seguinte.

> ## 21/09/2026 (2ª rodada) — SQUAD-NARRATIVA, régua executável e a trava de segurança do chat
>
> **O achado mais grave da sessão não é de narrativa.** `functions/api/chat.js` é
> a única superfície onde a pessoa escreve texto livre e íntimo, para uma
> entidade que o produto declara ser a alma dela, respondida por um modelo de 8B
> sem revisão humana — e o bloco `NEVER` não dizia **uma palavra** sobre
> autolesão. Pior: a persona é definida como alguém que **sofre quando a pessoa
> não cuida dela**, então um modelo pequeno instruído a ser carinhoso produz, com
> probabilidade real, alguma variante de *"não faz isso, e eu?"* — culpa como
> dissuasor, que é o conteúdo de "sou um peso" na forma mais direta que este
> produto consegue gerar. A cláusula **SAFETY** entrou e proíbe isso
> nominalmente; a superfície de suporte entrou **na tela do chat** (`ChatBox`),
> porque quem está mal às 2h não navega até Configurações.
> ⚠️ **Honestidade sobre o alcance, escrita no arquivo:** instrução de prompt é
> probabilística. O caminho determinístico (casar no servidor ANTES do Groq e
> devolver string curada) é a única peça testável e está **recomendado, não
> feito**.
>
> **Régua executável:** `src/narrativa.contract.test.ts` trava o vocabulário
> vetado em fonte, com uma tabela `DÍVIDA` que só pode encolher, e exige que todo
> caminho de código citado na bíblia exista. Verificada por mutação.
>
> **SQUAD-NARRATIVA:** `soulmon-loremaster`, `soulmon-narrative-critic`,
> `soulmon-copy-redator`, a skill `/squad-narrativa` e o roteamento no
> coordenador. A bíblia cresceu para a camada ecológica (biologia, 17 elementos,
> 9 reinos, eras) e as propostas saíram para `docs/NARRATIVA-PROPOSTAS.md`.
> `docs/NARRATIVA-COPY.md` traz 66 linhas de copy PT+EN, e é recomendação — nada
> foi aplicado em tela, para não colidir com a sessão de design.
>
> **A crítica adversarial reprovou a rodada e estava certa.** Três achados que
> valem registro, todos medidos no código:
> - **`lowHp` diz "Tô com saudade. Como VOCÊ está?" e dispara quando o HP caiu** —
>   ou seja, no dia em que a pessoa não cumpriu a meta. Emoção da criatura
>   causada pelo que a pessoa deixou de fazer, no pior momento. Mais quatro
>   famílias de fala no mesmo caso: viraram a tabela `DÍVIDA` da §5.10;
> - **`welcomeBack.ts` escolhe a saudação POR FAIXA DE DIAS** ("Quanto tempo!",
>   "Eu estava aqui, esperando") — a contagem de ausência que a L6 proíbe, num
>   arquivo cujo próprio comentário diz que isso é "cobrança com roupa de
>   saudade";
> - **`MILESTONE_TEXT.tree` viola a L1 no ar**: "virou parte de quem você é".
>
> **⏳ DEPENDE DO DONO (§3):**
> 1. **P8 — a marca `Soulmon` é nome canônico de uma criatura da Bandai**
>    (Champion, Fantasma, atributo Virus), verificado na enciclopédia oficial.
>    Precede tudo; pede anterioridade (INPI/USPTO) e revisão jurídica antes de
>    qualquer loja. A bíblia não depende disso — o mundo se chama **a Malha**.
> 2. **Se entra diretório externo de linhas de apoio** (ex.: findahelpline) e
>    quais serviços locais são nomeados. O texto curado já está no `ChatBox`, sem
>    telefone — um modelo de 8B alucina número, e número errado em tela de crise
>    pune quem pediu ajuda.
> 3. **Classificação etária.** A §16 já devolvia isso; o achado do chat torna
>    urgente, porque parte do público real é adolescente.
> 4. As 16 propostas de `docs/NARRATIVA-PROPOSTAS.md`, com destaque para as de
>    PI (P9 Serah/Pyraka, P10 Zeed, P1 os três galhos).
>
> **Aberto para a próxima rodada, sem depender do dono:** os três limites da §16
> no guia e no Sobre (a L10 segue violada nessas duas telas — território da
> sessão de design); o caminho determinístico de crise no servidor; e a troca das
> cinco famílias de fala da `DÍVIDA` da §5.10.

> ## 21/09/2026 — Universo narrativo: a bíblia nasce, com três pareceres em cima
>
> `docs/NARRATIVA-E-UNIVERSO.md` (novo, vivo, indexado no `00-MAPA.md`): premissa,
> doze leis de ESCRITA, cosmogonia que DERIVA o arcano-tech, persona, biologia,
> taxonomia, geografia, linha do tempo, tabela de ~34 mecânicas → significado →
> frase proibida, vocabulário PT+EN, voz e tom, os três limites (§16) e o
> checklist que reprova copy (§17). **Registro diegético na VOZ, declarado na
> MOLDURA** — decisão do dono nesta sessão, junto com: vocabulário próprio no
> lugar de Jung, e ressignificar o que existe em vez de propor mecânica (as 14
> propostas estão isoladas na §14). **Nenhuma regra mudou; nada de `src/`.**
>
> Três pareceres bloqueantes, todos aplicados: psicologia (o diegético total não
> tinha porta de saída; a premissa violava a própria L1; faltava dizer o que o
> app não é), PI, e o guarda de linhas vermelhas — **`APROVADO COM RESSALVA`**,
> ledger em `docs/plano-melhorias/ledger/vetos.md`. Do guarda veio a metade que
> costuma faltar: a bíblia **perdoava demais**. L4 proibia número que desce e
> nascia mentirosa sobre HP; L11 proibia a criatura reagir ao carinho, que é o
> retorno do loop central; e faltava a L12 — o mundo pode nomear o ATO, senão L1
> + L11 produzem um mundo indiferente, contra a tese que diz *encoraja*.
>
> **Duas afirmações da bíblia eram falsas contra o código, e as duas foram
> medidas:** `moodSummary` (`src/utils/mood.ts`) já devolve "…e tudo bem que seja
> assim", que é a normalização que a L9 proíbe (virou P14); e as faixas do
> Torneio vêm de pontos acumulados (`getTierStanding`), não de tempo de casa.
>
> **DEPENDE DO DONO (§3):** P8 — **`Soulmon` é o nome canônico de uma criatura da
> Bandai** (Champion, tipo Fantasma, atributo Virus), verificado na enciclopédia
> oficial em 21/09/2026. Nome exato, no gênero de produto em que a confusão é
> máxima, num app que também usa vírus/dado/vacina e a escada
> rookie→champion→ultimate→mega. Precede todas as outras propostas; pede busca de
> anterioridade (INPI/USPTO) e revisão jurídica antes de submissão a loja. A
> bíblia não depende do nome — o mundo se chama **a Malha**. Junto: `Serah` (FF
> XIII) e `Pyraka` (Bionicle) nas 9 linhas, `Zeed` nos prefixos de mega, e
> vírus/dado/vacina hoje visíveis em **7 famílias de superfície** — a pior sendo
> o texto do Ultra gerado em `oracle.ts`, na tela de revelação.

> ## 🎨 15/09/2026 — SQUAD-ARTE: todos os assets gerados e instalados (7 commits, `dd214688..005a2941`)
>
> Inventário medido (`docs/INVENTARIO-ASSETS.md`), fila com prompt por peça (`docs/ASSETS-A-GERAR.md`),
> 8 agentes `arte-*` + skill `/squad-arte`. Decisões do dono D1–D9 registradas no inventário §7.
> Instalado: Dino (arte própria + colisão por largura opaca), berço largo (caixa 220×104), 108 FX de
> elemento base + aura no Viewport da Evolução/Ficha, 45 sigilos (mapa, sem UI), 3 linhas novas
> (Igni/Nautilu/Astrase → 9 linhas, 6 personagens prontos), 25 cenários pintados (20 pet-box 1200×648 +
> dungeon-1..5 em pé), 8 emblemas + `achievements.ts`, placeholders egg/cocoon/glitch, HUD pixel (barra,
> segmento, moldura 9-slice), 7 spritesheets + `SpriteAnim` (coração, banho, sono, migalhas, cocô ligados),
> glifos do overlay desktop, e a MARCA do kit E:/logo vetorizada em tudo (favicons, PWA, launcher
> adaptativo, splash Android — era o X do Capacitor —, chama do #splash, `ic_notification`).
>
> **Depende do dono (§3):** H1 — escolher os nós da EvoArvore entre as 3 versões
> (`D:\Soulmon\_gemini_out\hud-20260915\H1-evoarvore-3-versoes.png`). Ver também: `bg-gameboy` fugiu do
> conceito "LCD chapado" (aceitar/regerar); os 3 `void` antigos (gameboy/matrix/ocean) agora têm chão — vale
> dar `slots` a eles no canvas da Loja.
> **Fechado depois (`a388ddb9`):** placeholder v3 (cristal da Home com o ser dentro) ligado na EvoArvore e no
> reveal; emblemas na Ficha; sparkle na evolução pronta; LCD refeito; entrega 2 instalada (`gainArt.ts`).
> **Dívida aberta:** barras pixel (D3) e `progress/` 4× esperam o canvas Sistema (as barras da Home são do
> aparelho, DOM); `gainArt`/`dust-step` sem chamada; ícones de categoria e `PixelKit` (botões PNG) continuam pixel FORA do
> visor — divergência a registrar no canvas Sistema/Atividades, não consertada aqui.
> **Ambiente:** `supabase.contract.test.ts` falha localmente por diretórios ignorados
> (`.claude/worktrees`, `coverage`, `android/app/build`) com JWT antigo — não é o repo; limpar as pastas.

> ## 🎨 15/09/2026 — FASE 2 (IDENTIDADE): PLANO VALIDADO COM O DONO — `docs/HANDOFF-IDENTIDADE.md`
>
> Antes de aplicar identidade, o dono validou o plano em modal (quatro escolhas):
> 1. **Canvas de identidade primeiro, código depois** — um canvas por fluxo em `docs/design/wireframes/<fluxo>/identidade/`; o `staff-frontend` implementa só depois.
> 2. **O canvas "Sistema" vem antes da Home** — tokens, tipografia e os átomos (botão, card, chip, folha, nav, Visor, campo, switch, foco).
> 3. **Escuro em todos os artboards; o claro só no `Main` de cada fluxo** (o AA dos dois temas é do token; o claro desenhado prova).
> 4. **Checkpoint do dono por canvas**, com o recorte 200×200.
> - Ordem: Sistema → Home → Atividades → Rituais → Pet → Onboarding-funil → Evolução → Jogos → Loja → Estatísticas → Social → Conta → Fora do app → Onboarding-oráculo.
> - Regras: sem reabrir estrutura; sem token novo (vira pendente); "O Visor" não se reabre; o canvas desenha a TESE onde o código diverge (pixel fora do visor em 28 `.tsx`, nav em Silkscreen 12px, `lucide-react`) e registra a divergência.
> - **Próximo:** `/squad-design identidade sistema`.

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `2580b73a` (o checkpoint final da meta — Fase 1 fechada)
>
> `/manter-docs auto` após o merge do checkpoint final (`a892f21a`→`2580b73a`, 1 commit). Delta em três docs:
> - `00-MAPA.md` §6.7 — 268 das 273 (`ONB-44`), o Oráculo com 12 artboards, os pendentes fechados (`doc-bibliotecario`).
> - `10-DISCUSSOES-E-DECISOES.md` — seis linhas novas no §11 (13.15–13.19 e o bloco 🧭), o preâmbulo e §17 com 13.1–13.19 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (nem a 13.18 nem a 13.19 tocam frase do doc; a divergência da 13.18 com o CLAUDE.md › Idioma está marcada no REGISTRO/STATUS).
> - Verificação: `doc-verificador`, tudo bate; carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `2580b73a`.

> ## 🧭 15/09/2026 — MODAL FINAL DA META AUTÔNOMA: OS 12 PENDENTES DO DONO RESPONDIDOS — A FASE 1 ESTÁ FECHADA
>
> Fim da meta "complete o trabalho em todos os canvas" (15/09/2026): os 13 canvases foram
> desenhados, criticados, corrigidos e aprovados por aprovação automática; as decisões de regra
> que surgiram foram aplicadas pela recomendação do lead e listadas para o dono, que respondeu
> tudo num único checkpoint (três modais). Resultado, por canvas:
> - **Estatísticas:** o "0" grande do primeiro uso fica **como o código** — a frase de contexto
>   `[novo]` (E4 da §13) foi **revogada** e o canvas republicado sem ela.
> - **Social:** "N days playing" **fica e vira regra** (13.15 — a única exceção a "nenhum número
>   por pessoa"; sai se virar ordenação); a lista de jogadores **fica lista** (T11 fechada).
> - **Conta:** a ordem da página de Configurações **fica como hoje**; `CONTA-13` **fora**, confirmado.
> - **Fora do app:** com zero feitas o widget **não mostra a linha do contador** e a energia do
>   overlay **nunca aparece "⚡0/5"** (13.16); o badge de pendentes **perde o dígito** (13.17); a copy
>   dos widgets é **só em inglês** (13.18 — ⚠️ diverge do `CLAUDE.md` › Idioma: a linha precisa
>   registrar a exceção); o widget E **sem piso** visual. Canvas republicado.
> - **Onboarding-oráculo:** o funil ganha um **reveal demo** (13.19 — o quiz de 6 para todos, a
>   oferta da 13.1 mora ali, a criatura própria só pagando) — a Fase 1 reabriu só para isso: um
>   artboard novo no canvas do Oráculo; e a 1ª pergunta do ritual **ganha "voltar"** `[novo]`.
> - **`REGISTRO-DE-DECISOES.md` §13:** 13.15 a 13.19. **`DECISOES-WIREFRAME.md`:** os `[pendente do
>   dono]` das §13–§17 viraram "Decidido pelo dono (15/09/2026, modal final)".
> - **Próximo:** a Fase 2 (identidade: tokens, tipografia, Visor) só sobre canvas `aprovado` —
>   `/squad-design identidade <fluxo>`, na ordem de frequência (Home primeiro). Antes dela, os
>   achados de código dos blocos de cada canvas são o backlog do `staff-frontend` (o mais urgente:
>   "Don't forget about me today!" viva no widget D; `hideMetrics` que não chega à `StatsPage`;
>   "0/5" no widget; a linha `CLAUDE.md` › Idioma para a 13.18).

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `accbe6fa` (wireframes do Onboarding-oráculo — Fase 1 completa)
>
> `/manter-docs auto` após o merge do Oráculo (`3955b8a1`→`accbe6fa`, 4 commits). Delta em três docs:
> - `00-MAPA.md` §6.7 — os treze fluxos, 267/272 em `aprovado` + 5 em `fora`, o Oráculo 13º, a §17 (`doc-bibliotecario`).
> - `10-DISCUSSOES-E-DECISOES.md` — duas linhas novas no §11 (decisão §17, o bloco 🔮), §13 e §17 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (o delta do doc era só o bloco de STATUS).
> - Verificação: `doc-verificador`, tudo bate (os 5 `fora`: LOJA-12, STAT-10, CONTA-13, PET-02, ONB-13); carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `accbe6fa`.

> ## 🔮 15/09/2026 — WIREFRAMES DO ONBOARDING-ORÁCULO: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS — A FASE 1 FECHOU OS 13 CANVASES
>
> Décimo terceiro e último canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/6dcb1aed-d52c-4c7c-ada1-c3de69f0de38**
> (11 artboards em 2 páginas; `docs/design/wireframes/onboarding-oraculo/`). 17 linhas `ONB-*`
> (21→33, 35→38) desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §17.
> **Com este canvas, as 272 linhas tela × estado do inventário estão em `aprovado` ou `fora`.**
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 a oferta do reveal (T1/13.1)
>   não desenhada; B2 a escala likert inventada; B3 a barra a 100%; B4 "1 = skip link" falso no
>   ritual; B5 o eco do `soulGoal` — aplicados; re-carimbo na r2), `soulmon-product-designer`
>   (9 achados), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA**, 0 vetos).
> - **Decisões estruturais**: o ritual passo a passo como o código (R1); a barra pela fórmula,
>   nunca 100% (R2); o reveal com o cartão, o batismo e o sem-sprite por D9 (R3); a oferta do
>   reveal desenhada por 13.1, condicionada a demo (R4); o upgrade e o skip link inexistente (R5).
> - **✅ Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono). **Pendente do
>   dono (modal final):** **T1/13.1 não tem piso no funil de hoje** (o reveal é do caminho pago; o
>   demo escolhe personagem) — o funil ganha um reveal demo? (recomendação do lead: sim); e o
>   "voltar" na 1ª pergunta do ritual.
> - **Achados de passagem (código):** a 1ª pergunta do ritual não tem `back` em lugar nenhum; o
>   `setTimeout(1400)` continua no 20º item do teste (só saiu do "revelar agora"); o muro de idade
>   zera até o nome num dígito trocado; "Hatch ‹nome›" e a copy do batismo idênticas no upgrade
>   (D17: é a mesma criatura); o reveal sem sprite não diz ao jogador que o desenho vem depois; o
>   ritual não estima o tempo; a favorita nunca é ecoada no reveal; não há skip link durante o
>   onboarding (o App só o monta após `hasCompletedOnboarding`) — vale para o funil também; T8
>   "problema 1" segue sem solução.
> - **Branch:** `design/wireframes-oraculo` — mergeada na `main` (ff). **Próximo passo: o modal
>   único com todos os pendentes do dono acumulados na meta autônoma; depois a Fase 2
>   (identidade), só sobre canvas `aprovado`.**

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `3955b8a1` (wireframes do Fora do app)
>
> `/manter-docs auto` após o merge do Fora do app (`d4ec208a`→`3955b8a1`, 5 commits). Delta em três docs:
> - `00-MAPA.md` §6.7 — doze fluxos, 250/272 em `aprovado`, o Fora do app 12º, a §16 (`doc-bibliotecario`).
> - `10-DISCUSSOES-E-DECISOES.md` — duas linhas novas no §11 (decisão §16, o bloco 📱), §13 e §17 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (o delta do doc era só o bloco de STATUS).
> - Verificação: `doc-verificador`, tudo bate; carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `3955b8a1`.

> ## 📱 15/09/2026 — WIREFRAMES DO FORA DO APP: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS (META AUTÔNOMA DO DONO)
>
> Décimo segundo canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/89cc5550-5b1a-4f2b-8929-759a4a68373b**
> (7 artboards em 3 páginas — widgets, overlay, pushes; `docs/design/wireframes/fora-do-app/`).
> 18 linhas `FORA-*` desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §16.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — 7 bloqueantes, todos no overlay:
>   a barra fixa 🔮 "Soulmon" + ⚙ _ ✕ e o cabeçalho "‹ + título" colapsados; um "Back" inventado;
>   quatro textos EN retraduzidos — aplicados; re-carimbo na r2), `soulmon-product-designer`
>   (7 achados), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA** — **veto ao CÓDIGO**:
>   "Don't forget about me today!" segue viva em `CHAT_FIXED_PHRASES`).
> - **Decisões estruturais**: os 5 widgets nos tamanhos reais (F1); o contador só com ≥ 1 feita
>   (F2, T2/13.2); a escada como o código com "Dia completo" (P5) e glosa EN `[novo]` (F3); o
>   overlay com as duas linhas reais e os textos literais (F4); os 7 pushes literais, pior caso
>   QUATRO num dia (F5). **Sai:** "Don't forget about me today!", "0/5", "Dia perfeito!", a das 21h.
> - **✅ Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono). **Pendente do
>   dono (modal final):** o "—" × remover a linha do contador com zero feitas; o badge de
>   pendentes do overlay; o piso da 13.7 na energia ("⚡3/5"); o idioma dos widgets pela bridge; o
>   widget E em HP crítico.
> - **Achados de passagem (código):** **"Don't forget about me today!" viva em
>   `WidgetRenderer.kt` (`CHAT_FIXED_PHRASES`)** — o veto de 02/09 não foi cumprido e o
>   `widgetSemCobranca.contract.test.ts` não a cobre; "0/5" com zero feitas (T2/13.2 por
>   implementar); "Dia perfeito!" no widget (P5 atrasada); a escada só PT e o chat só EN (o bridge
>   não leva idioma); A/B/D comprimem com `ellipsis` em vez de remover camadas (§12); overlay ×
>   push sem teste de paridade de copy; `pet-goodnight` (22h) e o lembrete de deitar (22h30) a
>   30 min; a linha `FORA-01` do inventário descrevia corações/energia que são do widget E
>   (corrigida).
> - **Branch:** `design/wireframes-fora` — mergeada na `main` (ff). Próximo (e último) canvas:
>   Onboarding-oráculo.

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `d4ec208a` (wireframes da Conta)
>
> `/manter-docs auto` após o merge da Conta (`cdb08165`→`d4ec208a`, 4 commits). Delta em três docs:
> - `00-MAPA.md` §6.7 — onze fluxos, 232/272 em `aprovado`, a Conta 11º, a §15 (`doc-bibliotecario`).
> - `10-DISCUSSOES-E-DECISOES.md` — duas linhas novas no §11 (decisão §15, o bloco ⚙️), §13 e §17 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (o delta do doc era só o bloco de STATUS).
> - Verificação: `doc-verificador`, tudo bate; carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `d4ec208a`.

> ## ⚙️ 15/09/2026 — WIREFRAMES DA CONTA: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS (META AUTÔNOMA DO DONO)
>
> Décimo primeiro canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/c5fba27a-548f-444c-890f-10f4d482229f**
> (14 artboards em 2 páginas; `docs/design/wireframes/conta/`). 25 linhas `CONTA-*` desenhadas
> (`CONTA-13` `fora` pelo precedente da D5; a Biblioteca já é o Social); decisão do design-lead
> em `docs/design/DECISOES-WIREFRAME.md` §15.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 o preço da Nova Leitura é
>   50, não 20; B2 o `ConfirmDialog` é um `ModalSheet` com × e `role="dialog"`; R1 "BRL" nos packs;
>   R2 19 termos — aplicados; re-carimbo na r2), `soulmon-product-designer` (9 achados),
>   `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA**, 0 vetos).
> - **Decisões estruturais**: os sete grupos por intenção (K1); a saída de dados na própria
>   superfície, 503 como estado (K2); a Janela de Descanso própria (K3); fidelidade de detalhe nos
>   modais (K4); CONTA-13 fora (K5). **Sai:** o `SettingsModal`, o ramo sem sensor, "Heal 1 heart".
> - **✅ Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono). **Pendente do
>   dono (modal final):** reordenar a página por prioridade (Rest Window P1 antes dos grupos P2,
>   Install no fim — recomendação do lead; hoje vale a ordem do código) e confirmar CONTA-13 fora.
> - **Achados de passagem (código):** `onEntitlementChange` nunca passado pela `SettingsPage`
>   (restaurar compras não atualiza o `gameState`); `aria-describedby` do 503 só no botão de
>   exportar; o `UnlockAccountModal` tem 2 ramos de corpo para 4 motivos (`report`/`shop` recebem
>   a copy da Evolução); o lembrete de deitar dispara o toggle GERAL de notificações; `accountTier
>   ?? 'paid'` (confirmar); "Soulmon 1.0.2" literal; recusar o diálogo nativo de instalar não
>   persiste; o ramo sem sensor do `StepsCard` é morto e `declined` não tem volta; o erro da Nova
>   Leitura persiste; sem teste para `AccountSection`/`RestWindowCard`/`StepsCard`/`InstallPrompt`;
>   o prazo de 15 min de apagar não aparece no inventário; "Default" da Personalidade não salva.
> - **Branch:** `design/wireframes-conta` — mergeada na `main` (ff). Próximo canvas: Fora do app.

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `cdb08165` (wireframes do Social)
>
> `/manter-docs auto` após o merge do Social (`0d49ab16`→`cdb08165`, 3 commits). Delta em três docs:
> - `00-MAPA.md` §6.7 — dez fluxos, 207/272 em `aprovado`, 13 fluxos na tabela, o Social 10º (D2), a §14 (`doc-bibliotecario`).
> - `10-DISCUSSOES-E-DECISOES.md` — duas linhas novas no §11 (decisão §14, o bloco 🤝), §13 e §17 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (o delta do doc era só o bloco de STATUS).
> - Verificação: `doc-verificador`, tudo bate; carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `cdb08165`.

> ## 🤝 15/09/2026 — WIREFRAMES DO SOCIAL: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS (META AUTÔNOMA DO DONO)
>
> Décimo canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/7abe2a04-90db-43f1-9d75-dd8a742f3ff0**
> (8 artboards em 2 páginas; `docs/design/wireframes/social/`). D2: a Biblioteca ganhou canvas
> próprio — `CONTA-26`→`CONTA-32` viraram `SOC-01`→`SOC-07` (nova §1.9a do inventário); decisão
> do design-lead em `docs/design/DECISOES-WIREFRAME.md` §14.
> - **Crítica:** `design-critic` (**PASSA** na rodada 1, zero bloqueante; 5 ressalvas aplicadas na
>   rodada 2), `soulmon-product-designer` (8 achados — os estados `aviso` dentro do grupo, `ocupado`
>   e `copiado` entraram; duas tensões de método viraram T10/T11), `soulmon-guarda-linha-vermelha`
>   (canvas inteiro, D2: **APROVADA COM RESSALVA**, 0 vetos).
> - **Decisões estruturais**: a Biblioteca com três abas e a linha de uma ação dominante (C1); os
>   quatro estados declarados + offline por D9 (C2); o perfil do outro é olhar (C3); o grupo com a
>   meta somada (C4); os estados que faltavam (C5). **Sai:** o `rank`, a escada no perfil do amigo,
>   cronômetro no presente, "quanto cada um fez".
> - **✅ Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono). **Pendente do
>   dono (modal final):** **T10** "N days playing" por pessoa — manter e formalizar no `REGISTRO`
>   §5.5 (recomendação do lead e do guarda, desenhada) / tirar; **T11** lista vertical × "árvore/
>   cena" do PRINCÍPIOS §10 — manter a lista (recomendação, desenhada) / encomendar a cena.
> - **Achados de passagem (código):** `branchLevels` calculado e nunca renderizado em
>   `PlayerDetailModal.tsx`; o comentário do mesmo arquivo cita "D13", que não existe em registro
>   nenhum (é a decisão 8b); `busyId` é por linha (tocar "remove" gira o presente); o
>   `LibraryPage` não distingue erro de sem rede (um `loadError` — o selo distingue); a 13.7 merece
>   uma linha cobrindo o contador SEMANAL de grupo ("0 of 20" do grupo sozinho).
> - **Branch:** `design/wireframes-social` — mergeada na `main` (ff). Próximo canvas: Conta.

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `5e4def10` (wireframes de Estatísticas)
>
> `/manter-docs auto` após o merge de Estatísticas (`932c927f`→`5e4def10`, 4 commits). Delta em três docs:
> - `00-MAPA.md` §6.7 — nove fluxos, 200/272 em `aprovado`, Estatísticas 9º canvas, a §13 (`doc-bibliotecario`).
> - `10-DISCUSSOES-E-DECISOES.md` — duas linhas novas no §11 (decisão §13, o bloco 📊), §13 e §17 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (o delta do doc era só o bloco de STATUS).
> - Verificação: `doc-verificador`, tudo bate; carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `5e4def10`.

> ## 📊 15/09/2026 — WIREFRAMES DE ESTATÍSTICAS: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS (META AUTÔNOMA DO DONO)
>
> Nono canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/b35cbac1-de65-4b5d-a17a-760f94e4d6df**
> (7 artboards em 2 páginas; `docs/design/wireframes/estatisticas/`). 9 linhas `STAT-*`
> desenhadas (`STAT-10` `fora` por D4); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §13.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 o ano na data do
>   nascimento; B2 "Companions"; B3 o vazio omitia "Quem é" e "A estação", que montam sempre;
>   B4 `formatDate` é relativa; B5 "Sep 3"; B6 o epíteto fora do formato — e nunca chega à
>   Estatísticas; B7 tag vazada; B8 a jornada é um cartão só — todos aplicados; re-carimbo na
>   r2), `soulmon-product-designer` (6 achados), `soulmon-guarda-linha-vermelha` (**APROVADA
>   COM RESSALVA**, sem veto — (c) o "0" grande vai ao dono; (f) `hideMetrics`).
> - **Decisões estruturais** (`[novo]`): o Vínculo pela palavra (E1); a data sem ano e sem
>   epíteto (E2); o vazio com forma corrigida (E3); a frase de contexto ao lado do "0"
>   `[pendente do dono]` (E4); fidelidade de detalhe (E5). **Sai:** o ramo legado (D4), o ano, o
>   epíteto, o segundo cartão, as datas absolutas.
> - **✅ Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono). **Pendente do
>   dono (modal final):** o "0" grande no primeiro uso — dígito + frase (recomendação do lead,
>   desenhada) / só o dígito / dígito menor. Nenhuma decisão de regra nova no `REGISTRO`.
> - **Achados de passagem (código):** `hideMetrics` NÃO chega à `StatsPage` (a interface de
>   props não o tem; os comentários do arquivo dizem que obedece) — critério de aceite do WP;
>   o `App.tsx` nunca passa `epithet` ao `BirthCard` da Estatísticas (só o reveal passa);
>   nenhum teste monta a `StatsPage`; o `03 §4.8a` diz que "Quem é" e "A estação" somem no
>   primeiro uso — falso (⚠️ divergência para o sync); o inventário não tem linha para "entre
>   estações".
> - **Branch:** `design/wireframes-estatisticas` — mergeada na `main` (ff). Próximo canvas:
>   Social (D2).

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `3abee07f` (wireframes da Loja)
>
> `/manter-docs auto` após o merge da Loja (`9acfa7e0`→`3abee07f`, 5 commits). Delta em três docs:
> - `00-MAPA.md` §6.7 — oito fluxos, 191/272 em `aprovado`, a Loja como 7º canvas, a §12 e
>   13.1–13.14 (`doc-bibliotecario`; o verificador escapou dois pipes crus numa célula).
> - `10-DISCUSSOES-E-DECISOES.md` — três linhas novas no §11 (decisão §12, 13.14, o bloco 🛒),
>   §13 e §17 (`doc-historiador`).
> - `01-VISAO.md` — sem alteração (já dizia que o 💗 saiu da loja em 06/09; a 13.14 reafirma).
> - Verificação: `doc-verificador` ×2, tudo bate; carimbos em 15/09/2026. Guard verde (10/10).
> - `.sincronizado.json` → `3abee07f`.

> ## 🛒 15/09/2026 — WIREFRAMES DA LOJA: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS (META AUTÔNOMA DO DONO)
>
> Oitavo canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/ef3ed287-1ecd-466a-a8de-c5aea415f2f8**
> (7 artboards em 2 páginas; `docs/design/wireframes/loja/`). 12 linhas `LOJA-*`
> desenhadas (`LOJA-12` `fora` por D5); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §12.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 os dois saldos juntos
>   no topo, o código mostra só a moeda do segmento; B2/B3 o "Little Heart" à venda quando
>   saiu em 06/09 e "meio coração" era falso; B4 marcação vazada no `aria-label` do card
>   travado; ressalvas 5–9 — todos aplicados), `soulmon-product-designer` (5 achados),
>   `soulmon-guarda-linha-vermelha` (**APROVADA** — VETO 2b ao Coraçãozinho na vitrine;
>   ressalva 2a: chips são +3).
> - **Decisões estruturais** (`[novo]`): uma leitura de saldo por segmento (L1); Itens = só os
>   três chips, Coraçãozinho fora com nota ⚰️ (L2); card travado como `button disabled` com 🔒
>   não textual (L3); fidelidade de detalhe — missão em dois `p`, borda 1px, chevron no
>   convite, saída sem `onClose` (L4). **Sai:** o Little Heart, os dois saldos, o "+2".
> - **✅ Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono: fecha quando
>   o crítico carimba e o guarda não tem veto pendente). Decisão de regra nova no
>   `REGISTRO-DE-DECISOES.md` §13: **13.14** o Coraçãozinho NÃO volta à loja (decidido pelo
>   dono no início da meta; os chips de atributo por Bits ficam).
> - **Achados de passagem (código):** `weeklyMissions.ts` `mood-checkins` ainda com alvo 3
>   (13.10 pede 5); nenhum teste monta os botões da troca Créditos → Bits; `ShopModal` sem
>   `asPage` é ramo morto (candidato a remoção); o `03 §4.6` ainda cita `kind === 'heart'` na
>   seção Itens (⚠️ divergência para o sync do manual).
> - **Branch:** `design/wireframes-loja` — mergeada na `main` (ff). Próximo canvas:
>   Estatísticas.

> ## 📚 15/09/2026 — MANUAL SINCRONIZADO COM `efdc1088` (wireframes dos Jogos)
>
> `doc-mantenedor` (sessão): delta `c730b294` → `efdc1088`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — sete fluxos em `aprovado`,
> 179 das 272 linhas, `DECISOES-WIREFRAME.md` §11, os 16 artboards de `jogos/`),
> `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` — 13.13 e a decisão dos Jogos na §11,
> o bloco de 15/09, §17), `doc-redator-regras` (`01-VISAO.md`: **sem alteração** —
> 13.13 nasce dentro de #21: é o placar de UMA partida, nunca métrica do outro jogador).
> Verificados e carimbados pelo `doc-verificador` em 15/09/2026; guard verde (10/10).

> ## 🎮 15/09/2026 — WIREFRAMES DOS JOGOS: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Sétimo canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a**
> (16 artboards em 4 páginas; `docs/design/wireframes/jogos/`). 25 linhas `JOGO-*`
> desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §11.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 a faixa por oponente
>   não existe; B2 `aria-label` inventado nos cards; B3 o × é o primeiro do DOM; B4 o erro
>   `sem-motor` da Arena; B5 o `fightError`; B6 o relógio de defesa é 3,0 s — todos
>   aplicados), `soulmon-product-designer` (6 achados: o chrome da run some nas fases de
>   luta; a fonte pixelada vaza para o texto; "N pts" por pessoa é tensão nova),
>   `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA** — VETO 3b à faixa ao lado do
>   oponente; 3 ressalvas que viram aceite).
> - **Decisões estruturais** (`[novo]`): o card do oponente = criatura + nome + estágio, sem
>   a faixa (J1); o chrome da run em todas as fases (J2); a instrução da barra no pesadelo
>   (J3); estados que faltavam (J4); a11y como o código (J5). **Sai:** a faixa do oponente,
>   o `aria-label` inventado, o "(no time limit)" como padrão.
> - **✅ Checkpoint fechado em 15/09/2026 (modal):** o dono APROVOU J1–J5. Decisão de regra
>   nova no `REGISTRO-DE-DECISOES.md` §13: **13.13** o "N pts" do resultado do Torneio fica,
>   como poder da partida (nunca do jogador; some com "Continue").
> - **Achados de passagem (código):** o × da masmorra sai da run sem confirmação em qualquer
>   fase, inclusive após gastar Bits em "Go deeper"; `sm-px-arcade-value/-label`
>   (Silkscreen) estilizam o popup "PERFECT!" e o placar — fonte pixelada no corpo do texto
>   (PRINCÍPIOS §7 / Life Reset); os cards da página de Jogos não têm `aria-label` (o nome
>   acessível é a concatenação título + descrição + tag sem separador); "N match(es)" com
>   "(s)"; o pesadelo não explica a barra de timing; a Arena tem um estado `sem-motor` e o
>   Torneio um `fightError` sem linha no inventário.
> - **Branch:** `design/wireframes-jogos` — mergeada na `main` (ff) após o OK. Próximo
>   canvas: Loja.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `3ff60e7d` (wireframes da Evolução)
>
> `doc-mantenedor` (sessão): delta `a4d92d5c` → `3ff60e7d`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — seis fluxos em
> `aprovado`, 154 das 272 linhas, `DECISOES-WIREFRAME.md` §10, os 15 artboards de
> `evolucao/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` — 13.12 e a decisão da
> Evolução na §11, o bloco de 14/09 com o flash da cerimônia, §17), `doc-redator-regras`
> (`01-VISAO.md`: **sem alteração** — 13.12 é superfície). Verificados pelo
> `doc-verificador` em 14/09/2026; guard verde (10/10).

> ## 🌳 14/09/2026 — WIREFRAMES DA EVOLUÇÃO: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Sexto canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed**
> (15 artboards em 3 páginas; `docs/design/wireframes/evolucao/`). 21 linhas `EVO-*`
> desenhadas (a sub-aba Soulmon migrou para o Pet, D1); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §10.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 ordem de foco
>   invertida em 7 artboards; B2 a cerimônia sem semântica de diálogo; B3 risco de FLASH
>   na intercalação; W3 o estado por nó — aplicados/registrados), `soulmon-product-designer`
>   (8 achados: a data e a saída relacional na cerimônia; o gesto duplo do visor; o modal em
>   cima do clímax), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA**, sem veto:
>   o cadeado avisa dos corações; a data; a pausa antes do modal).
> - **Decisões estruturais** (`[novo]`): a DATA na cerimônia (X1); "Let’s keep going
>   together" no lugar de "Continue" (X2); a tag do cadeado vira "ON HOLD" (X3); o cadeado
>   diz que não protege os corações (X4); estado por nó, offline (D9), reduced-motion
>   como quadro (D7), `role="dialog"` (X5). **Sai:** "Continue", a tag "LOCKED" do cadeado,
>   a intercalação em movimento reduzido.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU X1–X5. Decisão de regra
>   nova no `REGISTRO-DE-DECISOES.md` §13: **13.12** o aviso pós-evolução vira CARD na
>   página de Evolução, não modal (para o `staff-frontend`: `EvolveTaskModal` deixa de
>   montar; a mensagem entra na página; `filaDeAvisos.contract.test.ts` muda).
> - **Achados de passagem (código):** ⚠️ **flash** — a cerimônia intercala sprites brancos
>   de 420 ms até 55 ms (~18 trocas/s) sobre fundo escuro, acima do piso do WCAG 2.3.1 —
>   capar em ≥ 334 ms sempre; `EvolutionCeremony` sem `role`/`aria-modal`/trap/Escape num
>   z-500; não lê `prefers-reduced-motion` (o `MilestoneCeremony` lê); sem a data e com
>   saída neutra; "LOCKED" nomeia duas coisas em EN; o cadeado não avisa que não protege
>   de degeneração; `EvolveTaskModal` no kit antigo com botões só em inglês; o gesto duplo
>   do visor (travar × evoluir); "Degenerate" (dois toques) sem linha no inventário; no
>   demo os estados de sprite nunca disparam.
> - **Branch:** `design/wireframes-evolucao` — mergeada na `main` (ff) após o OK. Próximo
>   canvas: Jogos.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `ba957ca7` (wireframes do Onboarding-funil)
>
> `doc-mantenedor` (sessão): delta `1ceb3bc8` → `ba957ca7`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — cinco fluxos em
> `aprovado`, 133 das 272 linhas, 12 canvases (D3), `DECISOES-WIREFRAME.md` §9, os 17
> artboards de `onboarding-funil/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md`
> §11 e §17 — a decisão do funil, com a ordem mantida pelo dono, e o bloco de 14/09; nada
> em §13). `01-VISAO.md` fora do delta. Verificados pelo `doc-verificador` em
> 14/09/2026; guard verde (10/10).

> ## 🚪 14/09/2026 — WIREFRAMES DO ONBOARDING-FUNIL: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Quinto canvas da SQUAD-DESIGN (Fase 1; D3 divide o Onboarding em funil + oráculo — este é
> o funil). Canvas publicado:
> **https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6**
> (17 artboards em 4 páginas; `docs/design/wireframes/onboarding-funil/`). 25 linhas `ONB-*`
> desenhadas (`ONB-13` = `fora`, D4); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §9.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 três "Back" que o código
>   não tem; B2 o "carregando" do portão; B3 o rótulo do teto como UI; B4 o skip sem teclado;
>   W3 o par "Sign in" — todos aplicados), `soulmon-product-designer` (6 achados: o nascimento
>   demo sem a criatura; a criatura só na 7ª tela; o objetivo perguntado 2×),
>   `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA**, nenhum veto: rotular o estado
>   pós-marcação em ONB-09; disclosure da IA no tutorial).
> - **Decisões estruturais** (`[novo]`): o sprite grande no cadastro demo (O1); a
>   justificativa do campo de objetivo (O2); o objetivo do tutorial pré-carregado com o
>   `soulGoal` (O3); "Back" nos três becos sem saída (O4); skip da intro com rótulo e teclado
>   (O5); aviso da IA junto do botão (O6). **Sai:** o campo vazio do tutorial, o nascimento sem
>   criatura, a barra contínua (são pontinhos).
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU O1–O7 e decidiu MANTER a
>   ordem de hoje do funil (a criatura continua na 7ª tela; o lead recomendava reordenar).
>   Sem decisão de regra nova.
> - **Achados de passagem (código):** `STRUGGLE_STEP`, `CHOICE_STEP` e `REGISTER` não têm
>   botão de voltar (`back()` sabe, ninguém chama); o `REGISTER` demo não tem `<img>`; durante
>   a checagem assíncrona de auth o portão renderiza a tela sem-Firebase por um tick — tocar
>   "Continue" ali entra sem conta mesmo com Firebase configurado; o skip da intro não tem
>   rótulo nem `onKeyDown`; `/api/suggest-tasks` recebe o objetivo e a `privacidade.html` não
>   menciona o endpoint; o objetivo é perguntado em ONB-14 e de novo em ONB-40; nenhuma copy
>   diz que a 1ª atividade do tutorial é real; a régua "8 telas" (PP Parte 0) × 10 contadas.
> - **Branch:** `design/wireframes-onboarding-funil` — mergeada na `main` (ff) após o OK.
>   Próximo canvas: Evolução.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `b3e4631f` (wireframes do Pet)
>
> `doc-mantenedor` (sessão): delta `8f23d5fd` → `b3e4631f`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — quatro fluxos em
> `aprovado`, 108 das 272 linhas, 11 canvases, `DECISOES-WIREFRAME.md` §8, os 9
> artboards de `pet/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` §11 e §17 —
> a decisão do Pet e o bloco de 14/09; nada em §13: o `REGISTRO` não mudou).
> `01-VISAO.md` fora do delta. Verificados pelo `doc-verificador` em 14/09/2026;
> guard verde (10/10).

> ## 🐾 14/09/2026 — WIREFRAMES DO PET: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Quarto canvas da SQUAD-DESIGN (Fase 1; canvas próprio por D1 — `EVO-22`→`EVO-29`
> viraram `PET-01`→`PET-08`, inventário §1.4a). Canvas publicado:
> **https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e**
> (9 artboards em 3 páginas; `docs/design/wireframes/pet/`). 7 linhas `PET-*`
> desenhadas (`PET-02` = `fora`, D4); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §8.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 sistêmico: sub-abas
>   desenhadas como `tablist` sem `[novo]`; R1 índice global do `#NN`; R2 raridade em zero
>   num Dex parcial — todos aplicados), `soulmon-product-designer` (8 achados), `soulmon-guarda-linha-vermelha`
>   (**APROVADA COM RESSALVA** — VETO 1a ao `[novo]` que suprimia o "0 of 30": reverteria 13.7).
> - **Decisões estruturais** (`[novo]`): Dex vazio sem a barra em 0% e sem as frações
>   enquanto as três raridades estão em zero — o dígito fica como texto quieto (P1); célula
>   obtida com "#NN · data" (índice global + `dreamDates`, P2); sub-abas como o código (P3);
>   estados da ficha que o inventário não tinha (P4). **Sai:** a barra vazia, o `tablist`,
>   o nível numérico na ficha.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU P1–P4. Sem decisão de
>   regra nova (a tensão 13.7 × PRINCÍPIOS §9 no Dex vazio foi resolvida pelo lead com a
>   régua de E5/A6: dígito quieto fica, barra e frações-todas-em-zero saem).
> - **Achados de passagem (código):** `DreamDex` sempre renderiza contador + `progressbar`
>   mesmo em zero; `rest.dreamDates` é carimbado e nunca exibido; as sub-abas são três
>   `<button>` sem grupo nem estado ativo para leitor de tela; a coluna ficha → Dex → diário
>   não tem sinal de posição ao rolar; três `ScreenSkeleton` empilhados; as duas habilidades
>   do estágio não têm seção no `02-REGRAS-DE-NEGOCIO.md` (só em `utils/soulProfile/ficha/skills`);
>   o estado vazio da ficha (`formas.length === 0`) não tem linha no inventário; a data das
>   formas anteriores tem dois candidatos a dono (`FormAlbum` × ficha) — recomendação: `FormAlbum`.
> - **Branch:** `design/wireframes-pet` — mergeada na `main` (ff) após o OK. Próximo
>   canvas: Onboarding-funil (D3).

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `f673a082` (wireframes de Rituais)
>
> `doc-mantenedor` (sessão): delta `96d8dbdb` → `f673a082`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — três fluxos em
> `aprovado`, 101 das 272 linhas do inventário, `DECISOES-WIREFRAME.md` §7, os 21
> artboards de `rituais/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` —
> 13.11 na §4, 13.10 na §8, a decisão de Rituais e o bloco de 14/09 na §11, §17),
> `doc-redator-regras` (`01-VISAO.md`: **sem alteração** — 13.10 mantém "humor nunca
> pontua"; 13.11 não toca no que o doc descreve). Verificados e carimbados pelo
> `doc-verificador` em 14/09/2026; guard verde (10/10). Aviso do redator de regras:
> 13.10 (alvo 5 em `mood-checkins`) e 13.11 (carimbo ao mostrar) são decisões
> registradas, **não implementadas** — o código segue em `target: 3` e no toque.

> ## ☀️ 14/09/2026 — WIREFRAMES DE RITUAIS: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Terceiro fluxo da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a**
> (21 artboards em 4 páginas; `docs/design/wireframes/rituais/`). As 26 linhas
> `RIT-*` desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §7.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa", 5 bloqueantes B1–B5 +
>   7 ressalvas, todos aplicados na r2), `soulmon-product-designer` (10 achados — o que
>   mudou o canvas: o `FirstTaskCompletedPopup` monta POR BAIXO dos intersticiais e o
>   gatilho é a oferta reduzida; o relatório em ordem de tempo; o retorno com o pet
>   falando), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA** — 1 veto de
>   copy: "You're on a good streak!"; 4 vetos ao código que o canvas já corrige; 9
>   ressalvas que viram aceite).
> - **Decisões estruturais** (`[novo]`): o mapa do que vive fora das filas (R1);
>   relatório em ordem de tempo — ontem → humor → convite → CTA (R2); um caminho de
>   volta por superfície — a nota do carinho sai do relatório (R3); retorno de
>   ausência com o pet na peça e a linha da faixa, sem o N (R4); piso de dígitos nos
>   rituais — "not logged", sem "0 of 4", sem "chosen focus: 0", uma anatomia por
>   linha no semanal (R5); estado "aceitei" da oferta reduzida (R6); primeira tarefa
>   como cerimônia, fora das filas de propósito (R8). **Sai:** o × da cerimônia, o
>   número de dias fora, os zeros de dívida, "streak".
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU R1–R8. Duas decisões de
>   regra novas no `REGISTRO-DE-DECISOES.md` §13: **13.10** a missão semanal `mood-checkins`
>   fica, com alvo 5 em vez de 3; **13.11** o "1×/semana" do convite no relatório conta ao
>   MOSTRAR (`offerShownWeek` na exibição, não no toque).
> - **Achados de passagem (código):** `FirstTaskCompletedPopup` (`ModalSheet` z-120)
>   monta SOB um intersticial aberto, invisível, com trap próprio — e a 1ª conclusão
>   da vida pode ser o "just 5 minutes today?" do check-in; `ProtectProgressModal` e
>   `WelcomePromptModal` montam no MESMO valor de `interstitial` (duas folhas, dois
>   traps); a linha de carga do check-in lê `plan.plannedEffort` congelado e ignora
>   `focusEffort`; `WeeklyReportCard` imprime "0 of 4", "0 task(s) done" e "(s)";
>   a oferta reduzida não muda nada na tela depois do toque; `MilestoneCeremony` é
>   `role="status"` sem trap/Escape (Tab vaza para o check-in sob o véu z-300);
>   "You're on a good streak!" com gate de 5 tarefas; `restDayUsed`/`weeklyRelief`
>   sem `!welcome`; `offerShownWeek` gravado no toque; "You were away N days";
>   "chosen focus: 0"; `03 §4.21` diz que o gate "substituiu" o timer — coexistem.
> - **Branch:** `design/wireframes-rituais` — mergeada na `main` (ff) após o OK. Próximo
>   canvas: Pet (D1). Para o `staff-frontend`: 13.10 muda `weeklyMissions.ts` (alvo 5);
>   13.11 muda `onOpenOffer`/`offerMoment.ts` (carimbo na exibição).

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `5540226c` (wireframes de Atividades)
>
> `doc-mantenedor` (sessão): delta `f3bec2ce` → `5540226c`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — dois fluxos em
> `aprovado`, 75 das 272 linhas do inventário, `DECISOES-WIREFRAME.md` §6, os 17
> artboards de `atividades/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` —
> decisões 13.8/13.9 na §2, a decisão de Atividades e o bloco de 14/09 na §11, §17),
> `doc-redator-regras` (`01-VISAO.md`: **sem alteração** — 13.8 e 13.9 aplicam as
> regras de perda 1 e 3, não as mudam). Verificados e carimbados pelo
> `doc-verificador` em 14/09/2026; guard verde (10/10). De passagem: o parágrafo
> "Decididas em 14/09/2026" do `REGISTRO-DE-DECISOES.md` §13 apontava só para a §5
> do `DECISOES-WIREFRAME.md` — 13.8/13.9 moram na §6; corrigido em commit à parte.

> ## 📋 14/09/2026 — WIREFRAMES DE ATIVIDADES: DESENHADOS, CRITICADOS, CARIMBADOS E APROVADOS PELO DONO
>
> Segundo fluxo da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1**
> (17 artboards em 4 páginas; `docs/design/wireframes/atividades/`). As 27 linhas
> `ATIV-*` desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §6.
> - **Crítica em três rodadas:** `design-critic` (r1 "não passa", 9 bloqueantes — quase
>   todos de fidelidade ao código; **r2 CARIMBO passa**; r3 = as 7 ressalvas de
>   amostra aplicadas), `soulmon-product-designer` (achado que mudou o canvas: o
>   CTA "+ Nova atividade" abre o `EditModal`, não o `CreateModal`; `handleAddNewTask`
>   não tem chamador), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA** —
>   3 vetos fechados: "Want to create without limits?", teto trancando edição,
>   recompensa fantasma na triagem).
> - **Decisões estruturais** (`[novo]`): um só modal de criação (CTA → `CreateModal`);
>   linha de hábito = janela de 7 + glifo de maturidade, o resto na **ficha do hábito**
>   (topo do `EditModal`); tarefas concluídas hoje ficam no fim do painel, riscadas e
>   inertes (regra `completeTask` intacta); cabeçalho `feitos/total` sobre o dia devido;
>   carga do dia = 7ª entrada da fila 2 como texto (D10); escudos por hábito, zero só
>   na ficha/Estatísticas (T5). **Sai:** o segundo modal de criação (ATIV-18 perde o
>   caminho vivo), a linha agregada de escudos, "N das últimas 7" na linha.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** aprovado. Decisões novas no `REGISTRO` §13:
>   **13.8** excluir hábito com histórico confirma nomeando o marco; **13.9** passos aceitos no
>   nudge somam à mesma tarefa.
> - **Achados de passagem (código):** o cabeçalho `feitos/total` do painel conta só
>   `tasks` — a tarefa concluída sai da conta, e "5/5" nunca fecha num dia de hábito
>   fora do dia; `"0/3 steps"` impresso antes do primeiro passo (fura o piso);
>   "Retomar" a 36px; "Want to create without limits?" mente para quem paga (o pago tem
>   teto — C-S1); `handleAddNewTask` sem chamador; o `CLAUDE.md` promete recompensa
>   ao terminar a triagem e o código não tem (já em `02 §34`); `03 §4.5` defasado
>   (CTA → CreateModal; "toque no lápis"); `ATIV-05` e `ATIV-18` no inventário
>   precisam de nota do cartógrafo.
> - **Branch:** `design/wireframes-atividades`, mergeada na `main` após o OK.
>   Próximo fluxo P0: Rituais.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `708893c0` (wireframes da Home)
>
> `doc-mantenedor` (sessão): delta `d2d8dcf9` → `708893c0`, 9 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.1/§6.7/§8.1 e
> `12-COMO-MANTER.md` §11 — o hook lê `Test Files` além de `Tests`; a Home
> aprovada e o canvas no índice), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md`
> — decisões 13.6/13.7, a decisão da Home e o bloco de 13–14/09), `doc-redator-regras`
> (`01-VISAO.md`: **sem alteração**, o doc não descreve o que 13.6/13.7 mudam).
> Verificados e carimbados pelo `doc-verificador` em 14/09/2026; guard verde.
> De passagem: o blob do `REGISTRO-DE-DECISOES.md` tinha virado CRLF no commit
> das decisões 13.6/13.7 — normalizado de volta a LF (conteúdo inalterado); o
> inventário dizia "26 `<TelaEstado>`" para a Home — são 27 (+ `Main`); e o parágrafo da §2.1 do inventário (Home + achados para o
> cartógrafo) nunca tinha chegado ao arquivo — o `replace` de 13/09 falhou em
> silêncio por CRLF; entrou em `ed4d18d3`. Na reverificação o bug do shebang **não
> reproduziu** (vitest 4.1.9 aceitou `#!` com o cache de transform quente); a
> evidência é o commit `95e60ff9` + a saída original desta sessão.

> ## 📐 13–14/09/2026 — WIREFRAMES DA HOME: DESENHADOS, CRITICADOS, CARIMBADOS E APROVADOS PELO DONO
>
> Primeira sessão de desenho da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332**
> (28 artboards em 4 páginas; arquivos em `docs/design/wireframes/home/`:
> `Main.dc.html` + 27 `<TelaEstado>.dc.html` + `canvas.json`). As 48 linhas
> `HOME-*` do inventário estão desenhadas, com rodapé fixo em cada artboard
> (Pergunta · Chega/Sai · Sai da tela atual · Fontes · PT) e ordem de foco
> numerada. Inglês é a língua do artboard (D8).
> - **Crítica em três rodadas:** `design-critic` (rodada 1: "não passa", 6
>   bloqueantes; rodada 2: 1 gate; **rodada 3: CARIMBO passa**),
>   `soulmon-product-designer` (mediu a dobra: "Daily rituals" nascia a 739px
>   com o dock a 722) e `soulmon-guarda-linha-vermelha` (família **APROVADA
>   COM RESSALVA**: 1 veto — o dígito "(N)" do "Arrumar a pilha", `02 §34` —
>   e 4 ressalvas que viraram aceite).
> - **Decisão do design-lead** em `docs/design/DECISOES-WIREFRAME.md` §5
>   (entra / volta / sai). As mudanças estruturais, todas marcadas `[novo]`
>   no canvas: **Play vira a 5ª célula do deck** (`02 §13` já manda; fecha a
>   dobra), **slot de avisos abaixo do pet fixo**, **medidores dentro do
>   palco** (como o código faz desde 27/08 — a rodada 1 reproduzia a
>   composição que você rejeitou), regra única de célula inerte no deck,
>   piso ≥ 1 para dígitos de "feito", sombra de contato, 4 copies novas.
>   **Sai:** EvoTrail da Home, PlayCard, léxico de cobrança da fala idle,
>   o "(N)" da pilha, "ou um carinho" do aviso de HP, "nagging" do recomeço.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** aprovado. Decisões novas no `REGISTRO` §13: **13.6** pastinha só com itens especiais; **13.7** zero visível só em posse, nunca em dívida do dia.
>   Duas decisões de regra ficaram para você: (a) a pastinha (Itens) também
>   alimenta comida comum, duplicando a folha Alimentar — restringir a
>   especiais é `REGISTRO`, não wireframe; (b) escudos (13.5) são POSSE e
>   podem mostrar zero; "N de M" é dívida do dia e não pode — a distinção
>   está escrita na decisão E5 para não colidir com a 13.5.
> - **Achados de passagem:** (1) `src/docsManual.contract.test.ts` falhava
>   inteiro (0 testes) por causa do `#!/usr/bin/env node` em
>   `scripts/docs-inventario.mjs` — o vite-node avalia o módulo dentro de uma
>   função; **corrigido** (shebang removido; `node scripts/…` continua
>   funcionando). (2) **O hook de sessão mascarava esse FAIL**: só lê a linha
>   `Tests`, não a `Test Files` — vale acrescentar `Test Files` ao grep de
>   `.claude/hooks/session-start.sh`. (3) Inventário: a condição de `HOME-08`
>   não bate com o código (`hideMeters` é fixo no topo desde 27/08; o toggle
>   é `HOME-05`); "retorno após ausência" e "Home rolada" não têm linha —
>   anotado no §2.1. (4) Dívidas de UI: o `ScreenSkeleton` não tem a forma da
>   página; o `HomeHud` entrega a regra por `title=` (invisível no toque e no
>   teclado); "+10%" não existe — o código imprime `+20%`
>   (`PLAY_BUFF_MULTIPLIER`), e o número tem de ser dado, nunca escrito.
> - **Branch:** `design/wireframes-home`, mergeada na `main` após o OK. O hook
>   de sessão passou a ler `Test Files` além de `Tests`. Próximos fluxos:
>   Atividades, Rituais (P0).

> ## ✅ 13/09/2026 — O DONO RESPONDEU AS 20 DECISÕES PRÉVIAS DOS WIREFRAMES
>
> Em modal, uma a uma: as 11 dúvidas do `docs/design/INVENTARIO-WIREFRAMES.md`
> §3.2 e as 9 tensões pesquisa × decisão do `PRINCIPIOS-DE-WIREFRAME.md` §14.
> Registro completo em **`docs/design/DECISOES-WIREFRAME.md`**. O que muda:
> - **Canvases**: Pet e Social ganham canvas próprio; Onboarding parte em
>   funil (5º) e oráculo (último). Ordem final no `HANDOFF-WIREFRAMES.md` §4.
> - **Inglês é a língua do artboard** (PT no rodapé; artboard extra só onde a
>   caixa muda).
> - **Cinco decisões de produto REABERTAS** → `REGISTRO-DE-DECISOES.md` §13:
>   oferta no reveal (dispensável, padrão Garmin); contador "N de M" no widget
>   (só com ≥ 1 feita); live-ops rotativo que não tira; card compartilhável
>   mensal com piso; escudos visíveis sempre, inclusive zero. **O código ainda
>   faz o antigo** — implementar passa pelo guarda dono e muda
>   `widgetSemCobranca.contract.test.ts` (13.2) e a linha correspondente do
>   `CLAUDE.md`.
> - Mantidas: prestígio visível sem o escudo quebrar a aura (fecha a D4: o
>   que dói perder é só o coração), veto #21 ao estágio do amigo, psicométrico
>   invisível, conta primeiro com o porquê visível.
> - `fora` do desenho: os três ramos de save antigo (`STAT-10`, `EVO-23`,
>   `ONB-13`) e a variante sheet do `ShopModal` sem caminho vivo — **candidatos
>   a remoção de código, decisão sua**.
> - As seis superfícies sem descrição no manual foram **medidas no código** e
>   entraram no `03-FLUXO-DE-TELAS.md` §4 (§4.2a, §4.2b, §4.6a, §4.6b, §4.8a,
>   §4.23a). Três achados da medição: **`SettingsModal` é inalcançável** —
>   `handleOpenAISettings` desce `App.tsx` → `CompanionHUD` → `ChatBox` e o
>   `ChatBox` só desestrutura a prop, nunca a chama (mesma família da
>   `OraclePage`; o caminho real de Personalidade é menu → Configurações →
>   "Personalidade"); a recusa de comida com o pet cheio **não é tela** (fala de
>   3500 ms, sem decrementar); e **quatro superfícies não têm régua nenhuma**
>   (`ItemsWindow` vazio, o visual da recusa da loja, os botões de troca de
>   Créditos, a `StatsPage` inteira — nenhum teste as monta).

> ## 🎨 13/09/2026 — REDESENHO EM DUAS FASES: A SQUAD-DESIGN E O HANDOFF DOS WIREFRAMES
>
> O dono pediu o redesenho do app começando por wireframes de TODAS as telas,
> com o que a pesquisa (Mobbin, estudos) ensinou, e a identidade só depois.
> Não havia squad de design formal — havia agentes soltos. Entrou:
> - **`/squad-design`** (`.claude/skills/squad-design/`): método **W1–W10**
>   (cinza, texto real, todo estado, uma pergunta por tela, frequência manda,
>   nada cobra, filas como estrutura, referência com procedência, o que sai é
>   nomeado, aceite executável), duas fases com checkpoint do dono entre elas.
>   Dois agentes novos — `design-curador-padroes` e `design-wireframer` — e
>   seis reusados (design-lead decide, cartógrafo mede, product-designer
>   opina, design-critic critica bloqueante, guarda-linha-vermelha veta,
>   visual-designer na Fase 2).
> - **`docs/HANDOFF-WIREFRAMES.md`**: o que a próxima sessão lê primeiro — a
>   ordem de leitura, os 10 fluxos por frequência, o formato do canvas
>   (`docs/design/wireframes/<fluxo>/`, artboards 390×844, skill `design`),
>   o aceite e a Fase 2 combinada.
> - **`docs/design/PRINCIPIOS-DE-WIREFRAME.md`** (a pesquisa por família de
>   tela, com seção de origem) e **`docs/design/INVENTARIO-WIREFRAMES.md`**
>   (toda tela × estado, com prioridade e estado do wireframe).
>
> Por que wireframe antes: o redesenho de agosto aplicou identidade sobre
> estrutura não decidida — `04-IDENTIDADE-VISUAL.md` §11 mede o resultado.
> **Nada foi desenhado ainda**: a primeira sessão de desenho começa pela Home
> (`/squad-design desenhar home`).

> ## 🤖 10/09/2026 — TODA SESSÃO COMEÇA PELO COORDENADOR, E O MANUAL SE SINCRONIZA A CADA MERGE
>
> Dois agentes novos e a automação que os aciona:
> - **`soulmon-coordenador`** (`/soulmon [start|rotear|status|fechar]`): o
>   especialista que toda sessão consulta primeiro. Lê `docs/manual/00-MAPA.md`,
>   este STATUS e o `CLAUDE.md`; roteia o pedido pela tabela da skill
>   (`.claude/skills/soulmon-coordenador/SKILL.md`) para o orquestrador dono —
>   maestro, os sete guardas, squad-som, squad-docs, prod-squad, design-lead,
>   security/qa — e no fechamento cobra portões, bloco aqui, PR + merge na hora
>   e a sincronização do manual.
> - **`doc-mantenedor`** (`/manter-docs [auto|desde <sha>|status]`): sincroniza
>   `docs/manual/` com o código depois de cada merge — `scripts/docs-delta.mjs`
>   mede o que mudou desde `docs/manual/.sincronizado.json`, um redator por doc
>   recebe o diff, o verificador recarimba, o SHA é gravado. Delta só.
> - **Hook de sessão** `.claude/hooks/session-start.sh` (em `.claude/settings.json`):
>   instala `node_modules` se faltar (uma sessão web de 09/09 nasceu sem) e
>   imprime o briefing com a ordem de invocar `/soulmon start`. Síncrono.
> - **Workflow `docs-sync.yml`**: a cada push na `main`, job `delta` (sempre:
>   mede + guard + sumário) e job `mantenedor` (só com delta **e** o segredo
>   `ANTHROPIC_API_KEY`) que roda `/manter-docs auto` e abre/mergeia
>   `docs/sync-<sha>`. Anti-loop: o commit de sincronização só toca `docs/`,
>   então o push dele volta com delta vazio.
>
> ⏳ **Depende do dono:** criar o segredo `ANTHROPIC_API_KEY` em Settings →
> Secrets → Actions para o job `mantenedor` rodar no servidor. Sem ele nada
> quebra — a sincronização acontece no início da próxima sessão, pelo hook.

> ## 📚 10/09/2026 — O MANUAL COMPLETO EXISTE: `docs/manual/00-MAPA.md` é a porta de entrada
>
> A SQUAD-DOCS (`.claude/skills/squad-docs/`, 9 agentes `doc-*`, comando
> `/documentar`) escreveu, verificou e travou o manual em `docs/manual/`:
> mapa central com guia de leitura para IA e três índices (assunto ·
> pergunta · arquivo), visão e linhas vermelhas, **59 regras de negócio**
> com dono/régua/decisão, fluxo de telas, identidade visual e sonora,
> arquitetura, **referência de todos os 268 módulos não-teste** (`node scripts/docs-inventario.mjs`, 10/09/2026; guard
> exige 100%), dados e save campo a campo, integrações e deploy, histórico
> (826 commits, por era), índice de discussões, glossário e como manter.
> Método R1–R10 (`METODO.md`): referência por SÍMBOLO nunca por linha,
> número com nome de constante, nada morto sem lápide, um dono por doc,
> **verificação bloqueante por outro agente** antes do carimbo. Régua viva:
> `src/docsManual.contract.test.ts` (todo doc no mapa, links resolvem,
> todo módulo na referência, zero `arquivo:linha`, cabeçalho com dono).
> Inventário medido: `node scripts/docs-inventario.mjs`.
>
> **Regra de precedência escrita no mapa: código > teste > `CLAUDE.md` >
> manual.** A rodada achou **41 divergências** entre o `CLAUDE.md`/comentários
> e o código — a lista está em `docs/manual/02-REGRAS-DE-NEGOCIO.md` §59
> (D1–D26) e nas seções de divergência dos docs 03 §6 e 04 §13. **Nenhuma
> foi "corrigida" no `CLAUDE.md`, que é seu**; as que importam para decidir:
>
> 1. 🔴 **JWT do Supabase da era DigiApp ainda estava no repositório** — em
>    `docs/APK-BUILD-INFO.md` (texto plano) e em `assets/info-*.js`, um build
>    velho restaurado na raiz sem consumidor. O guard afirmava "sumiu" varrendo
>    só `src/`. Redigido, pasta removida, guard ampliado para o repositório
>    inteiro (`571a8b4f`). **Revogar a chave no painel do Supabase é seu** — o
>    histórico do git a carrega.
> 2. 🐛 **A exclusão da linha do jogador na masmorra nunca dispara** (D5):
>    `getDungeonEnemySprite(tier, excludeLine)` espera id de LINHA e
>    `buildDungeonWave` passa o ESTÁGIO. A função tem teste; o chamador não.
> 3. 🐛 **Tetos da masmorra moram no `localStorage`** (D10): `DUNGEON_HEART_DROPS`
>    (2/dia, com `toDateString()`), `DUNGEON_DIFFICULTY`, `DUNGEON_BEST` — o
>    mesmo furo que `careCaps` fechou para carinho e comida. `stepsDayKey`
>    também usa o dia do aparelho (D23).
> 4. 🐛 **Renascimento também derruba `maxActivityCap`** de até 10 para 6
>    (`handleRebirth`), contra o "estágio e três atributos, e SÓ" (D13).
> 5. 🐛 **Selo de foco**: `GuideModal`/`HelpModal`/`CLAUDE.md` dizem "3 completas";
>    `focusComplete` exige todos os ESCOLHIDOS (D16) — decidir qual é a regra.
> 6. 🐛 **Widget Android** só em PT-BR e ainda diz "Dia perfeito!" (03 §6 #8).
> 7. ⚰️ **Código morto para decidir apagar**: `LanguageContext`/`translations`
>    (nunca montados), `PixelFrame`, `figma/ImageWithFallback`,
>    `CareSystem.scheduleCareEvents`, `handleEvolveToUnlocked`,
>    `XP_THRESHOLDS`→`nextLevelXP`, `attributesSinceLastEvolution`; `OraclePage`
>    e `PixelizerCard` **inalcançáveis** (o atalho de segurar o mascote perdeu
>    os chamadores).
> 8. 📝 **`CLAUDE.md` para você acertar** (cada um com o comando no doc): loja
>    tem 2 segmentos, não 5 abas (D3); `canPvp` não existe, é `meetsPvpBond`
>    (D4); `fallbackSpriteForStage` é `legacySpriteForStage`; cura instantânea
>    por Créditos foi removida (D2); coraçãozinho não é mais vendido (D1);
>    escala de ícone é 20/24/32, não 36/42/30; `npm run build` tem três
>    passos; check-in não tem humor (D20); `UnlockNudge` em 6 lugares, não 3;
>    `DREAM_CATALOG` citado por linha (D22); `MATCHES_PER_DAY` = 5 e a season
>    MENSAL do ranking não constam (D7/D8); bestiário grava 36 chaves, lê 24 (D9).
> 9. 📝 **Docs velhos**: `README.md` e `PROJETO.md` ainda se chamam DigiApp;
>    `brand/design-system.md` é da Consultech360 (outro produto);
>    `docs/reviews/2026-08-03/` foi criado em 14/08; §3.2 deste STATUS diz que
>    `wrangler.jsonc` não tem `d1_databases` — tem (`DB` → `soulmon-billing`).
>
> Fechado na rodada: `docs/00-START-HERE.md` aponta para o mapa; o `CLAUDE.md`
> ganhou UM bloco de ponteiro (nada mais foi tocado).

> ## ⏳ DEPENDE DO DONO (09/09/2026) — três decisões abertas
>
> **1. Criar o projeto Supabase do Soulmon.** O recado falado está pronto e
> DESLIGADO: sem `SUPABASE_PROJECT_ID` + `SUPABASE_ANON_KEY` no ambiente do
> servidor, `/api/config` devolve `transcribeAvailable: false` e o botão de
> microfone **não é desenhado**. Nada quebra sem elas. ⚠️ `ANON_KEY` **não**
> leva prefixo `VITE_` — o prefixo a colocaria de volta no bundle, que é o
> defeito que `/api/transcribe` existe para desfazer. A Edge Function a
> implantar está em `src/supabase/functions/server/`.
>
> **2. O redirecionamento do login: `getRedirectResult`.** O app NÃO o usa. A
> volta do redirect funciona pelo caminho felizmente correto —
> `getCurrentEmail()` espera `authStateReady()` e o Firebase restaura a sessão
> do IndexedDB. O que NÃO existe é mensagem quando o redirect FALHA do lado do
> Google (a pessoa cancela lá, o domínio é recusado lá): ela volta sem sessão e
> **sem explicação nenhuma**, reencontrando o portão de conta como se nada
> tivesse acontecido. `getRedirectResult` é o que exporia isso.
> Não foi acrescentado porque é mudança de comportamento no caminho de
> autenticação, e ela não é verificável em suíte nem no servidor de
> desenvolvimento (o redirect exige o handler do Firebase). O que ENTROU foi o
> que dá para provar: `src/utils/auth.redirect.test.ts` trava a ORDEM
> (persistência antes de a página sair — inverter faz a pessoa voltar deslogada
> sem erro nenhum), quais códigos NÃO redirecionam (`unauthorized-domain` é o
> mais provável aqui, e mandar a pessoa ao Google para voltar ao mesmo erro
> custa o que ela digitou) e que o código cru sempre chega ao console.
> ⚠️ E o problema de fundo continua em aberto: `authDomain`
> (`soulmon-app.firebaseapp.com`) ≠ domínio do app, e desde o SDK 9.19 o
> redirect para de funcionar em navegador que bloqueia armazenamento de
> terceiro, a menos que `/__/auth/handler` seja servido pelo domínio do app.
>
> **3. A palavra do rótulo do Bestiário na Home.** Não é uma decisão pendente
> minha — é observação: o Bestiário fica ESCONDIDO até a primeira descoberta
> (`bestiary?.length > 0 &&`). Isso é defensável ("oferta que não pode ser
> aceita é ruído") e tem um custo: quem nunca entrou na masmorra não descobre
> que ela alimenta uma coleção. Mudar é decisão de produto; não mexi.

> ## ✅ RESOLVIDO em 09/09/2026 — o recado falado foi ASSUMIDO, não apagado
>
> O achado abaixo foi levado ao dono, e a decisão dele foi **declarar e fazer
> funcionar**, em vez de remover: `06ef9ea0 feat(voz): o recado falado passou a
> existir de verdade — e declarado`. O POST direto para `<projectId>.supabase.co`
> com o JWT no bundle saiu; a transcrição passa a ir por
> `functions/api/transcribe.js`. A `PLAY-DATA-SAFETY.md` §2.4 passou a declarar
> **"Gravações de voz ou som — Sim, coletado e compartilhado"**, com processamento
> efêmero e retenção explicados, e `RECORD_AUDIO` entrou na tabela de permissões.
>
> ⚠️ **Sobrou uma contradição, corrigida no mesmo dia** (PR #33): a tabela do §2.4
> mudou, mas as duas **listas-resumo do fim do documento** ficaram para trás — "não
> coletado" ainda listava `áudio`, e "coletado e compartilhado" não citava a
> transcrição. **É da lista-resumo que se preenche a ficha da Play**, não da tabela
> que ninguém relê na hora do formulário. Regra que ficou escrita lá: ao mudar a
> §2.4, mudar as duas listas no mesmo commit.
>
> O bloco original fica abaixo, para auditoria.

> ## 🔴 08/09/2026 — O APP PEDE O MICROFONE E MANDA O ÁUDIO PARA FORA, E A DATA SAFETY DIZ QUE NÃO
>
> Achado por um parecer de privacidade da squad de som, **fora do escopo dela**, e
> verificado nas quatro pontas. Não é o desenho novo de áudio: **é o app de hoje.**
>
> `src/components/ChatBox.tsx` chama `navigator.mediaDevices.getUserMedia({ audio: true })`,
> grava com `MediaRecorder` e faz POST do blob para um endpoint de **Supabase**:
> `https://<projectId>.supabase.co/functions/v1/make-server-7de212d9/transcribe`.
> O componente é montado pelo `CompanionHUD` e **está no bundle servido**
> (`getUserMedia` presente em `dist/assets/index-*.js`).
>
> Contra isso, `docs/PLAY-DATA-SAFETY.md` **§2.4** declara fotos/vídeo/**áudio**
> como **❌ Não**, com a frase *"O app não pede nenhuma dessas permissões"*, e a
> lista de "Não coletado" repete **áudio**. **Supabase não aparece como destino
> declarado em lugar nenhum** — nem na Data Safety, nem em `public/privacidade.html`.
>
> ⚠️ O `CLAUDE.md` afirma que "o chat paralelo do Supabase" saiu na limpeza da
> herança do DigiApp em 07/09/2026. **A transcrição por voz sobreviveu.**
>
> `AndroidManifest.xml` **não** declara `RECORD_AUDIO` (grep = 0), então no APK a
> gravação provavelmente falha em silêncio — mas **PWA e Electron concedem
> normalmente**, e é a PWA que está no ar.
>
> **Isto é decisão do dono, e são três saídas:** (a) remover a gravação por voz e o
> endpoint; (b) mantê-la e **corrigir a Data Safety, a política de privacidade e o
> destino declarado** antes de qualquer publicação na Play; (c) mantê-la desligada
> por flag até (b) estar feito. Enquanto não for decidido, **a declaração da loja
> está incorreta**, e é a declaração que a Play cobra.
>
> Parecer completo, com as perguntas numeradas:
> `squad-alpha-runs/som-01/discovery/parecer-pi-e-dados.md`.

> ## ✅ 08/09/2026 — o Node 25 e os testes: consertado na raiz, não mais por contorno
>
> O bloco de 07/09 abaixo registra que o Node 25 "cria um `localStorage` global
> vazio que sombreia o do jsdom e derruba 7 testes", e manda usar o Node 22
> portátil de `E:/tools/node/node-v22.23.2-win-x64` para rodar o gate.
>
> **Duas atualizações.** Primeiro, o número cresceu: em 08/09/2026 eram **28 testes
> em 3 arquivos** (`storageKeys.migration`, `telemetryWiring.render`,
> `SoulmonOnboarding.portao.render`). Segundo, o contorno tinha dois furos — não
> ajudava **o CI** (que roda o Node da workflow, não o da máquina do dono) e
> dependia de todo mundo lembrar de trocar de Node.
>
> Consertado no `vitest.config.ts`, que acrescenta `--no-experimental-webstorage`
> ao `NODE_OPTIONS` do processo principal **antes de os workers nascerem** — a
> única camada por onde toda invocação passa, inclusive o `npx vitest run` cru que
> o `CLAUDE.md` manda rodar antes de todo commit. `poolOptions.*.execArgv` **não**
> funciona: o Vitest monta a própria lista (verificado). Reatribuir no
> `setupFiles` também não: no jsdom do Vitest o `window` **é** o `globalThis`, então
> os dois já apontam para o objeto morto e não existe referência para o certo.
>
>     npx tsc --noEmit  → exit 0
>     npx vitest run    → 256/256 arquivos · 3666 testes · 1 skipped
>
> **O Node 22 portátil continua útil** para reproduzir o ambiente do CI, mas deixou
> de ser necessário para a suíte ficar verde.
>
> ⚠️ **Achado junto, e este continua ABERTO:** o job `tsc + vitest` roda também
> `npx tsc -p tsconfig.server.json --noEmit`, que o `CLAUDE.md` **não lista** na
> seção de comandos pré-commit — e ele reprova. Eram 5 erros; 2 foram consertados
> (subtração de dois `Date` em `community.js`). Os **3 restantes** são
> `KVNamespace` citado no JSDoc de `_kv.js` sem nunca ter sido declarado, e
> **declará-lo de verdade desmascara mais de 90 erros latentes** em nove arquivos,
> incluindo dinheiro, conta e save — porque enquanto o nome não resolve, `kv(env)`
> devolve `any` e tudo a jusante passa trivialmente. A conta e os três caminhos
> estão em `squad-alpha-runs/som-01/sweeper/achado-typecheck-servidor.md`.

> ## ✅ 07/09/2026 (sessão LOCAL) — a infra que dependia do dono FOI LIGADA
>
> A sessão anterior rodava na nuvem, sem navegador logado, e parou no Firebase.
> Esta rodou na máquina do dono e terminou o `docs/HANDOFF-SESSAO-LOCAL.md`,
> seções 2.1 a 2.4. O que mudou **em produção**:
>
> 1. **Projeto Firebase PRÓPRIO** — `soulmon-app` (nome "Soulmon"). O id
>    `soulmon` estava tomado por outra conta. Gemini no Firebase e Google
>    Analytics ficaram DESLIGADOS. Provedor **E-mail/senha com link de e-mail**
>    ativado (os dois são acoplados no console: não dá para ter o link sem o
>    pai). Domínio `soulmon.mateus-sprnd.workers.dev` autorizado.
> 2. **`FIREBASE_PROJECT_ID` LIGADO** → `_auth.js` saiu do MODO ABERTO.
>    Verificado na borda: `GET`/`POST /api/save?id=…` sem token devolve **401
>    `unauthenticated`** (antes devolvia 200 e gravava), e `/api/account` saiu
>    do 503 — exportação e exclusão de conta estão vivas. Isso fecha o SEC-1
>    em produção, não só no código.
> 3. **VAPID girado e o Web Push saiu do zero.** O `VAPID_JWK` nunca existiu no
>    scheduler, então o envio era pulado inteiro, em silêncio. Par novo gerado;
>    privada só no secret. ⚠️ Achado no caminho: o `PROJETO.md` tinha a chave
>    **privada** do par antigo em texto plano, commitada — girar o par
>    neutralizou o vazamento, e o exemplo virou placeholder.
> 4. **`SEASON_ADMIN_KEY` nos DOIS lados** (worker `soulmon` + scheduler), com
>    valor novo. O fechamento de season deixa de dar 401.
> 5. **KV próprio e D1 ativos** — o deploy da raiz passou a expor
>    `env.SOULMON_SAVES` e `env.DB`, e a trava "um recibo, uma conta" saiu do
>    papel.
>
> **Duas coisas que o handoff errava e ficam registradas:**
>
> - A chave pública do VAPID estava fixada em **QUATRO** lugares, não três — o
>   `PROJETO.md` também, e o teste de paridade não o cobre.
> - O `FIREBASE_PROJECT_ID` mora no **`wrangler.jsonc`**, não no painel.
>   Variável de runtime comum (ao contrário de secret) é substituída pelo
>   conteúdo do arquivo a cada `wrangler deploy`: posta só no painel, o próximo
>   deploy a partir do repo a apagaria e o servidor voltaria ao modo aberto
>   **em silêncio**.
>
> **Ambiente:** esta máquina roda Node 25, e o projeto declara Node 22
> (`.nvmrc`, e as 5 workflows). O Node 25 cria um `localStorage` global vazio
> que sombreia o do jsdom e derruba 7 testes. Há um Node 22 portátil em
> `E:/tools/node/node-v22.23.2-win-x64` — **use ele para rodar o gate**, senão
> a suíte mente. Dois guards que só passavam no Linux foram consertados no
> caminho (montagem de caminho no Windows e CRLF).
>
> **O que ainda depende do dono:** o teste ponta-a-ponta do login (pedir o link
> por e-mail, receber e completar — só o dono tem o e-mail), a seção 2.5 (FCM
> nativo) e a 2.6 (Play Console). E as decisões da seção 3, intocadas.
>
> ### ✅ Continuação da mesma sessão — o login FOI ao ar e foi usado
>
> O parágrafo acima envelheceu no mesmo dia. **O desenho de login mudou de
> link-por-e-mail para Google + e-mail/senha**, e o dono se cadastrou com o
> Google em produção com sucesso ("entrou, deu certo"). O portão de conta é
> agora a **primeira** tela do app, em três passos — ver
> `docs/PLANO-TELA-IDENTIDADE.md`, seção 3-bis.
>
> **Três defeitos de produção que só apareceram porque o fluxo foi exercido de
> ponta a ponta**, e que nenhum teste unitário teria pego:
>
> 1. **A CSP bloqueava o login com Google.** `public/_headers` não tinha
>    `https://apis.google.com` em `script-src`; o Firebase reporta isso como
>    `auth/internal-error` **genérico**, sem dizer que foi a CSP. Só foi achado
>    depois de logar o `err.code` cru. Travado agora por
>    `src/security/csp.test.ts`.
> 2. **Cada push matava o login em produção.** As `VITE_*` são inlinadas em
>    BUILD; o CI rebuilda sem o `.env` da máquina do dono, então o deploy manual
>    correto das 19:51:16 foi desfeito pelo build do CI das 19:52:19. Correção:
>    `.env.production` passou a ser **commitado** (`!.env.production` no
>    `.gitignore`), guardado por `src/deploy/firebaseNoBuild.contract.test.ts`.
>    São só as quatro chaves públicas do cliente — nenhum segredo de servidor.
> 3. **`getCurrentEmail`/`getIdToken` liam o estado de auth de forma síncrona**,
>    antes de o Firebase reidratar do IndexedDB. Resultado: chamadas de API sem
>    token logo após abrir o app. Agora esperam `auth.authStateReady()`.
>
> **A verificação de 403 fechou** (o dono pediu para fazer):
> `{"meuComToken":200,"alheioComToken":403,"meuSemToken":401,"tokenFalso":401}`
> — save alheio é recusado com token válido, e token forjado não passa.
>
> **A verificação de idade virou checkbox** (decisão do dono): `ageOnMonth`,
> `isAgeBlockedByMonth` e `monthYearFromText` foram removidos de
> `src/utils/consent.ts`. Menos dado pessoal coletado para o mesmo efeito.
>
> **Duas "decisões pendentes" da seção 3 já estavam IMPLEMENTADAS** e o doc
> mentia ao pedi-las de novo: a retenção de 5 anos e a aleatoriedade do reroll.
> Conferido no código antes de riscar.
>
> **P4 entregue** — "Equilibrar minha semana" (`src/utils/weekBalance.ts`,
> presets de rotina em `taskModel.ts`, `BalanceWeekModal`): espalha os hábitos
> de dias fixos pela semana **sem mudar a frequência semanal de nenhum**, só
> com confirmação explícita, e avisa quando não cabe em vez de prometer alívio.


> ## 📋 08/09/2026 — o que a sessão local entregou, e o handoff do QA
>
> Duas sessões seguidas mudaram muita coisa. O inventário do que entrou, o que
> merece desconfiança e o **prompt pronto para abrir a sessão de QA** estão em
> **`docs/HANDOFF-QA-REVISAO.md`** — inclusive a lista honesta de onde eu
> provavelmente errei (guards ajustados pela mesma sessão que mudou a regra).
>
> Entregue em 08/09/2026: **P1** (meta de coração a 60%), **P2** (folga
> semanal), **P5** ("dia perfeito" → "dia completo"), a **barra de Quick Add**
> na tela inicial e a **aventura narrada** da noite — que fecha a Fase 2 do
> `PLANO-TAREFAS.md`. Mais a política de privacidade corrigida, as respostas do
> formulário de Segurança de Dados (`docs/PLAY-DATA-SAFETY.md`) e o passo de
> bundle assinado no CI, inerte até o dono criar a keystore.
>
> **Adiado por decisão do dono:** a **P3** e a **arte** (A20 — as 24 cenas da
> aventura — e o 5.1 da decoração), esta última para uma sessão dedicada, cujo
> handoff pronto (com prompts, critérios de aceitação e o prompt de abertura)
> é **`docs/HANDOFF-ARTE-GEMINI.md`**.
>
> **O gargalo continua sendo distribuição, não produto:** a corrente do
> lançamento inteira depende da keystore de release, que só o dono pode gerar.
>
> **`docs/REGISTRO-DE-DECISOES.md`** (08/09/2026) consolida toda a pesquisa —
> benchmark, literatura, transcrições, Mobbin — e cada decisão tomada a partir
> dela, com a alternativa que perdeu e o gatilho para rever. É o lugar para
> conferir se uma escolha ainda faz sentido antes de rediscuti-la. A **§7** traz
> as 12 apostas falseáveis, com limiar e instrumento, para o dia em que houver
> telemetria; a **§12** traz o que a revisão adversarial confirmou e derrubou.
>
> ### ⬜ O que sobrou aberto e é do dono (08/09/2026, fim da revisão)
>
> Nenhum destes é bug a consertar — os quatro são decisão:
>
> 1. **Os nove emojis que renderizam caixa vazia** (▯) em aparelho com fonte
>    anterior ao Emoji 12.0 — atingem o marco de 21 dias, 5 mobílias, 3 cenas da
>    aventura e 4 sonhos. O guard `emojiSuportado.contract.test.ts` congela a
>    dívida e lista a troca proposta; **escolher o glifo é seu**.
> 2. **A hipótese do `signInWithRedirect`** — a única saída para popup bloqueado
>    pode estar barrada pela mesma proteção de armazenamento de terceiros
>    (`authDomain` ≠ domínio do app). Precisa de conta Google real e popup
>    barrado para confirmar. **É a mais grave**: o portão é a primeira tela.
> 3. **A folga semanal não cobre o dreno de cocô** — ou passa a cobrir, ou fica
>    escrito que cocô é a única cobrança que sobrevive ao descanso.
> 4. **O preço aparece em R$ para quem usa o app em inglês.**

> ## 🔎 08/09/2026 — sessão de QA e revisão do app inteiro
>
> Rodada a partir de `docs/HANDOFF-QA-REVISAO.md`, com Node 22 portátil. Gate
> final: **255 arquivos, 3659 testes passando, 1 pulado**, `tsc` limpo nos dois
> projetos e `npm run build` refeito (o `dist/` commitado está em dia).
>
> ### Item 1 — os guards de P1/P2 NÃO foram ensinados a concordar
>
> Onze mutações no código de produção, cada uma com a suíte inteira rodando.
> **Nenhuma sobreviveu.** A prova que interessava: tornar a folga da semana
> sempre disponível derruba **10 arquivos e 37 testes**, e os OITO que ganharam
> `restDaysLeft: 0` no `44b7a7c3` estão todos entre eles — ou seja, nenhum
> deles estava passando através da folga. O inverso fecha junto: desligar a
> absorção da folga só derruba o `restDay.test.ts`, então nenhum guard estava
> sendo carregado por ela. E quem pega a virada trocando de régua (o footgun 9)
> é o guard diferencial de `dailyGoalSources.test.ts`, que é **anterior** ao
> commit da regra.
>
> ### Item 2 — a degeneração continua alcançável por negligência real
>
> Simulado dia a dia, duas semanas, em `src/utils/degeneracao.cenarios.test.ts`
> (novo, e agora é guard permanente): mega que não faz nada cai de estágio em
> menos de uma semana mesmo com a folga e desce dois em quatorze dias; 2 de 6
> por dia também derruba; e 4 de 6 todo dia atravessa duas semanas sem perder
> um coração, como a P1 prometeu.
>
> ⚠️ **O que a simulação achou de errado é anterior a P1/P2 e é decisão sua:**
> quem abre o app **a cada 3 dias** e não faz NADA nunca perde um coração —
> `ABSENCE_FORGIVENESS_DAYS` perdoa a virada e a rampa de retorno cobre as
> seguintes. O padrão MAIS negligente do jogo é o único imune, e a folga sequer
> é tocada. Está afirmado em teste como FATO OBSERVADO para ninguém "consertar"
> a folga achando que a culpa é dela.
>
> ### Corrigido nesta sessão
>
> | O quê | Onde | Gravidade |
> |---|---|---|
> | `restWeekKeyFor` andava para trás no horário de verão (folga extra de graça, 1×/ano, todo fuso com DST) | `utils/dailyReset.ts` | borda |
> | O relatório anunciava perda de coração que o piso da raiz já tinha engolido — todas as noites, para o jogador mais frágil, com botão de "recuperar" junto | `utils/dailyReset.ts` | produção |
> | O relatório anunciava o alívio de segunda sem ele ter acontecido | `utils/dailyReset.ts` | produção |
> | Check-in do coop perdido quando dois membros marcavam na mesma noite (ler-modificar-gravar sobre o blob; KV não tem CAS) | `functions/api/community.js` | produção |
> | "Você entrou" falso na corrida por uma vaga: 200 + ponteiro gravado, e o grupo sumia na abertura seguinte | `functions/api/community.js` | borda |
> | Grupo coop ativo expirava por partes: só o blob renovava TTL, os dois índices não | `functions/api/community.js` | borda |
> | Código de convite sorteado por cima de outro, sem conferir | `functions/api/community.js` | dívida |
> | A manchete do "dia completo" ficava ATRÁS do confete (elemento posicionado pinta sobre o estático) | `DailyReportModal` | produção |
> | O `×` que dispensa o convite de compra PARA SEMPRE tinha 32 px | `DailyReportModal` | borda |
> | A caixa do aceite dos Termos renderizava achatada (14,95 × 20) por falta de `flexShrink: 0` | `form/FormKit` (`CheckRow`) | borda |
> | "Atalhos" da barra de Quick Add com 20 px de alvo de toque | `QuickAddBar` | dívida |
> | `back()` do onboarding tinha piso 0 — o passo da intro apagada, que não renderiza nada | `SoulmonOnboarding` | dívida |
> | `utils/auth.ts` sem NENHUM teste; o fallback de popup bloqueado não era vigiado | novo `auth.popupBloqueado.test.ts` | dívida |
> | Colisão latente de código de telemetria: `GOOGLE_STEP` e `REGISTER` a UM número de distância | `telemetry.test.ts` (guard) | borda |
> | Referências a `CONSENT_STEP`, apagado no dia anterior | `gateDraft`, `oracleDraft`, `telemetry` | dívida |
> | `.claude/launch.json` apontava para a porta 5173; o dev sobe na 3000 | — | dívida |
>
> ### ✅ Segunda rodada (mesma sessão) — as decisões do dono, aplicadas
>
> | Decisão | O que foi feito |
> |---|---|
> | **Preço**: "se não der para ser USD, explica que é BRL" | **Dava, e já era pela metade.** `getLocalizedPrice` (WP5.8) devolve o preço do Play na moeda da conta e o desbloqueio já usava; **os pacotes de crédito não** — imprimiam a constante em real para o planeta, na mesma tela, um andar abaixo. Corrigido. E onde a loja não responde (web/PWA/desktop) o fallback agora carimba `BRL` **só em inglês e só quando é fallback** (`precoComMoeda`) — carimbar sobre um preço vindo do Play seria transformar um preço certo em mentira, e isso tem caso próprio. |
> | **Folga × cocô**: corrigir o texto | O docstring de `REST_DAYS_PER_WEEK` dizia "do save inteiro"; agora diz "na VIRADA DO DIA", com o porquê — o dreno cobra presença com descuido, a folga perdoa ausência —, e o mesmo parágrafo foi para o cabeçalho de `poopDrain.ts`, com o aviso de mudar os dois juntos. **Nenhuma regra mudou.** |
> | **Login**: só melhorar a mensagem | Parou de prometer "estamos te levando para lá" (o redirecionamento pode não concluir). Agora oferece as duas saídas que sempre funcionam: liberar o pop-up, ou entrar com e-mail e senha, que não abre janela nenhuma. |
> | **Emoji**: gerar prompts de arte | Entrada **A21** em `docs/BACKLOG-ARTE-GERAR.md`, com prompts prontos (folha única, fundo verde `#00FF00`, `Square 1:1` no fim, recorte por chroma-key). |
> | **Marco de 21 dias** | 🪴 → **🌾**. Era o único caso em que arte não resolve: o glifo está dentro da frase, e texto inline não aceita `<img>`. |
> | **Sufixo `-mon`** | Pyrakamon/Akashaoimon/Nimbratamon → **Pyraka/Akashaoi/Nimbrata**. O `id` da linha não mudou. A regra do `CLAUDE.md` virou executável em `sprites.dungeonRoster.test.ts`. |
>
> ⚠️ **Correção do que a primeira rodada reportou.** Eu disse "9 emojis na
> tela"; conferindo um a um, são menos. **Não** chegam à tela: os 4 sonhos (o
> DreamDex já renderiza o PNG de `dreamArt.ts`), o `HABIT_TIER_EMOJI` (mapa sem
> consumidor) e o 🪙 dos Bits (só em comentário). O guard foi corrigido caso a
> caso.
>
> ⚠️ **Ao renomear apareceu um footgun 9 que ninguém tinha visto**: os três
> nomes estavam escritos à mão em TRÊS arquivos (`sprites.ts`,
> `monetization.ts`, `libraryNpcs.ts`). Renomear num só deixaria o inimigo da
> masmorra e o NPC da Biblioteca chamando a mesma criatura por outro nome, em
> silêncio. Hoje `DUNGEON_LINE_NAMES` é o dono único e os outros dois leem dele.
>
> ⚠️ **`dist/` ficou para trás de propósito nesta segunda rodada.** Havia outro
> agente trabalhando na MESMA árvore (arte de decoração, `vitest.config.ts`,
> `sw.js`), e um build meu levaria o trabalho dele pela metade junto. **Rode
> `npm run build` e commite o `dist/` quando as duas frentes fecharem.** Pelo
> mesmo motivo, o `assets.contract.test.ts` fica vermelho de forma intermitente
> na suíte cheia enquanto ele reescreve os PNGs de decoração — passa sozinho,
> não é defeito do repositório.
>
> ### Aberto — precisa de você
>
> 1. **Emojis que renderizam como caixa vazia** (bloco U+1FA70–U+1FAFF, Emoji
>    12+). O que ainda falta, depois da 2ª rodada, é ARTE — e cada um já tem
>    entrada de backlog: 3 cenas da aventura (**A20**), 5 mobílias da loja e do
>    palco (**A7** — que o agente de arte fechou em 08/09/2026, conferir), o
>    traço Carinhoso (**A15**) e os dois controles do overlay de desktop
>    (**A21.1**, com o prompt pronto). O inventário caso a caso, e o que NÃO
>    chega à tela, está em `src/styles/emojiSuportado.contract.test.ts`, que
>    também impede a dívida de crescer.
> 1-bis. **⚠️ `Cross-Origin-Opener-Policy` — decisão sua, e é a raiz de um
>    defeito.** Achado em 09/09/2026, no console de produção do dono, ao testar
>    o item 2 abaixo (o pop-up NÃO foi bloqueado, então aquele teste não rodou —
>    mas o console entregou outra coisa):
>
>    ```
>    Cross-Origin-Opener-Policy policy would block the window.closed call.
>      pollUserCancellation → setTimeout → …
>    ```
>
>    `pollUserCancellation` é o laço do Firebase que lê `popup.closed` de 2 em 2
>    segundos, e é a ÚNICA coisa que rejeita com `auth/popup-closed-by-user`. O
>    `accounts.google.com` manda COOP, corta a relação com a janela que o abriu,
>    e esse `closed` fica ilegível deste lado. Conferido com `curl`: a produção
>    **não manda cabeçalho `Cross-Origin-Opener-Policy` nenhum**.
>
>    O caminho felizo passa (o dono entrou normalmente). O risco é fechar a
>    janela sem escolher conta: aí a promessa pode não terminar, e o
>    `authOcupado` nunca voltaria a `false`. **HIPÓTESE, não reprodução** — o
>    navegador automatizado navega na mesma aba em vez de abrir pop-up, então
>    não houve janela para fechar, e não foi verificado se o Firebase desiste
>    sozinho.
>
>    Já entrou a REDE DE SEGURANÇA (`GOOGLE_SEM_RESPOSTA_MS`, 2 min): passado o
>    prazo o botão volta com uma mensagem honesta, **sem cancelar a promessa** —
>    um login que conclua depois entra normalmente. Isso torna a falha
>    recuperável mesmo que a causa continue.
>
>    **O que falta é seu:** pôr `Cross-Origin-Opener-Policy: same-origin-allow-popups`
>    no `public/_headers`, que é o valor documentado para quem usa pop-up de
>    login. Não fiz porque cabeçalho já derrubou este login uma vez (a CSP sem
>    `apis.google.com`, em 07/09/2026, reportada como `auth/internal-error`
>    genérico). Se autorizar, o push publica em ~2 min e o login precisa ser
>    testado em produção depois.
>
> 2. **`signInWithRedirect` pode estar morto no navegador do usuário.** É a
>    única saída quando o popup do Google é bloqueado, e o `authDomain`
>    (`soulmon-app.firebaseapp.com`) é um domínio diferente do app: desde o SDK
>    9.19 o Firebase avisa que o redirecionamento não funciona onde o
>    armazenamento de terceiros é bloqueado (Chrome, Safari/ITP, Firefox/ETP), a
>    menos que `/__/auth/handler` seja servido pelo domínio do próprio app.
>    **HIPÓTESE, e AINDA EM ABERTO** — a tentativa de 09/09/2026 não conseguiu
>    bloquear o pop-up (ele abriu), então o caminho do redirecionamento nunca
>    foi exercido. Para testar de novo: janela anônima, o site na lista de
>    bloqueio de pop-up de `chrome://settings/content/popups`, console aberto, e
>    olhar se a linha `[auth] entrarComGoogle falhou` aparece com
>    `auth/popup-blocked`. Se confirmar, a correção é servir o handler no
>    domínio do app — a mesma do item 1-bis.
> 3. ~~A folga da semana não cobre o dreno de cocô~~ — ✅ decidido na 2ª
>    rodada: o TEXTO estava errado, não a regra. Corrigido nos dois arquivos.
> 4. ~~Preço em R$ para quem está em inglês~~ — ✅ resolvido na 2ª rodada.
> 5. ~~Sufixo `-mon` nos três personagens prontos~~ — ✅ resolvido na 2ª rodada.
>
> ### O que foi conferido e está CERTO (para ninguém revisitar à toa)
>
> - Contraste: **nenhuma falha** em nenhuma tela, medido sobre a cor composta.
>   Menor razão por tela: 6,46 · 5,57 · 7,43 · 6,30 · 6,30.
> - Nenhum controle sem nome acessível; nenhuma rolagem horizontal em 375 px;
>   nenhum alvo de toque abaixo de 44 px depois dos dois consertos.
> - **Texto num idioma só: nada encontrado** em `src`, `functions`, `workers` e
>   `desktop/renderer`.
> - Build sem `.env` conferido NO NAVEGADOR: o portão degrada e dá para
>   atravessar o app inteiro.
> - Nenhuma rota `coop*` devolve `saveId`; as cinco passam por
>   `denyUnlessOwner`; `coopOf:` órfão se autolimpa; força bruta do código de
>   convite é inviável (32^8 contra 120 req/min/IP).
> - A tela cheia do relatório não é o empilhamento que se temia: `restDayUsed` e
>   o convite de compra **nunca** aparecem juntos (a folga exige perda; o
>   convite exige dia completo; dia completo não perde). Piores casos reais:
>   1,11 e 1,37 tela.
> - Nenhuma tela órfã alcançável depois da remoção do consentimento e da intro.

> ## ⚠️ 07/09/2026 — NINGUÉM NUNCA USOU O APP EM PRODUÇÃO
>
> Informado pelo dono. É o fato mais consequente registrado aqui, porque **44
> pontos do código e da documentação decidem coisas com base na premissa
> contrária** — "renomear quebraria o save de quem já joga", "os APKs já
> instalados", "quem não atualizou". Não há quem.
>
> O que isso muda, em ordem de peso:
>
> 1. **57 nomes de personagem registrado da Bandai estão no bundle de
>    produção** (`LEGACY_FORM_TIERS`, `src/types/progression.ts` — `agumon`,
>    `greymon`, `veemon`, `tapirmon`, `salamon`…, conferido no `dist/`). A
>    ÚNICA justificativa escrita para eles é compatibilidade de save. O
>    `docs/Attributions.md` declara que "saiu tudo" da Bandai: a arte saiu, os
>    **nomes não**. Com zero saves de terceiros, isso é superfície de risco de
>    IP sem nenhum benefício — e vai para a Play Store junto.
> 2. **A telemetria não tem urgência.** Sem usuários não há dado: as chaves
>    `METRICS_ADMIN_KEY`/`SEASON_ADMIN_KEY` da seção 3.2 deixam de ser
>    bloqueio e viram pré-requisito de lançamento. Nada se perdeu — a escrita
>    funciona e o KV guarda por 730 dias.
> 3. **Toda a régua de retenção D1/D7/D30 e a curva D30–D90 são HIPÓTESE.**
>    Estão implementadas e coerentes com a pesquisa, e nenhuma foi confrontada
>    com um usuário real. Nenhum número do produto foi observado.
> 4. **O gargalo não é mais o produto, é a DISTRIBUIÇÃO.** Sete sprints de
>    polimento foram feitos para zero pessoas.
>
> **A limpeza foi feita no mesmo dia** (fatias 1 a 5, oito commits em `main`).
> Além dos quatro itens acima, ela achou três coisas que ninguém tinha visto:
> o `AndroidManifest` anunciava os cinco widgets como **"DigiApp"** na lista de
> widgets do celular (texto que o usuário lê); o `assetlinks.json` servia o
> **pacote do DigiApp como padrão** no nosso domínio, ou seja, uma declaração
> falsa de propriedade; e `src/supabase/.../chat.tsx` era um **segundo endpoint
> de LLM, publicado, sem autenticação e sem nenhuma** das treze proteções do
> `functions/api/chat.js` (bloco NEVER, redação, allowlist de contexto, teto de
> custo do `_aiGuard`). Os três foram fechados.
>
> **O que sobra depende de você, não do código:** separar o namespace KV
> (`docs/SEPARACAO-DIGIAPP.md`, passo 2 — o NOME do binding já não trava, o
> `_kv.js` aceita os dois) e o projeto Firebase (passo 4).
>
> O que isto NÃO autoriza: apagar a compatibilidade de save por conta própria.
>
> **Fecho da sessão (07/09/2026, noite).** Os 17 achados da
> `docs/AUDITORIA-ALINHAMENTO.md` foram trabalhados até o fim e o arquivo
> ganhou a tabela de verificação, com o comando que responde por cada um.
> Depois da limpeza, três coisas a mais:
>
> - **WP3.1 fechou de verdade**: o chat agora manda o estado de agora (HP,
>   energia, Vínculo, dias fora, humor do dia) e as últimas trocas. Quem corta
>   a memória é o SERVIDOR, e toda fala do usuário no histórico passa pela
>   mesma minimização da mensagem atual. `goalCategory` saiu do schema — era
>   declarado, enviado por ninguém e lido por ninguém.
> - **Guard de fiação do KV** (`_kv.fiacao.test.js`): todo teste de rota semeia
>   o binding ANTIGO e passa pelo fallback, então um `env.DIGIAPP_SAVES` cru
>   reintroduzido ficaria verde até o dia em que o painel expusesse só o nome
>   novo. Agora uma rota real é exercida com **só** `SOULMON_SAVES`.
> - **Lixo de edição no `App.tsx`**: o nó do `FirstDayCard` carregava uma
>   expressão-vírgula sobrando de um `sed` malfeito. Compilava e funcionava por
>   acidente (a vírgula devolvia a `dayKey`, sempre verdadeira). Apagado.
> O dono pode ter o próprio save no aparelho dele, e "ninguém em produção" não
> é o mesmo que "nenhum save existe". É decisão dele, e o custo de errar é o
> save dele — recuperável, mas dele.

> **01/09/2026** — entrou o **`docs/GUIA-EXPERIENCIA.md`** (guia mestre de
> melhoria de experiência: onboarding/Oráculo, "streak" sem punição, vínculo,
> paywall, retenção, DON'Ts e roadmap P0→P3) + 7 relatórios de pesquisa em
> `docs/guia-experiencia/` (canais Mobbin/Tim Gabe, Tamagotchi effect,
> gamificação, monster taming, onboarding, monetização, retenção). Só docs —
> nenhuma regra de jogo mudou. As 8 decisões que dependem do dono estão na
> seção final do guia. Gate na árvore desta mudança: `tsc` EXIT=0,
> `vitest` 2852 passed · 2 skipped.

> **06/09/2026 — SPRINT 2 COMPLETO: 7 lotes, 26 pacotes verificados.** O que as
> decisões destravaram foi implementado no mesmo dia, e o fio condutor de quase
> tudo foi **código escrito, testado e mudo**:
> · **as 12 recompensas do Vínculo** (níveis 2–13) nunca chegavam a ninguém —
> `bondRewardsClaimed` jamais era escrito. Só o título chegava, porque é
> derivado, e era essa a única peça que não precisava de ninguém para funcionar
> · **a medalha da estação NÃO PODIA SER GANHA por ninguém** desde que
> `seasons.ts` existe: 500 linhas, teste próprio, cinco regras inegociáveis no
> cabeçalho, zero consumidores · **o canal de fala do pet estava desligado**:
> treze pontos do app mandavam "fale agora" e o HUD não lia nenhum · **a oferta
> dos "5 minutos" e o selo dos 3 focos**, os dois prometidos por escrito no guia
> e no CLAUDE.md, não existiam · **`daysToEvolve` + `EVOLVE_SEGMENTS`**: dois
> números mortos ao lado do vivo, apagados junto com os campos de save que eles
> alimentavam.
> **Dinheiro parou de comprar coração pelos dois caminhos** (D7+D15) — e só por
> isso a frase "pagar nunca deixa sua criatura mais forte" pôde entrar na tela
> de compra, com teste amarrando a frase ao fato. **O perfil do amigo perdeu a
> métrica de desempenho** (E3/#21) em três camadas, e a terceira ninguém tinha
> visto: o diretório era ORDENADO por rank, o que faz dele um placar mesmo sem o
> número aparecer. **O leitor de métricas existe** e espera só a chave (D1).
> Três achados foram maiores que o pacote que os encontrou; estão no `LEDGER.md`.
> Gate em cada lote: tsc app + desktop EXIT=0, vitest **193 arquivos · 2998
> passed · 2 skipped**, build OK.

> **06/09/2026 — O PLANO INTEIRO FOI PERCORRIDO: 87 pacotes, PROPOSTO em ZERO.**
> Sprints 3 a 7 rodaram na mesma sessão, em lotes com gate completo
> (`tsc` app + desktop, `vitest`, `build`) e merge ff-only em `main` a cada
> lote. O estado final: **77 VERIFICADO · 8 IMPLEMENTADO · 2 RECUSADO · ZERO
> PROPOSTO · ZERO BLOQUEADO** (`docs/plano-melhorias/LEDGER.md`).
>
> **Os 8 IMPLEMENTADOS não são pendências esquecidas** — o código está no repo,
> testado e mergeado, e o que falta em cada um não é código:
> · **WP0.1** espera `METRICS_ADMIN_KEY` no Pages;
> · **WP0.6, WP2.6, WP5.8** esperam um APK novo (§3.2);
> · **WP4.6** tem o álbum e o bestiário e deixou o **Abismo** (andares 6–8)
> declarado como aberto; **WP4.7** tem o motor de missões semanais e falta a
> fiação dos contadores; **WP3.1** tem o bloco CONTEXT e falta a memória de
> sessão; **WP1.2** tem o eco do `soulGoal` e a cerimônia, e falta a régua da
> bio em `composeBio`.
>
> O fio condutor de tudo isso, em uma frase: **o app parou de prometer coisas
> que não fazia.** O pet olha a assombrada, o título do Vínculo chega na home,
> o `soulStruggle` volta na hora que dói, o reveal mostra a criatura, a faixa
> do Torneio não rebaixa mais por motivo que não é do jogador, o lembrete de
> deitar existe, os Bits têm onde ser gastos, a queda tem volta e a compra não
> cobra duas vezes. Cada uma dessas era uma frase escrita em algum documento
> deste repositório e falsa no código.
>
> Gate final: tsc app + desktop EXIT=0, vitest **223 arquivos · 3359 passed ·
> 2 skipped**, build OK.

> **06/09/2026 — NOVA MECÂNICA: RENASCIMENTO (Rebirth).** Pedido do dono nesta
> sessão, com as quatro decisões de forma respondidas antes do código
> (**D-R1..D-R4**, em `docs/RENASCIMENTO.md`). Depois do **Ultra**, quem
> comprou pode devolver a criatura ao ovo **uma vez só**: ela volta a Rookie e
> os três atributos zeram, e em troca o jogador escolhe **criatura** (campo
> aberto), **escola** (as 6 do Class-System) e **elemento** (base ou par de 2º
> nível), com o orçamento da ficha multiplicado por 1.5 em TODOS os estágios.
> Quatro coisas que definem a peça:
> · **não reabriu o estágio `egg`** — ele foi apagado da escada com motivo; o
> ovo aqui é a CERIMÔNIA, e `types/progression.ts` não mudou;
> · **perde-se o estágio e os atributos, e SÓ** — Bits, Emblemas, Créditos,
> decoração, cenários, sonhos, hábitos, tarefas, `perfectDays` e
> `unlockedEvolutions` passam intactos, com teste listando campo por campo. A
> regra geral (perda só sobre item recuperável) continua de pé: o Rebirth é
> uma TROCA declarada, não uma exceção a ela;
> · **as escolhas têm consequência medível**, não são enfeite: orçamento
> (`REBIRTH_BUDGET_MULTIPLIER`), piso da escola na ficha, viés do elemento na
> cascata, e as três dentro do prompt das 11 formas — o campo aberto entra
> **entre aspas**, que é o que impede o texto do jogador de virar instrução;
> · **gera antes de gravar**, porque a chance é única: perfil corrompido faz a
> geração lançar, e queimar o Rebirth sem entregar criatura seria a pior falha
> possível deste app.
> Gate: tsc app + desktop EXIT=0, vitest **198 arquivos · 3098 passed · 2
> skipped**, build OK.
> ⚠️ **Aberto**: a arte do ovo, telemetria do degrau final e a fala do pet ao
> renascer — os três listados no fim de `docs/RENASCIMENTO.md`.

> **06/09/2026 — SPRINT 3 COMPLETO: 5 lotes, 7 pacotes verificados** (WP4.2,
> WP5.7, WP3.9, WP1.16, WP2.11, WP0.8, WP4.18). O fio condutor mudou: no Sprint 2
> era código mudo; aqui é **promessa que dependia de alguém lembrar**.
> · **WP4.2 (D6) — o Ultra deixa de exigir degeneração.** `canReachUltra` abre a
> forma por COLEÇÃO (os três megas) **ou** por PERMANÊNCIA (`ULTRA_PATIENCE_DAYS`
> = 45 dias perfeitos). O único caminho antes passava por deixar o pet chegar a
> HP 0 — o jogo pedindo descuido para dar a maior recompensa.
> · **WP5.7 — o reroll virou Nova Leitura, e é DETERMINÍSTICA.** Pagava-se 50
> Créditos por um `Math.random`; agora o resultado sai das 6 respostas (semente
> FNV-1a sobre a ordem FIXA de `ORACLE_QUESTIONS`, nunca `Object.keys`) e o botão
> fica desligado enquanto nada mudou. A regra é dita ANTES de cobrar, e os termos
> (`public/termos.html` §5) foram reescritos nos dois idiomas.
> · **WP3.9 — ponte de ajuda no chat.** A checagem roda ANTES de qualquer rede,
> num módulo puro (`chatSafety.ts`); a distinção entre desabafo e declaração é
> pelo COMPLEMENTO ("morrer de sono" ≠ "morrer"), com a única exceção do PT-BR
> ("de vez") escrita como regra e não como lista de frases.
> · **WP1.16 + WP2.11 — `bornAt`, aniversário e "dias juntos".** Nunca inferido
> de save antigo: sem o campo, não há aniversário; `daysTogether` devolve `null`
> se o relógio andou para trás, nunca número negativo.
> · **WP0.8 — o esforço virou HISTOGRAMA no servidor.** A média era dominada por
> quem cadastra projeto e era ela que decidia leitura de produto; agora o leitor
> imprime MEDIANA de verdade, com a média rebaixada a nota. O balde é derivado do
> `effort` que já chegava — **nada de novo sai do aparelho**.
> · **WP4.18 — a season do Torneio fecha sozinha.** Os troféus 🥇🥈🥉 existiam
> inteiros (rota, vitrines no palco) e só chegavam se o dono lembrasse de
> disparar a rota à mão. Cron das 10h BRT do dia 1, rodando ANTES do `return` de
> hora sem push declarado, com a idempotência (`closed:<season>`) no SERVIDOR —
> cron repete, e a trava tem de morar onde a escrita acontece.
> Gate: tsc app + desktop EXIT=0, vitest **197 arquivos · 3080 passed · 2
> skipped**, build OK. Ledger: **33 VERIFICADO, 1 IMPLEMENTADO, ZERO BLOQUEADO**.
> ⚠️ **Depende de você**: `SEASON_ADMIN_KEY` (secret do wrangler no worker de
> push, mesmo valor do Pages) — sem ela o fechamento é pulado com log; e
> `METRICS_ADMIN_KEY` no Pages, que segue pendente do Sprint 2.

> **06/09/2026 — AS 16 DECISÕES DO DONO, RESPONDIDAS. A coluna BLOQUEADO zerou.**
> Estavam abertas desde a criação do plano; foram respondidas de uma vez (§15 do
> `PLANO-MELHORIAS.md`). Onze pacotes saíram do bloqueio, um virou RECUSADO com
> motivo, um nasceu — o plano vai a **87 pacotes, zero esperando por você**.
> As de maior consequência:
> · **D7+D15 — dinheiro para de comprar coração pelos DOIS caminhos**: sai a cura
> instantânea por Créditos E o 💗 sai da loja de Bits (fica só como drop da
> masmorra). Era a única forma de "dinheiro nunca compra cuidado" virar verdade
> sem asterisco, porque o trilho Créditos→Bits→💗 vendia +1 coração por 15
> Créditos sem cap.
> · **D4 — a AURA é o que dói, e só ela.** É a régua das ondas 2 e 4: nenhuma
> outra mecânica ganha peso de perda, e nenhum perdão novo entra sem passar por
> ela. Junto com D7, fecha a tensão que o plano carregava desde a rodada 3 (o
> produto empilhava perdões para o coração não doer **e** vendia a cura).
> · **D5 — `daysToEvolve` será APAGADO.** O gate é `required` (4/5/5/6) e ponto.
> · **D6 — Ultra sem degeneração forçada**: o topo deixa de exigir que o jogador
> machuque a criatura de propósito.
> · **H.4 — o reroll vira "Nova Leitura" determinística**, fechando a única
> violação declarada da lista de proibições que ainda estava de pé no código.
> · **D1 resolvida sem depender de você**: o leitor de métricas é escrito e
> testado ANTES da chave, e passa a esperar por ela.
> · **D3 — escudo fica em 3** (nossos escudos são conquistados, os do Duolingo
> são dados: o dado não transfere) e **D12 — a árvore grátis não ramifica, e a
> copy muda** (o modo grátis assume que é demonstração em vez de fingir paridade).
> · **D16 PARCIAL**: entra a ponte de ajuda no chat (CVV 188), não entra a linha
> de disclaimer. Só docs; nenhuma regra de jogo mudou ainda — a implementação é
> o próximo sprint.

> **06/09/2026 — SPRINT 2, LOTE 1 (6 pacotes VERIFICADOS)** — **WP4.17: o guia
> mentia sobre a regra mais importante do jogo.** Ele dizia "Rookie→Champion
> pede 10 dias perfeitos" lendo `daysToEvolve`, um campo que NENHUMA regra
> consulta; o gate real é `required` = **4**. O botão de evoluir acendia e o
> guia dizia que faltavam mais 6 — na tela que a pessoa abre justamente quando
> não entendeu. No caminho apareceu coisa pior: o `CompanionHUD` recebia
> `digivolutionSegments`, `digivolutionSegmentsNeeded` e `requiredDays` — três
> fontes do mesmo número — e **não desenhava nenhuma**; as três saíram ·
> **WP4.20**: o cabeçalho de `dungeon.ts` afirmava reset mensal, limite diário
> de partidas e derrota que custa coração; as três eram falsas desde que
> `handleDungeonLose` virou callback vazio. Corrigido, e a REGRA travada por
> teste (a derrota não pode voltar a cobrar da barra de cuidado) · **WP1.9**: o
> "porquê" escrito no onboarding agora recebe um eco ("Anotado. Seu Soulmon vai
> lembrar disso") — só para quem escreveu · **WP1.10**: a oferta do teste longo
> diz o que muda e quanto custa, em vez de prometer que "afina" a criatura ·
> **WP0.13/WP0.14**: `haunted_done` e `checkin_shown` — o numerador de "a pilha
> de culpa virou loop de jogo?" e o denominador que faltava para `checkin_commit`.
> Aqui também apareceu um defeito: **`ONCE_PER_DAY` valia pela metade** (o dedupe
> de fila era um `if` literal para `day_active`), então o denominador novo poderia
> ser contado várias vezes por dia. Generalizado.
> Gate: tsc EXIT=0 (app + desktop), vitest **184 arquivos · 2927 passed · 2 skipped**.

> **03/09/2026 — RODADA 4: o corpus PRÉ-Mobbin destrinchado** — os relatórios
> 01–07, as transcrições 08 e o guia alimentaram o plano na criação, mas só o
> dossiê Mobbin tinha sido confrontado linha a linha com o código. Agora os seis
> guardas fizeram isso (`docs/plano-melhorias/estudo/`, ~300 linhas fonte × código
> × veredito) e a linha vermelha deu parecer a 41 candidatas (17 aprovadas, 23 com
> ressalva, 1 vetada). **O plano vai a 86 pacotes** (+36, seção 14). O achado
> transversal é **código escrito, testado e sem consumidor**: `needsIntervention`
> (o "só 5 minutos" que o guia promete nunca aparece), `focusComplete` (o selo dos
> 3 focos), `BOND_REWARDS` (12 recompensas do Vínculo que ninguém recebe),
> `SEASON_PATHS`/`applySeasonMedal` (estações desligadas), `sleepReminderAt`,
> `triggerMessage` e 7 dos 9 eventos de telemetria novos. Sete premissas do plano
> caíram; a métrica-farol é MÉDIA onde a fonte proíbe média. **Decisões novas:
> D15** (o trilho Créditos → Bits → 💗 vende +1 coração por 15 Créditos sem cap —
> a linha vermelha vetou "aceitar e nomear"; alternativa: 💗 sai da loja de Bits),
> **D16** (texto de saúde mental no chat) e **D17** (upgrade mantém `bornAt`?).
> Só docs; nenhuma regra de jogo mudou.

> **03/09/2026 — SPRINT 1, LOTE 3 (2 VERIFICADOS; sprint fechado com 9+1)** —
> WP3.7: a criatura deixou de ser "ele" no Guia/push/Configurações e "ela" na
> página do Pet — **36 trechos** em 22 arquivos viraram "seu Soulmon" ou frase
> reestruturada, PT e EN (dois "he" ingleses saíram); push das 16h mudou nos
> dois lados (`NotificationManager` + `_pushCopy.js`) · WP1.7: **rascunho do
> ritual do Oráculo** (`utils/oracleDraft.ts`, chave `ORACLE_DRAFT`): fechar o
> app no item 15 de 20 volta ao item 15 com tudo preenchido; retoma só entre o
> nome e o último item do teste (nunca na geração), guarda o `ConsentRecord` e
> nunca e-mail/idade/resultado; apagado na geração, no `finish()` e no muro de
> idade. Gate: tsc EXIT=0 (app + desktop), vitest **180 arquivos · 2900 passed · 2 skipped**.

> **03/09/2026 — SPRINT 1, LOTE 2 (2 VERIFICADOS, 1 RECUSADO)** — WP2.3: o botão
> do check-in virou compromisso ("Assumir minha meta de hoje" / "Commit to
> today’s goal"; volta a "Começar o dia" sem meta cadastrada) e
> `handleCheckInConfirm` emite `checkin_commit { focus_count }` — só o confirm,
> nunca o pular · WP5.5: `UnlockAccountModal` ganhou **"Agora não"** com a mesma
> largura do primário, emitindo o evento novo `unlock_dismiss { reason }`
> (dois schemas, paridade, linha PT+EN na política; no caminho, `REASON_LABEL`
> do agregador só tinha 2 rótulos para 4 valores — `report`/`shop` viravam
> `unknown`) · **WP4.4 RECUSADO — premissa falsa**: as estações NÃO expiram em
> 2027, `coversDay` compara mês/dia desde a origem e havia teste em 2031; o
> único `null` é a folga deliberada de 28/29/fev. Teste novo varre 2026–2036.
> Não houve bump de `CACHE_VERSION`: `privacidade.html` não está no
> `PRECACHE_URLS` e navegação é network-first. Gate: tsc EXIT=0 (app + desktop),
> vitest **178 arquivos · 2890 passed · 2 skipped**.

> **02/09/2026 — SPRINT 1, LOTE 1 (5 pacotes VERIFICADOS)** — WP0.3 (política de
> privacidade dizia "sete eventos", eram dez; agora não escreve número e um teste
> exige todo evento do `EVENT_SCHEMA` na tabela PT/EN) · WP0.5 (8 eventos novos
> nos DOIS schemas com paridade: `reveal_seen`, `checkin_commit`, `milestone`,
> `shield_used`, `welcome_back`, `evolve`, `dungeon_run`, `bond_level`;
> `unlock_view.reason` até 3) · **WP0.7 — o save foi medido pela primeira vez:
> 79.602 bytes (77,7 KB) para 90 dias pesados, 64× abaixo do teto de 5 MB** ·
> WP2.9 (teste de guarda: `HabitConstancy` nunca imprime `N%` no texto visível)
> · WP4.9 (o "roster de 60" era falso — comentário morto de `progression.ts`
> reescrito; teste novo trava que a masmorra só sorteia das 6 linhas nossas).
> Gate: tsc EXIT=0 (app + desktop), vitest **176 arquivos · 2880 passed · 2 skipped**.

> **02/09/2026 — RODADA 3 (dossiê Mobbin)** — o plano foi a **50 pacotes** (+14).
> O código está **exposto em 5 anti-padrões catalogados**: o widget Android cobra
> (`"N task(s) left, let's go!"`), Créditos compram HP (D7), o perfil do amigo
> mostra rank e escada (nova proibição #21), Missões mostram 🔒 + `0/100`, e a
> faixa do Torneio **caduca todo mês** (lê pontos da season). Duas premissas do
> plano caíram por `grep`: não existe "roster de 60" na masmorra, e o HUD não tem
> nome do pet. As 8 decisões de produto do §16 do dossiê foram confrontadas com o
> código (1/5/7 já são assim; 4 o código é melhor que a decisão; 8b vetada no
> código até fechar E3) — pareceres em `ledger/vetos.md`. Novas decisões D12–D14.

> **02/09/2026 — SISTEMA DE GUARDA** — o plano ganhou custódia: **7 agentes
> guardas** (`.claude/agents/soulmon-guarda-*.md`), **3 skills**
> (`/guarda-soulmon`, `/implementar-wp`, `/destrinchar-estudo`) e um **livro-razão
> durável** (`docs/plano-melhorias/LEDGER.md` + `ledger/*.md`). Cada guarda possui
> uma fatia dos 36 pacotes, destrincha o estudo contra o código, e **só marca
> VERIFICADO rodando o comando de aceite e colando a saída** — sem isso o estado
> máximo é IMPLEMENTADO. O guarda da linha vermelha não possui pacote nenhum, de
> propósito, e tem veto. Linha de base medida na criação: 28 PROPOSTO, 8
> BLOQUEADO por decisão do dono. ⚠️ **A contagem "30 pacotes" estava errada —
> são 36** (`grep -c '^### WP'`), corrigida aqui e no guia.

> **02/09/2026 — PLANO DE MELHORIAS** — entrou `docs/PLANO-MELHORIAS.md`:
> 36 pacotes de trabalho em 5 ondas, sequenciados em 6 sprints, cada um com
> arquivo + símbolo verificado por seis mapeamentos do código
> (`docs/plano-melhorias/A–F`). **O código contradisse os relatórios em doze
> pontos** — os que mudam decisão: a telemetria JÁ EXISTE (10 eventos; falta
> `METRICS_ADMIN_KEY` e a coorte é impossível por desenho declarado);
> `daysToEvolve` é dado morto (evolução real = 4/5/5/6 dias perfeitos, mega em
> 14 dias, depois nada); ultra só é alcançável **degenerando de propósito**;
> `bondRewardFor` devolve `null` do L14; `SEASONS` expira em 2027-02-27; o
> catálogo de Bits esgota em D15–D23; o chat tem memória zero; a push não tem
> win-back nem dedup PWA×APK; e `setObfuscatedAccountId` NÃO EXISTE no Play
> Billing. Onze decisões do dono estão na seção 10 do plano — **D1
> (`METRICS_ADMIN_KEY`) destrava tudo**. Nenhuma regra de jogo mudou.

> **01/09/2026 (rodada 2)** — as transcrições dos vídeos foram lidas via
> NotebookLM (`docs/guia-experiencia/08-transcricoes-notebooklm.md`, 16/16
> respondidas) e analisadas na **seção I do `GUIA-EXPERIENCIA.md`**. Três
> achados que mudam decisão: (1) **`REST_SHIELD_MAX = 3` provavelmente deveria
> ser 2** — o Duolingo testou 2 vs 3 freezes e o terceiro "não foi melhor que
> dois" e "treinava o usuário a tirar mais tempo de folga" (experimento P1,
> depende de telemetria existir); (2) o Soulmon empilhou **oito** mecanismos de
> perdão sem nunca decidir **onde é a sua linha** — o risco nomeado pelo PM de
> retenção do Duolingo é a mecânica perder significado ("extinction level
> event"); (3) o caso mais forte contra gamificar produtividade (Errant Signal /
> Extra Credits) acerta a comida-por-tarefa, e fica registrado como critério de
> decisão permanente, não como pedido de remoção. **Nada de código mudou** —
> a mudança de `REST_SHIELD_MAX` é decisão do dono e está na seção H.

Última atualização: **26/08/2026 (4ª passada — a consolidação do dia)** — fecha
o dia inteiro contra `HEAD = e8aef62a`. Gate reexecutado nesta árvore:

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | **EXIT=0** |
| `npx tsc -p desktop/tsconfig.json --noEmit` | **EXIT=0** |
| `npx vitest run` | **167 arquivos · 2793 passed · 2 skipped** |

> ⚠️ **A 3ª passada dizia "3ª e última do dia" e estava errada.** Ela fechou em
> `33fd94cc`; vieram **mais ~20 merges depois**, e vários deles mudaram o ESTADO
> de achados de segurança que esta página declarava. A trajetória do dia:
> 135/2392 → 142/2483 → 149/2631 → **167/2793**. **+18 arquivos e +162 casos**
> só na noite.
>
> A lição operacional não é "escrever de novo": é que **"última passada" é uma
> afirmação sobre o futuro**, e este documento não tem como fazê-la. Ver a lição
> 2 de `squad-alpha-runs/soulmon-02/LICOES-DE-METODO.md`.

**O que entrou depois de `33fd94cc`** está na seção "Merges de 26/08/2026 —
parte 3" e, no que toca a segurança, **reconferido achado a achado na seção 1**.

> ### 📌 Mudança de FORMATO das referências, e o motivo
>
> **As referências de linha escorregaram TRÊS vezes hoje** — de manhã (auditoria
> `df3275de`), à tarde (`51401559`, depois de `b2a35465` acrescentar ~53 linhas
> de comentário de TTL no topo de `_entitlements.js`) e agora à noite (as onze
> referências de `App.tsx` da linha 🧮 do `CLAUDE.md`, todas invalidadas quando
> `dcbeb42d` tirou ~85 linhas do arquivo). Nenhuma dessas três vezes algo ficou
> vermelho: **referência `arquivo:linha` é um ponteiro sem dono.**
>
> A lição já estava formulada — *o endereço apodrece mais rápido que o número* —
> mas continuávamos pagando por ela porque o conserto adotado era **corrigir de
> novo**, que é a operação que se repete. **A partir desta passada o formato
> canônico deste documento é `arquivo` + SÍMBOLO**, com a linha só como
> conveniência opcional e sempre depois do símbolo:
>
> | ❌ Não escreva | ✅ Escreva |
> |---|---|
> | `_entitlements.js:256` | `claimOrder` em `_entitlements.js` |
> | `App.tsx:3091` | `rubDecision`, chamado no `App.tsx` |
> | `menu.ts:412` | `doPet` em `menu.ts` |
>
> **Por que o símbolo resolve e a linha não:** o símbolo é o que o leitor vai
> `grep`ar, e ele só muda quando alguém renomeia — que é uma mudança
> intencional, revisada e rara. A linha muda quando alguém acrescenta um
> comentário três telas acima, que é acidental, invisível e frequente. Quando o
> símbolo some, o `grep` vazio **diz** que o achado precisa ser reavaliado; a
> linha escorregada mente, apontando para código não relacionado — que foi
> exatamente o que aconteceu com `community.js:122` e `subscribe.js:33`.
>
> Onde o ponteiro precisa mesmo ser exato (um bloco de comentário sem símbolo, a
> saída de um `grep`), a linha fica — mas **com o símbolo mais próximo junto**,
> para o leitor conseguir se reorientar sozinho. As referências de linha que
> sobraram abaixo foram reconferidas contra `33fd94cc`; as novas já nascem no
> formato de símbolo. Ver `squad-alpha-runs/soulmon-02/LICOES-DE-METODO.md`.

A série X (X-1…X-8) **não é rastreada nesta página** e
continua não sendo — quem a acompanha é `squad-alpha-runs/`.

## 🔴 Class-System saiu do `npm ci` — artefato vendorizado (25/08/2026, ADR-002 §1)

**O problema, que já era verdade antes desta mudança:** o `class-system` é
CÓDIGO EXECUTÁVEL dentro do bundle (`src/utils/soulProfile/ficha/realEngine.ts:26`,
`await import('class-system')`) e entrava como dependência npm de git, resolvida
no `package-lock.json` como `git+ssh://git@github.com/HexerVoodoom/Class-System.git`.
Isso **só funcionava porque o repositório é público** (o npm cai para HTTPS
anônimo quando o SSH falha). O Cloudflare Pages roda `npm ci` a cada deploy —
então no dia em que o dono clicasse em "make private", **o `npm ci` do Cloudflare
falharia e a `main` pararia de publicar no push seguinte**. Não é degradação: é o
site fora do ar, sem aviso.

**O que entrou:** `vendor/class-system/` — bundle ESM + árvore de `.d.ts` +
`_provenance.json` (repo, ref, SHA, data, sha256 do bundle), tudo commitado,
gerado por `npm run vendor:class-system` a partir do clone irmão. Alias em
`vite.config.ts` e `paths` no `tsconfig.json`; o `realEngine.ts` **não mudou uma
linha** e o import DINÂMICO continua igual — o motor segue fora do bundle
inicial (medido: bundle inicial idêntico antes/depois, 620.523 B). A dependência
saiu do `package.json` e do `package-lock.json`.

**O `.d.ts` é autossuficiente de propósito**: o motivo original do snapshot
(`scripts/sync-oracle-data.mjs:14-19`) é que o typecheck estrito não pode
depender do `tsconfig` de outro repositório. Declaração não é compilada, e
`skipLibCheck` cobre o resto.

**Atualizar o vendor** é `npm run vendor:class-system` **junto** com
`npm run sync:oracle-data`. Os fixtures da cascata **não vêm mais do sync**: são
gerados do próprio vendor (`npm run gen:cascata-fixtures`), com repo/SHA/sha256
gravados no arquivo, e o `cascata.parity.test.ts` **asserta** que o SHA do fixture
é igual ao do vendor. Divergir passou a ser vermelho, não comentário.

**✅ RESOLVIDO (25/08/2026) — a réplica da cascata bate com o motor canônico.**
O achado original registrava "35 de 538 pares" — o número estava subdimensionado
porque a metodologia daquela varredura não ficou registrada. A varredura definitiva
(300 fichas × 5 estágios, gerador determinístico, contando todo par com passivos > 0
dos dois lados) mediu **21.795 de 79.199 pares divergentes**. Depois da correção:
**0 de 79.013**.

Causa, lida em `vendor/class-system/index.js:1019-1053`:
`alimento(base) = direto + Σ floor(direto(origem) × razao)` das `SINERGIAS` com
`para.length === 1`, **antes** da divisão. Sinergia de leque (`vida`→primais,
`arcano`→7) fica de fora — há teste travando isso.

**O antídoto do footgun 9 foi reconstruído**, porque a causa-raiz era ele mesmo
falhando: fixture de sync envelhecia em silêncio. Agora o fixture nasce do motor
vendorizado, SHA do fixture == SHA do motor **por construção**, e há teste falhando
se divergirem. 7 → **19 casos, 13 exercitando o transbordo**. A tabela de sinergia é
**dado**, não regra reescrita — o teste a confronta com o filtro do motor vivo.

**Cobertura travada por simulação, refeita** (400 perfis × 5 estágios): 17/17
elementos, 65/65 talentos, 11/11 profissões, 32/32 criaturas — **iguais**, com as
distribuições **byte a byte idênticas** (terra 40,8% … vileza 0,1%; ferreiro 21,8%
… luthier 2,8%). Era esperado: a correção não toca `axes.ts`. O que muda é a
largura dos pares: **44 → 50** pares destravados distintos, **240 → 265** fichas
ultra que compram um par. **Ninguém perde alcance.**

**🟠 PERGUNTA AO DONO — save antigo muda, e só no `ultra`.** A ficha é recomputada
do `SOULMON_PROFILE` a cada visita (`src/components/PetPage.tsx:163`) e regravada
no save. Medido em 120 perfis × 5 estágios: **10 perfis (8,3%) mudam, exclusivamente
no estágio `ultra`**. Muda `elementos` e o **nome da skill especial**, sempre subindo
de base para par (`Colosso de Sombra` → `Colosso de Obsidiana`; `Fúria de Luz` →
`Fúria de Chama Solar`). **`classTitle` e companheiro não mudam em nenhum perfil**,
nem rookie/champion/ultimate/mega. Ou seja: quem já está no `ultra` vê o nome da
própria skill trocar **uma vez**. Não há como evitar sem congelar a regra antiga.


**O que foi feito.** Três decisões novas do dono viraram código e entraram no
`docs/PLANO-TAREFAS.md` (Partes 3a, 3b, 3c + Roadmap reescrito):

1. **Pesadelos** (`src/utils/nightmares.ts`) — o sono deixou de ser passivo e
   virou conteúdo de combate, reaproveitando o motor da Masmorra
   (`buildNightmareWave` chama `buildDungeonWave`; nada de combate
   reimplementado). Regra central e inegociável: **a quantidade NUNCA escala com
   a duração do sono, só com a regularidade** — duração é resultado fisiológico
   que ninguém comanda às 3h da manhã (premiar resultado é como se fabrica
   ortossonia) e é farmável (é daí que veio o exploit do Pokémon Sleep, com
   gente forjando semanas de sono). Regularidade é comportamento controlável,
   tem teto natural (1 noite por noite) e é a métrica mais forte que existe
   (UK Biobank, n=60.977). O arquivo **não lê `sleptAt`/`wokeAt`**, e há teste
   travando: noites de 3h e de 11h com a mesma regularidade devolvem resultado
   idêntico. 1 pesadelo por noite dentro da janela, onda curta de 2 inimigos
   (é de manhã), vencer devolve energia e até **meio coração** — o sono
   contribui para a saúde do pet **através do combate**, nunca por bônus
   passivo, que seria score de sono disfarçado. Perder não custa nada; não
   combater também não (expira em silêncio). Sonho é a coleta, pesadelo é o
   combate: as duas faces da mesma noite.
2. **Passos** (`src/utils/steps.ts`) — substitui a antiga dependência de Health
   Connect para passos. Sensor `TYPE_STEP_COUNTER` via
   `@capgo/capacitor-pedometer`, permissão `ACTIVITY_RECOGNITION` (runtime
   simples), **sem** Health Connect e **sem** Google Fit. Princípio mantido:
   *declarado pontua, inferido confirma* — passo nunca pontua sozinho, só dá
   selo de "verificado" + bônus pequeno a um hábito JÁ marcado, e quem não tem
   sensor não fica em desvantagem estrutural. Guarda-se só o agregado diário.
   Limitação técnica registrada: o plugin conta desde o início da sessão de
   medição, então há reset por relançamento **além** do reset de boot — os dois
   caem no mesmo caminho puro (`stepsDeltaFrom`/`updateStepBaseline`, que nunca
   devolve negativo), e passos com o app morto ficam de fora. Aceitável
   justamente porque passo não pontua sozinho.
3. **Nada de mais medidores** (`src/utils/petNeeds.ts`) — decisão de NÃO
   adicionar barras. O app já tem cocô, energia, banho, dormir e carinho; do kit
   clássico faltava só brincar. Cada barra nova é uma cobrança nova (Habitica:
   usuários gastando mais tempo administrando o app que fazendo os hábitos; quem
   retém tem MENOS sistemas). Entraram no lugar: **brincar como dreno de
   recurso** (1×/dia, gasta energia que veio de comida que veio de tarefa real,
   buff de +20% no minijogo seguinte; nunca condição de dia perfeito/HP/
   evolução) e **cansaço como estado DERIVADO** (sobrecarga de ontem + noite
   fora da janela, apenas cosmético — nunca reduz recompensa nem trava ação,
   porque reduzir puniria exatamente quem trabalhou demais). Regra de ouro
   registrada para qualquer parâmetro futuro: ou é alimentado por tarefa real
   cumprida, ou gasta recurso que veio de tarefa real.

**O que ficou pendente desta rodada.**

- 🔴 **O APK precisa ser rebuildado.** O plugin de pedômetro é código nativo e
  mudou `android/` — e a regra normal ("mudança web não precisa de APK") **não
  vale aqui**. O `android-build.yml` builda no push; o artefato sai em
  `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`. **Sem APK novo nada
  quebra**: a camada de passos degrada sozinha (`isStepsAvailable() === false`,
  `readStepsToday() === null`), exatamente como já degrada na PWA, e o app segue
  idêntico — só sem passos.
- 🟡 A camada de cima dos passos ainda não existe: **selo de "verificado"** nos
  hábitos de Fitness/Health e **missões corporais** com teto diário. Quando
  forem ligadas, é sempre como confirmação de algo já declarado — nenhuma
  função de `steps.ts` pode passar a devolver HP, energia, `perfectDays` ou peso
  de esforço.
- 🟡 UI dos Pesadelos (a tela de manhã que apresenta a luta) e do Brincar são de
  outros donos desta mesma rodada.
- ⛔ **Health Connect continua FORA, e agora por decisão registrada**, não por
  falta de tempo: conta de organização verificada no Play, declaração de health
  app, política de privacidade dedicada e consentimento LGPD art. 11 por
  finalidade — custo desproporcional para um selo cosmético que a mecânica de
  sono já entrega **sem sensor nenhum**. Google Fit segue morto (APIs até o fim
  de 2026); nada deve ser escrito contra ele.

---

Antes disso: **motor de tarefas — Fases 1 a 3 do `docs/PLANO-TAREFAS.md`
(19/08/2026)**.

**O que foi feito.** Cinco módulos novos, todos funções puras com testes:
`src/types/taskModel.ts` (dono único dos tipos e das constantes),
`utils/habitRhythm.ts` (constância "N das últimas 7", escudos automáticos,
never-miss-twice, marcos 7/21/66), `utils/taskTriage.ts` (esforço, quando ×
prazo, contador de adiamentos, assombrada, someday/dropped, foco do dia, aviso
de sobrecarga, fila de triagem), `utils/restWindow.ts` (Janela de Descanso,
média móvel, 18 Sonhos) e `utils/rituals.ts` (check-in, relatório semanal com
sugestão de habit stacking, fresh start). E a mudança de regra mais profunda:
**a meta do dia passou a ser PONDERADA POR ESFORÇO** em `utils/dailyReset.ts`
(hábito pesa 1, tarefa pesa o próprio `effort` 1–3; `someday`/`dropped` não
entram) — enquanto tudo valia 1, cadastrar cinco triviais rendia mais que
encarar a difícil, que é o defeito documentado do Karma do Todoist. É
retrocompatível por construção (`normalizeEffort` devolve 1 para item sem o
campo, então em save antigo peso == contagem). A documentação do jogador foi
atualizada junto: `GuideModal` ganhou 6 seções novas (esforço e meta, os três
modos de recorrência incl. "contar da conclusão", constância/escudos/marcos,
tarefas e suas saídas, Janela de Descanso e Sonhos, rituais) e `HelpModal`
ganhou 13 verbetes novos, PT+EN, com **todos os números saindo das
constantes** — nenhum literal escrito à mão. As linhas de ⭐ Dia perfeito e
❤️ Corações do `CLAUDE.md` foram corrigidas (diziam "min(cadastradas,
requisito)" contando ITENS; agora dizem peso) e a tabela de regras ganhou o
bloco "Motor de tarefas".

**O que ficou pendente.**

- 🔴 **Fase 4 (sensores via Health Connect) NÃO foi implementada, e é DECISÃO DO
  DONO.** Nada no código de hoje lê sensor: a Janela de Descanso funciona
  inteira sem permissão de saúde, igual na PWA e no APK, e isso é escolha de
  arquitetura, não limitação. Ligar a Fase 4 custa, **antes de qualquer linha de
  código**: (1) **conta de organização verificada no Google Play** — enforcement
  de jan/2026; se o publisher for conta pessoal, isso é bloqueador absoluto;
  (2) **declaração de health app** no Play Console; (3) **política de privacidade
  dedicada** (sono/passos são dado sensível sob LGPD art. 11, exigindo
  consentimento específico e destacado por finalidade — checkbox dentro dos
  Termos é juridicamente inválido); (4) **APK novo** (é mudança em `android/`).
  Some-se a janela de 30 dias do Health Connect (só lê os 30 dias anteriores à
  concessão, e reinstalar recomeça a contagem), que empurra a espelhar dado
  sensível no backend. Se e quando o dono decidir seguir: guardar **agregados
  diários** ("regularidade da semana = 0,82"), nunca séries brutas — isso sai
  quase inteiro do escopo de dado sensível. O plano só previa a Fase 4 **se** a
  Fase 3 provar que move retenção; ela é opt-in e só Android.
- ⛔ **Google Fit está sendo desligado e NADA deve ser escrito contra ele.**
  Cadastros novos fechados desde 01/05/2024, APIs suportadas só até o fim de
  2026. Não existe uma linha contra o Fit no repositório, e isso é de propósito.
  O caminho — se e quando o dono decidir — é **`@capgo/capacitor-health`**, o
  único plugin Capacitor vivo e mantido em 2026 que expõe `SleepSessionRecord`
  (o `capacitor-health` original do mley **não** expõe sono). O app já é
  Capacitor: seria adicionar plugin + permissões ao build Android existente, não
  fazer app novo. Na **PWA pura não existe caminho nenhum** — não há ponte web
  para Health Connect nem HealthKit.
- 🟡 A UI dos módulos novos é de outros agentes desta mesma rodada (`App.tsx`,
  `CreateModal.tsx`, `src/utils/`): guia e glossário já descrevem as regras, então
  qualquer tela que chegue depois precisa bater com o que está documentado ali —
  se divergir, o texto está certo e a tela está errada (o guia lê as constantes).
- 🟡 Fase 2 do plano com entrega parcial: `Quick Add` de uma linha (parsing
  PT-BR/EN, `!1..!3`, `#categoria`, `*3x semana`) e a **aventura narrada** do pet
  no relatório noturno ainda não existem como código.

Antes disso: **kit de UI pixel — rodada de arte (18/08/2026)**. 142 PNGs
gerados (Gemini no navegador + desenho determinístico quando a cota travou),
recortados por algoritmo e medidos contra o guard de asset. Três itens do
`docs/BACKLOG-ARTE-GERAR.md` saíram: **A4** (nós da árvore de evolução, SVG →
PNG), **A2** (estados do botão — a quarentena de magenta ficou VAZIA pela
primeira vez) e a setinha de line-art da Activities, que era a última lucide
solta no meio dos sprites. Suíte 1143 → 1149. Detalhe de cada um nos ✅ do
backlog de arte; o kit completo (incl. o que ainda não foi ligado) está
indexado no fim de `src/utils/iconRegistry.ts`.

> ⚠️ Achado ao mesclar (18/08/2026): `GameStateContext.storage.test.tsx` falha
> nos 6 casos **em Node 25** e passa em Node anterior. Não é regressão de
> código e não afeta o navegador: o Node 25 traz `localStorage` NATIVO, então
> `globalThis.localStorage` deixa de ser o do jsdom e espiar
> `Storage.prototype` (que é o que o arquivo faz, e explica na nota do topo)
> não intercepta mais a escrita. É a mesma armadilha que a nota do teste já
> descreve, numa encarnação nova. Quem for consertar: ou espiar a instância em
> uso, ou fixar a versão do Node do projeto — decidir antes de mexer, porque
> mudar o alvo do spy foi justamente o que a nota diz que NÃO funciona no
> jsdom 29.

Antes disso: **oráculo dentro da UI + controles diretos desligados
(18/ago/2026)** — duas direções do dono. (1) A `OraclePage` (e o teste de
personalidade dentro dela) estava FORA da UI: card branco com botões cinza
dentro do app pixel escuro. Passou a usar as MESMAS classes do kit que o
onboarding já passava ao `SoulTestItem`/`CityPicker` (`sm-px-choice`,
`sm-px-field`) + tokens de tema no lugar de hex solto. (2)
`DIRECT_CONTROLS_ENABLED = false`: elemento favorito, bioma/reino e a
descrição livre de 50% saíram — a criatura vem da leitura. É flag, não
deleção (o dono pediu para reativar se usuários pedirem mais controle);
`alignment` não estava na lista e ficou. Achado ao implementar: o gate não
podia ficar só no JSX — os inicializadores chamam `generateOracle` com o
rascunho do localStorage direto, então um formulário salvo antes seguiria
influenciando a criatura de forma invisível; a poda ficou em
`loadSavedForm()`. Ver `docs/ORACULO.md` (rodada 12).

Antes disso: **fechamento do redesign noturno (18/ago/2026,
madrugada)** — sweep final de QA (Playwright, claro+escuro, todas as views
principais) achou e corrigiu 1 regressão da rodada 5: rótulos
Itens/Banho/Dormir invisíveis no tema claro (`--sm-px-ink` fixo sobre fundo
claro → `--sm-ink` do tema). Estado entregue da noite, tudo mergeado na
main: regra "ícone nunca dentro de box" aplicada (nav/ações/chat),
`.sm-pet-sticky` confirmado, moldura de canos (`PixelFrame`), splash
SOUL_LINK no index.html, trilha de evolução na Home (`EvoTrail`), clamp de
2 linhas no nome do ritual. O que NÃO foi feito e por quê: recorte de
assets das 4 imagens de referência (chegaram como imagem no chat, não como
arquivo — sem os bytes não há o que recortar) e geração de imagem nova
(chaves Higgsfield/Gemini são secrets do Cloudflare, ilegíveis do sandbox;
login de navegador é do dono). Se o dono commitar as imagens + a pasta
`icones` do desktop dele, dá pra substituir as aproximações CSS/SVG por
recortes reais.

Antes disso: **trilha de evolução na Home (18/ago/2026, madrugada)**
— terceiro item do redesign: o caminho de nós da referência agora mora na
Home, à esquerda do painel de rituais (`EvoTrail.tsx`). É RESUMO, não a
árvore: linha rookie→…→ultra do galho atual/previsto, nós `SoulNode`
reaproveitados (cristal verde = alcançado, pet pousado + anel = atual,
escuro = trancado), tocar abre a página de Evolução. Zero regra nova:
galho vem de `getStageBranch` ?? `resolveBranch` (o MESMO da página),
`ALIGN_TO_ATTR` mudou de cópia local do EvolutionPath para
`types/attributes.ts` (footgun 9). Nome de forma trancada NÃO aparece nem
em aria-label (spoiler guard preservado). Junto: `.sm-px-ritual-name`
virou clamp de 2 linhas (com o trilho ao lado, "Meditation" truncava em
"Medita…"; a referência quebra o nome em 2 linhas) — teste do RitualPanel
atualizado pro mecanismo novo, propósito mantido.

Antes disso: **moldura da tela + splash (18/ago/2026, madrugada)** —
os dois primeiros itens do redesign guiado pelas 4 imagens de referência que
o dono mandou (kit "SOUL MON"). (1) `PixelFrame.tsx`: moldura fixa nas
bordas — linhas de cobre via box-shadow inset + 4 cantos em PIXEL ART
programática (grid de chars → rects SVG, `crispEdges`): cano de cobre,
junta aparafusada, trepadeira e nó de cristal ciano. `pointer-events: none`
(nunca captura toque), z-index 80 (é o "bezel" do aparelho), zero PNG novo.
Montada no App e no onboarding. (2) Splash "SOUL_LINK ESTABLISHED" no
`index.html`: ESTÁTICA de propósito — aparece antes do bundle carregar
(loading de verdade, sem timer artificial), chama pixel + wordmark + barra
segmentada animada + selo + cristais, PT/EN por `navigator.language`. O
React a remove com fade no primeiro frame (main.tsx); o aviso de WebView
antigo também a remove (senão cobriria o próprio aviso). CSP: o script
inline novo e o do aviso (editado) entraram no `_headers` com hash
recalculado — o `csp.test.ts` pegou, como desenhado.

Antes disso: **regra "ícone nunca dentro de box" (18/ago/2026,
madrugada)** — direção do dono, vale no app INTEIRO (registrada no
CLAUDE.md): nada de moldura/placa/chanfro em volta de ícone; o ícone aparece
GRANDE e pelado. Aplicado em: nav inferior (26→36px, placa preenchida do
ativo virou SUBLINHADO ciano — barra não é caixa, e mantém uma pista de
seleção que não é só cor), fileira Itens/Banho/Dormir (moldura da actionbar
saiu, 30→42px), botões do chat (moldura saiu, 20→30px). A barra inferior
subiu 68→80px pra caber o ícone grande com rótulo (token
`--sm-bottomnav-h`, o dock do chat acompanha sozinho). Confirmado no mesmo
passe: `.sm-pet-sticky` (pet fixo, só a lista rola) segue funcionando — o
dono pediu de novo, mas já estava no ar; harness de screenshot novo em
`scratchpad/shot.mjs` mede o sticky em vez de confiar no olho.

Antes disso: **o gesto oculto virou o LOGO inteiro (18/ago/2026,
madrugada)** — o dono pediu ("mergeia esse toggle com o corvo no título"):
corvo + wordmark "SOULMON" agora são um wrapper único, e é ele o alvo do
long-press. Alvo maior acerta mais fácil no dedo. Como o alvo passou a
incluir texto, entrou `userSelect: none` + `WebkitTouchCallout: none` (segurar
texto no mobile abriria seleção/menu e comeria o gesto). Achado ao testar, e
anotado em `docs/ORACULO.md`: a intro tem animação de entrada e, antes de
assentar, o logo fica em OUTRA posição com `pointer-events: none` — medir
cedo faz o teste reprovar um gesto que funciona (`document.fonts.ready` não
basta; espere ~3s).

Antes disso: **atalho oculto pro modo debug (18/ago/2026, madrugada)**
— o dono perguntou onde ficava o checkbox de modo debug e, ao saber que
`OraclePage.tsx` não tem NENHUM ponto de entrada no app real, pediu um jeito
de chegar lá pela tela de intro que aparece na captura que ele mandou. Como
essa tela é a primeira coisa que todo jogador real vê, perguntei antes de
mexer: o dono confirmou que queria um atalho ESCONDIDO só pra ele, não um
controle visível pra qualquer um. Implementado como gesto: segurar o mascote
da intro por ~1.8s (`SoulmonOnboarding.tsx`) abre a `OraclePage` por cima,
já com o checkbox de modo debug pré-marcado (`initialDebugMode`, prop nova),
com um botão "Fechar" pra voltar. Toque curto (< 1.8s) não faz nada — testado
com Playwright (hold abre, toque curto não abre, Fechar volta pra intro).
Ver `docs/ORACULO.md` (rodada 11).

Antes disso: **modo debug na geração de imagem (17/ago/2026,
madrugada)** — pedido do dono: uma versão com "custo 0" que entrega o prompt
em vez de gerar sozinho no Higgsfield. `OraclePage.tsx` (ferramenta interna,
sem nav) já tinha um botão "Prompts" sem custo separado do "Gerar imagens"
(que chama a API paga); agora tem um checkbox "🐛 Modo debug" que faz o
PRÓPRIO botão de gerar nunca chamar a API quando ligado — zero chamada de
rede, não um limite que ainda bateria nela. Ver `docs/ORACULO.md`
(rodada 10).

Antes disso: **classe real no prompt de sprite (17/ago/2026, noite)**
— o dono achou um prompt de exemplo mais genérico que o anterior e pediu
mais detalhe: a classe (arquétipo do class-system), mas SÓ no prompt de
imagem, nunca em texto que o jogador vê. `pipeline.ts` virou `async` (só
ele — `generateOracle` continua síncrono) pra computar
`computeClassTitle(fichaByStage.ultra)` — constante nos 11 prompts, mesmo
tratamento que os outros traços de identidade — e passar o nome EN como um
4º traço do prompt (`OracleInput.promptClassFlavor`, novo campo, só o
pipeline preenche). Cogitado e descartado: sincronizar os arquétipos num
snapshot pra evitar o `async` — o casamento de condição real depende de
`niveisEfetivos` de elementos DERIVADOS, que só o motor real deriva certo;
reimplementar seria o footgun 9 que as outras integrações evitaram. Teste
novo confere as duas pontas: a palavra da classe aparece no `imagePrompt`
de toda forma, nunca em `description`/`bio`. Ver `docs/ORACULO.md`
(rodada 9).

Antes disso: **sufixo "-mon" removido dos nomes (17/ago/2026, noite)**
— o dono pediu um exemplo real de ponta a ponta e notou: toda criatura
terminava em "-mon" (`rookieName` etc. em `oracle.ts`). Achado ao investigar:
combinado com os prefixos de linha (War/Chaos/Zeed no Vírus, Omega no Mega
Vírus, Omni no Ultra), isso soletrava nomes REAIS de outra franquia —
WarGreymon, e o pior, Omegamon/Omnimon (a fusão dos 3 Megas, exatamente o
conceito do Ultra aqui). Mesmo tipo de risco que já tirou os 74 sprites da
Bandai do projeto, só que na camada de TEXTO. Corrigido: nenhum sufixo fixo
em nenhum estágio; `Omni` (Ultra) virou `Triune` ("três em um", mesmo
conceito, sem o nome emprestado). Teste que fixava o prefixo antigo
atualizado. Ver `docs/ORACULO.md` (rodada 8).

Antes disso: **classe da criatura (17/ago/2026, noite)** — pedido do
dono: "senti falta de ter também a classe da criatura, gerada a partir do que
ela faz, suas skills, talvez talentos e também de seus elementos". Achado:
o class-system já tem exatamente esse conceito — **arquétipos** (79 no
registro, `registry/arquetipos.ts`), identidades que EMERGEM de elemento +
escola + recurso, nunca escolhidas. `ficha/classTitle.ts` chama o motor real
(`calcularProgressao`, mesmo import dinâmico das skills) e escolhe o
arquétipo mais específico entre os que a ficha desbloqueou (pleno → diluído
"Aspirante a X" → fallback genérico pelo elemento dominante). Medido em 24
perfis: rookie nunca bate arquétipo pleno, mega e ultra batem em 100% —
mesma escada da cascata de pares. Nome PT vem AO VIVO do motor (zero cópia);
EN é tradução própria por id, com teste de paridade contra os 79 ids reais.
Extraído `ficha/realEngine.ts` (Personagem + progressão real), compartilhado
entre poder de skill e classe. Persistido no save (`soulmonClassTitles`).
**Decisão do dono no mesmo dia: não aparece pro jogador** — `PetPage.tsx`
computa e cacheia a classe, mas não renderiza o rótulo; infraestrutura fica
pronta pra um dia mostrar, sem custo de exibir nada agora. Ver
`docs/ORACULO.md` (rodada 7).

Antes disso: **contraste do tema escuro (17/ago/2026, noite)** —
feedback ao vivo do dono: "troca o nome pet por Soulmon e olha esse
contraste aí, em fundo escuro tem que ser texto branco". (1) A aba "Pet" virou
"Soulmon" (`App.tsx`). (2) O contraste era um bug REAL, não só percepção: o
scaffold shadcn importado do Figma define `body { color: var(--foreground) }`,
e `--foreground` só troca de valor sob a classe `.dark` — que este app NUNCA
aplica (o tema alterna via `[data-theme]` no `<html>`). Resultado: todo texto
sem `color` próprio herdava `--foreground` sempre no valor CLARO
(`oklch(.145 0 0)`, quase preto) mesmo com o tema escuro ativo. Pego por
amostragem de PIXEL na página do Pet (não só `getComputedStyle` — o preview
visual enganava, o cinza quase-preto sobre o verde bem escuro do card ainda
parecia "vagamente legível" no screenshot pequeno): nome da criatura, descrição
por forma e nome da skill renderizavam em `rgb(10,10,10)` sobre
`rgb(23,58,55)`. `body` agora usa os tokens de verdade (`--sm-bg`/`--sm-ink`),
que já respondem a `[data-theme="dark"]` — `--background`/`--foreground`
continuam intactos para quem os usa via `.bg-background`/`.text-foreground`
explícito (alguns modais em `components/ui/`). Ver footgun 10 em "Footguns".

Antes disso: **descrição por forma + poder real da skill (17/ago/2026,
noite)** — feedback ao vivo do dono testando o app: (1) a descrição por forma
só falava do FÍSICO, faltava o comportamento ("o que ele faz") — agora soma
uma frase real do papel+alinhamento dominante (`behaviorSentence`, extraída do
`personalitySummary` que já existia só na ferramenta interna); (2) o custo das
skills era um rótulo fixo por tipo — `ficha/realSkillPower.ts` chama o motor
DE VERDADE do class-system (`calcularSkill`, import dinâmico) e mostra um
`poder` real ao lado, verificado crescendo do rookie ao ultra e da básica pra
especial. Também no Class-System (PR #8 de lá): sinergia de alvo único
(fogo→vileza etc.) agora alimenta a cascata de destravamento — sinergia de
LEQUE (vida→5 primais) fica de fora de propósito, senão reabria o exploit que
a rodada 2 fechou — e a lista de investimento mostra os derivados "em
progresso" (passivos acumulando, ainda sem poder pontuar direto). Ver
`docs/ORACULO.md` (rodada 5).

Antes disso: **revisão profunda do oráculo (17/ago/2026, tarde)** — a
pedido do dono ("cada usuário com personagem único, interessante e fiel").
Medição com 200 perfis reais achou e as correções fecharam: (1) NOMES — a
colisão de baseName caiu de 20,5% para **1,5%** (mais bits da identidade,
RNG dedicado, bancos dobrados, 4 padrões de composição; estilo intocado);
(2) PAPÉIS no caminho só-6 — alcance caiu de 46% para 12–22% e suporte subiu
de 5% para 18–22% (recalibração validada em 3 seeds, direções de fidelidade
intactas); (3) IDENTIDADES FANTASMA — sombra/água/pântano/akasha/gelo agora
todos ≥3–4% (piso compensando o racha das perguntas de reino). Fidelidade
confirmada forte: respostas opostas mudam a identidade 10/10, todos os 6
traços movem eixos em direções coerentes; bestiário sem concentração
(top-10 = 10,5%). No Class-System, auditoria adversarial da cascata rendeu
9 achados corrigidos (PR #5 — medidor de orçamento cobrava pontos crus,
custo em paridade com os pais {1,2,3,4}, invariantes de aridade/pressa
refechados na curva inteira, taxonomy.json v2 como contrato de máquina). O
Besti-rio- ganhou superfície de máquina (PR #3 — export canônico com
procedência + AGENTS.md; uso principal = servir este pipeline). Custo do
par espelhado no Soulmon (CUSTO_PONTO_PAR 3→2) e snapshot re-sincronizado.

**QA rodada 2 (17/ago/2026)** — dois buracos medidos e fechados. (1)
**Paridade dos diais**: mutar `CUSTO_PONTO_PAR` de 2 para 3 não derrubava
NENHUM teste (1253/1253 verdes) — os fixtures da cascata medem comportamento
(passivos/destrave) e preço não entra em cascata nenhuma, então o dial podia
divergir do class-system em silêncio (footgun 9). O sync agora copia o bloco
`geracoes` do `taxonomy.json` v2 para o snapshot e `cascata.parity.test.ts`
afirma os QUATRO diais (divisor, limiar, custo base, custo do par) contra ele;
verificado por mutação: cada um dos 4 agora mata teste. (2) No Class-System,
**a armadilha de retrancar**: com a lava destravada, investir 1 ponto direto e
depois baixar um componente retrancava o par — o ponto continuava cobrando
orçamento e não sobrava nenhum `−` na tela (só "Resetar", que apaga a build).
Agora existe `desinvestirElemento` no motor e a tabela lista `alocaveis` ∪
{derivados com ponto direto}, os travados só com `−`.

Antes disso: **alocação geracional + página do Pet (17/ago/2026)** —
rodada 2 da fusão, a pedido do dono: (1) o class-system ganhou a CASCATA
geracional (PR HexerVoodoom/Class-System#5 — ponto direto só em base; 5+5→1
passivo no par; 10 passivos destravam alocação direta; peso de geração como
CUSTO {1,3,10,30}, não multiplicador); (2) a ficha do Soulmon distribui por
essa regra com orçamento próprio de elementos (30/60/120/300/500) e
especialização progressiva — medido: rookie–ultimate só bases, mega chega
"quase destravando", ultra compra o par em ~73% dos perfis (réplica gen-2 com
teste de PARIDADE contra fixtures do motor real, gerados no sync); (3) o
bestiário ganhou LINHAGEM com continuidade de espécie (uma inspiração por
estágio; 86,8% das transições preservam a família, travessia rara por
sobreposição); (4) cada estágio ganhou o par de skills básica/especial
derivado da ficha (a especial do ultra usa o PAR comprado — ex.: "Fúria de
Prisma"); (5) página nova do **Pet** (chip Evolução | Pet | Estatísticas):
formas já desbloqueadas (nunca futuras), a descrição por forma que existia no
save e nunca era renderizada, e as duas skills — verificada com Playwright em
PT e EN. Decisão de arquitetura confirmada pelo dono: dados por SNAPSHOT
embarcado (não API).

Antes disso: **fusão class-system + bestiário no oráculo (ago/2026)** —
o pipeline completo agora distribui os pontos do usuário na ficha do
class-system (constelação ancorando os 17 elementos, 65 talentos cientes de
pré-requisito, 11 profissões), captura o companheiro pela mecânica real e
busca a criatura-inspiração num pool de 2.000 do corpus canônico do
Besti-rio- — com cobertura TOTAL travada por simulação e o nome da inspiração
proibido em prompt por teste. Dados por snapshot com SHA
(`npm run sync:oracle-data`). Pendência do dono: mergear
`claude/canonical-classification` na main do Besti-rio- (o pool aponta para a
branch até lá). Ver `docs/ORACULO.md`.

Antes disso: **UI rodada 6 (15/ago/2026)** — cinco passadas de QA de
design sobre a rodada 5: guardrail de moeda restaurado em Estatísticas (Bits
sem ícone, fonte de calculadora), relatório diário/modais de tarefa/batalha da
Masmorra no kit, Dino sem vazio, barra do ritual segmentada, varredura do tema
claro e closeup das quinas. Relatório: `product/soulmon-01/ui/align-round6.md`;
prompts de arte ganharam A15–A16.

Antes disso: **UI rodada 5 (15/ago/2026)** — os primitivos legados
`.sm-btn`/`.sm-card` passaram a desenhar o kit pixel (chanfro + cobre + banda
de quina), o que converteu de uma vez onboarding, tutorial, modais, popover do
menu e o topo da Evolução; backdrops roxos viraram teal, os vazamentos de roxo
de Torneio/PPT/Masmorra saíram, e o fundo de circuito da Ref C entrou por CSS.
Relatório: `product/soulmon-01/ui/align-round5.md`. O que falta é ARTE —
prompts prontos em `docs/BACKLOG-ARTE-GERAR.md` (itens A9–A14 novos).
⚠️ Registro de ambiente: os 6 testes de `GameStateContext.storage.test.tsx`
falham em sandbox Linux (o mock de storage cheio não dispara quota no jsdom de
lá) — **pré-existente**, falha idêntica no commit base; nos ambientes das
rodadas anteriores passavam.

Antes disso: **novo motor do oráculo (ago/2026)** — o teste de
personalidade do repositório `teste-personalidade` virou a LEITURA do oráculo do
Soulmon (`src/utils/soulProfile/`), no lugar do signo por faixa de datas, do
ascendente chutado de 2 em 2 horas e das 6 perguntas do quiz antigo. A metade
criativa (`utils/oracle.ts`: arquétipo, famílias, as 11 formas, prompts de
sprite) não foi tocada, e o caminho legado segue inteiro para quem já tinha
perfil salvo. Detalhes e o porquê de cada decisão em `docs/ORACULO.md`.

Antes disso: **loop de QA multi-agente (ago/2026)** — 3 rodadas, suíte de
379 → 600 testes, mais uma frente de aplicação da UI pixel-art. Ver
`product/soulmon-01/` para os relatórios de cada rodada. O achado estrutural
está resumido na seção 5 abaixo e é o que vale ler primeiro.

Antes disso: auditoria de segurança multi-agente (3 agentes, escopo
dinheiro / auth+dados / IA+push+segredos).

---

## 🆕 Merges de 26/08/2026 — parte 3 (a virada da noite), `33fd94cc..e8aef62a`

**~20 merges.** A parte 2 dizia fechar "o dia inteiro" e não fechava. A natureza
do que entrou aqui é diferente das três passadas anteriores: a parte 1 e a 2
fecharam **dívida estrutural** e depois **bugs de comportamento**; esta fechou
**segurança e cadeia de suprimentos** — e ligou uma feature inteira que já
existia com outro nome.

### 🔐 Segurança — seis frentes, todas na seção 1

Detalhe achado a achado em **1.1** (N-3 a N-8) e **1.5**. Resumo:

| | O quê | Merge |
|---|---|---|
| ✅ | Oráculo e-mail→conta morto **na raiz** — o `pid` deixa de ser derivável | `d3094918` |
| ✅ | Diretório público respeita `pvpEnabled`; aba Amigos resolve por `pid` | `08b04038` |
| ✅ | Guarda de esquema na URL de sprite — dados **e** os dois componentes | `7f3f6193`, `8148f34f` |
| ✅ | Electron: `will-navigate`+`will-redirect` travados; IPC checa `senderFrame` | `16effec2` |
| ✅ | Service worker para de cachear resposta de outra origem | `3b45df1b` |
| ✅ | `customKeywords` delimitado no prompt; `temperature` `clamp`ada | `4997bccb` |
| ✅ | Keystores: são do **DigiApp**, e com Play App Signing a rotação é formulário | análise |
| 🔴 | SEC-3 (resgate atômico) e SEC-4 (`PLAY_REQUIRE_ACCOUNT_BINDING`) **seguem abertos** | — |

### 📦 Suprimentos — e o achado mais desconfortável do dia

`node_modules` **saiu do rastreamento** (19.035 arquivos), permissões declaradas,
actions presas por SHA, `npm ci` no desktop — e **o gate do CI estava morto**,
então `tsc` e `vitest` provavelmente não rodavam em push nenhum. Seção **1.5**.

### 🚦 Workflows — publicar vira ato deliberado

Build e release do desktop foram **separados em dois arquivos**: release só sai
de tag `v[0-9]+.[0-9]+.[0-9]+`. O motivo é medível — enquanto publicar disparava
em push de branch, um commit numa branch de rascunho virava **atualização
automática instalada na máquina do jogador**, sem assinatura Authenticode. Ver
`desktop/README.md` e a linha de Deploy do `CLAUDE.md`. O step do
`SIBLING_REPOS_TOKEN` foi **provado inútil** e saiu dos dois workflows de build.

### 🎮 Produto

| | O quê | Merge |
|---|---|---|
| 🏷️ | **Nick reenquadrado no onboarding** + batismo do Soulmon no cadastro. O apelido é **identidade pública**, e o texto anterior convidava a digitar o nome real — que é exatamente o dado que o diretório público expunha | `6054e747` |
| 🔓 | **O cap do demo consertado E afrouxado no MESMO release** — ver abaixo | `cc0ba3f2` |
| 🔗 | **Vínculo LIGADO** — ver abaixo | `e8aef62a` |

#### 🔓 O cap do demo: **a lição 7 sendo obedecida à risca**

A pendência **A** do dono era um bug que vazava **a favor** do jogador: o
`DEMO_ACTIVITY_DAILY_CAP` só era consultado dentro do `CreateModal`, e o botão
principal de criar da tela inicial abre o `EditModal`, que salvava sem checar
nada. Consertar sozinho seria um **APERTO**.

**Saiu conserto e afrouxamento no mesmo release, e a fronteira mudou de EIXO:**

- o teto deixa de ser **diário** e passa a ser **TOTAL**:
  `DEMO_ACTIVITY_TOTAL_CAP = FORM_REQUIREMENTS.rookie.cap` — **6 hábitos
  ativos**, derivado da constante e não um literal (confirmado no código);
- **tarefa avulsa fica livre**, sem limite nenhum;
- **todo caminho de criação passa pela mesma porta** — os dois modais e os dois
  vazamentos menores (`handleAICreateActivity`, `handleCompleteTutorial`);
- o `UnlockNudge` passou a aparecer também no `EditModal`, senão a recusa nova
  chegaria sem saída (por isso o `CLAUDE.md` dizia "dois lugares" e hoje são
  três).

> **O argumento de produto, e é o que justifica o eixo novo:** a paywall estava
> caindo sobre o **cuidado** — o grátis era impedido de registrar o que fez, que
> é justamente o que o produto diz existir para fazer. 6 hábitos ativos é a
> rotina inteira do Rookie. A fronteira passou a cair sobre **quantidade de
> rotina mantida**, não sobre **poder usar o app hoje**.

#### 🔗 Vínculo: o level de conta que **já existia com outro nome**

`0f38f303` / merge `e8aef62a`. A suspeita inicial era de que não existia nada —
e estava errada. O XP já era acumulado; faltava fiação, nome e consequência.

- **O nível NUNCA vai para o save**: é sempre `bondLevelFor(totalXP)`, derivado
  na leitura. Persistir `bondLevel` seria o footgun 9 na forma mais cara — duas
  fontes para o mesmo número, uma delas já gravada no aparelho de quem joga.
- **Gate de PvP no nível 5** (`BOND_PVP_MIN_LEVEL`), **nos dois lados**:
  cliente (`canPvp`) e servidor (ação `profile` em `community.js`). O servidor é
  quem decide, porque o cliente é editável.
- **O gate vale para LIGAR**, não para manter: quem já estava com
  `pvpEnabled: true` continua. Como `bondLevelFor` é monótona e `totalXP` só
  cresce, é um **limiar**, não uma manutenção — ninguém é rebaixado.
- Os eventos de XP são os de esforço que já existiam (check-in, conclusão, run
  de masmorra, partida), e passam pelo teto diário suave de `bond.ts`.

⚠️ **Nota de método, e é a terceira vez no dia:** *verificar antes de construir*.
Três vezes hoje a suspeita de "isso não existe" era falsa — o teste do D1, o
campo de nick, e o Vínculo inteiro. Lição **15** de `LICOES-DE-METODO.md`.

---

## Merges de 26/08/2026 — parte 2 (a tarde e a noite), `2be666d5..33fd94cc`

Verificado nesta árvore (`HEAD = 33fd94cc`), não lembrado. Gate:
`tsc` EXIT=0 · `vitest` **149 arquivos / 2631 passed / 2 skipped**.

### 💗 O coraçãozinho queimado — 150 Bits gastos para curar ZERO

**É o achado do dia, e é dinheiro do jogador.** A tarefa era estrutural (tirar
regra de dentro de três updaters inline do `handleFeed`); o que apareceu foi um
bug de moeda.

A recusa de "vida já cheia" só era lida do `gameState` **de fora** do updater;
dentro, o código se limitava a clampar a cura com `Math.min`. Dois toques no
mesmo lote do React leem o **mesmo** `gameState` — com 4/5 de vida, `4 < 5`
passa **as duas vezes** — e a segunda passada decrementava o inventário para
curar **zero**. Um Coraçãozinho custa **150 Bits** na loja, ou é drop de 5% na
masmorra. Sumia em silêncio, sem toast, sem log, sem nada.

**É a família do X-6 num lugar novo**, e a assinatura é idêntica: o defeito é a
**procedência do argumento**, não o tipo dele. Trocar `prev` por `gameState`
dentro de um updater compila; apagar a recusa de dentro dele também.

O conserto: `applySpecialItem` reconfere a recusa **sobre o `prev`**, como
`applyRub` e `applyFeed` já faziam. A regra foi para um arquivo **novo**,
`src/utils/specialItemUse.ts`, e a escolha está argumentada no cabeçalho dele —
não no `careUpdaters.ts`, que existe para guardar o **teto**, e item especial
não tem teto; não no `shop.ts`, que é **catálogo**. O arquivo novo **consome**
`CHIP_BOOST` e `HEART_HEAL` em vez de redeclarar, para os números seguirem com
um dono só. Nenhum número de progressão se mexeu.

`dcbeb42d` (merge `96a62b86`) · `specialItemUse.ts`, `specialItemUse.test.ts`

### Os outros quatro bugs reais

| O quê | Dano concreto | Commit |
|---|---|---|
| **O overlay rebaixava save legado a rookie — e devolvia o erro ao SAVE.** `cloudSync.ts` tinha `MAX_HP_BY_LEVEL`, `ENERGY_BY_LEVEL` e uma `stageLevel` própria que lia só o **prefixo** do id; a `getStageLevel` do app cai em `LEGACY_FORM_TIERS`, a compatibilidade que mantém um save antigo em `gaioumon` como **mega**. A justificativa escrita da cópia ("importar `types/progression` arrasta o roster legado da masmorra") era **falsa** — aquele arquivo não importa nada. | O jogador via **3 corações em vez de 4**, e o `maxHealthPoints` errado **voltava para o save** em `normalizeForRules`, fazendo `applyRub` cortar a cura do mega no teto de um rookie. | `2bc9af3a` (merge `d56bba7a`) |
| **Banho e dormir do overlay não escreviam NADA.** `doShower` eram três linhas — frase, efeito, render — e zero escrita. `doSleepToggle` virava um booleano no `localStorage` do overlay. | Medível em corações: `applyPoopDrain` tira **1 coração a cada 6h** de cocô não limpo, e o banho é o **único** jeito de parar esse relógio — o jogador via o pet perder coração apertando exatamente o botão que existe para impedir isso. E pelo overlay `rest.nights` nunca recebia nada: sem constância, sem raridade de sonho, sem pesadelo. | `3e1e92d5` (merge `86341fcb`) |
| **O teto de carinho do overlay era por APARELHO** (`{ healed: 0 }` fixo). | Quem tinha o overlay aberto curava 1 coração no celular **E** mais 1 no desktop, todo dia. O teto de 1/dia do produto não existia para essa pessoa. | `f6fb5f30` (merge `69f7f157`) |
| **O botão "Tentar de novo" do sprite existia, era testado, e NÃO EXISTIA NA TELA.** A prop `onRetrySprite` é opcional, o `App` não a passava, e **nada acusava** — nem o `tsc` nem a suíte. | O jogador com falha de credencial via um card sem saída. `canManualRetry` já sabia tudo (teto manual de 3, cooldown de 60 s); faltava um chamador. A execução do lote virou `executarLote()`, usada pelo lote automático **e** pelo retry — mesma trava serial, mesmo `runSpriteBatch`, sem segundo caminho de geração. | `46a6e542` (merge `9ebd35f4`) |

### 📦 Steam: o empacotamento foi EXECUTADO pela primeira vez — e rodar provou algo

`npm run dist:steam` **nunca tinha sido rodado por ninguém**. Rodou:
**EXIT=0**, `release/win-unpacked` com **274 MB**, `Soulmon.exe` de **188 MB**,
`app.asar` de 5,1 MB.

**O achado que só aparece rodando:** lendo de dentro do asar,
`-c.extraMetadata.steamBuild=true` vira **BOOLEANO**. A comparação estrita de
`main.js` (`steamBuild === true`) portanto acerta, e o auto-update fica
desligado no build de Steam. **Se tivesse virado a string `"true"`**, o build da
Steam se auto-atualizaria pelo GitHub por cima do que o SteamPipe instalou —
exatamente o conflito que essa variante existe para evitar, e **ninguém sabia de
que lado estava**. Saída real e o tropeço do caminho em `desktop/STEAM.md`.

`2f3cd4f6` (merge `33fd94cc`)

### 🔐 Login do desktop: **guarda deliberada**, não bug

Veredito, para ninguém "consertar" o que não está quebrado:
`startDesktopAuthBridge` (`src/utils/auth.ts`) sai na primeira linha porque
⚠️ **Desatualizado desde 07/09/2026** — as `VITE_FIREBASE_*` agora existem
(projeto `soulmon-app`, no `.env` local) e o login está configurado. O texto
abaixo descreve o estado ANTERIOR.

`isAuthConfigured()` exige três `VITE_FIREBASE_*` que **não existem em lugar
nenhum desta árvore** (nem `.env`, nem CI, nem vite config) — e o próprio
arquivo documenta que isso é proposital. O chamador existe e roda (`App.tsx`).
**Depende da fatia 1 do dono**, não de código. Não foi forçado nem mockado.

O que dava para exercitar foi exercitado: `desktop/electron/auth-preload.js`,
código nosso, síncrono, sem rede, que **nunca tinha rodado uma vez** — sete
casos carregando o arquivo de PRODUÇÃO com um `electron` falso só no lugar do
host, provados vermelhos mutando o preload (`authBridge.test.ts`).

### Infra e medição que entraram junto

| O quê | Commit |
|---|---|
| **CI passou a rodar `tsc -p desktop/tsconfig.json` em PR.** O buraco era menor do que "não existe CI do desktop" — os testes do desktop já rodavam em PR (`vitest.config.ts` inclui `desktop/renderer`). Faltava exatamente UM comando, que só existia no `desktop-build.yml` (não roda em PR, e com filtro de `paths` que **não inclui** `src/utils/careRules.ts` nem a família de cuidado). Custo medido: **2,4 s**, sem `npm install` dentro de `desktop/`, sem segredo nenhum — roda em fork. O caminho de FALHA foi exercitado, não suposto. | `3795020b` (merge `a3c581d5`) |
| **Métrica-norte instrumentada e legível.** Não havia evento que permitisse calcular NEM "ativo na semana" NEM "≥4 de 7" — `day_active` é diário e anônimo, e `count(day_active)` não distingue 1 pessoa em 5 dias de 5 pessoas em 1 dia. Agora a conta fecha **no aparelho** e sai agregada: ledger local acumula dias ativos e dias no objetivo, e na virada da semana ISO despacha **dois inteiros de 0 a 7**. O servidor guarda o **histograma**, então mudar o alvo depois não exige reinstrumentar nem perde histórico. | `fae95fc5` (merge `149ea0e4`) |
| **Rota de leitura de `m:*` criada, fail-closed.** Havia dado gravado com TTL de 730 dias que **ninguém conseguia abrir** — nenhuma rota, nenhum painel, nenhum script. Agora há leitor, fechado por segredo: **sem `METRICS_ADMIN_KEY` a rota responde 404, não 401** (401 confirmaria o endpoint). Precisa do secret configurado para existir. | idem · `functions/api/metrics.js` |
| **O vazamento do cap do demo foi INSTRUMENTADO, nunca corrigido.** `activity_create` distingue o caminho que consulta o teto do que o contorna, então dá para **medir** quanto do teto é furado. Nenhuma linha do comportamento mudou — o conserto isolado seria um **aperto**, e espera decisão do dono. | idem |
| **Falha de credencial ganhou voz.** Com 401/403 no acervo, o card mostrava arte de reserva e **silêncio total**. Agora 401 pede entrar de novo e 403 pede **sincronizar o progresso** — e há teste que falha se as duas saídas forem iguais, porque são conserto de coisas diferentes (403 é `SAVE_ID` errado; re-login não conserta). A copy provisória virou copy de verdade em `e1da4e2f`. | `60b0c89b` (merge `8296d66e`) + `e1da4e2f` (merge `fd4562ee`) |
| **Retentar virou orçamento POR MOTIVO, não booleano.** `auth` (401) ganha **uma** retentativa — o SDK do Firebase renova o token de hora em hora, então uma pega a renovação e a segunda é bateria gasta; `identity` (403) já não retentava. O que estava quebrado no 403 era só a **classificação** (gravava kind `error` no acervo). | `84209ded` (merge `689e2dcc`) |
| **A cópia da energia da comida saiu do overlay — e escondia um cast mentiroso.** `menu.ts` recalculava `Math.min(maxEnergy, energy+1)` depois de `feedFood` já ter aplicado o teto. Por baixo havia um `as unknown as` rodando sobre `undefined` (`DesktopState` não tem `evolutionStage`, `energyPoints`, `virusPoints` nem `totalXP`): a regra devolvia energia errada e atributos `NaN`, e **só não aparecia porque o `menu.ts` jogava tudo fora e recalculava à mão**. A cópia era o curativo que mantinha o cast quebrado invisível. | `d9765d09` (merge `f6716ec5`) |

---

## Merges da tarde de 26/08/2026 — parte 1

Verificado à época contra `HEAD = 2be666d5`.

| O quê | Commit | Onde |
|---|---|---|
| **Retenção de `ent:` e `ord:`: 5 anos, RENOVADOS a cada escrita.** Até aqui os dois eram gravados **sem TTL nenhum**. A renovação não é detalhe: com prazo contado do nascimento, o `ent:` expiraria e levaria junto o `tier: 'paid'` de quem comprou e continua jogando, e o teto VITALÍCIO de IA (26 gerações) resetaria. O registro só morre após 5 anos de silêncio absoluto. | `b2a35465` (merge `b3cdfabc`) | `_entitlements.js:20-65`, escrita em `:164-170` e `:271`; testes em `_entitlements.ttl.test.js` |
| ⚠️ **O caminho D1 (`order_claims`) NÃO expira** — banco não apaga linha sozinho. Com D1 ligado, a decisão de 5 anos **não se aplica ao recibo**. Falta uma limpeza que não existe. | idem | `_entitlements.js:61-63` (aviso já está no código) · decisão do dono pendente |
| **`saveId` reconciliado no login (B-R1)** — quem nunca logou tinha `saveId` = UUID aleatório e, no corte para `enforced:true`, tomaria **403 permanente** que re-login não conserta. `reconcileSaveId` reusa o `emailToSaveId` existente (nada de quarta cópia). Conflito de dado resolvido por **assimetria de reversão**: chave derivada vazia → migra; ocupada → a **nuvem** ganha e o local vai para backup byte a byte; a chave antiga **nunca** é apagada; nuvem indeterminada (5xx/offline) **não** migra. | `d07bb287` (merge `f56e7075`) | `cloudSave.ts` (`reconcileSaveId`), chamado em `App.tsx:811-814`; `cloudSave.reconcile.test.ts` |
| **Cloud save devolve erro TIPADO (R-3)** — antes 401/403/409/412/413/5xx colapsavam num `boolean` que o chamador nem lia. O risco nunca foi conflito: era **save perdido sem ninguém ver**. Agora há política POR CÓDIGO de `retentável` e `avisaJogador`. | idem | `cloudSave.ts` (`classifyCloudSaveStatus`, `CLOUD_SAVE_POLICY`); `cloudSave.errors.test.ts`, `GameStateContext.cloudErrors.test.tsx` |
| **`spriteGen.ts` deixa de colapsar 401 e 403.** Não era "esquecimento": ele os unia de propósito num `auth` só. 403 é `SAVE_ID` errado e **re-login NÃO conserta** — quem conserta é `reconcileSaveId`. Agora reusa o classificador do save em vez de um segundo vocabulário de erro. | `d1bbf0ff` (merge `2be666d5`) | `spriteGen.ts:30-42`, `:108-112` |
| **`RECONCILE_KEYS` saiu de `cloudSave.ts` para `storageKeys.ts`**, como tabela própria e **não** dentro de `STORAGE_KEYS`: é rastro forense de migração, não preferência. O valor das strings está travado por teste — mover a constante de arquivo não pode mudar o que já está gravado no aparelho de ninguém. | idem | `storageKeys.ts`, `storageKeys.reconcile.test.ts` |
| **Teto de cuidado do desktop virou o teto do SAVE.** Ver `docs/PLANO-DESKTOP-STEAM.md` §3c-bis. | `f6fb5f30` (merge `69f7f157`) | `desktop/renderer/src/care.ts` |

**Efeito sobre a fatia 1:** os dois itens que a `squad-alpha-runs/ROADMAP.md`
classificava como bloqueantes do corte (**B-R1** e **R-3**) estão **feitos**. O
que ainda bloqueia é só o que depende do dono (§3).

---

## 1. Segurança — auditoria de 2026-08

Rodada com o motor do `/security-review` da Anthropic, dividida em três frentes
paralelas. Cada achado abaixo foi **verificado à mão no código** antes de
entrar aqui. Filtro aplicado: só confiança ≥ 8, sem DoS, sem rate limit, sem
"falta de hardening" e sem race teórica.

### 1.1 Explorável AGORA, em produção

**Reconferido contra `e8aef62a` na consolidação de 26/08.** Referências em
**SÍMBOLO**, pela decisão de formato do topo desta página.

| # | Onde (símbolo) | O quê | Status em `e8aef62a` |
|---|---|---|---|
| SEC-1 | `denyUnlessOwner` em `functions/api/community.js` | 5 de 11 ações sem autorização nenhuma | ✅ **FECHADO EM PRODUÇÃO em 07/09/2026** — `FIREBASE_PROJECT_ID=soulmon-app` ligado no `wrangler.jsonc`. Verificado na borda: `/api/save` sem token devolve 401 `unauthenticated` |
| SEC-2 | `pidFor` / `PID_PREFIX` / `putProfile` em `functions/api/community.js` | o `saveId` era publicado como identidade social | ✅ **corrigido, e a correção MUDOU de natureza hoje** — ver N-3 abaixo |
| SEC-5 | `isAllowedPushEndpoint` em `functions/api/subscribe.js` (a trava); `costGate` na entrada | SSRF: qualquer `endpoint` aceito, worker faz `fetch` nele 4×/dia | ✅ corrigido (⚠️ o worker é deploy MANUAL — a versão rodando hoje **não é verificável por leitura**; inalterado hoje) |

#### 🆕 N-3 — o oráculo e-mail→conta morreu, e a recomendação da auditoria não teria fechado nada

**Fechado em `8ff7f7ab` / merge `d3094918`. Confirmado no código.**

O SEC-2 tinha sido corrigido publicando um `pid` **derivado** —
`SHA-256("soulmon-pub:" + saveId)`, 24 hex, "caminho só de ida". A auditoria
recomendou remover um fallback. **O agente verificou e a recomendação não
fechava o buraco**, por duas razões que só aparecem lendo:

1. O `saveId` já é `SHA-256("soulmon:" + e-mail)`, e o `pid` era hash **sem
   segredo** do `saveId`. Logo `e-mail → saveId → pid` era uma cadeia
   inteiramente derivável **offline, por qualquer um**. Tirar o fallback só
   trocaria o parâmetro que o atacante usa.
2. Pior, **o próprio diretório público JÁ era o oráculo**: bastava derivar o
   `pid` do e-mail e procurá-lo na listagem — sem nem chamar a rota que a
   recomendação mandava fechar.

**A derivação morreu.** O `pid` hoje é **aleatório**
(`crypto.getRandomValues`, 12 bytes) e o vínculo vive num índice reverso no
servidor (`pid:<pid>` → saveId, com `expirationTtl`). Os índices antigos são
aposentados sozinhos no próximo save de cada conta — não houve migração.

> **A lição, e ela é de método, não de código:** *a recomendação de uma auditoria
> pode não fechar nada*. Está registrada como lição **13** em
> `squad-alpha-runs/soulmon-02/LICOES-DE-METODO.md`.

#### 🆕 N-4 — o diretório público passa a respeitar o consentimento que já existia

**Fechado em `f1ce3848`; a aba Amigos deixou de depender dele em `9989a0c1` /
merge `08b04038`. Confirmado no código.**

Era o **B5** do `GUIA-DO-DONO.md`, listado como "decisão do dono". A
inconsistência que decidia a pergunta: a rota de **oponentes** filtrava por
`pvpEnabled` e a de **jogadores** não filtrava por nada — e o perfil é gravado
junto do cloud save, então **o jogador entrava no diretório por consequência de
salvar, não por escolha**. O produto já tinha o gate de consentimento; uma das
duas rotas o ignorava.

Hoje a ação `players` também aplica `if (!p.pvpEnabled) continue`. O que estava
exposto sem token e para qualquer origem — `name` (texto livre de 24 caracteres,
**e tem gente que digita o nome real**), nome do pet, estágio, dias jogando,
tarefas feitas e pontos, até 50 perfis por chamada com busca por parte do nome —
passa a sair só de quem ligou PvP.

⚠️ **Consequência querida e que precisa estar escrita:** a aba **Amigos** lia do
diretório público. Se ela continuasse lendo, amigo com PvP desligado sumiria da
lista do próprio amigo. Ela passou a resolver **por `pid`**, que é o
identificador que a amizade já guardava — a lista de amigos não é o diretório, e
agora as duas coisas não compartilham fonte.

#### 🆕 N-5 — a URL de sprite ganha guarda de esquema (dados **e** componentes)

**`6dde6750` / merge `7f3f6193`, estendido a dois componentes em `94d45e62` /
merge `8148f34f`. Confirmado no código e em teste.**

A URL do sprite vinha do diretório público e ia direto para `<img src>`.
`isSafeSpriteUrl` (em `src/utils/spriteLibrary.ts`) é a **função única**,
importada também por `pixelizeDataUrl` (`src/utils/spriteGen.ts`) e pelos dois
componentes. Fecha `javascript:` (inclusive `JaVaScRiPt:` e com TAB/LF no meio
do esquema), `data:` não-imagem, `http:`, `file:`, `blob:` e `//host`.

🔴 **NÃO fecha o beacon** `https://atacante.example/x.png`. Fechá-lo exige
allowlist de **HOST**, e o host do CDN do Higgsfield **não está confirmado** —
`platform.higgsfield.ai` é o host da API. **Pendência do dono** (ver
`GUIA-DO-DONO.md`): um exemplo real de URL devolvida pelo provedor fecha isto
**e** aperta a CSP de `img-src … https:` para `img-src 'self' data: <host>`.
Chutar o host **desliga a arte própria de todo mundo em silêncio** — o visor não
tem estado de erro, por decisão de spec.

#### 🆕 N-6 — Electron: trava de navegação da janela e origem no IPC

**`1ce7014c` / merge `16effec2`. Confirmado no código.**

`desktop/electron/main.js` passou a interceptar **`will-navigate` E
`will-redirect`** — os dois, porque redirecionamento de servidor (302 para outra
origem) **não passa** por `will-navigate` —, e `setWindowOpenHandler` manda link
externo para o navegador padrão. No IPC do token, a checagem é sobre
**`event.senderFrame`** e não `event.sender`: um `<iframe>` de terceiro
compartilha o `sender` com a página que o hospeda, então checar `sender` deixaria
um frame de outra origem pedir o token.

🙋 **Falta o olho humano, e é 1 minuto** — o agente não executou o Electron. Está
no `GUIA-DO-DONO.md`.

#### 🆕 N-7 — o service worker parava na requisição e não olhava a resposta

**`2299bc53` / merge `3b45df1b`. Confirmado em `public/sw.js` (`CACHE_VERSION`
= `v93`).**

O `fetch` handler saía cedo em requisição de outra origem, mas **guardava a
resposta** de caminhos que podiam ser redirecionados para fora. Hoje a checagem
é `url.origin !== self.location.origin` no ponto de entrada **e** a resposta é
inspecionada antes de entrar no cache. No mesmo merge, o updater do desktop
passou a decidir **fail-safe**.

#### 🆕 N-8 — prompt injection: o texto do jogador sai da lista de regras e vira dado delimitado

**`a9343068` / merge `4997bccb`. Confirmado em `functions/api/chat.js`.**

`customKeywords` é texto livre do usuário e entrava **no prompt de sistema**,
como se fosse regra. Hoje entra dentro de uma caixa rotulada e delimitada
(`<<<USER_STYLE>>>` … `<<<END_USER_STYLE>>>`), com `sanitizeCustomKeywords`
removendo os próprios delimitadores e qualquer coisa parecida com eles — **ele
não consegue fechar a própria caixa**. A trava de cuidado (o que a persona pode
dizer num dia ruim) vem **depois** do bloco, de propósito.

Junto: `temperature` vinha **crua do corpo** para o Groq e passou por
`clampTemperature`. Não é injeção de texto — é parâmetro de inferência sob
controle do cliente, que é a mesma família de dano.

> ⚠️ Isto **rebaixa mas não apaga** o item "Prompt injection sem consequência
> privilegiada" da seção 1.3. O argumento de lá (*nada do que o modelo responde
> vira escrita no servidor ou chamada de ferramenta*) continua de pé e continua
> sendo a razão pela qual isto nunca foi crítico. O que mudou é que o texto do
> jogador deixou de ter **status de regra**.

> **Reverificação de 2026-08-25** (`squad-alpha-runs/soulmon-01/discovery/security-escopo-e-reverificacao.md`):
> os selos ✅ desta seção mediam o CÓDIGO, não o que está em pé em produção.
> `denyUnlessOwner` delega a `authorizeSaveAccess`, que é *fail-open*
> (**`authorizeSaveAccess` em `functions/api/_auth.js`** — o endereço deste
> achado já escorregou de `:112-113` para `:116`, que é por que hoje ele é
> símbolo; **reconferido em `e8aef62a`, a linha não escorregou de novo e o
> comportamento não mudou**: sem `FIREBASE_PROJECT_ID`, devolve
> `{ ok: true, enforced: false }` sem verificar nada) — e a sonda
> `GET /api/save?id=…` sem `Authorization` devolveu
> **200** em produção. Ou seja: **a correção do SEC-1 só passa a existir quando o
> Firebase for ligado**. Doc que diz ✅ sobre segurança aberta é pior que doc
> ausente: a próxima sessão acredita nele.

**SEC-1 — o buraco central.** Só `action=profile` chama `authorizeSaveAccess`.
`friends`, `gift`, `match`, `trophies?claim=1` e `gifts?claim=1` pegam o ator do
`body.id`/`?id=` e escrevem no registro daquela conta sem prova de posse.
~~Agravante: **isso não fecha quando o `FIREBASE_PROJECT_ID` for ligado** — ao
contrário do `save.js`/`billing.js`, essas ações não consultam autenticação em
ponto nenhum.~~ **Desatualizado ao contrário** (reverificação de 2026-08-25):
hoje as seis ações passam por **`denyUnlessOwner`** em `functions/api/community.js`
(as seis chamadas — `grep -n denyUnlessOwner functions/api/community.js` acha a
família inteira; as linhas foram deixadas de fora de propósito, pela decisão de
formato do topo), então é exatamente o oposto — **só fecha quando ligar**.

Impacto concreto: roubar 20 Bits/vítima/dia emitindo presente em nome dela;
reescrever a lista de amigos de qualquer um; forjar o campeonato inteiro
(+10 pontos e +1 vitória por chamada, queimando a partida diária da vítima →
1º lugar e troféu 🥇 sem jogar); e **apagar permanentemente** troféus de season
e presentes alheios, sem caminho de reemissão.

**SEC-2 — por que o SEC-1 vira catástrofe.** `action=players` devolve `p.id`, que
**é a chave do cloud save**. Sem conta e sem autenticação dá para listar a chave
de até 300 jogadores e então `GET /api/save?id=…` (lê o save inteiro) ou
`POST` (sobrescreve). Com `Access-Control-Allow-Origin: *` isso funciona de
qualquer página aberta no navegador da vítima.

> Isso muda a natureza do risco que estava documentado como aceito. O texto
> antigo dizia "quem souber seu e-mail pode ler seu save". Na prática **ninguém
> precisa saber e-mail nenhum** — é leitura e destruição em massa.

**Correção aplicada — e ela foi REFEITA no fim do dia.**

⚠️ **Este parágrafo dizia: *"A identidade social passou a ser um `pid` derivado
(`SHA-256("soulmon-pub:" + saveId)`, 24 hex) — caminho só de ida. […] Como o pid
é derivado, não houve migração de dados."* Ficou FALSO em `d3094918`, no mesmo
dia — e a parte falsa era justamente o que dava o selo ✅.**

"Caminho só de ida" descrevia a função errada. `saveId` é
`SHA-256("soulmon:" + e-mail)` e o `pid` era hash **sem segredo** dele: a cadeia
`e-mail → saveId → pid` era derivável offline por qualquer pessoa, então o
diretório público **era** o oráculo e-mail→conta. Irreversível ≠ imprevisível.

**Hoje o `pid` é ALEATÓRIO** (`crypto.getRandomValues`, 12 bytes), e é o índice
reverso `pid:<pid>` → saveId, no servidor, que passou a ser a **única** ligação
entre os dois — não mais uma função que qualquer um recalcula. Alvos
(`friendId`, `opponentId`, `player?id=`) chegam como pid; a lista de amigos
guarda saveId internamente e sai como pid. Nada mudou no cliente: ele já tratava
o id alheio como token opaco. Os índices derivados antigos são **aposentados
sozinhos** no próximo save de cada conta (o `pid` anterior é apagado quando o
novo é gravado), então também aqui não houve migração — mas por outro motivo.

### 1.2 Latente — arma no dia em que o billing for configurado

| # | Onde (símbolo) | O quê | Status em `e8aef62a` |
|---|---|---|---|
| SEC-3 | `claimOrder` / `claimOrderAtomic` em `functions/api/_entitlements.js` | `claimOrder` não é atômico → 1 recibo vira N contas pagas | 🔴 **NÃO RESOLVIDO** — inalterado hoje. O que entrou foi **preparação**, não conserto (ver abaixo) |
| SEC-4 | `verifySteamPurchase` / `isPlayPurchaseBoundTo` em `functions/api/_billing.js` | microtransação Steam sem vínculo com o dono | ⚠️ parcial — **`PLAY_REQUIRE_ACCOUNT_BINDING` continua não ligada**; reconferido: o código lê `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`, e sem a variável a compra sem vínculo é **aceita** |

> **SEC-3, reverificado em `e8aef62a`.** O caminho atômico continua condicionado
> a `env.DB` (`claimOrder` desvia para `claimOrderAtomic`) e — **conferido nesta
> árvore, e é a prova dura** — **não existe binding `d1_databases` em
> `wrangler.jsonc`**. O arquivo declara `kv_namespaces` (`DIGIAPP_SAVES`,
> `PUSH_SUBSCRIPTIONS`) e mais nada. Em produção roda **sempre** o ramo do KV
> (*read-then-write* sem CAS, sobre armazenamento eventualmente consistente). O
> teste que dava o ✅ usa um `Map` em memória, fortemente consistente: a corrida
> é estruturalmente irreproduzível ali. O selo media o código, não a semântica do
> armazenamento.
> Fonte: `squad-alpha-runs/soulmon-01/discovery/security-escopo-e-reverificacao.md`.

> #### 🆕 O que entrou hoje no D1, e por que NÃO fecha o SEC-3
>
> `ff55215e` / merge `2ef54721` deu **prazo em coluna** ao recibo no D1
> (`migrations/0002_order_claims_expires_at.sql`, limpo na leitura), e
> `45b8c4cf` tirou o schema de dentro do `docs/BILLING-SETUP.md` para apontar
> para `migrations/`. Isso responde a **pendência C do dono** — *"banco não apaga
> linha sozinho, então com D1 ligado a decisão de 5 anos não se aplica ao
> recibo"*.
>
> **Mas é preparação de um caminho que nunca dispara.** Enquanto não houver
> binding de D1 no `wrangler.jsonc`, `env.DB` é `undefined`, `claimOrderAtomic`
> não roda, e a tabela `order_claims` não existe em produção. **Ligar o D1
> continua sendo o conserto do SEC-3** — e agora ele chega com a retenção já
> resolvida, em vez de abrir uma ponta nova no dia em que for ligado.
>
> ⚠️ Não confunda as duas coisas: *a migração existir* e *o caminho atômico
> rodar* são afirmações diferentes, e só a primeira é verdade hoje. Este é
> exatamente o tipo de selo que já enganou esta página antes.

**SEC-3.** O comentário no código dizia que a corrida "exige tempo de propagação
na casa dos milissegundos". **Está errado, e a estimativa era minha.** O Workers
KV é eventualmente consistente com janela de até ~60s, e o `get()` mantém cache
de borda por 60s **inclusive para chave inexistente**. Não é preciso
simultaneidade: basta as requisições caírem em colos que ainda não viram a
escrita. Um recibo de R$ 29,90 vira N contas `paid` com um `for` em `curl` por N
proxies regionais. Não é consertado ligando o Firebase — cada conta clonada
autentica legitimamente, e o `purchaseToken` nunca é vinculado a uma identidade.

O teste também dava falsa segurança: usava um `Map` em memória, que é fortemente
consistente e nunca reproduz a leitura obsoleta.

> ⚠️ **ISSO CONTINUA VALENDO — o ✅ acima é otimista** (rodada 9 de QA,
> ago/2026). O `Map` em memória segue sendo o dublê do KV, **inclusive nos
> testes escritos depois**. Ou seja: **o SEC-3 está marcado como corrigido com
> base num teste que não consegue reproduzir o ataque.** A atomicidade real
> depende do D1 `order_claims`, que **não existe** (ver
> `docs/DEPENDE-DE-VOCE.md` §3).
>
> E nenhum mutante encontra isto: mutação mede o código, não a semântica do
> armazenamento. O instrumento certo é um **KV falso com janela de consistência
> eventual configurável**. É o maior risco de dinheiro que sobrou.

**SEC-4.** `verifySteamPurchase` credita com base num `orderId` decimal vindo do
cliente, sem ticket e sem comparar o `steamid` que a própria Valve devolve. A
função irmã `verifySteamOwnership` exige ticket assinado *exatamente porque* o
SteamID é público — a assimetria é o indício. Como o `orderid` é gerado pelo
parceiro (contador/timestamp) e as respostas distinguem `not-purchased` de
`order-in-use`, o endpoint vira oráculo de enumeração: dá para varrer ids
vizinhos e resgatar a compra de outro jogador antes dele — ele paga a Valve e
não recebe nada.

### 1.3 Auditado e considerado SEGURO

Vale registrar para não reauditar à toa:

- **`_auth.js` — verificação de token Firebase está correta.** `alg` fixado em
  RS256, `aud` e `iss` ambos checados, `exp` e `iat` com tolerância limitada,
  JWKS por `kid` com TTL do `Cache-Control`, falha fechado em rotação,
  `email_verified === true` exigido. Era o achado mais temido e não existe.
- **Chave da Groq não vaza.** Host e modelo são fixos; corpo de erro upstream
  nunca volta ao cliente. Sem SSRF (nem host nem protocolo são controláveis).
- **Prompt injection sem consequência privilegiada** — nada do que o modelo
  responde vira escrita no servidor ou chamada de ferramenta. ⚠️ **Este item
  continua certo pelo motivo dele, mas era otimista sobre a ENTRADA**: até
  `4997bccb` o `customKeywords` do jogador entrava no prompt de SISTEMA com
  status de regra, e a `temperature` vinha crua do corpo. Hoje o texto vai
  delimitado e saneado, e a temperatura é `clamp`ada. Ver N-8 na seção 1.1.
- **PII do oráculo fica no cliente.** Nome completo, data, hora e local de
  nascimento vivem só no `localStorage` (`SOULMON_PROFILE`) e são consumidos
  por `generateOracle`. **Não** entram no `GameState`, não vão para `/api/save`
  nem para o perfil público. **Manter assim.**
- **`save.js`** remove `accountTier`/`credits` do POST do cliente e os reserve do
  registro `ent:` do servidor.
- **`spendCredits`** valida `Number.isInteger(amount) && amount > 0` — não dá
  para cunhar crédito com valor negativo.
- **`grantAdReward`** fica atrás de `ADMOB_SSV_ENABLED !== 'true'` → 501.
- **`closeSeason`** falha fechado sem `SEASON_ADMIN_KEY`.
- **Steam Family Sharing** já é recusado (`steamId !== ownerSteamId`).
- **Sem segredos na árvore de trabalho.** A chave anon do Supabase em
  `src/utils/supabase/` é pública por desenho (RLS) e o app não passa mais por
  lá. Todo `VITE_*` em uso é config web do Firebase, pública por desenho.

### 1.4 Segredos no histórico do git ⚠️

O commit `c47776e5` removeu `bubblewrap_build/`, que continha:

```
bubblewrap_build/android.keystore
bubblewrap_build/signing.keystore
bubblewrap_build/app-release-signed.apk
bubblewrap_build/app-release-aligned.apk
```

Remover do HEAD **não tira do histórico** — quem clonar ainda recupera.

#### ✅ Analisado em 26/08/2026 — rebaixado de "projeto" para "formulário"

`squad-alpha-runs/soulmon-02/security/keystores-vazados.md`. O que a análise
mudou, e é bastante:

- **Os keystores são do DigiApp** (`com.digipartner.digiapp`), **não do
  Soulmon**. O Soulmon builda outro package via Capacitor e o CI dele só faz
  `assembleDebug`, sem keystore de release. **Não há nada a rotacionar do lado
  do Soulmon.**
- **O DigiApp usa Play App Signing** (confirmado pelo dono). Logo a chave vazada
  é a de **upload**; a que assina o app para os usuários é da Google e **nunca
  esteve no repo**. A rotação é Play Console → Assinatura do app → *Solicitar
  troca da chave de upload*: **um formulário de ~5 min**, e os usuários não
  percebem nada.

⚠️ **O risco que sobra enquanto não trocar, declarado sem alívio:** quem tem o
keystore consegue assinar um APK que o Android aceita como **atualização
legítima do DigiApp**, instalando por cima e preservando os dados. **Não**
consegue publicar na Play — isso exige credencial de conta, que nunca esteve no
repo. **O risco é de instalação lateral, não de loja.**

E um detalhe que agrava: a senha da **outra** keystore está em texto puro num
`build.gradle` do repo. A da que importa não foi encontrada — mas JKS tem
derivação de chave fraca, então foi tratada como comprometida.

Ver seção 3.

### 🆕 1.5 Cadeia de suprimentos — a lacuna inteira que ninguém tinha auditado

Até 26/08/2026 esta página registrava, textualmente, que **a cadeia de
suprimentos inteira nunca tinha sido auditada** — dependências, CVEs, permissões
de CI, `vendor/`. Foi auditada. Documento:
`squad-alpha-runs/soulmon-02/security/auditoria-suprimentos.md`.

#### 🔴 `npm audit` em 22/09/2026: **16 vulnerabilidades (4 moderate, 11 high, 1 critical `tar`)** — via `@capacitor/cli` em `dependencies`

Medido na QA Rodada 2 (`05` §1.1): `npm audit --json` → 16; `npm audit --omit=dev` → 1 critical + 2 high, **todos por `@capacitor/cli`**, que continua em `dependencies` do `package.json` (`package-lock.json` intocado desde `4a8b8049`). A QA Rodada 1 (`00-seguranca-a` B4, consolidado §3.4) declarou "→ `devDependencies` + `npm audit fix`" como **em correção** e não aterrissou em `a6c1cd8a`. **Em curso na R2** (frente frontend move para `devDependencies`; `depsVivas.contract.test.ts` passa a exigir a ausência). Cadeia de dev/build (`sharp`, `vite`, `wrangler`/`miniflare`), não o runtime do worker — mas ninguém vigia `npm audit` (sem guard, sem CI): sem dono.

#### 🔴 O achado que importa: **o gate do CI estava MORTO**

**Confirmado no `ci.yml` desta árvore, com o comando colado no próprio
workflow.** Havia um step que exigia `node_modules/class-system/package.json` e
falhava com *"class-system NAO instalou"*. Ele **não podia passar nunca**: a
dependência de git saiu do `package.json` e do `package-lock.json` quando o
`vendor/` entrou (ADR-002 §1).

```
grep -c "class-system" package-lock.json  ->  0
grep -n  "class-system" package.json      ->  so o script `vendor:class-system`
ls node_modules/class-system              ->  No such file or directory
```

**A consequência é a parte grave, e ela é inferência forte a partir da ordem dos
steps** (marcada como tal): o step morto vinha **ANTES** do `tsc` e do `vitest`,
que são o motivo de o workflow existir. Um step que sempre sai com exit 1 derruba
o job ali. Ou seja: **`tsc` e `vitest` provavelmente não rodaram em push nenhum**
enquanto isso esteve de pé. O CI *parecia* proteger e não protegia.

⚠️ **E ninguém percebeu porque falha de CI vira ruído.** Um gate que sempre
reprova é um gate que alguém desliga — ou, pior, que todo mundo aprende a
ignorar. É a lição **12** de `LICOES-DE-METODO.md`: **gate morto é pior que gate
ausente**, porque gate ausente pelo menos não mente sobre cobertura.

#### O que entrou no lugar, e o resto da rodada

| O quê | Commit | Estado |
|---|---|---|
| **`node_modules` sai do rastreamento** — **19.035 arquivos** | `6e7aa3cd` / merge `aa487200` | ✅ **Confirmado**: `git ls-files node_modules \| wc -l` → **0**. O `.gitignore` já listava `node_modules/`; os arquivos estavam rastreados de antes do ignore, e ignore não desrastreia nada |
| **Integridade do `vendor/`** no lugar do gate morto | `0d41b74c` | ✅ recalcula o `sha256` do bundle contra `_provenance.json`. **Lê o BLOB do git (`git show HEAD:…`), não o arquivo do disco** — `core.autocrlf` transforma LF em CRLF no checkout do Windows e o disco dá outro hash (medido: 232.533 bytes no disco contra 226.978 no blob). Quem escrevesse isto lendo o disco criaria um teste que reprova sozinho na máquina do dono — e seria desligado na semana seguinte |
| **`permissions:` declarado** nos workflows | `0d41b74c`, `80ef844d` | ✅ mínimo por arquivo. `ci.yml` e `desktop-build.yml`: `contents: read`. **`desktop-release.yml` é o único com `contents: write`**, e precisa: criar Release é escrever no repositório |
| **Actions presas por SHA** | `0d41b74c` | ✅ ex.: `actions/checkout@11d5960a…` (v4.4.0), `actions/setup-node@49933ea5…` (v4.4.0). Tag é ponteiro móvel; SHA não |
| **`npm ci` no desktop** | `0d41b74c` | ✅ instala exatamente o lockfile, em vez de `npm install` |

#### 🆕 O step do `SIBLING_REPOS_TOKEN` foi **provado inútil** e removido

**`80ef844d` / merge `5e07e0a4`.** Havia, no `ci.yml` e no `android-build.yml`,
um step "Clonar os repos irmãos" que reescrevia `git+ssh` para HTTPS com o
`SIBLING_REPOS_TOKEN` — para uma dependência de git **que não existe mais no
lock**. Não é que fosse redundante: **não tinha o que fazer**.

⚠️ **O secret continua existindo e continua tendo dono** — o
`sync-irmaos.yml`, que de fato clona os dois repos irmãos toda semana. **O Bloco
1 do `GUIA-DO-DONO.md` continua valendo.** O que mudou é que o `npm ci` não
depende mais dele, então o deploy não quebra no dia em que o token expirar; o
sync semanal, sim.

**O custo, declarado:** se um dia voltar dependência de git no lock, o `npm ci`
vai tentar SSH e falhar em repo privado. **O conserto não é ressuscitar o
step** — é não voltar a ter dependência de git (ADR-002 §1). Se voltar mesmo
assim, o step está no histórico.

---

## 2. Estado do produto

- **Reskin visual + tema claro/escuro (ago/2026).** Paleta trocou de roxo pra
  teal/cobre (`--sm-*` em `src/index.css`, agora com variante
  `[data-theme="light"]`/`[data-theme="dark"]`). Novo `src/contexts/ThemeContext.tsx`
  (persistido em `digiapp-theme`, reaproveitando a chave do antigo seletor de
  skin) + script inline em `index.html` que aplica o tema antes do primeiro
  paint (evita FOUC) + seletor "Aparência" em Configurações. Os skins
  `win98`/`glitch` — mortos, sem nenhum botão que os ligasse — foram
  **removidos por completo** (código e CSS, ~950 linhas), não só desligados.
  Novo mascote da franquia: um corvo de cartola em pixel-art
  (`src/assets/soulmon/mascot-raven.png`, arte fornecida pelo dono, fundo
  originalmente com checkerboard opaco — removido via flood-fill antes de
  virar asset), usado no ícone do app (favicon/PWA/Android/Electron, todos
  regenerados) e como mascote em loading/onboarding/erro/estados vazios. A
  **mecânica do pet do jogador não mudou em nada** — continua gerado pelo
  oráculo por usuário; o corvo é só identidade de marca. Cobertura de temas é
  por prioridade: fundação + ~15 telas de maior uso migraram pros tokens
  novos agora (ver commit); telas secundárias (minigames, alguns painéis
  fundos) ainda têm cor fixa e migram depois.
- **Auditoria de tom e paridade executada (ago/2026).** O chat de fallback
  passou a entender e responder em PT (antes um usuário escrevendo "tô triste"
  recebia "Cheer up!" em inglês), e o pool de tristeza deixou de invalidar o
  sentimento. O prompt da IA ganhou um piso de tom inegociável e passou a
  chavear personalidade por NÍVEL — antes usava nomes do DigiApp, nenhum casava,
  e todo pet falava como "guide and mentor". O tutorial ganhou fallback local de
  tarefas (sem ele, uma falha de rede prendia o usuário numa tela obrigatória
  sem nada selecionável) e parou de ensinar HP só pelo lado da punição.
  `--sm-muted` subiu de 3,48:1 para ~4,6:1 de contraste. Confirmação do
  "Recomeçar do zero" agora diz a verdade (não apaga progresso) e virou
  "Refazer o ritual".
- **Rodada de check-up com personas (ago/2026)** — teste dirigindo o app no
  navegador com 5 personas do público (adolescente com TDAH que some e volta,
  pai com 3 min/dia, perfeccionista após um dia ruim, usuário 58+ com foco em
  acessibilidade, gamer buscando profundidade). Achado mais grave: **o checkbox
  de concluir tarefa renderizava com 2px** — as classes `w-7`/`h-7` não existem
  no `index.css` pré-compilado (footgun 1), então a ação central do app era
  praticamente invisível e impossível de acertar no dedo. Agora é um
  `<button role="checkbox">` de 44px com o círculo de 28px dentro, em tarefa,
  atividade e etapa. Junto: foco visível em todo o design system (não havia
  `:focus-visible` em lugar nenhum), notificações reescritas, e o popup da
  primeira tarefa traduzido e reescrito.
- **Notificações cobravam quem já tinha cumprido a meta.** `totalRequired` era o
  requisito do estágio, não `min(cadastradas, requisito)` — um rookie com 2
  atividades cumpria a própria meta e mesmo assim levava 3 avisos por dia
  dizendo que faltavam tarefas. Corrigido para a mesma meta de
  `computeDailyReset`. O aviso das 21h ("está preocupado! ainda dá tempo!") foi
  removido, e o das 20h parou de prometer que "metade das tarefas" evita a
  perda — o que era falso.
- **Rodada de auditoria (ago/2026)** — quatro achados, todos corrigidos:
  (1) o **ritmo de cuidado era cego a atividades recorrentes**, porque
  `completedTasks` só recebe tarefas avulsas e `lastCompletedDate` some na
  virada; agora existe `activityLog` (teto de 90). (2) O **galho previsto não
  era dito** — a página de Evolução mostrava os três atributos, mas o jogador
  tinha que inferir para onde ia; agora há uma linha com o galho e, no empate,
  quem desempata. (3) O resumo de "uma ação, várias barras" **só existia para
  tarefas**, não para atividades. (4) Dois **ramos mortos** de `digiegg/baby-i`
  na conclusão de atividade (a árvore nasce em rookie).
- **Limpeza:** 10 componentes órfãos removidos (nenhum era importado em lugar
  nenhum, nem por lazy import) e `wasDayPerfect`/`countCompletedYesterday`
  apagados — eram uma SEGUNDA cópia da regra do dia perfeito, sem nenhum
  chamador em produção mas com testes verdes, dando falsa cobertura.
- **Bug corrigido: concluir tarefa não dava nada.** `completeTask` recusava
  tarefa com `completed: true`, mas o `App` marca a tarefa no clique e só chama
  a função 3s depois — então ela SEMPRE recusava. Resultado: a tarefa não saía
  da lista, não entrava no histórico, não contava na estatística e **não rendia
  a comida**. O laço central de recompensa do jogo estava sem efeito. Anterior a
  este trabalho (presente no backup). Há teste de regressão.
- **Benchmark + Fases 1 a 4 do plano de evolução (ago/2026)** — `docs/PLANO-EVOLUCAO.md`.
  Duas rodadas de pesquisa (apps de produtividade gamificada + franquias/hardware
  Digimon, Pokémon e Palworld) viraram um plano em 5 fases. A **Fase 1 está no ar**:
  teto de 1 coração perdido por dia, perdão de ausência ≥2 dias, alívio de meio
  coração toda segunda, `perfectDays` param de decrementar, e a **masmorra não cobra
  mais da barra de HP** (nem bloqueia entrada). A virada do dia virou função pura
  (`computeDailyReset`) que o hook e o teste compartilham — antes o teste testava
  uma cópia e afirmava uma evolução automática que `MANUAL_EVOLUTION` impede.
  Depois vieram: onboarding perguntando o "porquê", relatório em modo acolhida,
  "esqueci de marcar", check-in de humor, traço de nascimento, ritmo de cuidado
  desempatando o galho, faixas e rodada semanal do Torneio, e a vitrine da
  jornada. Abertos só o modo cooperativo (precisa de backend novo) e a arte da
  decoração (não é código). Ver `docs/PLANO-EVOLUCAO.md`.
- **Palco do pet** (composição, 5 espaços, decoração) — pronto. Contrato de arte
  em `docs/PALCO-E-DECORACAO.md`. Falta só a arte de verdade (hoje são emoji).
- **Torneio** — **8** itens na aba, escada **8/12/15/20/25/40/55/70** Emblemas
  (`utils/shop.ts:359`, `TOURNAMENT_ITEMS`). A vitrine exibe os troféus de season
  realmente ganhos.
  > ⚠️ Corrigido em 26/08/2026: esta linha dizia "6 itens, escada
  > 15/20/25/40/55/70". Dois degraus baratos (8 e 12) foram acrescentados no
  > começo da escada e ninguém atualizou aqui. O `CLAUDE.md` já estava certo — o
  > registro vivo é que estava errado, que é o pior dos dois lugares para errar.
- **Compra dentro do jogo** — `UnlockAccountModal` nos dois momentos em que a
  falta é sentida (limite de criação do grátis; árvore de demonstração na página
  de Evolução), mais ritual do oráculo pós-compra que troca só a criatura.
- **Desktop (Electron)** — overlay é um controle remoto do app.
  Ver `docs/PLANO-DESKTOP-STEAM.md`.
  > ⚠️ **Correção de registro (ago/2026).** Esta linha dizia "overlay
  > **funcional**" e isso era falso desde sempre: `cloudSync.ts` mandava o `id`
  > no CORPO do `POST /api/save`, e `save.js` lia o id só da query — 400 em
  > 100% das chamadas, que o cliente traduzia para `reason: 'network'`. As três
  > únicas ações do overlay (carinho, comida, marcar tarefa) **nunca gravaram
  > nada**. Ou seja: ninguém jamais usou o overlay de ponta a ponta, e mesmo
  > assim ele estava registrado como pronto aqui e tem plano de Steam escrito.
  > Corrigido nos dois lados (cliente manda `?id=`, servidor aceita `body.id`
  > como fallback retrocompatível para as builds já instaladas), com teste
  > ligando o cliente no `onRequest` real — `desktop/renderer/src/pushCareAction.test.ts`.
  > A lição que fica não é o bug de 1 linha: é que o registro vivo afirmou
  > "funcional" sem nada nunca ter exercido o caminho.
  >
  > **Atualização de 26/08/2026 (fim do dia).** As **quatro** ações de cuidado do
  > overlay escrevem no save: carinho, comida, **banho** e **dormir/acordar**
  > (`86341fcb`). E o overlay **quase não reimplementa mais regra** — `care.ts`
  > importa `careUpdaters`, `careRules`, `careCaps`, `playerDay`, `restWindow` e
  > `poopDrain` do app. Sobrou uma cópia declarada (a derivação do `saveId`, sob
  > teste de paridade das três implementações) e uma dívida declarada: **banho é
  > a única transição que não é import**, porque não existe regra pura de banho
  > em `src/utils/` — ela mora no `App.tsx`, acoplada a estado de React. Em vez
  > de copiar, o teste **executa** `applyPoopDrain` sobre o resultado e exige que
  > ela pare de cobrar: quem julga limpeza continua sendo `poopDrain.ts`.
- **Separação do DigiApp** — inventário e ordem segura em
  `docs/SEPARACAO-DIGIAPP.md`. Limpeza de herança morta já feita.

---

## 3. Depende de você

Nada nesta seção pode ser feito por mim — precisa de conta, cartão, painel ou
decisão sua.

### 3.1 Segurança e direitos — urgente

| # | O quê | Por quê |
|---|---|---|
| ✅ | **Licença dos sprites DMC e uso dos nomes Digimon** — RESOLVIDO em 09/08/2026. Foi a opção (b): substituir por arte e nomenclatura originais. Saíram do repositório os 25 `*_dmc.png` (arte da Bandai, via `furudbat/wayland-vpets`) e os 49 `figma:asset/*` das linhas Tapirmon/Veemon/Salamon, junto com os itens de digievolução da loja, os Digimentais e o roster nominal da masmorra. `getSpriteForStage` responde sempre com arte de `src/assets/soulmon/`; save antigo cai num fallback determinístico que também usa arte nossa. Os nomes de franquia saíram até do prompt do gerador (`utils/oracle.ts`), com teste travando a ausência. Detalhes em `docs/Attributions.md`. |
| ✅ | ~~**Reroll por Créditos = resultado aleatório pago com dinheiro real**~~ — RESOLVIDO em 06/09/2026 (WP5.7). Deixou de ser sorteio: virou **Nova Leitura**, DETERMINÍSTICA sobre as 6 respostas do Oráculo (`src/utils/newReading.ts`, semente FNV-1a na ordem fixa de `ORACLE_QUESTIONS`). Não há `Math.random` no caminho, o botão fica desligado enquanto nenhuma resposta mudou, a regra é dita **antes** de cobrar e `public/termos.html` §5 foi reescrito nos dois idiomas. Com isso não é mais loot box sob a Lei 15.211/2025: o que se compra é uma releitura declarada, não uma chance. |
| 🟡 | ~~**Decidir sobre as keystores no histórico do git**~~ → **rebaixado de 🔴 para 🟡 pela análise de 26/08** (§1.4) | Os keystores são do **DigiApp**, não do Soulmon, e o DigiApp usa **Play App Signing** — a chave vazada é a de **upload**, e a rotação é um formulário de ~5 min no Play Console (Assinatura do app → *Solicitar troca da chave de upload*). **Nada a rotacionar do lado do Soulmon.** `git filter-repo` deixou de ser a opção óbvia: ele reescreve todos os commits, exige force push, quebra clones — **e não muda o risco**, porque quem já clonou já tem. O risco real é instalação lateral de um APK que o Android aceita como atualização do DigiApp; **não** é publicação na loja (isso exige credencial de conta, que nunca esteve no repo). |
| ✅ | ~~**Ligar o `FIREBASE_PROJECT_ID`**~~ — **feito em 07/09/2026** (`soulmon-app`), na ordem segura: `.env` → `npm run build` → `wrangler deploy` → só então a variável. Mora no `wrangler.jsonc`, não no painel, porque variável comum é substituída pelo arquivo a cada deploy. |
| 🟡 | **Criar `ADMIN_EMAILS` no painel** (29/09/2026) — `npx wrangler secret put ADMIN_EMAILS` na raiz, valor = seu e-mail de login | Liga o papel de admin/GM da sua conta (`functions/api/_admin.js`). Sem a variável ninguém é admin (fail-closed). Detalhe: `docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.10. |

### 3.2 Lançamento

| # | O quê |
|---|---|
| 🔴 | **GitHub Actions parado por cobrança desde 16/09/2026 — ainda parado em 22/09** (`gh run list --limit 1000 --json conclusion,createdAt` → 260 runs `failure` desde 16/09, anotação *"recent account payments have failed…"*; último `success` = `docs-sync` 15/09 02:54Z). Nenhum portão roda fora da máquina local; o compile Android (`billing-ktx` 8.3.0, `BillingPlugin.kt`) **não está provado**. Só você regulariza *Billing & plans* (#48 → #68) |
| 🔴 | Registrar o pacote no Firebase + baixar `google-services.json` |
| 🔴 | Criar os 4 produtos no Play Console (`soulmon.unlock.full`, 3 pacotes de crédito) |
| 🔴 | Conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` |
| 🔴 | **`PLAY_REQUIRE_ACCOUNT_BINDING = true`** — depois de publicar o app que manda `setObfuscatedAccountId(saveId)`. É o que impede um recibo de virar N contas pagas (ver docs/BILLING-SETUP.md) |
| ✅ | ~~Opcional:~~ banco **D1** vinculado como `DB` + tabela `order_claims` — **APLICADO em 22/09/2026** (registro do dono **#65**). É o conserto do **SEC-3**, que a §1.2 chamava de *maior risco de dinheiro que sobrou*. O que aconteceu, para o próximo que perguntar "está aplicado?": `0001_order_claims.sql` rodou **ok**; `0002_order_claims_expires_at.sql` **falhou com `duplicate column name: expires_at`** — a tabela **já existia com a coluna**, vinda do caminho `d1 execute --remote --file` que o `migrations/README.md` antigo mandava usar — e por isso foi **marcada como aplicada**. Provas colhidas: `npx wrangler d1 execute soulmon-billing --remote --command "PRAGMA table_info(order_claims)"` → **4 colunas** (com `expires_at`); `npx wrangler d1 migrations list soulmon-billing --remote` → **"No migrations to apply"**. Consequência: **a 1ª compra da Play não dá mais 500** — `claimOrderAtomic` encontra a tabela. ⚰️ Esta linha já carregou duas mentiras mortas ("o `wrangler.jsonc` não tem binding `d1_databases`" e "sem a tabela, a query falha e o resgate cai no caminho antigo" — o `DELETE` inicial estava FORA do `try`, e a 1ª compra dava 500). A lápide do caminho `execute --file` está em [`migrations/README.md`](../migrations/README.md): **não use `execute --file` para migração**, foi ele que produziu a colisão |
| 🔴 | URL da política de privacidade + formulário de Segurança de Dados |
| ✅ | ~~`VITE_FIREBASE_*`~~ — **feito em 07/09/2026**, no `.env` LOCAL (não no painel: são de BUILD, o Vite as inlina). Projeto `soulmon-app`. Chave conferida contra a API do Firebase, não só transcrita. |
| 🟠 | Conferir no painel do Cloudflare se já existe o projeto Pages `soulmon` — o `wrangler.jsonc` diz que sim. ⚠️ **A segunda metade desta linha era FALSA e saiu**: dizia que `capacitor.config.json` "ainda aponta o APK para `digiapp-a5e.pages.dev`". Conferido em `e8aef62a` — ele aponta para `https://soulmon.mateus-sprnd.workers.dev`, e as três fontes concordam (`capacitor.config.json`, `desktop/renderer/src/config.ts`, `desktop/electron/main.js`). É a **mesma mentira** que o `CLAUDE.md` e o `docs/PLANO-DESKTOP-STEAM.md` carregaram até 26/08 e que faria um agente decidir errado sobre deploy |
| ⚰️ | ~~**Comentário mentiroso encontrado e NÃO consertado**: `desktop/renderer/src/config.ts` diz *"A URL ainda aponta pro Pages herdado do DigiApp"*~~ — **fechado**: o `config.ts` já era lápide antes do QA de 21/09/2026, e a mesma mentira tinha **migrado** para `desktop/electron/main.js` acima de `FULL_APP_URL` ("Ainda aponta pro Pages compartilhado") — corrigida nessa rodada, apontando a régua `src/deploy/appUrl.contract.test.ts` |
| ✅ | ~~Endereço de contato do VAPID~~ — **resolvido em 07/09/2026**: o dono escolheu `mateus.sprnd@gmail.com`. É endereço de CONTATO (RFC 8292 `sub`), para onde o serviço de push escreve em caso de falha de entrega; nunca aparece para o usuário e trocá-lo não invalida subscription nenhuma. Substituir por um endereço do domínio do Soulmon quando ele existir. ⚰️ ~~"Só vale na borda depois de um `wrangler deploy` dentro de `workers/`"~~ — o worker **foi deployado em 21/09/2026 12:57Z** (medido em 22/09, `wrangler deployments list --name digiapp-push-scheduler`); o endereço está na borda. |
| 🟠 | **Decidir se a Fase 4 (sensores via Health Connect) vale o custo** — só o dono pode: exige **conta de organização verificada** no Play (enforcement jan/2026; conta pessoal é bloqueador), declaração de health app, política de privacidade dedicada e consentimento LGPD art. 11 específico por finalidade, além de APK novo. A Fase 3 (Janela de Descanso + Sonhos) já roda **sem sensor nenhum**, igual na PWA e no APK — a Fase 4 é opt-in, só Android, e o plano só a previa **se** a Fase 3 provar que move retenção. Caminho técnico, se aprovada: `@capgo/capacitor-health` (único plugin Capacitor vivo em 2026 que expõe sono). **Google Fit está morrendo (APIs até o fim de 2026) — nada deve ser escrito contra ele.** |
| 🟡 | `ASSETLINKS_PACKAGE_NAME` e `ASSETLINKS_SHA256` no Pages (fingerprint sai do Play Console → Integridade do app) |
| 🟠 | 🆕 **Gerar um APK novo** — três pacotes estão prontos no repo e SÓ passam a valer no aparelho com um build novo do Android: **WP0.6** (`setObfuscatedAccountId`, que amarra a compra do Play ao save), **WP5.8** (preço localizado vindo do próprio Play, em vez do rótulo fixo em BRL — hoje quem está fora do Brasil vê um número errado na tela de compra) e **WP2.6** (o widget passa a mostrar constância, escudos e a oferta dos 5 minutos). O `android-build.yml` builda no push; o artefato fica em `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`. ⚠️ **Só depois desse APK publicado** ligue `PLAY_REQUIRE_ACCOUNT_BINDING=true` — antes disso ele recusaria toda compra (é a linha abaixo, que continua valendo). |
| ✅ | ~~🆕 **`SEASON_ADMIN_KEY` como secret do worker de push**~~ — **medido em 22/09/2026** (`npx wrangler secret list --name digiapp-push-scheduler` → `SEASON_ADMIN_KEY`, `VAPID_JWK`): está lá, e o worker **está deployado** (`npx wrangler deployments list --name digiapp-push-scheduler` → 21/09/2026 12:57:29Z, posterior ao último commit em `workers/`, `3e758a81` de 20/09 — #50(a) respondida; ⚰️ "só vale depois de um `wrangler deploy`" já valeu). **O que FALTA no worker: `FIREBASE_SERVICE_ACCOUNT`** (o JSON da conta de serviço do projeto `soulmon-app`) — sem ele o canal **FCM (APK Android) nunca envia**; só o Web Push (PWA) funciona. `cd workers && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT` (pergunta **#66**). Sem `SEASON_ADMIN_KEY`/`APP_URL` o fechamento da season é pulado com log — isso continua valendo como desenho |
| ✅ | ~~**`METRICS_ADMIN_KEY` no Pages**~~ — **definida** (medido em 22/09/2026, QA Rodada 2 `05` §1.1: `curl -s -w '%{http_code}' https://soulmon.mateus-sprnd.workers.dev/api/metrics` → **401** `Unauthorized`, que só sai depois de `env.METRICS_ADMIN_KEY` truthy — sem a chave a rota responde 404; `npx wrangler secret list` na raiz → `GROQ_API_KEY`, `HF_API_KEY`, `HF_SECRET`, `METRICS_ADMIN_KEY`, `SEASON_ADMIN_KEY`). ⚰️ "você não consegue ler nada até definir esse segredo" — já consegue: `node scripts/metrics-report.mjs` com a chave. **O que FALTA na raiz: `ENTITLEMENTS_ADMIN_KEY`** — `POST /api/entitlements?action=grant` responde **404** no ar (a rota de cortesia não existe sem a chave) → **nenhuma cortesia pode ser concedida → o E0 não começa**; e `COURTESY_MAX_ACCOUNTS` (padrão 25 no código ≠ plano de 10). `npx wrangler secret put ENTITLEMENTS_ADMIN_KEY` e `… COURTESY_MAX_ACCOUNTS` (pergunta **#67**); prova: grant com chave errada → 401. Também ausente: `GEMINI_API_KEY` (sem Higgsfield o sprite morre, não cai no fallback — #63) |

### 3.3 Steam

| # | O quê |
|---|---|
| 🔴 | Conta Steamworks + US$ 100 |
| 🔴 | **App ID e Depot ID** (bloqueiam o cliente Steam) |
| 🟠 | Arte da loja |
| 🟠 | Subir build a partir de uma máquina Windows. ✅ **O empacotamento em si deixou de ser incógnita** — `npm run dist:steam` rodou em 26/08/2026, EXIT=0, 274 MB (`desktop/STEAM.md`). O que falta é o `steamcmd` com o seu login de parceiro |
| 🟠 | **Ligar o Modo de Desenvolvedor do Windows** (Configurações → Privacidade e segurança → Para desenvolvedores). É **pendência de MÁQUINA, não de projeto**: o pacote `winCodeSign` do electron-builder traz dois symlinks de macOS (`libcrypto.dylib`, `libssl.dylib`) que não servem para nada num build `--win`, e criar symlink no Windows exige o Modo de Desenvolvedor. Sem ele o build inteiro morre por causa de dois arquivos irrelevantes, **depois** de já ter gerado o `.exe`. Contornado uma vez pré-extraindo o `.7z` à mão; a saída limpa é sua, porque mexe em configuração do sistema |
| 🟠 | **Preencher `author` em `desktop/package.json`.** Hoje o electron-builder avisa `author is missed`. No `--dir` é só aviso, mas o `nsis` do `npm run dist` usa o `author` como **Publisher do instalador** — é o nome que aparece no aviso do Windows e nas propriedades do `.exe`. Não preenchi porque é **identidade, não código** |
| 🟡 | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID`. ⚠️ **"o SEC-4 já está corrigido" é forte demais** — a §1.2 o marca **parcial**, e a metade que falta é uma variável: `PLAY_REQUIRE_ACCOUNT_BINDING` continua não ligada, e `isPlayPurchaseBoundTo` lê `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`, ou seja **sem a variável a compra sem vínculo é aceita**. O que está corrigido é o oráculo de enumeração do `orderid`. O cliente Steam ainda precisa mandar o session ticket junto do `orderId` |

### 3.4 Ordem que evita ficar fora do ar

1. Projeto Pages novo + KV novo + variáveis → conferir pela URL `*.pages.dev` do
   projeto novo, sem mexer no que está no ar.
2. Publicar o domínio próprio.
3. Só então atualizar `capacitor.config.json`, gerar APK novo e publicar.
4. Por último, aposentar o Pages antigo.

Fazer na ordem inversa (mexer no `server.url` antes de o destino existir) quebra
o app de todo mundo que já tem o APK instalado.

---

## 4. Dívidas conhecidas (aceitas por ora)

- **Admin/GM — três dívidas do L1 (29/09/2026), sem mudança de comportamento**
  (`docs/reviews/admin-corvo/L1-sustento.md`, notas em `impl-notas-backend.md`).
  **M-3**: o perfil público de `community.js` (`profile`) confia em `stage`/`unlockedStages`/`attrs`
  do cliente; o GM leva isso a um toque e o dono aparece como ultra no PvP/ranking. Correção sugerida:
  não publicar perfil PvP quando `isAdmin` ou limitar `stage` pelo vitalício do servidor.
  **B-3**: `gmGoToForm` reduz HP/energia ao descer de forma; ajustar o comentário "nunca reduzem".
  **B-4**: `rebirth-reset` confia em `state.rebirth` escrito pelo cliente (conta paga forja e dobra o
  vitalício de sprite uma vez); correção sugerida: exigir `aiLifetime.sprite` perto do teto e ultra
  registrado no servidor. Cenário do admin agora limitado por `ADMIN_SPRITE_MONTHLY_CAP` (40/mês).
- **Emblemas ficam no save do cliente**, como os Bits — farmáveis por quem editar
  o `localStorage`. Aceitável **enquanto a aba Torneio vender só cosmético**. Há
  teste travando isso: se algum item de torneio virar vantagem de jogo, o teste
  cai, e a resposta certa é mover Emblemas para o servidor, não afrouxar o teste.
- **Validade ilegível vira "nunca expira" na ponte de login do desktop.**
  `auth-preload.js` faz `Number(payload.expiresAt) || 0`, e `main.js` lê `exp: 0`
  como sessão sem prazo (o guard só roda `if (authSession.exp && …)`). Ou seja:
  um payload com validade ausente, `NaN` ou `null` produz um token que o overlay
  nunca considera vencido. **Documentado e NÃO consertado de propósito**:
  escolher o comportamento certo (recusar? tratar como já vencido? pedir
  renovação?) é decisão, não limpeza — e o caminho ainda não roda em produção
  (§3d de `docs/PLANO-DESKTOP-STEAM.md`). Travado por teste em
  `desktop/renderer/src/authBridge.test.ts`, que documenta o ponto cego em vez
  de mascará-lo.
- **Corrida no `spendCredits`** (read-modify-write) — limitada a cobrar a menos
  do jogador, nunca a cunhar crédito. Cai junto se o SEC-3 migrar o módulo para
  Durable Objects.
- ~~**Arte da decoração são emoji.**~~ **FEITO** (ago/2026): 33 peças com PNG de
  verdade em `src/assets/decor/` + `utils/decorArt.ts`, e 8 cenários PINTADOS
  em `utils/backgrounds.ts`. Ver `docs/PALCO-E-DECORACAO.md`.
- **Duas cenas geradas ficaram sem casa**: `evolution-ritual` e `evolution-ultra`
  (1080×1920, em `_gemini_out/backgrounds/`, fora do repo). A `EvolutionCeremony`
  já tem um fundo em VÍDEO animado; trocá-lo por PNG estático seria piorar.
  Entram no dia em que a cerimônia ganhar variação por galho — aí a arte já
  existe.
- **O palco fica largo demais no desktop.** A caixa do visor acompanha a largura
  da página (≈1500px numa tela de 1920), enquanto os cinco espaços de decoração
  têm tamanho FIXO em px e posição em % — o resultado é um sofá de 56px a 16% de
  uma caixa de 1500. É anterior a este trabalho e afeta todos os cenários, mas a
  arte pintada tornou o efeito visível. A correção provável é limitar a largura
  do `.sm2-device-stage` à proporção da arte (250 × 1,85 ≈ 462px); é mudança de
  layout na tela principal, então fica para o dono decidir.
- **Cura instantânea por Créditos** é, na prática, pagar para pular o cuidado — a
  mesma crítica que Kotaku e Digital Trends fizeram ao Premium Pass do Pokémon
  Sleep. Sugestão em `docs/PLANO-EVOLUCAO.md`: reposicionar como perdão pontual
  com teto. É decisão de produto, não técnica.
- ~~**Sprite do cocô** é um blob escuro pouco legível.~~ **FEITO** (ago/2026):
  redesenhado na paleta do kit, legível em 32px.
- ~~**Os 30 slots do Dex de Sonhos são emoji do sistema.**~~ **FEITO**
  (ago/2026): 30 sprites nossos em `src/assets/soulmon/dreams/` +
  `utils/dreamArt.ts`. Era a ÚNICA coleção do jogo e a única sem arte própria.
  O `emoji` continua no `DREAM_CATALOG` de propósito — é o único glifo que cabe
  num push, onde não existe `<img>`.
- ~~**Consumíveis e FX eram emoji do sistema.**~~ **FEITO** (ago/2026): 25
  sprites novos — 8 comidas + 5 itens especiais (`utils/itemArt.ts`, chave =
  EMOJI porque `foodInventory` indexa o save assim; trocar a chave quebraria
  save, trocar só a arte não quebra nada) e 6 FX de batalha + 6 partículas de
  cuidado (`utils/fxArt.ts`, chave = o `icon` dos popups). Todo render cai no
  emoji quando não há arte — item novo nunca quebra, só nasce sem sprite.
  Lista e prompts em `D:\Soulmon\prompts\consumiveis-fx-list.md`. O que foi
  deliberadamente NÃO gerado: moeda para Bits (regra: Bits nunca têm ícone) e
  `CATEGORY_EMOJIS` (lado SVG da fronteira do Visor).
- **Quatro itens do `BACKLOG-ARTE-GERAR.md` foram declarados OBSOLETOS**
  (`A3`, `A10`, `A15`, `A16`): foram escritos antes do `PLANO-DESIGN` e pedem
  pixel art em superfícies que o §1 dele põe do lado SVG (fronteira do Visor).
  Gerá-los pagaria uma dívida que deixou de existir e criaria outra.

---

## 5. O achado estrutural do loop de QA (ago/2026)

Três rodadas de auditoria acharam 5 defeitos reais, e **nenhum era erro de
lógica**. Todos eram **fronteiras sem dono** — um lado supondo algo do outro,
com nada forçando o encontro:

| defeito | fronteira |
|---|---|
| Checkbox de 2px (`w-7`/`h-7` inexistentes) | JSX ↔ CSS pré-compilado |
| Overlay que nunca gravou (id no corpo vs. query) | cliente desktop ↔ handler HTTP |
| `save.js` sem nenhum teste | código ↔ medidor de cobertura |
| Xadrez assado em `nest-base.png` e `icon-reset.png` | asset ↔ renderer |
| Página HTML salva como `.png` | download ↔ árvore de assets |

O diagnóstico em uma frase: **a suíte media intenção, não efeito.** A prova
mecânica cabia numa linha — `vitest.config.ts` fixava `environment: 'node'`, e
**não existia um único teste que montasse um componente**. O checkbox de 2px não
"escapou" da suíte: ela era estruturalmente incapaz de vê-lo. O motivo de nunca
ter existido teste de componente também não era preguiça — os aliases
`figma:asset/*` só existiam no `vite.config.ts`, então **nenhum componente era
importável em teste**.

**O que passou a existir, e é isto que precisa ser mantido:**

- `src/test/renderEnv.tsx` — monta componente com o `index.css` REAL e mede
  estilo computado. `renderEnv.selfcheck.test.tsx` prova que o instrumento
  enxerga: `w-7`/`h-7` computam `width: auto`, `w-11` não.
- `src/index.css.contract.test.ts` — classe usada no JSX que não existe no CSS.
  ⚠️ **Variante nova precisa ser escrita aninhada (`&:hover`)**; a forma plana
  passa despercebida pelo guard.
- `src/assets/assets.contract.test.ts` — xadrez assado, arquivo não
  decodificável, pixel fora da paleta. Tem quarentena com regra de honestidade
  (o defeito precisa continuar existindo **e** o arquivo não pode estar
  importado) para a lista não virar cemitério.
- `desktop/renderer/src/pushCareAction.test.ts` — **o modelo a replicar**: liga
  o cliente no `onRequest` real, não num mock que devolve 200.

**Regra que sai disso:** todo guard novo precisa de **casos de
autoverificação** que provem que ele enxerga. Sem isso, um guard passa sempre —
pelo motivo errado. Aconteceu duas vezes nesta rodada: o guard de CSS nasceu com
13 falsos positivos (lia `,` e `:` como parte do nome da classe, e por isso
acusou `flex-shrink-0`, que nunca esteve quebrado), e uma limpeza de magenta se
declarou completa usando um critério mais frouxo que o do próprio teste.

**Previsão registrada** (`product/soulmon-01/sweeper/skeptic-review.md`): os
próximos defeitos reais serão fronteiras sem dono, não lógica em `utils/`. A
aposta nº 1 era o **APK**.

### ✅ A previsão se confirmou no primeiro APK — e em minutos

O dono instalou o artefato do CI logo depois deste deploy. Nome certo, ícone
certo, `appId` certo (`com.hexervoodoom.soulmon`) — e **abriu o DigiApp**.

Causa: o APK **não embarca o app**, carrega uma URL remota, e
`capacitor.config.json > server.url` apontava para `digiapp-a5e.pages.dev`, o
projeto Pages do repositório antigo. A mesma URL estava em mais **três**
arquivos, incluindo os dois do desktop — ou seja, **o overlay Electron lia o
save do outro projeto**. Quatro arquivos, uma verdade, e nada que os obrigasse
a concordar.

Nenhum dos 653 testes olhava para isso: cobriam o app rodando, não onde a casca
vai buscá-lo. Fronteira sem dono, exatamente a assinatura das outras cinco.

**Corrigido** para `https://soulmon.mateus-sprnd.workers.dev`, depois de
verificar no ar que o destino serve o Soulmon com o build atual
(`index-C_r_Y4yT.js`), que `/api/save` valida (400 em id inválido), que o KV
responde, que `/api/community` já devolve `pid` derivado (SEC-2 valendo) e que
o header de CSP é o novo. Era a condição que o `CLAUDE.md` exigia para
autorizar a troca.

**Travado por `src/deploy/appUrl.contract.test.ts`**, que exige as quatro
fontes concordando, proíbe endereço de outro produto, e confere que a config
gerada por `npx cap sync` não ficou para trás da raiz — o caso em que alguém
edita a raiz, esquece o sync e o build passa mesmo assim. Verificado nas duas
pontas: vermelho com a URL antiga, verde com a nova.

**Ainda é preciso um APK novo.** O APK já instalado tem a URL velha assada
dentro dele e continuará abrindo o DigiApp até ser substituído pelo build do
próximo run do CI. ✅ Confirmado pelo dono em aparelho real: o APK novo abre o
Soulmon.

### Rodada 4 — a correção virou a fronteira nova

`product/soulmon-01/sweeper/round4-audit.md`. Três defeitos, **dois deles no
código que as rodadas 1–3 acabaram de escrever**, e ambos do mesmo subtipo:
**fix aplicado por ARQUIVO em vez de por REGRA**.

| sev | defeito | fronteira |
|---|---|---|
| 🔴 | A página de Evolução previa o galho com `completedTasks + activityLog`; a cerimônia decidia só com `completedTasks`. Quem cumpre hábito por atividade recorrente via "Harmonia" e evoluía para "Vírus" — e evolução não se desfaz pela via normal | `App.tsx:2173` ↔ `App.tsx:924`, duas chamadas da mesma regra, uma atualizada |
| 🟠 | Adotar save da nuvem gravava `SAVE_ID` **antes** de `GAME_STATE`, com `setItem` cru. Storage cheio = identidade trocada sem o dado, sem reload e sem aviso; o cloud save seguinte subia o estado local antigo por cima do save do outro aparelho | os 4 call sites que substituem o save inteiro ↔ o `safeStorage` da rodada 3, que parou no provider |
| 🟠 | O teto por IP rodava **antes** do cache de borda: acerto de cache custa ~zero KV e mesmo assim gastava uma das 20 varreduras/min. Sob CGNAT/escola, 30 jogadores reais num IP levavam 429 na resposta mais barata da rota | teto de custo ↔ cache, em `community.js` |

Corrigidos, com regressão travada e **verificação nas duas pontas**
(`careHistory.contract.test.ts`, `adoptCloudSave.test.ts`, `costCeiling.test.js`).
Suíte: 662 → **685 testes**, 0 falhas.

**Fechado com número:** o crescimento do `localStorage` **não é risco** —
`completedTasks` (a única estrutura sem teto) custa ~190 kB/ano para um usuário
de 4 tarefas/dia, contra ~5 MB de cota. Mais de uma década.

**Continuam ABERTOS:** last-write-wins do cloud save entre dois aparelhos
(recomendação registrada no §6 do relatório: `savedAt` + 409 no `save.js`),
"usuário com SW antigo recebe deploy novo", e a deriva `workers/` ↔ `functions/`.

### Rodada 6 — fuzzing: a fixture que certificava uma tela branca

`product/soulmon-01/sweeper/round6-fuzz.md`. Instrumento: **teste de propriedade
sobre estado de save hostil**, e o consumidor REAL do estado em vez de um espião.

| sev | defeito | situação |
|---|---|---|
| 🔴 | Todo save que não traz `activities` (ou traz `tasks` não-array etc.) é **tela branca permanente**: `hydrateSave` só fazia `?? padrão` — não cobria `activities`/`healthPoints`/`totalXP`/atributos e não garantia TIPO nenhum. A virada do dia, que roda no mount, lançava dentro do updater. Alcançável por `adoptCloudSave`, que grava qualquer objeto simples vindo de `/api/save` | **corrigido** (`arr()`/`num()` em `hydrateSave`) |
| 🟠 | `resolveBranch` devolvia **`undefined`** (fora do próprio tipo) quando um atributo era não-finito: `Math.max` → `NaN` → lista de líderes vazia. Galho previsto indefinido na página de Evolução e `currentBranch: undefined` no save | **corrigido** (`carePattern.ts`) |
| 🟠 | **Em rookie, degenerar é ganho puro**: HP volta cheio *e* `perfectDays` é SETADO em 2 (de 4). Quem abandona o pet 3 dias progride mais que quem cumpre a rotina. Contraria "perfectDays só acumulam" | **ABERTO — decisão do dono.** Travado por teste existente que diz "for free". Fix de 3 linhas no §4 do relatório, não afrouxa nada |

**Achado sobre o aparato:** `GameStateContext.hostile.test.tsx` (rodada 2) monta
um espião que só serializa o estado — **nunca monta `useDailyReset`**. A fixture
dele, `{ perfectDays: 10 }`, passava há três rodadas certificando exatamente o
🔴 acima. É o segundo guard cego em duas rodadas (o primeiro foi
`cloudSync.test.ts`, rodada 5). Suíte: 766 → **829 testes**, 0 falhas.

**Próximo instrumento proposto: mutation testing** — o único que mede o
*detector* em vez do *detectado*, e o único que teria pego os três guards cegos
(este, o da rodada 5 e o `simulateReset` do footgun 9) de uma vez.

### Rodadas 7 e 8 — mutation testing: medindo o detector

`product/soulmon-01/sweeper/round7-mutation.md` e `round8-save-content.md`.
Instrumento: **`scripts/mutation-sweep.mjs`** (versionado, sem dependência
nova). Aplica uma mutação mecânica numa linha de produção, roda a suíte e
reverte; mutante que não deixou nada vermelho **sobreviveu** — ali o teste é
cego, ou a mutação é equivalente.

**Rodada 7** mediu **51% de sobrevivência** em 720 mutantes e corrigiu 36 —
entre eles um teste chamado *"devolve meio coração na virada de segunda"* que
não afirmava nada sobre meio coração (a expectativa era calculada com a própria
constante auditada), `AD_REWARD_CREDITS` na mesma armadilha (**dinheiro real**),
`amount <= 0` recusando gastar 1 crédito, e compra estornada nunca marcada
(debitada de novo a cada leitura de saldo, para sempre). Suíte: 829 → **863**.

**Rodada 8** atacou os dois arquivos que leem/gravam o save do jogador, onde um
defeito não dá erro — devolve um jogador **plausível e errado**:

| arquivo | antes | **depois** | sobreviventes cegos |
|---|---:|---:|---:|
| `src/contexts/GameStateContext.tsx` | 22,6 % | **83,3 %** | **0** (14 equivalentes) |
| `desktop/renderer/src/cloudSync.ts` | 27,4 % | **91,1 %** | **0** (12 equivalentes) |

A causa era uma só, e vale como regra: **carregar não é conter, montar não é
afirmar.** Os testes existentes perguntavam *"é array? é número finito? o app
sobreviveu?"* — nenhum perguntava **qual número**. Sobreviviam todos os padrões
da hidratação (um Crédito de graça por save, PvP ligado sem opt-in, pet
degenerado ressuscitando ao recarregar) e o arquivo inteiro do overlay
(`401` virando "sem conexão", `{ok:false}` virando `{ok:true}` em 8 lugares,
save sem HP mostrando **pet morto**). Suíte: 863 → **981 testes**. Nenhuma linha
de produção alterada; nenhum teste afrouxado.

**Onde o loop continua:** `functions/api/_billing.js` (40%, e é dinheiro:
compra PENDENTE pode virar válida) — o instrumento certo ali **não é mais
mutação**, é um fake do endpoint da loja no molde de `pushCareAction.test.ts`;
depois `carePattern.ts` (51%, tabela de limiares sem teste de limiar) e
`save.js` (63,9%).

### 🔴 ABERTO — `minSdkVersion = 24` é uma promessa que o app não cumpre

Descoberto porque o smoke do APK falhou e o diagnóstico mostrou
`WebViewFactory: Loading com.google.android.webview version 83.0.4103.106`.
A imagem do emulador da API 30 traz WebView 83 (Chromium de meados de 2020).
Nele o Capacitor registrou os plugins, carregou a URL certa e logou
"App started" — e o JS morreu no parse. Tela em branco, ponte nunca chamada.

**O smoke não estava com defeito: ele reproduziu um usuário real de WebView
velho.** O CI passou para API 35 para deixar de testar isso por acidente, mas o
problema de produto continua:

| recurso | usos | exige |
|---|---|---|
| `oklch()` | 87 | Chromium 111+ |
| `color-mix()` | 97 | Chromium 111+ |
| aninhamento `&:hover` | 18 | Chromium 112+ |
| `vite.config.ts` `build.target` | `'esnext'` | sem transpilação nenhuma |

`android/variables.gradle` declara `minSdkVersion = 24` (Android 7.0). Quem
instalar num aparelho com WebView desatualizado — Android 7/8/9 que não
atualiza, ROM sem Play Store, aparelho corporativo travado — **instala e vê
tela branca**, sem mensagem nenhuma. A Play Store usa o `minSdk` para decidir
quem pode instalar, então hoje ela oferece o app para gente que não consegue
usá-lo.

Três saídas, e a escolha é do dono porque muda alcance de loja:

1. **Subir o `minSdk`** para ~30 e aceitar perder aparelhos antigos. Não resolve
   sozinho: o WebView é atualizável independentemente da versão do Android, então
   um Android 11 com WebView velho continua quebrando.
2. **Tela de aviso por detecção de recurso** — um `CSS.supports('color','oklch(0 0 0)')`
   no `index.html`, antes do bundle, mostrando "seu navegador do sistema está
   desatualizado, atualize o Android System WebView" em vez de tela branca.
   É a única que cobre o caso real (WebView velho em Android novo). ⚠️ Mexe nos
   scripts inline e portanto nos hashes da CSP — `src/security/csp.test.ts`
   recalcula e vai acusar se esquecerem.
3. **Transpilar de verdade**: `build.target` para algo como `chrome87` e trocar
   `oklch`/`color-mix`/aninhamento por equivalentes. Recupera o alcance completo,
   e é de longe a mais cara — a paleta inteira está em `oklch`.

Recomendação: **(2) agora** (barata, honesta com o usuário) e (1) junto, com o
`minSdk` refletindo o que o app realmente aguenta. (3) só se houver dado de que
o público de aparelho antigo importa.

## 27/09/2026 — sincronização do manual pós-merge 8fbf6990

Delta `2336e4e7..8fbf6990` (4 commits: curadoria das 37 bases do bestiário,
registro da decisão do dono sobre "Profissão", revisão multiagente com ponte
de elementos/bioma/biologia). Redatores despachados: `doc-redator-regras`
(02-REGRAS-DE-NEGOCIO.md; 01-VISAO.md não mudou), `doc-redator-referencia`
(06-REFERENCIA/utils.md), `doc-historiador` (10-DISCUSSOES-E-DECISOES.md +
escreveu a §11 que faltava em `BESTIARIO-PROCEDENCIA.md`), `doc-bibliotecario`
(uma linha na §6 do 00-MAPA.md). `doc-verificador` conferiu os 5 docs símbolo
por símbolo, corrigiu uma imprecisão de redação (contagem dos 84 biomas
"Variado") e carimbou os 4 docs do manual. Guard `docsManual.contract.test.ts`
e `docsSemMentira.contract.test.ts`: verdes.

Divergência registrada (não é código errado, é lacuna de régua):
`BESTIARIO-PROCEDENCIA.md` §11 documenta que a ponte de elementos
(`scripts/bestiario-ponte-elementos.mjs`) ainda não tem teste dedicado
travando a auto-retirada quando o corpus upstream trouxer cobertura real —
hoje só a régua de piso (`curadoria.contract.test.ts`) existe.

Nesta mesma sessão, em resposta ao objetivo do dono ("loop no bestiário até
ter todas as criaturas verificadas"), `curadoria.contract.test.ts` ganhou um
bloco de verificação EXAUSTIVA (todas as 630 criaturas, não amostra): campos
obrigatórios presentes, descrição sem truncamento e corroborando o nome,
nomes únicos, tamanho dentro do vocabulário válido e atributos numéricos
sãos. 17/17 testes verdes no arquivo.

## 27/09/2026 — bestiário: pedido de nome de franquia VETADO, arquétipos genéricos no lugar

O dono pediu para usar as ~4.000 linhas de franquia do corpus `Besti-rio-`
(Pokémon/Digimon/D&D/Warcraft/etc.) como inspiração pro gerador de sprite,
citando o NOME do personagem no prompt de imagem. `soulmon-ip-brand-guardian`
deu parecer **VETADO** (registro completo: `docs/REGISTRO-DE-DECISOES.md`
§15) — risco real de bloqueio de loja e DMCA contra a hospedagem, sem
mitigação por titular, categoricamente diferente da mitologia de domínio
público já citada desde D-B1. A sessão recusou implementar mesmo depois do
dono manter o pedido: o próprio parecer diz que passa do limiar de risco de
produto e exige revisão jurídica formal **antes** do primeiro commit.

Implementado em vez disso, pela alternativa do parecer:
`scripts/bestiario-arquetipos-genericos.mjs` — extrai as FAMÍLIAS genéricas
recorrentes na ficção de fantasia (gigante/autômato/espectro/limo/aberração/
morto-vivo, presentes em pokemon/digimon/dnd.json como vocabulário de gênero,
não nome próprio) e escreve descrição ORIGINAL para cada uma. Pool:
630 → **732** criaturas; famílias cobertas em `REALM_TO_FAMILIAS`
(`bestiary/select.ts`): 6 → **12** de 14 (faltam `ignea`/`humanoide`, fora por
ambiguidade — ver `docs/BESTIARIO-PROCEDENCIA.md` §12).

Repo irmão `Besti-rio-` foi clonado nesta sessão (`/home/user/besti-rio-`) e
confirmou que os "14 mil" que o dono via são majoritariamente inflação
combinatória: `faunaflora.json` (2.000 linhas) tem só 6 espécies reais
distintas, `enriched.json` (parte real, 200 linhas) tem 20 — o pool de 630
já usava quase toda a diversidade real disponível antes desta rodada.

Portões: `tsc` ×3 limpo, `vitest run` 4984 passando (1 falha pré-existente,
`convertToWebp.test.ts`, causada por rodar como `root` — ignora `chmod
0o444` —, não é regressão), `npm run build` ok.

## 27/09/2026 — sincronização do manual pós-merge 1d9e278d

Delta `8fbf6990..1d9e278d` (3 commits: verificação exaustiva do bestiário, e
os arquétipos genéricos de fantasia como alternativa ao pedido de nome de
franquia vetado). Redatores despachados: `doc-redator-regras`
(02-REGRAS-DE-NEGOCIO.md; 01-VISAO.md não mudou), `doc-redator-referencia`
(06-REFERENCIA/utils.md), `doc-historiador` (10-DISCUSSOES-E-DECISOES.md —
registra com precisão que foi um PEDIDO DO DONO RECUSADO pela sessão),
`doc-bibliotecario` (linha do 00-MAPA.md, incluindo a §11 que faltava citar
desde a rodada anterior). `doc-verificador` conferiu os 4 docs símbolo por
símbolo, sem devoluções, e carimbou todos. Guard `docsManual.contract.test.ts`
e `docsSemMentira.contract.test.ts`: 10/10 verdes.

## 30/09/2026 — Inglês como língua principal (decisão do dono)

- Shell (`index.html`, manifesto `lang=en`, termos/privacidade EN primeiro com PT em `#pt`, strings padrão do Android em EN), servidor (plano de exclusão de conta), cidades/signos em EN, nomes renomeados (Akashai, Nautil, Astria, Zeph, Fanfare, Bobbi, Frostlands… — `REGISTRO-DE-DECISOES.md` §14.6) e guard novo `src/i18nAstJsx.contract.test.ts`.
- Não feito de propósito: reordenar as ~1.340 ternárias `isPt ? … : …`; renomear ids PT persistidos no save (elementos/reinos/alinhamentos) — precisa de migração, ver `docs/reviews/2026-09-30-ingles-primeiro-nomes.md` §8 (depende do dono).
- `tests/convertToWebp.test.ts` (arquivo somente-leitura) falha por rodar como root no sandbox; independe desta mudança.
