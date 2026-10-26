# Passos pelo Health Connect: o que fazer para lançar

> Rodada 5, lane C (26/10/2026). Decisão: `REGISTRO-DE-DECISOES.md` §176. Não rode `build-release.ps1` daqui; este é o roteiro de quem sobe o AAB.

## 1. O que mudou no app

- **Nativo (`android/`)**: plugin `SoulmonHealth` (Health Connect client `androidx.health.connect:connect-client`), permissão `android.permission.health.READ_STEPS`, `<queries>` do provedor `com.google.android.apps.healthdata`, `HealthRationaleActivity` + alias `ViewPermissionUsageActivity` (o Health Connect exige os dois pontos de entrada para listar o app).
- **JS**: feature detect (`Capacitor.isPluginAvailable('SoulmonHealth')` + `isAvailable()`). APK antigo e web: o Health Connect "não existe" e nada quebra. Fonte preferida: Health Connect; reserva: contador do aparelho (`ACTIVITY_RECOGNITION`, já no AAB 22).
- **Fluxo**: cartão curto logo depois da apresentação do Soulmon (uma vez, só na sessão do fim do onboarding; em Configurações o cartão segue para quem fechou o app antes). "Sim" abre direto o diálogo do Health Connect (aviso e permissão são UM fluxo). "Agora não" é definitivo e de graça.
- **Dado**: só o total de passos do dia, só leitura; sobe no save apenas `{ date, baseline, today }` (campos que já existiam: `steps`, `stepGoal`, `stepsConsent`). Nenhum campo novo de save, nenhuma mudança de contrato de servidor.

## 2. Antes de gerar o AAB

1. **`versionCode`**: já subi de 22 para **23** em `android/app/build.gradle` (a Play recusa repetido). Se outro AAB sair antes, suba de novo (maior que o último enviado).
2. **`google-services.json` obrigatório no release**: o build avisa em vez de falhar quando falta (o `try` do `build.gradle` só emite WARNING), então um AAB sem ele sai sem push (FCM). Confirme que `android/app/google-services.json` existe e tem client para `com.soulmon` ANTES de assinar.
3. Dependência: `connect-client:1.1.0-alpha10` compilou aqui. Se a Play ou o lint reclamar de alpha, troque por a 1.1.x estável mais recente do Google Maven e recompile (a API usada, `getSdkStatus`, `aggregate`, `createRequestPermissionResultContract`, é estável).
4. Conferir o manifesto mesclado do release: tem de listar `READ_STEPS`, o `<queries>` e as duas entradas de rationale. Não pode aparecer `READ_HEALTH_DATA_IN_BACKGROUND` nem nenhum `WRITE_*` de saúde.

## 3. Play Console: formulário de permissões de saúde (Health Connect)

Caminho: Política do app › Conteúdo do app › **Permissões do Health Connect** (Declaração de uso). A Play só libera o AAB com `READ_STEPS` depois de aprovada.

| Campo | O que declarar |
|---|---|
| Permissão | **Passos (Steps) — leitura** (`READ_STEPS`). Nenhuma de escrita. |
| Funcionalidade | "Missão bônus opcional de contagem de passos: o app mostra os passos do dia, ao vivo, contra uma meta que a pessoa escolhe (3.000 / 5.000 / 8.000 / 10.000)." |
| Por que precisa | Só o total do dia, para mostrar o progresso e, ao bater a meta, marcar a missão bônus. Sem o dado a missão não existe; o app inteiro funciona sem ela. |
| Quando é pedida | Só depois de uma pergunta própria do app ("Do you want to use step counting?"), logo após o onboarding, ou em Configurações. Nunca no primeiro frame; recusa é definitiva. |
| Dado lido | Total agregado de passos do dia (`StepsRecord.COUNT_TOTAL`). Nunca a série, horários, rota ou localização. |
| O que sobe aos servidores | O total do dia dentro do save na nuvem (necessário para a conta). Não vai a terceiros, não é vendido, não é usado para publicidade, não vai a provedores de IA. |
| Segundo plano | Não usa (`READ_HEALTH_DATA_IN_BACKGROUND` não é pedida). |
| Política de privacidade (URL) | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html#steps` (EN) e `#passos` (PT). É a mesma URL que `HealthRationaleActivity` abre. |
| Vídeo / evidência | Gravação curta: cartão do onboarding, diálogo do Health Connect, tela com "N of M steps today", e Configurações mostrando a recusa. |

Também: a declaração de **Apps de saúde** (já feita em 19/10/2026, "Atividade e condicionamento físicos") precisa ter a justificativa **atualizada** (hoje diz "sem Health Connect/Google Fit"): reenviar dizendo que a fonte preferida é o Health Connect, opt-in, só leitura de passos.

## 4. O que declarar na ficha (Segurança dos dados)

Já refletido em `PLAY-DATA-SAFETY.md` §2.6 (atualizado nesta rodada): **Informações de exercícios físicos (passos)**: coletado **sim**, compartilhado **não**, opcional, finalidade "funcionalidades do app", criptografado em trânsito, exclusão pela conta. Reabrir o formulário e conferir a linha, porque o texto antigo dizia "não é Health Connect".

## 5. Política de privacidade

`public/privacidade.html` §2 (linha dos passos, âncoras `#steps` e `#passos`) e §6 (Health Connect é parte do Android, não um terceiro nosso), EN e PT. `PRIVACY_VERSION` subiu para `2026-10-27` (mudança material): quem já consentiu vê o aviso informativo de versão, sem re-aceite. A política tem de estar **no ar** (deploy do Worker) antes de enviar o formulário; o revisor abre a URL.

## 6. Teste antes de promover

- Aparelho com Health Connect (Android 14+ já vem no sistema; 13 ou menos, app da Play): instalar, concluir o onboarding, aceitar, ver o diálogo, caminhar, abrir: o número muda; fechar o app, caminhar, abrir: o total do dia vem inteiro.
- Negar no diálogo: o cartão some, nenhuma cobrança, o app segue.
- Revogar em Configurações › Health Connect: o cartão de passos some sem culpa e a missão volta a ser a de descanso.
- Aparelho sem Health Connect e sem sensor, e a PWA: nenhum cartão de passos aparece.
- APK 22 (antigo) por cima do 23: nada quebra.
- Limite conhecido: a leitura é ao abrir e em primeiro plano; um dia em que o app nunca abriu não fecha a missão depois.
