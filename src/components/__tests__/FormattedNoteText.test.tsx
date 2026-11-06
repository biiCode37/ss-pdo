// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FormattedNoteText } from '../FormattedNoteText';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('FormattedNoteText (teks polos tanpa badge, refact_212)', () => {
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

  const render = (text: string) => act(() => root.render(<FormattedNoteText text={text} />));

  it.each(['OFF', 'TO EVDAL', 'BA.01 AC MATI', 'NP1 TELAT'])('"%s" dirender sebagai teks, bukan badge', (text) => {
    render(text);
    expect(container.querySelector('[class*="note-badge"]')).toBeNull();
    expect(container.querySelectorAll('.note-item')).toHaveLength(1);
    expect(container.textContent).toBe(text);
  });

  it('beberapa keterangan: tiap item dipisah bullet, prefiks shift tetap ada', () => {
    render('S1: OFF | S2: BA.02 BAN PECAH');
    const items = container.querySelectorAll('.note-item');
    expect(items).toHaveLength(2);
    expect(container.querySelectorAll('.note-bullet')).toHaveLength(2);
    expect(items[0].querySelector('.note-shift-prefix')?.textContent).toBe('S1');
    expect(items[0].textContent).toBe('S1OFF');
    expect(items[1].textContent).toBe('S2BA.02 BAN PECAH');
    expect(container.querySelector('[class*="note-badge"]')).toBeNull();
  });

  it('teks kosong tidak dirender', () => {
    render('   ');
    expect(container.innerHTML).toBe('');
  });
});
