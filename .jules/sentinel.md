## 2024-05-22 - Missing Rate Limiter Implementation
**Vulnerability:** The codebase was missing the `RateLimiter` utility class in `backend/src/utils/rateLimiter.ts`, despite it being a documented/expected component for rate limiting.
**Learning:** Security controls mentioned in documentation or memory may not actually exist in the code.
**Prevention:** Always verify the existence of security utilities before planning to use them. Implement if missing.

## 2026-01-24 - Testability of Fastify Apps
**Vulnerability:** The `app.ts` file immediately started the server on import, making it impossible to write unit/integration tests using `app.inject()` without port conflicts or architectural hacks.
**Learning:** Hard-coupling server startup (`listen`) with configuration prevents effective security testing.
**Prevention:** Always use a factory pattern (e.g., `buildApp()`) to return the app instance, separating configuration from execution.

## 2026-02-04 - Unbounded Input Vectors
**Vulnerability:** Zod schemas for user input (e.g., journal entries, signup) lacked `.max()` constraints on strings and arrays, allowing attackers to send massive payloads (DoS).
**Learning:** Zod `z.string()` defaults to unlimited length. Without explicit constraints, the application is vulnerable to memory exhaustion.
**Prevention:** Enforce `.max()` limits on ALL string and array inputs in Zod schemas.

## 2026-02-14 - Timing Attack on Auth Endpoints
**Vulnerability:** The `/login` endpoint returned immediately when a user was not found, while performing an expensive `scrypt` hash verification when the user existed. This timing difference (~100ms) allowed attackers to enumerate valid email addresses.
**Learning:** `scrypt` and other secure hashing algorithms are CPU-intensive by design. Code paths that skip this work reveal state.
**Prevention:** Implement "constant-time" logic by performing a dummy hash verification when the user is not found, ensuring both success and failure paths perform comparable work.
