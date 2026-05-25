import { Color } from "../../utils/iso/color.ts";
import { Shape } from "../../utils/iso/shape.ts";
import { Point } from "../../utils/iso/point.ts";
import { DrawContext } from "../type.ts";
import { drawAsset } from "./drawAsset.ts";




export const _drawTileFloor = (
    _ctx: DrawContext,

    xx: number, 
    yy:number, 
    currentlvl:number, 
    color: Color, 
    diffLvlSE: number , 
    diffLvlSW: number
) => {
    const height =1;
    // 1. Display the Floor (Horizontal Floor tile)
    _ctx.isomer.add(
        Shape.SurfaceFlat(new Point(xx, yy, currentlvl - height), 1, 1, height),
        color,
    );
    // 2. Display Floor Borders (Vertical Faces based on neighbor level difference)
    // South-East Border (comparing with tile at yy-1)
    if (diffLvlSE > 0 && _ctx.conf.SCALE_SIZE > .5) {
        _ctx.isomer.add(
        Shape.SurfaceSE(new Point(xx, yy, currentlvl - diffLvlSE), 1, 1, diffLvlSE),
        color,
        );
    }
    if (diffLvlSW > 0 && _ctx.conf.SCALE_SIZE > .4 ) {
        _ctx.isomer.add(
        Shape.SurfaceSW(
            new Point(xx, yy, currentlvl - diffLvlSW), 1, 1, diffLvlSW),
            color,
        );
    }
}

export const _drawTileFront = (
  _ctx: DrawContext,

  p: {x: number, y:number, xoff: number, yoff:number}, 
  currentlvl:number, 
  color: Color, 
  diffLvlSE: number , diffLvlSW: number
) => {
  const height =1;
  // 1. Display the Floor (Horizontal Floor tile)
  _ctx.isomer.add(
    Shape.SurfaceFlat(new Point(p.x + p.xoff, p.y + p.yoff, currentlvl - height), 1 - p.xoff, 1 - p.yoff, height),
    color
  );

  // 2. Display Floor Borders (Vertical Faces based on neighbor level difference)
  // South-East Border (comparing with tile at yy-1)
  if (diffLvlSE > 0 && _ctx.conf.SCALE_SIZE > .5) {
    _ctx.isomer.add(
    Shape.SurfaceSE(new Point(p.x + p.xoff, p.y + p.yoff, currentlvl - diffLvlSE), 1 - p.xoff , 1 - p.yoff, diffLvlSE),
    color,
    );
  }
  if (diffLvlSW > 0 && _ctx.conf.SCALE_SIZE > .4 ) {
    _ctx.isomer.add(
    Shape.SurfaceSW(
        new Point(p.x + p.xoff, p.y  + p.yoff, currentlvl - diffLvlSW), 1 - p.xoff , 1 - p.yoff, diffLvlSW),
        color,
    );
  }
     
}

export const _drawTileBack = (
    _ctx: DrawContext,

    p: {x: number, y:number, xoff: number, yoff:number}, 
    currentlvl:number, 
    color: Color, 
    diffLvlSE: number , diffLvlSW: number
) =>  {
  const height =1;
  // 1. Display the Floor (Horizontal Floor tile)
  _ctx.isomer.add(
    Shape.SurfaceFlat(new Point(p.x, p.y, currentlvl - height), 1 - p.xoff, 1 - p.yoff, height),
    color
  );
  
  // 2. Display Floor Borders (Vertical Faces based on neighbor level difference)
  // South-East Border (comparing with tile at yy-1)
  if (diffLvlSE > 0 && _ctx.conf.SCALE_SIZE > .5) {
    _ctx.isomer.add(
      Shape.SurfaceSE(new Point(p.x, p.y, currentlvl - diffLvlSE), 1 - p.xoff , 1 - p.yoff, diffLvlSE),
      color,
    );
  }
  if (diffLvlSW > 0 && _ctx.conf.SCALE_SIZE > .4 ) {
    _ctx.isomer.add(
      Shape.SurfaceSW(
        new Point(p.x, p.y, currentlvl - diffLvlSW), 1 - p.xoff , 1 - p.yoff, diffLvlSW),
        color,
    );
  }
    
}


// -------------------------------------------------- 
// -------------------------------------------------- 
// -------------------------------------------------- 

/**
 * Draws a single item onto a tile using the correct drawing function.
 */
export const _drawTileItem = (
  _ctx: DrawContext,

  x: number,
  y: number,
  metaTile: any,
  itemConf: any,
  currentlvl: number,
) => {
  const type = itemConf.t;

  switch (type) {
    case "Asset":
    case "Svg":
      drawAsset(_ctx, x, y, itemConf, currentlvl);
      break;
    case "Box":
      // this.drawTilesBox(isomer._translatePoint(Point(x, y, lvl)), metaTile, itemConf);
      break;
    default:
      break;
  }
}