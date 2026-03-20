---
description: Analyze the codebase and generate/update AGENTS.md with project documentation
agent: loki
---

Analyze the current repository/project and create or update the `AGENTS.md` file at the project root.

If `AGENTS.md` already exists, update it with the latest information while preserving any manual additions. If it does not exist, create it from scratch.

Target path to analyze: $ARGUMENTS (if no argument is provided, analyze the root directory `.`)

## Instructions

Follow these steps in order:

### Step 1: Scan the project structure

- Explore the full directory tree (excluding `.opencode`, `openspec`, `node_modules`, `vendor`, `target`, `build`, `dist`, `.git`, `__pycache__`, `.venv`, `venv`, and similar generated/dependency directories).
- Identify all sub-projects by looking for manifest/config files such as:
  - `package.json` (Node.js/JS/TS)
  - `go.mod` (Go)
  - `Cargo.toml` (Rust)
  - `pom.xml` / `build.gradle` / `build.gradle.kts` (Java/Kotlin)
  - `pyproject.toml` / `setup.py` / `requirements.txt` / `Pipfile` (Python)
  - `composer.json` (PHP)
  - `Gemfile` (Ruby)
  - `*.csproj` / `*.sln` (C#/.NET)
  - `pubspec.yaml` (Dart/Flutter)
  - Or any other language-specific manifest files found.

### Step 2: Gather information for each sub-project

For each sub-project (or the root project if it is a single project), collect:
- **Description**: A brief summary of what the sub-project does (1-2 sentences).
- **Language**: The primary programming language.
- **Main Libraries/Frameworks**: Key dependencies (list only the most important ones, not every dependency).
- **Version**: The version from the manifest file if available.

### Step 3: Look for operational information

Search the codebase for:

1. **Migrations**: Look for migration directories (`migrations/`, `db/migrate/`, `alembic/`, `prisma/migrations/`, `drizzle/`, `src/migrations/`, etc.), ORM config files, or migration scripts. Note the tool used and how to run migrations.

2. **Running Tests**: Look for test configurations (`jest.config.*`, `vitest.config.*`, `pytest.ini`, `phpunit.xml`, `.mocharc.*`, `cargo test`, `go test`, etc.) and test scripts in manifest files (e.g., `"test"` script in `package.json`). Note the commands to run tests.

3. **Running the Project**: Look for dev/start scripts in manifest files (e.g., `"dev"`, `"start"`, `"serve"` in `package.json`), `Dockerfile`, `docker-compose.yml`, `Makefile`, `Procfile`, or similar. Note the commands to start the project.

Only include these sections if you actually find relevant information in the codebase. If nothing is found for a section, write "N/A - No information found in the codebase."

### Step 4: Write AGENTS.md

Create or update `AGENTS.md` at the project root using this exact structure:

```markdown
# AGENTS.md

## Project Description

<Write a concise description of approximately 100 words about the project/repository. Cover what the project does, its purpose, and its main technology stack.>

## Folder Structure

<Render a tree-style view of the project directory structure at the FOLDER level only. Do NOT list individual files inside each folder. Instead, add a short inline comment after each folder describing its purpose. Exclude dependency/build/generated directories.>

Example format:
\`\`\`
project/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route page components
│   └── utils/         # Helper functions and utilities
├── tests/             # Unit and integration tests
└── docs/              # Project documentation
\`\`\`

## Sub-projects

### <sub-project-name>

- **Description**: <1-2 sentence summary>
- **Language**: <primary language>
- **Main Libraries**: <comma-separated list of key dependencies>
- **Version**: <version from manifest or "N/A">

<Repeat for each sub-project. If it is a single project (not a monorepo), still use this format with one entry.>

## Migrations

<Migration tool, directory location, and commands to run migrations. Write "N/A - No information found in the codebase." if none found.>

## Running Tests

<Test framework, configuration file location, and commands to run tests. Write "N/A - No information found in the codebase." if none found.>

## Running the Project

<Commands and steps to start/run the project in development and/or production. Write "N/A - No information found in the codebase." if none found.>
```

## Important rules

- **DO NOT** include best practices, coding standards, or style guide sections.
- **DO NOT** fabricate information. Only include what you can verify from the actual codebase.
- **DO** use English for all content in AGENTS.md.
- **DO** keep the Project Description close to 100 words.
- **DO** preserve any existing manual sections in AGENTS.md if updating (append new sections, update existing ones).
