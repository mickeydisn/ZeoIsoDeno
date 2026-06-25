import { Router } from "https://deno.land/x/oak/mod.ts";
import { serverDataBase } from "../db/serverDatabase.ts";

const userRouter = new Router();

// === Potion Inventory Routes ===

userRouter.get("/api/potions", (ctx) => {
  const username = ctx.request.url.searchParams.get("username") ||
    "mickey-test";

  try {
    const potions = serverDataBase.getAllPotions(username);
    ctx.response.body = { success: true, potions };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error
    ctx.response.body = { success: false, error: error.message };
  }
});

userRouter.post("/api/potions", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { username, potion } = body ?? {};

    if (!potion || !potion.id) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing potion object with id",
      };
      return;
    }

    serverDataBase.savePotion(username || "mickey-test", potion);
    ctx.response.body = { success: true };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error
    ctx.response.body = { success: false, error: error.message };
  }
});

userRouter.delete("/api/potions/:id", (ctx) => {
  const id = ctx.params.id;

  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Missing potion id" };
    return;
  }

  try {
    serverDataBase.deletePotion(id);
    ctx.response.body = { success: true };
  } catch (error) {
    ctx.response.status = 500;
    // @ts-ignore error
    ctx.response.body = { success: false, error: error.message };
  }
});

export { userRouter };
