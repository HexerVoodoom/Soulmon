/**
 * AS SKILLS DOS 5 INICIAIS (15/10/2026, REGISTRO §75) — o par básica/especial de cada inicial, no MESMO formato
 * (`StageSkills`) que a ficha gera para quem tem Oráculo. Assim os nomes PT/EN, o selo do especial, a forma do golpe,
 * a família do efeito e o FX do elemento saem do caminho de sempre (`fighterIdentity`), sem tela nova.
 *
 * Como: uma ficha mínima (um elemento base + uma escola + um recurso) alimenta `buildAllStageSkills`. Com UM elemento só,
 * o especial herda o mesmo elemento (é o `elEspecial` de `elementosDoStage`), então básica e especial são do elemento do inicial.
 * Determinístico por `starter:<id>`. Não mexe em HP, dano nem evolução.
 *
 * ⚠️ A FORMA do golpe vem da tabela do ELEMENTO (`ELEMENT_STRIKE_FORM`) nos 5 iniciais (dono, 15/10/2026, REGISTRO §76):
 * `formaDoElemento` nas duas skills. Os NOMES são autorais (`STARTER_MOVES`), iguais nos 5 estágios (o inicial não evolui).
 * Puxa o motor da ficha: importar só por `import()` dinâmico.
 */
import { buildAllStageSkills } from './soulProfile/ficha/skills';
import type { StageSkills } from './soulProfile/ficha/skills';
import type { Ficha, FichaStage, EscolaSkillId, RecursoId } from './soulProfile/ficha/types';
import { FICHA_STAGE_ORDER } from './soulProfile/ficha/types';
import type { StarterId } from './sprites';
import { STARTER_ELEMENT } from './starterElements';
import { elementStrikeForm } from './combatFx';

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

/** Nomes autorais (PT/EN) do básico e do especial. Propostos para o dono rever (docs/ELEMENTOS-DOS-INICIAIS.md). */
export const STARTER_MOVES: Record<StarterId, { basica: { pt: string; en: string }; especial: { pt: string; en: string } }> = {
  industrial: { basica: { pt: 'Pancada de Caixote', en: 'Crate Thump' }, especial: { pt: 'Chuva de Caixotes', en: 'Crate Downpour' } },
  nascente: { basica: { pt: 'Assobio de Riacho', en: 'Brook Whistle' }, especial: { pt: 'Grasnado Estrondoso', en: 'Booming Quack' } },
  alento: { basica: { pt: 'Bater de Asas', en: 'Wing Flutter' }, especial: { pt: 'Redemoinho Alado', en: 'Winged Whirl' } },
  vida: { basica: { pt: 'Broto Vivo', en: 'Living Sprout' }, especial: { pt: 'Copa Viçosa', en: 'Lush Canopy' } },
  meteoro: { basica: { pt: 'Fagulha de Brasa', en: 'Ember Spark' }, especial: { pt: 'Investida Incandescente', en: 'Blazing Charge' } },
};

const cache = new Map<StarterId, Record<FichaStage, StageSkills>>();

/** As skills dos 5 estágios do inicial (a mesma ficha em todos: o inicial não evolui). */
export function starterSkillsFor(id: StarterId): Record<FichaStage, StageSkills> {
  const hit = cache.get(id);
  if (hit) return hit;
  const f = fichaDoInicial(id);
  const porEstagio = Object.fromEntries(FICHA_STAGE_ORDER.map(st => [st, f])) as Record<FichaStage, Ficha>;
  const out = buildAllStageSkills(porEstagio, `starter:${id}`);
  const m = STARTER_MOVES[id];
  for (const st of FICHA_STAGE_ORDER) {
    const par = out[st];
    out[st] = {
      ...par,
      basica: { ...par.basica, nome: m.basica, formaDoElemento: true, forma: elementStrikeForm(STARTER_ELEMENT[id], 'basica') },
      especial: { ...par.especial, nome: m.especial, formaDoElemento: true, forma: elementStrikeForm(STARTER_ELEMENT[id], 'especial') },
    };
  }
  cache.set(id, out);
  return out;
}
