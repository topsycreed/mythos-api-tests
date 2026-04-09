# Mythos API Tests

This repository uses Playwright with TypeScript for API test automation.

## Step 0. Clone and Install Dependencies

If the project already exists in GitHub, clone it first:

```bash
git clone <your-repository-url>
cd mythos-api-tests
npm install
```

## Step 1. Install Required Tools

Install these tools before creating or running the project:

1. Node.js LTS
2. VS Code
3. Git
4. GitHub account

Recommended download pages:

1. Node.js LTS: https://nodejs.org/
2. VS Code: https://code.visualstudio.com/
3. Git: https://git-scm.com/
4. GitHub: https://github.com/

After installation, verify the tools in a terminal:

```bash
node -v
npm -v
git --version
code --version
```

## Step 2. Create a New Playwright Project

Create the project folder and run the Playwright bootstrap command:

```bash
mkdir mythos-api-tests
cd mythos-api-tests
npm init playwright@latest
```

Choose these answers in the setup wizard:

```text
language: TypeScript
tests folder: tests
add GitHub Actions: yes
install browsers: yes
```

Why this is a good starting point:

1. TypeScript gives better type safety and editor support.
2. The `tests` folder is a clean and conventional default.
3. GitHub Actions adds CI from the start.
4. Installing browsers immediately makes the project ready to run.

## Step 3. Install Extra Packages After `init`

After Playwright initialization, install the additional packages below.

Add TypeScript and Node.js typings:

```bash
npm install -D typescript @types/node
```

If TypeScript is already installed, that is fine. Just verify it exists in `package.json`.

Add `dotenv` for environment variables:

```bash
npm install dotenv
```

Why these packages are useful:

1. Playwright can execute `.ts` test files directly, but a separate TypeScript compiler is still useful for type-checking.
2. `@types/node` adds type definitions for Node.js APIs.
3. `dotenv` makes it easy to keep secrets, base URLs, and environment-specific values in `.env`.
4. A pair like `.env` and `.env.example` helps document required variables without committing secrets.

## Step 4. Generate `tsconfig.json`

The easiest way to create the initial TypeScript config is through the TypeScript CLI:

```bash
npx tsc --init
```

This generates a basic `tsconfig.json` file in the project root.

After that, run a type-check to make sure TypeScript is working:

```bash
npx tsc --noEmit
```

## Step 5. Replace `tsconfig.json`

After generating the default file, replace it with this configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node", "@playwright/test"],

    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,

    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "outDir": "dist"
  },
  "include": ["src", "tests", "playwright.config.ts"],
  "exclude": ["node_modules"]
}
```

## Step 6. What Each `tsconfig` Option Means

### `compilerOptions`

`target: "ES2022"`

This tells TypeScript which JavaScript version to output. `ES2022` is modern and works well in recent Node.js LTS versions.

`module: "NodeNext"`

This enables modern Node.js module behavior and supports both ESM and Node-compatible resolution rules.

`moduleResolution: "NodeNext"`

This tells TypeScript how to resolve imports when using the Node.js modern module system.

`lib: ["ES2022"]`

This includes the built-in JavaScript library definitions for ES2022 features.

`types: ["node", "@playwright/test"]`

This loads type definitions for Node.js and Playwright so the editor and compiler understand globals, APIs, fixtures, and test helpers.

`strict: true`

This turns on strict type-checking and is strongly recommended for stable test code.

`noImplicitAny: true`

This prevents TypeScript from silently using the `any` type when a type is missing.

`noUncheckedIndexedAccess: true`

This makes indexed access safer by treating missing values as possible `undefined`.

`esModuleInterop: true`

This improves compatibility when importing CommonJS packages in TypeScript.

`resolveJsonModule: true`

This allows importing `.json` files directly into TypeScript.

`skipLibCheck: true`

This skips type-checking inside dependency declaration files and usually makes builds faster.

`sourceMap: true`

This generates source maps, which helps with debugging.

`outDir: "dist"`

This sets the output folder for compiled files if you later emit JavaScript builds.

### Root-level fields

`include: ["src", "tests", "playwright.config.ts"]`

This tells TypeScript which project files should be included in type-checking.

`exclude: ["node_modules"]`

This excludes installed dependencies from project compilation.

## Step 7. Environment Variables

Store secrets and environment-specific configuration in `.env`.

Example:

```bash
BASE_URL=https://api.qasandbox.ru/api/
USERNAME=your_test_username_prefix
PASSWORD=your_test_password
```

Recommended example file for the team:

```bash
BASE_URL=
USERNAME=
PASSWORD=
```

The project includes `.env.example` as a safe template. Copy it into `.env` before running tests:

```bash
cp .env.example .env
```

If you are using PowerShell on Windows, use:

```powershell
Copy-Item .env.example .env
```

Typical file naming:

1. `.env` for local real values
2. `.env.example` for documented placeholders

The Playwright config loads `.env` automatically and uses:

1. `BASE_URL` as Playwright `baseURL`
2. `USERNAME` and `PASSWORD` as credentials for the future `/register` flow

The `/register` endpoint itself does not need to be stored in `.env`. It is a fixed API path and can stay in code.

No credentials are hardcoded in the test helpers.

Auth helper behavior:

1. `getConfiguredCredentials()` uses `USERNAME` and `PASSWORD` exactly as provided in `.env`
2. `createUniqueCredentialsFromEnv()` uses `USERNAME` as a prefix and appends a unique suffix for registration tests
3. If `USERNAME` or `PASSWORD` is missing, auth helpers fail explicitly instead of silently falling back to defaults

## Step 8. Configure GitHub Actions Secrets

GitHub Actions does not read your local `.env` file automatically.

This project uses the following strategy in CI:

1. `BASE_URL` is set directly in the workflow
2. Public smoke and read tests always run
3. Auth, CRUD, and negative tests run only when repository secrets are configured

Add these repository secrets in GitHub:

1. Open your repository in GitHub
2. Go to `Settings`
3. Open `Secrets and variables`
4. Open `Actions`
5. Click `New repository secret`
6. Create `QASANDBOX_USERNAME`
7. Create `QASANDBOX_PASSWORD`

The workflow maps them like this:

```yaml
env:
  BASE_URL: https://api.qasandbox.ru/api/
  USERNAME: ${{ secrets.QASANDBOX_USERNAME }}
  PASSWORD: ${{ secrets.QASANDBOX_PASSWORD }}
```

Behavior in CI:

1. `npm run typecheck` runs on every workflow run
2. `npm run test:smoke` runs on every workflow run
3. `npm run test:read` runs on every workflow run
4. `npm run test:auth` runs only if both secrets are present
5. `npm run test:crud` runs only if both secrets are present
6. `npm run test:negative` runs only if both secrets are present

## Step 9. Run Test Suites by Tag

The project groups tests with Playwright tags:

1. `@smoke` for the minimal public health signal
2. `@read` for public read scenarios
3. `@auth` for registration and login
4. `@crud` for authenticated create, update, and delete flows
5. `@negative` for authorization and validation errors

Why this helps:

1. You can run only the suite you need without depending on file names
2. The npm scripts stay stable even if tests are moved between files
3. CI steps stay readable and focused on business purpose

Run by tag directly with Playwright:

```bash
npx playwright test --grep @smoke
npx playwright test --grep @read
npx playwright test --grep @auth
npx playwright test --grep @crud
npx playwright test --grep @negative
```

You can also combine suites:

```bash
npx playwright test --grep "@auth|@crud"
```

## Step 10. Understand Reports, Traces, and CI Artifacts

This project uses different report outputs for local runs and CI:

1. Local runs use the `list` reporter with visible `test.step(...)` output plus the HTML report
2. CI uses GitHub annotations plus the HTML report
3. Test artifacts are stored in `test-results/`
4. The HTML report is stored in `playwright-report/`

Open the HTML report locally:

```bash
npx playwright show-report
```

or:

```bash
npm run report
```

Important difference:

1. `playwright-report` is an HTML report
2. `trace.zip` is a Playwright trace archive
3. `https://trace.playwright.dev/` opens `trace.zip`, not the HTML report

If you download the `playwright-report` artifact from GitHub Actions, open `index.html` inside it.

If you download the `playwright-test-results` artifact, find the failing test folder and open its `trace.zip`.

Open a trace locally with the Playwright CLI:

```bash
npx playwright show-trace path/to/trace.zip
```

Or drag `trace.zip` into the browser viewer:

```text
https://trace.playwright.dev/
```

Trace behavior in this project:

1. CI keeps traces for failed tests
2. Local runs collect traces on the first retry
3. `test.step(...)` blocks make the flow easier to read in both the terminal and the HTML report

## Step 11. Install the Playwright VS Code Extension

To run and debug tests directly from the editor, install the Playwright extension in VS Code.

Search in the VS Code Extensions marketplace for:

```text
Playwright Test for VSCode
```

Why install it:

1. Run tests from the editor UI
2. Debug tests with breakpoints
3. See locators and test results more easily
4. Improve day-to-day productivity during test development

## Step 12. Run Tests from the Console

Run all tests:

```bash
npx playwright test
```

or with npm:

```bash
npm test
```

Run the smoke test for `GET /mythology`:

```bash
npx playwright test --grep @smoke
npm run test:smoke
```

Run public read tests for list, filters, sorting, and `GET /mythology/{id}`:

```bash
npx playwright test --grep @read
npm run test:read
```

Run auth tests for `POST /register` and `POST /login`:

```bash
npx playwright test --grep @auth
npm run test:auth
```

Run authenticated CRUD tests for `/mythology`:

```bash
npx playwright test --grep @crud
npm run test:crud
```

Run negative tests for `/mythology` authorization and validation:

```bash
npx playwright test --grep @negative
npm run test:negative
```

Run tests in UI mode:

```bash
npx playwright test --ui
```

or:

```bash
npm run test:ui
```

Run tests in headed mode:

```bash
npx playwright test --headed
```

or:

```bash
npm run test:headed
```

If browsers ever need to be installed again:

```bash
npx playwright install
```

or:

```bash
npm run pw:install
```

## Step 13. Run Type Check

Run TypeScript type-checking without generating output files:

```bash
npx tsc --noEmit
```

or:

```bash
npm run typecheck
```

This is useful for catching typing mistakes early, even though Playwright can execute TypeScript tests directly.

## Step 14. Recommended Project Structure

A simple structure that works well for an API-focused Playwright project:

```text
mythos-api-tests/
  tests/
    api/
    support/
  src/
    api/
    config/
  playwright.config.ts
  tsconfig.json
  package.json
  .env.example
  playwright-report/
  test-results/
```

What each part is for:

1. `tests/api/` contains API smoke, regression, and scenario tests
2. `tests/support/` contains shared test data and helper inputs
3. `src/api/` contains reusable API request helpers
4. `src/config/` contains environment-variable helpers and shared configuration code
5. `playwright.config.ts` contains the global Playwright configuration
6. `tsconfig.json` contains TypeScript compiler settings
7. `package.json` contains dependencies and runnable scripts
8. `.env.example` documents required environment variables
9. `playwright-report/` is generated after test runs for HTML reporting
10. `test-results/` is generated after test runs for traces and attachments

## Step 15. API Smoke Test Starter

The project includes a smoke test in `tests/api/mythology-read.spec.ts`.

What it does:

1. Uses the configured Playwright `baseURL`
2. Sends `GET /mythology`
3. Verifies that the response is successful and JSON
4. Carries both `@smoke` and `@read` tags

Why it works this way:

1. `/mythology` does not require a JWT token
2. It is a better real smoke test for this API than a placeholder endpoint
3. `USERNAME` and `PASSWORD` stay in `.env` for the future `/register` and JWT flow

## Step 16. Read Test Starter

The project includes read tests at `tests/api/mythology-read.spec.ts`.

What they cover:

1. `GET /mythology` returns a non-empty array
2. `GET /mythology?category=...` returns entities only from that category
3. `GET /mythology?sort=asc|desc` returns correctly sorted names
4. `GET /mythology/{id}` returns an existing entity
5. `GET /mythology/{id}` returns `404` for a non-existent entity

## Step 17. Auth Test Starter

The project also includes auth tests at `tests/api/auth.spec.ts`.

What they cover:

1. `POST /register` creates a new user
2. `POST /login` returns a JWT token for that user
3. The username is generated uniquely from the env prefix on every run to avoid duplicate-registration failures

## Step 18. Mythology CRUD Test Starter

The project also includes CRUD tests at `tests/api/mythology-crud.spec.ts`.

What they cover:

1. `POST /mythology` creates a new entity
2. `PATCH /mythology/{id}` updates selected fields
3. `PUT /mythology/{id}` replaces entity fields
4. `DELETE /mythology/{id}` removes the created entity

These tests:

1. Create a fresh user through the auth helper
2. Obtain a JWT token through `/login`
3. Work only with newly created entities, not system records
4. Clean up created data after the test when needed

## Step 19. Mythology Negative Test Starter

The project also includes negative tests at `tests/api/mythology-negative.spec.ts`.

What they cover:

1. `401 Unauthorized` for write operations without JWT
2. `400 Bad Request` for invalid create, patch, and put payloads
3. `403 Forbidden` for protected system entities like ID `1`

Why they matter:

1. They protect the API contract for auth and validation errors
2. They catch regressions that happy-path CRUD tests will not see
3. They verify that system records remain read-only

Before running it, update `.env` with the real API values for your project.

## Project Summary

This setup gives you:

1. An official Playwright project bootstrap flow
2. TypeScript support with strict checking
3. Environment variable support through `dotenv`
4. GitHub Actions support from the start
5. Tagged suites for focused local and CI runs
6. Clear HTML report and trace artifact handling
7. Easy test execution from both VS Code and the terminal
