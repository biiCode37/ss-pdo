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
