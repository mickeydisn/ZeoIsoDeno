export class NodeMap {
  x: number;
  y: number;
  alpha: number;

  constructor(x: number, y: number, alpha: number) {
    this.x = Math.round(x);
    this.y = Math.round(y);

    this.alpha = alpha;
  }

  nodeDistance(node: NodeMap): number {
    const x = Math.abs(this.x - node.x);
    const y = Math.abs(this.y - node.y);
    return Math.sqrt(x * x + y * y);
  }

  nodesDistance(nodes: NodeMap[]): [number, NodeMap][] {
    let distanceMap = nodes.map((endNode: NodeMap): [number, NodeMap] => {
      return [this.nodeDistance(endNode), endNode];
    });
    distanceMap = distanceMap.sort((a, b) => a[0] - b[0]);
    return distanceMap;
  }

  nodesMinDistance(nodes: NodeMap[]): [number, NodeMap | null] {
    if (nodes && nodes.length) {
      return this.nodesDistance(nodes)[0];
    }
    return [0, null];
  }

  nodeMeanMinDisance(nodes: NodeMap[]) {
    const nodesDistance = this.nodesDistance(nodes);
    const count = Math.min(nodesDistance.length, 3);
    let distanceMeanMin = 0;
    for (let i = 0; i < count; i++) {
      distanceMeanMin += nodesDistance[i][0];
    }
    return distanceMeanMin / count;
  }

  /**
   * Returns an array of nodes around the current node within a specified radius and step.
   */
  getNodesAround(radius: number, step: number) {
    const alpha = (2 * Math.PI) / step;
    const arr = [];

    for (let i = 0; i < step; i++) {
      const deltaStep = alpha * i + this.alpha;
      const x = Math.round(this.x + radius * Math.cos(deltaStep));
      const y = Math.round(this.y + radius * Math.sin(deltaStep));
      arr.push(new NodeMap(x, y, deltaStep));
    }

    return arr;
  }
}
