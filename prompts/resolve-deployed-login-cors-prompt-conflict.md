# Resolve the deployed-login CORS prompt merge conflict

## Goal

Clear the existing Git merge conflict so GitHub Desktop can continue the merge
without changing runtime application code.

## Scope

- Resolve only `prompts/fix-deployed-login-cors-origin.md`.
- Preserve the shared production Vercel URL, Render API URL, health/preflight
  evidence, required CORS/Render/documentation changes, tests, and secret
  handling requirements.
- Retain the more specific wording that the published frontend bundle
  correctly targets the Render API, while describing that backend CORS and the
  Render Blueprint currently use the old origin.
- Keep the requirement to make release operations documentation consistent
  with the production origin and deployment requirement.
- Keep the explicit instruction that backend redeployment is required and
  verify the deployed frontend origin receives the CORS preflight header.
- Remove all conflict markers, stage no files, create no commit, and leave
  every other modified or untracked file untouched.

## Validation

- Confirm `git diff --name-only --diff-filter=U` no longer lists this file.
- Confirm the resolved file contains no Git conflict markers.
- Run `git diff --check` scoped to the resolved prompt file.
