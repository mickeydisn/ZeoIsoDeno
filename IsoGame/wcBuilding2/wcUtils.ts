import {
  WcConfRawGroup,
  WcConfRawTile,
  WcConfTile,
  WcConfTileAsset,
  WcConfTileFunction,
} from "./AbstractBuildConf.ts";
import { WcFace } from "./wcBuildFace.ts";

// ---------------------------------------------
// ---------------------------------------------

export const confsGroup_to_confsTile = (
  confs: WcConfRawGroup[],
): WcConfTile[] => {
  const flatConfs = confs.map((conf) =>
    conf.items.map((i) => ({ ...i, face: conf.face } as WcConfTile))
  ).flat();
  return flatConfs.map((conf) => confRawTile_to_confsTile(conf)).flat();
};

export const confsRawTile_to_confsTile = (
  confs: WcConfTile[],
): WcConfTile[] => {
  return confs.flatMap((conf) => confRawTile_to_confsTile(conf));
};
// ---------------------------------------------

export const confRawTile_to_confsTile = (conf: WcConfTile): WcConfTile[] => {
  const DIRECTIONS = ["_NW", "_NE", "_SE", "_SW"];

  // Implement shifting internally to remove dependency
  const shiftArrayByOne = <T>(arr: T[]): T[] => {
    if (arr.length <= 1) return [...arr];
    return [arr[arr.length - 1], ...arr.slice(0, arr.length - 1)];
  };

  // Handle appending direction key to an object
  const appendDirectionKey = (
    obj: WcConfTileFunction,
    axeIndex: number,
  ): void => {
    if (!obj.key) return;

    const rotation = obj.keyR || 0;
    const dirIndex = (axeIndex + 4 - rotation) % 4;
    const suffix = obj.sufix || "";
    obj.key = obj.key + DIRECTIONS[dirIndex] + suffix;

    if (obj.off) {
      console.log("---------------------------------------------- CONF OG ");
      obj.off = {
        x: dirIndex < 2 ? obj.off.x : -obj.off.x,
        y: dirIndex == 0 || dirIndex == 3 ? obj.off.y : -obj.off.y,
      };
    }
  };

  // Process a collection of items
  const processCollection = (
    collection: WcConfTileAsset[] | undefined,
    axeIndex: number,
  ): WcConfTileFunction[] | undefined => {
    if (!collection) return undefined;

    return collection.map((item) => {
      const itemCopy = { ...item };
      appendDirectionKey(itemCopy, axeIndex);
      return itemCopy;
    });
  };

  // Generate rotated versions
  let currentFace = [...conf.face];

  return [0, 1, 2, 3].map((axeIndex) => {
    // Create a copy of the configuration
    const result: WcConfTile = { ...conf } as WcConfTile;

    // Apply direction tag to main key
    appendDirectionKey(result, axeIndex);

    // Process functions and items collections
    // result.functions = processCollection(result.functions, axeIndex);
    result.assets = processCollection(result.assets, axeIndex);

    // Set the current face rotation
    result.face = [...currentFace] as WcFace;

    // Rotate face for the next iteration
    currentFace = shiftArrayByOne(currentFace);

    return result;
  });
};

// ---------------------------------------------
// ---------------------------------------------

export function pickRandomWeightedObject(
  array: WcConfTile[],
  rand: number | null = null,
): WcConfTile | null {
  if (array.length === 0) return null;

  const mrand = rand !== null ? rand : Math.random();
  // Calculate the total weight of all objects in the array
  const totalWeight = array.reduce((acc, obj) => acc + (obj?.weight || .01), 0);

  // Generate a random number between 0 and the total weight
  const randomWeight = mrand * totalWeight;

  // Iterate through the objects and accumulate their weights until
  // the accumulated weight exceeds the randomWeight
  let accumulatedWeight = 0;
  for (const obj of array) {
    accumulatedWeight += obj?.weight || .01;
    if (accumulatedWeight >= randomWeight) {
      // Return the object when the accumulated weight exceeds the random weight
      return obj;
    }
  }

  // This should not happen, but if it does, return null or handle the case appropriately
  return null;
}

// ---------------------------------------------
// ---------------------------------------------
