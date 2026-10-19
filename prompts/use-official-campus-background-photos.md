# Use official campus photos as campus-card backgrounds

## Goal

On the authenticated student dashboard, replace the currently rotated generic
background photos on the “Popular campuses” cards with the appropriate official
campus/institution photo below. Keep each current institution logo, overlays,
campus badge, listing count, card structure, and click-through behavior unchanged;
only replace the background image source and add the smallest image-loading
support required.

Use campus-name matching first. Where campus-specific photography is unavailable,
use the same institution's verified image for that institution's cards. Preserve
the source URLs as supplied; do not substitute search-result thumbnails or
unverified images. The user has authorized reuse of official institution-site
photos. These verified mappings cover 8 of the 19 public campus records:

| Campus/institution | Background photo | Mapping |
| --- | --- | --- |
| Sol Plaatje University (North Campus) | https://www.spu.ac.za/wp-content/uploads/2026/02/signature-picture.jpg | Institution-level fallback; official image appears in the “Campus, Infrastructure and the City University Model” section. Source: https://www.spu.ac.za/index.php/spu-at-a-glance/ |
| Nelson Mandela University — South Campus | https://www.mandela.ac.za/www/media/Store/images/On%20campus/Campus%20information%20and%20maps/South.jpg | Campus-specific South Campus image. Source: https://www.mandela.ac.za/About-us/Campuses/Campus-maps |
| University of Cape Town | https://uct.ac.za/sites/default/files/content_migration/uct_ac_za/49/images/UCT_view-from-plaza-on-upper-campus.jpg | Campus-specific Upper Campus image. Source: https://uct.ac.za/students/prospective-students/campus-tours |
| University of Limpopo — Turfloop | https://www.ul.ac.za/wp-content/uploads/2023/10/Campus.png | Institution-level campus-image fallback. Source: https://www.ul.ac.za/ ; https://www.ul.ac.za/campus-life/ |
| University of Mpumalanga — Mbombela | https://www.ump.ac.za/getmedia/35bf35e7-676d-4457-a550-93a1aa1f11ef/CampusM.jpg.aspx | Campus-specific Mbombela photo. Source: https://www.ump.ac.za/About-us/Campuses.aspx |
| University of Pretoria — Hatfield | https://virtualcampus.up.ac.za/wp-content/uploads/2018/06/hatfield.jpg | Campus-specific Hatfield image. Source: https://virtualcampus.up.ac.za/ |
| University of South Africa — Muckleneuk | https://www.unisa.ac.za/static/corporate_web/Content/About/Unisa%20Visitors%20Guide/images/unisa-campuses-muckleneuk.jpg | Campus-specific Muckleneuk image. Source: https://www.unisa.ac.za/sites/corporate/default/Contact-us/Visit-Unisa-from-outside-South-Africa/Quick-guide-of-Unisa-campuses-&-regional-centres |
| University of the Witwatersrand | https://www.wits.ac.za/media/wits-university/centenary/images/priorities/Panorama-view-of-Braamfontein-campus.png | Campus-specific Braamfontein campus image. Source: https://www.wits.ac.za/about-wits/ |

## No verified photo for TUT or VUT

Sefako Makgatho Health Sciences University has a verified SMU photo, but the
requested dashboard treatment is to use its institution logo as the background.
No usable campus or institution campus photo could be loaded and verified for
the two UJ campuses: the official-site image URL returned HTTP 403. No usable
image was verified for TUT Arcadia, Arts, Ga-Rankuwa, Mbombela, Polokwane,
Pretoria, or Soshanguve. Do not use the unrelated classroom/student image found
on TUT's campus-visits page, and do not reuse the current generic image rotation
for these cards. The VUT image found on its precinct-revitalization article is a
group/project-site photo, not a verifiable campus-building photo; do not present
it as the Vaal campus background. Use the institution logos as backgrounds for
these ten cards, keeping the foreground logos visible as before.

## Requirements

- Match known campuses by stable campus ID if an exhaustive mapping is practical;
  otherwise match normalized campus and institution names with an explicit,
  typed mapping. Do not derive filenames by string concatenation.
- Keep logo rendering/fallback behavior independent from the background photo.
- If an official image fails to load, show the neutral gradient for that card;
  never replace it with an unrelated campus/institution image.
- Preserve responsive cropping and card overlays so the campus logo and white
  text remain legible.
- Do not change API/data models or add database fields for these fixed mappings.
- Run frontend lint and TypeScript checks, then inspect `/student/dashboard` live
  and confirm logos remain while background photos correspond to the mappings.
