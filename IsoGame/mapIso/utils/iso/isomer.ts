/*
import {
  EmulatedCanvas2D,
  EmulatedCanvas2DContext,
} from "https://deno.land/x/canvas@v1.4.2/mod.ts";
*/
// import { Canvas, CanvasRenderingContext2D } from "jsr:@gfx/canvas@0.5.6";

// Define a compatible canvas type for both Deno and browser
type Canvas = OffscreenCanvas; // | import("jsr:@gfx/canvas@0.5.6").Canvas;
type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

import { Color } from "./color.ts";
import { Path } from "./path.ts";
import { Point } from "./point.ts";
import { Shape } from "./shape.ts";
import { Vector } from "./vector.ts";

// Configure the main LVL Diff factor display on the grid ( Transform real Lvl Diff to Pixel Diff)
const ISO_LVL_SCALE = 39;

export class Isomer {
  private canvas: Canvas;
  private canvasCtx: CanvasRenderingContext2D;

  private mapGridTileScale: number;
  mapGridMod: number;
  // private angle: number = 0.44721359; // Math.PI / 6.75
  private originX: number;
  private originY: number = 660; // Fixed Y-origin
  private lightPosition: Vector;
  private lightAngle: Vector;
  private colorDifference: number = 0.23;
  private lightColor: Color;
  private transformation: number[][];

  private offsetX: number;
  private offsetY: number;

  constructor(
    canvas: Canvas,
    mapGridSize: number = 30,
    mapGridTileScale: number = 1,
    mapGridMod: number = 1,
  ) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.mapGridTileScale = mapGridTileScale;
    this.mapGridMod = mapGridMod;
    this.originX = this.canvas.width / 2;
    this.originY = this.canvas.height / 2 +
      mapGridSize * 16 * this.mapGridTileScale;
    this.offsetX = 0;
    this.offsetY = 0;

    this.lightPosition = new Vector(20, -10, 30);
    this.lightAngle = this.lightPosition.normalize();
    this.lightColor = new Color(255, 255, 255);

    this.transformation = [
      [32 * this.mapGridTileScale, 16 * this.mapGridTileScale], // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
      [-32 * this.mapGridTileScale, 16 * this.mapGridTileScale], // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
    ];
    /*
    this.transformation = [
      [0 * this.mapGridTileScale, 32 * this.mapGridTileScale],
      [-32 * this.mapGridTileScale, 0 * this.mapGridTileScale],
    ]; */
    //this._calculateTransformation();
  }

  setOffset(x: number, y: number) {
    this.offsetX = x;
    this.offsetY = y;
  }
  /**
   * Sets the light position for drawing.
   */
  setLightPosition(x: number, y: number, z: number): void {
    this.lightPosition = new Vector(x, y, z);
    this.lightAngle = this.lightPosition.normalize();
  }

  /**
   * Translates a 3D point to a 2D isometric projection.
   */
  translatePoint(_point: Point): Point {
    const point = _point.translate(-this.offsetX, -this.offsetY, 0);
    const xMap = new Point(
      point.x * this.transformation[0][0],
      point.x * this.transformation[0][1],
    );

    const yMap = new Point(
      point.y * this.transformation[1][0],
      point.y * this.transformation[1][1],
    );

    const x = this.originX + xMap.x + yMap.x;
    const y = this.originY - xMap.y - yMap.y -
      point.z * ISO_LVL_SCALE / this.mapGridMod;

    return new Point(x, y);
  }

  /**
   * Adds a shape or path to the scene
   */
  add(item: Path | Shape | Path[] | Shape[], baseColor?: Color): void {
    if (Array.isArray(item)) {
      item.forEach((subItem) => this.add(subItem, baseColor));
    } else if (item instanceof Path) {
      this._addPath(item, baseColor);
    } else if (item instanceof Shape) {
      item.orderedPaths().forEach((path) => this._addPath(path, baseColor));
    }
  }

  /**
   * Adds an image to the scene
   * /
  addImage(imgSrc: string, point: Point): void {
    const image = new Image();
    image.onload = () => {
      console.log("DRAW IMAGE");
      const p = this._translatePoint(new Point(10, 10, 0));
      this.canvas.ctx.drawImage(image, p.x - 105, p.y - 142, 210, 210);
    };
    image.src = imgSrc;
  }

  /**
   * Adds a path to the scene
   */
  private _addPath(
    path: Path,
    baseColor: Color = new Color(120, 120, 120),
  ): void {
    const v1 = Vector.fromTwoPoints(path.points[1], path.points[0]);
    const v2 = Vector.fromTwoPoints(path.points[2], path.points[1]);
    const normal = Vector.crossProduct(v1, v2).normalize();

    const brightness = Vector.dotProduct(normal, this.lightAngle);
    const color = baseColor.lighten(
      brightness * this.colorDifference,
      this.lightColor,
    );
    this.canvasCtx.beginPath();
    const translatedPoints = path.points.map((p) => this.translatePoint(p));
    translatedPoints.forEach((p, index) => {
      if (index === 0) {
        this.canvasCtx.moveTo(p.x, p.y);
      } else {
        this.canvasCtx.lineTo(p.x, p.y);
      }
    });
    this.canvasCtx.closePath();
    this.canvasCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    this.canvasCtx.fill();
  }

  /**
   * Precomputes transformation values to optimize rendering
   */
  private _calculateTransformation(): void {
    this.transformation = [
      [32, 16], // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
      [-32, 16], // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
    ];
  }
}
