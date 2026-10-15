# Create an API test-cases PDF

## Goal

Produce a readable PDF guide for the existing Student Accommodation Finder
Postman API test cases.

## Requirements

- Use the existing `postman/student-accommodation-finder.postman_collection.json`
  as the source of truth for paths, methods, payloads, variables, and test
  expectations; cross-check route-dependent details against the backend routes
  and validators as needed.
- Save the deliverable as
  `postman/Student-Accommodation-Finder-API-Test-Cases.pdf`.
- Include setup/prerequisites, local base URL, role-token and record-ID
  variable guidance, request case IDs, HTTP method and path, required role and
  prerequisites, request body/query parameters, expected status/result, and
  notable persistent-data or external-geocoder effects.
- Include only `GET` and `POST` test cases. Make it clear the PDF documents
  test procedures; do not execute requests or mutate the database.
- Keep the PDF readable when printed: clear title, contents/sections, page
  numbers, consistent headings, legible request/response details, and sensible
  page breaks. Do not include credentials, tokens, or other secrets.
- Do not change application behavior, API routes, the Postman collection, or
  dependencies unless a collection inconsistency is discovered; stop and
  report any such inconsistency instead of silently changing scope.

## Validation

- Verify the generated file is a valid, non-empty PDF and inspect its page
  count and extracted text for representative cases from every section.
- Confirm every documented method is `GET` or `POST` and documented case count
  matches the collection.
- Run `git diff --check`.
