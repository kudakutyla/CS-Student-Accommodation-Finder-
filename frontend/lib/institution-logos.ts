const OFFICIAL_INSTITUTION_LOGOS: Record<string, string> = {
  'Nelson Mandela University': 'https://www.mandela.ac.za/App_Themes/global/images/logo-white.png',
  'Sefako Makgatho Health Sciences University': 'https://www.smu.ac.za/wp-content/uploads/2023/10/smu_logo-300x86-1.png',
  'Sol Plaatje University': 'https://www.spu.ac.za/wp-content/uploads/2018/09/cropped-CORRECT-CREST-AND-MOTTO-e1537193379737-1.jpg',
  'South African College of Applied Psychology': 'https://www.sacap.edu.za/wp-content/themes/greenbox/img/sacap-g.png',
  'Tshwane University of Technology': 'https://www.tut.ac.za/media/tshwane-interim/site-assets/images/tut-logo.svg',
  'University of Cape Town': 'https://www.uct.ac.za/themes/custom/blip_uct/logo.svg',
  'University of Fort Hare': 'https://www.ufh.ac.za/wp-content/uploads/2025/02/UFH-Logo-web.svg',
  'University of Johannesburg': 'https://www.uj.ac.za/wp-content/uploads/2026/03/uj_logo.jpg',
  'University of Limpopo': 'https://www.ul.ac.za/wp-content/uploads/2023/10/university-of-limpopo-logo.png',
  'University of Mpumalanga': 'https://www.ump.ac.za/images/logo.png',
  'University of Pretoria': 'https://www.up.ac.za/themes/custom/up2024/images/horizontal-logo-bg.png',
  'University of South Africa': 'https://www.unisa.ac.za/static/corporate_web/Content/Temporary/unisa_logo_tagline.svg',
  'University of the Witwatersrand': 'https://www.wits.ac.za/media/wits-university-style-assets/images/wits-logo.svg',
  'Vaal University of Technology': 'https://vut.ac.za/wp-content/uploads/2024/11/cropped-VUT-logo-300x100.png',
};

export function getOfficialInstitutionLogo(name: string | undefined): string | undefined {
  return name ? OFFICIAL_INSTITUTION_LOGOS[name.trim()] : undefined;
}
