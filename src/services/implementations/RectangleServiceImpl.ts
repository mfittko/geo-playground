
import { v4 as uuidv4 } from 'uuid';
import { Rectangle, RectangleCreationParams, Point } from '../../types/shapes';
import { ShapeService } from '../ShapeService';

export class RectangleServiceImpl implements ShapeService<Rectangle> {
  create(params: RectangleCreationParams): Rectangle {
    const { position, width, height, rotation = 0, ...rest } = params;
    
    return {
      id: uuidv4(),
      type: 'rectangle',
      position,
      width: Math.max(width, 1),
      height: Math.max(height, 1),
      rotation,
      ...rest,
    };
  }
  
  update(rectangle: Rectangle, updates: Partial<Rectangle>): Rectangle {
    return { ...rectangle, ...updates };
  }
  
  move(rectangle: Rectangle, dx: number, dy: number): Rectangle {
    return {
      ...rectangle,
      position: {
        x: rectangle.position.x + dx,
        y: rectangle.position.y + dy,
      },
    };
  }
  
  resize(rectangle: Rectangle, scale: number, anchor?: Point): Rectangle {
    const { position, width, height } = rectangle;
    
    // Default anchor is the center
    const center = anchor || {
      x: position.x + width / 2,
      y: position.y + height / 2,
    };
    
    // Calculate new position if resizing from an anchor point
    let newPosition = { ...position };
    if (anchor) {
      const topLeft = position;
      const dx = topLeft.x - anchor.x;
      const dy = topLeft.y - anchor.y;
      newPosition = {
        x: anchor.x + dx * scale,
        y: anchor.y + dy * scale,
      };
    }
    
    return {
      ...rectangle,
      position: newPosition,
      width: Math.max(width * scale, 1),
      height: Math.max(height * scale, 1),
    };
  }
  
  rotate(rectangle: Rectangle, angle: number, center?: Point): Rectangle {
    const newAngle = (rectangle.rotation + angle) % 360;
    
    // If rotating around the rectangle center, just update the rotation
    if (!center) {
      return {
        ...rectangle,
        rotation: newAngle,
      };
    }
    
    // Calculate rectangle center
    const rectCenter = {
      x: rectangle.position.x + rectangle.width / 2,
      y: rectangle.position.y + rectangle.height / 2,
    };
    
    // Calculate the new center after rotation
    const radian = (angle * Math.PI) / 180;
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    const dx = rectCenter.x - center.x;
    const dy = rectCenter.y - center.y;
    
    const newCenter = {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
    
    // Calculate new top-left position
    const newTopLeft = {
      x: newCenter.x - rectangle.width / 2,
      y: newCenter.y - rectangle.height / 2,
    };
    
    return {
      ...rectangle,
      position: newTopLeft,
      rotation: newAngle,
    };
  }
  
  getArea(rectangle: Rectangle): number {
    return rectangle.width * rectangle.height;
  }
  
  getPerimeter(rectangle: Rectangle): number {
    return 2 * (rectangle.width + rectangle.height);
  }
  
  containsPoint(rectangle: Rectangle, point: Point): boolean {
    // For non-rotated rectangles, it's a simple bounds check
    if (rectangle.rotation === 0) {
      return (
        point.x >= rectangle.position.x &&
        point.x <= rectangle.position.x + rectangle.width &&
        point.y >= rectangle.position.y &&
        point.y <= rectangle.position.y + rectangle.height
      );
    }
    
    // For rotated rectangles, transform the point
    const center = {
      x: rectangle.position.x + rectangle.width / 2,
      y: rectangle.position.y + rectangle.height / 2,
    };
    
    // Translate point to origin
    const translatedPoint = {
      x: point.x - center.x,
      y: point.y - center.y,
    };
    
    // Rotate point in the opposite direction
    const radians = (-rectangle.rotation * Math.PI) / 180;
    const rotatedPoint = {
      x: translatedPoint.x * Math.cos(radians) - translatedPoint.y * Math.sin(radians),
      y: translatedPoint.x * Math.sin(radians) + translatedPoint.y * Math.cos(radians),
    };
    
    // Translate back
    const finalPoint = {
      x: rotatedPoint.x + center.x,
      y: rotatedPoint.y + center.y,
    };
    
    // Now do a simple bounds check
    return (
      finalPoint.x >= rectangle.position.x &&
      finalPoint.x <= rectangle.position.x + rectangle.width &&
      finalPoint.y >= rectangle.position.y &&
      finalPoint.y <= rectangle.position.y + rectangle.height
    );
  }
  
  draw(ctx: CanvasRenderingContext2D, rectangle: Rectangle): void {
    const { position, width, height, rotation = 0 } = rectangle;
    
    ctx.save();
    
    // Translate to the center of the rectangle
    const centerX = position.x + width / 2;
    const centerY = position.y + height / 2;
    ctx.translate(centerX, centerY);
    
    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw the rectangle centered at the origin
    if (rectangle.fill) {
      ctx.fillStyle = rectangle.fill;
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }
    
    if (rectangle.stroke) {
      ctx.strokeStyle = rectangle.stroke;
      ctx.lineWidth = rectangle.strokeWidth || 1;
      ctx.strokeRect(-width / 2, -height / 2, width, height);
    }
    
    ctx.restore();
  }
  
  drawSelectionOutline(ctx: CanvasRenderingContext2D, rectangle: Rectangle): void {
    const { position, width, height, rotation = 0 } = rectangle;
    
    ctx.save();
    
    // Translate to the center of the rectangle
    const centerX = position.x + width / 2;
    const centerY = position.y + height / 2;
    ctx.translate(centerX, centerY);
    
    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw the selection rectangle
    ctx.strokeRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10);
    
    // Draw control points
    this.drawControlPoints(ctx, width, height);
    
    ctx.restore();
  }
  
  drawControlPoints(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    ctx.fillStyle = '#0066ff';
    
    // Draw corner points
    ctx.beginPath();
    ctx.arc(-halfWidth, -halfHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(halfWidth, -halfHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(-halfWidth, halfHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(halfWidth, halfHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw midpoint of sides
    ctx.beginPath();
    ctx.arc(0, -halfHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(-halfWidth, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(halfWidth, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, halfHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw center
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw rotation handle
    ctx.beginPath();
    ctx.moveTo(0, -halfHeight);
    ctx.lineTo(0, -halfHeight - 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, -halfHeight - 20, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
