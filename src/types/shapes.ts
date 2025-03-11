
export interface Point {
  x: number;
  y: number;
}

export interface ShapeBase {
  id: string;
  type: ShapeType;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'line';

export interface Circle extends ShapeBase {
  type: 'circle';
  center: Point;
  radius: number;
}

export interface Rectangle extends ShapeBase {
  type: 'rectangle';
  position: Point;
  width: number;
  height: number;
  rotation: number;
}

export interface Triangle extends ShapeBase {
  type: 'triangle';
  points: [Point, Point, Point];
  rotation: number;
}

export interface Line extends ShapeBase {
  type: 'line';
  start: Point;
  end: Point;
}

export type Shape = Circle | Rectangle | Triangle | Line;

export interface ShapeCreationParams {
  [key: string]: any;
}

export interface CircleCreationParams extends ShapeCreationParams {
  center: Point;
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface RectangleCreationParams extends ShapeCreationParams {
  position: Point;
  width: number;
  height: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TriangleCreationParams extends ShapeCreationParams {
  points: [Point, Point, Point];
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface LineCreationParams extends ShapeCreationParams {
  start: Point;
  end: Point;
  stroke?: string;
  strokeWidth?: number;
}
