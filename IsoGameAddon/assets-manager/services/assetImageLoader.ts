
// Define a compatible canvas type for both Deno and browser
type CanvasType = OffscreenCanvas; // | import("jsr:@gfx/canvas@0.5.6").Canvas;


import { canvasFilterStrToValue, colorVariation } from "./assetColorUtils.ts";
import { AssetConfigLoaded } from "../build-tools/assetConfigLoader.ts";
import { range } from "jsr:@oak/commons@1/range";


export type TypeAssetImageGroup = {
    name: string
    src:string;
    type: string;
    assets: TypeAssetImage[]
}

export type TypeAssetImage = {
  group: string;
  name: string;
  cimage: OffscreenCanvas[];
  dataurl: string[];
};

const regular = document.createElement("canvas");
const regularCtx = regular.getContext("2d")
regular.width = 192;
regular.height = 224;


export async function loadAssetFromALLConf(confs: AssetConfigLoaded[]) : Promise<TypeAssetImageGroup[]> {
  return await Promise.all(confs.map(async(conf) => await loadAssetFromConf(conf)))
}

export async function loadAssetFromConf(conf: AssetConfigLoaded) : Promise<TypeAssetImageGroup>{
 
  if (!conf.images) {    
    return {
      name: conf.name,
      src: conf.src,
      type: conf.type,
      assets:[],
    } as TypeAssetImageGroup
  }
  const sourceImg : ImageBitmap | undefined = await _loadImage(cleanSrc(conf.src));          
  if (!sourceImg) {
      return {
        name: conf.name,
        src: conf.src,
        type: conf.type,
        assets:[],
      } as TypeAssetImageGroup
    }
  const assets : TypeAssetImage[] = await Promise.all(conf.images.map(async (name, idx) => {
      const assetList = _cutAssetFromImage(sourceImg, idx);

      const assetDataUrl = assetList.map( (ass) => {
        if (!regularCtx) return ""
        const bitmap = ass.transferToImageBitmap();
        regularCtx.clearRect(0, 0, regular.width, regular.height)
        regularCtx.drawImage(bitmap, 0, 0);
        return regular.toDataURL("image/png");
      })


      return {
        group: conf.name,
        name: name,
        cimage: assetList,
        dataurl: assetDataUrl
      } as TypeAssetImage
      
  }))

  return {
    name: conf.name,
    src: conf.src,
    type: conf.type,
    assets:assets,
  } as TypeAssetImageGroup
}


const imgWidth = 192;
const imgHeight = 224;
// Use absolute path from origin to ensure correct resolution in web worker context
const baseUrl = typeof self !== 'undefined' && self.location ? self.location.origin : 'http://localhost:8081'
;
const cleanSrc = (src:string) => {
  const s = src.replace(/^\.\//, '');
  const url = `${baseUrl}/${s}`;
  console.log(`Loading asset: ${url}`);
  return url
} 

async function _loadImage(url: string): Promise<ImageBitmap | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load image: ${url} (status: ${response.status})`);
    }
    return createImageBitmap(await response.blob()); // No <img>, direct GPU data
  } catch (e ) {
    console.error("Not load", e)
  }
}


function _cutImage (sourceImg:ImageBitmap, wId: number, hId: number) : OffscreenCanvas {
  const destCanvas = new OffscreenCanvas(192, 224);
  const ctx = destCanvas.getContext("2d", { willReadFrequently: true });
  if (ctx == null) return destCanvas;

  // Draw the cut portion of the source image onto the destination canvas
  ctx.drawImage(
    sourceImg,
    imgWidth * wId, //  + Math.floor(imgWidth * ((1 - scall) / 2)),
    imgHeight * hId, // + Math.floor(imgHeight * (1 - scall)),
    Math.floor(imgWidth), // * scall),
    imgHeight,
    
    0,
    0, //  + (assetInfo.scall ? 32 : 0),
    imgWidth,
    imgHeight, // Math.floor(imgHeight / scall),
  );
  // dest.ctx.drawImage(cutImg,0, 0, dest.width, dest.height);
  return destCanvas;
};

function _cutAssetFromImage(sourceImg:ImageBitmap, idx: number, axe8:boolean=false) : OffscreenCanvas[]{
  if (axe8) {
    return[0, 1, 2, 3, 4, 5, 6, 7].map(x => _cutImage(sourceImg, x, idx))
  }
  return[0, 1, 2, 3].map(x => _cutImage(sourceImg, x, idx))
}
