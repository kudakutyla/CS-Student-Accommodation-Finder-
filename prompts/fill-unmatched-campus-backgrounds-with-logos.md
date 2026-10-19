# Use institution logos as backgrounds where campus photos are unavailable

On the student dashboard's “Popular campuses” cards, for campuses without a
verified campus or institution photo, fill the card background area with the
institution's existing logo, centered and scaled to fit without distortion.
This applies to all campuses with no background mapping (including the TUT and
UJ campuses and VUT) and specifically Sefako Makgatho Health Sciences
University. Keep the current logo badge, campus text, listing count, and
campus-specific photo backgrounds unchanged for all other campuses.

Reuse the existing `InstitutionLogo` resolution/fallback behavior where
possible. Avoid rendering competing logos twice if the card-background logo can
replace the center badge for only these unmatched-photo cards; otherwise retain
the badge and display a larger, low-opacity/contained logo behind it for a
readable, deliberate composition. Keep fallback visuals graceful when an
institution has no usable logo.

Run frontend lint, type-check, and build, then inspect the authenticated
dashboard in the browser to verify mapped photo cards and logo-background cards.
