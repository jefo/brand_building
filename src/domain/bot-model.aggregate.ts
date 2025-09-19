import { z } from "zod";
import { createAggregate } from "@maxdev1/sotajs";
import { Niche } from "./niche.value-object";
import { TechnicalSpecification } from "./technical-specification.value-object";

const BotModelSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Bot model name is required"),
	description: z.string().min(1, "Description is required"),
	slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
	niche: Niche.schema,
	technicalSpecification: TechnicalSpecification.schema,
	targetAudience: z.string().optional(),
	keyFeatures: z.array(z.string()).default([]),
	useCases: z.array(z.string()).default([]),
	pricingModel: z
		.enum(["one-time", "subscription", "usage-based"])
		.default("one-time"),
	status: z.enum(["draft", "active", "archived"]).default("draft"),
	tags: z.array(z.string()).default([]),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

type BotModelState = z.infer<typeof BotModelSchema>;

export const BotModel = createAggregate({
	name: "BotModel",
	schema: BotModelSchema,

	computed: {
		isActive: (state) => state.status === "active",
		isDraft: (state) => state.status === "draft",
		isArchived: (state) => state.status === "archived",
		featureCount: (state) => state.keyFeatures.length,
		useCaseCount: (state) => state.useCases.length,
	},

	invariants: [
		(state) => {
			if (state.status === "active" && state.keyFeatures.length === 0) {
				throw new Error("Active bot model must have at least one key feature");
			}
			if (state.status === "active" && state.useCases.length === 0) {
				throw new Error("Active bot model must have at least one use case");
			}
		},
	],

	actions: {
		updateName: (state, newName: string) => {
			if (newName.length < 1) {
				throw new Error("Bot model name cannot be empty");
			}
			state.name = newName;
			state.updatedAt = new Date();
		},

		updateDescription: (state, newDescription: string) => {
			if (newDescription.length < 1) {
				throw new Error("Description cannot be empty");
			}
			state.description = newDescription;
			state.updatedAt = new Date();
		},

		updateNiche: (state, newNiche: Niche) => {
			state.niche = newNiche;
			state.updatedAt = new Date();
		},

		updateTechnicalSpecification: (state, newSpec: TechnicalSpecification) => {
			state.technicalSpecification = newSpec;
			state.updatedAt = new Date();
		},

		addFeature: (state, feature: string) => {
			if (feature.length < 1) {
				throw new Error("Feature cannot be empty");
			}
			state.keyFeatures.push(feature);
			state.updatedAt = new Date();
		},

		removeFeature: (state, feature: string) => {
			state.keyFeatures = state.keyFeatures.filter((f) => f !== feature);
			state.updatedAt = new Date();
		},

		addUseCase: (state, useCase: string) => {
			if (useCase.length < 1) {
				throw new Error("Use case cannot be empty");
			}
			state.useCases.push(useCase);
			state.updatedAt = new Date();
		},

		removeUseCase: (state, useCase: string) => {
			state.useCases = state.useCases.filter((uc) => uc !== useCase);
			state.updatedAt = new Date();
		},

		activate: (state) => {
			if (state.keyFeatures.length === 0) {
				throw new Error("Cannot activate bot model without key features");
			}
			if (state.useCases.length === 0) {
				throw new Error("Cannot activate bot model without use cases");
			}
			state.status = "active";
			state.updatedAt = new Date();
		},

		archive: (state) => {
			state.status = "archived";
			state.updatedAt = new Date();
		},

		addTag: (state, tag: string) => {
			if (tag.length < 1) {
				throw new Error("Tag cannot be empty");
			}
			if (!state.tags.includes(tag)) {
				state.tags.push(tag);
				state.updatedAt = new Date();
			}
		},

		removeTag: (state, tag: string) => {
			state.tags = state.tags.filter((t) => t !== tag);
			state.updatedAt = new Date();
		},
	},
});

export type BotModel = ReturnType<typeof BotModel.create>;
