# Widget V-Pet: Z de sono e fundo do jogador (10/11/2026)

## Z de sono
`petSleeping` (boolean, chave NOVA do bridge; `pet_sleeping` nas prefs) = o `isSleeping` REAL do app (toggle manual ou sono automático). O V-Pet já é UM bitmap 576x384 (`drawVpet`), então o Z é desenhado como texto no canvas, no canto superior direito da coluna do sprite (`WidgetVpet.sleepZ`): apagado (preto, alfa 70, como os ícones apagados) acordado; amarelo com brilho dormindo. Sem asset. APK velho ignora a chave. Binário puro: sem horas, sem contagem, sem texto (régua widgetSemCobranca). Limite: com o app fechado o widget só sabe o estado do último envio (a janela de sono automático pode virar sem o app abrir); aceitável, é um enfeite.

## Fundo do cenário equipado: VIÁVEL, implementado
| Opção | Custo | Veredito |
|---|---|---|
| A. Miniaturas empacotadas no APK, app manda só o id (`vpetBg`) | 55 cenários pintados (+2 aliases), fonte 58 MB; miniaturas WebP 360x194 q78 = **~810 KB (57 arquivos)** no total (~14 KB cada) | **Escolhida** |
| B. Bitmap enviado pelo app (arquivo/prefs) | exige render no JS + ponte de arquivo; sem ganho (os cenários são fixos) | descartada |
| C. Baixar do servidor (como o sprite próprio) | rede + allowlist + cache só para arte que já é conhecida | descartada |

Limites do RemoteViews: o V-Pet já manda UM bitmap de 576x384 ARGB (~0,9 MB, bem abaixo do teto de ~1/3 da tela por bitmap e do limite da transação do Binder); o fundo é desenhado DENTRO desse mesmo bitmap, então o peso enviado não muda. As miniaturas têm a proporção do LCD (1200x648 ~ 359x192), sem corte.

Fluxo: app envia `vpetBg` = id (`visibleBackground(equippedBackground)`); plugin valida `^bg-[a-z0-9-]{1,48}$` (`WidgetVpet.bgDrawableName`) e grava `vpet_bg`; renderer procura `vpet_bg_<id com _>` por `getIdentifier`; **drawable ausente = LCD liso** (como o casco). Entra atrás do bicho com véu escuro (alfa 120) para o texto continuar legível; o efeito do App reage a `equippedBackground`, então a troca atualiza o widget. Geração das miniaturas: `python scripts/gen-widget-backgrounds.py` (idempotente; rodar de novo ao entrar cenário novo; o guard falha se faltar miniatura).
Pendência de arte: nenhuma. Pendência de design: ver no aparelho se o véu de 120 agrada (parâmetro único no `drawVpet`). Nativo: só chega num AAB novo (beta11).
