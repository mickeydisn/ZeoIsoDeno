export class Vector {
  i: number;
  j: number;
  k: number;

  constructor(i: number = 0, j: number = 0, k: number = 0) {
    this.i = i;
    this.j = j;
    this.k = k;
  }

  /**
   * Creates a vector from two points
   */
  static fromTwoPoints(
    p1: { x: number; y: number; z: number },
    p2: { x: number; y: number; z: number },
  ): Vector {
    return new Vector(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
  }

  /**
   * Computes the cross product of two vectors
   */
  static crossProduct(v1: Vector, v2: Vector): Vector {
    const i = v1.j * v2.k - v2.j * v1.k;
    const j = -1 * (v1.i * v2.k - v2.i * v1.k);
    const k = v1.i * v2.j - v2.i * v1.j;

    return new Vector(i, j, k);
  }

  /**
   * Computes the dot product of two vectors
   */
  static dotProduct(v1: Vector, v2: Vector): number {
    return v1.i * v2.i + v1.j * v2.j + v1.k * v2.k;
  }

  /**
   * Returns the magnitude (length) of the vector
   */
  magnitude(): number {
    return Math.sqrt(this.i ** 2 + this.j ** 2 + this.k ** 2);
  }

  /**
   * Returns a normalized (unit length) vector
   */
  normalize(): Vector {
    const magnitude = this.magnitude();
    return magnitude === 0
      ? new Vector(0, 0, 0)
      : new Vector(this.i / magnitude, this.j / magnitude, this.k / magnitude);
  }
}
