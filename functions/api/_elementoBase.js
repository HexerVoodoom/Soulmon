/**
 * Vantagem elemental do DUELO no servidor (decisao do dono 27/10/2026, REGISTRO): espelho do anel `COUNTERS` de
 * `src/utils/arena.ts` e da `baseDominanteDoElemento` (sem pesos = 1o componente da receita) de `elementoNome.ts`.
 * As Pages Functions nao importam de `src/`; `elementoBase.parity.test.js` trava as duas copias nos ids do app.
 */
export const COUNTER_RING = [
  'fogo', 'planta', 'vida', 'terra', 'gravidade', 'ar', 'som', 'eletricidade', 'industrial', 'fada', 'agua',
  'marcial', 'arcano', 'tempo', 'espaco', 'luz', 'sombra', 'morte', 'vileza', 'vigor',
];

/** Par derivado -> 1o componente (a base dominante sem pesos). */
export const BASE_DO_PAR = {
  vapor: 'fogo', lava: 'fogo', incendio: 'fogo', plasma: 'fogo',
  fogo_feiticeiro: 'fogo', fogo_negro: 'fogo', chama_solar: 'fogo', fogo_infernal: 'fogo',
  chama_azul: 'fogo', fenix: 'fogo', fervor: 'fogo', pantano: 'agua',
  gelo: 'agua', agua_viva: 'agua', mare: 'agua', abismo: 'agua',
  prisma: 'agua', acido: 'agua', veneno: 'agua', nascente: 'agua',
  correnteza: 'agua', areia: 'terra', magnetismo: 'terra', cristal: 'terra',
  obsidiana: 'terra', ouro_vivo: 'terra', solo_profano: 'terra', ossuario: 'terra',
  flora: 'terra', tita: 'terra', tempestade: 'ar', eter: 'ar',
  murmurio: 'ar', aurora: 'ar', enxofre: 'ar', miasma: 'ar',
  alento: 'ar', impeto: 'ar', fluxo: 'eletricidade', trovao_negro: 'eletricidade',
  fulgor: 'eletricidade', tormento: 'eletricidade', galvanismo: 'eletricidade', sinapse: 'eletricidade',
  reflexo: 'eletricidade', ocultismo: 'arcano', runa: 'arcano', pacto: 'arcano',
  alma: 'arcano', essencia: 'arcano', encantamento: 'arcano', crepusculo: 'sombra',
  terror: 'sombra', espectro: 'sombra', parasita: 'sombra', assassinio: 'sombra',
  heresia: 'luz', julgamento: 'luz', santidade: 'luz', bravura: 'luz',
  praga: 'vileza', mutacao: 'vileza', carnificina: 'vileza', equilibrio: 'morte',
  ceifa: 'morte', vitalidade: 'vida', forja: 'marcial', tempera: 'marcial',
  aco: 'marcial', esgrima: 'marcial', aco_voltaico: 'marcial', arsenal: 'marcial',
  lamina_oculta: 'marcial', lamina_radiante: 'marcial', serrilha: 'marcial', fio_funebre: 'marcial',
  lamina_viva: 'marcial', maestria: 'marcial', pira_eterna: 'tempo', erosao: 'tempo',
  fossil: 'tempo', aceleracao: 'tempo', instante: 'tempo', cronomancia: 'tempo',
  entropia: 'tempo', eon: 'tempo', ruina: 'tempo', ocaso: 'tempo',
  florescer: 'tempo', frenesi: 'tempo', contratempo: 'tempo', estrondo: 'som',
  sonar: 'som', terremoto: 'som', estampido: 'som', trovao: 'som',
  cantico: 'som', sussurro: 'som', harmonia: 'som', dissonancia: 'som',
  requiem: 'som', melodia: 'som', brado: 'som', cadencia: 'som',
  eco: 'som', fornalha_estelar: 'gravidade', voragem: 'gravidade', colapso: 'gravidade',
  vacuo: 'gravidade', magnetar: 'gravidade', singularidade: 'gravidade', buraco_negro: 'gravidade',
  halo_gravitacional: 'gravidade', jugo: 'gravidade', implosao: 'gravidade', ancora_vital: 'gravidade',
  peso_descomunal: 'gravidade', ariete: 'gravidade', dilatacao: 'gravidade', onda_de_choque: 'gravidade',
  meteoro: 'espaco', cometa: 'espaco', asteroide: 'espaco', estratosfera: 'espaco',
  pulsar: 'espaco', portal: 'espaco', vazio: 'espaco', constelacao: 'espaco',
  devorador: 'espaco', nebulosa: 'espaco', semente_estelar: 'espaco', gigante_estelar: 'espaco',
  lamina_sideral: 'espaco', continuum: 'espaco', silencio_cosmico: 'espaco', dobra: 'espaco',
  fogo_fatuo: 'fada', orvalho: 'fada', circulo_feerico: 'fada', brisa_cintilante: 'fada',
  glitter: 'fada', feerie: 'fada', sonho_sombrio: 'fada', arco_iris: 'fada',
  encanto_traicoeiro: 'fada', banshee: 'fada', coracao: 'fada', graca: 'fada',
  lamina_purpurina: 'fada', sono_encantado: 'fada', cancao_feerica: 'fada', leveza: 'fada',
  poeira_estelar: 'fada', fornalha: 'industrial', hidraulica: 'industrial', mineracao: 'industrial',
  pneumatica: 'industrial', usina: 'industrial', artificio: 'industrial', fuligem: 'industrial',
  holofote: 'industrial', poluicao: 'industrial', ferro_velho: 'industrial', biomecanica: 'industrial',
  exoesqueleto: 'industrial', armaria: 'industrial', relojoaria: 'industrial', britadeira: 'industrial',
  prensa: 'industrial', estacao_orbital: 'industrial', brinquedo: 'industrial', queimada: 'planta',
  mangue: 'planta', raiz_profunda: 'planta', polen: 'planta', fotossintese: 'planta',
  druidismo: 'planta', fungo: 'planta', girassol: 'planta', espinheiro: 'planta',
  murcha: 'planta', seiva: 'planta', carvalho: 'planta', bambu: 'planta',
  estacoes: 'planta', farfalhar: 'planta', trepadeira: 'planta', arvore_mundo: 'planta',
  jardim_encantado: 'planta', estufa: 'planta',
};

/** Base dominante (sem pesos): base -> ela mesma; par -> 1o componente; desconhecido -> ele mesmo. */
export function baseDominante(id) {
  return Object.prototype.hasOwnProperty.call(BASE_DO_PAR, id) ? BASE_DO_PAR[id] : id;
}

function counters(attacker, defender) {
  const i = COUNTER_RING.indexOf(attacker);
  if (i < 0) return false;
  return COUNTER_RING[(i + 1) % COUNTER_RING.length] === defender || COUNTER_RING[(i + 2) % COUNTER_RING.length] === defender;
}

/** +1 vantagem, -1 desvantagem, 0 neutro (elemento ausente/desconhecido = 0). Espelho de `elementAdvantage` com um defensor so. */
export function vantagemElemental(atacante, defensor) {
  if (typeof atacante !== 'string' || typeof defensor !== 'string') return 0;
  const a = baseDominante(atacante), d = baseDominante(defensor);
  if (counters(a, d)) return 1;
  if (counters(d, a)) return -1;
  return 0;
}

/**
 * Aplica o selo nos dois combatentes do duelo: o golpe BASICO de cada lado contra o elemento do outro move
 * +-1 golpe exibido x `escala` (`elementHits`, mesma conta da Arena; a Guerra usa 0,5) no bonus de dano de quem bate. HP, ATK, DEF e SPD ficam como
 * estao e o teto `COMBAT_BONUS_CAP` nao e tocado (o selo e modificador de golpe, nao bonus de atributo). Sem elemento = neutro.
 */
export function aplicarElementosDuelo(me, opp, escala = 1) {
  const advMe = vantagemElemental(me.fx?.elBasica, opp.fx?.elBasica);
  const advOpp = vantagemElemental(opp.fx?.elBasica, me.fx?.elBasica);
  const com = (c, adv) => (adv === 0 ? c : { ...c, bonus: (1 + c.bonus) / (1 - (escala * adv) / 10) - 1 });
  return { meCombatant: com(me.combatant, advMe), oppCombatant: com(opp.combatant, advOpp) };
}
