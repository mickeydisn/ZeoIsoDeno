export type TypeDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type Point2D = {
  x: number;
  y: number;
};

export class directionVector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toDirection = (): TypeDirection | null => {
    const x = this.x;
    const y = this.y;
    return x == 0 && y == 0
      ? null
      : x > 0 && y > 0
      ? "N"
      : x > 0 && y == 0
      ? "NE"
      : x > 0 && y < 0
      ? "E"
      : x == 0 && y < 0
      ? "SE"
      : x < 0 && y < 0
      ? "S"
      : x < 0 && y == 0
      ? "SW"
      : x < 0 && y > 0
      ? "W"
      : x == 0 && y > 0
      ? "NW"
      : null;
  };

  toVecDistance = (speed: number) => {
    const x = this.x;
    const y = this.y;

    // IF MOUVE ON 2 DIRECTION on ISO => RSquare(2) * X == .70 * X
    return {
      x: y != 0 ? x * speed * .70 : x * speed,
      y: x != 0 ? y * speed * .70 : y * speed,
    };
  };
}

export class isoFloatPoint {
  fix: {
    x: number;
    y: number;
  };
  float: {
    x: number;
    y: number;
  };
  constructor(x: number, y: number) {
    this.fix = { x: Math.round(x), y: Math.round(x) };
    this.float = { x: x, y: y };
  }

  setFix(x: number, y: number) {
    this.fix = { x: Math.round(x), y: Math.round(x) };
    this.float = { x: x, y: y };
  }

  getOff() {
    return {
      x: this.fix.x - this.float.x,
      y: this.fix.y - this.float.y,
    };
  }

  getDirectionOff(direction: TypeDirection) {
    return {
      x: this.float.x - this.fix.x,
      y: this.float.y - this.fix.y,
    };
  }
}
