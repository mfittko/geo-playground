import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  AnyShape, Circle, Rectangle, Triangle, Point, ShapeType, OperationMode, MeasurementUnit
} from '@/types/shapes';
import { toast } from 'sonner';

// Helper functions for shape calculations
const generateId = (): string => Math.random().toString(36).substring(2, 9);

const distanceBetweenPoints = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const calculateTriangleArea = (points: [Point, Point, Point]): number => {
  const [a, b, c] = points;
  return 0.5 * Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)));
};

// Helper function to calculate triangle height
const calculateTriangleHeight = (points: [Point, Point, Point], base: number): number => {
  // Area = 0.5 * base * height, so height = 2 * area / base
  const area = calculateTriangleArea(points);
  return (2 * area) / base;
};

// Helper function to calculate triangle angles in degrees
const calculateTriangleAngles = (a: number, b: number, c: number): [number, number, number] => {
  // Law of cosines: cos(A) = (b² + c² - a²) / (2bc)
  const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * (180 / Math.PI);
  const angleB = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * (180 / Math.PI);
  const angleC = 180 - angleA - angleB; // Sum of angles in a triangle is 180°
  
  return [angleA, angleB, angleC];
};

// Default pixel to physical unit conversion (standard 96 DPI: 1cm = 37.8px)
const DEFAULT_PIXELS_PER_CM = 60;
// 1 inch = 96px on standard DPI screens
const DEFAULT_PIXELS_PER_INCH = 152.4;

// Helper to get calibrated values from localStorage
const getStoredPixelsPerUnit = (unit: MeasurementUnit): number => {
  const storedValue = localStorage.getItem(`pixelsPerUnit_${unit}`);
  if (storedValue) {
    return parseFloat(storedValue);
  }
  return unit === 'cm' ? DEFAULT_PIXELS_PER_CM : DEFAULT_PIXELS_PER_INCH;
};

// Conversion between units
const cmToInches = (cm: number): number => cm / 2.54;
const inchesToCm = (inches: number): number => inches * 2.54;

// Default shape properties
const DEFAULT_FILL = 'rgba(190, 227, 219, 0.5)';
const DEFAULT_STROKE = '#555B6E';
const DEFAULT_STROKE_WIDTH = 2;

export function useShapeOperations() {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // Get the calibrated pixels per unit values - add a dependency to force refresh
  const [refreshCalibration, setRefreshCalibration] = useState(0);
  
  // Force refresh of calibration values when component mounts
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, []);
  
  // Get the calibrated pixels per unit values with refresh dependency
  const pixelsPerCm = useMemo(() => getStoredPixelsPerUnit('cm'), [refreshCalibration]);
  const pixelsPerInch = useMemo(() => getStoredPixelsPerUnit('in'), [refreshCalibration]);
  
  // Dynamic conversion functions that use the calibrated values
  const pixelsToCm = useCallback((pixels: number): number => {
    return pixels / pixelsPerCm;
  }, [pixelsPerCm]);
  
  const pixelsToInches = useCallback((pixels: number): number => {
    return pixels / pixelsPerInch;
  }, [pixelsPerInch]);
  
  const createShape = useCallback((startPoint: Point, endPoint: Point) => {
    const id = generateId();
    let newShape: AnyShape;
    
    switch (activeShapeType) {
      case 'circle': {
        const radius = distanceBetweenPoints(startPoint, endPoint);
        newShape = {
          id,
          type: 'circle',
          position: { ...startPoint },
          radius,
          rotation: 0,
          selected: true,
          fill: DEFAULT_FILL,
          stroke: DEFAULT_STROKE,
          strokeWidth: DEFAULT_STROKE_WIDTH
        };
        break;
      }
      case 'rectangle': {
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        const position = {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y)
        };
        newShape = {
          id,
          type: 'rectangle',
          position,
          width,
          height,
          rotation: 0,
          selected: true,
          fill: DEFAULT_FILL,
          stroke: DEFAULT_STROKE,
          strokeWidth: DEFAULT_STROKE_WIDTH
        };
        break;
      }
      case 'triangle': {
        // Create a true right-angled triangle with a 90-degree angle at the top
        
        // Calculate the width based on the horizontal distance
        const width = Math.abs(endPoint.x - startPoint.x) * 1.2;
        
        // Determine the direction of the drag (left-to-right or right-to-left)
        const isRightward = endPoint.x >= startPoint.x;
        
        // Calculate the midpoint between start and end points (horizontal only)
        const midX = (startPoint.x + endPoint.x) / 2;
        const topY = Math.min(startPoint.y, endPoint.y) - width/4;
        
        // Create the right angle at the top point (p1)
        const p1 = { 
          x: midX,
          y: topY
        }; // Top point with right angle
        
        // Create the other two points to form a right-angled triangle
        // For a right angle at p1, we need the vectors p1->p2 and p1->p3 to be perpendicular
        
        // Point directly below p1
        const p2 = {
          x: midX,
          y: topY + width
        };
        
        // Point to the right or left of p1 depending on drag direction
        const p3 = {
          x: isRightward ? midX + width : midX - width,
          y: topY
        };
        
        // The position is the center of the triangle
        const position = {
          x: (p1.x + p2.x + p3.x) / 3,
          y: (p1.y + p2.y + p3.y) / 3
        };
        
        newShape = {
          id,
          type: 'triangle',
          position,
          points: [p1, p2, p3],
          rotation: 0,
          selected: true,
          fill: DEFAULT_FILL,
          stroke: DEFAULT_STROKE,
          strokeWidth: DEFAULT_STROKE_WIDTH
        };
        break;
      }
      default:
        throw new Error(`Unsupported shape type: ${activeShapeType}`);
    }
    
    setShapes(prevShapes => [...prevShapes, newShape]);
    setSelectedShapeId(id);
    toast.success(`${activeShapeType} created!`);
    return id;
  }, [activeShapeType]);
  
  const selectShape = useCallback((id: string | null) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => ({
        ...shape,
        selected: shape.id === id
      }))
    );
    setSelectedShapeId(id);
  }, []);
  
  const moveShape = useCallback((id: string, newPosition: Point) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => {
        if (shape.id !== id) return shape;
        
        if (shape.type === 'triangle') {
          // For triangles, we need to update each point
          const tri = shape as Triangle;
          const deltaX = newPosition.x - tri.position.x;
          const deltaY = newPosition.y - tri.position.y;
          
          // Move each point by the same delta
          const newPoints: [Point, Point, Point] = [
            { x: tri.points[0].x + deltaX, y: tri.points[0].y + deltaY },
            { x: tri.points[1].x + deltaX, y: tri.points[1].y + deltaY },
            { x: tri.points[2].x + deltaX, y: tri.points[2].y + deltaY }
          ];
          
          return {
            ...shape,
            position: newPosition,
            points: newPoints
          };
        }
        
        // For other shapes, just update the position
        return { ...shape, position: newPosition };
      })
    );
  }, []);
  
  const resizeShape = useCallback((id: string, factor: number) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => {
        if (shape.id !== id) return shape;
        
        switch (shape.type) {
          case 'circle':
            return {
              ...shape,
              radius: (shape as Circle).radius * factor
            };
          case 'rectangle':
            return {
              ...shape,
              width: (shape as Rectangle).width * factor,
              height: (shape as Rectangle).height * factor
            };
          case 'triangle': {
            const triangle = shape as Triangle;
            const center = triangle.position;
            const newPoints = triangle.points.map(point => ({
              x: center.x + (point.x - center.x) * factor,
              y: center.y + (point.y - center.y) * factor
            })) as [Point, Point, Point];
            
            return {
              ...triangle,
              points: newPoints
            };
          }
          default:
            return shape;
        }
      })
    );
  }, []);
  
  const rotateShape = useCallback((id: string, angle: number) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => 
        shape.id === id 
          ? { ...shape, rotation: angle } 
          : shape
      )
    );
  }, []);
  
  const deleteShape = useCallback((id: string) => {
    setShapes(prevShapes => prevShapes.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
    toast.info("Shape deleted");
  }, [selectedShapeId]);
  
  const deleteAllShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
    toast.info("All shapes cleared");
  }, []);
  
  const getShapeMeasurements = useCallback((shape: AnyShape) => {
    switch (shape.type) {
      case 'circle': {
        const circle = shape as Circle;
        const radiusCm = pixelsToCm(circle.radius);
        const radiusInches = pixelsToInches(circle.radius);
        
        if (measurementUnit === 'cm') {
          const areaCm = Math.PI * Math.pow(radiusCm, 2);
          const perimeterCm = 2 * Math.PI * radiusCm;
          return {
            radius: radiusCm.toFixed(2),
            diameter: (radiusCm * 2).toFixed(2),
            area: areaCm.toFixed(2),
            perimeter: perimeterCm.toFixed(2)
          };
        } else {
          const areaInches = Math.PI * Math.pow(radiusInches, 2);
          const perimeterInches = 2 * Math.PI * radiusInches;
          return {
            radius: radiusInches.toFixed(2),
            diameter: (radiusInches * 2).toFixed(2),
            area: areaInches.toFixed(2),
            perimeter: perimeterInches.toFixed(2)
          };
        }
      }
      case 'rectangle': {
        const rect = shape as Rectangle;
        const widthCm = pixelsToCm(rect.width);
        const heightCm = pixelsToCm(rect.height);
        const widthInches = pixelsToInches(rect.width);
        const heightInches = pixelsToInches(rect.height);
        
        if (measurementUnit === 'cm') {
          const areaCm = widthCm * heightCm;
          const perimeterCm = 2 * (widthCm + heightCm);
          return {
            width: widthCm.toFixed(2),
            height: heightCm.toFixed(2),
            area: areaCm.toFixed(2),
            perimeter: perimeterCm.toFixed(2)
          };
        } else {
          const areaInches = widthInches * heightInches;
          const perimeterInches = 2 * (widthInches + heightInches);
          return {
            width: widthInches.toFixed(2),
            height: heightInches.toFixed(2),
            area: areaInches.toFixed(2),
            perimeter: perimeterInches.toFixed(2)
          };
        }
      }
      case 'triangle': {
        const tri = shape as Triangle;
        
        // Calculate side lengths in pixels first
        const side1Px = distanceBetweenPoints(tri.points[0], tri.points[1]);
        const side2Px = distanceBetweenPoints(tri.points[1], tri.points[2]);
        const side3Px = distanceBetweenPoints(tri.points[2], tri.points[0]);
        
        // Calculate area in pixels
        const areaPx = calculateTriangleArea(tri.points);
        
        // Calculate height using the longest side as base
        const basePx = Math.max(side1Px, side2Px, side3Px);
        const heightPx = calculateTriangleHeight(tri.points, basePx);
        
        // Calculate angles
        const angles = calculateTriangleAngles(side1Px, side2Px, side3Px);
        const anglesStr = angles.map(angle => angle.toFixed(1)).join('° + ') + '°';
        
        if (measurementUnit === 'cm') {
          // Convert to centimeters
          const side1Cm = pixelsToCm(side1Px);
          const side2Cm = pixelsToCm(side2Px);
          const side3Cm = pixelsToCm(side3Px);
          
          // Convert area px² to cm²
          const areaCm = pixelsToCm(areaPx) * pixelsToCm(1);
          const perimeterCm = side1Cm + side2Cm + side3Cm;
          const heightCm = pixelsToCm(heightPx);
          
          return {
            side1: side1Cm.toFixed(2),
            side2: side2Cm.toFixed(2),
            side3: side3Cm.toFixed(2),
            area: areaCm.toFixed(2),
            perimeter: perimeterCm.toFixed(2),
            height: heightCm.toFixed(2),
            angles: anglesStr
          };
        } else {
          // Convert to inches
          const side1Inches = pixelsToInches(side1Px);
          const side2Inches = pixelsToInches(side2Px);
          const side3Inches = pixelsToInches(side3Px);
          
          // Convert area px² to in²
          const areaInches = pixelsToInches(areaPx) * pixelsToInches(1);
          const perimeterInches = side1Inches + side2Inches + side3Inches;
          const heightInches = pixelsToInches(heightPx);
          
          return {
            side1: side1Inches.toFixed(2),
            side2: side2Inches.toFixed(2),
            side3: side3Inches.toFixed(2),
            area: areaInches.toFixed(2),
            perimeter: perimeterInches.toFixed(2),
            height: heightInches.toFixed(2),
            angles: anglesStr
          };
        }
      }
      default:
        return {};
    }
  }, [measurementUnit, pixelsToCm, pixelsToInches]);
  
  const getSelectedShape = useCallback(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);
  
  // Function to update shape based on measurement values
  const updateShapeFromMeasurement = useCallback((key: string, value: string) => {
    if (!selectedShapeId) return;
    
    // Parse the input value to a number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    
    setShapes(prevShapes => 
      prevShapes.map(shape => {
        if (shape.id !== selectedShapeId) return shape;
        
        // Convert from display units (cm/in) to pixels
        const toPixels = measurementUnit === 'cm' 
          ? (val: number) => val * pixelsPerCm 
          : (val: number) => val * pixelsPerInch;
        
        switch (shape.type) {
          case 'circle': {
            const circle = shape as Circle;
            
            if (key === 'radius') {
              return {
                ...circle,
                radius: toPixels(numValue)
              };
            } else if (key === 'diameter') {
              return {
                ...circle,
                radius: toPixels(numValue / 2)
              };
            }
            return circle;
          }
          case 'rectangle': {
            const rect = shape as Rectangle;
            
            if (key === 'width') {
              return {
                ...rect,
                width: toPixels(numValue)
              };
            } else if (key === 'height') {
              return {
                ...rect,
                height: toPixels(numValue)
              };
            }
            return rect;
          }
          case 'triangle': {
            const tri = shape as Triangle;
            
            // For triangles, we only allow editing side lengths
            // This is more complex as we need to maintain the triangle's shape
            if (key === 'side1' || key === 'side2' || key === 'side3') {
              const index = parseInt(key.slice(-1)) - 1;
              if (index >= 0 && index < 3) {
                // Get the current side length
                const p1 = tri.points[index];
                const p2 = tri.points[(index + 1) % 3];
                const currentLength = distanceBetweenPoints(p1, p2);
                
                // Calculate the scale factor
                const pixelValue = toPixels(numValue);
                const scaleFactor = pixelValue / currentLength;
                
                // Scale the triangle from its center
                const center = tri.position;
                const newPoints = tri.points.map(point => ({
                  x: center.x + (point.x - center.x) * scaleFactor,
                  y: center.y + (point.y - center.y) * scaleFactor
                })) as [Point, Point, Point];
                
                return {
                  ...tri,
                  points: newPoints
                };
              }
            }
            return tri;
          }
          default:
            return shape;
        }
      })
    );
    
    toast.success("Shape updated");
  }, [selectedShapeId, measurementUnit, pixelsPerCm, pixelsPerInch, distanceBetweenPoints]);
  
  return {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
    measurementUnit,
    setMeasurementUnit,
    dragStart,
    setDragStart,
    createShape,
    selectShape,
    moveShape,
    resizeShape,
    rotateShape,
    deleteShape,
    deleteAllShapes,
    setActiveMode,
    setActiveShapeType,
    getShapeMeasurements,
    getSelectedShape,
    updateShapeFromMeasurement
  };
}
