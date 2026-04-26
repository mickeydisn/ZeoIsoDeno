// IsoGameAddon/assets-manager/services/AssetConfigLoader.ts
import { parse } from "jsr:@std/jsonc";

type assetDef = string | {
    name?: string,
    t?: string,
}

export type AssetConfigLoaded = {
    name: string
    src:string
    type: string,
    imgHeight: number
    imgWidth: number
    images?: assetDef[] 
    assetCount?: number
    scall?: number
}


export async function loadAllAssetConfigs(CONFIG_PATHS: string[]): Promise<AssetConfigLoaded[]> {
    const results = []
    for (const path of CONFIG_PATHS) {
        const CONFIG_PATH = new URL(path, import.meta.url)
        results.push(await loadAssetDirectory(CONFIG_PATH))
    }
    return results.flat()
}


/**
 * Resolves all .ts config files in CONFIG_PATH, dynamically imports each one,
 * and concatenates their default-exported arrays into a single flat list.
 */
export async function loadAssetDirectory(CONFIG_PATH: URL): Promise<AssetConfigLoaded[]> {
    const allGroups: AssetConfigLoaded[] = [];

    for await (const entry of Deno.readDir(CONFIG_PATH)) {
        if (!entry.isFile || !entry.name.endsWith(".ts")) continue;

        const fileUrl = new URL(entry.name, CONFIG_PATH + "/");
        try {
            const text = await Deno.readTextFile(fileUrl);
            const groups = parse(text) as AssetConfigLoaded[];

            groups.forEach(g => {

                // console.log(g.images, g.assetCount)
                if (!g.images && g.assetCount) {
   
                    const imglist :string[] = Array(g.assetCount).fill(null).map((_x, idx) => {return `${g.name}-${idx}`})
                    g.images = imglist;
                }
                // console.log(g.images)
                g.scall = !g.scall ? 1 : g.scall;
            })
            // const mod = await import(fileUrl.href);
            // const groups = mod.default as AggregatedAssetConfig[];

            if (!Array.isArray(groups)) {
                console.warn(`Skipping ${entry.name}: default export is not an array`);
                continue;
            }

            allGroups.push(...groups);
        } catch (error) {
            console.error(`Failed to load config file ${entry.name}:`, error);
        }
    }

    return allGroups
}
