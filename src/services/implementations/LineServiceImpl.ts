
import { v4 as uuidv4 } from 'uuid';
import { Line, LineCreationParams, Point } from '../../types/shapes';
import { ShapeService } from '../ShapeService';

export class LineServiceImpl implements ShapeService<Line> {
  create(params: LineCreationParams): Line {
    const { start, end, ...rest } = params;
    
    return {
      id: uuidv4(),
      type: 'line',
      start,
      end,
      ...rest,
    };
  }
  
  update(line: Line, updates: Partial<Line>): Line {
    return { ...line, ...updates };
  }
  
  move(line: Line, dx: number, dy: number): Line {
    return {
      ...line,
      start: {
        x: line.start.x + dx,
        y: line.start.y + dy,
      },
      end: {
        x: line.end.x + dx,
        y: line.end.y + dy,
      },
    };
  }
  
  resize(line: Line, scale: number, anchor?: Point): Line {
    // Default anchor is the midpoint of the line
    const center = anchor || this.getMidpoint(line);
    
    // Calculate new endpoints
    const newStart = {
      x: center.x + (line.start.x - center.x) * scale,
      y: center.y + (line.start.y - center.y) * scale,
    };
    
    const newEnd = {
      x: center.x + (line.end.x - center.x) * scale,
      y: center.y + (line.end.y - center.y) * scale,
    };
    
    return {
      ...line,
      start: newStart,
      end: newEnd,
    };
  }
  
  rotate(line: Line, angle: number, center?: Point): Line {
    // Default center is the midpoint of the line
    const rotationCenter = center || this.getMidpoint(line);
    
    // Convert angle to radians
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Rotate the endpoints
    const newStart = {
      x: rotationCenter.x + (line.start.x - rotationCenter.x) * cos - (line.start.y - rotationCenter.y) * sin,
      y: rotationCenter.y + (line.start.x - rotationCenter.x) * sin + (line.start.y - rotationCenter.y) * cos,
    };
    
    const newEnd = {
      x: rotationCenter.x + (line.end.x - rotationCenter.x) * cos - (line.end.y - rotationCenter.y) * sin,
      y: rotationCenter.y + (line.end.x - rotationCenter.x) * sin + (line.end.y - rotationCenter.y) * cos,
    };
    
    return {
      ...line,
      start: newStart,
      end: newEnd,
    };
  }
  
  getArea(line: Line): number {
    return 0; // A line has no area
  }
  
  getPerimeter(line: Line): number {
    return this.getLength(line);
  }
  
  getLength(line: Line): number {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  getMidpoint(line: Line): Point {
    return {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2,
    };
  }
  
  containsPoint(line: Line, point: Point): boolean {
    const { start, end } = line;
    
    // Calculate the distance between point and line segment
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;
    
    // Calculate the projection of the point onto the line
    const t =
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length);
    
    // If t < 0, closest point is start; if t > 1, closest point is end
    if (t < 0 || t > 1) return false;
    
    // Calculate the closest point on the line segment
    const closestX = start.x + t * dx;
    const closestY = start.y + t * dy;
    
    // Calculate the distance between the point and the closest point
    const distanceX = point.x - closestX;
    const distanceY = point.y - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // Check if the distance is less than a threshold
    return distance <= 10; // Adjust threshold as needed for touch devices
  }
  
  draw(ctx: CanvasRenderingContext2D, line: Line): void {
    const { start, end } = line;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    if (line.stroke) {
      ctx.strokeStyle = line.stroke;
      ctx.lineWidth = line.strokeWidth || 1;
      ctx.stroke();
    }
  }
  
  drawSelectionOutline(ctx: CanvasRenderingContext2D, line: Line): void {
    const { start, end } = line;
    
    // Draw the selection line with an offset
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpAngle = angle + Math.PI / 2;
    const offset = 3;
    
    const offsetX = offset * Math.cos(perpAngle);
    const offsetY = offset * Math.sin(perpAngle);
    
    ctx.beginPath();
    ctx.moveTo(start.x + offsetX, start.y + offsetY);
    ctx.lineTo(end.x + offsetX, end.y + offsetY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(start.x - offsetX, start.y - offsetY);
    ctx.lineTo(end.x - offsetX, end.y - offsetY);
    ctx.stroke();
    
    // Draw control points
    this.drawControlPoints(ctx, line);
  }
  
  drawControlPoints(ctx: CanvasRenderingContext2D, line: Line): void {
    const { start, end } = line;
    
    ctx.fillStyle = '#0066ff';
    
    // Draw endpoints
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw midpoint
    const midpoint = this.getMidpoint(line);
    ctx.beginPath();
    ctx.arc(midpoint.x, midpoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
