import { test, expect, beforeEach, mock } from "bun:test";
import { storeBotModelUseCase } from "../store-bot-model.use-case";
import { setPortAdapter, resetDI } from "@maxdev1/sotajs";
import {
	storeBotModelPort,
	botModelStoredOutPort,
	botModelValidationFailedOutPort,
} from "../../../../ports/bot-models/bot-model.ports";

// Mock данные для тестов
const validInput = {
	name: "Lead Qualification Bot",
	description: "Automated lead qualification and scoring system",
	slug: "lead-qualification-bot",
	niche: {
		name: "Marketing Automation",
		slug: "marketing-automation",
		description: "Bots for marketing processes",
		targetAudience: "Marketing agencies and SMBs",
		commonUseCases: ["lead scoring", "customer segmentation"],
		isActive: true,
	},
	technicalSpecification: {
		platform: "Telegram/WhatsApp",
		technologyStack: ["Node.js", "PostgreSQL", "Redis"],
		integrationPoints: ["CRM systems", "Email marketing", "Analytics"],
		performanceMetrics: {
			responseTime: 100,
			uptime: 99.9,
			scalability: "high",
		},
		securityFeatures: ["SSL encryption", "Data anonymization"],
		compliance: ["GDPR"],
		estimatedDevelopmentTime: 40,
		maintenanceRequirements: "Regular updates and monitoring",
	},
	targetAudience: "Marketing managers and sales teams",
	keyFeatures: [
		"Real-time lead scoring",
		"Multi-channel integration",
		"Custom qualification rules",
	],
	useCases: [
		"Qualifying inbound leads",
		"Segmenting customer base",
		"Automating follow-up sequences",
	],
	pricingModel: "subscription" as const,
	tags: ["marketing", "automation", "leads"],
};

beforeEach(() => {
	resetDI(); // Очищаем DI контейнер перед каждым тестом
});

test("should successfully store bot model with valid input", async () => {
	// Mock адаптеров портов
	const mockStoreBotModel = mock(async () => ({ id: "test-id-123" }));
	const mockBotModelStored = mock(async () => {});
	// Добавляем мок для validation failed порта, даже если он не должен вызываться
	const mockValidationFailed = mock(async () => {});

	setPortAdapter(storeBotModelPort, mockStoreBotModel);
	setPortAdapter(botModelStoredOutPort, mockBotModelStored);
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	await storeBotModelUseCase(validInput);

	// Проверяем, что порт сохранения был вызван
	expect(mockStoreBotModel).toHaveBeenCalledTimes(1);

	// Проверяем, что выходной порт успеха был вызван
	expect(mockBotModelStored).toHaveBeenCalledTimes(1);
	expect(mockBotModelStored).toHaveBeenCalledWith({
		id: "test-id-123",
		name: "Lead Qualification Bot",
		niche: "Marketing Automation",
	});

	// Проверяем, что порт ошибки валидации НЕ был вызван
	expect(mockValidationFailed).toHaveBeenCalledTimes(0);
});

test("should call validation failed port for invalid input", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const invalidInput = {
		...validInput,
		name: "", // Пустое имя - должно вызвать ошибку валидации
	};

	await storeBotModelUseCase(invalidInput);

	// Проверяем, что порт ошибки валидации был вызван
	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Bot model name is required"]),
		operation: "storeBotModel",
	});
});

test("should handle missing required fields", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);
	// Добавляем моки для других портов, которые могут быть использованы
	const mockStoreBotModel = mock(async () => ({ id: "test-id-123" }));
	const mockBotModelStored = mock(async () => {});
	setPortAdapter(storeBotModelPort, mockStoreBotModel);
	setPortAdapter(botModelStoredOutPort, mockBotModelStored);

	const incompleteInput = {
		name: "Test Bot",
		// Отсутствует description - должно вызвать ошибку
		slug: "test-bot",
		niche: validInput.niche,
		technicalSpecification: validInput.technicalSpecification,
	};

	await storeBotModelUseCase(incompleteInput as any);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Description is required"]),
		operation: "storeBotModel",
	});
});

test("should validate niche slug format", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);
	// Добавляем моки для других портов
	const mockStoreBotModel = mock(async () => ({ id: "test-id-123" }));
	const mockBotModelStored = mock(async () => {});
	setPortAdapter(storeBotModelPort, mockStoreBotModel);
	setPortAdapter(botModelStoredOutPort, mockBotModelStored);

	const invalidSlugInput = {
		...validInput,
		niche: {
			...validInput.niche,
			slug: "Invalid Slug With Spaces", // Неверный формат slug
		},
	};

	await storeBotModelUseCase(invalidSlugInput);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining([
			"Niche slug must be lowercase with hyphens",
		]),
		operation: "storeBotModel",
	});
});

test("should validate bot model slug format", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);
	// Добавляем моки для других портов
	const mockStoreBotModel = mock(async () => ({ id: "test-id-123" }));
	const mockBotModelStored = mock(async () => {});
	setPortAdapter(storeBotModelPort, mockStoreBotModel);
	setPortAdapter(botModelStoredOutPort, mockBotModelStored);

	const invalidSlugInput = {
		...validInput,
		slug: "Invalid Slug With Spaces", // Неверный формат slug
	};

	await storeBotModelUseCase(invalidSlugInput);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Slug must be lowercase with hyphens"]),
		operation: "storeBotModel",
	});
});

test("should handle technical specification validation", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const invalidTechSpecInput = {
		...validInput,
		technicalSpecification: {
			...validInput.technicalSpecification,
			platform: "", // Пустая платформа - должно вызвать ошибку
		},
	};

	await storeBotModelUseCase(invalidTechSpecInput);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Platform is required"]),
		operation: "storeBotModel",
	});
});

test("should propagate unexpected errors", async () => {
	const mockStoreBotModel = mock(async () => {
		throw new Error("Database connection failed");
	});
	const mockBotModelStored = mock(async () => {});
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(storeBotModelPort, mockStoreBotModel);
	setPortAdapter(botModelStoredOutPort, mockBotModelStored);
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	await expect(storeBotModelUseCase(validInput)).rejects.toThrow(
		"Database connection failed",
	);
});
