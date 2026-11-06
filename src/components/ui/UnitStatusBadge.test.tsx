// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnitStatusBadge } from './UnitStatusBadge';
import { UNIT_STATUS_CARD_CLASS } from './unitStatusClass';
import { readFileSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

const indexCss = readFileSync(pathResolve(__dirname, '../../index.css'), 'utf8');

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('UnitStatusBadge', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (keterangan: string) => {
    act(() => root.render(<UnitStatusBadge keterangan={keterangan} />));
    return container.querySelector('.unit-status-badge');
  };

  it('OFF → badge kuning "OFF"', () => {
    const b = render('OFF');
    expect(b?.classList.contains('unit-status-badge-off')).toBe(true);
    expect(b?.textContent).toBe('OFF');
  });
  it('LIBUR → badge kuning "LIBUR"', () => {
    expect(render('Libur')?.textContent).toBe('LIBUR');
  });
  it('T.O EVDAL → badge merah "T.O"', () => {
    const b = render('T.O EVDAL');
    expect(b?.classList.contains('unit-status-badge-to')).toBe(true);
    expect(b?.textContent).toBe('T.O');
  });
  it('BA02 → badge oranye "KENDALA"', () => {
    const b = render('BA02 Lampu indikator');
    expect(b?.classList.contains('unit-status-badge-kendala')).toBe(true);
    expect(b?.textContent).toBe('KENDALA');
  });
  it('kosong → tidak ada badge', () => {
    expect(render('')).toBeNull();
  });
  it('peta kelas kartu', () => {
    expect(UNIT_STATUS_CARD_CLASS).toEqual({
      NORMAL: '',
      OFF_LIBUR: 'unit-status-off',
      KENDALA: 'unit-status-kendala',
      TO: 'unit-status-to',
    });
  });
  it('refact_212: kartu berstatus hanya mewarnai garis tepi kiri & kanan, latar tetap netral', () => {
    for (const cls of ['unit-status-off', 'unit-status-kendala', 'unit-status-to']) {
      const rule = indexCss.match(new RegExp(`\\.bus-card\\.${cls}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
      expect(rule, cls).toMatch(/border-left-color:/);
      expect(rule, cls).toMatch(/border-right-color:/);
      expect(rule, cls).not.toMatch(/background/);
    }
  });
});
