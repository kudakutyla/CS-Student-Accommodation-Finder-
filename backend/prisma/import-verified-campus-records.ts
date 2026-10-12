import prisma from '../src/config/prisma';
import {
  Coordinates,
  LocationServiceError,
  resolveAddressCoordinates,
} from '../src/utils/geocode';

const existingCampusLinks: Array<{
  campusName: string;
  institutionName: string;
  isActive?: boolean;
}> = [
  { campusName: 'TUT Pretoria Campus', institutionName: 'Tshwane University of Technology', isActive: true },
  { campusName: 'TUT Soshanguve Campus', institutionName: 'Tshwane University of Technology', isActive: true },
  { campusName: 'University of Cape Town', institutionName: 'University of Cape Town' },
  { campusName: 'University of Pretoria (Hatfield)', institutionName: 'University of Pretoria' },
  { campusName: 'University of the Witwatersrand', institutionName: 'University of the Witwatersrand' },
];

const mappedCampuses = [
  {
    institutionName: 'Tshwane University of Technology',
    name: 'TUT Arcadia Campus',
    location: 'Pretoria, Gauteng',
    address: 'TUT Arcadia, Nelson Mandela Drive, Trevenna, Tshwane Ward 81, Pretoria, City of Tshwane Metropolitan Municipality, Gauteng, 0002, South Africa',
    geocodeQuery: 'TUT Arcadia, Pretoria, South Africa',
  },
  {
    institutionName: 'Tshwane University of Technology',
    name: 'TUT Arts Campus',
    location: 'Pretoria, Gauteng',
    address: 'TUT Arts Campus, Oumashoop Crescent, Tshwane Ward 58, Pretoria, City of Tshwane Metropolitan Municipality, Gauteng, 0002, South Africa',
    geocodeQuery: 'TUT Arts campus, Pretoria, South Africa',
  },
  {
    institutionName: 'Tshwane University of Technology',
    name: 'TUT Ga-Rankuwa Campus',
    location: 'Ga-Rankuwa, Gauteng',
    address: 'Tshwane University of Technology: Ga-Rankuwa Campus, Botsi Street, Ga-Rankuwa, Tshwane Ward 31, Ga-Rankuwa, City of Tshwane Metropolitan Municipality, Gauteng, 0208, South Africa',
    geocodeQuery: 'Tshwane University of Technology Ga-Rankuwa Campus, Ga-Rankuwa, South Africa',
  },
  {
    institutionName: 'Tshwane University of Technology',
    name: 'TUT Mbombela Campus',
    location: 'Mbombela, Mpumalanga',
    address: 'Tshwane University of Technology, Madiba Drive, Mbombela Ward 16, Mbombela, Ehlanzeni, Mpumalanga, 1201, South Africa',
    geocodeQuery: 'Tshwane University of Technology, Madiba Drive, Mbombela, Mpumalanga, South Africa',
  },
  {
    institutionName: 'Tshwane University of Technology',
    name: 'TUT Polokwane Campus',
    location: 'Polokwane, Limpopo',
    address: 'Tshwane University of Technology, Church Street, Polokwane Ward 23, Polokwane, Polokwane Local Municipality, Capricorn District Municipality, Limpopo, 0750, South Africa',
    geocodeQuery: 'Tshwane University of Technology, Church Street, Polokwane, South Africa',
  },
  {
    institutionName: 'Sol Plaatje University',
    name: 'Sol Plaatje University (North Campus)',
    location: 'Kimberley, Northern Cape',
    address: 'Sol Plaatje University (North Campus), Sol Plaatje Drive, New Park, Sol Plaatje Ward 23, Sol Plaatje Local Municipality, Frances Baard District Municipality, Northern Cape, 8315, South Africa',
  },
  {
    institutionName: 'University of Johannesburg',
    name: 'University of Johannesburg Auckland Park Kingsway Campus',
    location: 'Johannesburg, Gauteng',
    address: 'University of Johannesburg Auckland Park Kingsway Campus, Kingsway Avenue, Aukland Park, Johannesburg Ward 69, Johannesburg, City of Johannesburg Metropolitan Municipality, Gauteng, 2001, South Africa',
  },
  {
    institutionName: 'University of Johannesburg',
    name: 'University of Johannesburg - Doornfontein Campus',
    location: 'Johannesburg, Gauteng',
    address: 'University of Johannesburg - Doornfontein Campus, Nind Street, Doornfontein, Johannesburg Ward 123, Johannesburg, City of Johannesburg Metropolitan Municipality, Gauteng, 2001, South Africa',
  },
  {
    institutionName: 'University of Limpopo',
    name: 'University of Limpopo (Turfloop Campus)',
    location: 'Mankweng, Limpopo',
    address: 'University of Limpopo, University Road, Polokwane Ward 27, Mankweng, Polokwane Local Municipality, Capricorn District Municipality, Limpopo, 0727, South Africa',
    geocodeQuery: 'University of Limpopo, Mankweng, South Africa',
  },
  {
    institutionName: 'University of Mpumalanga',
    name: 'University of Mpumalanga (Mbombela Campus)',
    location: 'Mbombela, Mpumalanga',
    address: 'University of Mpumalanga, Eastern Boulevard, Riverside Park, Mbombela Ward 14, Mbombela, Ehlanzeni, Mpumalanga, 1200, South Africa',
    geocodeQuery: 'University of Mpumalanga, Mbombela, Mpumalanga, South Africa',
  },
  {
    institutionName: 'University of South Africa',
    name: 'University of South Africa (Muckleneuk Campus)',
    location: 'Pretoria, Gauteng',
    address: 'University of South Africa - Muckleneuk Campus, Preller Street, Lukasrand, Tshwane Ward 59, Pretoria, City of Tshwane Metropolitan Municipality, Gauteng, 0060, South Africa',
  },
];

const shortNamesForLegacyInstitutions: Record<string, string> = {
  'University of Cape Town': 'UCT',
  'University of the Witwatersrand': 'Wits',
};

const campusesRequiringVerifiedAddresses = [
  'TUT Soshanguve North Campus',
  'TUT eMalahleni Campus',
];

type ResolvedCampus =
  | {
      campus: (typeof mappedCampuses)[number];
      institutionId: string;
      existingId: string;
    }
  | {
      campus: (typeof mappedCampuses)[number];
      institutionId: string;
      coordinates: Coordinates;
    };

async function main(): Promise<void> {
  const institutions = await prisma.institution.findMany({
    select: { id: true, name: true },
  });
  const institutionsByName = new Map(institutions.map((institution) => [institution.name, institution]));

  const resolvedCampuses: ResolvedCampus[] = [];
  const unresolvedCampuses: string[] = [];
  for (const campus of mappedCampuses) {
    const institution = institutionsByName.get(campus.institutionName);
    if (!institution) throw new Error(`Institution not found: ${campus.institutionName}`);

    const existing = await prisma.campus.findUnique({ where: { name: campus.name } });
    if (existing?.institutionId && existing.institutionId !== institution.id) {
      throw new Error(`Campus "${campus.name}" is already linked to a different institution.`);
    }
    if (existing) {
      resolvedCampuses.push({ campus, institutionId: institution.id, existingId: existing.id });
      continue;
    }

    try {
      const coordinates = await resolveAddressCoordinates(campus.geocodeQuery ?? campus.address, {
        locality: campus.location,
        fallbackQuery: campus.name,
        label: 'campus',
      });
      resolvedCampuses.push({ campus, institutionId: institution.id, coordinates });
    } catch (error) {
      if (error instanceof LocationServiceError && error.statusCode === 422) {
        unresolvedCampuses.push(campus.name);
        continue;
      }
      throw error;
    }
  }

  let linked = 0;
  let created = 0;
  let institutionsCreated = 0;
  const institutionIdsByName = new Map(institutionsByName);

  async function ensureInstitution(institutionName: string): Promise<string> {
    const institution = institutionIdsByName.get(institutionName);
    if (institution) return institution.id;
    const createdInstitution = await prisma.institution.upsert({
      where: { name: institutionName },
      update: {},
      create: {
        name: institutionName,
        shortName: shortNamesForLegacyInstitutions[institutionName] ?? null,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    institutionsCreated += 1;
    institutionIdsByName.set(institutionName, createdInstitution);
    return createdInstitution.id;
  }

  for (const link of existingCampusLinks) {
    const institutionId = await ensureInstitution(link.institutionName);
    const existing = await prisma.campus.findUnique({ where: { name: link.campusName } });
    if (!existing) continue;
    if (existing.institutionId && existing.institutionId !== institutionId) {
      throw new Error(`Campus "${link.campusName}" is already linked to a different institution.`);
    }
    if (!existing.institutionId) {
      await prisma.campus.update({
        where: { id: existing.id },
        data: {
          institutionId,
          ...(link.institutionName === 'Tshwane University of Technology' ? { isActive: link.isActive } : {}),
        },
      });
      linked += 1;
    } else if (link.institutionName === 'Tshwane University of Technology' && !existing.isActive) {
      await prisma.campus.update({
        where: { id: existing.id },
        data: { isActive: link.isActive },
      });
      linked += 1;
    }
  }

  for (const item of resolvedCampuses) {
    const institutionId = await ensureInstitution(item.campus.institutionName);
    if ('existingId' in item) {
      const existing = await prisma.campus.findUnique({ where: { id: item.existingId } });
      if (!existing) throw new Error(`Campus "${item.campus.name}" disappeared during import.`);
      if (!existing.institutionId) {
        await prisma.campus.update({
          where: { id: existing.id },
          data: { institutionId },
        });
        linked += 1;
      }
      continue;
    }
    await prisma.campus.create({
      data: {
        name: item.campus.name,
        institutionId,
        location: item.campus.location,
        address: item.campus.address,
        latitude: item.coordinates.latitude,
        longitude: item.coordinates.longitude,
        isActive: true,
      },
    });
    created += 1;
  }

  console.log(
    `Campus catalog updated: ${created} new campuses added; ` +
    `${linked} existing campus records linked; ` +
    `${institutionsCreated} institutions restored for legacy campuses; ` +
    `${unresolvedCampuses.length} campus addresses could not be verified.`
  );
  for (const name of unresolvedCampuses) console.log(`Unresolved campus address: ${name}`);
  console.log(`TUT campuses awaiting verifiable South African address/coordinates: ${campusesRequiringVerifiedAddresses.join(', ')}.`);
}

main()
  .catch((error: unknown) => {
    console.error('Verified campus import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
