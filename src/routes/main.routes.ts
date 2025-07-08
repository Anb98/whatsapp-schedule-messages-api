import Router from "@koa/router";
import { Context } from "koa";
import { WhatsappService } from "../services/whatsapp.service";

export const createMainRouter = (whatsappService: WhatsappService) => {
  const router = new Router({
    prefix: "/api",
  });

  router.get("/ping", async (ctx: Context) => {
    const authStatus = whatsappService.getAuthStatus();
    ctx.body = { status: authStatus };
  });

  return router;
};
