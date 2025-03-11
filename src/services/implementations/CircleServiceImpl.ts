
import { v4 as uuidv4 } from 'uuid';
import { Circle, CircleCreationParams, Point } from '../../types/shapes';
import { ShapeService } from '../ShapeService';

export class CircleServiceImpl implements ShapeService<Circle> {
  create(params: CircleCreationParams): Circle {
    const { center, radius, ...rest } = params;
    
    return {
      id: uuidv4(),
      type: 'circle',
      center,
      radius: Math.max(radius, 1),
      ...rest,
    };
  }
  
  update(circle: Circle, updates: Partial<Circle>): Circle {
    return { ...circle, ...updates };
  }
  
  move(circle: Circle, dx: number, dy: number): Circle {
    return {
      ...circle,
      center: {
        x: circle.center.x + dx,
        y: circle.center.y + dy,
      },
    };
  }
  
  resize(circle: Circle, scale: number, anchor?: Point): Circle {
    const center = anchor || circle.center;
    
    // Calculate new center if resizing from an anchor point
    let newCenter = { ...circle.center };
    if (anchor) {
      const dx = circle.center.x - anchor.x;
      const dy = circle.center.y - anchor.y;
      newCenter = {
        x: anchor.x + dx * scale,
        y: anchor.y + dy * scale,
      };
    }
    
    return {
      ...circle,
      center: newCenter,
      radius: Math.max(circle.radius * scale, 1),
    };
  }
  
  rotate(circle: Circle, angle: number, center?: Point): Circle {
    // Rotation doesn't visibly change a circle, but we'll update the rotation property
    return { ...circle };
  }
  
  getArea(circle: Circle): number {
    return Math.PI * circle.radius * circle.radius;
  }
  
  getPerimeter(circle: Circle): number {
    return 2 * Math.PI * circle.radius;
  }
  
  containsPoint(circle: Circle, point: Point): boolean {
    const dx = point.x - circle.center.x;
    const dy = point.y - circle.center.y;
    const distanceSquared = dx * dx + dy * dy;
    
    return distanceSquared <= circle.radius * circle.radius;
  }
  
  draw(ctx: CanvasRenderingContext2D, circle: Circle): void {
    ctx.beginPath();
    ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
    
    if (circle.fill) {
      ctx.fillStyle = circle.fill;
      ctx.fill();
    }
    
    if (circle.stroke) {
      ctx.strokeStyle = circle.stroke;
      ctx.lineWidth = circle.strokeWidth || 1;
      ctx.stroke();
    }
  }
  
  drawSelectionOutline(ctx: CanvasRenderingContext2D, circle: Circle): void {
    ctx.beginPath();
    ctx.arc(circle.center.x, circle.center.y, circle.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw control points
    this.drawControlPoints(ctx, circle);
  }
  
  drawControlPoints(ctx: CanvasRenderingContext2D, circle: Circle): void {
    const { x, y } = circle.center;
    const r = circle.radius;
    
    // Draw center point
    ctx.fillStyle = '#0066ff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cardinal points on the circle
    ctx.beginPath();
    ctx.arc(x + r, y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x - r, y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x, y + r, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x, y - r, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
