export class Point {
  x: number;
  y: number;
  z: number;

  static ORIGIN = new Point(0, 0, 0);

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /** Translate a point from a given dx, dy, and dz */
  translate(dx: number = 0, dy: number = 0, dz: number = 0): Point {
    return new Point(this.x + dx, this.y + dy, this.z + dz);
  }

  /** Scale a point about a given origin */
  scale(origin: Point, dx: number, dy?: number, dz?: number): Point {
    const p = this.translate(-origin.x, -origin.y, -origin.z);

    if (dy === undefined || dz === undefined) {
      dy = dz = dx;
    } else {
      dz = dz ?? 1;
    }

    p.x *= dx;
    p.y *= dy;
    p.z *= dz;

    return p.translate(origin.x, origin.y, origin.z);
  }

  /** Rotate about origin on the X axis */
  rotateX(origin: Point, angle: number): Point {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    const z = p.z * Math.cos(angle) - p.y * Math.sin(angle);
    const y = p.z * Math.sin(angle) + p.y * Math.cos(angle);
    return new Point(p.x, y, z).translate(origin.x, origin.y, origin.z);
  }

  /** Rotate about origin on the Y axis */
  rotateY(origin: Point, angle: number): Point {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    const x = p.x * Math.cos(angle) - p.z * Math.sin(angle);
    const z = p.x * Math.sin(angle) + p.z * Math.cos(angle);
    return new Point(x, p.y, z).translate(origin.x, origin.y, origin.z);
  }

  /** Rotate about origin on the Z axis */
  rotateZ(origin: Point, angle: number): Point {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    const x = p.x * Math.cos(angle) - p.y * Math.sin(angle);
    const y = p.x * Math.sin(angle) + p.y * Math.cos(angle);
    return new Point(x, y, p.z).translate(origin.x, origin.y, origin.z);
  }

  /** The depth of a point in the isometric plane */
  depth(): number {
    return this.x + this.y - 2 * this.z;
  }

  /** Distance between two points */
  static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
