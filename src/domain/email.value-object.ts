import { z } from "zod";
import { createValueObject } from "@maxdev1/sotajs";

const EmailSchema = z.object({
	value: z.string().email("Invalid email format"),
});

export const Email = createValueObject(EmailSchema, "Email");
export type Email = ReturnType<typeof Email.create>;
