import type { ClassElementId } from "./types";

/**
 * Vendorized from `class-system/src/registry/elementos.ts`'s `derivado(...)`
 * entries — the 136 base-pair combos (every 2-of-17 pair, `C(17,2)=136`).
 * class-system's own rule for a derived element's effective level is "the
 * LOWEST effective level among the recipe's components" (its own comment:
 * "o nível é o MENOR nível efetivo entre os componentes da receita"), which
 * is exactly the balance this module needs: a derived element only means
 * anything once BOTH components are actually present.
 */
export const BASE_ELEMENT_LABELS: Record<ClassElementId, string> = {
  fogo: "Fogo", agua: "Água", terra: "Terra", ar: "Ar", eletricidade: "Eletricidade",
  arcano: "Arcano", sombra: "Sombra", luz: "Luz", vileza: "Vileza", morte: "Morte",
  vida: "Vida", vigor: "Vigor", marcial: "Marcial", tempo: "Tempo", som: "Som",
  gravidade: "Gravidade", espaco: "Espaço",
};

export interface DerivedElementDef {
  id: string;
  nome: string;
  componentes: [ClassElementId, ClassElementId];
}

export const DERIVED_ELEMENT_PAIRS: DerivedElementDef[] = [
  { id: "vapor", nome: "Vapor", componentes: ["fogo", "agua"] },
  { id: "lava", nome: "Lava", componentes: ["fogo", "terra"] },
  { id: "incendio", nome: "Incêndio", componentes: ["fogo", "ar"] },
  { id: "plasma", nome: "Plasma", componentes: ["fogo", "eletricidade"] },
  { id: "fogo_feiticeiro", nome: "Fogo Feiticeiro", componentes: ["fogo", "arcano"] },
  { id: "fogo_negro", nome: "Fogo Negro", componentes: ["fogo", "sombra"] },
  { id: "chama_solar", nome: "Chama Solar", componentes: ["fogo", "luz"] },
  { id: "fogo_infernal", nome: "Fogo Infernal", componentes: ["fogo", "vileza"] },
  { id: "chama_azul", nome: "Chama Azul", componentes: ["fogo", "morte"] },
  { id: "fenix", nome: "Fênix", componentes: ["fogo", "vida"] },
  { id: "fervor", nome: "Fervor", componentes: ["fogo", "vigor"] },
  { id: "pantano", nome: "Pântano", componentes: ["agua", "terra"] },
  { id: "gelo", nome: "Gelo", componentes: ["agua", "ar"] },
  { id: "agua_viva", nome: "Água-Viva", componentes: ["agua", "eletricidade"] },
  { id: "mare", nome: "Maré", componentes: ["agua", "arcano"] },
  { id: "abismo", nome: "Abismo", componentes: ["agua", "sombra"] },
  { id: "prisma", nome: "Prisma", componentes: ["agua", "luz"] },
  { id: "acido", nome: "Ácido", componentes: ["agua", "vileza"] },
  { id: "veneno", nome: "Veneno", componentes: ["agua", "morte"] },
  { id: "nascente", nome: "Nascente", componentes: ["agua", "vida"] },
  { id: "correnteza", nome: "Correnteza", componentes: ["agua", "vigor"] },
  { id: "areia", nome: "Areia", componentes: ["terra", "ar"] },
  { id: "magnetismo", nome: "Magnetismo", componentes: ["terra", "eletricidade"] },
  { id: "cristal", nome: "Cristal", componentes: ["terra", "arcano"] },
  { id: "obsidiana", nome: "Obsidiana", componentes: ["terra", "sombra"] },
  { id: "ouro_vivo", nome: "Ouro Vivo", componentes: ["terra", "luz"] },
  { id: "solo_profano", nome: "Solo Profano", componentes: ["terra", "vileza"] },
  { id: "ossuario", nome: "Ossuário", componentes: ["terra", "morte"] },
  { id: "flora", nome: "Flora", componentes: ["terra", "vida"] },
  { id: "tita", nome: "Titã", componentes: ["terra", "vigor"] },
  { id: "tempestade", nome: "Tempestade", componentes: ["ar", "eletricidade"] },
  { id: "eter", nome: "Éter", componentes: ["ar", "arcano"] },
  { id: "murmurio", nome: "Murmúrio", componentes: ["ar", "sombra"] },
  { id: "aurora", nome: "Aurora", componentes: ["ar", "luz"] },
  { id: "enxofre", nome: "Enxofre", componentes: ["ar", "vileza"] },
  { id: "miasma", nome: "Miasma", componentes: ["ar", "morte"] },
  { id: "alento", nome: "Alento", componentes: ["ar", "vida"] },
  { id: "impeto", nome: "Ímpeto", componentes: ["ar", "vigor"] },
  { id: "fluxo", nome: "Fluxo", componentes: ["eletricidade", "arcano"] },
  { id: "trovao_negro", nome: "Trovão Negro", componentes: ["eletricidade", "sombra"] },
  { id: "fulgor", nome: "Fulgor", componentes: ["eletricidade", "luz"] },
  { id: "tormento", nome: "Tormento", componentes: ["eletricidade", "vileza"] },
  { id: "galvanismo", nome: "Galvanismo", componentes: ["eletricidade", "morte"] },
  { id: "sinapse", nome: "Sinapse", componentes: ["eletricidade", "vida"] },
  { id: "reflexo", nome: "Reflexo", componentes: ["eletricidade", "vigor"] },
  { id: "ocultismo", nome: "Ocultismo", componentes: ["arcano", "sombra"] },
  { id: "runa", nome: "Runa", componentes: ["arcano", "luz"] },
  { id: "pacto", nome: "Pacto", componentes: ["arcano", "vileza"] },
  { id: "alma", nome: "Alma", componentes: ["arcano", "morte"] },
  { id: "essencia", nome: "Essência", componentes: ["arcano", "vida"] },
  { id: "encantamento", nome: "Encantamento", componentes: ["arcano", "vigor"] },
  { id: "crepusculo", nome: "Crepúsculo", componentes: ["sombra", "luz"] },
  { id: "terror", nome: "Terror", componentes: ["sombra", "vileza"] },
  { id: "espectro", nome: "Espectro", componentes: ["sombra", "morte"] },
  { id: "parasita", nome: "Parasita", componentes: ["sombra", "vida"] },
  { id: "assassinio", nome: "Assassínio", componentes: ["sombra", "vigor"] },
  { id: "heresia", nome: "Heresia", componentes: ["luz", "vileza"] },
  { id: "julgamento", nome: "Julgamento", componentes: ["luz", "morte"] },
  { id: "santidade", nome: "Santidade", componentes: ["luz", "vida"] },
  { id: "bravura", nome: "Bravura", componentes: ["luz", "vigor"] },
  { id: "praga", nome: "Praga", componentes: ["vileza", "morte"] },
  { id: "mutacao", nome: "Mutação", componentes: ["vileza", "vida"] },
  { id: "carnificina", nome: "Carnificina", componentes: ["vileza", "vigor"] },
  { id: "equilibrio", nome: "Equilíbrio", componentes: ["morte", "vida"] },
  { id: "ceifa", nome: "Ceifa", componentes: ["morte", "vigor"] },
  { id: "vitalidade", nome: "Vitalidade", componentes: ["vida", "vigor"] },
  { id: "forja", nome: "Forja", componentes: ["marcial", "fogo"] },
  { id: "tempera", nome: "Têmpera", componentes: ["marcial", "agua"] },
  { id: "aco", nome: "Aço", componentes: ["marcial", "terra"] },
  { id: "esgrima", nome: "Esgrima", componentes: ["marcial", "ar"] },
  { id: "aco_voltaico", nome: "Aço Voltaico", componentes: ["marcial", "eletricidade"] },
  { id: "arsenal", nome: "Arsenal", componentes: ["marcial", "arcano"] },
  { id: "lamina_oculta", nome: "Lâmina Oculta", componentes: ["marcial", "sombra"] },
  { id: "lamina_radiante", nome: "Lâmina Radiante", componentes: ["marcial", "luz"] },
  { id: "serrilha", nome: "Serrilha", componentes: ["marcial", "vileza"] },
  { id: "fio_funebre", nome: "Fio Fúnebre", componentes: ["marcial", "morte"] },
  { id: "lamina_viva", nome: "Lâmina Viva", componentes: ["marcial", "vida"] },
  { id: "maestria", nome: "Maestria", componentes: ["marcial", "vigor"] },
  { id: "pira_eterna", nome: "Pira Eterna", componentes: ["tempo", "fogo"] },
  { id: "erosao", nome: "Erosão", componentes: ["tempo", "agua"] },
  { id: "fossil", nome: "Fossilização", componentes: ["tempo", "terra"] },
  { id: "aceleracao", nome: "Aceleração", componentes: ["tempo", "ar"] },
  { id: "instante", nome: "Instante", componentes: ["tempo", "eletricidade"] },
  { id: "cronomancia", nome: "Cronomancia", componentes: ["tempo", "arcano"] },
  { id: "entropia", nome: "Entropia", componentes: ["tempo", "sombra"] },
  { id: "eon", nome: "Éon", componentes: ["tempo", "luz"] },
  { id: "ruina", nome: "Ruína", componentes: ["tempo", "vileza"] },
  { id: "ocaso", nome: "Ocaso", componentes: ["tempo", "morte"] },
  { id: "florescer", nome: "Florescer", componentes: ["tempo", "vida"] },
  { id: "frenesi", nome: "Frenesi", componentes: ["tempo", "vigor"] },
  { id: "contratempo", nome: "Contratempo", componentes: ["tempo", "marcial"] },
  { id: "estrondo", nome: "Estrondo", componentes: ["som", "fogo"] },
  { id: "sonar", nome: "Sonar", componentes: ["som", "agua"] },
  { id: "terremoto", nome: "Terremoto", componentes: ["som", "terra"] },
  { id: "estampido", nome: "Estampido", componentes: ["som", "ar"] },
  { id: "trovao", nome: "Trovão", componentes: ["som", "eletricidade"] },
  { id: "cantico", nome: "Cântico", componentes: ["som", "arcano"] },
  { id: "sussurro", nome: "Sussurro", componentes: ["som", "sombra"] },
  { id: "harmonia", nome: "Harmonia", componentes: ["som", "luz"] },
  { id: "dissonancia", nome: "Dissonância", componentes: ["som", "vileza"] },
  { id: "requiem", nome: "Réquiem", componentes: ["som", "morte"] },
  { id: "melodia", nome: "Melodia Vital", componentes: ["som", "vida"] },
  { id: "brado", nome: "Brado", componentes: ["som", "vigor"] },
  { id: "cadencia", nome: "Cadência", componentes: ["som", "marcial"] },
  { id: "eco", nome: "Eco", componentes: ["som", "tempo"] },
  { id: "fornalha_estelar", nome: "Fornalha Estelar", componentes: ["gravidade", "fogo"] },
  { id: "voragem", nome: "Voragem", componentes: ["gravidade", "agua"] },
  { id: "colapso", nome: "Colapso", componentes: ["gravidade", "terra"] },
  { id: "vacuo", nome: "Vácuo", componentes: ["gravidade", "ar"] },
  { id: "magnetar", nome: "Magnetar", componentes: ["gravidade", "eletricidade"] },
  { id: "singularidade", nome: "Singularidade", componentes: ["gravidade", "arcano"] },
  { id: "buraco_negro", nome: "Buraco Negro", componentes: ["gravidade", "sombra"] },
  { id: "halo_gravitacional", nome: "Halo Gravitacional", componentes: ["gravidade", "luz"] },
  { id: "jugo", nome: "Jugo", componentes: ["gravidade", "vileza"] },
  { id: "implosao", nome: "Implosão", componentes: ["gravidade", "morte"] },
  { id: "ancora_vital", nome: "Âncora Vital", componentes: ["gravidade", "vida"] },
  { id: "peso_descomunal", nome: "Peso Descomunal", componentes: ["gravidade", "vigor"] },
  { id: "ariete", nome: "Aríete", componentes: ["gravidade", "marcial"] },
  { id: "dilatacao", nome: "Dilatação", componentes: ["gravidade", "tempo"] },
  { id: "onda_de_choque", nome: "Onda de Choque", componentes: ["gravidade", "som"] },
  { id: "meteoro", nome: "Meteoro", componentes: ["espaco", "fogo"] },
  { id: "cometa", nome: "Cometa", componentes: ["espaco", "agua"] },
  { id: "asteroide", nome: "Asteroide", componentes: ["espaco", "terra"] },
  { id: "estratosfera", nome: "Estratosfera", componentes: ["espaco", "ar"] },
  { id: "pulsar", nome: "Pulsar", componentes: ["espaco", "eletricidade"] },
  { id: "portal", nome: "Portal", componentes: ["espaco", "arcano"] },
  { id: "vazio", nome: "Vazio", componentes: ["espaco", "sombra"] },
  { id: "constelacao", nome: "Constelação", componentes: ["espaco", "luz"] },
  { id: "devorador", nome: "Devorador", componentes: ["espaco", "vileza"] },
  { id: "nebulosa", nome: "Nebulosa", componentes: ["espaco", "morte"] },
  { id: "semente_estelar", nome: "Semente Estelar", componentes: ["espaco", "vida"] },
  { id: "gigante_estelar", nome: "Gigante Estelar", componentes: ["espaco", "vigor"] },
  { id: "lamina_sideral", nome: "Lâmina Sideral", componentes: ["espaco", "marcial"] },
  { id: "continuum", nome: "Continuum", componentes: ["espaco", "tempo"] },
  { id: "silencio_cosmico", nome: "Silêncio Cósmico", componentes: ["espaco", "som"] },
  { id: "dobra", nome: "Dobra", componentes: ["espaco", "gravidade"] },
];

/**
 * How "balanced" a pair's two component scores need to be for the DERIVED
 * element to represent them, instead of the higher component standing
 * alone. If the stronger component is more than 70% higher than the
 * weaker one, the pair reads as "mostly just the stronger base element",
 * not really the blend (e.g. overwhelmingly Terra with a token Água is
 * "Terra", not "Pântano").
 */
const MAX_IMBALANCE_RATIO = 1.7;

/**
 * How close a second/third candidate's score needs to be to the TOP
 * candidate to be considered co-dominant instead of getting dropped —
 * "within 20% of the highest" (candidate score ≥ 80% of the top score).
 */
const CO_DOMINANCE_RATIO = 0.8;

/** At most this many co-dominant elements are surfaced, so a nearly-flat
 *  profile (many low, similar scores) doesn't list a dozen "dominant"
 *  elements. */
const MAX_DOMINANT = 3;

export interface DominantElementCandidate {
  id: string;
  nome: string;
  score: number;
  /** Present only for a derived (combo) candidate. */
  componentes?: [ClassElementId, ClassElementId];
}

function isBalanced(scoreA: number, scoreB: number): boolean {
  const hi = Math.max(scoreA, scoreB);
  const lo = Math.min(scoreA, scoreB);
  return lo > 0 ? hi <= lo * MAX_IMBALANCE_RATIO : hi === 0;
}

/**
 * Determines the class-system elemento(s) that best represent this
 * profile's `classElements` scores, considering derived (base-pair) combos
 * — not just the single highest base element.
 *
 * Algorithm (see conversation with the user for the original description):
 * 1. For every base element, find its best BALANCED partner (the other base
 *    it pairs into the highest-scoring derived combo with — recall
 *    class-system's own rule: a derived element's level is the LOWER of its
 *    two components, so "highest-scoring" means highest `min(A, B)`). A
 *    pair is only balanced if neither side is more than 70% above the
 *    other — a hugely lopsided pair (e.g. Terra far above Água) doesn't
 *    read as its blend, just as the stronger base alone.
 * 2. Two bases that are MUTUALLY each other's best balanced partner merge
 *    into a single derived candidate (e.g. Água+Terra → Pântano) — this is
 *    what "o derivado se sobrepõe às bases" means: once merged, Água and
 *    Terra stop being separate candidates, only Pântano represents them.
 *    Bases without a mutual match (including the "Terra 70%+ above Água"
 *    case, where no balanced pairing exists at all) stay standalone
 *    candidates at their own raw score.
 * 3. Sort every remaining candidate (merged derived + leftover bases) by
 *    score, descending.
 * 4. Take the top one, then keep including the next ones as co-dominant
 *    while each is within 20% of the top score (score ≥ 80% of the top).
 * 5. Cap at `MAX_DOMINANT` results.
 */
export function computeDominantClassElements(
  classElements: Record<ClassElementId, number>
): DominantElementCandidate[] {
  const ids = Object.keys(classElements) as ClassElementId[];

  const bestPartner = new Map<ClassElementId, { partner: ClassElementId; def: DerivedElementDef; pairScore: number }>();
  for (const pair of DERIVED_ELEMENT_PAIRS) {
    const [a, b] = pair.componentes;
    if (!isBalanced(classElements[a], classElements[b])) continue;
    const pairScore = Math.min(classElements[a], classElements[b]);
    for (const [self, other] of [[a, b], [b, a]] as [ClassElementId, ClassElementId][]) {
      const current = bestPartner.get(self);
      if (!current || pairScore > current.pairScore) {
        bestPartner.set(self, { partner: other, def: pair, pairScore });
      }
    }
  }

  const candidates: DominantElementCandidate[] = [];
  const consumed = new Set<ClassElementId>();
  for (const id of ids) {
    if (consumed.has(id)) continue;
    const best = bestPartner.get(id);
    const mutual = best && bestPartner.get(best.partner)?.partner === id;
    if (best && mutual) {
      candidates.push({ id: best.def.id, nome: best.def.nome, score: best.pairScore, componentes: best.def.componentes });
      consumed.add(id);
      consumed.add(best.partner);
    }
  }
  for (const id of ids) {
    if (consumed.has(id)) continue;
    candidates.push({ id, nome: BASE_ELEMENT_LABELS[id], score: classElements[id] });
  }

  candidates.sort((x, y) => y.score - x.score);
  const topScore = candidates[0]?.score ?? 0;

  const result: DominantElementCandidate[] = [];
  for (const candidate of candidates) {
    if (result.length >= MAX_DOMINANT) break;
    if (candidate.score < topScore * CO_DOMINANCE_RATIO) break;
    result.push(candidate);
  }
  return result;
}
