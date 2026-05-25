import { Shape } from "../../utils/iso/shape.ts";
import { DrawContext } from "../type.ts";
import { PointIso } from "../../utils/simpleIso/IsometricProjector.ts";


/**
 * Draws a shape's paths and optional centered text.
 * @param shape The shape to draw
 * @param fillColor Optional fill color
 * @param text Optional text to display in the center
 */
export const drawShapePaths = (
    _ctx: DrawContext,

    shape: Shape,
    fillColor?: string,
    text?: string
): void  => {
    const allProjectedPoints: { x: number; y: number }[] = [];

    shape.orderedPaths().forEach((path) => {
      const translatedPoints = path.points.map((p) => 
        _ctx.isoProject.translatePoint(new PointIso(p.x, p.y, p.z))
      );
      
      // Store points to calculate the center later
      allProjectedPoints.push(...translatedPoints);

      _ctx.canvasCtx.beginPath();
      translatedPoints.forEach((p, index) => {
        if (index === 0) {
          _ctx.canvasCtx.moveTo(p.x, p.y);
        } else {
          _ctx.canvasCtx.lineTo(p.x, p.y);
        }
      });
      _ctx.canvasCtx.closePath();
      
      if (fillColor) {
        _ctx.canvasCtx.fillStyle = fillColor;
        _ctx.canvasCtx.fill();
      }
      _ctx.canvasCtx.stroke();
    });

    // --- Draw Centered Text ---
    if (text && allProjectedPoints.length > 0) {
      // 1. Calculate the average X and Y (Centroid)
      const centerX = allProjectedPoints.reduce((sum, p) => sum + p.x, 0) / allProjectedPoints.length;
      const centerY = allProjectedPoints.reduce((sum, p) => sum + p.y, 0) / allProjectedPoints.length;

      // 2. Set text styles
      _ctx.canvasCtx.fillStyle = '#ffffff'; // Set your desired text color
      _ctx.canvasCtx.font = '14px sans-serif'; 
      _ctx.canvasCtx.textAlign = 'center';     // Horizontal centering
      _ctx.canvasCtx.textBaseline = 'middle';  // Vertical centering

      // 3. Render
      _ctx.canvasCtx.fillText(text, centerX, centerY);
    }
  }
