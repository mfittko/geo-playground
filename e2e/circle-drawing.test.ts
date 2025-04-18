import { expect } from '@playwright/test';
import { test } from './test-helper';
import { Logger } from './utils/logger';

test.describe('Circle Drawing', () => {
  test('should draw a circle that stays at the drawn position', async ({ page }) => {
    // Navigate to the page and wait for it to load
    await page.goto('/');

    // Find and click the circle tool button
    const circleButton = page.locator('#circle-tool');
    await expect(circleButton).toBeVisible({ timeout: 5000 });
    
    try {
      await circleButton.click();
    } catch (_e) {
      Logger.warn('Could not click circle button, trying keyboard shortcut');
      await page.keyboard.press('c'); // Assuming 'c' is shortcut for circle
    }
    
    // Find the canvas container
    const canvasContainer = page.locator('#geometry-canvas, .canvas-container');
    await expect(canvasContainer).toBeVisible();
    
    const bounds = await canvasContainer.boundingBox();
    if (!bounds) {
      throw new Error('Could not get bounds of canvas container');
    }

    // Calculate center and draw a circle
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    // Starting position (center of circle)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    
    // Move to create circle with radius 100px
    await page.mouse.move(centerX + 100, centerY);
    await page.mouse.up();
    
    // Verify the circle is visible and in the correct position
    // We'll look for div elements with rounded borders (circles)
    const circleElements = page.locator('.rounded-full');
    await expect(circleElements).toBeVisible();
    
    // Get the position of the drawn circle
    const circleElement = circleElements.first();
    const circleBounds = await circleElement.boundingBox();
    
    if (!circleBounds) {
      throw new Error('Could not get bounds of circle element');
    }
    
    // Calculate center point of the drawn circle
    const circleCenter = {
      x: circleBounds.x + circleBounds.width / 2,
      y: circleBounds.y + circleBounds.height / 2
    };
    
    // The center of the circle should be close to where we started drawing
    expect(Math.abs(circleCenter.x - centerX)).toBeLessThan(10);
    expect(Math.abs(circleCenter.y - centerY)).toBeLessThan(10);
    
    Logger.debug(`Expected circle center: (${centerX}, ${centerY})`);
    Logger.debug(`Actual circle center: (${circleCenter.x}, ${circleCenter.y})`);
  });
}); 