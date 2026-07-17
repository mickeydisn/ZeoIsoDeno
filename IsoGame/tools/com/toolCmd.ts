/** */

import { RegistryToolAction, TOOL_ACTION_REGISTRY } from "./toolRegistry.ts";
import { ToolAction } from "@iso-game/tools/com/type.ts";

// 1. Extract the specific Config (C) from the TileAction
export type ExtractConfig<T> = T extends ToolAction<infer K, infer C> ? C
  : never;

// 2. Omit 'func' from the config for the factory input
export type FactoryInput<T> = Omit<ExtractConfig<T>, "func">;

/**
 * 3. The CmdMap must map each literal key 'K' to its specific Action.
 * Using Extract<RegistryAction, { key: K }> ensures that 'setBlocked'
 * specifically uses 'SetBlockedConfig' instead of the broad union.
 */
export type ToolCmdMap = {
  [K in RegistryToolAction["key"]]: (
    conf: FactoryInput<Extract<RegistryToolAction, { key: K }>>,
  ) => ExtractConfig<Extract<RegistryToolAction, { key: K }>>;
};

// --- Build function ---

// --- Build function ---

function buildCmdMap(): ToolCmdMap {
  const map = {} as Partial<ToolCmdMap>;

  for (const action of TOOL_ACTION_REGISTRY) {
    const key = action.key;
    // Runtime injection of the 'func' property
    // deno-lint-ignore no-explicit-any
    (map as any)[key] = (
      conf: FactoryInput<typeof action>,
    ) => ({ ...conf } as ExtractConfig<typeof action>);
  }

  return map as ToolCmdMap;
}

export const toolCmd: ToolCmdMap = buildCmdMap();
