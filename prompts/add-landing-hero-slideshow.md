# Add an automatic landing hero slideshow

In `frontend/app/page.tsx`, turn the landing-page hero card background into an automatic
slideshow using the existing local photos under `frontend/public/images/` (the campus hero
and existing campus/student accommodation photos). Advance to the next image every 2 seconds.
Keep the current heading and supporting copy fixed and readable over the images; use a
subtle crossfade and preserve the existing hero dimensions and mobile layout.

Treat all hero photos as decorative. Honor the operating system's reduced-motion preference
by leaving the initial hero image static when reduced motion is enabled. Keep the slideshow
timer cleaned up correctly and avoid loading unrelated/external images.

Verify that the hero image changes at the requested interval, text remains visible, the
mobile layout has no horizontal overflow, and run frontend TypeScript and targeted ESLint
checks.
