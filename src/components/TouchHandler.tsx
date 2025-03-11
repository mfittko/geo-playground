
import React, { useEffect, useRef, useState } from 'react';

interface TouchHandlerProps {
  children: React.ReactNode;
  onPan?: (dx: number, dy: number) => void;
  onPinch?: (scale: number, center: { x: number, y: number }) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
}

interface Touch {
  identifier: number;
  clientX: number;
  clientY: number;
}

export const TouchHandler: React.FC<TouchHandlerProps> = ({
  children,
  onPan,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchesRef = useRef<Touch[]>([]);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touches: Touch[]): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getCenter = (touches: Touch[]): { x: number, y: number } => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.touches).map(touch => ({
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
      }));
      
      touchesRef.current = touches;
      
      if (touches.length === 1) {
        // Set up long press timeout
        if (onLongPress) {
          longPressTimeoutRef.current = setTimeout(() => {
            onLongPress(touches[0].clientX, touches[0].clientY);
          }, 500);
        }
        
        const now = Date.now();
        if (onDoubleTap && now - lastTapTimeRef.current < 300) {
          onDoubleTap(touches[0].clientX, touches[0].clientY);
          lastTapTimeRef.current = 0; // Reset to prevent triple-tap
        } else {
          lastTapTimeRef.current = now;
        }
      } else if (touches.length === 2) {
        // Cancel long press if it becomes a pinch
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
        
        initialDistanceRef.current = getDistance(touches);
        setIsPinching(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const newTouches = Array.from(e.touches).map(touch => ({
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
      }));
      
      if (newTouches.length === 0 || touchesRef.current.length === 0) return;
      
      // Cancel long press on move
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      
      if (newTouches.length === 1 && touchesRef.current.length === 1 && onPan) {
        setIsPanning(true);
        const dx = newTouches[0].clientX - touchesRef.current[0].clientX;
        const dy = newTouches[0].clientY - touchesRef.current[0].clientY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          onPan(dx, dy);
        }
      } else if (newTouches.length === 2 && touchesRef.current.length === 2 && onPinch) {
        const currentDistance = getDistance(newTouches);
        const scale = currentDistance / initialDistanceRef.current;
        const center = getCenter(newTouches);
        
        if (Math.abs(scale - 1) > 0.01) {
          onPinch(scale, center);
        }
      }
      
      touchesRef.current = newTouches;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const currentTouches = Array.from(e.touches).map(touch => ({
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
      }));
      
      // Clear long press timer if touch ends
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      
      // If the touch ended without moving much, it's a tap
      if (
        touchesRef.current.length === 1 &&
        currentTouches.length === 0 &&
        !isPanning &&
        !isPinching &&
        onTap
      ) {
        onTap(touchesRef.current[0].clientX, touchesRef.current[0].clientY);
      }
      
      // Reset states
      setIsPanning(false);
      setIsPinching(false);
      touchesRef.current = currentTouches;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, [onPan, onPinch, onTap, onDoubleTap, onLongPress]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      {children}
    </div>
  );
};
