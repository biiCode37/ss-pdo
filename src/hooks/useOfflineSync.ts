import { useState, useEffect, useCallback } from 'react';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { updateBusData } from '../services/googleSheets';

export interface SyncItem {
  id: string;
  sheetId: string;
  tabName: string;
  rowIndex: number;
  updates: Partial<BusData>;
  headerMap: HeaderMap;
  status: 'pending' | 'failed';
}

export function useOfflineSync() {
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load initial queue
  useEffect(() => {
    const saved = localStorage.getItem('PDO_SYNC_QUEUE');
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse queue', e);
      }
    }
  }, []);

  const saveQueue = (newQueue: SyncItem[]) => {
    setQueue(newQueue);
    localStorage.setItem('PDO_SYNC_QUEUE', JSON.stringify(newQueue));
  };

  const addToQueue = useCallback((item: Omit<SyncItem, 'id' | 'status'>) => {
    const newItem: SyncItem = {
      ...item,
      id: Date.now().toString(),
      status: 'pending'
    };
    // Replace if same row is already in queue
    setQueue(prev => {
      const filtered = prev.filter(q => !(q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex));
      const newQueue = [...filtered, newItem];
      localStorage.setItem('PDO_SYNC_QUEUE', JSON.stringify(newQueue));
      return newQueue;
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    // Get latest queue from storage to ensure we have the freshest data
    const saved = localStorage.getItem('PDO_SYNC_QUEUE');
    let currentQueue: SyncItem[] = [];
    if (saved) {
      try {
        currentQueue = JSON.parse(saved);
      } catch (e) {}
    }

    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    let remainingQueue = [...currentQueue];

    for (const item of currentQueue) {
      try {
        await updateBusData(item.sheetId, item.tabName, item.rowIndex, item.updates, item.headerMap);
        // If success, remove from remaining
        remainingQueue = remainingQueue.filter(q => q.id !== item.id);
        saveQueue(remainingQueue);
      } catch (err: any) {
        // If it's auth error, stop processing immediately
        if (err.message && err.message.includes('Auth') || err.status === 401 || err.message?.includes('Credentials')) {
          break;
        }
        // If other error, keep it in queue and continue or break
        break; 
      }
    }
    
    setIsSyncing(false);
  }, [isSyncing]);

  // Listen for online events
  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  // Initial attempt on load
  useEffect(() => {
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return { queue, addToQueue, processQueue, isSyncing };
}
