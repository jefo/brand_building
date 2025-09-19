import { createPort } from "@maxdev1/sotajs";

// DTO interfaces
export interface StoreBotModelDto {
	name: string;
	description: string;
	slug: string;
	niche: {
		name: string;
		slug: string;
		description?: string;
		targetAudience?: string;
		commonUseCases?: string[];
		isActive?: boolean;
		createdAt?: Date;
	};
	technicalSpecification: {
		platform: string;
		technologyStack?: string[];
		integrationPoints?: string[];
		performanceMetrics?: {
			responseTime?: number;
			uptime?: number;
			scalability?: "low" | "medium" | "high";
		};
		securityFeatures?: string[];
		compliance?: string[];
		estimatedDevelopmentTime?: number;
		maintenanceRequirements?: string;
	};
	targetAudience?: string;
	keyFeatures?: string[];
	useCases?: string[];
	pricingModel?: "one-time" | "subscription" | "usage-based";
	tags?: string[];
}

export interface BotModelStoredOutput {
	id: string;
	name: string;
	niche: string;
}

export interface BotModelValidationFailedOutput {
	errors: string[];
	operation: string;
}

// Data ports
export const storeBotModelPort =
	createPort<(dto: StoreBotModelDto) => Promise<{ id: string }>>();

// Output ports
export const botModelStoredOutPort =
	createPort<(dto: BotModelStoredOutput) => Promise<void>>();
export const botModelValidationFailedOutPort =
	createPort<(dto: BotModelValidationFailedOutput) => Promise<void>>();
