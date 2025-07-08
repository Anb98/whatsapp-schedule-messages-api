import { SendMessageSchema } from "../dto/message.dto";
import schedule from "node-schedule";
import { Message, Status } from "../entity/message";
import { Repository } from "typeorm";
import { WhatsappService } from "./whatsapp.service";
import { ContactService } from "./contact.service";
import logger, { loggerLevels } from "../services/logger.service";
import WAWebJS from "whatsapp-web.js";

export class MessageService {
  constructor(
    private readonly messageRepository: Repository<Message>,
    private readonly contactService: ContactService,
    private readonly whatsappService: WhatsappService
  ) {
    this.syncPendingMessages();
  }

  public async getMessages(skip: number, take: number): Promise<Message[]> {
    return this.messageRepository.find({
      skip,
      take,
      order: { createdAt: "DESC" },
    });
  }

  public async handleMessage(data: SendMessageSchema) {
    const { contacts, message, datetime } = data;
    const date = datetime ? new Date(datetime) : undefined;
    const hasScheduledDate = date && date > new Date();

    const messageEntity = new Message();
    messageEntity.text = message;
    messageEntity.contacts = await Promise.all(
      contacts.map((contact) =>
        this.contactService.findOrCreateContacts(contact)
      )
    );

    if (hasScheduledDate) {
      messageEntity.status = Status.PENDING;
      messageEntity.scheduledAt = date;
      const result = await this.messageRepository.save(messageEntity);

      this.scheduleMessage(result);
      return result;
    }

    const sendResult = await this.whatsappService.sendMessage(
      messageEntity.contacts.map((contact) => contact.chatId),
      message
    );
    messageEntity.status = this.getMessageStatus(sendResult);

    return this.messageRepository.save(messageEntity);
  }

  public getMessageStatus(result: PromiseSettledResult<WAWebJS.Message>[]) {
    return result.every((r) => r.status === "fulfilled")
      ? Status.SENT
      : result.every((r) => r.status === "rejected")
      ? Status.FAILED
      : Status.PARTIAL;
  }

  public async updateMessageStatus(messageId: number, status: Status) {
    return this.messageRepository.update(messageId, { status });
  }

  public scheduleMessage(message: Message): void {
    schedule.scheduleJob(message.scheduledAt!, async () => {
      try {
        const sendResult = await this.whatsappService.sendMessage(
          message.contacts.map((contact) => contact.chatId),
          message.text
        );
        logger.log(
          loggerLevels.info,
          `Message sent to ${message.contacts
            .map((item) => item.name)
            .join(", ")}`
        );

        this.updateMessageStatus(message.id, this.getMessageStatus(sendResult));
      } catch (error) {
        logger.error(
          `Error sending message to ${message.contacts
            .map((item) => item.name)
            .join(", ")}`,
          error
        );
      }
    });
  }

  public async cancelMessage(messageId: number) {
    await this.messageRepository.findOneByOrFail({
      id: messageId,
      status: Status.PENDING,
    });

    const result = await this.messageRepository.update(messageId, {
      status: Status.CANCELED,
    });
    logger.log(loggerLevels.info, `Message with ID: ${messageId} canceled`);
    return result;

    throw new Error("Message cannot be canceled");
  }

  private async syncPendingMessages() {
    const pendingMessages = await this.messageRepository.find({
      where: { status: Status.PENDING },
    });

    const currentDate = new Date();
    pendingMessages
      .filter((item) => item.scheduledAt && item.scheduledAt > currentDate)
      .forEach((message) => this.scheduleMessage(message));
  }
}
