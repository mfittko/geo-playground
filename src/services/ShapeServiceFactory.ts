
import { ShapeType } from '../types/shapes';
import { ShapeService } from './ShapeService';
import { CircleServiceImpl } from './implementations/CircleServiceImpl';
import { RectangleServiceImpl } from './implementations/RectangleServiceImpl';
import { TriangleServiceImpl } from './implementations/TriangleServiceImpl';
import { LineServiceImpl } from './implementations/LineServiceImpl';

// Create singleton instances
const circleService = new CircleServiceImpl();
const rectangleService = new RectangleServiceImpl();
const triangleService = new TriangleServiceImpl();
const lineService = new LineServiceImpl();

export class ShapeServiceFactory {
  static getService<T>(type: ShapeType): ShapeService<T> {
    switch (type) {
      case 'circle':
        return circleService as unknown as ShapeService<T>;
      case 'rectangle':
        return rectangleService as unknown as ShapeService<T>;
      case 'triangle':
        return triangleService as unknown as ShapeService<T>;
      case 'line':
        return lineService as unknown as ShapeService<T>;
      default:
        throw new Error(`Unsupported shape type: ${type}`);
    }
  }
}
