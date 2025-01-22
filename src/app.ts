import "reflect-metadata";
const dotenv = require("dotenv");
dotenv.config();

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { createServer } from "http";
import { createMessageRouter } from "./routes/message.routes";
import { createContactRouter } from "./routes/contact.routes";
import { createAuthRouter } from "./routes/auth.routes";
import { SocketService } from "./services/socket.service";
import { WhatsappService } from "./services/whatsapp.service";
import { mainRouter } from "./routes/main.routes";
import logger, { loggerLevels } from "./services/logger.service";
import { ContactService } from "./services/contact.service";
import { AppDataSource } from "./database";
import { Contact } from "./entity/contact";
import { Message } from "./entity/message";
import { MessageService } from "./services/messages.service";

async function startServer() {
  const app = new Koa();
  const server = createServer(app.callback());

  // Middleware
  app.use(cors());
  app.use(bodyParser());

  await AppDataSource.initialize()
    .then(() => logger.info(loggerLevels.info, "Database initialized"))
    .catch((err) => logger.error(err));

  const socketService = new SocketService(server);
  const whatsappService = new WhatsappService(socketService);
  whatsappService.init();

  // Contact initialization
  const contactRepository = AppDataSource.getRepository(Contact);
  const contactService = new ContactService(contactRepository, whatsappService);
  const contactRouter = createContactRouter(contactService);
  app.use(contactRouter.routes());
  app.use(contactRouter.allowedMethods());

  // Auth initialization
  const authRouter = createAuthRouter(whatsappService);
  app.use(authRouter.routes());
  app.use(authRouter.allowedMethods());

  // Routes
  app.use(mainRouter.routes());
  app.use(mainRouter.allowedMethods());

  // Message initialization
  const messageRepository = AppDataSource.getRepository(Message);
  const messageService = new MessageService(
    messageRepository,
    contactService,
    whatsappService
  );
  const messageRouter = createMessageRouter(messageService);
  app.use(messageRouter.routes());
  app.use(messageRouter.allowedMethods());

  // Start server
  server.listen(process.env.PORT, () => {
    logger.log(loggerLevels.info, `Server running on port ${process.env.PORT}`);
  });
}

startServer().catch((error) => logger.error("Error starting server", error));
