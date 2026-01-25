## 2024-05-22 - Missing Rate Limiter Implementation
**Vulnerability:** The codebase was missing the `RateLimiter` utility class in `backend/src/utils/rateLimiter.ts`, despite it being a documented/expected component for rate limiting.
**Learning:** Security controls mentioned in documentation or memory may not actually exist in the code.
**Prevention:** Always verify the existence of security utilities before planning to use them. Implement if missing.

## 2026-01-24 - Testability of Fastify Apps
**Vulnerability:** The `app.ts` file immediately started the server on import, making it impossible to write unit/integration tests using `app.inject()` without port conflicts or architectural hacks.
**Learning:** Hard-coupling server startup (`listen`) with configuration prevents effective security testing.
**Prevention:** Always use a factory pattern (e.g., `buildApp()`) to return the app instance, separating configuration from execution.
