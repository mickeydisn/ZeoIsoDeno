/**
 * cmd.ts
 *
 * Auto-derives a fully typed command factory map from ACTION_REGISTRY.
 * No manual factory definitions — adding an action to the registry
 * automatically gives you cmd.myNewAction({ ... }) with the correct type.
 *
 * Each factory:
 *   - Accepts the action's config C minus "func" (injected automatically)
 *   - Returns BaseTileActionConfig with func set to the action's literal key
 */

import { ACTION_REGISTRY, RegistryAction } from "../actions/registry.ts";
import { TileAction } from "../actions/types.ts";

// 1. Extract the specific Config (C) from the TileAction
type ExtractConfig<T> = T extends TileAction<infer K, infer C> ? C : never;

// 2. Omit 'func' from the config for the factory input
type FactoryInput<T> = Omit<ExtractConfig<T>, 'func'>;

/**
 * 3. The CmdMap must map each literal key 'K' to its specific Action.
 * Using Extract<RegistryAction, { key: K }> ensures that 'setBlocked'
 * specifically uses 'SetBlockedConfig' instead of the broad union.
 */
export type CmdMap = {
  [K in RegistryAction["key"]]: (
    conf: FactoryInput<Extract<RegistryAction, { key: K }>>
  ) => ExtractConfig<Extract<RegistryAction, { key: K }>>;
};

// --- Build function ---

// --- Build function ---

function buildCmdMap(): CmdMap {
  const map = {} as Partial<CmdMap>;

  for (const action of ACTION_REGISTRY) {
    const key = action.key;
    // Runtime injection of the 'func' property
    // map[key] = (conf: FactoryInput<typeof action>) => ({ ...conf, func: key } as ExtractConfig<typeof action>);

    // deno-lint-ignore no-explicit-any
    (map as any)[key] = (conf: FactoryInput<typeof action>) => ({ ...conf, func: key } as ExtractConfig<typeof action>);
    // map[key] = (conf: any) => ({ ...conf, func: key });
  }

  return map as CmdMap;
}

export const cmd: CmdMap = buildCmdMap();