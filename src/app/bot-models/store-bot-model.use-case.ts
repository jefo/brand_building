import { z } from "zod";
import { usePort } from "@maxdev1/sotajs";
import { BotModel } from "@domain/bot-model.aggregate";
import { Niche } from "@domain/niche.value-object";
import { TechnicalSpecification } from "@domain/technical-specification.value-object";
import {
	storeBotModelPort,
	botModelStoredOutPort,
	botModelValidationFailedOutPort,
} from "@ports/bot-models/bot-model.ports";

// Схема валидации входных данных
const StoreBotModelInputSchema = z.object({
	name: z.string().min(1, "Bot model name is required"),
	description: z.string().min(1, "Description is required"),
	slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
	niche: z.object({
		name: z.string().min(1, "Niche name is required"),
		slug: z
			.string()
			.regex(/^[a-z0-9-]+$/, "Niche slug must be lowercase with hyphens"),
		description: z.string().optional(),
		targetAudience: z.string().optional(),
		commonUseCases: z.array(z.string()).default([]),
		isActive: z.boolean().default(true),
		createdAt: z.date().optional(),
	}),
	technicalSpecification: z.object({
		platform: z.string().min(1, "Platform is required"),
		technologyStack: z.array(z.string()).default([]),
		integrationPoints: z.array(z.string()).default([]),
		performanceMetrics: z
			.object({
				responseTime: z.number().positive().optional(),
				uptime: z.number().min(0).max(100).optional(),
				scalability: z.enum(["low", "medium", "high"]).optional(),
			})
			.optional(),
		securityFeatures: z.array(z.string()).default([]),
		compliance: z.array(z.string()).default([]),
		estimatedDevelopmentTime: z.number().positive().optional(),
		maintenanceRequirements: z.string().optional(),
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

export const storeBotModelUseCase = async (
	input: StoreBotModelInput,
): Promise<void> => {
	try {
		// Валидация входных данных
		const validatedInput = StoreBotModelInputSchema.parse(input);

		// Получение зависимостей
		const storeBotModel = usePort(storeBotModelPort);
		const botModelStored = usePort(botModelStoredOutPort);
		const validationFailed = usePort(botModelValidationFailedOutPort);

		// Создание Value Objects
		const niche = Niche.create(validatedInput.niche);
		const technicalSpecification = TechnicalSpecification.create(
			validatedInput.technicalSpecification,
		);

		// Создание агрегата BotModel
		const botModel = BotModel.create({
			id: crypto.randomUUID(),
			name: validatedInput.name,
			description: validatedInput.description,
			slug: validatedInput.slug,
			niche: niche.state,
			technicalSpecification: technicalSpecification.state,
			targetAudience: validatedInput.targetAudience,
			keyFeatures: validatedInput.keyFeatures,
			useCases: validatedInput.useCases,
			pricingModel: validatedInput.pricingModel,
			tags: validatedInput.tags,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Сохранение модели через порт
		const result = await storeBotModel({
			name: validatedInput.name,
			description: validatedInput.description,
			slug: validatedInput.slug,
			niche: niche.state,
			technicalSpecification: technicalSpecification.state,
			targetAudience: validatedInput.targetAudience,
			keyFeatures: validatedInput.keyFeatures,
			useCases: validatedInput.useCases,
			pricingModel: validatedInput.pricingModel,
			tags: validatedInput.tags,
		});

		// Уведомление об успешном сохранении
		await botModelStored({
			id: result.id,
			name: botModel.state.name,
			niche: botModel.state.niche.name,
		});
	} catch (error: unknown) {
		// Обработка ошибок валидации
		if (error instanceof z.ZodError) {
			const validationErrors = error.errors.map((err) => err.message);
			const validationFailed = usePort(botModelValidationFailedOutPort);
			await validationFailed({
				errors: validationErrors,
				operation: "storeBotModel",
			});
			return;
		}

		// Повторное выбрасывание других ошибок
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Unknown error occurred");
	}
};
