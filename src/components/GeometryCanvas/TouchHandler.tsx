
import React, { useEffect, useRef, useState } from 'react';
import { AnyShape, Point } from '@/types/shapes';
import { useToast } from '@/hooks/use-toast';

interface TouchHandlerProps {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  onShapeSelect: (id: string | null) => void;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
}

const TouchHandler: React.FC<TouchHandlerProps> = ({
  shapes,
  selectedShapeId,
  onShapeSelect,
  onShapeMove,
  onShapeResize,
  onShapeRotate
}) => {
  const touchRef = useRef<HTMLDivElement>(null);
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);
  const [initialRotation, setInitialRotation] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<Point | null>(null);
  const { toast } = useToast();

  // Get the currently selected shape
  const selectedShape = shapes.find(shape => shape.id === selectedShapeId);

  useEffect(() => {
    const touchElement = touchRef.current;
    if (!touchElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - prepare for move
        const touch = e.touches[0];
        const point = { x: touch.clientX, y: touch.clientY };
        setLastTouchCenter(point);
        
        // If no shape is selected, try to select one
        if (!selectedShapeId) {
          // Find shape under touch point
          // This is a simplified hit test and should be improved
          const rect = touchElement.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          
          const touchedShape = shapes.find(shape => {
            if (shape.type === 'rectangle') {
              return (
                x >= shape.position.x &&
                x <= shape.position.x + shape.width &&
                y >= shape.position.y &&
                y <= shape.position.y + shape.height
              );
            }
            return false;
          });
          
          if (touchedShape) {
            onShapeSelect(touchedShape.id);
          }
        }
      } else if (e.touches.length === 2) {
        // Two touches - prepare for pinch/zoom or rotation
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calculate initial distance for pinch/zoom
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        const initialDistance = Math.sqrt(dx * dx + dy * dy);
        setInitialTouchDistance(initialDistance);
        
        // Calculate initial angle for rotation
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        setInitialRotation(angle);
        
        // Calculate center point between touches
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        setLastTouchCenter({ x: centerX, y: centerY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!selectedShapeId || !selectedShape) return;
      
      if (e.touches.length === 1) {
        // Single touch - handle move
        const touch = e.touches[0];
        const currentPoint = { x: touch.clientX, y: touch.clientY };
        
        if (lastTouchCenter) {
          const dx = currentPoint.x - lastTouchCenter.x;
          const dy = currentPoint.y - lastTouchCenter.y;
          
          // Move the shape
          if ('position' in selectedShape) {
            onShapeMove(selectedShapeId, {
              x: selectedShape.position.x + dx,
              y: selectedShape.position.y + dy
            });
          }
          
          setLastTouchCenter(currentPoint);
        }
      } else if (e.touches.length === 2 && initialTouchDistance !== null && initialRotation !== null) {
        // Two touches - handle pinch/zoom and rotation
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calculate current distance for pinch/zoom
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate scale factor
        const scaleFactor = currentDistance / initialTouchDistance;
        
        // Calculate current angle for rotation
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const rotationDelta = currentAngle - initialRotation;
        
        // Apply rotation if significant change
        if (Math.abs(rotationDelta) > 5) {
          onShapeRotate(selectedShapeId, selectedShape.rotation + rotationDelta);
          setInitialRotation(currentAngle);
        }
        
        // Apply resize if significant change
        if (Math.abs(scaleFactor - 1) > 0.05) {
          onShapeResize(selectedShapeId, scaleFactor);
          setInitialTouchDistance(currentDistance);
        }
        
        // Update center point
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const currentCenter = { x: centerX, y: centerY };
        
        if (lastTouchCenter) {
          const dx = currentCenter.x - lastTouchCenter.x;
          const dy = currentCenter.y - lastTouchCenter.y;
          
          // Move the shape based on center point movement
          if ('position' in selectedShape) {
            onShapeMove(selectedShapeId, {
              x: selectedShape.position.x + dx,
              y: selectedShape.position.y + dy
            });
          }
        }
        
        setLastTouchCenter(currentCenter);
      }
    };

    const handleTouchEnd = () => {
      setInitialTouchDistance(null);
      setInitialRotation(null);
    };

    // Add event listeners
    touchElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    touchElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    touchElement.addEventListener('touchend', handleTouchEnd);
    touchElement.addEventListener('touchcancel', handleTouchEnd);

    // Clean up
    return () => {
      touchElement.removeEventListener('touchstart', handleTouchStart);
      touchElement.removeEventListener('touchmove', handleTouchMove);
      touchElement.removeEventListener('touchend', handleTouchEnd);
      touchElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    shapes, 
    selectedShapeId, 
    selectedShape, 
    onShapeSelect, 
    onShapeMove, 
    onShapeResize, 
    onShapeRotate, 
    lastTouchCenter, 
    initialTouchDistance, 
    initialRotation
  ]);

  return (
    <div 
      ref={touchRef} 
      className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
    >
      {/* This div captures touch events but doesn't show anything */}
    </div>
  );
};

export default TouchHandler;
