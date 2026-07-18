import { GameState } from "../states/gameState.ts";
import { TypeKeysActionUpdate } from "../../render/states/renderStateType.ts";
import { PLAYER_SPEED } from "../../render/states/renderState.ts";
import { directionVector } from "@iso-game/mapIso/render/utils/renderUtils.ts";

export const tickUpdateKeyboard = (
  _stt: GameState,
  keyboardAction: TypeKeysActionUpdate,
) => {
  const mapMod = _stt.isoConf.mapGridMod;
  const speed = PLAYER_SPEED * mapMod;

  const vecD = new directionVector(
    keyboardAction.up ? 1 : keyboardAction.down ? -1 : 0,
    keyboardAction.left ? 1 : keyboardAction.right ? -1 : 0,
  );

  // Direction .
  _stt.direction = vecD.toDirection() || _stt.direction;

  const vecDSpeed = vecD.toVecDistance(speed);

  const offX = _stt.xf - _stt.x;
  const offY = _stt.yf - _stt.y;

  /*
         TODO , need to manage the OFFSET Properly :
            - if an offset exist on an axe, and key not impact this axe,:
                - the offset must be reduce.
                - if the direction impact the offset axe. the offset must follow the dirrection( never go back )
                - else ,slide to the neir offset
        */

  if (vecD.x == 0 && vecD.y == 0) {
    _stt.xf = _stt.x;
    _stt.yf = _stt.y;
    return;
  }

  // if move :
  _stt.xf += vecDSpeed.x;
  _stt.yf += vecDSpeed.y;

  _stt.xf = Math.abs(_stt.xf - Math.round(_stt.xf)) < .001
    ? Math.round(_stt.xf)
    : _stt.xf;
  _stt.yf = Math.abs(_stt.yf - Math.round(_stt.yf)) < .001
    ? Math.round(_stt.yf)
    : _stt.yf;

  _stt.setXY(_stt.xf, _stt.yf);
};
