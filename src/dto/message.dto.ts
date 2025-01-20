import { z } from "zod";

export const sendMessageSchema = z.object({
  contacts: z.array(z.string()),
  message: z.string(),
  datetime: z.string().datetime().optional(),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
