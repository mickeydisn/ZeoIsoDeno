import { FactoryMap } from "../map/factory/factoryMap.ts";
import { TilesActions } from "../map/tileActions.ts";
import { WcBuildActions } from "../wcBuilding2/wcBuildAction.ts";
import { WcBuildFactory } from "../wcBuilding2/wcBuildFactory.ts";

import { World } from "../word.ts";
import { CityNode } from "./cityNode.ts";
import { CityPathParamSectionGrow } from "./pathConfig.ts";
import { CityPathParamSection } from "./pathConfig.ts";
import {
  CityPathParam,
  CityPathParamSection_Building,
  DEFAULT_CITY_PARAM,
} from "./pathConfig.ts";
import {
  actionDrawPath,
  actionDrawPathAndPlatform,
  PathFactory,
} from "./pathFactory.ts";

type EvalRoad = {
  eval: number;
  startNode: CityNode;
  endNode: CityNode;
  param: CityPathParamSection;
};

export class City {
  world: World;
  fm: FactoryMap;
  x = 0;
  y = 0;
  centerNode: CityNode;
  param: CityPathParam;

  openNodes: CityNode[];
  gridNodes: CityNode[];
  pointNode: CityNode[];
  blockNodes: CityNode[];
  buildingNodes: WcBuildFactory[];
  // roads:

  constructor(
    world: World,
    x: number,
    y: number,
    param: CityPathParam = DEFAULT_CITY_PARAM,
  ) {
    this.world = world;
    this.fm = FactoryMap.getInstance();

    this.x = x;
    this.y = y;
    this.param = param;

    // this.infoCell = this.world.getCellInfo(this.x, this.y);

    this.openNodes = [];

    this.gridNodes = [];
    this.pointNode = [];
    this.blockNodes = [];
    this.buildingNodes = [];
    // this.roads = [];

    this.centerNode = new CityNode(world, this.fm.getTile(x, y), 0);
    this.gridNodes.push(this.centerNode);
    this.openNodes.push(this.centerNode);

    for (let i = 0; i < this.param.count; i++) {
      console.log("= City : MainRoad", i);
      const bestEvalNode: EvalRoad | null = this.nextBestRoad();
      if (bestEvalNode) {
        // const newNode = this.nodeLvlDeviation(bestStartNode, bestEndNode, param);
        console.debug(
          `Road ${bestEvalNode.startNode.x} | ${bestEvalNode.endNode.y}`,
        );

        this.createNewRoad(
          bestEvalNode.startNode,
          bestEvalNode.endNode,
          bestEvalNode.param,
        );
        bestEvalNode.endNode.propagatePowerAction(
          bestEvalNode.param.powerCost,
          bestEvalNode.param.powerIter,
          bestEvalNode.endNode,
        );

        const newNode = bestEvalNode.endNode.getNearConnectedNode(
          param.connectRoad.length,
          5,
        );
        if (newNode) {
          const newCityNode = CityNode.FromNodeGraph(newNode);
          this.createNewRoad(
            bestEvalNode.endNode,
            newCityNode,
            this.param.connectRoad,
          );
        }
      }
    }

    for (let i = 0; i < this.param.mainBuilding.count; i++) {
      console.log("= City : Build", i);
      const bestEvalNode: EvalRoad | null = this.nextBestBuilding();
      if (bestEvalNode) {
        // const newNode = this.nodeLvlDeviation(bestStartNode, bestEndNode, param);
        console.log(
          `Build ${bestEvalNode.startNode.x} | ${bestEvalNode.endNode.y}`,
        );
        /*
        this.createNewRoad(
          bestEvalNode.startNode,
          bestEvalNode.endNode,
          bestEvalNode.param,
        );
        */

        this.createNewBuilding(
          bestEvalNode.startNode,
          bestEvalNode.endNode,
          bestEvalNode.param as CityPathParamSection_Building,
        );
      }
    }
    // console.log("=CreateCenter");
    // console.log(this.gridNodes);
    // this.createCenter();
    /*
    console.log("=SubNode");
    for (let i = 0; i < this.param.subRoad.count; i++) {
      this.expendSubRoads();
    }

    */
  }
  nextBestBuilding(): EvalRoad | null {
    const buildingRoadNodes = this.gridNodes
      .filter((node) => {
        return node.link.length < 4 && node.childs.length > 0;
      });
    return this.createBestRoadAgroundNodeList(
      buildingRoadNodes,
      this.param.mainBuilding,
    );
  }
  // Create Main Raod
  nextBestRoad(): EvalRoad | null {
    // Check The power each Node the road syteme to computed cross section
    const crossRoadNodes = this.gridNodes
      .filter((node) => {
        return node.link.length < 3 && node.childs.length > 0 &&
          node.powerAction >= (this.param.crossingRoad.powerCondition | 0);
      }).filter((node) => {
        const nearNode = [...new Set(node.getGraphNodeFrom(0))];
        const neadlink = nearNode.map((n) => n.node.link.length)
          .reduce(
            (acc, v) => acc + v,
            0,
          );
        return neadlink <= 6;
      });

    // Check for cross Roader.
    if (crossRoadNodes.length > 0) {
      const bestEvalRoad = this.createBestRoadAgroundNodeList(
        crossRoadNodes,
        this.param.crossingRoad,
      );
      if (bestEvalRoad) {
        return bestEvalRoad;
      }
    }

    // Expend the The road System.
    this.openNodes = this.openNodes.filter((node) => {
      return node.link.length < 2;
    });
    return this.createBestRoadAgroundNodeList(
      this.openNodes,
      this.param.mainRoad,
    );
  }

  /** --------------------- */

  // Chose the best Node Aroud can be created.
  createBestRoadAgroundNodeList(
    nodesList: CityNode[],
    param: CityPathParamSectionGrow,
  ): EvalRoad | null {
    const bestNodeList: EvalRoad[] = nodesList.map((startNode) => {
      const newNode = startNode.getBestNearNode(param);
      if (newNode) {
        const newCityNode = CityNode.FromNodeGraph(newNode);
        const evals = this.evalNode(newCityNode);
        return {
          eval: evals,
          startNode: startNode,
          endNode: newCityNode,
          param: param,
        };
      } else {
        return {
          eval: 0,
          startNode: startNode,
          endNode: startNode,
          param: param,
        };
      }
    }).filter((evalNode) => evalNode.eval > 0)
      .sort((a, b) => -a.eval + b.eval);

    if (bestNodeList.length < 1) {
      return null;
    } else {
      return bestNodeList[0];
    }
  }

  /** --------------------- */

  evalNode(cityNode: CityNode) {
    const centerDistance = this.centerNode.nodeMap.nodeDistance(
      cityNode.nodeMap,
    );

    const centerFactor = centerDistance > 140 ? 0 : 1 - (centerDistance / 140);

    const minDistance = cityNode.nodeMap.nodeMeanMinDisance(
      this.gridNodes.map((cn) => cn.nodeMap),
    );

    return centerFactor * minDistance;
  }

  createNewRoad(
    startNode: CityNode,
    newNode: CityNode,
    param: CityPathParamSection,
  ) {
    startNode.addChild(newNode);
    newNode.addParent(startNode);

    this.gridNodes.push(newNode);
    this.openNodes.push(newNode);

    // Recenter the city to be not a Round Shape
    if ((newNode.tile.rFlore * 1000) % 42 < 3) {
      this.centerNode = newNode;
    }

    const pathFactory = new PathFactory(this.world);
    pathFactory.axeCount = 4;
    const tileList = pathFactory.createPath({
      x: startNode.x,
      y: startNode.y,
    }, {
      x: newNode.x,
      y: newNode.y,
    });
    if (tileList) {
      const actionList = actionDrawPathAndPlatform(tileList, param);
      TilesActions.getInstance().doActions(actionList);
    }
  }

  createNewBuilding(
    startNode: CityNode,
    newNode: CityNode,
    param: CityPathParamSection_Building,
  ) {
    startNode.addChild(newNode);
    newNode.addParent(startNode);

    // this.createNewRoad(startNode, newNode, param);

    const buildingType =
      param.buildList[this.buildingNodes.length % param.buildList.length];

    WcBuildActions.getInstance().doAction({
      func: "createBuilding",
      x: newNode.x,
      y: newNode.y,
      buildingType: buildingType,
      growLoopCount: 80,
      endLoopMax: 500,
    });
    const tile = this.fm.getTile(newNode.x, newNode.y);
    const wcBuildTile = tile.wcBuild;
    if (wcBuildTile) {
      const wcBuild = wcBuildTile.buildFactory;
      if (!this.buildingNodes.includes(wcBuild)) {
        this.buildingNodes.push(wcBuild);
      }
    }

    const pathFactory = new PathFactory(this.world);
    pathFactory.axeCount = 4;
    const tileList = pathFactory.createPath({
      x: startNode.x,
      y: startNode.y,
    }, {
      x: newNode.x,
      y: newNode.y,
    });
    if (tileList) {
      const actionList = actionDrawPath(tileList, param);
      TilesActions.getInstance().doActions(actionList);
    }
  }

  /** --------------------- * /
  nodeLvlDeviation(
    startNode: CityNode,
    newNode: CityNode,
    param: CityParamRoadSection,
  ) {
    const lvl = this.fm.getRoundTile(startNode.x, startNode.y).lvl;
    // const arround = newNode.getNodesAroud(param.lvlDeviationLength, param.lvlDefviationAlphaStep);
    const arround = newNode.nodeMap.getNodesNearTarget(
      startNode.nodeMap,
      param.lvlDefviationAlpha,
      param.lvlDeviationCount,
    );
    let endNode = newNode.nodeMap;

    let diffLvl = Math.abs(
      this.fm.getRoundTile(newNode.x, newNode.y).lvl - lvl,
    );
    arround.forEach((tmpNode) => {
      const tmpDiffLvl = Math.abs(
        this.fm.getRoundTile(tmpNode.x, tmpNode.y).lvl - lvl,
      );
      if (tmpDiffLvl < diffLvl) {
        diffLvl = tmpDiffLvl;
        endNode = tmpNode;
      }
    });
    return endNode;
  }


  expendSubRoads() {
    // SubSelect a part of Road , Find a Road extention
    const sizeGridRand = 1 / (this.gridNodes.length / 20.);

    const crossNodes = this.gridNodes.filter((node) => {
      return node.link.length < 3 && Math.random() < sizeGridRand; // Magic Random to Perf
    });
    this.createBestRoadAgroundNodeList(crossNodes, this.param.subRoad);
  }

  connectSubRoads() {
    const param = this.param.connectRoad;
    const crossNodes = this.gridNodes.filter((node) => {
      return node.link.length == 2; // & node.power > this.param.subRoad.powerCondition;
    });
    crossNodes.forEach((startNode) => {
      const nearNodes = startNode.getGraphNodeFrom(2);

      const arround = startNode.nodeMap.getNodesAround(
        param.length,
        param.alphaStep,
      );

      let arroundNear = arround.map((endNode) => {
        const [dist, node] = endNode.nodesMinDistance(
          this.gridNodes.map((n) => n.nodeMap),
        );
        return {
          eval: dist,
          startNode: startNode,
          endNode: node ? CityNode.FromNodeMap(this.world, node) : null,
        } as EvalRoad;
      });
      arroundNear = arroundNear
        .filter((x) => x.eval > 0)
        .filter((x) => !nearNodes.map((n) => n.node).includes(x.endNode))
        .sort((a, b) => -a.eval + b.eval);
      const firstArroundNear = arroundNear[0];
      if (firstArroundNear) {
        this.createNewRoad(
          firstArroundNear.startNode,
          firstArroundNear.endNode,
          param,
        );
      }
    });
  }
  /*
  createCenter() {
    const count = 8;
    const step = Math.round(this.gridNodes.length / count);
    let centerNode = [];
    for (let i = 0; i < count; i++) {
      centerNode.push(
        new CityNode(this.gridNodes[i * step].x, this.gridNodes[i * step].y),
      );
    }
    this.gridNodes.forEach((node) => {
      const movingNode = node.nodesMinDistance(centerNode)[1];
      movingNode.move(node);
    });
    this.centerNode = centerNode;
  }
  */
  /*
  createBlock() {
    // Compute Point For Block Around each CrossRoadNode
    this.gridNodes
      // .filter(node => node.roads.length > 2)
      .forEach((node) => {
        node.getCrossZoneRoadNode();
      });

    this.roads.forEach((road) => {
      road.sliptBlocks(3, 0.1);
    });
  }
  */
  /*

    drawPoint(context, node, size, color, zoom) {
        if (!node ) return false;

        context.beginPath();
        context.arc(node.getx(zoom), node.gety(zoom), size, 0, 2 * Math.PI);
        context.lineWidth = 0;
        context.fillStyle = color;
        context.fill();
    }

    drawLine(context, n1, n2, size, color, zoom) {
        if (!n1 | !n2 ) return false;
        context.beginPath();
        context.moveTo(n1.getx(zoom), n1.gety(zoom));
        context.lineTo(n2.getx(zoom), n2.gety(zoom));
        context.lineWidth = size;
        context.strokeStyle = color;
        context.stroke();
    }
    drawBlock(context, n1, n2, n3, n4, color, zoom) {
        context.beginPath();
        context.moveTo(n1.getx(zoom), n1.gety(zoom));
        context.lineTo(n2.getx(zoom), n2.gety(zoom));
        context.lineTo(n3.getx(zoom), n3.gety(zoom));
        context.lineTo(n4.getx(zoom), n4.gety(zoom));
        context.lineWidth = 0;
        context.fillStyle = color;
        context.fill();
    }

    draw(context, zoom) {
        console.log("Draw", this);

        // this.tiledBuilding.context.drawImage(build.imageData, xDisplay, yDisplay, z, z);

        this.roads.forEach(road => {
            this.drawLine(context, road.n1, road.n2, road.param.size, road.param.color, zoom);

            road.blocks
            .filter(blc => blc.lineRoad != undefined & blc.lineOut != undefined)
            .forEach(blc => {
                if (!blc.lineRoad | !blc.lineOut | !blc.lineRoad.n1 | !blc.lineRoad.n2 | !blc.lineOut.n1 | !blc.lineOut.n2) {
                    return;
                }
                // this.drawLine(context, blc.lineRoad.n1, blc.lineOut.n1, 1, '#9999FF', zoom);
                // this.drawLine(context, blc.lineRoad.n1, blc.lineRoad.n2, 1, '#9999FF', zoom);
                // this.drawLine(context, blc.lineOut.n1, blc.lineOut.n2, 1, '#99FFFF', zoom);
                const density = 128 // this.world.factoryGenerator.getRawDensity(blc.lineRoad.n1.x, blc.lineRoad.n1.y);

                if (Math.random() < density - .7) {
                    this.drawBlock(context,
                        blc.lineRoad.n1, blc.lineRoad.n2,
                        blc.lineOut.n2, blc.lineOut.n1,
                        '#99999999', zoom
                    )
                }
            })
        })

        / *
        this.centerNode.forEach(node => {
            context.beginPath();
            context.arc(node.getx(zoom), node.gety(zoom), 5, 0, 2 * Math.PI);
            context.lineWidth = 5;
            context.strokeStyle = '#000000';
            context.stroke();
        })
        * /

        context.beginPath();
        context.arc((this.x * 16 + 8) / zoom, (this.y * 16 + 8) / zoom, 5, 0, 2 * Math.PI);
        context.strokeStyle = '#FFF';
        context.lineWidth = 5;
        context.stroke();


    }
    */
}

/*
function CityBlock(n1, n2) {
    this.n1 = n1;
    this.n2 = n2;
}
*/
