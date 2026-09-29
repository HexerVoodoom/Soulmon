# Copy da Guilda (WPG-0)

> **Fonte única** do texto que o jogador lê na Guilda, para `staff-frontend` importar sem inventar (29/09/2026, `soulmon-copy-redator`). **Não é aprovada** — o `soulmon-narrative-critic` é bloqueante. Ancorada em `docs/PLANO-GUILDA.md` §1/§4/§5/§6/§9/§12 e `docs/reviews/guilda/08-critica-narrativa.md`; precedência: código > teste > este arquivo.

**Regras de leitura.** Todo texto nasce em EN e vem com o par PT (`language === 'pt-BR' ? … : …`). `{x}` é placeholder: números vêm das constantes (`GUILD_MAX_MEMBERS`, `RAID_EMBLEMS`, `RAID_EMBLEMS_FLOOR`, `GUILD_TIDE_WEEKS`), nunca literais. Linhas "SILÊNCIO" significam **não desenhar nada** (nem placeholder, nem ícone vazio). Fala do pet passa por `speak()` (sem emoji); nenhuma string daqui tem emoji. Nenhuma frase é condicionada ao tempo de ausência. Leis: L1..L12 de `NARRATIVA-E-UNIVERSO.md` §2, LV-G1..G10 de `PLANO-GUILDA.md` §13, "§13/§17" da bíblia.

**Nunca escrever na Guilda** (a régua `guildSemCobranca.contract.test.ts` deve travar): "clã/tribo/facção/time/equipe", "líder/chefe/dono", "faltou", "saiu", "abandonou", "precisa de você", "faltam N", percentual, número por pessoa, número de dano, `Weave`, `Vírus/Vacina`, `Glitchtama`, "outro bosque", "adversário".


## 1. Lotes e NPC (mapa)

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.lote.hall.label` | Salão da Guilda | Guild Hall | areaSheetCopy `HALL_LOTS` (já existe) | §12 vocabulário |
| `guild.lote.hall.aria` | Entrar no Salão da Guilda | Enter the Guild Hall | areaSheetCopy `HALL_LOTS` (já existe) | §12 |
| `guild.lote.feira.label` | Feira | Fair | areaSheetCopy `ARENA_LOTS`, id novo `feira` (substitui o rótulo "Guilda" da Arena) | §12; D-G4 |
| `guild.lote.feira.aria` | Entrar na Feira | Enter the Fair | idem | §12 |
| `guild.npc.hall` | Algumas criaturas cuidam de um bosque juntas. Ele só cresce. | Some creatures keep a grove together. It only grows. | areaNpcVoice `hall:guilda` (Marla, a intendente / Marla, the steward). Substitui "grupo pequeno" | L3, L4; LV-G3 |
| `guild.npc.feira` | Toda semana algo chega da névoa. A roda chega até ele. | Every week something comes in from the mist. The circle reaches it. | areaNpcVoice `arena:guilda` (chave vira `arena:feira` com o lote). Substitui "grupo pequeno" | L3; D-G4 (sem adversário com gente) |

## 2. Salão sem guilda, criar, código, entrar

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.salao.carregando` | Procurando sua roda… | Looking for your circle… | GuildSheet, estado de carga | §13 constata |
| `guild.salao.vazio.titulo` | Guilda | Guild | GuildSheet, cabeçalho da folha (todos os estados) | §12 |
| `guild.salao.vazio.corpo` | Ainda sem roda. Abra uma clareira ou entre com um código. | No circle yet. Open a clearing, or join with a code. | GuildSheet, sem guilda (sem slot marcado, sem "+") | L11, S (sem convite insistente) |
| `guild.criar.botao` | Criar uma roda | Create a circle | GuildSheet, botão `primary` | §12 |
| `guild.criar.nome.label` | Nome da roda | Circle name | GuildSheet, campo (24 chars) | §12 |
| `guild.criar.nome.placeholder` | Um nome para a roda | A name for the circle | GuildSheet, campo | §12 |
| `guild.criar.codigo.corpo` | Compartilhe este código com até {n} pessoas. | Share this code with up to {n} people. | GuildSheet, após criar; n = `GUILD_MAX_MEMBERS − 1`, nunca literal | L4; constante única (taskModel-style) |
| `guild.criar.compartilhar` | Compartilhar código | Share code | GuildSheet, botão `share` (Web Share) | §12 |
| `guild.codigo.copiar` | Copiar código | Copy code | GuildSheet e Ajustes, fallback `content_copy` | §13 constata |
| `guild.codigo.copiado` | Copiado | Copied | idem, estado do botão por ~2 s | §13 constata |
| `guild.codigo.label` | Código da roda | Circle code | Ajustes e tela pós-criação | §12 |
| `guild.entrar.botao.abrir` | Entrar com um código | Join with a code | GuildSheet, botão `outline` (caminho alternativo) | §12 |
| `guild.entrar.codigo.label` | Código | Code | GuildSheet, campo (8 chars) | §12 |
| `guild.entrar.botao` | Chegar à roda | Join the circle | GuildSheet, confirmar entrada | §12 "chegar à roda" |
| `guild.entrar.convite.corpo` | Um código te chama para uma roda. Entrar é um toque, e sair também. | A code is inviting you to a circle. Joining is one tap, and so is leaving. | GuildSheet, link de convite com código preenchido (03-lore §4 item 1, "leve" trocado por fato verificável) | L4, L9; LV-G5 |
| `guild.entrar.convite.pet` | Tem outras bordas lá. Quer ver? | There are other edges out there. Want to look? | fala do pet ao abrir o link de convite (`speak()`) | L11, L2 |
| `guild.entrar.boasvindas.pet` | Chão novo. Cheira a videira. | New ground. Smells like vine. | fala do pet ao chegar à roda | L11 (reage ao agora) |
| `guild.erro.nome` | O nome não pode ter contato nem link. | Names can't carry contacts or links. | 400 `invalid name`; alerta âmbar `gold-ink`, nunca `danger` | §13; footgun 10 |
| `guild.erro.codigo` | Esse código não abriu nenhuma clareira. | That code didn't open any clearing. | 404 no join; âmbar | L9 (não acusa a pessoa) |
| `guild.erro.cheia` | Esta roda está cheia. | This circle is full. | 409 `guild full`; âmbar | L3 |
| `guild.erro.jaEmOutra` | Esta conta já tem uma roda. | This account already has a circle. | 409 `already in a guild`; âmbar + botão `guild.sair.botao` ali | L1 (sujeito é a conta, não a pessoa) |
| `guild.erro.colisao` | Tente de novo. | Try once more. | 409 `join collision` | §13 |
| `guild.erro.semRede` | Sem conexão. Nada mudou. | No connection. Nothing changed. | sem rede / 503; âmbar | L4; 08-critica C1 (não promete "nada se perdeu") |
| `guild.erro.semLogin` | Entre na sua conta para chegar a uma roda. | Sign in to reach a circle. | 401 sem login | §13 |
| `guild.erro.demo` | Crie uma conta para ter uma roda. | Create an account to have a circle. | demo: convite para criar conta (`UnlockNudge`, nunca abre sozinho) | PLANO-GUILDA §5 |
| `guild.erro.muitosToques` | Muitos toques seguidos. Tente daqui a pouco. | Too many taps in a row. Try again shortly. | 429 rate limit `GUILD_LIGHT` | §13 constata, sem culpa |
| `guild.erro.generico` | Não deu certo agora. Tente de novo. | That didn't work. Try again. | qualquer outro erro (mesmo texto do CoopPanel) | §13 |

## 3. Bosque (seção do topo)

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.bosque.titulo` | Bosque | Grove | GuildSheet, título da seção | §12 |
| `guild.bosque.regra` | Um fio firma quando alguém da roda alcança a própria meta do dia. O bosque só cresce. | A strand settles when someone in the circle reaches their own goal for the day. The grove only grows. | GuildSheet, linha sóbria abaixo do visor (camada sóbria L10; 08-critica B3, ato no lugar da virtude) | L10, L12; LV-G3 |
| `guild.bosque.estagio.clareira.nome` | Clareira | Clearing | visor + chip de estágio | §12 |
| `guild.bosque.estagio.clareira.linha` | Chão aberto. Os primeiros fios firmaram. | Open ground. The first strands have settled. | linha do estágio | L12 |
| `guild.bosque.estagio.ramagem.nome` | Ramagem | Boughs | idem (EN não é "Tangle", 08-critica C3) | §12 |
| `guild.bosque.estagio.ramagem.linha` | A videira achou onde se apoiar. | The vine found something to hold. | idem | L12 |
| `guild.bosque.estagio.copa.nome` | Copa | Canopy | idem | §12 |
| `guild.bosque.estagio.copa.linha` | A videira fechou por cima. | The vine closed overhead. | idem | L12 |
| `guild.bosque.estagio.mata.nome` | Mata | Thicket | idem | §12 |
| `guild.bosque.estagio.mata.linha` | Camadas sobre camadas. | Layer over layer. | idem | L12 |
| `guild.bosque.estagio.bosqueAntigo.nome` | Bosque antigo | Old grove | idem | §12 |
| `guild.bosque.estagio.bosqueAntigo.linha` | O cobre tomou o chão. A luz chega filtrada. | Copper took the ground. Light comes through filtered. | idem | L12 |
| `guild.bosque.perto` | Perto de {estagio}. | Near {estagio}. | faixa de progresso, SEM número, só quando o próximo estágio está perto; no Bosque antigo e longe do próximo: SILÊNCIO | L4 e §17-6 (nada de "faltam N") |
| `guild.bosque.fio.hoje` | O seu fio firmou hoje. | Your strand settled today. | só para a própria pessoa, sob o visor | L12 (nomeia o ato) |
| `guild.bosque.fio.ainda` | (sem texto — SILÊNCIO) | (no text — SILENCE) | estado "meta ainda não cumprida": nada é desenhado, nem placeholder, nem ícone vazio | L6, §13 silêncio; 08-critica O2 |
| `guild.bosque.fio.botao` | Firmar meu fio | Settle my strand | botão de gesto (substitui "Avisar que apareci hoje"); só aparece com a meta cumprida e o fio ainda não afirmado | L12 |
| `guild.bosque.fio.toast` | Um fio firmou no bosque. | A strand settled in the grove. | toast ao afirmar o fio (toast constata, sem "parabéns") | L12; 03-lore §4 item 3 |
| `guild.bosque.fio.pet` | Olha, ficou de pé. | Look, it's standing. | fala do pet logo após o fio | L11 |
| `guild.bosque.agregado.um` | Hoje, 1 fio firmou. | Today, 1 strand settled. | painel (não sobre o pixel art). Só com `size ≥ 5` e N ≥ 1 | LV-G1, LV-G2; PLANO §4 |
| `guild.bosque.agregado.outros` | Hoje, {n} fios firmaram. | Today, {n} strands settled. | idem. Com N = 0 a linha NÃO É DESENHADA | LV-G1, LV-G2 |
| `guild.bosque.agregado.zero` | (sem texto — SILÊNCIO) | (no text — SILENCE) | N = 0: nada | LV-G2; parecer do guarda 29/09 |
| `guild.bosque.estagioAtual` | {estagio} | {estagio} | chip do estágio sobre o painel; apenas o nome | §12 |

## 4. Roda (seção do meio) e gestos

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.roda.titulo` | Roda | Circle | GuildSheet, título da seção | §12 |
| `guild.roda.contagem` | {n} na roda | {n} in the circle | subtítulo; só a quantidade de membros, nunca de presentes | LV-G2 |
| `guild.roda.presente` | no bosque hoje | in the grove today | ≤4 membros: ao lado do nome de quem veio. Quem não veio: SILÊNCIO (nenhuma marca, nenhum lugar vazio) | LV-G2; L6 |
| `guild.roda.ausente` | (sem texto — SILÊNCIO) | (no text — SILENCE) | ≤4: quem não veio hoje; 5–12: ninguém tem estado de presença | LV-G2 |
| `guild.roda.grande.nota` | (sem texto — só nomes em ordem de chegada) | (no text — names in order of arrival only) | 5–12: lista sem estado, sem ordenação por atividade | LV-G1, LV-G2 |
| `guild.gesto.titulo` | Gestos | Gestures | cabeçalho da linha de 3 botões | §12 |
| `guild.gesto.aceno.nome` | Aceno | Wave | botão + chave `wave` | L12 |
| `guild.gesto.luz.nome` | Luz | Light | botão + chave `light` | L12 |
| `guild.gesto.descanso.nome` | Descanso | Rest | botão + chave `rest` | L12 |
| `guild.gesto.aceno.enviado` | Aceno enviado. | Wave sent. | estado do botão (1 de cada por dia; desabilitado, sem "amanhã pode") | L4 |
| `guild.gesto.luz.enviado` | Luz enviada. | Light sent. | idem | L4 |
| `guild.gesto.descanso.enviado` | Descanso enviado. | Rest sent. | idem | L4 |
| `guild.gesto.aceno.recebido` | Alguém acenou para a roda. | Someone waved at the circle. | lote ao abrir; sem autor, sem contagem, sem push | LV-G1, LV-G4 |
| `guild.gesto.luz.recebido` | Alguém deixou uma luz. | Someone left a little light. | idem | idem |
| `guild.gesto.descanso.recebido` | Alguém desejou bom descanso. | Someone wished everyone a good rest. | idem | L9 é respeitada: deseja, não diagnostica |
| `guild.gesto.nenhum` | (sem texto — SILÊNCIO) | (no text — SILENCE) | nenhum gesto recebido: a seção de recebidos não é desenhada | L6 |

## 5. Cerimônia e aviso de marco

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.marco.ramagem.mundo` | O bosque ganhou ramagem. | The grove grew boughs. | cerimônia `groveMilestone` (interstitial, z-300, espera o gesto) | L12; PLANO §4 |
| `guild.marco.ramagem.pet` | Olha, achou onde se apoiar. | Look, it found something to hold. | fala do pet na cerimônia | L11 |
| `guild.marco.copa.mundo` | O bosque fechou copa. | The grove has closed its canopy. | idem | L12 |
| `guild.marco.copa.pet` | Tá mais alto que eu agora. | It's taller than me now. | idem | L11 |
| `guild.marco.mata.mundo` | O bosque virou mata. | The grove has become a thicket. | idem | L12 |
| `guild.marco.mata.pet` | Tem sombra aqui dentro. | There's shade in here. | idem | L11 |
| `guild.marco.bosqueAntigo.mundo` | O bosque é antigo agora. | The grove is old now. | idem | L12 |
| `guild.marco.bosqueAntigo.pet` | Tem cheiro de cobre. | It smells of copper. | idem | L11 |
| `guild.marco.data` | {data} | {data} | data do marco na cerimônia e no Mural (a DATA é a saída relacional, como `MilestoneCeremony`) | regra dos Marcos |
| `guild.marco.botao` | Continuar | Continue | botão da cerimônia (movimento reduzido reduz o movimento, nunca a pausa) | CLAUDE.md, marcos |
| `guild.marco.aviso` | Novo estágio do bosque: {estagio}. | New stage for the grove: {estagio}. | slot de avisos da Home, último da ordem, só no dia do marco | L4 (sem "não perca") |
| `guild.marco.cenario` | Cenário do bosque: {estagio}. Está entre os seus cenários. | Grove scenery: {estagio}. It is among your scenery. | depois da cerimônia, quando `bg-guild-*` é concedido (fica com quem chega a seguir o próprio caminho) | L10 (fato sóbrio); LV-G6 |

## 6. Feira

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.feira.titulo` | Feira | Fair | GuildSheet, sala da Feira (abre direto no fenômeno) | §12 |
| `guild.feira.aberta.mundo` | A maré abriu a Feira. Algo chegou da névoa. | The tide opened the Fair. Something came in from the mist. | cabeçalho da Feira e cerimônia de abertura | D-G4; L12 |
| `guild.feira.aberta.pet` | Tá tudo embaçado ali. Vamos? | It's all fuzzy over there. Shall we go? | fala do pet ao abrir a Feira | L11 |
| `guild.feira.fenomeno.nevoa.nome` | Névoa | Mist | rotação semanal, `fx-fair-nevoa` | 08-critica B2 (tempo da Malha) |
| `guild.feira.fenomeno.nevoa.linha` | Uma camada que não assentou. | A layer that hasn't settled. | idem | B2 |
| `guild.feira.fenomeno.mare.nome` | Maré alta | High tide | `fx-fair-mare` | B2 |
| `guild.feira.fenomeno.mare.linha` | A maré subiu além do lugar dela. | The tide rose past its place. | idem | B2 |
| `guild.feira.fenomeno.estatica.nome` | Estática | Static | `fx-fair-estatica` | B2 |
| `guild.feira.fenomeno.estatica.linha` | A Malha chiou fora de fase. | The Mesh hissed out of phase. | idem | B2 |
| `guild.feira.fenomeno.enxame.nome` | Enxame | Swarm | `fx-fair-enxame` | B2 |
| `guild.feira.fenomeno.enxame.linha` | Camadas soltas, todas juntas. | Loose layers, all together. | idem | B2 |
| `guild.feira.sobria` | Uma rodada por dia. Semana dissipada: {cheio} Emblemas; senão, {piso}. | One round a day. Cleared week: {cheio} Emblems; otherwise, {piso}. | linha sóbria ao lado de toda tela da Feira (constantes `RAID_EMBLEMS`/`RAID_EMBLEMS_FLOOR`, nunca literal) | L10; 08-critica C2 |
| `guild.feira.rodada.botao` | Fazer minha rodada | Take my round | botão único, por gesto | L12 |
| `guild.feira.rodada.feita` | A sua rodada chegou até ele. | Your round reached it. | depois da rodada; SEM número de dano, sem barra que mostre quanto foi o seu | LV-G1; PLANO §3 |
| `guild.feira.rodada.jaFeita` | (sem texto extra — o botão fica em `guild.feira.rodada.feita`) | (no extra text — button stays on `guild.feira.rodada.feita`) | resto do dia: nada de "volte amanhã" | L4 |
| `guild.feira.dissipado.mundo` | O fenômeno se desfez diante da roda. | The phenomenon came apart before the circle. | cabeçalho quando `cleared` | §10 tabela; LV-G1 (nunca "campeões") |
| `guild.feira.dissipado.pet` | Olha, o ar limpou. | Look, the air's clear. | fala do pet | L11 |
| `guild.feira.recuou.mundo` | O fenômeno voltou para a névoa. O bosque segue como estava. | The phenomenon went back into the mist. The grove stays as it was. | cabeçalho quando a semana vira sem `cleared` | L3; LV-G7 |
| `guild.feira.recuou.pet` | Ele foi embora sozinho. | It went away on its own. | fala do pet (não absolve nem culpa) | §17-3 |
| `guild.feira.colher.botao` | Colher | Collect | botão de resgate `coopClaim` | L12 |
| `guild.feira.colhido` | {n} Emblemas colhidos. | {n} Emblems collected. | depois do resgate (n = 4 ou 2; mesma moeda do Torneio) | L10 |
| `guild.feira.barra.aria` | Fenômeno diante da roda | Phenomenon before the circle | aria da barra coletiva (sem valor numérico exposto) | LV-G1 |

## 7. Mural

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.mural.titulo` | Mural | Wall | GuildSheet, título da seção | §12 |
| `guild.mural.vazio` | (sem texto — SILÊNCIO) | (no text — SILENCE) | Mural sem itens: seção vazia não desenha "nada ainda" | L6; §13 |
| `guild.mural.marco` | {estagio}, {data} | {estagio}, {data} | linha de marco | L12 |
| `guild.mural.mare` | Floração colhida, {data} | Bloom gathered, {data} | peça de maré; UM texto para os três tamanhos (nomes de tamanho pendentes, ver Recusas) | L12; 08-critica (nenhum chamado de pior) |
| `guild.mural.boasvindas` | Mais uma borda encostou na roda, {data}. | One more edge touched the circle, {data}. | boas-vindas anônimas (no Mural nunca há nome de quem chegou) | LV-G1; §6 tabela Entrar |

## 8. Ajustes

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.ajustes.aria` | Ajustes da roda | Circle settings | ícone `settings` no cabeçalho (aria-label) | §13 |
| `guild.ajustes.titulo` | Ajustes | Settings | folha de ajustes | §12 |
| `guild.ajustes.somenteAbriu` | Só quem abriu a clareira vê estes ajustes. | Only whoever opened the clearing sees these settings. | sobre renomear / código novo (anfitrião), sem palavra de gênero | §12 anfitrião/host |
| `guild.ajustes.renomear` | Renomear | Rename | anfitrião | §12 |
| `guild.ajustes.renomear.salvar` | Salvar | Save | anfitrião | §12 |
| `guild.ajustes.codigoNovo` | Gerar código novo | Generate a new code | anfitrião | §12 |
| `guild.ajustes.codigoNovo.nota` | O código antigo deixa de abrir. | The old code stops opening. | abaixo do botão, fato | L10 |
| `guild.sair.botao` | Seguir o próprio caminho | Go your own way | Ajustes e erro `already in a guild`. UM toque, SEM diálogo de confirmação | LV-G5; §12 |
| `guild.sair.nota` | O que firmou fica no bosque. | What settled stays in the grove. | linha sóbria sob o botão (fato do produto, sem "eles ficarão sozinhos") | L10; LV-G3 |

## 9. Retorno, viajante, guilda esvaziada

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.retorno.pet` | Oi. O bosque tá aqui. | Hi. The grove's here. | fala do pet ao abrir o Salão. É a saudação COMUM do Salão, sem gatilho por ausência: a mesma em 2 ou 40 dias (regra 8). "still" saiu do EN modelo porque afirma passagem de tempo | L6, L11; §17-5 |
| `guild.viajante` | (sem texto — SILÊNCIO) | (no text — SILENCE) | viajante não é rótulo, não aparece a ninguém nem a si | LV-G2; PLANO §3 Viajante |
| `guild.esvaziada.mundo` | Esta clareira voltou a ser Malha aberta. | This clearing is open Mesh again. | ao abrir o Salão quando a guilda sumiu (única vez, local) | §10 tabela; "ruínas" vetado |
| `guild.esvaziada.postal` | Último estágio visto: {estagio}. | Last stage seen: {estagio}. | postal local (nome do estágio apenas; sem data, sem "há N dias") | L6; regra 8 |

## 10. aria-labels

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.aria.salao` | Salão da Guilda | Guild Hall | título acessível da folha | §13 |
| `guild.aria.bosque` | Bosque da roda, estágio {estagio} | The circle’s grove, stage {estagio} | visor do Bosque | §13 |
| `guild.aria.progresso` | Progresso do bosque, sem número | Grove progress, no number | faixa de progresso | LV-G1 |
| `guild.aria.roda` | Roda | Circle | lista de membros | §12 |
| `guild.aria.gesto.enviar` | Enviar {gesto} para a roda | Send {gesto} to the circle | botão de gesto; {gesto} = nome PT/EN da linha 4 | L12 |
| `guild.aria.gesto.enviado` | {gesto} já enviado hoje | {gesto} already sent today | botão desabilitado | L4 |
| `guild.aria.codigo.copiar` | Copiar o código da roda | Copy the circle code | botão | §13 |
| `guild.aria.fio` | Firmar meu fio de hoje | Settle my strand for today | botão de fio | L12 |
| `guild.aria.feira` | Fenômeno da semana: {nome} | This week’s phenomenon: {nome} | visor da Feira | B2 |
| `guild.aria.rodada` | Fazer minha rodada de hoje | Take my round for today | botão | L12 |
| `guild.aria.mural` | Mural da roda | The circle’s wall | seção | §12 |
| `guild.aria.fechar` | Fechar | Close | fechar folha e cerimônia | §13 |

## 11. HelpModal (glossário) e GuideModal

| chave | PT-BR | EN | onde usa | lei |
|---|---|---|---|---|
| `guild.help.guilda.termo` | Guilda e roda | Guild and circle | HelpModal, glossário | §12 |
| `guild.help.guilda.def` | A Guilda é o lugar; a roda é quem está nela. Até {max} pessoas, uma roda por pessoa, entrada só por código. Sem chat e sem aviso no celular. | The Guild is the place; the circle is who is in it. Up to {max} people, one circle each, joining by code only. No chat and no phone notifications. | HelpModal; {max} = `GUILD_MAX_MEMBERS` | L10; LV-G4 |
| `guild.help.bosque.termo` | Bosque | Grove | HelpModal | §12 |
| `guild.help.bosque.def` | O bosque da roda tem cinco estágios: Clareira, Ramagem, Copa, Mata e Bosque antigo. Só cresce, nunca encolhe. | The circle’s grove has five stages: Clearing, Boughs, Canopy, Thicket and Old grove. It only grows and never shrinks. | HelpModal | LV-G3 |
| `guild.help.fio.termo` | Fio | Strand | HelpModal | §12 |
| `guild.help.fio.def` | Um fio firma quando alguém da roda alcança a própria meta do dia. É um por pessoa por dia, sem nome e sem peso. | A strand settles when someone in the circle reaches their own goal for the day. One per person per day, unnamed and unweighted. | HelpModal | L10; LV-G8 |
| `guild.help.feira.termo` | Feira | Fair | HelpModal | §12 |
| `guild.help.feira.def` | Toda semana chega um fenômeno da névoa. Cada pessoa faz uma rodada por dia. Semana dissipada rende {cheio} Emblemas; senão, {piso}. A Feira não mexe no bosque. | Every week a phenomenon comes in from the mist. Each person takes one round a day. A cleared week pays {cheio} Emblems; otherwise, {piso}. The Fair never touches the grove. | HelpModal; constantes `RAID_EMBLEMS(_FLOOR)` | L10; LV-G7 |
| `guild.help.mare.termo` | Maré | Tide | HelpModal (não usar "Season"; colide com `season-tide`) | §12; 08-critica O1 |
| `guild.help.mare.def` | Uma maré dura {semanas} semanas. Na virada, o que assentou fica no bosque. | A tide lasts {semanas} weeks. When it turns, what settled stays in the grove. | HelpModal; `GUILD_TIDE_WEEKS` | L10 |
| `guild.help.anfitriao.termo` | Anfitrião | Host | HelpModal | §12 |
| `guild.help.anfitriao.def` | Quem abriu a clareira pode renomear a roda e gerar um código novo. Não vê nada a mais sobre ninguém. | Whoever opened the clearing can rename the circle and generate a new code. They see nothing more about anyone. | HelpModal | LV-G1 |
| `guild.guide.titulo` | A Guilda | The Guild | GuideModal, seção nova | §12 |
| `guild.guide.corpo` | Uma roda cuida de um bosque junta. Ninguém vê quanto o outro fez. Seguir o próprio caminho é um toque e o que firmou fica. Nada aqui é vendido. | A circle keeps a grove together. Nobody sees how much anyone else did. Going your own way takes one tap and what settled stays. Nothing here is for sale. | GuideModal (números vêm de constantes, não de texto à mão) | L10; LV-G1, G2, G5, G6 |

**Total: 149 chaves.**


## Recusas (o que NÃO foi escrito, e por quê)

1. **"Seu grupo/Seus amigos estão esperando", "a roda precisa de você", "sentimos sua falta"**: chantagem social e emoção causada pelo histórico (L6, L11, LV-G4).
2. **"Você fez o bosque crescer", "você é o que mais contribui", "Ana trouxe N fios"**: pessoa como agente do mérito e contribuição por pessoa (L1, L12, LV-G1).
3. **"Fulano não veio hoje", "3 de 8 vieram", "faltam N fios para a Copa"**: lista de ausentes e contagem regressiva sobre coleção (LV-G2, §17-6). O progresso é faixa sem número.
4. **Confirmação ao seguir o próprio caminho** ("tem certeza?", "eles vão ficar sozinhos"): LV-G5. A nota `guild.sair.nota` só diz o fato ("o que firmou fica").
5. **"Vocês perderam / vocês são campeões / MVP / por culpa de quem"** e qualquer número de dano na Feira: a Feira só constata que o fenômeno se desfez ou voltou à névoa (L3, LV-G1, D-G4).
6. **"Outros bosques", "o outro lado", "a pilha de ninguém"** na Feira: o fenômeno é tempo da Malha, nunca adversário com gente nem pendência (08-critica B1/B2).
7. **"Não foi culpa sua" após a Feira recuar**: absolvição explícita também reprova (§17-3). O pet diz só "Ele foi embora sozinho."
8. **"Oi. O bosque ainda tá aqui" / "senti sua falta" / boas-vindas diferentes por ausência**: "ainda" afirma passagem de tempo; a saudação é a mesma em 2 ou 40 dias e sem gatilho.
9. **Nomes de tamanho da floração (broto/ramo/floração)**: "Broto" colide com `tournamentTiers` (Semente→Broto→…) e "Ramo" com Boughs. Escrevi um único texto ("Floração colhida"). Se os três tamanhos forem visíveis, pedir palavras ao `soulmon-loremaster`.
10. **"seed/sprout/sapling/tree" e "nível/level/upgrade" para estágios**: pertencem a `HABIT_MILESTONES` / vetados (§12).
11. **Texto do estado "fio ainda não firmado"** ("ainda não", "hoje falta"): o estado é SILÊNCIO (08-critica O2).
12. **Frase para "guilda esvaziada" com "morreu/ruínas/seu grupo acabou"**: o chão volta a ser Malha aberta; o postal é só o nome do estágio, sem data nem "há N dias" (regra 8).
13. **Texto de push da Guilda** (celebração inclusive) e de chat livre: v1 não tem (PLANO §10.9).
14. **Texto de Créditos/aceleração/slot pago**: nada da Guilda é vendido (LV-G6).
15. **Loot de decoração `RAID_TROPHY_EVERY`**: sem copy porque o item ainda não tem nome; precisa de termo do loremaster.
