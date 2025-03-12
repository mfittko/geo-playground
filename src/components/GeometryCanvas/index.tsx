
import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import CanvasGrid from '../CanvasGrid';
import ShapeRenderer from './ShapeRenderer';
import PreviewShape from './PreviewShape';
import { Point, AnyShape, OperationMode, MeasurementUnit } from '@/types/shapes';
import { Button } from '@/components/ui/button';
import { 
  MoveDiagonal, 
  Square, 
  RotateCcw, 
  Circle as CircleIcon, 
  Edit3, 
  Pointer, 
  Trash,
  Maximize,
  Minimize,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import TouchHandler from './TouchHandler';
import { ShapeServiceFactory } from '@/services/ShapeService';

interface GeometryCanvasProps {
  width?: number;
  height?: number;
  shapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  measurementUnit: MeasurementUnit;
  onShapeSelect: (id: string | null) => void;
  onShapeCreate: (start: Point, end: Point) => string;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
  onShapeDelete?: (id: string) => void;
}

const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  width = 800,
  height = 600,
  shapes,
  selectedShapeId,
  activeMode,
  measurementUnit,
  onShapeSelect,
  onShapeCreate,
  onShapeMove,
  onShapeResize,
  onShapeRotate,
  onShapeDelete
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [previewShape, setPreviewShape] = useState<Partial<AnyShape> | null>(null);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  const selectedShape = shapes.find(shape => shape.id === selectedShapeId) || null;

  // Adjust canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parentWidth = canvasRef.current.parentElement?.clientWidth || width;
        const parentHeight = canvasRef.current.parentElement?.clientHeight || height;
        
        setCanvasSize({
          width: Math.min(parentWidth, width),
          height: Math.min(parentHeight, height)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  // Handle mouse and touch interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const point = { x, y };
    
    setStartPoint(point);
    setCurrentPoint(point);
    
    if (activeMode === 'create') {
      setPreviewShape({
        type: 'rectangle', // Default shape type
        position: point,
        width: 0,
        height: 0
      });
    } else if (activeMode === 'select') {
      // Find the shape under the pointer
      const clickedShape = shapes.find(shape => {
        // Simple hit testing - would need more sophisticated logic for real app
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
      
      onShapeSelect(clickedShape?.id || null);
    }
    
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !startPoint || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const point = { x, y };
    
    setCurrentPoint(point);
    
    if (activeMode === 'create' && previewShape) {
      setPreviewShape({
        ...previewShape,
        width: point.x - startPoint.x,
        height: point.y - startPoint.y
      });
    } else if (activeMode === 'move' && selectedShapeId) {
      const dx = point.x - (currentPoint?.x || 0);
      const dy = point.y - (currentPoint?.y || 0);
      
      if (selectedShape && 'position' in selectedShape) {
        onShapeMove(selectedShapeId, {
          x: selectedShape.position.x + dx,
          y: selectedShape.position.y + dy
        });
      }
    }
  };

  const handlePointerUp = () => {
    if (isDragging && startPoint && currentPoint && activeMode === 'create' && previewShape) {
      // Create new shape
      onShapeCreate(startPoint, currentPoint);
    }
    
    setIsDragging(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setPreviewShape(null);
  };

  const handleDelete = () => {
    if (selectedShapeId && onShapeDelete) {
      onShapeDelete(selectedShapeId);
      onShapeSelect(null);
      toast({
        title: "Shape deleted",
        description: "The selected shape has been removed",
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotateClockwise = () => {
    if (selectedShapeId && selectedShape) {
      onShapeRotate(selectedShapeId, selectedShape.rotation + 15);
    }
  };

  const handleRotateCounterClockwise = () => {
    if (selectedShapeId && selectedShape) {
      onShapeRotate(selectedShapeId, selectedShape.rotation - 15);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="relative w-full overflow-hidden border rounded-lg shadow-lg bg-white">
        <div 
          ref={canvasRef}
          className="relative w-full touch-manipulation"
          style={{ 
            height: canvasSize.height,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            overflow: 'hidden'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <CanvasGrid width={canvasSize.width} height={canvasSize.height} unit={measurementUnit} />
          
          {shapes.map(shape => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedShapeId}
            />
          ))}
          
          {previewShape && <PreviewShape shape={previewShape} />}
        </div>
        
        {/* Touch-friendly controls */}
        <TouchHandler 
          shapes={shapes}
          selectedShapeId={selectedShapeId}
          onShapeSelect={onShapeSelect}
          onShapeMove={onShapeMove}
          onShapeResize={onShapeResize}
          onShapeRotate={onShapeRotate}
        />
        
        <div className="absolute bottom-2 right-2 flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={handleZoomIn}>
            <Maximize className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={handleZoomOut}>
            <Minimize className="h-4 w-4" />
          </Button>
        </div>
        
        {selectedShapeId && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Button size="icon" variant="outline" onClick={handleRotateClockwise}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={handleRotateCounterClockwise}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeometryCanvas;
