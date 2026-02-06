// Import Path and Point from the correct location
import { Path } from "./path.ts";
import { Point } from "./point.ts";

/**
 * Shape utility class
 *
 * An Isomer.Shape consists of a list of Isomer.Path objects.
 */
export class Shape {
  paths: Path[];

  constructor(paths: Path[] | Path[]) {
    if (Array.isArray(paths)) {
      this.paths = paths;
    } else {
      this.paths = Array.prototype.slice.call(arguments);
    }
  }

  /**
   * Pushes a path onto the end of the Shape.
   */
  push(path: Path): void {
    this.paths.push(path);
  }

  /**
   * Translates a given shape.
   */
  translate(...args: [number, number, number]): Shape {
    return new Shape(this.paths.map((path) => path.translate(...args)));
  }

  /**
   * Rotates a given shape along the X axis around a given origin.
   */
  rotateX(...args: [Point, number]): Shape {
    return new Shape(this.paths.map((path) => path.rotateX(...args)));
  }

  /**
   * Rotates a given shape along the Y axis around a given origin.
   */
  rotateY(...args: [Point, number]): Shape {
    return new Shape(this.paths.map((path) => path.rotateY(...args)));
  }

  /**
   * Rotates a given shape along the Z axis around a given origin.
   */
  rotateZ(...args: [Point, number]): Shape {
    return new Shape(this.paths.map((path) => path.rotateZ(...args)));
  }

  /**
   * Scales a shape about a given origin.
   */
  scale(...args: [Point, number]): Shape {
    return new Shape(this.paths.map((path) => path.scale(...args)));
  }

  /**
   * Orders the paths of the shape by depth.
   */
  orderedPaths(): Path[] {
    return this.paths.slice().sort((a, b) => b.depth() - a.depth());
  }

  /**
   * Utility function to extrude a 2D path into a 3D shape.
   */
  static extrude(path: Path, height = 1): Shape {
    const topPath = path.translate(0, 0, height);
    const shape = new Shape([]);

    // Push top and bottom faces
    shape.push(path.reverse());
    shape.push(topPath);

    // Push each side face
    for (let i = 0; i < path.points.length; i++) {
      shape.push(
        new Path([
          topPath.points[i],
          path.points[i],
          path.points[(i + 1) % path.points.length],
          topPath.points[(i + 1) % topPath.points.length],
        ]),
      );
    }

    return shape;
  }

  /**
   * Creates a simple surface in the SE direction.
   */
  static SurfaceSE(origin: Point, dx = 1, dy = 1, dz = 1): Shape {
    const prism = new Shape([]);

    const face1 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y, origin.z + dz),
      new Point(origin.x, origin.y, origin.z + dz),
    ]);

    prism.push(face1);
    return prism;
  }

  /**
   * Creates a simple surface in the SW direction.
   */
  static SurfaceSW(origin: Point, dx = 1, dy = 1, dz = 1): Shape {
    const prism = new Shape([]);

    const face2 = new Path([
      origin,
      new Point(origin.x, origin.y, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z),
    ]);

    prism.push(face2);
    return prism;
  }

  /**
   * Creates a flat surface parallel to the XY plane.
   */
  static SurfaceFlat(origin: Point, dx = 1, dy = 1, dz = 1): Shape {
    const prism = new Shape([]);

    const face3 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y + dy, origin.z),
      new Point(origin.x, origin.y + dy, origin.z),
    ]);

    prism.push(face3.translate(0, 0, dz));
    return prism;
  }

  /**
   * Creates a full rectangular prism.
   */
  static Prism(origin: Point, dx = 1, dy = 1, dz = 1): Shape {
    const prism = new Shape([]);

    const face1 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y, origin.z + dz),
      new Point(origin.x, origin.y, origin.z + dz),
    ]);

    prism.push(face1);
    prism.push(face1.reverse().translate(0, dy, 0));

    const face2 = new Path([
      origin,
      new Point(origin.x, origin.y, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z),
    ]);

    prism.push(face2);
    prism.push(face2.reverse().translate(dx, 0, 0));

    const face3 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y + dy, origin.z),
      new Point(origin.x, origin.y + dy, origin.z),
    ]);

    prism.push(face3.reverse());
    prism.push(face3.translate(0, 0, dz));

    return prism;
  }

  /**
   * Creates a pyramid shape.
   */
  static Pyramid(origin: Point, dx = 1, dy = 1, dz = 1): Shape {
    const pyramid = new Shape([]);

    const face1 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx / 2, origin.y + dy / 2, origin.z + dz),
    ]);

    pyramid.push(face1);
    pyramid.push(face1.rotateZ(origin.translate(dx / 2, dy / 2), Math.PI));

    const face2 = new Path([
      origin,
      new Point(origin.x + dx / 2, origin.y + dy / 2, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z),
    ]);

    pyramid.push(face2);
    pyramid.push(face2.rotateZ(origin.translate(dx / 2, dy / 2), Math.PI));

    return pyramid;
  }

  /**
   * Creates a cylinder shape.
   */
  static Cylinder(origin: Point, radius = 1, vertices = 20, height = 1): Shape {
    const circle = Path.Circle(origin, radius, vertices);
    return Shape.extrude(circle, height);
  }
}
