import { Contact, ContactType } from "../entity/contact";
import { Repository } from "typeorm";
import { WhatsappService } from "./whatsapp.service";

export class ContactService {
  constructor(
    private readonly contactRepository: Repository<Contact>,
    private readonly whatsappService: WhatsappService
  ) {}

  public async getContacts(): Promise<Contact[]> {
    return this.contactRepository.find();
  }

  public async syncContacts(): Promise<void> {
    const contactsInDb = await this.contactRepository.find();
    const contactsInWhatsapp = await this.whatsappService.getContacts();

    const newContacts = contactsInWhatsapp.filter(
      (contact) => !contactsInDb.find((c) => c.chatId === contact.chatId)
    );

    await this.contactRepository.save(newContacts);
  }

  public async findOrCreateContacts(phoneNumber: string): Promise<Contact> {
    const chatId = await this.whatsappService.getChatId(phoneNumber);

    const contact = await this.contactRepository.findOne({
      where: { chatId },
    });

    if (contact) return contact;

    const whatsappContact = await this.whatsappService.getContactId(chatId);

    const newContact = new Contact();
    newContact.chatId = chatId;
    newContact.name = whatsappContact.name || "";
    newContact.type = whatsappContact.isGroup
      ? ContactType.GROUP
      : ContactType.PERSON;

    return this.contactRepository.save(newContact);
  }
}
