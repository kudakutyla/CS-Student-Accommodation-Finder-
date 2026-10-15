# Show Official Logos on Student Campus Cards

Use the user's Tshwane University of Technology logo screenshot as the visual
reference, and show real institution logos on the student dashboard's campus
cards instead of initials whenever an official logo can be verified.

## Current behavior and scope

- `frontend/app/student/dashboard/page.tsx` already renders
  `campus.institution.logoUrl`, with an initials fallback.
- The admin institution form already supports configuring an optional official
  logo URL.
- The live institution API currently returns these active records:
  Desmond Tutu Centre for Religion and Social Justice, Nelson Mandela
  University, Sefako Makgatho Health Sciences University, Sol Plaatje
  University, South African College of Applied Psychology, Tshwane University
  of Technology, University of Cape Town, University of Johannesburg,
  University of Limpopo, University of Mpumalanga, University of Pretoria,
  University of South Africa, University of the Witwatersrand, Vaal University
  of Technology, and an institution named `ko`.

## Requirements

- Identify official, direct image URLs for the recognizable institutions,
  verifying each URL against the institution's own website or another
  institution-controlled source. Do not use Google search/result thumbnails,
  logo aggregators, or guessed image paths.
- Preserve the administrator-configured `logoUrl` as the preferred value.
  Where it is absent, use a small, typed frontend fallback map keyed by the
  institution's canonical name so logos appear without requiring database
  writes or migrations. Do not hard-code per-campus copies of the same logo.
- Keep the visual treatment close to the example: clear, recognizable logo,
  contained without distortion, on a clean light background. Preserve
  meaningful image alt text and the existing initials fallback if an image
  fails or no verified official asset exists.
- Do not invent a logo for the ambiguous `ko` record; keep its fallback rather
  than displaying an unverified mark.
- Keep frontend integration through the established API client and preserve
  the current responsive campus-card layout and campus navigation.
- Do not change database records, apply migrations, or expose third-party
  credentials. Update directly related docs only if the source/maintenance
  behavior needs documenting.

## Validation

- Add or update focused tests for admin URL precedence, official-logo fallback,
  unknown institutions, and image failure fallback where the existing test
  setup supports them.
- Run targeted frontend lint/type checks and production build, plus
  `git diff --check`.
- Verify the student dashboard renders the logo for a campus affiliated with
  Tshwane University of Technology and retains initials for unknown institutions.
