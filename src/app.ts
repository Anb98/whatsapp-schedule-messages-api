const dotenv = require("dotenv");
dotenv.config();

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { createServer } from "http";
import { createMessageRouter } from "./routes/message.routes";
import { SocketService } from "./services/socket.service";
import { WhatsappService } from "./services/whatsapp.service";
import { MessageScheduler } from "./scheduler/message.scheduler";

async function startServer() {
  const app = new Koa();
  const server = createServer(app.callback());

  const socketService = new SocketService(server);
  const whatsappService = new WhatsappService(socketService);
  const messageScheduler = new MessageScheduler(whatsappService);
  whatsappService.init();

  // Middleware
  app.use(cors());
  app.use(bodyParser());

  // Routes
  const messageRouter = createMessageRouter(whatsappService, messageScheduler);
  app.use(messageRouter.routes());
  app.use(messageRouter.allowedMethods());

  // Start server
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

startServer().catch(console.error);
