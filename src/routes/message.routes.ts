import Router from "@koa/router";
import { Context } from "koa";

import { SendMessageSchema, sendMessageSchema } from "../dto/message.dto";
import logger from "../services/logger.service";
import { MessageService } from "../services/messages.service";

export const createMessageRouter = (messageService: MessageService) => {
  const router = new Router({
    prefix: "/api/messages",
  });

  router.post("/", async (ctx: Context) => {
    try {
      const formData = ctx.request.body as SendMessageSchema;
      const data = sendMessageSchema.parse(formData);
      const result = await messageService.handleMessage(data);

      ctx.body = { result };
    } catch (error) {
      logger.error(error);
      ctx.status = 400;
      ctx.body = { error };
    }
  });

  router.get("/", async (ctx: Context) => {
    try {
      const messages = await messageService.getMessages();
      ctx.body = { messages };
    } catch (error) {
      logger.error(error);
      ctx.status = 400;
    }
  });

  return router;
};
