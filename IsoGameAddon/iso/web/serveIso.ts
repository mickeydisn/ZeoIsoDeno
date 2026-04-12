/**
 * Serve Editor Static Files
 *
 * This module serves static files from the iso web directory.
 * It maps /iso/* URLs to IsoGame/wcBuilding2/iso/web/* files.
 * TypeScript files are bundled with esbuild for browser compatibility.
 */

import { Context, send } from "https://deno.land/x/oak/mod.ts";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.1";
import * as esbuild from "npm:esbuild@0.20.2";

const ISO_WEB_DIR = `${Deno.cwd()}/IsoGameAddon/iso/web`;

export const serveStatic = async (context: Context) => {
  const urlPath = context.request.url.pathname;

  // Extract the path after /iso/
  const relativePath = urlPath.replace(/^\/iso\//, "");

  // Default to index.html for the base iso path
  const filePath = relativePath || "index.html";

  // Handle TypeScript files with esbuild bundling
  if (filePath.endsWith(".ts")) {
    try {
      console.log("iso TS:", filePath);
      const fullFilePath = `${ISO_WEB_DIR}/${filePath}`;
      const result = await esbuild.build({
        plugins: [...denoPlugins()],
        entryPoints: [fullFilePath],
        write: false,
        bundle: true,
        format: "esm",
      });
      context.response.headers.set("Content-Type", "application/javascript");
      context.response.body = result.outputFiles[0].text;
      context.response.status = 200;
      return;
    } catch (error) {
      console.error("Editor TS build error:", error);
      context.response.status = 500;
      context.response.body = `Failed to compile TypeScript: ${error.message}`;
      return;
    }
  }

  // Serve static files (HTML, CSS, images, etc.)
  try {
    await send(context, filePath, {
      root: ISO_WEB_DIR,
      index: "index.html",
    });
  } catch {
    context.response.status = 404;
    context.response.body = "Editor file not found";
  }
};
