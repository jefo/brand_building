import { test, expect, beforeEach, mock } from "bun:test";
import { setPortAdapter, resetDI } from "@maxdev1/sotajs";
import { simpleStoreBotModelUseCase } from "../simple-store-bot-model.use-case";
import {
	storeBotModelPort,
	botModelStoredOutPort,
	botModelValidationFailedOutPort,
} from "@ports/bot-models/bot-model.ports";

// Mock data for testing
const validInput = {
	name: "Lead Qualification Bot",
	description: "Automated lead qualification system",
	slug: "lead-qualification-bot",
	niche: {
		name: "Marketing Automation",
		slug: "marketing-automation",
	},
	technicalSpecification: {
		platform: "Telegram",
	},
	targetAudience: "Marketing managers",
	keyFeatures: ["Real-time lead scoring"],
	useCases: ["Qualifying inbound leads"],
	pricingModel: "subscription" as const,
	tags: ["marketing", "automation"],
};

beforeEach(() => {
	resetDI();
});

test("should successfully store bot model with valid input", async () => {
	// Mock adapters
	const mockStore = mock(async () => ({ id: "test-id-123" }));
	const mockStored = mock(async () => {});
	const mockValidationFailed = mock(async () => {});

	setPortAdapter(storeBotModelPort, mockStore);
	setPortAdapter(botModelStoredOutPort, mockStored);
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	await simpleStoreBotModelUseCase(validInput);

	// Verify store port was called with correct data
	expect(mockStore).toHaveBeenCalledTimes(1);
	expect(mockStore).toHaveBeenCalledWith({
		name: "Lead Qualification Bot",
		description: "Automated lead qualification system",
		slug: "lead-qualification-bot",
		niche: {
			name: "Marketing Automation",
			slug: "marketing-automation",
		},
		technicalSpecification: {
			platform: "Telegram",
		},
		targetAudience: "Marketing managers",
		keyFeatures: ["Real-time lead scoring"],
		useCases: ["Qualifying inbound leads"],
		pricingModel: "subscription",
		tags: ["marketing", "automation"],
	});

	// Verify success port was called
	expect(mockStored).toHaveBeenCalledTimes(1);
	expect(mockStored).toHaveBeenCalledWith({
		id: "test-id-123",
		name: "Lead Qualification Bot",
		niche: "Marketing Automation",
	});

	// Verify validation failed port was NOT called
	expect(mockValidationFailed).toHaveBeenCalledTimes(0);
});

test("should call validation failed port for invalid input", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const invalidInput = {
		...validInput,
		name: "", // Empty name should cause validation error
	};

	await simpleStoreBotModelUseCase(invalidInput);

	// Verify validation failed port was called
	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Bot model name is required"]),
		operation: "storeBotModel",
	});
});

test("should validate niche slug format", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const invalidSlugInput = {
		...validInput,
		niche: {
			...validInput.niche,
			slug: "Invalid Slug With Spaces", // Invalid slug format
		},
	};

	await simpleStoreBotModelUseCase(invalidSlugInput);

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

	const invalidSlugInput = {
		...validInput,
		slug: "Invalid Slug With Spaces", // Invalid slug format
	};

	await simpleStoreBotModelUseCase(invalidSlugInput);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Slug must be lowercase with hyphens"]),
		operation: "storeBotModel",
	});
});

test("should validate required platform field", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const invalidInput = {
		...validInput,
		technicalSpecification: {
			platform: "", // Empty platform should cause validation error
		},
	};

	await simpleStoreBotModelUseCase(invalidInput);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Platform is required"]),
		operation: "storeBotModel",
	});
});

test("should propagate unexpected errors from store port", async () => {
	const mockStore = mock(async () => {
		throw new Error("Database connection failed");
	});
	const mockStored = mock(async () => {});
	const mockValidationFailed = mock(async () => {});

	setPortAdapter(storeBotModelPort, mockStore);
	setPortAdapter(botModelStoredOutPort, mockStored);
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	await expect(simpleStoreBotModelUseCase(validInput)).rejects.toThrow(
		"Database connection failed",
	);
});

test("should handle missing required fields", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const incompleteInput = {
		name: "Test Bot",
		// Missing description - should cause validation error
		slug: "test-bot",
		niche: validInput.niche,
		technicalSpecification: validInput.technicalSpecification,
	};

	await simpleStoreBotModelUseCase(incompleteInput as any);

	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining([
			"Invalid input: expected string, received undefined",
		]),
		operation: "storeBotModel",
	});
});
