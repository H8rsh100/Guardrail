# Guardrail — Phase A, Step 1

Automated mechanical deployment chain proof-of-concept.

## Overview
Guardrail automatically creates a target GitHub repository, pushes a pre-configured template (`hello-world`), and monitors GitHub Actions CI execution to completion.

## Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your `GITHUB_TOKEN` (Personal Access Token classic with `repo` and `workflow` scope) and `GITHUB_USERNAME`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the orchestrator:
   ```bash
   npm start
   ```
