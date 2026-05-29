import { FactoryMap } from "../../factory/factoryMap.ts";

// Assuming:
// import { FactoryMap } from "./factory/factoryMap.ts";
// import { Tile } from "./tile.ts";

/**
 * Iterates efficiently over a square of tiles centered at (x, y).
 * @param fm The FactoryMap instance to fetch tiles.
 * @param x The center x-coordinate.
 * @param y The center y-coordinate.
 * @param size The size of the square (e.g., 3 for a 3x3 box).
 * @param callback The function to execute on each Tile in the square.
 */
export function iterateSquare(
  x: number,
  y: number,
  size: number,
  callback: (tile: any) => void, // Using 'any' for dependency-free utility
) {
  const half = Math.floor(size / 2);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const currentX = x - half + i;
      const currentY = y - half + j;
      const tile = FactoryMap.getInstance().getTile(currentX, currentY);
      callback(tile);
    }
  }
}
