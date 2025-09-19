import { z } from "zod";
import { usePort } from "@maxdev1/sotajs";
import {
	storeBotModelPort,
	botModelStoredOutPort,
	botModelValidationFailedOutPort,
} from "@ports/bot-models/bot-model.ports";

// Simplified schema for testing
const StoreBotModelInputSchema = z.object({
	name: z.string().min(1, "Bot model name is required"),
	description: z.string().min(1, "Description is required"),
	slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
	niche: z.object({
		name: z.string().min(1, "Niche name is required"),
		slug: z
			.string()
			.regex(/^[a-z0-9-]+$/, "Niche slug must be lowercase with hyphens"),
	}),
	technicalSpecification: z.object({
		platform: z.string().min(1, "Platform is required"),
	}),
	targetAudience: z.string().optional(),
	keyFeatures: z.array(z.string()).default([]),
	useCases: z.array(z.string()).default([]),
	pricingModel: z
		.enum(["one-time", "subscription", "usage-based"])
		.default("one-time"),
	tags: z.array(z.string()).default([]),
});

type StoreBotModelInput = z.infer<typeof StoreBotModelInputSchema>;

export const simpleStoreBotModelUseCase = async (
	input: StoreBotModelInput,
): Promise<void> => {
	try {
		// Validate input
		const validatedInput = StoreBotModelInputSchema.parse(input);

		// Get dependencies
		const storeBotModel = usePort(storeBotModelPort);
		const botModelStored = usePort(botModelStoredOutPort);
		const validationFailed = usePort(botModelValidationFailedOutPort);

		// Store the model
		const result = await storeBotModel({
			name: validatedInput.name,
			description: validatedInput.description,
			slug: validatedInput.slug,
			niche: validatedInput.niche,
			technicalSpecification: validatedInput.technicalSpecification,
			targetAudience: validatedInput.targetAudience,
			keyFeatures: validatedInput.keyFeatures,
			useCases: validatedInput.useCases,
			pricingModel: validatedInput.pricingModel,
			tags: validatedInput.tags,
		});

		// Notify about successful storage
		await botModelStored({
			id: result.id,
			name: validatedInput.name,
			niche: validatedInput.niche.name,
		});
	} catch (error: unknown) {
		// Handle validation errors
		if (error instanceof z.ZodError) {
			const validationErrors = error.issues.map((issue) => issue.message);

			const validationFailed = usePort(botModelValidationFailedOutPort);
			await validationFailed({
				errors: validationErrors,
				operation: "storeBotModel",
			});
			return;
		}

		// Re-throw other errors
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Unknown error occurred");
	}
};
