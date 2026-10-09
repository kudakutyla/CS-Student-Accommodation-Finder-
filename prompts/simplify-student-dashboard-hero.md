# Simplify student dashboard hero

## Goal

Update the Student dashboard landing section based on the requested screenshot
and clarification: remove the institution/campus filter controls and the Live
overview panel, while retaining the heading, description, feature badges, and
all content sections below the hero.

## Implementation

- In `frontend/app/student/dashboard/page.tsx`, remove the institution/campus
  filter state and institution API request that are no longer needed.
- Keep the hero heading (“Student dashboard”), title, description, and feature
  badges.
- Keep a “Search homes” link to `/listings` and add a “Saved homes” link to
  `/student/favourites` in the hero actions.
- Remove only the Live overview panel and the filter inputs; preserve the
  popular campuses and recommended homes sections, request error state, and
  student-only route guard.
- Do not change other routes or global navigation.

## Validation

- Run frontend lint for the dashboard page.
- Run the frontend TypeScript check if available.
- Run `git diff --check`.
- Verify the hero has no institution/campus filters or Live overview, and both
  navigation actions target the existing pages.
