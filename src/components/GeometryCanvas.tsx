
import React, { useEffect, useRef, useState } from 'react';
import { TouchHandler } from './TouchHandler';
import { MobileToolbar } from './MobileToolbar';
import { ShapeServiceFactory } from '../services/ShapeServiceFactory';
import { toast } from 'sonner';
import { Shape, Point } from '../types/shapes';
import { useMobileDetect } from '../hooks/useMobileDetect';

interface GeometryCanvasProps {
  initialShapes?: Shape[];
  onShapeCreate?: (shape: Shape) => void;
  onShapeUpdate?: (shape: Shape) => void;
  onShapeDelete?: (shapeId: string) => void;
}

export const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  initialShapes = [],
  onShapeCreate,
  onShapeUpdate,
  onShapeDelete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [showProperties, setShowProperties] = useState<boolean>(false);
  const isMobile = useMobileDetect();

  const lastTouchRef = useRef<{
    x: number;
    y: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fit container
    const resizeCanvas = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderCanvas();
      }
    };

    // Initial resize
    resizeCanvas();

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);

    // Draw all shapes
    const renderCanvas = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and pan
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);

      // Draw grid
      drawGrid(ctx, canvas.width, canvas.height);

      // Draw shapes
      shapes.forEach(shape => {
        const shapeService = ShapeServiceFactory.getService(shape.type);
        drawShape(ctx, shape);

        // Highlight selected shape
        if (selectedShape && selectedShape.id === shape.id) {
          drawSelectionHighlight(ctx, shape);
        }
      });

      ctx.restore();
    };

    renderCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [shapes, selectedShape, zoom, panOffset]);

  // Draw a grid on the canvas
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;

    // Adjust for pan offset and zoom
    const startX = -panOffset.x / zoom;
    const startY = -panOffset.y / zoom;
    const endX = (width - panOffset.x) / zoom;
    const endY = (height - panOffset.y) / zoom;

    // Draw vertical lines
    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  // Draw a shape based on its type
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    // Get the appropriate service for the shape type
    const shapeService = ShapeServiceFactory.getService(shape.type);

    // Use the service to draw the shape
    shapeService.draw(ctx, shape);
  };

  // Highlight the selected shape
  const drawSelectionHighlight = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);

    const shapeService = ShapeServiceFactory.getService(shape.type);
    shapeService.drawSelectionOutline(ctx, shape);

    ctx.restore();
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (x: number, y: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x, y };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (x - rect.left - panOffset.x) / zoom,
      y: (y - rect.top - panOffset.y) / zoom,
    };
  };

  // Handle mouse/touch down event
  const handlePointerDown = (x: number, y: number) => {
    const canvasPoint = screenToCanvas(x, y);
    setDragStart(canvasPoint);

    if (activeTool === 'select') {
      // Try to select a shape
      let selected = null;
      // Check shapes in reverse order to select the top one first
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const shapeService = ShapeServiceFactory.getService(shape.type);
        if (shapeService.containsPoint(shape, canvasPoint)) {
          selected = shape;
          break;
        }
      }
      setSelectedShape(selected);
      if (selected) {
        setIsDragging(true);
        // If on mobile, show properties panel for the selected shape
        if (isMobile) {
          setShowProperties(true);
        }
      }
    } else {
      // Start creating a new shape
      setIsDragging(true);
    }
  };

  // Handle mouse/touch move event
  const handlePointerMove = (x: number, y: number) => {
    if (!isDragging || !dragStart) return;

    const canvasPoint = screenToCanvas(x, y);

    if (activeTool === 'select' && selectedShape) {
      // Move the selected shape
      const dx = canvasPoint.x - dragStart.x;
      const dy = canvasPoint.y - dragStart.y;

      const shapeService = ShapeServiceFactory.getService(selectedShape.type);
      const updatedShape = shapeService.move(selectedShape, dx, dy);

      // Update the shape in the state
      setShapes(shapes.map(s => (s.id === updatedShape.id ? updatedShape : s)));
      setSelectedShape(updatedShape);
      
      // Notify parent of shape update
      if (onShapeUpdate) {
        onShapeUpdate(updatedShape);
      }

      // Update drag start to current position
      setDragStart(canvasPoint);
    } else if (activeTool !== 'select') {
      // Create a temporary shape for preview
      // This could be extended for each tool type
    }
  };

  // Handle mouse/touch up event
  const handlePointerUp = (x: number, y: number) => {
    if (!isDragging || !dragStart) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    const canvasPoint = screenToCanvas(x, y);

    if (activeTool !== 'select') {
      // Create a new shape based on the active tool
      const newShape = createShape(activeTool, dragStart, canvasPoint);
      if (newShape) {
        setShapes([...shapes, newShape]);
        setSelectedShape(newShape);
        
        // Notify parent of shape creation
        if (onShapeCreate) {
          onShapeCreate(newShape);
        }

        // On mobile, switch back to select tool after creating a shape
        if (isMobile) {
          setActiveTool('select');
          setShowProperties(true);
        }
      }
    }

    setIsDragging(false);
    setDragStart(null);
  };

  // Create a new shape based on the active tool
  const createShape = (tool: string, start: Point, end: Point) => {
    try {
      switch (tool) {
        case 'circle': {
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          if (radius < 5) return null; // Minimum size check
          
          const circleService = ShapeServiceFactory.getService('circle');
          return circleService.create({
            center: start,
            radius,
            fill: 'rgba(0, 102, 255, 0.2)',
            stroke: 'rgba(0, 102, 255, 0.8)',
            strokeWidth: 2,
          });
        }
        case 'rectangle': {
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.y - start.y);
          if (width < 5 || height < 5) return null; // Minimum size check
          
          const position = {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
          };
          
          const rectangleService = ShapeServiceFactory.getService('rectangle');
          return rectangleService.create({
            position,
            width,
            height,
            rotation: 0,
            fill: 'rgba(0, 102, 255, 0.2)',
            stroke: 'rgba(0, 102, 255, 0.8)',
            strokeWidth: 2,
          });
        }
        case 'triangle': {
          // Create an isosceles triangle
          const midX = start.x;
          const topY = start.y;
          const width = Math.abs(end.x - start.x) * 2;
          const height = Math.abs(end.y - start.y);
          
          if (width < 10 || height < 10) return null; // Minimum size check
          
          const points = [
            { x: midX, y: topY }, // Top point
            { x: midX - width / 2, y: topY + height }, // Bottom left
            { x: midX + width / 2, y: topY + height }, // Bottom right
          ];
          
          const triangleService = ShapeServiceFactory.getService('triangle');
          return triangleService.create({
            points: points as [Point, Point, Point],
            rotation: 0,
            fill: 'rgba(0, 102, 255, 0.2)',
            stroke: 'rgba(0, 102, 255, 0.8)',
            strokeWidth: 2,
          });
        }
        case 'line': {
          const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          if (distance < 5) return null; // Minimum length check
          
          const lineService = ShapeServiceFactory.getService('line');
          return lineService.create({
            start,
            end,
            stroke: 'rgba(0, 102, 255, 0.8)',
            strokeWidth: 2,
          });
        }
        default:
          return null;
      }
    } catch (error) {
      console.error("Error creating shape:", error);
      toast.error("Could not create shape");
      return null;
    }
  };

  // Handle canvas pan (mobile)
  const handlePan = (dx: number, dy: number) => {
    if (activeTool === 'select' && !selectedShape) {
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
  };

  // Handle canvas pinch zoom (mobile)
  const handlePinch = (scale: number, center: Point) => {
    // Adjust zoom with limits
    const newZoom = Math.min(Math.max(zoom * scale, 0.5), 3);
    setZoom(newZoom);
  };

  // Handle tap on canvas (mobile)
  const handleTap = (x: number, y: number) => {
    handlePointerDown(x, y);
    handlePointerUp(x, y);
  };

  // Handle double tap (mobile) - use for zoom in
  const handleDoubleTap = (x: number, y: number) => {
    const newZoom = Math.min(zoom * 1.5, 3);
    setZoom(newZoom);
  };

  // Handle long press (mobile) - use for secondary actions
  const handleLongPress = (x: number, y: number) => {
    // Check if pressing on a shape for context menu
    const canvasPoint = screenToCanvas(x, y);
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const shapeService = ShapeServiceFactory.getService(shape.type);
      if (shapeService.containsPoint(shape, canvasPoint)) {
        setSelectedShape(shape);
        setShowProperties(true);
        return;
      }
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.1, 3));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.1, 0.5));
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedShape) {
      setShapes(shapes.filter(s => s.id !== selectedShape.id));
      
      // Notify parent of shape deletion
      if (onShapeDelete) {
        onShapeDelete(selectedShape.id);
      }
      
      setSelectedShape(null);
      setShowProperties(false);
      toast.success("Shape deleted");
    } else {
      toast.error("No shape selected");
    }
  };

  // Toggle properties panel
  const handlePropertiesToggle = () => {
    setShowProperties(prev => !prev);
  };

  return (
    <div className="h-full w-full relative">
      <div 
        ref={containerRef} 
        className={`absolute inset-0 ${isMobile ? 'mobile-canvas-container' : ''}`}
      >
        <TouchHandler
          onPan={handlePan}
          onPinch={handlePinch}
          onTap={handleTap}
          onDoubleTap={handleDoubleTap}
          onLongPress={handleLongPress}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
            onMouseLeave={(e) => handlePointerUp(e.clientX, e.clientY)}
          />
        </TouchHandler>
      </div>
      
      {isMobile && (
        <>
          <MobileToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onDelete={handleDelete}
            onPropertiesToggle={handlePropertiesToggle}
          />
          
          <div className={`mobile-properties ${showProperties ? 'open' : ''}`}>
            {selectedShape ? (
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Shape Properties</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Type: {selectedShape.type}</p>
                    {/* Display shape-specific properties */}
                    {selectedShape.type === 'circle' && (
                      <p>Radius: {(selectedShape as any).radius.toFixed(2)}</p>
                    )}
                    {selectedShape.type === 'rectangle' && (
                      <>
                        <p>Width: {(selectedShape as any).width.toFixed(2)}</p>
                        <p>Height: {(selectedShape as any).height.toFixed(2)}</p>
                      </>
                    )}
                    {/* Add more shape-specific properties here */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p>No shape selected</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
