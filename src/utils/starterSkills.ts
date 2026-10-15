/**
 * AS SKILLS DOS 5 INICIAIS (15/10/2026, REGISTRO §74) — o par básica/especial de cada inicial, no MESMO formato
 * (`StageSkills`) que a ficha gera para quem tem Oráculo. Assim os nomes PT/EN, o selo do especial, a forma do golpe,
 * a família do efeito e o FX do elemento saem do caminho de sempre (`fighterIdentity`), sem tela nova.
 *
 * Como: uma ficha mínima (um elemento base + uma escola + um recurso) alimenta `buildAllStageSkills`. Com UM elemento só,
 * o especial herda o mesmo elemento (é o `elEspecial` de `elementosDoStage`), então básica e especial são do elemento do inicial.
 * Determinístico por `starter:<id>`. Não mexe em HP, dano nem evolução.
 *
 * ⚠️ A FORMA do golpe vem da ESCOLA (`SCHOOL_STRIKE_FORM`, regra do jogo: com ficha a escola decide, sem ficha o elemento —
 * `ELEMENT_STRIKE_FORM`). Escolhi a escola pelo corpo da criatura; onde ela não bate com a tabela do elemento, está no teste.
 * Puxa o motor da ficha: importar só por `import()` dinâmico.
 */
import { buildAllStageSkills } from './soulProfile/ficha/skills';
import type { StageSkills } from './soulProfile/ficha/skills';
import type { Ficha, FichaStage, EscolaSkillId, RecursoId } from './soulProfile/ficha/types';
import { FICHA_STAGE_ORDER } from './soulProfile/ficha/types';
import type { StarterId } from './sprites';
import { STARTER_ELEMENT } from './starterElements';

/** Escola e recurso de cada inicial (pelo corpo da criatura). */
export const STARTER_SCHOOL: Record<StarterId, { escola: EscolaSkillId; recurso: RecursoId }> = {
  industrial: { escola: 'combate_fisico', recurso: 'furia' }, // pilha de caixotes: investe e bate de perto
  nascente: { escola: 'conjuracao', recurso: 'mana' },        // pato que assobia: projétil sonoro
  alento: { escola: 'conjuracao', recurso: 'mana' },          // borboleta: rajada de ar
  vida: { escola: 'benca', recurso: 'fe' },                   // árvore: sopro/bênção de vida
  meteoro: { escola: 'conjuracao', recurso: 'mana' },         // brasa: fagulha
};

function fichaDoInicial(id: StarterId): Ficha {
  const { escola, recurso } = STARTER_SCHOOL[id];
  return {
    nome: id,
    elementos: { [STARTER_ELEMENT[id]]: 10 },
    escolas: { [escola]: 10 },
    recursos: { [recurso]: 10 },
    talentos: {}, profissoes: {},
    totals: { elementos: 10, escolas: 10, recursos: 10, talentos: 0, profissoes: 0 },
  };
}

const cache = new Map<StarterId, Record<FichaStage, StageSkills>>();

/** As skills dos 5 estágios do inicial (a mesma ficha em todos: o inicial não evolui). */
export function starterSkillsFor(id: StarterId): Record<FichaStage, StageSkills> {
  const hit = cache.get(id);
  if (hit) return hit;
  const f = fichaDoInicial(id);
  const porEstagio = Object.fromEntries(FICHA_STAGE_ORDER.map(st => [st, f])) as Record<FichaStage, Ficha>;
  const out = buildAllStageSkills(porEstagio, `starter:${id}`);
  cache.set(id, out);
  return out;
}
