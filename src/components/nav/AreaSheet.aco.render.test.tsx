// @vitest-environment jsdom
/**
 * Moldura de AÇO (decisão do dono, 18/11/2026): o "Files novo" (aço com runas) é a moldura SÓ do modal da Hexsmith. O ✕ entra no disco
 * esquerdo do topo (um só, dentro do diálogo), o nome do prédio na placa central, o cristal-chama no encaixe; os outros prédios e o modal
 * Files da pasta de itens seguem com a moldura deles.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { AreaSheet, MOLDURA_MODAL } from './AreaSheet';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

const ler = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

describe('AreaSheet moldura="aco"', () => {
  it('Hexsmith: variante aço, título na placa, cristal no topo e UM ✕ (no disco esquerdo) que fecha', () => {
    expect(MOLDURA_MODAL).toBe(true);
    const onClose = vi.fn();
    const { container } = render(<AreaSheet areaId="forja" lotId="hexsmith" language="en-US" title="Hexsmith" closeLabel="Close" open onClose={onClose} moldura="aco">c</AreaSheet>);
    const sheet = container.querySelector('[data-area-sheet]')!;
    expect(sheet.classList.contains('sm2-moldura-modal--aco')).toBe(true);
    expect(sheet.getAttribute('data-moldura-variante')).toBe('aco');
    expect(container.querySelector('[data-moldura-placa] h2')?.textContent).toBe('Hexsmith');
    expect(sheet.querySelector('.sm2-cristal-chama')).not.toBeNull();
    const fechar = container.querySelectorAll('[data-area-sheet-close]');
    expect(fechar).toHaveLength(1);
    expect(fechar[0].classList.contains('sm2-moldura-aco__fechar')).toBe(true);
    expect(sheet.contains(fechar[0])).toBe(true);
    expect(fechar[0].getAttribute('aria-label')).toBe('Close');
    expect(container.querySelector('[data-back-circle]')).toBeNull();
    fireEvent.click(fechar[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sem a variante (outros prédios): moldura padrão, voltar sobre a cena, sem cristal', () => {
    const { container } = render(<AreaSheet areaId="forja" lotId="oficina" language="pt-BR" title="Oficina" closeLabel="Fechar" open onClose={() => {}}>c</AreaSheet>);
    const sheet = container.querySelector('[data-area-sheet]')!;
    expect(sheet.classList.contains('sm2-moldura-modal--aco')).toBe(false);
    expect(sheet.querySelector('.sm2-cristal-chama')).toBeNull();
    expect(container.querySelector('.sm2-moldura-aco__fechar')).toBeNull();
    expect(container.querySelector('[data-back-circle][data-area-sheet-close]')).not.toBeNull();
  });
});

describe('contrato: a moldura de aço é SÓ da Hexsmith', () => {
  it('AreaView liga "aco" apenas no lote forja.hexsmith', () => {
    const src = ler('./AreaView.tsx');
    const usos = src.match(/moldura=\{[^}]*\}/g) ?? [];
    expect(usos).toEqual(["moldura={area === 'forja' && open?.id === 'hexsmith' ? 'aco' : undefined}"]);
  });
  it('o modal Files (pasta de itens) segue na moldura dele, sem a classe de aço', () => {
    const mochila = ler('../home/Mochila.tsx');
    expect(mochila).toContain('sm2-moldura-modal--files');
    expect(mochila).not.toContain('sm2-moldura-modal--aco');
  });
  it('as peças de aço moram em ui/hex-moldura/ (WebP) e existem; ui/files/ não ganhou cópia', () => {
    const css = ler('../../index.css');
    const pecas = [...css.matchAll(/url\('\.\/assets\/soulmon\/ui\/hex-moldura\/([^']+)'\)/g)].map(m => m[1]);
    expect(new Set(pecas)).toEqual(new Set(['aco-topo.webp', 'aco-base.webp', 'aco-lado-e.webp', 'aco-lado-d.webp']));
    for (const p of pecas) expect(existsSync(resolve(__dirname, '../../assets/soulmon/ui/hex-moldura', p)), p).toBe(true);
    expect(existsSync(resolve(__dirname, '../../assets/soulmon/ui/files/aco-topo.webp'))).toBe(false);
    // o ✕ e o "i" são SÓ o glifo sobre os discos da arte: nenhum botão redondo desenhado por cima (pedido do dono, 18/11/2026)
    expect(existsSync(resolve(__dirname, '../../assets/soulmon/ui/hex-moldura/aco-botao-redondo.webp'))).toBe(false);
    expect(css).not.toMatch(/botao-redondo/);
  });
});
