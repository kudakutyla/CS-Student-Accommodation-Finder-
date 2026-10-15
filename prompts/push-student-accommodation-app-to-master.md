# Push the Student Accommodation Finder to GitHub `master`

Complete the already-started merge of `origin/main` into the current `master`
branch so that `master` contains the full Student Accommodation Finder app from
`main`, rather than the unrelated Next.js starter.

Before resolving anything, inspect the current index, merge state, and worktree.
Preserve all staged changes and user files that are not part of a merge conflict.
Do not reset, discard, or overwrite unrelated work.

Resolve the remaining merge conflicts to keep the active application from
`origin/main`, including its backend and frontend configuration and app pages.
Honor deletions of obsolete `client/.gitignore` and `server/.gitignore` where
the merge confirms both branches deleted them. Ensure `backend/.gitignore`
retains the `/uploads/` ignore rule. Do not add credentials, environment files,
or local uploads to version control.

After resolution, verify the merge has no unmerged paths, inspect the final
diff and tracked files, run the smallest relevant build/type checks available,
and confirm the frontend route and backend health endpoint where possible.
Then create a merge commit on `master` and push it to `origin master`. Do not
force-push. If the remote rejects the push or checks reveal a blocking issue,
stop and report the exact cause without rewriting remote history.

The current remote `main` already contains the full application; do not create
an unnecessary commit or push to `main` unless inspection shows it has new
local commits that the user asked to publish.
