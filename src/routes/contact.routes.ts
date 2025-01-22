import Router from "@koa/router";
import { Context } from "koa";
import { ContactService } from "../services/contact.service";
import logger from "../services/logger.service";

export const createContactRouter = (contactService: ContactService) => {
  const router = new Router({
    prefix: "/api/contacts",
  });

  router.get("/", async (ctx: Context) => {
    try {
      const contacts = await contactService.getContacts();
      ctx.body = { contacts };
    } catch (error) {
      logger.error(error);
      ctx.status = 400;
      ctx.body = { error };
    }
  });

  router.post("/sync", async (ctx: Context) => {
    try {
      await contactService.syncContacts();
      ctx.body = { success: true };
    } catch (error) {
      logger.error(error);
      ctx.status = 400;
      ctx.body = { error };
    }
  });

  return router;
};
