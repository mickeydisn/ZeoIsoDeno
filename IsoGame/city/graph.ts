import { FactoryMap } from "../map/factory/factoryMap.ts";
import { Tile } from "../map/object/tile.ts";
import { World } from "../word.ts";
import { NodeMap } from "./nodeMap.ts";
import { CityPathParamSectionGrow } from "./pathConfig.ts";
import { PathFactory } from "./pathFactory.ts";

export type NodeDistance = {
  node: GraphTileNode;
  minDist: number;
  avgNearDist: number;
  avgFareDist: number;
};

export type GraphNodeDepth = {
  node: GraphTileNode;
  depth: number;
  parent?: GraphNodeDepth;
  distance: number;
};

export type PathGraphConfig = {
  length: number;
  minDist: number;
  crossDist: number;
  alphaStep: number;
};

export const NODE_PATH_CONFIG: PathGraphConfig = {
  length: 12,
  minDist: 8,
  crossDist: 16,
  alphaStep: 10,
};

export class GraphTileNode {
  world: World;
  fm: FactoryMap;
  tile: Tile;
  nodeMap: NodeMap;
  parents: GraphTileNode[];
  childs: GraphTileNode[];
  isEnd: boolean;
  powerAction: number;

  constructor(world: World, tile: Tile, alphaPath: number) {
    this.world = world;
    this.tile = tile;
    this.fm = FactoryMap.getInstance();
    this.nodeMap = new NodeMap(tile.x, tile.y, alphaPath);
    this.parents = [];
    this.childs = [];
    this.isEnd = false;
    this.powerAction = 0;
  }

  addParent(parentNode: GraphTileNode) {
    if (!this.parents.includes(parentNode)) {
      this.parents.push(parentNode);
    }
  }
  addChild(childNode: GraphTileNode) {
    if (!this.childs.includes(childNode)) {
      this.childs.push(childNode);
    }
  }

  get link() {
    return [...this.parents, ...this.childs];
  }

  getGraphNodeFrom(pIterMax = 5): GraphNodeDepth[] {
    const startNode: GraphNodeDepth = {
      depth: 0,
      node: this,
      distance: 0,
    };
    const openNode: GraphNodeDepth[] = [startNode];
    const allNode: GraphNodeDepth[] = [startNode];
    let currentNodeInfo: GraphNodeDepth | undefined = openNode.shift();
    while (currentNodeInfo) {
      const pIter = currentNodeInfo.depth + 1;

      const currentNode = currentNodeInfo.node;

      [...currentNode.parents, ...currentNode.childs].forEach(
        (broNode: GraphTileNode) => {
          if (!allNode.map((x) => x.node).includes(broNode)) {
            allNode.push({
              depth: pIter,
              node: broNode,
              parent: currentNodeInfo as GraphNodeDepth,
              distance: this.nodeMap.nodeDistance(broNode.nodeMap),
            });
            if (pIter < pIterMax) {
              openNode.push({
                depth: pIter,
                node: broNode,
                parent: currentNodeInfo,
                distance: this.nodeMap.nodeDistance(broNode.nodeMap),
              });
            }
          }
        },
      );
      currentNodeInfo = openNode.shift();
    }

    return allNode.sort((a, b) =>
      a.depth - b.depth ? a.depth - b.depth : a.distance - b.distance
    );
  }

  graphNodeDistance(nodeGraph: GraphNodeDepth[]): GraphNodeDepth[] {
    return nodeGraph
      .map((nodeG) => {
        return {
          ...nodeG,
          distance: this.nodeMap.nodeDistance(nodeG.node.nodeMap),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  /* ------------------------------------ */
  /* ------------------------------------ */
  /* ------------------------------------ */

  _isValideNearNode(node: GraphTileNode) {
    const tile = this.fm.getTile(node.tile.x, node.tile.y);
    return !tile.isFrise && !tile.isBlock && !tile.wcBuild;
  }

  getNodesAround(radius: number, step: number): GraphTileNode[] {
    return this.nodeMap.getNodesAround(
      radius,
      step,
    ).map((n) => {
      const nodeGraph = new GraphTileNode(
        this.world,
        this.fm.getTile(n.x, n.y),
        n.alpha,
      );
      nodeGraph.parents.push(this);
      return nodeGraph;
    });
  }

  getNearConnectedNode(
    crossDist: number,
    depthMin: number,
  ): GraphTileNode | null {
    const ITER_LIMIT = 40;
    const nodeGraph = this.getGraphNodeFrom(ITER_LIMIT);
    // const connectedRoad = this.getNodeConnected(0);
    // Check for Cross Node :
    const filterCross: GraphNodeDepth[] = this.graphNodeDistance(
      nodeGraph,
    )
      .filter((nG) => {
        return nG.depth >= depthMin &&
          nG.distance <= crossDist;
      });
    if (filterCross.length) {
      return filterCross.sort((a, b) => (a.distance - b.distance))[0].node;
    }
    return null;
  }

  getBestNearNode(
    config: CityPathParamSectionGrow,
  ): GraphTileNode | null {
    const ITER_LIMIT = 40;
    const CROSS_ITER_MIN = 40;

    const nodeGraph = this.getGraphNodeFrom(ITER_LIMIT);
    // Get Direct Connected Node
    if (config.crossDist) {
      // const connectedRoad = this.getNodeConnected(0);
      // Check for Cross Node :
      const filterCross: GraphNodeDepth[] = this.graphNodeDistance(
        nodeGraph,
      )
        .filter((nG) => {
          return nG.depth >= CROSS_ITER_MIN &&
            nG.distance <= config.crossDist;
        });
      if (filterCross.length) {
        return filterCross.sort((a, b) => (a.distance - b.distance))[0].node;
      }
    }
    //crossDist

    // Get node Arround with configuration .
    const nodeAroundRaw = this.getNodesAround(
      config.length,
      config.alphaStep,
    ); // new NodeGraph(this.world, n.x, n.y, this.alphaStep));
    const nodeAroundValide = nodeAroundRaw
      .filter((n) => this._isValideNearNode(n));

    if (nodeAroundValide.length == 0) return null;

    const nodeAroundInfo = nodeAroundValide
      .map((n) => {
        const distNodeGraph = n.graphNodeDistance(nodeGraph);
        return {
          node: n,
          minDist: distNodeGraph[0].distance,
          avgNearDist: distNodeGraph
            .filter((nG) => nG.depth <= config.fareDepthLimit)
            .reduce((acc, a) => acc + a.distance, 0),
          avgFareDist: distNodeGraph
            .filter((nG) => nG.depth > config.fareDepthLimit)
            .reduce((acc, a) => acc + a.distance, 0),
        };
      });

    // Filter To close to other Path
    const nodeFilterA = nodeAroundInfo
      .filter((nInfo) => nInfo.minDist > config.minDist);

    if (nodeFilterA.length == 0) return null;

    // Filter half of node with greatess distance of  avgNearDist
    const nodeFilterB = nodeFilterA
      .sort((a, b) => b.avgNearDist - a.avgNearDist)
      .slice(0, Math.min(nodeFilterA.length, config.fareKeep));

    // Filter node with the less distance of avgFareDist
    const nodeFilterC = config.extend
      ? nodeFilterB
        .sort((a, b) =>
          (b.avgFareDist - a.avgFareDist) || b.avgNearDist - a.avgNearDist
        )
      : nodeFilterB
        .sort((a, b) =>
          (a.avgFareDist - b.avgFareDist) || b.avgNearDist - a.avgNearDist
        );
    // Use pathfinder to check the truck path lenght ( filter > conf.length + 5)
    let bestNode = nodeFilterC.shift();
    while (bestNode) {
      const path = new PathFactory(this.world);
      const tileList = path.createPath({ x: this.tile.x, y: this.tile.y }, {
        x: bestNode.node.tile.x,
        y: bestNode.node.tile.y,
      });
      // is path note fond
      if (!tileList || tileList.length == 0) return null;
      // check the length of the path
      if (tileList.length < config.length + 10) {
        return bestNode.node;
      }
      bestNode = nodeFilterC.shift();
    }

    return null;
  }

  propagatePowerAction(
    value: number,
    pIter: number,
    parentNode: GraphTileNode,
  ) {
    this.powerAction += value;
    if (pIter == 0) return;
    this.link.forEach((nextNode) => {
      if (nextNode != parentNode) {
        nextNode.propagatePowerAction(value, pIter - 1, this);
      }
    });
  }

  /*

  getNodeConnected(pIter: number): GraphTileNode[] {
    let nodes: GraphTileNode[] = [];
    this.link.forEach((broNode) => {
      nodes.push(broNode);
      if (pIter > 0) {
        nodes = nodes.concat(broNode.getNodeConnected(pIter - 1));
      }
    });
    return [...new Set(nodes)];
  }

  // ----
  getCloserDistanceNode(pIter = 5) {
    // Get Direct Connected Node
    const nearNodesConnected = this.getNodeConnected(0);
    // Get All node Conected to a (n)child
    // Filter Node not connected .
    const nearNodesPossible = this.getNodeConnected(pIter)
      .filter((n) => !nearNodesConnected.includes(n) && n !== this);

    const minDistNode = this.nodesMinDistance(nearNodesPossible);
    return minDistNode;
  }

  addRoad(road, pIter = 5, cost = 1) {
    this.roads.push(road);
    this.propagateRoad(pIter, road.getBrother(this), cost);
  }

    */
}
