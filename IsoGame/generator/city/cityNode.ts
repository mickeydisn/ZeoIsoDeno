import { FactoryMap } from "../../map/factory/factoryMap.ts";
import { Tile } from "../../map/object/tile.ts";
import { TilesActions } from "../../map/action/tileActions.ts";
import { World } from "../../word.ts";
import { GraphTileNode } from "./graph.ts";

import { NodeMap } from "./nodeMap.ts";

export class CityNode extends GraphTileNode {
  x: number;
  y: number;
  ta: TilesActions;

  static FromNodeGraph(nodeGraph: GraphTileNode) {
    return Object.assign(
      new CityNode(nodeGraph.world, nodeGraph.tile, nodeGraph.nodeMap.alpha),
      nodeGraph,
    );
  }
  static FromNodeMap(world: World, nodeMap: NodeMap) {
    return new CityNode(
      world,
      FactoryMap.getInstance().getTile(nodeMap.x, nodeMap.y),
      nodeMap.alpha,
    );
  }

  constructor(world: World, tile: Tile, alphaPath: number) {
    super(world, tile, alphaPath);
    this.x = tile.x;
    this.y = tile.y;
    this.ta = TilesActions.getInstance();
  }
}
