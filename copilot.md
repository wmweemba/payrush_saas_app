Purpose: Help GitHub Copilot / Copilot Chat understand repository goals, coding conventions, and how to generate code and tests in a way that matches our project style.

Repo conventions

Language: JavaScript (ES Modules) — no TypeScript.

Framework: Next.js (app or pages directory allowed) — prefer pages/ for simplest free-tier compatibility unless migrating to Next 13+ app router intentionally.

Styling: Tailwind CSS.

DB/Auth: Supabase (server-side @supabase/supabase-js).

APIs: Next.js API routes under pages/api/*.js.

Lint & format: ESLint + Prettier (recommended settings in .eslintrc / .prettierrc).

File layout expectation (example)



Copilot behavioral tips

When asked to modify a file, output a single code block containing the whole file.

When asked for SQL, return only the SQL script without extra commentary.

When asked for API handlers, include comments explaining each step and list required environment variables at the top.

Prefer small, testable functions with JSDoc style comments.

Commit message convention

feat: add invoice creation UI

fix: handle webhook idempotency

chore: update deps

docs: update copilot.md