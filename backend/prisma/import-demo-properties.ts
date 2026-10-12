import { randomBytes } from 'crypto';
import { AccommodationType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma';
import {
  calculateRouteDistanceBetweenCoordinates,
  searchNearbyAccommodationLocations,
} from '../src/utils/geocode';
import {
  importDemoProperties,
} from '../src/utils/demo-property-import';

const dryRun = !process.argv.includes('--apply');

async function main(): Promise<void> {
  const summary = await importDemoProperties({
    getActiveCampuses: () => prisma.campus.findMany({
      where: { isActive: true, institution: { isActive: true } },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
      },
      orderBy: [{ institution: { name: 'asc' } }, { name: 'asc' }],
    }),
    findDemoLandlordId: async (email) => {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, isVerified: true, isActive: true },
      });
      if (!user) return null;
      if (user.role !== UserRole.LANDLORD || !user.isVerified || user.isActive) {
        throw new Error(`Reserved demo email belongs to an incompatible account: ${email}`);
      }
      return user.id;
    },
    getExistingListings: async (ownerId, campusId) =>
      prisma.listing.findMany({
        where: { ownerId, campusId, title: { startsWith: '[DEMO DATA]' } },
        select: { title: true, address: true },
      }),
    findNearbyProperties: async (campus, limit) => {
      const locations = await searchNearbyAccommodationLocations(
        {
          name: campus.name,
          locality: campus.location,
          latitude: campus.latitude,
          longitude: campus.longitude,
        },
        Math.max(5, limit + 2)
      );
      const properties = [];
      for (const location of locations) {
        if (properties.length >= limit) break;
        const distanceFromCampus = await calculateRouteDistanceBetweenCoordinates(
          location,
          campus
        );
        if (distanceFromCampus <= 10) {
          properties.push({ ...location, distanceFromCampus });
        }
      }
      return properties;
    },
    createDemoLandlord: async (campus, email) => {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      const user = await prisma.user.create({
        data: {
          name: `Demo Landlord - ${campus.name}`,
          email,
          passwordHash,
          role: UserRole.LANDLORD,
          isVerified: true,
          isActive: false,
        },
        select: { id: true },
      });
      return user.id;
    },
    createDemoListing: async (data) => {
      await prisma.listing.create({
        data: {
          ownerId: data.ownerId,
          campusId: data.campusId,
          title: data.title,
          description: data.description,
          accommodationType: AccommodationType.ROOM,
          pricePerMonth: 3500 + data.propertyNumber * 250,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          distanceFromCampus: data.distanceFromCampus,
          totalRooms: 1,
          availableRooms: 1,
          amenities: [],
          availabilityStatus: data.availabilityStatus,
          approvalStatus: data.approvalStatus,
        },
      });
    },
  }, dryRun);

  const totals = summary.reduce(
    (total, campus) => ({
      existing: total.existing + campus.existing,
      created: total.created + campus.created,
      wouldCreate: total.wouldCreate + campus.wouldCreate,
      unresolved: total.unresolved + (campus.unresolved ? 1 : 0),
    }),
    { existing: 0, created: 0, wouldCreate: 0, unresolved: 0 }
  );
  console.log(
    `${dryRun ? 'Dry run' : 'Import'} complete: ${totals.created} listings created, ` +
    `${totals.wouldCreate} listings ready to create, ${totals.existing} already present, ` +
    `${totals.unresolved} campuses without three verified nearby locations.`
  );
  for (const campus of summary.filter((item) => item.unresolved)) {
    console.log(
      `Not imported (${campus.available} of 3 verified nearby addresses found): ${campus.campus}`
    );
  }
  if (dryRun) console.log('No data was written. Rerun with --apply to import verified demo records.');
}

main()
  .catch((error: unknown) => {
    console.error('Demo landlord/property import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
