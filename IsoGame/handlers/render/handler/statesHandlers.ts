import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  renderAction,
  TRenderHandlerAction,
  TRenderHandlerContext,
} from "../contexts.ts";
import { IsoConfig } from "@iso-game/mapIso/render/type.ts";

// -------------------------------------
export interface EventUpdateIsoConfig extends TBaseMessage<"updateIsoConfig"> {
  isoConfig: IsoConfig;
}

const updateIsoConfig: TRenderHandlerAction<EventUpdateIsoConfig> =
  renderAction<
    EventUpdateIsoConfig
  >(
    "updateIsoConfig",
    (_data: EventUpdateIsoConfig, _ctx: TRenderHandlerContext) => {
      Object.assign(_ctx.renderState.isoConfig, _data.isoConfig);
    },
  );
// -------------------------------------

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const stateHandlers = [
  updateIsoConfig,
] as const;
