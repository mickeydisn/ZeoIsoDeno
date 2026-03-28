export type WcKeyTileFace = string;

export type WcKeyFace = string | null;

export type WcFace = [
  WcKeyFace,
  WcKeyFace,
  WcKeyFace,
  WcKeyFace,
];

// --------------------------------------------------------------------------
export function equalFaceList(faceListA: WcFace[], faceListB: WcFace[]) {
  // JSON.stringify(faceA) === JSON.stringify(faceB)
  if (faceListA.length != faceListB.length) return false;
  for (const face of faceListA) {
    if (
      faceListB.filter((faceB) => {
        return face[0] == faceB[0] && face[1] == faceB[1] &&
          face[2] == faceB[2] && face[3] == faceB[3];
      }).length == 0
    ) {
      return false;
    }
  }
  return true;
}

export function filterAxeFacesKey(
  faceList: WcFace[],
  axe: number,
  faceKey: WcKeyFace[],
): WcFace[] {
  return faceList.filter((face) => faceKey.includes(face[axe]));
}
