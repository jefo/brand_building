import { test, expect } from "bun:test";
import { createPort, setPortAdapter, resetDI, usePort } from "@maxdev1/sotajs";

test("basic SotaJS functionality test", async () => {
	resetDI();

	// Create a simple port
	const testPort = createPort<(input: string) => Promise<string>>();

	// Set adapter
	setPortAdapter(testPort, async (input) => `Hello ${input}`);

	// Use port
	const adapter = usePort(testPort);
	const result = await adapter("World");

	expect(result).toBe("Hello World");
});

test("should reset DI container correctly", async () => {
	const testPort = createPort<() => Promise<string>>();

	// Set adapter first
	setPortAdapter(testPort, async () => "First");

	// Reset
	resetDI();

	// Should throw because no adapter is set after reset
	expect(() => {
		const adapter = usePort(testPort);
		return adapter();
	}).toThrow("No implementation found for the port");
});
