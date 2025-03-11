
import { Point } from '../../types/shapes';

// Function to rotate a point around a center
export function rotatePoint(point: Point, center: Point, angleInDegrees: number): Point {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const cos = Math.cos(angleInRadians);
  const sin = Math.sin(angleInRadians);
  
  // Translate point to origin
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  // Rotate point
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;
  
  // Translate back
  return {
    x: rotatedX + center.x,
    y: rotatedY + center.y,
  };
}

// Function to calculate the distance between two points
export function distanceBetweenPoints(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Function to check if a point is inside a polygon
export function isPointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const intersect =
      vertices[i].y > point.y !== vertices[j].y > point.y &&
      point.x <
        ((vertices[j].x - vertices[i].x) * (point.y - vertices[i].y)) /
          (vertices[j].y - vertices[i].y) +
          vertices[i].x;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
