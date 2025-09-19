import { z } from "zod";
import { createValueObject } from "@maxdev1/sotajs";

const NicheSchema = z.object({
	name: z.string().min(1, "Niche name is required"),
	slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
	description: z.string().optional(),
	targetAudience: z.string().optional(),
	commonUseCases: z.array(z.string()).default([]),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
});

export const Niche = createValueObject(NicheSchema, "Niche");
export type Niche = ReturnType<typeof Niche.create>;
