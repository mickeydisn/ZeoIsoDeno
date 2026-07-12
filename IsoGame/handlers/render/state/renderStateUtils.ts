import {
  PLAYER_SPEED,
  RenderState,
} from "@iso-game/handlers/render/state/renderState.ts";
import { TypeKeysActionUpdate } from "@iso-game/handlers/render/state/renderStateType.ts";
import { directionVector } from "@iso-game/handlers/utils/renderUtils.ts";

export const setRenderPosition = (
  renderState: RenderState,
  xf: number,
  yf: number,
) => {
  renderState.xf = xf;
  renderState.yf = yf;
  const x = Math.round(xf);
  const y = Math.round(yf);
  if (renderState.x != x && renderState.x != y) {
    // console.log("UPDATE XY");
  }
  renderState.x = x;
  renderState.y = y;
};

export const tickRenderKeyboard = (
  renderState: RenderState,
  keyboardAction: TypeKeysActionUpdate,
) => {
  const mapMod = renderState.isoConfig.mapGridMod;
  const speed = PLAYER_SPEED * mapMod;

  const vecD = new directionVector(
    keyboardAction.up ? 1 : keyboardAction.down ? -1 : 0,
    keyboardAction.left ? 1 : keyboardAction.right ? -1 : 0,
  );

  // Direction .
  renderState.direction = vecD.toDirection() || renderState.direction;

  const vecDSpeed = vecD.toVecDistance(speed);

  const offX = renderState.xf - renderState.x;
  const offY = renderState.yf - renderState.y;

  /*
         TODO , need to manage the OFFSET Properly :
            - if an offset exist on an axe, and key not impact this axe,:
                - the offset must be reduce.
                - if the direction impact the offset axe. the offset must follow the dirrection( never go back )
                - else ,slide to the neir offset
        */

  if (vecD.x == 0 && vecD.y == 0) {
    renderState.xf = renderState.x;
    renderState.yf = renderState.y;
    return;
  }

  // if move :
  renderState.xf += vecDSpeed.x;
  renderState.yf += vecDSpeed.y;

  renderState.xf = Math.abs(renderState.xf - Math.round(renderState.xf)) < .001
    ? Math.round(renderState.xf)
    : renderState.xf;
  renderState.yf = Math.abs(renderState.yf - Math.round(renderState.yf)) < .001
    ? Math.round(renderState.yf)
    : renderState.yf;

  setRenderPosition(renderState, renderState.xf, renderState.yf);
};
