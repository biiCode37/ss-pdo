// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnitStatusBadge } from './UnitStatusBadge';
import { UNIT_STATUS_CARD_CLASS } from './unitStatusClass';

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
});
