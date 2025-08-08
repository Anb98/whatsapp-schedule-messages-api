import { Client, LocalAuth } from "whatsapp-web.js";
import { SocketService } from "./socket.service";
import logger, { loggerLevels } from "./logger.service";
import { ContactType } from "../entity/contact";

export enum AuthStatus {
  LOGGED_IN = "logged_in",
  LOGGED_OUT = "logged_out",
  LOGGED_ERROR = "logged_error",
}

export class WhatsappService {
  private client: Client;
  private authStatus: AuthStatus = AuthStatus.LOGGED_OUT;

  constructor(private readonly socketService: SocketService) {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-gpu",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--unhandled-rejections=strict",
        ],
        dumpio: true,
      },
    });

    this.init();
  }

  private async init() {
    try {
      logger.log(loggerLevels.info, `Initializing Whatsapp service`);
      await this.client.initialize();

      this.client.on("ready", () => {
        logger.log(loggerLevels.info, `Whatsapp account logged in`);
        this.authStatus = AuthStatus.LOGGED_IN;
        this.socketService.emit("auth", { status: this.authStatus });
        this.socketService.emitOnConnection("auth", {
          status: this.authStatus,
        });
      });

      this.client.on("qr", (qr) => {
        this.authStatus = AuthStatus.LOGGED_OUT;
        logger.log(loggerLevels.info, "QR Code received");
        this.socketService.emit("qr", { qrCode: qr });
        this.socketService.emitOnConnection("qr", {
          qrCode: qr,
        });
      });
    } catch (error) {
      this.authStatus = AuthStatus.LOGGED_ERROR;
      logger.error("Error initializing Whatsapp service", error);
    }
  }

  public async logout() {
    logger.log(loggerLevels.info, `Whatsapp account logged out`);
    this.authStatus = AuthStatus.LOGGED_OUT;
    await this.client.logout();
    this.socketService.emit("auth", { status: this.authStatus });
    this.socketService.emitOnConnection("auth", {
      status: this.authStatus,
    });
  }

  public async getContacts() {
    if (this.authStatus !== AuthStatus.LOGGED_IN)
      throw new Error("User is not logged in");

    const contacts = await this.client.getContacts();
    return contacts
      .filter(
        (contact) =>
          !contact.isBlocked &&
          ((contact.isWAContact && contact.isMyContact) || contact.isGroup) &&
          !contact.id._serialized.includes("@lid")
      )
      .map((contact) => ({
        name: contact.name || "",
        chatId: contact.id._serialized,
        type: contact.isGroup ? ContactType.GROUP : ContactType.PERSON,
      }));
  }

  public async sendMessage(chatIds: string[], message: string) {
    if (this.authStatus !== AuthStatus.LOGGED_IN)
      throw new Error("User is not logged in");

    return await Promise.allSettled(
      chatIds.map((chatId) => this.client.sendMessage(chatId, message))
    );
  }

  public async getChatId(number: string) {
    if (this.authStatus !== AuthStatus.LOGGED_IN)
      throw new Error("User is not logged in");

    if (number.includes("@")) return number;

    const chatId = await this.client.getNumberId(number);
    if (!chatId) throw new Error(`Number ${number} not found`);

    return chatId._serialized;
  }

  public async getContactId(chatId: string) {
    if (this.authStatus !== AuthStatus.LOGGED_IN)
      throw new Error("User is not logged in");

    const contact = await this.client.getContactById(chatId);
    if (!contact) throw new Error(`Contact ${chatId} not found`);

    return contact;
  }

  public getAuthStatus() {
    return this.authStatus;
  }
}
