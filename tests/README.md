# Package.json Testing Overview

- **Testing Library / Framework**: Vitest (Node environment)

Tests in this directory validate the structure, schema, and ecosystem assumptions encoded within `package.json`.

## Test Suites
- `tests/unit/package-json.test.ts`: Structural & behavioral assertions about scripts and dependencies.
- `tests/unit/package-schema.test.ts`: JSON schema and semantic validation using Ajv.
- `tests/integration/package-ecosystem.test.ts`: Ensures compatibility with React/Vite/Web3 toolchain.

## Helpful Commands
- `pnpm run test` — run Vitest in watch mode.
- `pnpm run test:run` — run tests once.
- `pnpm run test:coverage` — execute tests with coverage reporting.
- `pnpm run validate:package` — lightweight validator script.