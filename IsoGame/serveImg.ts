import { AssetLoaderOpti } from "./mapIso/asset/assetLoaderOpti.ts";
import { CanvasMapDrawers } from "./mapIso/canvasMapDrawer.ts";
import { World } from "./word.ts";

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */

const assetLoader = await AssetLoaderOpti.create();
const world = new World();

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
const width = 1600 * 1.5;
const height = 800 * 1.5;
// const canvas = createCanvas(width, );
const mapDrawer = new CanvasMapDrawers(world, width, height, {
  DRAW_TILE_COUNT: 40 * 2,
  SCALE_SIZE: 1 / 2,
  SCALE_MOD: 1,
}, assetLoader);

// Function to generate an image (frame)
function generateFrame(): Uint8Array {
  mapDrawer.drawUpdate(0, 200);
  const ctx = mapDrawer.canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.font = "10px Arial";
  ctx.fillText(`Frame: ${Date.now()}`, 10, 10);

  return mapDrawer.canvas.encode("png");
}

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */

const PORT = 8081;
console.log(`WebSocket server running on ws://localhost:${PORT}`);

const clients = new Map<WebSocket, boolean>(); // Store client state

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */

// Start HTTP + WebSocket server
Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);

  // Serve static image on request
  if (url.pathname === "/image.png") {
    console.log("Serving generated image");
    const imageBuffer = await generateFrame();
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  }

  // WebSocket for live updates
  if (url.pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    clients.set(socket, false); // Not streaming yet

    socket.onopen = () => console.log("WebSocket connected!");

    socket.onmessage = async (event) => {
      if (clients.get(socket)) return;
      console.log("WebSocket started image updates:", event.data);

      // Send images every 100ms (like a video)
      while (socket.readyState === WebSocket.OPEN) {
        const imageBuffer = await generateFrame();
        // const base64Image = btoa(
        //   String.fromCharCode(...imageBuffer),
        // );
        // socket.send(`data:image/png;base64,${base64Image}`);
        socket.send(imageBuffer);
        await new Promise((resolve) => setTimeout(resolve, 1000 / 20));
      }
    };

    socket.onclose = () => {
      clients.delete(socket); // Remove the client
      console.log("WebSocket disconnected.");
    };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      clients.delete(socket);
    };

    return response;
  }

  // Serve the HTML page
  if (url.pathname === "/") {
    return new Response(
      /*html*/ ` 
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Image Generator</title>
      </head>
      <body style="text-align:center">
          <h1>Static Image (Click Button for Live Updates)</h1>
          <img id="image" src="/image.png" width="1600" height="800" style="border: 1px solid black;">
          <br><br>
          <button onclick="startLiveUpdate()">Start Live Updates</button>

          <script>
              let ws;
              function startLiveUpdate() {
                  if (ws) return; // Prevent multiple connections
                  
                  ws = new WebSocket("ws://localhost:${PORT}/ws");

                  ws.onopen = () => {
                    console.log("WebSocket connected");
                     ws.send("start");
                  }
                  ws.onmessage = (event) => {
                  if (event.data instanceof Blob) {
                      const imageUrl = URL.createObjectURL(event.data);
                      document.getElementById("image").src = imageUrl;
                  }
                     //  document.getElementById("image").src = event.data;
                  };
                  ws.onclose = () => console.log("WebSocket disconnected");
                  ws.onerror = (error) => console.error("WebSocket error:", error);
              }
          </script>
      </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    );
  }

  return new Response("404 Not Found", { status: 404 });
});
