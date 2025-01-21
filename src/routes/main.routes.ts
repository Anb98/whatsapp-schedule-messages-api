import Router from "@koa/router";
import { Context } from "koa";

const router = new Router({
  prefix: "/api",
});

router.get("/ping", async (ctx: Context) => {
  ctx.body = { message: "pong" };
});

export const mainRouter = router;
