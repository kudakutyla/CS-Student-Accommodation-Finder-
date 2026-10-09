# Create a Postman API test collection (GET and POST only)

## Goal

Create an importable Postman collection documenting and testing the existing
Student Accommodation Finder API. Include only `GET` and `POST` requests.

## Requirements

- Add `postman/student-accommodation-finder.postman_collection.json` in
  Postman Collection v2.1 format.
- Derive request paths, authentication requirements, query parameters, and
  request bodies from the current Express routes and validators.
- Organize requests into practical folders such as health, authentication,
  campuses, listings, student reports, and conversations.
- Cover representative public reads, authenticated reads, student writes,
  and admin reads. Include Postman test scripts for expected status codes,
  the API success envelope, and saving returned token/ID values to variables
  when safe and applicable.
- Use collection/environment variables for base URL, credentials, role tokens,
  and record IDs. Do not embed production credentials, API keys, or tokens.
- Add request descriptions for prerequisites, roles, expected results, and
  operations that create persistent records or call rate-limited OpenStreetMap
  services. Do not automatically run requests or create records.
- Do not add any method other than GET or POST; do not change application code,
  API routes, database schema, or dependencies.

## Validation

- Parse the collection as JSON and verify every request method is exactly
  `GET` or `POST`.
- Review paths and payloads against the existing routes and validators.
- Run `git diff --check`.
