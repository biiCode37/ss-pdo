// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SwipeableContainer } from '../SwipeableContainer';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('SwipeableContainer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const createTouchEvent = (type: string, clientX: number, clientY: number, target: Element) => {
    const touch = {
      clientX,
      clientY,
      identifier: 0,
      target,
    } as unknown as Touch;

    return new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
    });
  };

  it('calls onSwipeLeft when swiped left beyond minSwipeDistance threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
          <div id="target">Content</div>
        </SwipeableContainer>
      );
    });

    const target = container.querySelector('#target')!;
    act(() => {
      target.dispatchEvent(createTouchEvent('touchstart', 200, 100, target));
      target.dispatchEvent(createTouchEvent('touchend', 100, 100, target)); // deltaX = -100
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('calls onSwipeRight when swiped right beyond minSwipeDistance threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
          <div id="target">Content</div>
        </SwipeableContainer>
      );
    });

    const target = container.querySelector('#target')!;
    act(() => {
      target.dispatchEvent(createTouchEvent('touchstart', 100, 100, target));
      target.dispatchEvent(createTouchEvent('touchend', 200, 100, target)); // deltaX = 100
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores swipe gesture if deltaY exceeds threshold ratio (vertical scroll)', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
          <div id="target">Content</div>
        </SwipeableContainer>
      );
    });

    const target = container.querySelector('#target')!;
    act(() => {
      // deltaX = -60, deltaY = 60 => Math.abs(-60) is NOT > 60 * 1.2 (72)
      target.dispatchEvent(createTouchEvent('touchstart', 200, 100, target));
      target.dispatchEvent(createTouchEvent('touchend', 140, 160, target));
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('ignores touch events if target is an input or has class .no-swipe or .route-date-tabs', () => {
    const onSwipeLeft = vi.fn();

    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft}>
          <div>
            <input id="input-target" type="text" />
            <div id="no-swipe-target" className="no-swipe">No Swipe</div>
            <div id="tabs-target" className="route-date-tabs">Tabs</div>
          </div>
        </SwipeableContainer>
      );
    });

    const inputTarget = container.querySelector('#input-target')!;
    const noSwipeTarget = container.querySelector('#no-swipe-target')!;
    const tabsTarget = container.querySelector('#tabs-target')!;

    // Input target
    act(() => {
      inputTarget.dispatchEvent(createTouchEvent('touchstart', 200, 100, inputTarget));
      inputTarget.dispatchEvent(createTouchEvent('touchend', 100, 100, inputTarget));
    });
    expect(onSwipeLeft).not.toHaveBeenCalled();

    // .no-swipe target
    act(() => {
      noSwipeTarget.dispatchEvent(createTouchEvent('touchstart', 200, 100, noSwipeTarget));
      noSwipeTarget.dispatchEvent(createTouchEvent('touchend', 100, 100, noSwipeTarget));
    });
    expect(onSwipeLeft).not.toHaveBeenCalled();

    // .route-date-tabs target
    act(() => {
      tabsTarget.dispatchEvent(createTouchEvent('touchstart', 200, 100, tabsTarget));
      tabsTarget.dispatchEvent(createTouchEvent('touchend', 100, 100, tabsTarget));
    });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores touch events if target or parent has data-no-swipe="true" attribute', () => {
    const onSwipeLeft = vi.fn();

    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft}>
          <div>
            <div data-no-swipe="true">
              <button id="attr-child-target">Clickable inside data-no-swipe</button>
            </div>
          </div>
        </SwipeableContainer>
      );
    });

    const attrTarget = container.querySelector('#attr-child-target')!;
    act(() => {
      attrTarget.dispatchEvent(createTouchEvent('touchstart', 200, 100, attrTarget));
      attrTarget.dispatchEvent(createTouchEvent('touchend', 100, 100, attrTarget));
    });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores swipe if disabled or distance is below minSwipeDistance', () => {
    const onSwipeLeft = vi.fn();

    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft} minSwipeDistance={80} disabled={true}>
          <div id="target">Content</div>
        </SwipeableContainer>
      );
    });

    const target = container.querySelector('#target')!;

    // Disabled
    act(() => {
      target.dispatchEvent(createTouchEvent('touchstart', 200, 100, target));
      target.dispatchEvent(createTouchEvent('touchend', 100, 100, target));
    });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });
});

type Point = { x: number; y: number };

const fireTouch = (el: Element, type: string, point: Point | null) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touch = point ? [{ clientX: point.x, clientY: point.y }] : [];
  Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : touch });
  Object.defineProperty(event, 'changedTouches', { value: touch });
  act(() => {
    el.dispatchEvent(event);
  });
};

/** Simulasi gestur: start → beberapa titik move → end di titik terakhir. */
const gesture = (el: Element, points: Point[]) => {
  fireTouch(el, 'touchstart', points[0]);
  points.slice(1).forEach((p) => fireTouch(el, 'touchmove', p));
  fireTouch(el, 'touchend', points[points.length - 1]);
};

describe('SwipeableContainer — swipe pindah tab vs scroll vertikal', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onSwipeLeft = vi.fn();
  const onSwipeRight = vi.fn();

  const getArea = () => container.querySelector('[data-testid="swipe-area"]') as HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <SwipeableContainer onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
          <div data-testid="swipe-area" style={{ height: 400 }}>konten</div>
        </SwipeableContainer>,
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('swipe horizontal yang jelas tetap berpindah tab', () => {
    gesture(getArea(), [{ x: 300, y: 300 }, { x: 280, y: 302 }, { x: 180, y: 310 }]);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);

    gesture(getArea(), [{ x: 100, y: 300 }, { x: 120, y: 298 }, { x: 220, y: 295 }]);
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('scroll vertikal cepat dengan jempol melengkung ke samping TIDAK berpindah tab', () => {
    // Awal gerak vertikal (sumbu terkunci 'y'), lalu melengkung jauh ke samping
    gesture(getArea(), [{ x: 300, y: 500 }, { x: 298, y: 480 }, { x: 200, y: 440 }, { x: 160, y: 430 }]);
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('gestur diagonal (tidak 2x lebih horizontal) TIDAK berpindah tab', () => {
    gesture(getArea(), [{ x: 300, y: 300 }, { x: 285, y: 291 }, { x: 220, y: 250 }]);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('tidak berpindah tab jika halaman ikut ter-scroll selama gestur', () => {
    fireTouch(getArea(), 'touchstart', { x: 300, y: 300 });
    fireTouch(getArea(), 'touchmove', { x: 280, y: 301 });
    (window as unknown as { scrollY: number }).scrollY = 240;
    fireTouch(getArea(), 'touchend', { x: 180, y: 305 });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('touchcancel membatalkan gestur yang sedang berjalan', () => {
    fireTouch(getArea(), 'touchstart', { x: 300, y: 300 });
    fireTouch(getArea(), 'touchmove', { x: 280, y: 301 });
    fireTouch(getArea(), 'touchcancel', null);
    fireTouch(getArea(), 'touchend', { x: 180, y: 305 });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });
});
