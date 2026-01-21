# Dependency Analysis Report

This report summarizes the analysis of `package.json` and `package-lock.json` files for the backend and frontend.

## 1. Structural Issues

### Backend
*   **Misplaced Development Dependencies**: The following packages are listed in `dependencies` but should be in `devDependencies` to reduce production bundle size and improve security:
    *   `typescript`
    *   `ts-node`
    *   `@types/node`
    *   `@types/jsonwebtoken`

### Engines Field
*   **Missing Engines Configuration**: Both backend and frontend `package.json` files are missing the `engines` field. This allows the project to be installed/run on incompatible Node.js versions.
    *   **Recommendation**: Add `"engines": { "node": ">=22" }` to match the runtime environment and dependency requirements.

## 2. Version Incompatibilities & Runtime Conflicts

### Node.js Types Mismatch
*   **Conflict**: `backend/package.json` specifies `@types/node` version `^25.0.3`, but the runtime environment is Node v22.
*   **Risk**: This may lead to compile-time success but runtime failure if the code uses newer APIs (from Node 25) that are not available in Node 22.
*   **Recommendation**: Downgrade `@types/node` to `^22.0.0`.

### Unconventional Versions
*   The following versions seem higher than standard stable releases (assuming 2024 context), possibly indicating future/beta versions or specific environment configuration:
    *   `typescript`: `^5.9.3`
    *   `zod`: `^4.3.5`
    *   `react`: `19.1.0`
    *   `react-native`: `0.81.5`
    *   `expo`: `~54.0.31`
*   **Status**: No direct peer dependency conflicts were found among these versions in `package-lock.json`, suggesting they are compatible with each other in this specific branch.

## 3. Security & Deprecation

### Security Weaknesses
*   **JWT Algorithm**: The project uses `jsonwebtoken`, which defaults to `HS256` (HMAC with SHA-256).
    *   **Note**: Previous audit identified usage of unsalted SHA-256 hashing for user authentication (likely in application logic, not just the library).
*   **Recommendation**: Ensure `JWT_SECRET` is strong and consider migrating to stronger algorithms (e.g., RS256) or libraries.

## 4. Peer Dependency Analysis

*   **Frontend**: Peer dependencies for `react`, `react-native`, and `expo` appear to be satisfied by the installed versions.
    *   `nativewind` (4.2.1) is compatible with `tailwindcss` (3.4.19).
*   **Backend**: `ts-node` is compatible with the installed `typescript` version.

## 5. Summary of Recommended Actions

1.  Move backend dev tools to `devDependencies`.
2.  Set `engines` in both `package.json` files.
3.  Downgrade `@types/node` in backend to match runtime.

## 6. Action Required: Lockfile Update

*   **Note**: The `package.json` files have been updated to address the structural issues and engine requirements. However, the `package-lock.json` files have **not** been updated due to environment restrictions. Please run `npm install` in both `backend` and `frontend` directories to regenerate the lockfiles with the new configuration.
