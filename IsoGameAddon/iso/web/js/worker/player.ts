import { FactoryMap } from "../../../../../IsoGame/map/factory/factoryMap.ts";
import { GameHandlerData, GameWorker } from "../gameWorker.ts";


export const updatePlayerMovement = (gameWorker: GameWorker): ((data: GameHandlerData) => void) => {

    const f = (data: GameHandlerData) => {
        if (!gameWorker.canvasMapDrawer) {
          return;
        }

        const mapMod = gameWorker.canvasMapDrawer.conf.SCALE_MOD;
        const speed = .1 * mapMod;

        const pm = data.playerMovement;
        let diffX = pm.up ? 1 : pm.down ? -1 : 0;
        let diffY = pm.left ? 1 : pm.right ? -1 : 0;
        
        

        const offX = gameWorker.xf - gameWorker.x;
        const offY = gameWorker.yf - gameWorker.y;
        console.log(offX, offY)
        if (diffX == 0) {
           diffX = offX > speed ? -1 : offX < -speed ? 1 : 0
        } 
        if (diffY == 0) {
          diffY = offY > speed ? -1 : offY < -speed ? 1 : 0
        } 
        // ;
          // diffY = gameWorker.yf - gameWorker.y > speed ? -1 : gameWorker.yf - gameWorker.y < speed ? 1 : 0;

        if (diffX == 0 && diffY == 0) {
          gameWorker.xf = gameWorker.x
          gameWorker.yf = gameWorker.y
          return;
        }

        // Direction . 
        gameWorker.direction = 
            diffX >  0 && diffY >  0 ? "N" :
            diffX >  0 && diffY ==  0 ? "NE":
            diffX >  0 && diffY <  0 ? "E" :
            diffX == 0 && diffY < 0 ? "SE":
            diffX <  0 && diffY <  0 ? "S" :
            diffX <  0 && diffY ==  0 ? "SW":
            diffX <  0 && diffY >  0 ? "W" :
            diffX == 0 && diffY >  0 ? "NW": gameWorker.direction

        // if move :
        gameWorker.xf += diffY != 0 ? diffX * speed * .70 : diffX * speed;
        gameWorker.yf += diffX != 0 ? diffY * speed * .70 : diffY * speed;

        gameWorker.x = Math.round(gameWorker.xf);
        gameWorker.y = Math.round(gameWorker.yf);

        const tile = FactoryMap.getInstance().getTile(gameWorker.x - 1, gameWorker.y - 1);
        gameWorker.handler.send(
          {
            action: "infoCell",
            data: tile.toJsonInfo(),
          },
        );
      }
    return f
}
