import { test, expect, beforeEach, mock } from "bun:test";
import { setPortAdapter, resetDI, createPort } from "@maxdev1/sotajs";

// Создаем простой порт для тестирования
const testPort = createPort<(input: string) => Promise<string>>();

beforeEach(() => {
	resetDI();
});

test("should set and use port adapter correctly", async () => {
	const mockAdapter = mock(async (input: string) => `Hello ${input}`);
	setPortAdapter(testPort, mockAdapter);

	const adapter = testPort.use();
	const result = await adapter("World");

	expect(result).toBe("Hello World");
	expect(mockAdapter).toHaveBeenCalledTimes(1);
	expect(mockAdapter).toHaveBeenCalledWith("World");
});

test("should handle port errors correctly", async () => {
	const mockAdapter = mock(async () => {
		throw new Error("Test error");
	});
	setPortAdapter(testPort, mockAdapter);

	const adapter = testPort.use();

	await expect(adapter("test")).rejects.toThrow("Test error");
});

test("should reset DI container between tests", async () => {
	// Первый тест устанавливает адаптер
	const mockAdapter1 = mock(async (input: string) => `First ${input}`);
	setPortAdapter(testPort, mockAdapter1);

	// Второй тест должен иметь чистый контейнер
	resetDI();

	// Попытка использования порта без адаптера должна вызвать ошибку
	expect(() => testPort.use()).toThrow("No implementation found for the port");
});
