import { useEffect, useRef } from "react";
import type { GeoPoint } from "../types/types";

interface UseKeyboardMovementOptions {
  enabled: boolean;
  initialPosition: GeoPoint;
  step?: number;
  throttleMs?: number;
  onPositionChange: (position: GeoPoint) => void;
  onPositionFlush: (position: GeoPoint) => Promise<void>;
}

const KEYBOARD_DELTAS: Record<string, GeoPoint> = {
  ArrowUp: { lat: 1, lng: 0 },
  ArrowDown: { lat: -1, lng: 0 },
  ArrowLeft: { lat: 0, lng: -1 },
  ArrowRight: { lat: 0, lng: 1 },
};

export function useKeyboardMovement({
  enabled,
  initialPosition,
  step = 0.00001,
  throttleMs = 1000,
  onPositionChange,
  onPositionFlush,
}: UseKeyboardMovementOptions): void {
  const pendingPositionRef = useRef<GeoPoint>(initialPosition);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const onPositionFlushRef = useRef(onPositionFlush);

  useEffect(() => {
    pendingPositionRef.current = initialPosition;
  }, [initialPosition.lat, initialPosition.lng]);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onPositionFlushRef.current = onPositionFlush;
  }, [onPositionFlush]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const flushLatestPosition = async () => {
      try {
        await onPositionFlushRef.current(pendingPositionRef.current);
      } finally {
        throttleRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const delta = KEYBOARD_DELTAS[event.key];

      if (!delta) {
        return;
      }

      event.preventDefault();

      const nextPosition = {
        lat: pendingPositionRef.current.lat + delta.lat * step,
        lng: pendingPositionRef.current.lng + delta.lng * step,
      };

      pendingPositionRef.current = nextPosition;
      onPositionChangeRef.current(nextPosition);

      if (throttleRef.current !== null) {
        return;
      }

      throttleRef.current = setTimeout(() => {
        void flushLatestPosition();
      }, throttleMs);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      if (throttleRef.current !== null) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
        void onPositionFlushRef.current(pendingPositionRef.current);
      }
    };
  }, [enabled, step, throttleMs]);
}
