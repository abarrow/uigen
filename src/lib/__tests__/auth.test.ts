// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

const mockSet = vi.fn();
const mockCookies = vi.fn(() => ({ set: mockSet }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

let createSession: typeof import("@/lib/auth").createSession;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("@/lib/auth");
  createSession = mod.createSession;
});

test("creates a valid JWT token with userId and email", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [cookieName, token] = mockSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
  expect(typeof token).toBe("string");

  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("sets cookie with correct options", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.expires).toBeInstanceOf(Date);
});

test("sets expiration 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  const expiresMs = options.expires.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs);
});

test("JWT token contains expiresAt in payload", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.expiresAt).toBeDefined();
});

test("sets secure flag based on NODE_ENV", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.secure).toBe(process.env.NODE_ENV === "production");
});

test("JWT uses HS256 algorithm", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { protectedHeader } = await jwtVerify(token, JWT_SECRET);
  expect(protectedHeader.alg).toBe("HS256");
});
