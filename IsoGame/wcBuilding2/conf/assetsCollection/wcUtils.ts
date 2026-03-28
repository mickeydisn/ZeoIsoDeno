import { WcConfRawTile, WcConfTile } from "../../wcAbstractBuildConf.ts";

export const actionsEmpty = [
  { func: "lvlAvgSquare", size: 5 },
  { func: "lvlAvgSquare", size: 7 },
];

export const applyGroup = (wcConfs: WcConfRawTile[], group: WcConfRawTile) => {
  return wcConfs.map((it) => {
    return {
      ...it,
      ...group,
    };
  }) as WcConfTile[];
};

export function tagFaces(conf: WcConfTile, tags: [string, string][]) {
  const face = conf.face.map((f) => {
    for (const tag of tags) {
      if (f != null && f.endsWith(tag[0])) {
        return f + tag[1];
      }
    }
    return f;
  });
  return {
    ...conf,
    face: face,
  } as WcConfTile;
}
