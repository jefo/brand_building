import { z } from "zod";
import { createValueObject } from "@maxdev1/sotajs";

const TechnicalSpecificationSchema = z.object({
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
});

export const TechnicalSpecification = createValueObject(
	TechnicalSpecificationSchema,
	"TechnicalSpecification",
);
export type TechnicalSpecification = ReturnType<
	typeof TechnicalSpecification.create
>;
