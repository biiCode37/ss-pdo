// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOfflineSync, isNetworkError } from '../useOfflineSync';
import * as googleSheets from '../../services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../services/googleSheets', () => ({
  updateBusData: vi.fn(),
  getBusRowData: vi.fn(),
}));

vi.mock('../../services/routeService', () => ({
  backupSyncQueue: vi.fn().mockResolvedValue(undefined),
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

let latestHookResult: ReturnType<typeof useOfflineSync>;

function TestHookComponent({ options }: { options?: Parameters<typeof useOfflineSync>[0] }) {
  latestHookResult = useOfflineSync(options);
  return <div id="hook-mounted">Queue: {latestHookResult.queue.length}</div>;
}

describe('useOfflineSync Hook', () => {
  const mockHeaderMap: any = { unit: 0, toaShift1: 1, totalToa: 2, keterangan: 3 };
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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

  describe('isNetworkError helper', () => {
    it('identifies TypeError Failed to fetch as network error', () => {
      const err = new TypeError('Failed to fetch');
      expect(isNetworkError(err)).toBe(true);
    });

    it('identifies NetworkError string message', () => {
      const err = new Error('NetworkError when attempting to fetch resource.');
      expect(isNetworkError(err)).toBe(true);
    });

    it('returns false for auth or server logical errors with status', () => {
      expect(isNetworkError({ status: 401 })).toBe(false);
      expect(isNetworkError({ status: 500, message: 'Server Error' })).toBe(false);
      expect(isNetworkError({ code: 403 })).toBe(false);
    });
  });

  describe('Queue Operations', () => {
    it('initializes with empty queue when storage is clean', () => {
      act(() => {
        root.render(<TestHookComponent />);
      });
      expect(latestHookResult.queue).toEqual([]);
    });

    it('adds items to queue with generated UUID and pending status', () => {
      act(() => {
        root.render(<TestHookComponent />);
      });

      act(() => {
        latestHookResult.addToQueue({
          sheetId: 'sheet-123',
          tabName: '21',
          rowIndex: 5,
          updates: { toaShift1: '120' },
          headerMap: mockHeaderMap,
        });
      });

      expect(latestHookResult.queue.length).toBe(1);
      expect(latestHookResult.queue[0]).toMatchObject({
        sheetId: 'sheet-123',
        tabName: '21',
        rowIndex: 5,
        updates: { toaShift1: '120' },
        status: 'pending',
        retryCount: 0,
      });
      expect(latestHookResult.queue[0].id).toBeDefined();

      // Check localStorage persistence
      const saved = JSON.parse(localStorage.getItem('PDO_SYNC_QUEUE') || '[]');
      expect(saved.length).toBe(1);
      expect(saved[0].sheetId).toBe('sheet-123');
    });

    it('removes item from queue by ID', () => {
      act(() => {
        root.render(<TestHookComponent />);
      });

      act(() => {
        latestHookResult.addToQueue({
          sheetId: 'sheet-123',
          tabName: '21',
          rowIndex: 5,
          updates: { toaShift1: '120' },
          headerMap: mockHeaderMap,
        });
      });

      const itemId = latestHookResult.queue[0].id;

      act(() => {
        latestHookResult.removeItem(itemId);
      });

      expect(latestHookResult.queue.length).toBe(0);
      const saved = JSON.parse(localStorage.getItem('PDO_SYNC_QUEUE') || '[]');
      expect(saved.length).toBe(0);
    });

    it('retries failed item and resets status to pending', () => {
      act(() => {
        root.render(<TestHookComponent />);
      });

      act(() => {
        latestHookResult.addToQueue({
          sheetId: 'sheet-123',
          tabName: '21',
          rowIndex: 5,
          updates: { toaShift1: '120' },
          headerMap: mockHeaderMap,
        });
      });

      const itemId = latestHookResult.queue[0].id;

      act(() => {
        latestHookResult.retryItem(itemId);
      });

      expect(latestHookResult.queue[0].status).toBe('pending');
      expect(latestHookResult.queue[0].retryCount).toBe(0);
    });

    it('forces conflict item to pending with clear original snapshot', () => {
      act(() => {
        root.render(<TestHookComponent />);
      });

      act(() => {
        latestHookResult.addToQueue({
          sheetId: 'sheet-123',
          tabName: '21',
          rowIndex: 5,
          updates: { toaShift1: '120' },
          headerMap: mockHeaderMap,
          originalSnapshot: { toaShift1: '100' },
        });
      });

      const itemId = latestHookResult.queue[0].id;

      act(() => {
        latestHookResult.forceConflictItem(itemId);
      });

      expect(latestHookResult.queue[0].status).toBe('pending');
      expect(latestHookResult.queue[0].originalSnapshot).toBeUndefined();
    });
  });

  describe('Process Queue Execution', () => {
    it('processes pending queue successfully and calls onSyncSuccess', async () => {
      const onSyncSuccess = vi.fn();
      (googleSheets.updateBusData as any).mockResolvedValue(true);

      act(() => {
        root.render(<TestHookComponent options={{ onSyncSuccess }} />);
      });

      act(() => {
        latestHookResult.addToQueue({
          sheetId: 'sheet-123',
          tabName: '21',
          rowIndex: 5,
          updates: { toaShift1: '120' },
          headerMap: mockHeaderMap,
        });
      });

      await act(async () => {
        await latestHookResult.processQueue();
      });

      expect(googleSheets.updateBusData).toHaveBeenCalledWith(
        'sheet-123',
        '21',
        5,
        { toaShift1: '120' },
        mockHeaderMap,
      );
      expect(onSyncSuccess).toHaveBeenCalledWith(5, 'sheet-123', '21', { toaShift1: '120' });
      expect(latestHookResult.queue.length).toBe(0);
    });

    it('detects collision when server data changed and marks status as conflict', async () => {
      (googleSheets.getBusRowData as any).mockResolvedValue({
        unit: 'MB-01',
        toaShift1: '150', // Server has 150
      });

      act(() => {
        root.render(<TestHookComponent />);
      });

      act(() => {
        latestHookResult.addToQueue({
          sheetId: 'sheet-123',
          tabName: '21',
          rowIndex: 5,
          updates: { toaShift1: '200' },
          headerMap: mockHeaderMap,
          originalSnapshot: { toaShift1: '100' }, // Snapshot was 100
        });
      });

      await act(async () => {
        await latestHookResult.processQueue();
      });

      expect(latestHookResult.queue.length).toBe(1);
      expect(latestHookResult.queue[0].status).toBe('conflict');
    });
  });
});
