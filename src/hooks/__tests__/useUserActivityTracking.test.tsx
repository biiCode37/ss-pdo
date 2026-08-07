// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUserActivityTracking } from '../useUserActivityTracking';
import * as routeService from '../../services/routeService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../services/routeService', () => ({
  sendUserHeartbeat: vi.fn().mockResolvedValue(undefined),
}));

function TestComponent({ isSignedIn, userEmail }: { isSignedIn: boolean; userEmail?: string }) {
  useUserActivityTracking(isSignedIn, userEmail);
  return <div id="test-node">Test</div>;
}

describe('useUserActivityTracking', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('sends initial heartbeat on mount when signed in', () => {
    act(() => {
      root.render(<TestComponent isSignedIn={true} userEmail="petugas@pusm.id" />);
    });
    expect(routeService.sendUserHeartbeat).toHaveBeenCalledWith('petugas@pusm.id', 0);
  });

  it('does not send heartbeat when not signed in', () => {
    act(() => {
      root.render(<TestComponent isSignedIn={false} userEmail="petugas@pusm.id" />);
    });
    expect(routeService.sendUserHeartbeat).not.toHaveBeenCalled();
  });

  it('sends periodic 180s heartbeat every 3 minutes when tab is visible', () => {
    act(() => {
      root.render(<TestComponent isSignedIn={true} userEmail="petugas@pusm.id" />);
    });
    expect(routeService.sendUserHeartbeat).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000);
    });
    expect(routeService.sendUserHeartbeat).toHaveBeenCalledTimes(2);
    expect(routeService.sendUserHeartbeat).toHaveBeenLastCalledWith('petugas@pusm.id', 180);
  });
});
