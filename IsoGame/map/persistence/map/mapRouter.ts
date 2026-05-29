import { Router } from "https://deno.land/x/oak/mod.ts";
import { mapServerDatabase } from "../db/mapServerDatabase.ts";

const mapDataBase = new mapServerDatabase();
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
    const deltas = mapDataBase.getDeltas(cx, cy);
    ctx.response.body = { success: true, deltas };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error

    ctx.response.body = { success: false, error: error.message };
  }
});

mapRouter.post("/api/map/deltas", async (ctx) => {
  try {
    // Robust body parsing and logging for debugging mismatched client payloads.
    let body: any = {};
    const rawText = "";

    console.log(
      "----/api/map/deltas--------------------------------------------------",
    );

    body = await ctx.request.body.json();

    // Extract common payload shapes flexibly
    let cx: any = body?.cx;
    let cy: any = body?.cy;
    let deltas: any = body?.deltas;

    // Support payload wrapped in 'payload' or 'data' fields (forms, some clients)
    if (
      (!Array.isArray(deltas) || cx === undefined || cy === undefined) &&
      body?.payload
    ) {
      try {
        const parsed = typeof body.payload === "string"
          ? JSON.parse(body.payload)
          : body.payload;
        cx = cx ?? parsed.cx;
        cy = cy ?? parsed.cy;
        deltas = deltas ?? parsed.deltas ?? parsed.data;
      } catch {
        // ignore
      }
    }
    console.log(
      "-End---/api/map/deltas--------------------------------------------------",
    );

    if (
      (!Array.isArray(deltas) || cx === undefined || cy === undefined) &&
      body?.data
    ) {
      const parsed = body.data;
      cx = cx ?? parsed.cx;
      cy = cy ?? parsed.cy;
      deltas = deltas ?? parsed.deltas ?? parsed.data;
    }
    console.log(
      "-End---/api/map/deltas--------------------------------------------------",
    );

    // Attempt to parse URL-encoded "payload=" style in rawText
    if (
      (!Array.isArray(deltas) || cx === undefined || cy === undefined) &&
      rawText
    ) {
      try {
        // @ts-ignore error
        const m = rawText.match(/payload=({.*})/);
        if (m) {
          const parsed = JSON.parse(decodeURIComponent(m[1]));
          cx = cx ?? parsed.cx;
          cy = cy ?? parsed.cy;
          deltas = deltas ?? parsed.deltas ?? parsed.data;
        }
      } catch {
        // ignore
      }
    }

    console.log(
      "-End---/api/map/deltas--------------------------------------------------",
    );
    // Final normalization: if deltas contains objects with a 'data' field, leave as-is.
    // If deltas is an array of raw tile deltas, allow that too.
    // At this point cx, cy, deltas may still be undefined; caller will validate below.

    if (cx === undefined || cy === undefined || !Array.isArray(deltas)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing cx, cy or deltas" };
      return;
    }

    console.log(
      `Saving deltas for chunk (${cx}, ${cy}), count: ${deltas.length}`,
    );
    /*
    deltas.forEach((delta, i) => {
      const data = delta.data ?? delta;
      // console.log(`  Delta ${i}:`, JSON.stringify(data));
      // if (typeof data === "object" && data !== null && "color" in data) {
      //  console.log(
      //    `  Delta ${i}: x=${data.x}, y=${data.y}, color=${data.color}`,
      //  );
      // }
    });
    */
    await mapDataBase.saveDeltas(cx, cy, deltas);
    ctx.response.body = { success: true };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error
    ctx.response.body = { success: false, error: error.message };
  }
  console.log(
    "-End---/api/map/deltas--------------------------------------------------",
  );
});

export { mapRouter };
