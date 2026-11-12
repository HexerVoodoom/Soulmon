import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ACTIVITY_CATALOG } from './activityCatalog';
import { CATALOG_RESOURCE } from './catalogResources';
import { CATALOG_RESOURCES } from '../types/activityCatalog';

/** A1: cada atividade com recurso mapeado declara o campo; atividade sem recurso não ganha campo; valor inválido falha. */
describe('catálogo × recursos do jogo (beta12 §J, A1)', () => {
  it('todo item mapeado declara `resource` igual ao mapa leve', () => {
    for (const [id, recurso] of Object.entries(CATALOG_RESOURCE)) {
      const item = ACTIVITY_CATALOG.find(i => i.id === id);
      expect(item, `item ${id} sumiu do catálogo`).toBeDefined();
      expect(item?.resource, `item ${id} sem o campo resource`).toBe(recurso);
    }
  });
  it('todo item com `resource` está no mapa e o valor é válido (nada de campo solto)', () => {
    for (const item of ACTIVITY_CATALOG) {
      if (item.resource === undefined) continue;
      expect(CATALOG_RESOURCES as readonly string[]).toContain(item.resource);
      expect(CATALOG_RESOURCE[item.id], `item ${item.id} declara resource mas não está em catalogResources.ts`).toBe(item.resource);
    }
  });
  it('sono e água ficam SEM link (Q6, Q7); os cinco do pedido têm', () => {
    for (const id of ['sono-horario-fixo', 'sono-telas-fora', 'sono-preparar-quarto', 'corpo-beber-agua']) {
      expect(ACTIVITY_CATALOG.find(i => i.id === id)?.resource).toBeUndefined();
    }
    expect(Object.keys(CATALOG_RESOURCE).sort()).toEqual(['corpo-caminhar', 'criatividade-escrita-livre', 'foco-bloco-25min', 'foco-uma-tarefa-por-vez', 'mente-gratidao']);
  });
  it('o módulo leve não importa o catálogo (fica fora do chunk de entrada)', () => {
    const src = readFileSync(new URL('./catalogResources.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/from '\.\/activityCatalog'/);
  });
});
