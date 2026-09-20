import { useState, useEffect } from "react";

export interface VisualViewportInfo {
  viewportHeight: number;
  viewportWidth: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

const KEYBOARD_MIN_THRESHOLD_PX = 150;

/**
 * Hook untuk melacak dimensi visual viewport secara real-time.
 * Berguna di perangkat mobile untuk mendeteksi kemunculan keyboard virtual
 * dan mencegah komponen modal tertutup atau terpotong.
 */
export function useVisualViewport(): VisualViewportInfo {
  const [viewportInfo, setViewportInfo] = useState<VisualViewportInfo>(() => {
    if (typeof window === "undefined") {
      return {
        viewportHeight: 800,
        viewportWidth: 375,
        isKeyboardOpen: false,
        keyboardHeight: 0,
      };
    }

    const vv = window.visualViewport;
    const vHeight = vv ? vv.height : window.innerHeight;
    const vWidth = vv ? vv.width : window.innerWidth;
    const heightDiff = window.innerHeight - vHeight;
    const isKeyboard = heightDiff > KEYBOARD_MIN_THRESHOLD_PX;

    return {
      viewportHeight: vHeight,
      viewportWidth: vWidth,
      isKeyboardOpen: isKeyboard,
      keyboardHeight: isKeyboard ? Math.max(0, heightDiff) : 0,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      const vv = window.visualViewport;
      const vHeight = vv ? vv.height : window.innerHeight;
      const vWidth = vv ? vv.width : window.innerWidth;
      const heightDiff = window.innerHeight - vHeight;
      const isKeyboard = heightDiff > KEYBOARD_MIN_THRESHOLD_PX;

      setViewportInfo({
        viewportHeight: vHeight,
        viewportWidth: vWidth,
        isKeyboardOpen: isKeyboard,
        keyboardHeight: isKeyboard ? Math.max(0, heightDiff) : 0,
      });
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateViewport);
      vv.addEventListener("scroll", updateViewport);
    } else {
      window.addEventListener("resize", updateViewport);
    }

    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateViewport);
        vv.removeEventListener("scroll", updateViewport);
      } else {
        window.removeEventListener("resize", updateViewport);
      }
    };
  }, []);

  return viewportInfo;
}
