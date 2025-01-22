import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Contact } from "./contact";

export enum Status {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  PARTIAL = "partial",
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column()
  text!: string;

  @Column()
  status!: Status;

  @Column({ type: "datetime", nullable: true })
  scheduledAt: Date | null = null;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @ManyToMany(() => Contact, (contact) => contact.messages, { eager: true })
  contacts!: Contact[];
}
