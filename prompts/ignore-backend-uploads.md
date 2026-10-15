# Ignore generated backend uploads

## Goal

Prevent runtime-uploaded files under `backend/uploads/` from appearing as
untracked source changes.

## Scope

- Add `/uploads/` to `backend/.gitignore`, where the root-anchored pattern
  ignores the backend upload directory.
- Do not change `frontend/.gitignore`.
- Do not stage files, create a commit, or alter upload contents.

## Validation

- Confirm `backend/uploads/` matches the ignore rule with `git check-ignore`.
- Run `git diff --check` for `backend/.gitignore`.
