
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext";
import { ServiceProvider } from "./providers/ServiceProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FormulaPointInfoTest from "./components/FormulaPointInfoTest";
import React, { useState, useEffect } from 'react';
import UnitSelector from './components/UnitSelector';
import GeometryCanvas from './components/GeometryCanvas';
import MobileToolbar from './components/MobileToolbar';
import { MeasurementUnit, AnyShape, OperationMode, Point } from '@/types/shapes';
import { useMobile } from './hooks/use-mobile';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<'rectangle' | 'circle' | 'triangle' | 'line'>('rectangle');
  const isMobile = useMobile();

  const handleUnitChange = (unit: MeasurementUnit) => {
    setMeasurementUnit(unit);
  };

  const handleShapeSelect = (id: string | null) => {
    setSelectedShapeId(id);
  };

  const handleShapeCreate = (start: Point, end: Point): string => {
    // Generate a unique ID for the new shape
    const newId = `shape-${Date.now()}`;
    
    // Create new shape based on current active shape type
    let newShape: AnyShape;
    
    switch (activeShapeType) {
      case 'circle': {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        newShape = {
          id: newId,
          type: 'circle',
          position: start,
          radius,
          rotation: 0,
          selected: false,
          fill: '#e0e0e0',
          stroke: '#000000',
          strokeWidth: 1
        };
        break;
      }
      case 'triangle': {
        // Create an equilateral triangle
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        const direction = { x: Math.sign(dx), y: Math.sign(dy) };
        
        newShape = {
          id: newId,
          type: 'triangle',
          position: start,
          points: [
            { x: 0, y: 0 },
            { x: size * direction.x, y: 0 },
            { x: size * direction.x / 2, y: size * direction.y }
          ],
          rotation: 0,
          selected: false,
          fill: '#e0e0e0',
          stroke: '#000000',
          strokeWidth: 1
        };
        break;
      }
      case 'line': {
        newShape = {
          id: newId,
          type: 'line',
          position: start,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: end.x - start.x, y: end.y - start.y },
          length: Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)),
          rotation: 0,
          selected: false,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2
        };
        break;
      }
      case 'rectangle':
      default: {
        newShape = {
          id: newId,
          type: 'rectangle',
          position: start,
          width: end.x - start.x,
          height: end.y - start.y,
          rotation: 0,
          selected: false,
          fill: '#e0e0e0',
          stroke: '#000000',
          strokeWidth: 1
        };
      }
    }
    
    setShapes([...shapes, newShape]);
    return newId;
  };

  const handleShapeMove = (id: string, newPosition: Point) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, position: newPosition } : shape
    ));
  };

  const handleShapeResize = (id: string, factor: number) => {
    setShapes(shapes.map(shape => {
      if (shape.id === id) {
        if ('width' in shape && 'height' in shape) {
          return {
            ...shape,
            width: shape.width * factor,
            height: shape.height * factor
          };
        } else if ('radius' in shape) {
          return {
            ...shape,
            radius: shape.radius * factor
          };
        } else if ('points' in shape) {
          // Scale triangle points
          return {
            ...shape,
            points: shape.points.map(point => ({
              x: point.x * factor,
              y: point.y * factor
            }))
          };
        } else if ('startPoint' in shape && 'endPoint' in shape) {
          // Scale line
          return {
            ...shape,
            endPoint: {
              x: shape.endPoint.x * factor,
              y: shape.endPoint.y * factor
            },
            length: shape.length * factor
          };
        }
      }
      return shape;
    }));
  };

  const handleShapeRotate = (id: string, angle: number) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, rotation: angle } : shape
    ));
  };

  const handleShapeDelete = (id: string) => {
    setShapes(shapes.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  };

  const handleModeChange = (mode: OperationMode) => {
    setActiveMode(mode);
  };

  const handleShapeTypeChange = (type: 'rectangle' | 'circle' | 'triangle' | 'line') => {
    setActiveShapeType(type);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfigProvider>
          <ServiceProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col h-screen p-4 md:p-6 overflow-hidden bg-gray-50">
                <div className="flex flex-wrap justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-800">Geometry Playground</h1>
                  <UnitSelector value={measurementUnit} onChange={handleUnitChange} />
                </div>
                
                {isMobile && (
                  <MobileToolbar
                    activeMode={activeMode}
                    onModeChange={handleModeChange}
                    activeShapeType={activeShapeType}
                    onShapeTypeChange={handleShapeTypeChange}
                    className="mb-4"
                  />
                )}
                
                <div className="flex-grow relative overflow-hidden">
                  <GeometryCanvas
                    width={800}
                    height={600}
                    shapes={shapes}
                    selectedShapeId={selectedShapeId}
                    activeMode={activeMode}
                    measurementUnit={measurementUnit}
                    onShapeSelect={handleShapeSelect}
                    onShapeCreate={handleShapeCreate}
                    onShapeMove={handleShapeMove}
                    onShapeResize={handleShapeResize}
                    onShapeRotate={handleShapeRotate}
                    onShapeDelete={handleShapeDelete}
                  />
                </div>
                
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/point-test" element={<FormulaPointInfoTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </ServiceProvider>
        </ConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
