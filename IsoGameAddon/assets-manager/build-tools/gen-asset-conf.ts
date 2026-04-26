import { AssetConfigLoaded, loadAllAssetConfigs } from "./assetConfigLoader.ts";



const CONFIG_PATHS = [
    "../../../img/asset-items/conf",
    "../../../img/asset-opti/conf",
]


// build/collect-configs.ts
const confs: AssetConfigLoaded[] = await loadAllAssetConfigs(CONFIG_PATHS)

const out_content = `
import { AssetConfigLoaded } from "./assetConfigLoader.ts";

export const gen_asset_configs = ${JSON.stringify(confs, null, 2)} as AssetConfigLoaded[];
`;
const out_path = new URL("./configs-generated.ts", import.meta.url)
await Deno.writeTextFile(out_path, out_content);