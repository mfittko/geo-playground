
import { Point, Shape } from '../types/shapes';

export interface ShapeService<T extends Shape> {
  create(params: any): T;
  update(shape: T, updates: Partial<T>): T;
  move(shape: T, dx: number, dy: number): T;
  resize(shape: T, scale: number, anchor?: Point): T;
  rotate(shape: T, angle: number, center?: Point): T;
  getArea(shape: T): number;
  getPerimeter(shape: T): number;
  containsPoint(shape: T, point: Point): boolean;
  draw(ctx: CanvasRenderingContext2D, shape: T): void;
  drawSelectionOutline(ctx: CanvasRenderingContext2D, shape: T): void;
}
