# Crítica narrativa da copy da Guilda (WPG-0), 29/09/2026

Alvo: `docs/NARRATIVA-COPY-GUILDA.md` (149 chaves, contadas). Régua `src/narrativa.contract.test.ts` varre só `src/**/*.ts(x)`, não este doc; a conferência de vocabulário foi manual contra a lista de vetos do cabeçalho: limpo (nenhum termo vetado em texto de jogador; os citados estão só em Recusas).

## BLOQUEANTE (1, corrigido)
- `guild.guide.corpo`: "ninguém é apontado por não ter vindo". Contradiz a mecânica (PLANO §4/§13: até 4 membros a Roda mostra `guild.roda.presente` nominal, então quem não tem marca é apontado por contraste, lente 4). Além disso, nomeia a ausência para quem lê (L6). Dano: quem em fase ruim lê o guia, vê o marcador "no bosque hoje" dos outros e conclui que o guia mentiu; a garantia falsa vira motivo para sair.
  Substituta aplicada. PT: "Ninguém vê quanto o outro fez. Seguir o próprio caminho é um toque e o que firmou fica." EN: "Nobody sees how much anyone else did. Going your own way takes one tap and what settled stays."

## CORRIGIR (2, corrigidos)
- `guild.help.anfitriao.def`: "Não vê nada que os outros não vejam" é falso (o anfitrião vê Ajustes que os outros não veem, contradiz `guild.ajustes.somenteAbriu`). PT: "Não vê nada a mais sobre ninguém." EN: "They see nothing more about anyone."
- `guild.erro.jaEmOutra`: "Você já está numa roda." pessoa como sujeito de verbo de ser (L1, letra). PT: "Esta conta já tem uma roda." EN: "This account already has a circle."

## OBSERVAÇÃO (não aplicadas; decisão do dono ou do guarda)
1. `guild.bosque.agregado.*` + `guild.roda.contagem`: com 5 a 12 membros, "Hoje, 3 fios firmaram" ao lado de "8 na roda" reconstrói "3 de 8 vieram", exatamente a Recusa 3. É decisão do PLANO §4 (agregado só com size ≥ 5); sinalizo ao `soulmon-guarda-linha-vermelha`. Alternativa sem número: "Hoje o bosque recebeu fios." (EN: "The grove took in strands today.").
2. `guild.roda.presente` (≤4): a marca em quem veio torna o resto uma lista de ausentes de fato, em tensão com a letra de LV-G2 ("nunca mostra quem não apareceu"). O PLANO decidiu (GUILD_NOMINAL_PRESENCE_MAX = 4); o guarda deve fechar a leitura.
3. `guild.bosque.perto` ("Perto de {estagio}."): é contagem regressiva por outro nome; passa por não ter número, mas o parecer do guarda deve confirmar. Em EN "Near Old grove" não ocorre (silêncio no último estágio).
4. `guild.feira.recuou.pet` ("Ele foi embora sozinho."): absolve por implicatura, o que a Recusa 7 diz evitar. Mantida porque é a string-modelo do PLANO §12.
5. Chave `guild.roda.ausente`: o identificador contém "ausente". Sugestão: `guild.roda.semMarca`, antes de o frontend importar.
6. `guild.entrar.convite.corpo` ("Um código te chama"): "chama" é leve, mas convite não deve soar como chamada; aceitável.

## O que está certo (não mexer)
- Silêncio como estado (fio.ainda, agregado.zero, mural.vazio, viajante, gesto.nenhum), com resposta ao ato (toast, fala do pet, "Um fio firmou"): evita a indiferença (lente 3) sem cobrar.
- Feira: todas as strings falam de fenômeno, nunca de outro bosque ou adversário, sem número de dano; `recuou` diz que o bosque segue.
- `guild.sair.*` sem confirmação e com fato sóbrio; camada sóbria da lente 6 presente em help/guide/sobria; nenhuma frase condicionada a tempo de ausência.

## Pendências
Itens 1 e 2 da observação (guarda de linha vermelha); nomes de tamanho da floração e `RAID_TROPHY_EVERY` (loremaster, já nas Recusas); parecer de PI de Bosque/Grove/roda/circle/Feira/Fair (`soulmon-ip-brand-guardian`), não emitido aqui.
