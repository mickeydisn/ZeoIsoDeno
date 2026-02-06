import { Point } from "./point.ts";

/**
 * Path utility class
 *
 * An Isomer.Path consists of a list of Isomer.Point's
 */
export class Path {
  points: Point[];

  constructor(points: Point[] | Point[] = []) {
    if (Array.isArray(points)) {
      this.points = points;
    } else {
      this.points = Array.from(arguments);
    }
  }

  /** Pushes a point onto the end of the path */
  push(point: Point): void {
    this.points.push(point);
  }

  /** Returns a new path with the points in reverse order */
  reverse(): Path {
    return new Path([...this.points].reverse());
  }

  /** Translates a given path */
  translate(x: number, y: number, z: number): Path {
    return new Path(this.points.map((point) => point.translate(x, y, z)));
  }

  /** Rotates along the X axis */
  rotateX(origin: Point, angle: number): Path {
    return new Path(this.points.map((point) => point.rotateX(origin, angle)));
  }

  /** Rotates along the Y axis */
  rotateY(origin: Point, angle: number): Path {
    return new Path(this.points.map((point) => point.rotateY(origin, angle)));
  }

  /** Rotates along the Z axis */
  rotateZ(origin: Point, angle: number): Path {
    return new Path(this.points.map((point) => point.rotateZ(origin, angle)));
  }

  /** Scales the path about a given origin */
  scale(origin: Point, factor: number): Path {
    return new Path(this.points.map((point) => point.scale(origin, factor)));
  }

  /** The estimated depth of a path as defined by the average depth of its points */
  depth(): number {
    return this.points.reduce((sum, point) => sum + point.depth(), 0) /
      (this.points.length || 1);
  }

  /** A rectangle with the bottom-left corner in the origin */
  static Rectangle(origin: Point, width: number = 1, height: number = 1): Path {
    return new Path([
      origin,
      new Point(origin.x + width, origin.y, origin.z),
      new Point(origin.x + width, origin.y + height, origin.z),
      new Point(origin.x, origin.y + height, origin.z),
    ]);
  }

  /** A circle centered at origin with a given radius and number of vertices */
  static Circle(origin: Point, radius: number, vertices: number = 20): Path {
    const path = new Path();
    for (let i = 0; i < vertices; i++) {
      path.push(
        new Point(
          radius * Math.cos(i * 2 * Math.PI / vertices),
          radius * Math.sin(i * 2 * Math.PI / vertices),
          0,
        ),
      );
    }
    return path.translate(origin.x, origin.y, origin.z);
  }

  /** A star centered at origin with a given outer radius, inner radius, and number of points */
  static Star(
    origin: Point,
    outerRadius: number,
    innerRadius: number,
    points: number,
  ): Path {
    const path = new Path();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      path.push(
        new Point(
          r * Math.cos(i * Math.PI / points),
          r * Math.sin(i * Math.PI / points),
          0,
        ),
      );
    }
    return path.translate(origin.x, origin.y, origin.z);
  }
}
