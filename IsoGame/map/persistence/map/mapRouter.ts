import { Router } from "https://deno.land/x/oak/mod.ts";
import { serverDataBase } from "../db/serverDatabase.ts";

const mapRouter = new Router();

mapRouter.get("/api/map/deltas", (ctx) => {
  const cx = parseInt(ctx.request.url.searchParams.get("cx") || "");
  const cy = parseInt(ctx.request.url.searchParams.get("cy") || "");

  if (isNaN(cx) || isNaN(cy)) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Invalid cx or cy" };
    return;
  }

  try {
    const deltas = serverDataBase.getDeltas(cx, cy);
    ctx.response.body = { success: true, deltas };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error
    ctx.response.body = { success: false, error: error.message };
  }
});

mapRouter.post("/api/map/deltas", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { cx, cy, deltas } = body ?? {};

    if (cx === undefined || cy === undefined || !Array.isArray(deltas)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing cx, cy or deltas" };
      return;
    }

    console.log(
      `[map/deltas] Saving ${deltas.length} deltas for chunk (${cx}, ${cy})`,
    );
    await serverDataBase.saveDeltas(cx, cy, deltas);
    ctx.response.body = { success: true };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error
    ctx.response.body = { success: false, error: error.message };
  }
});

export { mapRouter, serverDataBase };
