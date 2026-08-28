import { useEffect, useRef } from 'react';
import { pushBackNavigation, removeBackNavigation } from '../utils/historyNavigation';

interface UseMobileBackHandlerOptions {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  priority?: number;
}

/**
 * Custom hook to bind any modal, sheet, dialog, or sub-view to the mobile hardware/gesture Back button
 */
export function useMobileBackHandler({ id, isOpen, onClose }: UseMobileBackHandlerOptions) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // Register this modal/view to the back navigation stack
    pushBackNavigation({
      id,
      onBack: () => {
        onCloseRef.current();
      },
    });

    return () => {
      removeBackNavigation(id);
    };
  }, [isOpen, id]);
}
