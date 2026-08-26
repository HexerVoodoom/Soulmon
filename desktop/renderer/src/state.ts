// Estado local do overlay. Fica num namespace PRÓPRIO do desktop
// (`soulmon_desktop_v1`) de propósito: o que mora aqui é o que é DESTE
// APARELHO (idioma, a cama, o cache de leitura da nuvem), e misturá-lo com o
// save real é como uma mutação incompatível com as regras do jogo corromperia
// o progresso do celular sem chance de desfazer.
//
// ⚠️ Este cabeçalho dizia "enquanto a escrita de volta não existir (fase 2b)"
// e isso era FALSO desde `f6fb5f30`/`86341fcb`: a escrita de volta existe.
// `menu.ts` chama `pushCareAction` para carinho, comida, tarefa, banho e sono,
// e quem decide cada uma é `care.ts`, importando a regra do app. Um agente que
// lesse a frase velha concluiria que ainda precisa duplicar estado aqui —
// exatamente o footgun 9. Verificado em `menu.ts` (as seis chamadas de
// `pushCareAction`) antes de corrigir.
//
// Os campos vindos da nuvem (pet/hearts/energia/…) são um CACHE de leitura; os
// campos de ação local ficam claramente separados.
import { STORAGE_KEY } from './config';
import type { GenericLine } from './sprites';
import type { RubHealRecord } from '../../../src/utils/careRules';

/** Tarefa de hoje, vinda do save do app. O desktop NÃO cria tarefas. */
export interface RemoteTask {
  id: string;
  name: string;
  emoji: string;
}

export interface DesktopState {
  // --- espelho do save real (preenchido pela sincronização) ---
  /** Id da forma na árvore do jogador ('rookie' | 'champion-virus' | 'ultra' …). */
  stage: string;
  /** Nome de exibição da forma atual, vindo do oráculo. */
  stageName: string;
  /** Linha de sprite genérico (`eggType` do save). */
  genericLine: GenericLine;
  /** Personagem pronto da conta demo, se houver. */
  demoCharacterId?: string;
  hearts: number;
  maxHearts: number;
  energy: number;
  maxEnergy: number;
  /** Pastinha de comida do save (emoji → quantidade). */
  foodInventory: Record<string, number>;

  // --- só do desktop ---
  language: 'pt-BR' | 'en';
  /** Espelho das tarefas pendentes do save — a fonte é sempre o app. */
  tasks: RemoteTask[];
  sleeping: boolean;
  /**
   * ISO de quando o pet deitou — a metade que falta para `recordNight` gravar
   * a noite INTEIRA ao acordar.
   *
   * Fica no estado do overlay, e não no save, pelo mesmo motivo de `sleeping`:
   * a cama é deste aparelho. O que vai para o save é o FATO da noite
   * (`rest.nights`), quando ela fecha. `null` = não está dormindo, ou o overlay
   * foi atualizado no meio de uma noite — nesse caso acordar não registra nada,
   * que é o comportamento neutro do app (noite sem registro nunca é falha).
   */
  sleepStartedAt: string | null;
  /**
   * Timestamps (ms) das últimas comidas — janela deslizante de
   * `FOOD_LIMIT_PER_HOUR` por hora, igual ao mobile. Hoje o número é **6**:
   * `FOOD_LIMIT_PER_HOUR = MAX_STAGE_REQUIREMENT` (`careRules.ts:56`), o maior
   * requisito diário da escada (mega/ultra pedem 6). Este comentário dizia
   * "5/hora" — o literal antigo, aposentado justamente porque negava a 6ª
   * comida a quem fechava as 6 tarefas numa sessão só. Se a escada mudar, o
   * limite acompanha sozinho, e é por isso que a frase abaixo não repete
   * número nenhum.
   */
  feedTimes: number[];
  /**
   * Teto de carinho do dia — SÓ do modo sem conta.
   *
   * Com conta sincronizada este campo não é lido nem escrito: o registro que
   * vale mora em `careCaps.rubHeal` DO SAVE (`care.ts`), porque um teto que se
   * fura trocando de aparelho não é teto. Aqui ele sobrevive só para o overlay
   * ainda fazer alguma coisa antes de o jogador entrar na conta.
   *
   * É o `RubHealRecord` do app, e não a antiga string `YYYY-MM-DD`: mesmo tipo e
   * mesmo formato de data dos dois lados, para nunca precisar traduzir um no
   * outro. O campo velho (`rubHealDay`) simplesmente deixa de ser lido — no
   * primeiro dia depois da atualização o jogador sem conta pode ganhar um
   * carinho a mais, uma vez, e isso é mais barato que uma migração.
   */
  rubHeal?: RubHealRecord;
  /** E-mail usado pro cloud save (mesmo do app mobile/web) — null = nunca configurado. */
  syncEmail: string | null;
  /** ISO da última vez que puxamos o GameState real da nuvem. */
  lastSyncAt: string | null;
}

// O limite de comidas/hora NÃO é redefinido aqui: vem da mesma fonte que o app
// do celular usa (src/utils/careRules.ts). Uma constante própria voltaria a ser
// uma segunda cópia da regra — se alguém mudasse o limite lá, esta tela
// continuaria conferindo o número velho.
export { FOOD_LIMIT_PER_HOUR } from '../../../src/utils/careRules';

function defaults(): DesktopState {
  return {
    stage: 'rookie',
    stageName: 'Soulmon',
    genericLine: 'tapirmon',
    demoCharacterId: undefined,
    hearts: 3,
    maxHearts: 3,
    energy: 0,
    maxEnergy: 4,
    foodInventory: {},
    language: 'pt-BR',
    tasks: [],
    sleeping: false,
    sleepStartedAt: null,
    feedTimes: [],
    rubHeal: undefined,
    syncEmail: null,
    lastSyncAt: null,
  };
}

export function loadState(): DesktopState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<DesktopState>;
    // Campos novos entram com fallback (mesma convenção do cloud save do app).
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

export function saveState(state: DesktopState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem espaço/modo privado: segue só em memória.
  }
}

// `feedsLeft(state)` MORREU AQUI, e a ausência é a mensagem: enquanto ele
// existia, o overlay tinha duas portas para a mesma recusa — este pré-teste e o
// `hourly-limit` que a regra do app já devolve. `menu.ts` batia nas duas, e só a
// de dentro podava os timestamps vencidos. Quem precisa da janela chama
// `localFeed` (care.ts), que decide uma vez só. Se voltar a fazer falta para
// DESENHAR (um contador na tela, por exemplo), importe `feedsLeft` de
// `src/utils/careRules` direto — desenhar não é decidir.

/** Total de comidas no bolso — o que a UI mostra. */
export function foodCount(inventory: Record<string, number>): number {
  return Object.values(inventory).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

/** Primeira comida disponível, ou null. O desktop não escolhe sabor. */
export function firstFood(inventory: Record<string, number>): string | null {
  return Object.keys(inventory).find(k => (inventory[k] ?? 0) > 0) ?? null;
}

