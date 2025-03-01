import React from 'react';
import { AnyShape, Circle, Rectangle, Triangle, Point, MeasurementUnit } from '@/types/shapes';

// Default physical measurements constants (in pixels)
// Standard 96 DPI: 1cm = 37.8px, 1mm = 3.78px, 1in = 96px
export const DEFAULT_PIXELS_PER_CM = 60;
export const DEFAULT_PIXELS_PER_MM = 6;
export const DEFAULT_PIXELS_PER_INCH = 152.4;

// Get stored calibration values from localStorage
export const getStoredPixelsPerUnit = (unit: MeasurementUnit): number => {
  const storedValue = localStorage.getItem(`pixelsPerUnit_${unit}`);
  if (storedValue) {
    return parseFloat(storedValue);
  }
  return unit === 'cm' ? DEFAULT_PIXELS_PER_CM : DEFAULT_PIXELS_PER_INCH;
};

// Convert mouse event coordinates to canvas coordinates
export const getCanvasPoint = (e: React.MouseEvent, canvasRef: React.RefObject<HTMLDivElement>): Point => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };
  
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

// Find a shape at a specific position
export const getShapeAtPosition = (point: Point, shapes: AnyShape[]): AnyShape | null => {
  // Check shapes in reverse order (top-most first)
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    
    switch (shape.type) {
      case 'circle': {
        const circle = shape as Circle;
        const distance = Math.sqrt(
          Math.pow(point.x - circle.position.x, 2) + 
          Math.pow(point.y - circle.position.y, 2)
        );
        if (distance <= circle.radius) {
          return shape;
        }
        break;
      }
      case 'rectangle': {
        const rect = shape as Rectangle;
        // Account for rotation
        const rotatedPoint = rotatePoint(
          { x: point.x, y: point.y },
          { x: rect.position.x, y: rect.position.y },
          -rect.rotation
        );
        
        if (
          rotatedPoint.x >= rect.position.x - rect.width / 2 && 
          rotatedPoint.x <= rect.position.x + rect.width / 2 && 
          rotatedPoint.y >= rect.position.y - rect.height / 2 && 
          rotatedPoint.y <= rect.position.y + rect.height / 2
        ) {
          return shape;
        }
        break;
      }
      case 'triangle': {
        const tri = shape as Triangle;
        // Account for rotation
        const rotatedPoint = rotatePoint(
          { x: point.x, y: point.y },
          { x: tri.position.x, y: tri.position.y },
          -tri.rotation
        );
        
        // Check if point is inside triangle using the triangle's points
        if (isPointInTriangle(rotatedPoint, tri.points[0], tri.points[1], tri.points[2])) {
          return shape;
        }
        break;
      }
    }
  }
  return null;
};

// Rotate a point around a center point by an angle in degrees
export const rotatePoint = (point: Point, center: Point, angleDegrees: number): Point => {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  // Translate point to origin
  const x = point.x - center.x;
  const y = point.y - center.y;
  
  // Rotate point
  const xNew = x * cos - y * sin;
  const yNew = x * sin + y * cos;
  
  // Translate point back
  return {
    x: xNew + center.x,
    y: yNew + center.y
  };
};

// Get triangle vertices based on position and rotation
export const getTriangleVertices = (triangle: Triangle): Point[] => {
  // The Triangle type already has the points defined
  const { points, position, rotation } = triangle;
  
  // Apply rotation if needed
  if (rotation !== 0) {
    return points.map(p => rotatePoint(p, position, rotation));
  }
  
  return points;
};

// Check if a point is inside a triangle using barycentric coordinates
export const isPointInTriangle = (p: Point, a: Point, b: Point, c: Point): boolean => {
  const areaABC = 0.5 * Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));
  const areaPBC = 0.5 * Math.abs((b.x - p.x) * (c.y - p.y) - (c.x - p.x) * (b.y - p.y));
  const areaPAC = 0.5 * Math.abs((p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y));
  const areaPAB = 0.5 * Math.abs((b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y));
  
  // Sum of the three sub-triangles should equal the total triangle area
  return Math.abs(areaABC - (areaPBC + areaPAC + areaPAB)) < 0.01;
}; 