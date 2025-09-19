import { z } from "zod";
import { createEntity } from "@maxdev1/sotajs";
import { Email } from "./email.value-object";

const UserSchema = z.object({
	id: z.string().uuid(),
	email: Email.schema,
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

type UserState = z.infer<typeof UserSchema>;

export const User = createEntity({
	schema: UserSchema,
	actions: {
		updateEmail: (state: UserState, newEmail: Email) => {
			state.email = newEmail;
			state.updatedAt = new Date();
		},
		updateName: (state: UserState, firstName: string, lastName: string) => {
			if (firstName.length < 1) {
				throw new Error("First name cannot be empty");
			}
			if (lastName.length < 1) {
				throw new Error("Last name cannot be empty");
			}
			state.firstName = firstName;
			state.lastName = lastName;
			state.updatedAt = new Date();
		},
	},
});

export type User = ReturnType<typeof User.create>;
