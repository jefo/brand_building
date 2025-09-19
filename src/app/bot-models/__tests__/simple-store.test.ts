import { test, expect, beforeEach, mock } from "bun:test";
import { setPortAdapter, resetDI } from "@maxdev1/sotajs";
import { storeBotModelUseCase } from "../store-bot-model.use-case";
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
		description: "Bots for marketing processes",
		targetAudience: "Marketing agencies",
		commonUseCases: ["lead scoring"],
		isActive: true,
	},
	technicalSpecification: {
		platform: "Telegram",
		technologyStack: ["Node.js"],
		integrationPoints: ["CRM systems"],
		performanceMetrics: {
			responseTime: 100,
			uptime: 99.9,
			scalability: "high",
		},
		securityFeatures: ["SSL encryption"],
		compliance: ["GDPR"],
		estimatedDevelopmentTime: 40,
		maintenanceRequirements: "Regular updates",
	},
	targetAudience: "Marketing managers",
	keyFeatures: ["Real-time lead scoring"],
	useCases: ["Qualifying inbound leads"],
	pricingModel: "subscription",
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

	await storeBotModelUseCase(validInput);

	// Verify store port was called
	expect(mockStore).toHaveBeenCalledTimes(1);

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

test("should handle validation errors for invalid input", async () => {
	const mockValidationFailed = mock(async () => {});
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	const invalidInput = {
		...validInput,
		name: "", // Empty name should cause validation error
	};

	await storeBotModelUseCase(invalidInput);

	// Verify validation failed port was called
	expect(mockValidationFailed).toHaveBeenCalledTimes(1);
	expect(mockValidationFailed).toHaveBeenCalledWith({
		errors: expect.arrayContaining(["Bot model name is required"]),
		operation: "storeBotModel",
	});
});

test("should propagate unexpected errors", async () => {
	const mockStore = mock(async () => {
		throw new Error("Database connection failed");
	});
	const mockStored = mock(async () => {});
	const mockValidationFailed = mock(async () => {});

	setPortAdapter(storeBotModelPort, mockStore);
	setPortAdapter(botModelStoredOutPort, mockStored);
	setPortAdapter(botModelValidationFailedOutPort, mockValidationFailed);

	await expect(storeBotModelUseCase(validInput)).rejects.toThrow(
		"Database connection failed",
	);
});
