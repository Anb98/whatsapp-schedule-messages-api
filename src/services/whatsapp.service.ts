import { Client, LocalAuth } from "whatsapp-web.js";
import { SocketService } from "./socket.service";

enum AuthStatus {
  LOGGED_IN = "logged_in",
  LOGGED_OUT = "logged_out",
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
          "--disable-setuid-sandbox",
          "--unhandled-rejections=strict",
          "--no-sandbox",
        ],
      },
    });
  }

  public async init() {
    this.client.initialize();

    this.client.on("ready", () => {
      this.authStatus = AuthStatus.LOGGED_IN;
      this.socketService.emit("auth", { status: this.authStatus });
      this.socketService.emitOnConnection("auth", {
        status: this.authStatus,
      });
    });

    this.client.on("qr", (qr) => {
      this.socketService.emit("qr", { qrCode: qr });
      this.socketService.emitOnConnection("qr", {
        qrCode: qr,
      });
    });
  }

  public async logout() {
    this.authStatus = AuthStatus.LOGGED_OUT;
    await this.client.logout();
    this.socketService.emit("auth", { status: this.authStatus });
    this.socketService.emitOnConnection("auth", {
      status: this.authStatus,
    });
  }

  public async getLoggedStatus() {
    return this.authStatus;
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
        name: contact.name,
        chatId: contact.id._serialized,
        type: contact.isGroup ? "group" : "person",
      }));
  }

  public async sendMessage(number: string | string[], message: string) {
    if (this.authStatus !== AuthStatus.LOGGED_IN)
      throw new Error("User is not logged in");

    if (Array.isArray(number))
      return Promise.allSettled(
        number.map(async (num) => {
          const chatId = num.includes("@") ? num : await this.getChatId(num);

          return this.client.sendMessage(chatId, message);
        })
      );

    const chatId = number.includes("@") ? number : await this.getChatId(number);
    return this.client.sendMessage(chatId, message);
  }

  private async getChatId(number: string) {
    const chatId = await this.client.getNumberId(number);
    if (!chatId) throw new Error(`Number ${number} not found`);

    return chatId._serialized;
  }
}
