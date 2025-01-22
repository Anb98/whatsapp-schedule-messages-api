import { WhatsappService } from "../services/whatsapp.service";
import Router from "@koa/router";
import { Context } from "koa";

export const createAuthRouter = (whatsappService: WhatsappService) => {
  const router = new Router({
    prefix: "/api/auth",
  });

  router.post("/logout", async (ctx: Context) => {
    await whatsappService.logout();
    ctx.body = { message: "Logged out" };
  });

  return router;
};
