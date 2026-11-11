# Passos pelo Health Connect: o que fazer para lançar

> 10/11/2026. Decisão: `REGISTRO-DE-DECISOES.md` §283. PR `feat/passos-health-connect`, **não mergeado**. Este é o roteiro de quem sobe o AAB beta11 (versionCode 31, junto com as molduras do widget). Não rode `build-release.ps1` a partir daqui.

## 1. O que mudou no app

- **Nativo (`android/`)**: plugin `SoulmonSteps` (`SoulmonStepsPlugin.kt`, `androidx.health.connect:connect-client:1.1.0`), permissão `android.permission.health.READ_STEPS` (a única de saúde), `<queries>` do provedor `com.google.android.apps.healthdata`, `HealthRationaleActivity` + alias `ViewPermissionUsageActivity` (o Health Connect exige os dois pontos de entrada para mostrar o diálogo de permissão e listar o app).
- **JS**: feature detect (`Capacitor.isPluginAvailable('SoulmonSteps')`, só em `src/utils/steps.ts`). APK antigo e PWA: o Health Connect "não existe" e nada quebra. Fonte preferida: Health Connect; reserva: contador do aparelho (`ACTIVITY_RECOGNITION`, já nos AABs anteriores).
- **Fluxo**: convite curto (`stepsInvite`, fila central) numa abertura depois do onboarding, uma vez. "Pode contar" grava a meta e abre direto o diálogo do Health Connect (aviso e permissão são UM fluxo). "Agora não" é definitivo e de graça. Em Configurações o cartão segue para quem ainda não respondeu e para trocar a meta.
- **Dado**: só o total de passos do dia, só leitura; sobe no save apenas `{ date, baseline, today }` (campos que já existiam: `steps`, `stepGoal`, `stepsConsent`). Nenhum campo novo de save, nenhuma mudança de contrato de servidor.

## 2. Antes de gerar o AAB

1. **`versionCode`/`versionName`**: NÃO foram tocados nesta branch (vão junto com as molduras do widget: 31 / beta11). A Play recusa versionCode repetido.
2. **`google-services.json` obrigatório no release** (fora do git): sem ele o AAB sai sem push e o login com Google falha.
3. **Compile**: o Kotlin novo não foi compilado localmente. O `android-build.yml` (push na `main`) é quem prova; se o build reclamar de `connect-client`, a API usada (`getSdkStatus`, `aggregate`, `createRequestPermissionResultContract`) é estável desde a 1.1.0. Teste em aparelho real com Health Connect antes de enviar.
4. Conferir o manifesto MESCLADO do release (Android Studio › Merged Manifest, ou `aapt2 dump`): tem de listar `READ_STEPS`, o `<queries>` e as duas entradas de racional. Não pode aparecer `READ_HEALTH_DATA_IN_BACKGROUND` nem nenhum `WRITE_*` de saúde.

## 3. Play Console: declaração de permissões do Health Connect

Caminho: Política do app › Conteúdo do app › **Permissões do Health Connect** (Declaração de uso). A Play só libera o AAB com `READ_STEPS` depois de aprovada.

| Campo | O que declarar |
|---|---|
| Permissão | **Passos (Steps) — leitura** (`READ_STEPS`). Nenhuma de escrita. |
| Funcionalidade | "Missão bônus opcional de contagem de passos: o app mostra os passos do dia contra uma meta que a pessoa escolhe (3.000 / 5.000 / 7.000 / 10.000)." |
| Por que precisa | Só o total do dia, para mostrar o progresso e, ao bater a meta, marcar a missão bônus. Sem o dado a missão não existe; o app inteiro funciona sem ela. |
| Quando é pedida | Só depois de uma pergunta própria do app ("Quer usar a contagem de passos?"), numa abertura depois do onboarding, ou em Configurações. Nunca no primeiro frame; recusa é definitiva. |
| Dado lido | Total agregado de passos do dia (`StepsRecord.COUNT_TOTAL`). Nunca a série, horários, rota ou localização. |
| O que sobe aos servidores | O total do dia dentro do save na nuvem (necessário para a conta). Não vai a terceiros, não é vendido, não é usado para publicidade, não vai a provedores de IA. |
| Segundo plano | Não usa (`READ_HEALTH_DATA_IN_BACKGROUND` não é pedida). |
| Política de privacidade (URL) | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html#steps` (EN) e `#passos` (PT). É a mesma URL que `HealthRationaleActivity` abre. Já está no ar desde o §253. |
| Vídeo / evidência | Gravação curta: convite, diálogo do Health Connect, missão com o progresso, e Configurações mostrando a recusa. |

Também: a declaração de **Apps de saúde** (feita em 19/10/2026) precisa da justificativa **atualizada** (hoje diz "sem Health Connect"): reenviar dizendo que a fonte preferida é o Health Connect, opt-in, só leitura de passos.

## 4. Ficha (Segurança dos dados)

Já refletido em `PLAY-DATA-SAFETY.md` §2.4b/§2.6: **Informações de exercícios físicos (passos)**: coletado **sim**, compartilhado **não**, opcional, finalidade "funcionalidades do app", criptografado em trânsito, exclusão pela conta. Reabrir o formulário e conferir a linha, porque a versão antiga dizia "não é Health Connect".

## 5. Política de privacidade e `PRIVACY_VERSION`

A política (`public/privacidade.html` §2 `#steps`/`#passos` e §6) já descreve o recurso e `PRIVACY_VERSION` já é `2026-11-09` (§253). Esta mudança **não** sobe a versão. Nuance de texto: a política diz que o app pergunta "logo depois que a criatura se apresenta"; na prática o convite entra na fila de convites e pode esperar para uma abertura sem nada do início de dia. Se o revisor da Play estranhar, ajustar a frase (isso SIM exigiria nova versão).

## 6. Teste antes de promover

- Aparelho com Health Connect (Android 14+ vem no sistema; 13 ou menos, app da Play): instalar, concluir o onboarding, aceitar o convite, ver o diálogo, caminhar, abrir: o número muda; fechar o app, caminhar, abrir: o total do dia vem inteiro.
- Negar no diálogo: o convite some, nenhuma cobrança, o app segue.
- Revogar em Configurações › Health Connect: o app volta a ler `status` e a missão volta a ser a de descanso.
- Aparelho sem Health Connect e com sensor: o convite aparece e pede só o reconhecimento de atividade, como antes.
- PWA e aparelho sem nenhum dos dois: nenhum convite nem cartão de passos.
- APK anterior (sem o plugin) por cima: nada quebra.
- Limite conhecido: a leitura é ao abrir e em primeiro plano (5 min); um dia em que o app nunca abriu não fecha a missão depois.
