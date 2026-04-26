import { AssetConfigLoaded } from "../build-tools/assetConfigLoader.ts";
import { loadAllAssetConfigs } from "../build-tools/assetConfigLoader.ts";
import { loadAssetFromALLConf, TypeAssetImageGroup } from "./assetImageLoader.ts";


// --- 
console.log("--------------------------------------------------------------")
console.log("--------------------------------------------------------------")
console.log("Hello Word")

/*
{
    console.log("--------------------------------------------------------------")
    console.log("--------------------------------------------------------------")
    const CONFIG_PATH = new URL("../../../img/asset-items/conf", import.meta.url);
    const conf = await loadAllAssetConfigs(CONFIG_PATH)
    console.log(conf)
}

{
    console.log("--------------------------------------------------------------")
    console.log("--------------------------------------------------------------")
    const CONFIG_PATH = new URL("../../../img/asset-opti/conf", import.meta.url);
    const conf = await loadAllAssetConfigs(CONFIG_PATH)
    console.log(conf)
}
*/

console.log("--------------------------------------------------------------")
console.log("--------------------------------------------------------------")


const CONFIG_PATHS = [
    "../../../img/asset-items/conf",
    "../../../img/asset-opti/conf",
]



const confs: AssetConfigLoaded[] = await loadAllAssetConfigs(CONFIG_PATHS)
const images: TypeAssetImageGroup[] = await loadAssetFromALLConf(confs)
console.log(images)
