import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Message } from "./message";

export enum ContactType {
  PERSON = "person",
  GROUP = "group",
}

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  chatId!: string;

  @Column()
  type!: ContactType;

  @ManyToMany(() => Message, (message) => message.contacts)
  @JoinTable()
  messages?: Message[];
}
