import schedule from "node-schedule";
import { WhatsappService } from "../services/whatsapp.service";
import logger, { loggerLevels } from "../services/logger.service";

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
        logger.log(
          loggerLevels.info,
          `Message sent to ${phoneNumbers.join(", ")}`
        );
      } catch (error) {
        logger.error(
          `Error sending message to ${phoneNumbers.join(", ")}`,
          error
        );
      }
    });
  }
}
