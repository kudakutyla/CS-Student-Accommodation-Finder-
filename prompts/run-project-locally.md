# Run Student Accommodation Finder Locally

Start the existing Student Accommodation Finder application for local development.

## Scope

- Start the backend API from `backend/` using its existing `npm run dev` script.
- Start the frontend from `frontend/` using its existing `npm run dev` script.
- Keep both processes running in attached background sessions while the user uses the app.
- Confirm the frontend responds at `http://localhost:3000` and, if available, the backend responds at its configured local API URL.
- Report any startup or configuration errors clearly and provide exact local URLs and test steps.

## Safety and constraints

- Do not print or disclose `.env` or `.env.local` contents, credentials, or tokens.
- Do not modify environment files, install or update dependencies, run database migrations or schema pushes, seed data, or import demo data.
- Do not use production credentials or make destructive database changes.
- If required configuration or dependencies are missing, stop and explain what is needed rather than guessing or making changes.
- Make no application-code changes.
