# Fill photo-less campus cards with institution logos

On the student dashboard's “Popular campuses” cards, use an enlarged,
contained institution logo as the background fill for every campus without a
verified background photo. Also use the institution logo background for
Sefako Makgatho Health Sciences University (SMU), even though an SMU campus
photo is mapped. Keep all other verified campus/institution photo backgrounds
unchanged.

Keep the existing foreground institution logo badge and all card content,
overlays, listing counts, campus names, and navigation unchanged. Reuse the
existing `InstitutionLogo` source and fallback behavior; if a logo is
unavailable, use a clean neutral background with the existing text/initials
fallback rather than a broken image.

Verify on the authenticated `/student/dashboard` page that SMU and every
photo-less campus use a logo-filled background, while other photo-backed
campuses keep their images. Run frontend lint, type-check, and build.
