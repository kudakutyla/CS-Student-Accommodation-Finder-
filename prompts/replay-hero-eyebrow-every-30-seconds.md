# Replay the hero eyebrow typewriter every 30 seconds

Update the existing “Student accommodation finder” typewriter animation in
`frontend/app/page.tsx` so it types the phrase on initial page load, then repeats the
typewriter animation every 30 seconds. Keep the full phrase visible between plays, clear it
only when the next 30-second cycle begins, and type it at the existing readable pace.

Preserve the accessibility behavior, reduced-motion behavior (show the full phrase
immediately without animation), and the independent 2-second hero image slideshow. Clean
up timers on unmount.

Verify the first typing and the 30-second replay behavior (using controlled browser timers
or an equivalent test), and run frontend TypeScript and targeted ESLint checks.
