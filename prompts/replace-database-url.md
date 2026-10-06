# Replace the Local Database URL

Update the `DATABASE_URL` value in `backend/.env` to the PostgreSQL URL supplied by the user in this conversation. Do not print, log, or copy the credential into any tracked file. Leave `DIRECT_URL` and all other environment variables unchanged.

After the change, verify without displaying secret values that `DATABASE_URL` is present and `backend/.env` remains ignored by Git. Do not run database commands or connect to the database as part of this change.

Security note: the supplied credential has been exposed in this conversation; recommend rotating the database password before using the URL.