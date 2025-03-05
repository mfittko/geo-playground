import { Rectangle } from '@/types/shapes';
import { RectangleServiceImpl } from '@/services/implementations/RectangleServiceImpl';

describe('RectangleServiceImpl', () => {
  let service: RectangleServiceImpl;
  let rectangle: Rectangle;

  beforeEach(() => {
    service = new RectangleServiceImpl();
    rectangle = {
      id: '1',
      type: 'rectangle',
      position: { x: 100, y: 100 },
      width: 200,
      height: 150,
      rotation: 0,
      selected: false,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2
    };
  });

  describe('createShape', () => {
    it('should create a rectangle with the given parameters', () => {
      const position = { x: 50, y: 50 };
      const width = 100;
      const height = 75;
      const rotation = Math.PI / 4;
      
      const result = service.createShape({
        position,
        width,
        height,
        rotation
      });
      
      expect(result.type).toBe('rectangle');
      expect(result.position).toEqual(position);
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.rotation).toBe(rotation);
      expect(result.id).toBeDefined();
      expect(result.fill).toBeDefined();
    });
  });

  describe('resizeShape', () => {
    it('should resize the rectangle by the given scale factor', () => {
      const params = { width: 300, height: 225 };
      const result = service.resizeShape(rectangle, params);
      
      expect(result.width).toBe(params.width);
      expect(result.height).toBe(params.height);
      expect(result.position).toEqual(rectangle.position);
    });
  });

  describe('rotateShape', () => {
    it('should rotate the rectangle by the given angle', () => {
      const angle = Math.PI / 2;
      const result = service.rotateShape(rectangle, angle);
      
      expect(result.rotation).toBe(rectangle.rotation + angle);
      expect(result.position).toEqual(rectangle.position);
      expect(result.width).toBe(rectangle.width);
      expect(result.height).toBe(rectangle.height);
    });
  });

  describe('moveShape', () => {
    it('should move the rectangle by the given delta', () => {
      const dx = 10;
      const dy = 20;
      const result = service.moveShape(rectangle, dx, dy);
      
      expect(result.position.x).toBe(rectangle.position.x + dx);
      expect(result.position.y).toBe(rectangle.position.y + dy);
      expect(result.width).toBe(rectangle.width);
      expect(result.height).toBe(rectangle.height);
      expect(result.rotation).toBe(rectangle.rotation);
    });
  });

  describe('getMeasurements', () => {
    it('should return correct measurements for a rectangle', () => {
      const measurements = service.getMeasurements(rectangle, 'cm');
      
      const pixelsPerCm = 60; // This is the default conversion rate in the service
      
      const widthInCm = rectangle.width / pixelsPerCm;
      const heightInCm = rectangle.height / pixelsPerCm;
      const areaInPixels = rectangle.width * rectangle.height;
      const areaInCm = areaInPixels / (pixelsPerCm * pixelsPerCm);
      
      expect(measurements.width).toBeCloseTo(widthInCm);
      expect(measurements.height).toBeCloseTo(heightInCm);
      expect(measurements.area).toBeCloseTo(areaInCm);
      expect(measurements.perimeter).toBeCloseTo(2 * (widthInCm + heightInCm));
      expect(measurements.diagonal).toBeCloseTo(
        Math.sqrt(widthInCm * widthInCm + heightInCm * heightInCm)
      );
    });
  });

  describe('updateFromMeasurement', () => {
    it('should update width correctly', () => {
      const newWidth = 300;
      const result = service.updateFromMeasurement(rectangle, 'width', newWidth, rectangle.width);
      
      expect(result.width).toBe(newWidth);
      expect(result.height).toBe(rectangle.height);
      expect(result.position).toEqual(rectangle.position);
    });
    
    it('should update height correctly', () => {
      const newHeight = 200;
      const result = service.updateFromMeasurement(rectangle, 'height', newHeight, rectangle.height);
      
      expect(result.height).toBe(newHeight);
      expect(result.width).toBe(rectangle.width);
      expect(result.position).toEqual(rectangle.position);
    });
    
    it('should update area correctly', () => {
      const newArea = 40000;
      const currentArea = rectangle.width * rectangle.height;
      const scaleFactor = Math.sqrt(newArea / currentArea);
      
      const result = service.updateFromMeasurement(rectangle, 'area', newArea, currentArea);
      
      expect(result.width).toBeCloseTo(rectangle.width * scaleFactor);
      expect(result.height).toBeCloseTo(rectangle.height * scaleFactor);
      expect(result.position).toEqual(rectangle.position);
    });
    
    it('should update perimeter correctly', () => {
      const newPerimeter = 800;
      const currentPerimeter = 2 * (rectangle.width + rectangle.height);
      const scaleFactor = newPerimeter / currentPerimeter;
      
      const result = service.updateFromMeasurement(rectangle, 'perimeter', newPerimeter, currentPerimeter);
      
      expect(result.width).toBeCloseTo(rectangle.width * scaleFactor);
      expect(result.height).toBeCloseTo(rectangle.height * scaleFactor);
      expect(result.position).toEqual(rectangle.position);
    });
    
    it('should return the original shape for unknown measurements', () => {
      const result = service.updateFromMeasurement(rectangle, 'unknown', 100, 50);
      
      expect(result).toEqual(rectangle);
    });
  });

  describe('containsPoint', () => {
    it('should return true if the point is inside the rectangle', () => {
      const point = { x: 150, y: 150 };
      
      expect(service.containsPoint(rectangle, point)).toBe(true);
    });
    
    it('should return false if the point is outside the rectangle', () => {
      const point = { x: 350, y: 350 };
      
      expect(service.containsPoint(rectangle, point)).toBe(false);
    });
  });

  describe('getShapeType', () => {
    it('should return the shape type', () => {
      expect(service.getShapeType()).toBe('rectangle');
    });
  });

  describe('updateWidth', () => {
    it('should update the width of the rectangle', () => {
      const newWidth = 300;
      const result = service.updateWidth(rectangle, newWidth);
      
      expect(result.width).toBe(newWidth);
      expect(result.height).toBe(rectangle.height);
      expect(result.position).toEqual(rectangle.position);
    });
    
    it('should not update if width is invalid', () => {
      const newWidth = -50;
      const result = service.updateWidth(rectangle, newWidth);
      
      expect(result).toEqual(rectangle);
    });
  });

  describe('updateHeight', () => {
    it('should update the height of the rectangle', () => {
      const newHeight = 200;
      const result = service.updateHeight(rectangle, newHeight);
      
      expect(result.height).toBe(newHeight);
      expect(result.width).toBe(rectangle.width);
      expect(result.position).toEqual(rectangle.position);
    });
    
    it('should not update if height is invalid', () => {
      const newHeight = -50;
      const result = service.updateHeight(rectangle, newHeight);
      
      expect(result).toEqual(rectangle);
    });
  });
});