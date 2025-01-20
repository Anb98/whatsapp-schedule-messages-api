import schedule from "node-schedule";
import { WhatsappService } from "../services/whatsapp.service";

export class MessageScheduler {
  private whatsappService: WhatsappService;

  constructor(whatsappService: WhatsappService) {
    this.whatsappService = whatsappService;
  }

  public scheduleMessage(
    phoneNumbers: string[],
    message: string,
    datetime: Date
  ): void {
    schedule.scheduleJob(datetime, async () => {
      try {
        await this.whatsappService.sendMessage(phoneNumbers, message);
        console.log(
          `Message sent to ${phoneNumbers.join(", ")} at ${datetime}`
        );
      } catch (error) {
        console.error(
          `Error sending message to ${phoneNumbers.join(", ")} at ${datetime}`
        );
      }
    });
  }
}
