# Type the landing hero eyebrow label

Add a brief typewriter reveal to the existing “Student accommodation finder” eyebrow
text in `frontend/app/page.tsx`. Reveal the phrase once on page load at a readable pace;
do not repeat it or affect the hero heading, supporting copy, or image slideshow.

Keep it accessible: expose the complete phrase to assistive technology without announcing
each typed character. If reduced motion is preferred, render the full phrase immediately.
Clean up any timer used for the animation.

Verify the phrase completes, remains readable while the hero slideshow runs, respects
reduced motion, and the mobile layout has no horizontal overflow. Run frontend TypeScript
and targeted ESLint checks.
