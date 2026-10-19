# Auto-dismiss copied-address controls

On `/student/favourites`, after the address copy succeeds, show the copied
confirmation briefly and automatically hide both that confirmation and the
copy control after 2 seconds. Keep the address-triggered control behavior and
do not dismiss on copy failure; preserve the failure feedback so the user can
retry. Clean up any timer when the component unmounts or another address is
selected. Verify lint and TypeScript checks.
