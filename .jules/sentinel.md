## 2024-05-22 - Missing Rate Limiter Implementation
**Vulnerability:** The codebase was missing the `RateLimiter` utility class in `backend/src/utils/rateLimiter.ts`, despite it being a documented/expected component for rate limiting.
**Learning:** Security controls mentioned in documentation or memory may not actually exist in the code.
**Prevention:** Always verify the existence of security utilities before planning to use them. Implement if missing.
