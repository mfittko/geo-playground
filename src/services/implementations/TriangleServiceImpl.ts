
import { v4 as uuidv4 } from 'uuid';
import { Triangle, TriangleCreationParams, Point } from '../../types/shapes';
import { ShapeService } from '../ShapeService';

export class TriangleServiceImpl implements ShapeService<Triangle> {
  create(params: TriangleCreationParams): Triangle {
    const { points, rotation = 0, ...rest } = params;
    
    return {
      id: uuidv4(),
      type: 'triangle',
      points,
      rotation,
      ...rest,
    };
  }
  
  update(triangle: Triangle, updates: Partial<Triangle>): Triangle {
    return { ...triangle, ...updates };
  }
  
  move(triangle: Triangle, dx: number, dy: number): Triangle {
    const newPoints = triangle.points.map(point => ({
      x: point.x + dx,
      y: point.y + dy,
    })) as [Point, Point, Point];
    
    return {
      ...triangle,
      points: newPoints,
    };
  }
  
  resize(triangle: Triangle, scale: number, anchor?: Point): Triangle {
    // Calculate centroid if no anchor is provided
    const center = anchor || this.getCentroid(triangle);
    
    // Calculate new points
    const newPoints = triangle.points.map(point => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      return {
        x: center.x + dx * scale,
        y: center.y + dy * scale,
      };
    }) as [Point, Point, Point];
    
    return {
      ...triangle,
      points: newPoints,
    };
  }
  
  rotate(triangle: Triangle, angle: number, center?: Point): Triangle {
    // Default center is the centroid
    const rotationCenter = center || this.getCentroid(triangle);
    
    // Convert angle to radians
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Rotate each point
    const newPoints = triangle.points.map(point => {
      const dx = point.x - rotationCenter.x;
      const dy = point.y - rotationCenter.y;
      return {
        x: rotationCenter.x + dx * cos - dy * sin,
        y: rotationCenter.y + dx * sin + dy * cos,
      };
    }) as [Point, Point, Point];
    
    return {
      ...triangle,
      points: newPoints,
      rotation: (triangle.rotation + angle) % 360,
    };
  }
  
  getArea(triangle: Triangle): number {
    const [p1, p2, p3] = triangle.points;
    return Math.abs(
      (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
    );
  }
  
  getPerimeter(triangle: Triangle): number {
    const [p1, p2, p3] = triangle.points;
    
    const side1 = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );
    const side2 = Math.sqrt(
      Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2)
    );
    const side3 = Math.sqrt(
      Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2)
    );
    
    return side1 + side2 + side3;
  }
  
  containsPoint(triangle: Triangle, point: Point): boolean {
    const [p1, p2, p3] = triangle.points;
    
    // Barycentric coordinate method
    const denominator =
      (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
    
    const a =
      ((p2.y - p3.y) * (point.x - p3.x) + (p3.x - p2.x) * (point.y - p3.y)) /
      denominator;
    const b =
      ((p3.y - p1.y) * (point.x - p3.x) + (p1.x - p3.x) * (point.y - p3.y)) /
      denominator;
    const c = 1 - a - b;
    
    return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
  }
  
  getCentroid(triangle: Triangle): Point {
    const [p1, p2, p3] = triangle.points;
    
    return {
      x: (p1.x + p2.x + p3.x) / 3,
      y: (p1.y + p2.y + p3.y) / 3,
    };
  }
  
  draw(ctx: CanvasRenderingContext2D, triangle: Triangle): void {
    const { points } = triangle;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    
    if (triangle.fill) {
      ctx.fillStyle = triangle.fill;
      ctx.fill();
    }
    
    if (triangle.stroke) {
      ctx.strokeStyle = triangle.stroke;
      ctx.lineWidth = triangle.strokeWidth || 1;
      ctx.stroke();
    }
  }
  
  drawSelectionOutline(ctx: CanvasRenderingContext2D, triangle: Triangle): void {
    const { points } = triangle;
    
    // Draw the selection outline
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.stroke();
    
    // Draw control points
    this.drawControlPoints(ctx, triangle);
  }
  
  drawControlPoints(ctx: CanvasRenderingContext2D, triangle: Triangle): void {
    const { points } = triangle;
    
    ctx.fillStyle = '#0066ff';
    
    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw centroid
    const centroid = this.getCentroid(triangle);
    ctx.beginPath();
    ctx.arc(centroid.x, centroid.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
