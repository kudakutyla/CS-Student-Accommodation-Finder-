# Add a downloadable QR code for the landing page

Create a public `/share` page that presents a clear, scannable QR code encoding exactly
`https://cs-student-accommodation-finder.vercel.app/`. Generate the QR image locally in
the application with a maintained QR-code library; do not use a third-party QR image
service. Use a high-contrast dark-on-white design, a generous quiet zone, and sufficient
resolution for printing.

Provide a direct PNG download named `abode-landing-page-qr.png` and a print action or
clear browser-print instructions. Include concise text showing the destination URL and a
link to open it. Add a “Share Abode” link in the global footer to `/share`. Keep the page
responsive and print-friendly, and ensure the code remains legible at mobile and desktop
sizes.

Add only the necessary QR dependency and update the package lockfile. Verify that the QR
encodes the exact public URL, its download is a valid PNG, `/share` loads, the footer link
resolves, and the page works at mobile width. Run frontend TypeScript, targeted ESLint, and
the frontend build if practical.
