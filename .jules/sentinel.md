## 2024-05-22 - Password Hashing Migration
**Vulnerability:** User passwords were stored using unsalted SHA-256, allowing rainbow table attacks.
**Learning:** Fixing this required supporting legacy hashes to prevent locking out existing users.
**Prevention:** Use `scrypt` or similar algorithms with salt from the start. For migration, check hash format (e.g., presence of separator) to determine verification strategy.
