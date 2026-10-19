# Make student dashboard listing labels and ratings accurate

On the student dashboard, update the “Recommended for you” section to describe
the existing feed accurately: it requests the four newest listings, so use a
heading such as “Latest approved homes” rather than implying personalized
recommendations. Do not add recommendation or machine-learning logic.

Remove the fabricated 4.8-star fallback from listing cards. Show a numeric
average and star only when the listing has at least one review and a valid
positive average; otherwise show “No reviews yet”. Preserve the API-backed
listing data, links, layout, and loading/error behavior.

After implementation, run frontend lint and TypeScript checks, then inspect the
authenticated student dashboard in the shared browser to verify the heading and
rating states against the live page.
