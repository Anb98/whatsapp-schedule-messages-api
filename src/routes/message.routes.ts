import Router from "@koa/router";
import { Context } from "koa";

import { MessageScheduler } from "../scheduler/message.scheduler";
import { WhatsappService } from "../services/whatsapp.service";
import { SendMessageSchema, sendMessageSchema } from "../dto/message.dto";
import logger from "../services/logger.service";

export const createMessageRouter = (
  whatsAppService: WhatsappService,
  messageScheduler: MessageScheduler
) => {
  const router = new Router({
    prefix: "/api",
  });

  router.post("/messages", async (ctx: Context) => {
    try {
      const formData = ctx.request.body as SendMessageSchema;
      const { contacts, message, datetime } = sendMessageSchema.parse(formData);

      const date = datetime ? new Date(datetime) : undefined;

      if (date && date > new Date()) {
        messageScheduler.scheduleMessage(contacts, message, date);
        ctx.body = { message: "Message scheduled" };
        return;
      }

      const result = await whatsAppService.sendMessage(contacts, message);
      ctx.body = { message: "Message sent", result };
    } catch (error) {
      logger.error(error);
      ctx.status = 400;
      ctx.body = { error };
    }
  });

  router.post("/logout", async (ctx: Context) => {
    await whatsAppService.logout();
    ctx.body = { message: "Logged out" };
  });

  router.get("/contacts", async (ctx: Context) => {
    try {
      const contacts = await whatsAppService.getContacts();

      ctx.body = { contacts };
    } catch (error) {
      logger.error(error);
      ctx.status = 400;
      ctx.body = { error };
    }
  });

  return router;
};
