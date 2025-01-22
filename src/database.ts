import { DataSource } from "typeorm";
import { Contact } from "./entity/contact";
import { Message } from "./entity/message";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "data/database.db",
  synchronize: true,
  entities: [Contact, Message],
  subscribers: [],
  migrations: [],
});
