// import { Application } from "jsr:@oak/oak/application";
// import { Router } from "jsr:@oak/oak/router";

import {
  Application,
  Context,
  Router,
  send,
} from "https://deno.land/x/oak/mod.ts";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.1";
import * as esbuild from "npm:esbuild@0.20.2";
import { editorRouter } from "./IsoGameAddon/editor/server.ts";

import { serveStatic as StaticRouterIso } from "./IsoGameAddon/iso/web/serveIso.ts";
import { serveStatic as serveStaticAsset } from "./IsoGameAddon/assets-manager/web/serveStatic.ts";
import { serveStatic as serveStaticEditor } from "./IsoGameAddon/editor/web/serveEditor.ts";
import { serveStatic as serveStaticPallet } from "./IsoGameAddon/pallet/web/servePallet.ts";
import { assetsManagerRouter } from "./IsoGameAddon/assets-manager/server.ts";
import { mapRouter } from "./IsoGame/map/persistence/map/mapRouter.ts";
import { userRouter } from "./IsoGame/map/persistence/user/userRouter.ts";

export const serveStatic = async (context: Context) => {
  const filePath = context.request.url.pathname;
  const rootDir = `${Deno.cwd()}/`;
  // console.log(rootDir, filePath);
  try {
    await send(context, filePath, { root: rootDir, index: "index.html" });
  } catch {
    context.response.status = 404;
    context.response.body = "File not found";
  }
};

export const serveStatic2 = async (ctx: Context) => {
  let filename = ctx.request.url.pathname;
  console.log("serveStatic2:", filename);
  if (filename === "./") filename = "./index.html";

  if (filename.endsWith(".ts")) {
    console.log("TS", filename);
    const result = await esbuild.build({
      plugins: [...denoPlugins()],
      entryPoints: ["." + filename],
      write: false,
      bundle: true,
      format: "esm",
    });
    ctx.response.headers.set("Content-Type", "application/javascript");
    ctx.response.body = result.outputFiles[0].text;
    ctx.response.status = 200;
  } else {
    // Remove leading slash for send() to work correctly with root
    const cleanPath = filename.replace(/^\//, "");
    await send(ctx, cleanPath, { root: Deno.cwd() });
  }
};

const router = new Router();
router.get("/img/(.*)", serveStatic2);

// Editor static file router — serves /editor/* web files

const app = new Application();
const port = 8081;

// Middleware to add required headers
app.use(async (ctx: Context, next) => {
  ctx.response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  ctx.response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  // Add CORS headers for resource loading in workers
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS",
  );
  await next();
});

app.use(assetsManagerRouter.routes());
app.use(assetsManagerRouter.allowedMethods());

// Persistance
app.use(mapRouter.routes());
app.use(mapRouter.allowedMethods());
app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

// IMPORTANT: Mount editor API routes FIRST so they take precedence over static serving
app.use(editorRouter.routes());
app.use(editorRouter.allowedMethods());

// Then mount the main router
app.use(router.routes());
app.use(router.allowedMethods());

// /iso/
const isoStaticRouter = new Router();
isoStaticRouter.get("/iso/(.*)", StaticRouterIso);

app.use(isoStaticRouter.routes());
app.use(isoStaticRouter.allowedMethods());

// /assets-manager/
const assetStaticRouter = new Router();
assetStaticRouter.get("/assets-manager/(.*)", serveStaticAsset);
app.use(assetStaticRouter.routes());
app.use(assetStaticRouter.allowedMethods());

// /editor/
const editorStaticRouter = new Router();
editorStaticRouter.get("/editor/(.*)", serveStaticEditor);

app.use(editorStaticRouter.routes());
app.use(editorStaticRouter.allowedMethods());

// /pallet/
const palletStaticRouter = new Router();
palletStaticRouter.get("/pallet/(.*)", serveStaticPallet);

app.use(palletStaticRouter.routes());
app.use(palletStaticRouter.allowedMethods());

console.log(`Server running on http://localhost:${port}`);

app.listen({ port: port });

// -----------------------
// -----------------------

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
