/**
 * ⚠️ AS CHAVES DEIXARAM DE SER `digiapp-*` EM 07/09/2026.
 *
 * O prefixo era herança do fork, e este arquivo (mais o `CLAUDE.md`) dizia que
 * ele era mantido **de propósito**, "porque renomear faria os usuários atuais
 * perderem o progresso local". O dono confirmou que **ninguém nunca usou o app
 * em produção** — não havia usuário atual.
 *
 * A migração abaixo (`migrateLegacyStorageKeys`) existe mesmo assim, porque o
 * dono pode ter o save DELE num aparelho: "ninguém em produção" não é "nenhum
 * save existe", e o custo de errar isso seria o progresso dele. Ela roda uma
 * vez, copia o que achar e não apaga nada.
 */
import { readLocal, writeLocal } from './safeStorage';

export const STORAGE_KEYS = {
  GAME_STATE: 'soulmon_state_v1',
  /** WP0.10 — dia do último dia ruim, para fechar `after_bad_day` NO APARELHO.
   *  Esta chave nunca é enviada: o que sai é uma FAIXA de distância, e é por
   *  isso que ela mora aqui em vez de virar um campo de telemetria. */
  LAST_BAD_DAY: 'soulmon-last-bad-day',
  AI_SETTINGS: 'soulmon-ai-settings',
  THEME: 'soulmon-theme',
  LANGUAGE: 'soulmon-language',
  ONBOARDING_COMPLETE: 'soulmon-onboarding-complete',
  USER_NAME: 'soulmon-user-name',
  EGG_TYPE: 'soulmon-egg-type',
  FIRST_TASK_POPUP_SHOWN: 'soulmon-first-task-popup-shown',
  NOTIFICATIONS_ENABLED: 'soulmon-notifications-enabled',
  /** O pedido de permissão da PRIMEIRA abertura já foi feito (uma vez só). */
  NOTIFICATION_FIRST_OPEN_ASKED: 'soulmon-notification-first-open-asked',
  PWA_INSTALL_DISMISSED: 'soulmon-pwa-install-dismissed',
  NOTIFICATION_PROMPT_DISMISSED: 'soulmon-notification-prompt-dismissed',
  /** WP1.5 — QUANDO o primeiro convite foi dispensado (epoch ms). A chave
   *  acima é booleana e continua sendo escrita; esta existe porque o segundo
   *  convite precisa das 24h. Ausente com a booleana ligada = dispensou antes
   *  desta versão, e aí a espera já passou (é a leitura segura). */
  NOTIFICATION_PROMPT_DISMISSED_AT: 'soulmon-notification-prompt-dismissed-at',
  /** WP1.5 — o SEGUNDO convite foi dispensado. Não existe terceiro. */
  NOTIFICATION_PRIMING_DISMISSED: 'soulmon-notification-priming-dismissed',
  SCHEDULED_NOTIFICATIONS: 'soulmon-scheduled-notifications',
  DAILY_NOTIFICATION_CHECK: 'soulmon-daily-notification-check',
  SAVE_ID: 'soulmon-save-id',
  /** Mensagem do portão depois de um 410 `account-deleted` (cloudSave.ts › reagirContaExcluida). Lida e apagada uma vez. */
  ACCOUNT_DELETED_NOTICE: 'soulmon-account-deleted-notice',
  USER_EMAIL: 'soulmon-user-email',
  /** Última vez que o app pediu o e-mail para proteger o progresso (epoch ms). */
  PROTECT_PROMPT_AT: 'soulmon-protect-prompt-at',
  IS_SLEEPING: 'soulmon-is-sleeping',
  /**
   * ⚠️ LEGADO — os tetos de cuidado NÃO moram mais aqui.
   *
   * Contador por APARELHO dava 12 comidas/hora e 2 corações/dia ao mesmo
   * jogador que usa PWA e APK. Hoje eles vivem no SAVE (`careCaps`, em
   * `utils/careCaps.ts`), e estas duas chaves existem apenas para a MIGRAÇÃO:
   * são lidas uma vez no load e apagadas em seguida. **Nada escreve nelas.**
   */
  FOOD_FEED_TIMES: 'soulmon-food-feed-times',
  RUB_HEAL_DAY: 'soulmon-rub-heal-day',
  DAILY_REPORT_SHOWN: 'soulmon-daily-report-shown',
  RUB_HINT_SHOWN: 'soulmon-rub-hint-shown',
  AUTO_SLEEP_ENABLED: 'soulmon-auto-sleep-enabled',
  AUTO_SLEEP_START: 'soulmon-auto-sleep-start',
  AUTO_SLEEP_END: 'soulmon-auto-sleep-end',
  DUNGEON_DIFFICULTY: 'soulmon-dungeon-difficulty',
  DUNGEON_BEST: 'soulmon-dungeon-best',
  DUNGEON_REACHED: 'soulmon-dungeon-reached',
  DUNGEON_HEART_DROPS: 'soulmon-dungeon-heart-drops',
  DINO_BEST: 'soulmon-dino-best',
  /** H17 (01/10/2026) — ids de jogador/criatura que a pessoa já abriu na
   *  Biblioteca do Hall (JSON `string[]`). Só decide o que a lista mostra sem
   *  busca; não é progresso, não pontua e não vai para a nuvem. */
  LIBRARY_SEEN: 'soulmon-library-seen',
  /** Dia (ISO do jogador) em que o bônus do Picross do dia já foi pago neste aparelho. */
  PICROSS_DAILY_PAID: 'soulmon-picross-daily-paid',
  SOUND_MUTED: 'soulmon-sound-muted',
  /** Volume por categoria (`utils/loudness.ts`), 0..1, JSON. Chave NOVA — a
   *  proibição #20 vale: `SOUND_MUTED` não é renomeada, só se ACRESCENTA. */
  SOUND_CATEGORY_VOLUMES: 'soulmon-sound-category-volumes',
  /** Estado da TRILHA, e ele é SEPARADO do mudo global — decisão S2
   *  (08/09/2026, `docs/REGISTRO-DE-DECISOES.md` §6.1). Motivo mecânico: o som
   *  do app NASCE LIGADO, porque `isMuted()` lê `readFlag`, que devolve `false`
   *  sem a chave. Isso é coerente para SFX (que só saem por gesto) e
   *  INCOMPATÍVEL com trilha, que é contínua — pendurar a trilha no `mute`
   *  global a faria nascer tocando, ou seja, autoplay, que a D11 veta.
   *  Aqui a polaridade é invertida de propósito: a chave guarda LIGADA, então
   *  `readFlag` sem a chave devolve `false` e a trilha nasce DESLIGADA. */
  SOUND_TRACK_ENABLED: 'soulmon-sound-track-enabled',
  /** A música-TEMA ("Stone Hall Decay"), decisão do dono de 07/10/2026 — revoga o
   *  "nasce desligada" (S2) SÓ para ela. Polaridade como a do mudo: a chave guarda
   *  DESLIGADA, então `readFlag` sem a chave devolve `false` e o tema nasce LIGADO.
   *  Ele continua só começando por gesto (D11): ligado ≠ tocando. */
  SOUND_THEME_OFF: 'soulmon-sound-theme-off',
  FCM_TOKEN: 'soulmon-fcm-token',
  LAST_CLOUD_SYNC: 'soulmon-last-cloud-sync',
  ORACLE_FORM: 'soulmon-oracle-form',
  /** WP1.7 — rascunho do ritual do Oráculo (`utils/oracleDraft.ts`): fechar o
   *  app no item 15 de 20 não perde as respostas. Apagado na geração, no
   *  `finish()` e no muro de idade. Nunca guarda e-mail, consentimento, idade
   *  do demo nem o resultado. */
  ORACLE_DRAFT: 'soulmon-oracle-draft',
  /** Rascunho do trecho ANTES da escolha gratis/completo — ver utils/gateDraft.ts. */
  GATE_DRAFT: 'soulmon-gate-draft',
  // Soulmon: perfil da alma gerado no onboarding (input + seed p/ regenerar)
  SOULMON_PROFILE: 'soulmon-profile',
  // ⚰️ APOSENTADA em 26/08/2026 — `soulmon-demo-tasks-created-today`
  //
  // Era o contador do cap DIÁRIO de criação no demo. O regime diário morreu: o
  // teto passou a ser TOTAL (6 ativas, `DEMO_ACTIVITY_TOTAL_CAP`), aparado na
  // leitura, e o contador não tem mais função nenhuma.
  //
  // A declaração sai, mas **o valor continua no `localStorage` de quem já usou
  // o app** — apagar a constante não apaga o dado do aparelho. Fica registrado
  // aqui para ninguém reaproveitar esse nome de chave para outra coisa e herdar
  // um número velho como se fosse novo. É órfão inofensivo: nada o lê.
  // Segundo onboarding: tutorial do jogo + criação obrigatória da 1ª tarefa
  TUTORIAL_COMPLETE: 'soulmon-tutorial-complete',
  /** O tour do corvo (`utils/welcomeTour.ts`): visto ou pulado, uma vez por aparelho. */
  WELCOME_TOUR_SHOWN: 'soulmon-welcome-tour-shown',
  // Login por link de e-mail: o Firebase exige reconfirmar o e-mail ao
  // completar o login, então ele fica guardado entre o envio e o retorno.
  PENDING_LOGIN_EMAIL: 'soulmon-pending-login-email',
  /** ISO de quando o pet foi dormir — a "outra ponta" da noite, lida ao acordar
   *  para `recordNight` gravar deitar E acordar (utils/restWindow.ts). */
  SLEEP_STARTED_AT: 'soulmon-sleep-started-at',
  /** dayKey da última manhã em que o sonho já foi mostrado. Um por manhã: o
   *  feedback de sono é SÓ de manhã e SÓ uma vez (ortossonia é ansiedade). */
  MORNING_DREAM_SHOWN: 'soulmon-morning-dream-shown',
  /** G8 (01/10/2026): o modal de sono automático + janela de descanso já
   *  apareceu (uma vez só, na 1ª abertura do 2º dia — `utils/restSetup.ts`). */
  REST_SETUP_SHOWN: 'soulmon-rest-setup-shown',
  /** Dia da primeira abertura neste aparelho — fallback do convite do sono em save sem `bornAt`. */
  REST_SETUP_FIRST_OPEN: 'soulmon-rest-setup-first-open',
  /** `marcaAvisoTermos(...)` da última atualização de Termos/Privacidade que a
   *  pessoa dispensou com "Ok" (utils/termsNotice.ts, decisão #24). Fica no
   *  aparelho, não no save: é um aviso lido, não um consentimento. */
  TERMS_NOTICE_SEEN: 'soulmon-terms-notice-seen',
  /** `marcaAvisoTermos(...)` da versão cuja PRIMEIRA exibição já aconteceu
   *  (QA rodada 2, design A3): na primeira vez o banner entra em posição 1
   *  da fila de avisos; depois volta a ser o último. Aparelho, não save. */
  TERMS_NOTICE_SHOWN: 'soulmon-terms-notice-shown',
  /** GUILDA (`PLANO-GUILDA.md` §10.7) — o que ESTE aparelho já viu do Bosque: o
   *  último estágio reconhecido, as datas em que cada marco apareceu e o marco
   *  ainda por celebrar. Estado de UI, nunca de jogo (nada disto vai ao save;
   *  o ponteiro autoritativo da guilda é do servidor). Dono: `utils/groveLocal.ts`. */
  GUILD_LAST_STAGE: 'soulmon-guild-last-stage',
  /** GUILDA, a TERCEIRA e última chave de conveniência (decisão do dono, B2): os RECIBOS
   *  (`claimed.receipt`, opacos) dos resgates da Feira que ESTE aparelho já creditou. O recibo é
   *  determinístico por (conta, semana) e o KV é eventualmente consistente entre regiões — duas
   *  respostas 200 são possíveis, e é esta lista que impede o segundo crédito de Emblemas.
   *  Só recibos (nada de nome, guilda ou quantia). Dono: `utils/guildClaimLocal.ts`. */
  GUILD_CLAIMED: 'soulmon-guild-claimed',
  /** OFICINA DO FOCO (04/10/2026) — o timer em curso (modo, fase, `endAt` em timestamp). Só do
   *  aparelho, nunca no save. Dono: `utils/focoTimer.ts`. */
  FOCO_TIMER: 'soulmon-foco-timer',
  /** OFICINA DO FOCO — os "foquei" dos últimos dias, por dia (contagem + minutos). Sem total
   *  público, sem sequência. Aparelho, não save. Dono: `utils/focoTimer.ts`. */
  FOCO_SESSIONS: 'soulmon-foco-sessions',
  /** Preferência da OFICINA DO FOCO: vibração curta ao fim. LIGADA por padrão (decisão do dono,
   *  04/10/2026): só `'false'` desliga. Interruptor em Configurações › Seus dados. */
  FOCO_VIBRATE: 'soulmon-foco-vibrate',
  /** CADERNO — chave LEGADA (04/10/2026, 1ª versão: só no aparelho). O Caderno agora mora em
   *  `GameState.caderno` (save na nuvem do titular); esta chave só é LIDA para migrar as
   *  anotações antigas para o save uma vez e é apagada em seguida. Dono: `utils/cadernoLocal.ts`. */
  CADERNO: 'soulmon-caderno',
  /** NPC que JÁ FALOU neste aparelho (rodada 7 · J2, 04/10/2026): a lista de `area:lote` cujo balão
   *  já digitou a fala uma vez — dali em diante a fala aparece inteira. Conveniência por aparelho,
   *  fora do save. Dono: `components/nav/NpcSpeech.tsx`. */
  NPC_FALA_VISTA: 'soulmon-npc-fala-vista',
} as const;

/**
 * Chaves da RECONCILIAÇÃO de `saveId` (`utils/cloudSave.ts`, B-R1).
 *
 * Moram numa tabela própria, e não dentro de `STORAGE_KEYS`, porque não são
 * preferência nem estado de jogo: são o rastro forense de UMA migração de
 * identidade. Nada as lê no caminho normal do app — elas existem para quando
 * alguém precisar desfazer à mão o que a reconciliação fez.
 *
 * ⚠️ **O VALOR de cada string é contrato com o aparelho do jogador.** Quem já
 * reconciliou tem estas duas chaves gravadas no `localStorage` dele.
 * `CONFLICT_BACKUP` guarda a cópia do progresso local descartado quando a nuvem
 * ganhou o conflito — renomeá-la não apaga o backup, torna-o inalcançável para
 * sempre, e sem erro nenhum para avisar. `storageKeys.reconcile.test.ts` trava
 * os dois valores como literais.
 */
export const RECONCILE_KEYS = {
  /** Id que o aparelho usava antes da re-derivação. Só diagnóstico. */
  PREVIOUS_SAVE_ID: 'soulmon-previous-save-id',
  /** Cópia do estado local descartado quando a nuvem ganhou o conflito. */
  CONFLICT_BACKUP: 'soulmon-reconcile-backup',
} as const;

/**
 * Copia o que sobrou das chaves `digiapp-*` para os nomes novos. UMA vez.
 *
 * Roda no boot, antes de qualquer leitura de estado. Três decisões, e as três
 * são sobre não destruir nada:
 *
 *  · **copia, não move.** O valor antigo fica no `localStorage`. Se esta
 *    migração tiver um defeito, o dado original continua lá para recuperar à
 *    mão — e localStorage sobrando não custa nada perto de um save perdido.
 *  · **nunca sobrescreve.** Se a chave nova já tem valor, ela ganha: a nova é
 *    a que o app vem escrevendo desde a atualização, e a antiga é passado.
 *  · **falha em silêncio.** `localStorage` lança em aba privada, com storage
 *    bloqueado e em alguns modos estritos. Uma migração que derruba o boot é
 *    infinitamente pior que uma migração que não acontece.
 *
 * ⚠️ Ela é temporária por natureza — existe só pelo save do dono, que é o
 * único que pode existir. Pode ser apagada assim que ele confirmar que abriu o
 * app depois desta versão.
 */
export function migrateLegacyStorageKeys(): void {
  const antiga = (nova: string) =>
    nova.startsWith('soulmon_state_') ? 'digiapp_state_v3' : nova.replace(/^soulmon-/, 'digiapp-');

  // Passa por `safeStorage` e não por `localStorage` cru: há guard exigindo
  // isso (`nenhum arquivo de src/ chama localStorage direto`), e ele está
  // certo — o wrapper já traz o try/catch e o aviso de storage degradado, que
  // é exatamente o que uma migração de boot não pode fazer errado.
  const alvos = [...Object.values(STORAGE_KEYS), ...Object.values(RECONCILE_KEYS)];
  for (const chave of alvos) {
    const origem = antiga(chave);
    if (origem === chave) continue;                  // já nasceu `soulmon-*`
    if (readLocal(chave) !== null) continue;         // a nova manda
    const valor = readLocal(origem);
    // `silent`: uma migração que não coube no storage não é notícia para o
    // usuário — ele não pediu nada e não há o que ele possa fazer.
    if (valor !== null) writeLocal(chave, valor, { silent: true });
  }
}
