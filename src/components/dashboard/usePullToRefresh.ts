import { useState } from "react";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  isOnline: boolean;
  onError: (msg: string) => void;
}

export function usePullToRefresh({
  onRefresh,
  isOnline,
  onError,
}: UsePullToRefreshOptions) {
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setPullDistance(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      if (!isOnline) {
        onError(TEXT_DASHBOARD.REFRESH_OFFLINE_ERR);
        setIsRefreshing(false);
        setPullDistance(0);
        setTouchStartY(0);
        return;
      }
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setTouchStartY(0);
      });
    } else {
      setPullDistance(0);
      setTouchStartY(0);
    }
  };

  return {
    touchStartY,
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
